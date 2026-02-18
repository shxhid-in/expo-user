import * as React from 'react';
import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import { CartItem, ChatMessage, MarketData, OrderHistoryItem, OrderStage, UserData } from '../types';
import { formatTime } from '../utils/formatting';
import * as storage from '../services/storage';

// --- State Shape ---
interface AppState {
    user: UserData | null;
    isAuthenticated: boolean;
    cart: CartItem[];
    messages: ChatMessage[];
    marketData: MarketData | null;
    orderHistory: OrderHistoryItem[];
    isLoading: boolean;
    isDarkMode: boolean;
    brandColor: string;
    currentLocation: string;
    currentLocationLabel: string;
    // BezgoFresh: Single Vendor Rule & Order Lifecycle
    activeVendorId: string | null;
    activeVendorName: string | null;
    activeVendorImage: string | null;
    activeOrderStage: OrderStage;
}

const initialState: AppState = {
    user: null,
    isAuthenticated: false,
    cart: [],
    messages: [],
    marketData: null,
    orderHistory: [],
    isLoading: false,
    isDarkMode: false,
    brandColor: 'teal',
    currentLocation: 'Pkd, bezgo HQ near Shadhi Mahal',
    currentLocationLabel: 'Pkd',
    activeVendorId: null,
    activeVendorName: null,
    activeVendorImage: null,
    activeOrderStage: 'idle',
};

// --- Actions ---
type Action =
    | { type: 'SET_USER'; payload: UserData }
    | { type: 'LOGOUT' }
    | { type: 'SET_MARKET_DATA'; payload: MarketData }
    | { type: 'ADD_TO_CART'; payload: CartItem }
    | { type: 'REMOVE_FROM_CART'; payload: { id: string; vendor: string; weight?: string } }
    | { type: 'CLEAR_CART' }
    | { type: 'SET_CART'; payload: CartItem[] }
    | { type: 'ADD_MESSAGE'; payload: ChatMessage }
    | { type: 'ADD_MESSAGES'; payload: ChatMessage[] }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'ADD_ORDER'; payload: OrderHistoryItem }
    | { type: 'CANCEL_ORDER'; payload: string }
    | { type: 'SET_LOCATION'; payload: { location: string; label: string } }
    | { type: 'SET_THEME'; payload: { isDark?: boolean; brandColor?: string } }
    | { type: 'RESTORE_STATE'; payload: Partial<AppState> }
    | { type: 'SET_ORDER_STAGE'; payload: OrderStage }
    | { type: 'SET_ACTIVE_VENDOR'; payload: { vendorId: string; vendorName: string; vendorImage?: string } | null }
    | { type: 'CLEAR_ORDER_MESSAGES' }
    | { type: 'CLEAR_MESSAGES' };

function reducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case 'CLEAR_MESSAGES':
            return { ...state, messages: [] };
        case 'SET_USER':
            return { ...state, user: action.payload, isAuthenticated: true };
        case 'LOGOUT':
            return { ...initialState };
        case 'SET_MARKET_DATA':
            return { ...state, marketData: action.payload };
        case 'ADD_TO_CART': {
            // --- SINGLE VENDOR RULE ---
            // If there's an active vendor and the new item is from a different vendor, block it.
            const newItemVendorId = action.payload.vendorId;
            if (state.activeVendorId && newItemVendorId !== state.activeVendorId) {
                // This should be caught before dispatch, but as a safety net:
                console.warn('[SingleVendorRule] Blocked: tried to add item from different vendor.');
                return state; // Silently reject
            }

            const existing = state.cart.findIndex(
                (item) =>
                    item.id === action.payload.id &&
                    item.vendor === action.payload.vendor &&
                    item.weight === action.payload.weight
            );
            if (existing >= 0) {
                const newCart = [...state.cart];
                newCart[existing] = { ...newCart[existing], qty: newCart[existing].qty + action.payload.qty };
                return {
                    ...state,
                    cart: newCart,
                    activeVendorId: newItemVendorId,
                    activeVendorName: action.payload.vendor,
                    activeVendorImage: action.payload.vendorImage || state.activeVendorImage,
                };
            }
            return {
                ...state,
                cart: [...state.cart, action.payload],
                activeVendorId: newItemVendorId,
                activeVendorName: action.payload.vendor,
                activeVendorImage: action.payload.vendorImage || state.activeVendorImage,
            };
        }
        case 'REMOVE_FROM_CART': {
            const newCart = state.cart.filter(
                (item) =>
                    !(
                        item.id === action.payload.id &&
                        item.vendor === action.payload.vendor &&
                        (!action.payload.weight || item.weight === action.payload.weight)
                    )
            );
            return {
                ...state,
                cart: newCart,
                activeVendorId: newCart.length === 0 ? null : state.activeVendorId,
                activeVendorName: newCart.length === 0 ? null : state.activeVendorName,
                activeVendorImage: newCart.length === 0 ? null : state.activeVendorImage,
            };
        }
        case 'CLEAR_CART':
            return { ...state, cart: [], activeVendorId: null, activeVendorName: null, activeVendorImage: null, activeOrderStage: 'idle' };
        case 'SET_CART':
            return { ...state, cart: action.payload };
        case 'ADD_MESSAGE':
            return { ...state, messages: [...state.messages, action.payload] };
        case 'ADD_MESSAGES':
            return { ...state, messages: [...state.messages, ...action.payload] };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'ADD_ORDER': {
            return { ...state, orderHistory: [action.payload, ...state.orderHistory] };
        }
        case 'CANCEL_ORDER': {
            const updated = state.orderHistory.map((o) =>
                o.id === action.payload ? { ...o, status: 'cancelled' as const } : o
            );
            return { ...state, orderHistory: updated };
        }
        case 'SET_LOCATION':
            return { ...state, currentLocation: action.payload.location, currentLocationLabel: action.payload.label };
        case 'SET_THEME':
            return {
                ...state,
                isDarkMode: action.payload.isDark ?? state.isDarkMode,
                brandColor: action.payload.brandColor ?? state.brandColor,
            };
        case 'RESTORE_STATE':
            return { ...state, ...action.payload };
        case 'SET_ORDER_STAGE':
            return { ...state, activeOrderStage: action.payload };
        case 'SET_ACTIVE_VENDOR':
            if (action.payload === null) {
                return { ...state, activeVendorId: null, activeVendorName: null, activeVendorImage: null };
            }
            return { ...state, activeVendorId: action.payload.vendorId, activeVendorName: action.payload.vendorName, activeVendorImage: action.payload.vendorImage || null };
        case 'CLEAR_ORDER_MESSAGES': {
            const hideTypes = ['checking_availability', 'order_summary', 'contacting_vendor'];
            return {
                ...state,
                messages: state.messages.filter(m => !hideTypes.includes(m.type || ''))
            };
        }
        default:
            return state;
    }
}

// --- Context ---
interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Persist cart changes
    useEffect(() => {
        if (state.cart.length > 0) {
            storage.saveCart(state.cart);
        }
    }, [state.cart]);

    // Persist user changes
    useEffect(() => {
        if (state.user) {
            storage.saveUser(state.user);
        }
    }, [state.user]);

    // Persist orders
    useEffect(() => {
        if (state.orderHistory.length > 0) {
            storage.saveOrders(state.orderHistory);
        }
    }, [state.orderHistory]);

    return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppState() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppState must be used within AppProvider');
    }
    return context;
}

// Helper to create a unique message ID
export function createMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to create a chat message
export function createMessage(
    text: string,
    sender: 'user' | 'bot' | 'system',
    type?: ChatMessage['type'],
    data?: any
): ChatMessage {
    return {
        id: createMessageId(),
        text,
        sender,
        timestamp: formatTime(),
        type: type || 'text',
        data,
    };
}
