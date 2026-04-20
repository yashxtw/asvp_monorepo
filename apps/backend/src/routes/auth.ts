import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import path from "path";
import dotenv from "dotenv";
import { db } from "../db/client";
import { ensureCustomerAlertsSchedule } from "../lib/alertsScheduler";
import { requireAuth } from "../middleware/requireAuth";
import { signJWT } from "../auth/jwt";
import { getAuthCookieOptions } from "../auth/cookies";
import {
    createResetToken,
    hashPassword,
    hashResetToken,
    normalizeEmail,
    validatePassword,
    verifyPassword,
} from "../auth/password";
import { resend } from "../lib/resend";

dotenv.config({
    path: path.resolve(__dirname, "../../../../.env"),
});

const router = Router();

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function isEmailAllowed(email: string) {
    const result = await db.query(
        `
        SELECT id
        FROM allowed_emails
        WHERE email = $1
        AND is_active = true
        LIMIT 1
        `,
        [email]
    );

    return result.rows.length > 0;
}

function getResetPasswordUrl(token: string) {
    return `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
}

function getVerifyEmailUrl(token: string) {
    return `${process.env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;
}

async function sendResetPasswordEmail(email: string, token: string) {
    const resetUrl = getResetPasswordUrl(token);

    await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: email,
        subject: "Reset your VerityAI password",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #171717;">
                <h2>Reset your password</h2>
                <p>We received a request to reset your VerityAI password.</p>
                <p>
                    Click the button below to choose a new password:
                </p>
                <p style="margin: 24px 0;">
                    <a
                        href="${resetUrl}"
                        style="display:inline-block;background:#171717;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600;"
                    >
                        Reset Password
                    </a>
                </p>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <p>This link expires in 1 hour.</p>
            </div>
        `,
    });
}

async function sendVerificationEmail(email: string, token: string) {
    const verifyUrl = getVerifyEmailUrl(token);

    await resend.emails.send({
        from: process.env.FROM_EMAIL!,
        to: email,
        subject: "Verify your VerityAI email",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #171717;">
                <h2>Verify your email</h2>
                <p>Thanks for signing up for VerityAI.</p>
                <p>
                    Click the button below to verify your email and activate your account:
                </p>
                <p style="margin: 24px 0;">
                    <a
                        href="${verifyUrl}"
                        style="display:inline-block;background:#171717;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:600;"
                    >
                        Verify Email
                    </a>
                </p>
                <p>If you didn't create this account, you can safely ignore this email.</p>
                <p>This link expires in 24 hours.</p>
            </div>
        `,
    });
}

async function issueEmailVerification(userId: string, email: string) {
    const token = createResetToken();
    const tokenHash = hashResetToken(token);

    await db.query(
        `
        UPDATE users
        SET email_verification_token_hash = $2,
            email_verification_expires_at = now() + interval '24 hours'
        WHERE id = $1
        `,
        [userId, tokenHash]
    );

    await sendVerificationEmail(email, token);
}

function setBackendSessionCookie(res: any, token: string) {
    res.cookie("auth_token", token, getAuthCookieOptions());
}

router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: "/signin",
    }),
    async (req, res) => {
        const user = req.user as any;
        const token = signJWT(user);
        const email = normalizeEmail(user.email);

        const isAllowed = await isEmailAllowed(email);
        if (!isAllowed) {
            return res.redirect(`${process.env.FRONTEND_URL}/no-access`);
        }

        ensureCustomerAlertsSchedule(user.customer_id).catch((error) => {
            console.error("Failed to ensure alerts schedule for customer:", error);
        });

        setBackendSessionCookie(res, token);
        res.redirect(`${process.env.FRONTEND_URL}/api/auth/callback?token=${token}`);
    }
);

router.post("/signup", async (req, res) => {
    const {
        name,
        workspaceName,
        email,
        password,
        confirmPassword,
    } = req.body as {
        name?: string;
        workspaceName?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    };

    const normalizedEmail = normalizeEmail(email || "");
    const trimmedName = name?.trim() || "";
    const trimmedWorkspaceName = workspaceName?.trim() || "";

    if (!trimmedName || !trimmedWorkspaceName || !normalizedEmail || !password || !confirmPassword) {
        return res.status(400).json({ error: "All fields are required" });
    }

    if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({ error: "Please enter a valid email address" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        return res.status(400).json({
            error: "Password must be at least 8 characters and include uppercase, lowercase, and a number",
        });
    }

    const isAllowed = await isEmailAllowed(normalizedEmail);
    if (!isAllowed) {
        return res.status(403).json({ error: "This email does not currently have access" });
    }

    try {
        const existingUserRes = await db.query(
            `
            SELECT id
            FROM users
            WHERE email = $1
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (existingUserRes.rows.length > 0) {
            return res.status(409).json({ error: "An account with this email already exists" });
        }

        const existingCustomerRes = await db.query(
            `
            SELECT id
            FROM customers
            WHERE LOWER(name) = LOWER($1)
            LIMIT 1
            `,
            [trimmedWorkspaceName]
        );

        if (existingCustomerRes.rows.length > 0) {
            return res.status(409).json({
                error: "A workspace with this name already exists. Please choose another name.",
            });
        }

        const customerRes = await db.query(
            `
            INSERT INTO customers (name)
            VALUES ($1)
            RETURNING id
            `,
            [trimmedWorkspaceName]
        );

        const customerId = customerRes.rows[0].id;
        const passwordHash = await hashPassword(password);

        const userRes = await db.query(
            `
            INSERT INTO users (customer_id, email, name, provider, password_hash, email_verified, created_at, last_login_at)
            VALUES ($1, $2, $3, 'email', $4, false, now(), NULL)
            RETURNING id, customer_id, email, email_verified
            `,
            [customerId, normalizedEmail, trimmedName, passwordHash]
        );

        const user = userRes.rows[0];

        await issueEmailVerification(user.id, normalizedEmail);

        return res.status(201).json({
            success: true,
            requiresEmailVerification: true,
            email: user.email,
            message: "Verify your email to activate your account.",
        });
    } catch (error) {
        console.error("Signup failed:", error);
        return res.status(500).json({ error: "Failed to create account" });
    }
});

router.post("/signin", async (req, res) => {
    const { email, password } = req.body as {
        email?: string;
        password?: string;
    };

    const normalizedEmail = normalizeEmail(email || "");

    if (!normalizedEmail || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({ error: "Please enter a valid email address" });
    }

    try {
        const userRes = await db.query(
            `
            SELECT id, customer_id, email, password_hash, provider
                , email_verified
            FROM users
            WHERE email = $1
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (userRes.rows.length === 0) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const user = userRes.rows[0];

        if (!user.password_hash) {
            return res.status(400).json({
                error: "This account does not have a password yet. Use Google sign-in or reset your password to set one.",
            });
        }

        const isAllowed = await isEmailAllowed(normalizedEmail);
        if (!isAllowed) {
            return res.status(403).json({ error: "This email does not currently have access" });
        }

        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        if (!user.email_verified) {
            return res.status(403).json({
                error: "Please verify your email before signing in.",
                code: "email_not_verified",
                email: user.email,
            });
        }

        await db.query(
            `
            UPDATE users
            SET last_login_at = now()
            WHERE id = $1
            `,
            [user.id]
        );

        const token = signJWT(user);

        ensureCustomerAlertsSchedule(user.customer_id).catch((error) => {
            console.error("Failed to ensure alerts schedule for customer:", error);
        });

        setBackendSessionCookie(res, token);

        return res.json({
            token,
            user: {
                id: user.id,
                customer_id: user.customer_id,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Signin failed:", error);
        return res.status(500).json({ error: "Failed to sign in" });
    }
});

router.post("/forgot-password", async (req, res) => {
    const { email } = req.body as { email?: string };
    const normalizedEmail = normalizeEmail(email || "");

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
        return res.status(400).json({ error: "Please enter a valid email address" });
    }

    try {
        const userRes = await db.query(
            `
            SELECT id, email, email_verified
            FROM users
            WHERE email = $1
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (userRes.rows.length > 0) {
            if (!userRes.rows[0].email_verified) {
                await issueEmailVerification(userRes.rows[0].id, normalizedEmail);
            } else {
                const token = createResetToken();
                const tokenHash = hashResetToken(token);

                await db.query(
                    `
                    UPDATE users
                    SET password_reset_token_hash = $2,
                        password_reset_token_expires_at = now() + interval '1 hour'
                    WHERE id = $1
                    `,
                    [userRes.rows[0].id, tokenHash]
                );

                await sendResetPasswordEmail(normalizedEmail, token);
            }
        }

        return res.json({
            success: true,
            message: "If an account exists for this email, an email has been sent.",
        });
    } catch (error) {
        console.error("Forgot password failed:", error);
        return res.status(500).json({ error: "Failed to process forgot password request" });
    }
});

router.post("/resend-verification", async (req, res) => {
    const { email } = req.body as { email?: string };
    const normalizedEmail = normalizeEmail(email || "");

    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
        return res.status(400).json({ error: "Please enter a valid email address" });
    }

    try {
        const userRes = await db.query(
            `
            SELECT id, email_verified
            FROM users
            WHERE email = $1
            LIMIT 1
            `,
            [normalizedEmail]
        );

        if (userRes.rows.length > 0 && !userRes.rows[0].email_verified) {
            await issueEmailVerification(userRes.rows[0].id, normalizedEmail);
        }

        return res.json({
            success: true,
            message: "If an unverified account exists for this email, a verification link has been sent.",
        });
    } catch (error) {
        console.error("Resend verification failed:", error);
        return res.status(500).json({ error: "Failed to resend verification email" });
    }
});

router.get("/verify-email/validate", async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";

    if (!token) {
        return res.status(400).json({ error: "Verification token is required" });
    }

    try {
        const tokenHash = hashResetToken(token);
        const result = await db.query(
            `
            SELECT id
            FROM users
            WHERE email_verification_token_hash = $1
                AND email_verification_expires_at > now()
            LIMIT 1
            `,
            [tokenHash]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "This verification link is invalid or has expired" });
        }

        return res.json({ valid: true });
    } catch (error) {
        console.error("Email verification token validation failed:", error);
        return res.status(500).json({ error: "Failed to validate verification link" });
    }
});

router.post("/verify-email", async (req, res) => {
    const { token } = req.body as { token?: string };

    if (!token) {
        return res.status(400).json({ error: "Verification token is required" });
    }

    try {
        const tokenHash = hashResetToken(token);
        const userRes = await db.query(
            `
            SELECT id, customer_id, email, email_verified
            FROM users
            WHERE email_verification_token_hash = $1
                AND email_verification_expires_at > now()
            LIMIT 1
            `,
            [tokenHash]
        );

        if (userRes.rows.length === 0) {
            return res.status(400).json({ error: "This verification link is invalid or has expired" });
        }

        const user = userRes.rows[0];

        await db.query(
            `
            UPDATE users
            SET email_verified = true,
                email_verified_at = now(),
                email_verification_token_hash = NULL,
                email_verification_expires_at = NULL,
                last_login_at = now()
            WHERE id = $1
            `,
            [user.id]
        );

        ensureCustomerAlertsSchedule(user.customer_id).catch((error) => {
            console.error("Failed to ensure alerts schedule for customer:", error);
        });

        const jwtToken = signJWT({
            ...user,
            email_verified: true,
        });
        setBackendSessionCookie(res, jwtToken);

        return res.json({
            token: jwtToken,
            user: {
                id: user.id,
                customer_id: user.customer_id,
                email: user.email,
                email_verified: true,
            },
        });
    } catch (error) {
        console.error("Email verification failed:", error);
        return res.status(500).json({ error: "Failed to verify email" });
    }
});

router.get("/reset-password/validate", async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";

    if (!token) {
        return res.status(400).json({ error: "Reset token is required" });
    }

    try {
        const tokenHash = hashResetToken(token);
        const result = await db.query(
            `
            SELECT id
            FROM users
            WHERE password_reset_token_hash = $1
                AND password_reset_token_expires_at > now()
            LIMIT 1
            `,
            [tokenHash]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: "This reset link is invalid or has expired" });
        }

        return res.json({ valid: true });
    } catch (error) {
        console.error("Reset token validation failed:", error);
        return res.status(500).json({ error: "Failed to validate reset link" });
    }
});

router.post("/reset-password", async (req, res) => {
    const { token, password, confirmPassword } = req.body as {
        token?: string;
        password?: string;
        confirmPassword?: string;
    };

    if (!token || !password || !confirmPassword) {
        return res.status(400).json({ error: "Token, password, and confirmation are required" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match" });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        return res.status(400).json({
            error: "Password must be at least 8 characters and include uppercase, lowercase, and a number",
        });
    }

    try {
        const tokenHash = hashResetToken(token);
        const userRes = await db.query(
            `
            SELECT id, customer_id, email
                , email_verified
            FROM users
            WHERE password_reset_token_hash = $1
                AND password_reset_token_expires_at > now()
            LIMIT 1
            `,
            [tokenHash]
        );

        if (userRes.rows.length === 0) {
            return res.status(400).json({ error: "This reset link is invalid or has expired" });
        }

        const user = userRes.rows[0];
        const passwordHash = await hashPassword(password);

        await db.query(
            `
            UPDATE users
            SET password_hash = $2,
                password_reset_token_hash = NULL,
                password_reset_token_expires_at = NULL,
                last_login_at = CASE
                    WHEN email_verified THEN now()
                    ELSE last_login_at
                END
            WHERE id = $1
            `,
            [user.id, passwordHash]
        );

        if (!user.email_verified) {
            return res.json({
                success: true,
                requiresEmailVerification: true,
                email: user.email,
                message: "Password updated. Verify your email before signing in.",
            });
        }

        const jwtToken = signJWT(user);
        setBackendSessionCookie(res, jwtToken);

        return res.json({
            token: jwtToken,
            user: {
                id: user.id,
                customer_id: user.customer_id,
                email: user.email,
                email_verified: user.email_verified,
            },
        });
    } catch (error) {
        console.error("Reset password failed:", error);
        return res.status(500).json({ error: "Failed to reset password" });
    }
});

router.get("/me", (req, res) => {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: "unauthorized" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        res.json(decoded);
    } catch {
        res.status(401).json({ error: "invalid token" });
    }
});

router.get("/customer-users", requireAuth, async (req, res) => {
    try {
        const result = await db.query(
            `
            SELECT
                id,
                email,
                name,
                provider,
                created_at
            FROM users
            WHERE customer_id = $1
            ORDER BY created_at ASC, email ASC
            `,
            [req.user!.customer_id]
        );

        res.json({
            users: result.rows.map((row) => ({
                id: row.id,
                email: row.email,
                name: row.name,
                provider: row.provider,
                created_at: row.created_at,
                is_current_user: row.id === req.user!.user_id,
            })),
        });
    } catch (error) {
        console.error("Failed to load customer users:", error);
        res.status(500).json({ error: "Failed to load customer users" });
    }
});

// Logout
router.post("/logout", (_req, res) => {
    res.clearCookie("auth_token", getAuthCookieOptions());
    res.json({ success: true });
});

export default router;
