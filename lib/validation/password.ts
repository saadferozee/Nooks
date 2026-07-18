/**
 * Password strength validation — reusable across Signup, and later,
 * "Change Password" in profile settings.
 *
 * Rules (matches what the user asked for):
 * - at least one lowercase letter (a-z)
 * - at least one uppercase letter (A-Z)
 * - at least one digit (0-9)
 * - at least one special character (@ # . $ etc.)
 * - minimum 8 characters
 */

export type PasswordCheck = {
    label: string;
    passed: boolean;
};

export function getPasswordChecks(password: string): PasswordCheck[] {
    return [
        { label: "At least 8 characters", passed: password.length >= 8 },
        { label: "One lowercase letter (a-z)", passed: /[a-z]/.test(password) },
        { label: "One uppercase letter (A-Z)", passed: /[A-Z]/.test(password) },
        { label: "One number (0-9)", passed: /[0-9]/.test(password) },
        {
            label: "One special character (@#$.etc)",
            passed: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        },
    ];
}

/** Returns true only when every rule passes — use this to enable the submit button / turn the field green. */
export function isPasswordValid(password: string): boolean {
    return getPasswordChecks(password).every((check) => check.passed);
}
