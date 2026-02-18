// Utility functions from CODE_REUSABILITY.md — copied directly from web app

import { CartItem } from '../types';

export function calculateCartTotal(cart: CartItem[]): number {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function calculateItemCount(cart: CartItem[]): number {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

export function groupCartByVendor(cart: CartItem[]): Record<string, CartItem[]> {
    return cart.reduce((groups: Record<string, CartItem[]>, item) => {
        const vendor = item.vendor;
        if (!groups[vendor]) groups[vendor] = [];
        groups[vendor].push(item);
        return groups;
    }, {});
}

export function getUniqueVendors(cart: CartItem[]): string[] {
    return Array.from(new Set(cart.map((item) => item.vendor)));
}

export function generateOrderId(): string {
    return 'BZG' + Math.floor(100000 + Math.random() * 900000);
}
