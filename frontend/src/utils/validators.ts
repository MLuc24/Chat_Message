// Validation utility functions

export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function isStrongPassword(password: string): boolean {
    // At least 6 characters, contains letter and number
    return password.length >= 6 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}

export function validateLoginForm(email: string, password: string): string | null {
    if (!email) return 'Email is required';
    if (!isValidEmail(email)) return 'Invalid email format';
    if (!password) return 'Password is required';
    return null;
}

export function validateRegisterForm(
    name: string,
    email: string,
    password: string
): string | null {
    if (!name || name.trim().length < 2) return 'Name must be at least 2 characters';
    if (!email) return 'Email is required';
    if (!isValidEmail(email)) return 'Invalid email format';
    if (!password) return 'Password is required';
    if (!isStrongPassword(password)) {
        return 'Password must be at least 6 characters with letters and numbers';
    }
    return null;
}
