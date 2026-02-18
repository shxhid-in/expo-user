import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    USER_DATA: '@bezgofresh_user',
    CART: '@bezgofresh_cart',
    ORDER_HISTORY: '@bezgofresh_orders',
    THEME: '@bezgofresh_theme',
    ONBOARDED: '@bezgofresh_onboarded',
} as const;

export async function saveUser(data: any): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_DATA, JSON.stringify(data));
}

export async function getUser(): Promise<any | null> {
    const data = await AsyncStorage.getItem(KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
}

export async function saveCart(cart: any[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.CART, JSON.stringify(cart));
}

export async function getCart(): Promise<any[]> {
    const data = await AsyncStorage.getItem(KEYS.CART);
    return data ? JSON.parse(data) : [];
}

export async function saveOrders(orders: any[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.ORDER_HISTORY, JSON.stringify(orders));
}

export async function getOrders(): Promise<any[]> {
    const data = await AsyncStorage.getItem(KEYS.ORDER_HISTORY);
    return data ? JSON.parse(data) : [];
}

export async function setOnboarded(): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
}

export async function isOnboarded(): Promise<boolean> {
    const v = await AsyncStorage.getItem(KEYS.ONBOARDED);
    return v === 'true';
}

export async function clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
}
