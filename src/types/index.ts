// Navigation types based on NAVIGATION_STRUCTURE.md

export type AuthStackParamList = {
    Splash: undefined;
    SignIn: undefined;
    OTP: { phone: string };
    Name: { phone: string };
    Transition: { phone: string; firstName: string; lastName: string };
};

export type MainStackParamList = {
    Chat: { upiPaymentSuccess?: boolean } | undefined;
    Profile: undefined;
    Location: undefined;
    UPIPayment: { total: number };
    OrderPlaced: { orderId: string; vendorCount: number };
};

export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
};

// Data types from API_BACKEND.md
export interface Vendor {
    id: string;
    name: string;
    specialty: string;
    rating: number;
    distance: string;
    image: string;
}

export interface Product {
    id: string;
    name: string;
    category: string;
    prices: Record<string, number>;
    image: string;
}

export interface MarketData {
    vendors: Vendor[];
    products: Product[];
}

export interface CartItem {
    id: string;
    name: string;
    price: number;
    qty: number;
    weight: string;
    vendor: string;
    vendorId: string;
    vendorImage: string;
    image: string;
}

export interface OrderHistoryItem {
    id: string;
    cart: CartItem[];
    total: number;
    vendors: string[];
    timestamp: string;
    status: 'active' | 'delivered' | 'cancelled';
}

// --- Order Lifecycle Stages ---
export type OrderStage =
    | 'idle'
    | 'checking_availability'
    | 'order_summary'
    | 'contacting_vendor'
    | 'order_confirmed'
    | 'assigning_partner'
    | 'partner_assigned'
    | 'out_for_delivery'
    | 'delivered';

// Chat message types
export type MessageSender = 'user' | 'bot' | 'system';

export interface ChatMessage {
    id: string;
    text: string;
    sender: MessageSender;
    timestamp: string;
    type?: 'text' | 'category_grid' | 'vendor_grid' | 'order_summary' | 'delivery_tracker' | 'order_card'
    | 'checking_availability' | 'contacting_vendor' | 'live_tracker' | 'post_delivery'
    | 'assigning_partner' | 'partner_assigned' | 'order_tracking' | 'partner_assignment_flow' | 'order_confirmed_detail';
    data?: any;
}

// Chat API Response types from API_BACKEND.md
export interface ChatResponseText {
    type: 'text';
    content: string;
    animation_id?: string;
}

export interface ChatResponseSmartReply {
    type: 'smart_reply';
    content: string;
    animation_id?: string;
}

export interface ChatResponseVendorDiscovery {
    type: 'vendor_discovery';
    categoryName: string;
    animation_id?: string;
    vendors: Vendor[];
}

export interface OrderItem {
    productName: string;
    productId: string;
    weight: string;
    vendorName: string;
    vendorId: string;
    vendorImage?: string;
    productPrice: number;
    productImage: string;
}

export interface ChatResponseOrderSummary {
    type: 'order_summary';
    animation_id?: string;
    orderItems?: OrderItem[];
    unmatchedItems?: (string | any)[];
    cartSummary?: boolean;
    content?: string;
    items?: CartItem[];
    total?: number;
    freeze_cart?: boolean;
}

export interface ChatResponseConfirmation {
    type: 'confirmation';
    content: string;
    animation_id?: string;
}

export interface ChatResponsePendingInventory {
    type: 'pending_inventory';
    animation_id?: string;
    orderItems: OrderItem[];
    unmatchedItems?: (string | any)[];
    content?: string;
}

export type ChatResponse =
    | ChatResponseText
    | ChatResponseSmartReply
    | ChatResponseVendorDiscovery
    | ChatResponseOrderSummary
    | ChatResponseConfirmation
    | ChatResponsePendingInventory;

// User data
export interface UserData {
    phone: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    location?: string;
    locationLabel?: string;
}

// UPI Payment
export interface UPIApp {
    id: string;
    name: string;
    icon: any; // require() image
}

// Character/Avatar
export interface Character {
    id: string;
    name: string;
    color: string;
}
