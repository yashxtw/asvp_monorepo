import crypto from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(crypto.scrypt);

export function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

const PERSONAL_EMAIL_DOMAINS = new Set([
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "icloud.com",
    "aol.com",
    "proton.me",
    "protonmail.com",
]);

export function getEmailDomain(email: string) {
    const normalized = normalizeEmail(email);
    return normalized.split("@")[1] || "";
}

export function isBusinessEmail(email: string) {
    const domain = getEmailDomain(email);
    if (!domain) {
        return false;
    }

    return !PERSONAL_EMAIL_DOMAINS.has(domain);
}

export function validatePassword(password: string) {
    const checks = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
    };

    return {
        checks,
        isValid: Object.values(checks).every(Boolean),
    };
}

export async function hashPassword(password: string) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derived = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
    const [salt, storedHash] = passwordHash.split(":");
    if (!salt || !storedHash) {
        return false;
    }

    const derived = (await scryptAsync(password, salt, 64)) as Buffer;
    const stored = Buffer.from(storedHash, "hex");

    if (stored.length !== derived.length) {
        return false;
    }

    return crypto.timingSafeEqual(stored, derived);
}

export function createResetToken() {
    return crypto.randomBytes(32).toString("hex");
}

export function hashResetToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
}
