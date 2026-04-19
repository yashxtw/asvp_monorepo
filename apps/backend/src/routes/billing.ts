import axios from "axios";
import { Router } from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/requireAuth";
import { db } from "../db/client";
import { PLANS, PlanKey } from "../billing/plans";
import path from "path";
import dotenv from "dotenv";

dotenv.config({
    path: path.resolve(__dirname, "../../../../.env"),
});

const router = Router();

function createReferenceId(plan: Exclude<PlanKey, "free">) {
    return `pl_${plan}_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
}

router.post("/subscribe", requireAuth, async (req, res) => {
    const { plan } = req.body as { plan?: PlanKey };
    const customerId = req.user!.customer_id;

    if (!plan || !(plan in PLANS) || plan === "free") {
        return res.status(400).json({ error: "Invalid plan" });
    }

    const planConfig = PLANS[plan];

    try {
        const existingPendingLinkRes = await db.query(
            `
            SELECT razorpay_payment_link_id
            FROM customers
            WHERE id = $1
                AND billing_status = 'pending'
                AND razorpay_payment_link_id IS NOT NULL
            `,
            [customerId]
        );

        const existingPendingLinkId = existingPendingLinkRes.rows[0]?.razorpay_payment_link_id;

        if (existingPendingLinkId) {
            try {
                const existingLinkRes = await axios.get(
                    `https://api.razorpay.com/v1/payment_links/${existingPendingLinkId}`,
                    {
                        auth: {
                            username: process.env.RAZORPAY_KEY_ID!,
                            password: process.env.RAZORPAY_KEY_SECRET!,
                        },
                    }
                );

                const existingLink = existingLinkRes.data;
                if (existingLink.status === "created" && existingLink.short_url) {
                    return res.json({
                        payment_link_id: existingLink.id,
                        payment_url: existingLink.short_url,
                    });
                }
            } catch (error: any) {
                console.warn(
                    "Failed to fetch existing pending payment link:",
                    error?.response?.data || error?.message || error
                );
            }
        }

        const paymentLinkRes = await axios.post(
            "https://api.razorpay.com/v1/payment_links",
            {
                amount: planConfig.payment_amount,
                currency: "INR",
                description: `VerityAI ${plan} plan - 30 days access`,
                customer: {
                    email: req.user!.email,
                },
                notify: {
                    email: true,
                },
                reminder_enable: true,
                callback_url: `${process.env.FRONTEND_URL}/billing/success`,
                callback_method: "get",
                reference_id: createReferenceId(plan),
                notes: {
                    customer_id: customerId,
                    plan,
                    billing_model: "one_time_30_days",
                },
            },
            {
                auth: {
                    username: process.env.RAZORPAY_KEY_ID!,
                    password: process.env.RAZORPAY_KEY_SECRET!,
                },
            }
        );

        const paymentLink = paymentLinkRes.data;

        await db.query(
            `
            UPDATE customers
            SET razorpay_payment_link_id = $1,
                billing_status = 'pending'
            WHERE id = $2
            `,
            [paymentLink.id, customerId]
        );

        if (!paymentLink.short_url) {
            return res.status(500).json({
                error: "Payment link created but no payment URL was returned",
            });
        }

        res.json({
            payment_link_id: paymentLink.id,
            payment_url: paymentLink.short_url,
        });
    } catch (error: any) {
        const details =
            error?.response?.data?.error?.description ||
            error?.response?.data?.error?.reason ||
            error?.response?.data?.error ||
            error?.message;

        console.error("Failed to start subscription:", error?.response?.data || error);
        res.status(500).json({
            error: "Failed to start subscription",
            details: details || "Unknown Razorpay error",
        });
    }
});

export default router;
