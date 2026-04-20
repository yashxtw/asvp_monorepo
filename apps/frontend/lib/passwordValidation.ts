export function validateEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
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
