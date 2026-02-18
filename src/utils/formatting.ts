// Formatting utilities from CODE_REUSABILITY.md

export function formatCurrency(amount: number): string {
    return `₹${amount}`;
}

export function formatTime(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(): string {
    return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

export function maskPhone(phone: string): string {
    if (phone.length !== 10) return phone;
    return `+91 XXXXXX${phone.slice(-4)}`;
}
