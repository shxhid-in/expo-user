// Validation functions from CODE_REUSABILITY.md — copied directly

export function isValidPhone(phone: string): boolean {
    return phone.length === 10 && /^\d{10}$/.test(phone);
}

export function isValidName(name: string): boolean {
    return name.trim().length > 0 && /^[a-zA-Z\s-]+$/.test(name);
}

export function isValidOTP(otpArray: string[]): boolean {
    return otpArray.length === 6 && otpArray.every((digit) => digit !== '' && /^\d$/.test(digit));
}

export function isValidWeight(value: number): boolean {
    return value > 0;
}
