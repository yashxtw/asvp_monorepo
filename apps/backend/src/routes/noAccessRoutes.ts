import { Router } from "express";
import { db } from "../db/client";
import path from "path";
import dotenv from "dotenv";
import { resend } from "../lib/resend";

dotenv.config({
    path: path.resolve(__dirname, "../../../../.env"),
});

const router = Router();

async function notifyOwnerAboutAccessRequest({
    name,
    email,
    isWaitlisted,
}: {
    name: string;
    email: string;
    isWaitlisted: boolean;
}) {
    const ownerEmail = process.env.ACCESS_REQUEST_OWNER_EMAIL;

    if (!ownerEmail) {
        console.warn("ACCESS_REQUEST_OWNER_EMAIL is not configured. Skipping owner notification.");
        return;
    }

    const response = await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: ownerEmail,
        subject: "New VerityAI access request",
        replyTo: email,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #171717;">
                <h2>New access request</h2>
                <p>Someone requested access to VerityAI.</p>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Status:</strong> ${
                    isWaitlisted ? "Waitlisted" : "Pending review / slots available"
                }</p>
                <p>You can reply directly to this email to contact the requester.</p>
            </div>
        `,
    });

    if (response.error) {
        throw new Error(response.error.message || "Failed to send owner notification");
    }
}

router.get("/slots", async (_req, res) => {
    try {
        const result = await db.query(`SELECT COUNT(*) FROM allowed_emails WHERE is_active = true`);

        const activeCount = Number(result.rows[0].count);
        const maxSlots = Number(process.env.MAX_SLOTS || 10);
        const remainingSlots = Math.max(maxSlots - activeCount, 0);

        res.json({
            remainingSlots,
            isFull: remainingSlots === 0,
        });
    } catch {
        res.status(500).json({ error: "Server error" });
    }
});

router.post("/request-access", async (req, res) => {
    try {
        const { name, email } = req.body as { name?: string; email?: string };

        if (!name || !email) {
            return res.status(400).json({ error: "Missing fields" });
        }

        await db.query(
            `
            INSERT INTO allowed_emails (email, is_active)
            VALUES ($1, false)
            ON CONFLICT (email) DO NOTHING
            `,
            [email]
        );

        const countResult = await db.query(`SELECT COUNT(*) FROM allowed_emails WHERE is_active = true`);

        const activeCount = Number(countResult.rows[0].count);
        const maxSlots = Number(process.env.MAX_SLOTS || 10);

        let emailHtml = "";
        let isWaitlisted = false;

        if (activeCount >= maxSlots) {
            isWaitlisted = true;

            emailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>You're on the waitlist</h2>
                    <p>Hi ${name},</p>
                    <p>
                        Thanks for your interest in <strong>VerityAI</strong>.
                        We're currently operating in private beta with a limited number of early users.
                    </p>
                    <p>
                        All available slots are currently filled, but we've successfully added you to our priority waitlist.
                    </p>
                    <p>
                        The moment a slot becomes available, you'll receive an email from us with access details.
                    </p>
                    <p style="margin-top: 24px;">
                        We appreciate your patience. Exciting things are coming.
                    </p>
                    <p style="margin-top: 16px;">
                        - VerityAI Team
                    </p>
                </div>
            `;
        } else {
            emailHtml = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Thanks for requesting access</h2>
                    <p>Hi ${name},</p>
                    <p>
                        Thank you for your interest in <strong>VerityAI</strong>.
                        We're currently onboarding a limited number of early users as part of our private beta.
                    </p>
                    <p>
                        Our team will review your request and get back to you within <strong>24 hours</strong>.
                        You'll receive an email notification once your access has been approved.
                    </p>
                    <p style="margin-top: 24px;">
                        We're excited to have you on board.
                    </p>
                    <p style="margin-top: 16px;">
                        - VerityAI Team
                    </p>
                </div>
            `;
        }

        const emailResponse = await resend.emails.send({
            from: process.env.FROM_EMAIL!,
            to: email,
            subject: "VerityAI - Access Request Received",
            html: emailHtml,
        });

        if (emailResponse.error) {
            console.error(emailResponse.error);
            return res.status(500).json({ error: "Email failed" });
        }

        notifyOwnerAboutAccessRequest({
            name,
            email,
            isWaitlisted,
        }).catch((error) => {
            console.error("Failed to notify owner about access request:", error);
        });

        return res.status(200).json({
            success: true,
            waitlisted: isWaitlisted,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Server error" });
    }
});

export default router;
