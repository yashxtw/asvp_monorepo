import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "../db/client";
import path from "path";
import dotenv from "dotenv";
import { normalizeEmail } from "./password";

dotenv.config({
    path: path.resolve(__dirname, "../../../../.env"),
});

passport.use(
    new GoogleStrategy(
        {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!
        },
        async (_accessToken, _refreshToken, profile, done) => {
        try {
            const email = normalizeEmail(profile.emails?.[0].value || "");
            if (!email) return done(new Error("No email"));

            const existingUserResult = await db.query(
            `
            SELECT *
            FROM users
            WHERE provider_id = $1 OR email = $2
            ORDER BY CASE WHEN provider_id = $1 THEN 0 ELSE 1 END
            LIMIT 1
            `,
            [profile.id, email]
            );

            if (existingUserResult.rows.length > 0) {
            const existingUser = existingUserResult.rows[0];
            const linkedUserResult = await db.query(
                `
                UPDATE users
                SET email = $2,
                    name = $3,
                    provider_id = $4,
                    email_verified = true,
                    email_verified_at = COALESCE(email_verified_at, now()),
                    email_verification_token_hash = NULL,
                    email_verification_expires_at = NULL
                WHERE id = $1
                RETURNING *
                `,
                [existingUser.id, email, profile.displayName, profile.id]
            );

            return done(null, linkedUserResult.rows[0]);
            }

            // find or create customer
            const domain = email.split("@")[1];

            const customerResult = await db.query(
            `
            INSERT INTO customers (name)
            VALUES ($1)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
            `,
            [domain]
            );

            const customerId = customerResult.rows[0].id;

            const userResult = await db.query(
            `
            INSERT INTO users (email, name, provider, provider_id, customer_id, email_verified, email_verified_at)
            VALUES ($1, $2, 'google', $3, $4, true, now())
            RETURNING *
            `,
            [email, profile.displayName, profile.id, customerId]
            );

            return done(null, userResult.rows[0]);
        } catch (err) {
            done(err);
        }
        }
    )
);
