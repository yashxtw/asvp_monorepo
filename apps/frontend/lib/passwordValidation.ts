export function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
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

export function isBusinessEmail(email: string) {
    const normalized = email.trim().toLowerCase();
    const domain = normalized.split("@")[1] || "";

    if (!domain) {
        return false;
    }

    return !PERSONAL_EMAIL_DOMAINS.has(domain);
}

export function getPasswordChecks(password: string) {
    return {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
    };
}

export function isPasswordValid(password: string) {
    return Object.values(getPasswordChecks(password)).every(Boolean);
}
