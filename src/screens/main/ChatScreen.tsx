import * as React from 'react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    Dimensions,
    KeyboardAvoidingView,
    Keyboard,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableItem from '../../components/common/DraggableItem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList, ChatMessage, Vendor, CartItem } from '../../types';
import { useAppState, createMessage } from '../../store/AppContext';
import { Colors, Typography, Shadows, BorderRadius, Spacing } from '../../theme';
import { fetchMarketData, sendChatMessage, resolveImageUrl, resolveImageSource } from '../../services/api';
import { formatCurrency } from '../../utils/formatting';
import { generateOrderId, getUniqueVendors } from '../../utils/cartUtils';
import Svg, { Path, Circle } from 'react-native-svg';
import {
    CheckingAvailabilityCard,
    ContactingVendorCard,
    OrderSummaryCard,
    LiveTrackerCard,
    PostDeliveryCard,
    PartnerAssignmentFlowCard,
    OrderTrackingCard,
    OrderConfirmedDetailCard,
} from '../../components/common/OrderStageCard';

const { width } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<MainStackParamList, 'Chat'>;
    route: RouteProp<MainStackParamList, 'Chat'>;
};

// Category data with local images
const CATEGORIES = [
    { name: 'Fish & Seafood', key: 'seafood', image: require('../../../assets/Tiger prawns.png') },
    { name: 'Poultry', key: 'poultry', image: require('../../../assets/Chicekn curry cut.jpg') },
    { name: 'Mutton', key: 'mutton', image: require('../../../assets/Mutton Ribbs.jpg') },
    { name: 'Beef', key: 'beef', image: require('../../../assets/beef boneless.jpg') },
    { name: 'Fillets', key: 'fillets', image: require('../../../assets/salmon.jpg') },
    { name: 'Whole Chicken', key: 'whole_chicken', image: require('../../../assets/Whole chicken.jpg') },
];

export default function ChatScreen({ navigation, route }: Props) {
    const { state, dispatch } = useAppState();
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isVendorsExpanded, setIsVendorsExpanded] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cod' | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();

    // Keyboard event listeners for UI adjustments
    useEffect(() => {
        const showSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
        );
        const hideSub = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
            }
        );
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // Drag & Drop State
    const [tags, setTags] = useState<any[]>([]);
    const isDragging = useSharedValue(false);
    const dragX = useSharedValue(0);
    const dragY = useSharedValue(0);
    const [draggedItem, setDraggedItem] = useState<any>(null);

    const animatedDropZoneStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: withSpring(isDragging.value ? 1.05 : 1) }] as any,
        };
    });

    const dragPreviewStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateX: dragX.value },
                { translateY: dragY.value },
                { scale: withSpring(isDragging.value ? 1.1 : 1) }
            ] as any,
            opacity: withSpring(isDragging.value ? 1 : 0),
        };
    });

    const handleDrop = useCallback((item: any) => {
        // Tag the vendor
        setTags([item]);
        setDraggedItem(null);
        isDragging.value = false;
    }, []);

    const removeTag = useCallback((index: number) => {
        setTags(prev => prev.filter((_, i) => i !== index));
    }, []);

    // Load market data on mount
    useEffect(() => {
        loadMarketData();
    }, []);

    // Add welcome message on first load
    useEffect(() => {
        if (state.messages.length === 0 && state.user) {
            const greeting = createMessage(
                `Hello ${state.user.firstName}!\n\nI'm Ezer, your personal fresh shopping assistant. I can help you find the freshest meat, seafood, and more from local vendors.\n\nTry browsing by category below, or just tell me what you need!`,
                'bot'
            );
            dispatch({ type: 'ADD_MESSAGE', payload: greeting });
        }
    }, [state.user]);

    // Handle return from successful UPI payment
    useEffect(() => {
        if (route.params?.upiPaymentSuccess) {
            startOrderTracking();
            // Clear the param so it doesn't trigger again
            navigation.setParams({ upiPaymentSuccess: undefined });
        }
    }, [route.params?.upiPaymentSuccess]);

    const loadMarketData = async () => {
        try {
            const data = await fetchMarketData();
            dispatch({ type: 'SET_MARKET_DATA', payload: data });
        } catch (e) {
            console.warn('Failed to load market data:', e);
        }
    };

    const handleSend = useCallback(async () => {
        const text = message.trim();
        if (!text && tags.length === 0) return;

        setMessage('');
        const currentTags = [...tags];
        setTags([]);

        // Add user message
        const displayMessage = text || (currentTags.length > 0 ? `I need items from ${currentTags[0].vendorName}` : '');
        const userMsg = createMessage(displayMessage, 'user');
        dispatch({ type: 'ADD_MESSAGE', payload: userMsg });

        // Show typing indicator
        setIsTyping(true);

        try {
            const response = await sendChatMessage(displayMessage, {
                cart: state.cart,
                orderHistory: state.orderHistory,
                attachedVendors: currentTags.map(t => ({ id: t.vendorId, name: t.vendorName }))
            });

            setIsTyping(false);

            if (response.type === 'vendor_discovery' && 'vendors' in response) {
                const botMsg = createMessage('', 'bot', 'vendor_grid', {
                    categoryName: response.categoryName,
                    vendors: response.vendors,
                });
                dispatch({ type: 'ADD_MESSAGE', payload: botMsg });
            } else if (response.type === 'pending_inventory' && 'orderItems' in response && response.orderItems) {
                // --- PHASE: Checking Availability ---
                const checkMsg = createMessage(
                    'Let me chcek the availabilities of the product',
                    'bot',
                    'checking_availability',
                    { items: response.orderItems.map((oi: any) => ({ name: oi.productName || oi.product?.name, vendorName: oi.vendorName || oi.vendor?.name })) }
                );
                dispatch({ type: 'ADD_MESSAGE', payload: checkMsg });
                dispatch({ type: 'SET_ORDER_STAGE', payload: 'checking_availability' });

                // Simulate availability check (2s), then show order summary
                setTimeout(() => {
                    // --- SIMULATED INVENTORY CHECK (10% chance of unavailability) ---
                    if (Math.random() < 0.1) {
                        const rejectMsg = createMessage(
                            "I'm sorry, I just checked and those items are currently out of stock at this vendor. Would you like to check nearby vendors instead?",
                            'bot'
                        );
                        dispatch({ type: 'ADD_MESSAGE', payload: rejectMsg });
                        dispatch({ type: 'SET_ORDER_STAGE', payload: 'idle' });
                        return;
                    }

                    const items = response.orderItems.map((oi: any) => ({
                        productName: oi.productName || oi.product?.name,
                        productId: oi.productId || oi.product?.id,
                        weight: oi.weight || '1kg',
                        vendorName: oi.vendorName || oi.vendor?.name,
                        vendorId: oi.vendorId || oi.vendor?.id,
                        vendorImage: oi.vendorImage || oi.vendor?.image,
                        productPrice: oi.productPrice || oi.price || 0,
                        productImage: oi.productImage || oi.product?.image,
                    }));
                    const total = items.reduce((s: number, i: any) => s + (i.productPrice || 0), 0);

                    const summaryMsg = createMessage(
                        'Order summary ready',
                        'bot',
                        'order_summary',
                        {
                            items,
                            total,
                            vendorName: items[0]?.vendorName || 'Vendor',
                            vendorImage: items[0]?.vendorImage,
                        }
                    );
                    dispatch({ type: 'ADD_MESSAGE', payload: summaryMsg });
                    dispatch({ type: 'SET_ORDER_STAGE', payload: 'order_summary' });

                    // Add items to cart
                    items.forEach((item: any) => {
                        const cartItem: CartItem = {
                            id: item.productId,
                            name: item.productName,
                            price: item.productPrice,
                            qty: 1,
                            weight: item.weight,
                            vendor: item.vendorName,
                            vendorId: item.vendorId,
                            vendorImage: item.vendorImage || '',
                            image: item.productImage || '',
                        };
                        dispatch({ type: 'ADD_TO_CART', payload: cartItem });
                    });

                    // Handle items that couldn't be matched
                    const unmatched = response.unmatchedItems;
                    if (unmatched && unmatched.length > 0) {
                        setTimeout(() => {
                            const unmatchedMsg = createMessage(
                                `I couldn't find ${unmatched.join(', ')} in the catalog.`,
                                'bot'
                            );
                            dispatch({ type: 'ADD_MESSAGE', payload: unmatchedMsg });
                        }, 500);
                    }
                }, 2500);
            } else if (response.type === 'order_summary' && 'orderItems' in response && response.orderItems) {
                // Direct order summary (from drag-to-tag) — skip checking availability
                const items = response.orderItems.map((oi: any) => ({
                    productName: oi.productName || oi.product?.name,
                    productId: oi.productId || oi.product?.id,
                    weight: oi.weight || '1kg',
                    vendorName: oi.vendorName || oi.vendor?.name,
                    vendorId: oi.vendorId || oi.vendor?.id,
                    vendorImage: oi.vendorImage || oi.vendor?.image,
                    productPrice: oi.productPrice || oi.price || 0,
                    productImage: oi.productImage || oi.product?.image,
                }));
                const total = items.reduce((s: number, i: any) => s + (i.productPrice || 0), 0);

                // Add items to cart
                items.forEach((item: any) => {
                    const cartItem: CartItem = {
                        id: item.productId,
                        name: item.productName,
                        price: item.productPrice,
                        qty: 1,
                        weight: item.weight,
                        vendor: item.vendorName,
                        vendorId: item.vendorId,
                        vendorImage: item.vendorImage || '',
                        image: item.productImage || '',
                    };
                    dispatch({ type: 'ADD_TO_CART', payload: cartItem });
                });

                const checkMsg = createMessage(
                    'Let me chcek the availabilities of the product',
                    'bot',
                    'checking_availability',
                    { items: items.map((i: any) => ({ name: i.productName, vendorName: i.vendorName })) }
                );
                dispatch({ type: 'ADD_MESSAGE', payload: checkMsg });

                setTimeout(() => {
                    const summaryMsg = createMessage(
                        'Order summary ready',
                        'bot',
                        'order_summary',
                        {
                            items,
                            total,
                            vendorName: items[0]?.vendorName || 'Vendor',
                            vendorImage: items[0]?.vendorImage
                        }
                    );
                    dispatch({ type: 'ADD_MESSAGE', payload: summaryMsg });
                    dispatch({ type: 'SET_ORDER_STAGE', payload: 'order_summary' });
                }, 1500);
            } else if (response.type === 'order_summary' && response.cartSummary) {
                // Cart-based checkout summary (Logic 3 in backend)
                const cartItems = response.items || [];
                const items = cartItems.map((i: any) => ({
                    productName: i.name,
                    productId: i.id || i.productId,
                    weight: i.weight,
                    vendorName: i.vendor || i.vendorName,
                    vendorId: i.vendorId,
                    vendorImage: i.vendorImage,
                    productPrice: i.price || i.productPrice,
                    productImage: i.image || i.productImage,
                    qty: i.qty || 1
                }));

                const checkMsg = createMessage(
                    'Let me chcek the availabilities of the product',
                    'bot',
                    'checking_availability',
                    { items: items.map((i: any) => ({ name: i.productName, vendorName: i.vendorName })) }
                );
                dispatch({ type: 'ADD_MESSAGE', payload: checkMsg });

                setTimeout(() => {
                    const summaryMsg = createMessage(
                        response.content || 'Here’s your order summary.',
                        'bot',
                        'order_summary',
                        {
                            items,
                            total: response.total || 0,
                            vendorName: items[0]?.vendorName || 'Multiple Shops',
                            vendorImage: items[0]?.vendorImage
                        }
                    );
                    dispatch({ type: 'ADD_MESSAGE', payload: summaryMsg });
                    dispatch({ type: 'SET_ORDER_STAGE', payload: 'order_summary' });
                }, 1500);

                // Handle items that couldn't be matched at the specific vendor
                const unmatched = response.unmatchedItems;
                if (unmatched && unmatched.length > 0) {
                    setTimeout(() => {
                        const unmatchedMsg = createMessage(
                            `I couldn't find ${unmatched.join(', ')} at ${items[0]?.vendorName || 'this shop'}.`,
                            'bot'
                        );
                        dispatch({ type: 'ADD_MESSAGE', payload: unmatchedMsg });
                    }, 500);
                }
            } else if ('content' in response) {
                const botMsg = createMessage(response.content || '', 'bot');
                dispatch({ type: 'ADD_MESSAGE', payload: botMsg });
            }
        } catch (error) {
            setIsTyping(false);
            const errorMsg = createMessage("Sorry, I'm having trouble connecting. Please try again.", 'bot');
            dispatch({ type: 'ADD_MESSAGE', payload: errorMsg });
        }

        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    }, [message, tags, state.cart, state.orderHistory, dispatch]);

    // --- Order Lifecycle Handlers ---
    const handlePlaceOrder = () => {
        if (!paymentMethod) {
            Alert.alert('Select Payment', 'Please select UPI or COD to proceed.');
            return;
        }

        // --- FLOWCHART STEP: Contacting Vendor happens BEFORE Payment Logic ---
        triggerContactingVendor(paymentMethod);
    };

    const triggerContactingVendor = (method: 'upi' | 'cod') => {
        const vendorName = state.activeVendorName || 'Vendor';

        // 1. Show Contacting Vendor Card
        const contactMsg = createMessage(
            'Contacting vendor...',
            'bot',
            'contacting_vendor',
            { vendorName, vendorImage: state.activeVendorImage }
        );
        dispatch({ type: 'ADD_MESSAGE', payload: contactMsg });
        dispatch({ type: 'SET_ORDER_STAGE', payload: 'contacting_vendor' });

        // 2. Simulate Vendor Confirmation (3s delay)
        setTimeout(() => {
            // --- SIMULATED REJECTION (10% chance) ---
            if (Math.random() < 0.1) {
                const rejectMsg = createMessage(
                    `Sorry, ${vendorName} just informed us that they can't fulfill your order right now. You can try another vendor!`,
                    'bot'
                );
                dispatch({ type: 'ADD_MESSAGE', payload: rejectMsg });
                dispatch({ type: 'SET_ORDER_STAGE', payload: 'idle' });
                return;
            }

            // --- VENDOR ACCEPTED ---
            if (method === 'upi') {
                // Flowchart: Acceptance -> Payment Logic (UPI)
                const total = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
                navigation.navigate('UPIPayment', { total });
            } else {
                // Flowchart: Acceptance -> Payment Logic (COD) -> Confirm Order
                startOrderTracking();
            }
        }, 3000);
    };

    const startOrderTracking = () => {
        const vendorName = state.activeVendorName || 'Vendor';
        const orderId = generateOrderId();
        const total = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
        const vendors = getUniqueVendors(state.cart);

        // Add order to history
        dispatch({
            type: 'ADD_ORDER',
            payload: {
                id: orderId,
                cart: [...state.cart],
                total,
                vendors,
                timestamp: new Date().toLocaleString(),
                status: 'active',
            },
        });

        // 0. Update Stage and Clear historical cards immediately
        dispatch({ type: 'SET_ORDER_STAGE', payload: 'assigning_partner' });
        dispatch({ type: 'CLEAR_ORDER_MESSAGES' });

        // 1. Order Confirmed Detail (Screenshot Style - Added First)
        const confirmedDetailMsg = createMessage('Order confirmed details', 'bot', 'order_confirmed_detail', {
            orderId: orderId.slice(0, 10).toUpperCase(),
            items: state.cart,
            total,
            vendorName,
        });
        dispatch({ type: 'ADD_MESSAGE', payload: confirmedDetailMsg });

        // 2. Partner Assignment Flow (Merged)
        const assigningMsg = createMessage('Assigning Partner...', 'bot', 'partner_assignment_flow', { vendorName });
        dispatch({ type: 'ADD_MESSAGE', payload: assigningMsg });

        // Navigate to OrderPlaced screen
        navigation.navigate('OrderPlaced', {
            orderId: orderId.slice(0, 10).toUpperCase(),
            vendorCount: vendors.length || 1
        });

        // 3. On The Way (8s for delivery boy assignment)
        setTimeout(() => {
            const trackingMsg = createMessage('Order is on the way', 'bot', 'order_tracking', { estimatedTime: '30 mins' });
            dispatch({ type: 'ADD_MESSAGE', payload: trackingMsg });
            dispatch({ type: 'SET_ORDER_STAGE', payload: 'out_for_delivery' });
        }, 8000);

        // 4. Delivered (1 minute after order tracking starts)
        setTimeout(() => {
            // CRITICAL: Clear all messages first to leave ONLY the summary
            dispatch({ type: 'CLEAR_MESSAGES' });
            dispatch({ type: 'SET_ORDER_STAGE', payload: 'delivered' });

            const doneMsg = createMessage('Delivered!', 'bot', 'post_delivery', {
                orderId: orderId.slice(0, 10).toUpperCase(),
                total,
                itemCount: state.cart.length,
                vendorName,
            });
            dispatch({ type: 'ADD_MESSAGE', payload: doneMsg });

            dispatch({ type: 'SET_ACTIVE_VENDOR', payload: null });
            dispatch({ type: 'CLEAR_CART' });
            setPaymentMethod(null);
        }, 60000);
    };

    // --- Sub-renderers ---

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity style={styles.locationRow} onPress={() => navigation.navigate('Location')}>
                <View style={styles.locationIcon}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth={2}>
                        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                        <Circle cx={12} cy={10} r={3} />
                    </Svg>
                </View>
                <View style={styles.locationTextContainer}>
                    <Text style={styles.locationLabel} numberOfLines={1} ellipsizeMode="tail">
                        <Text style={styles.locationBold}>{state.currentLocationLabel}</Text>
                    </Text>
                    <Text style={styles.locationSubtext} numberOfLines={1} ellipsizeMode="tail">
                        {state.currentLocation}
                    </Text>
                </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={Colors.neutral.white} strokeWidth={2}>
                    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                    <Circle cx={12} cy={7} r={4} />
                </Svg>
            </TouchableOpacity>
        </View>
    );

    const renderCategoryGrid = () => (
        <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>Shop by Category</Text>
            <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.key}
                        style={styles.categoryItem}
                        onPress={() =>
                            navigation.navigate('CategoryMarketplace', {
                                categoryName: cat.key,
                                categoryDisplayName: cat.name,
                            })
                        }
                    >
                        <View style={styles.categoryImageWrap}>
                            <Image source={cat.image} style={styles.categoryImage} resizeMode="cover" />
                        </View>
                        <Text style={styles.categoryName}>{cat.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderVendorGrid = useCallback((vendors: Vendor[]) => (
        <View style={styles.vendorSection}>
            <Text style={styles.vendorSectionTitle}>Nearby Fresh Vendors</Text>
            <View style={styles.vendorGrid}>
                {vendors.map((vendor) => (
                    <DraggableItem
                        key={vendor.id}
                        productId={vendor.id}
                        productName={vendor.name}
                        productImage={vendor.image}
                        vendor={{
                            vendorId: vendor.id,
                            vendorName: vendor.name,
                            vendorImage: vendor.image,
                            vendorRating: vendor.rating,
                            vendorDistance: vendor.distance,
                            price: 0, // Not needed for vendor drag
                        }}
                        variant="vendor-card"
                        onDragStart={(item: any) => {
                            setDraggedItem(item);
                            isDragging.value = true;
                        }}
                        onDragEnd={(x: number, y: number, item: any) => {
                            const screenHeight = Dimensions.get('window').height;
                            if (y > screenHeight - 200) {
                                handleDrop(item);
                            } else {
                                setDraggedItem(null);
                                isDragging.value = false;
                            }
                        }}
                        dragX={dragX}
                        dragY={dragY}
                        onSelect={() => navigation.navigate('VendorStore', { vendor })}
                    />
                ))}
            </View>
        </View>
    ), [navigation, handleDrop]);

    const renderVendorGridSection = useCallback(() => {
        const vendors = state.marketData?.vendors;
        if (!vendors || vendors.length === 0) return null;

        const visibleVendors = isVendorsExpanded ? vendors : vendors.slice(0, 4);
        const hasMore = vendors.length > 4;

        return (
            <View style={styles.vendorSection}>
                <Text style={styles.vendorSectionTitle}>Nearby Fresh Vendors</Text>
                <View style={styles.vendorGrid}>
                    {visibleVendors.map((vendor) => (
                        <DraggableItem
                            key={vendor.id}
                            productId={vendor.id}
                            productName={vendor.name}
                            productImage={vendor.image}
                            vendor={{
                                vendorId: vendor.id,
                                vendorName: vendor.name,
                                vendorImage: vendor.image,
                                vendorRating: vendor.rating,
                                vendorDistance: vendor.distance,
                                price: 0, // Not needed for vendor drag
                            }}
                            variant="vendor-card"
                            onDragStart={(item: any) => {
                                setDraggedItem(item);
                                isDragging.value = true;
                            }}
                            onDragEnd={(x: number, y: number, item: any) => {
                                const screenHeight = Dimensions.get('window').height;
                                if (y > screenHeight - 200) {
                                    handleDrop(item);
                                } else {
                                    setDraggedItem(null);
                                    isDragging.value = false;
                                }
                            }}
                            dragX={dragX}
                            dragY={dragY}
                            onSelect={() => navigation.navigate('VendorStore', { vendor })}
                        />
                    ))}
                </View>
                {hasMore && (
                    <TouchableOpacity
                        style={styles.viewMoreButton}
                        onPress={() => setIsVendorsExpanded(!isVendorsExpanded)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.viewMoreText}>
                            {isVendorsExpanded ? 'View less' : 'View more shops'}
                        </Text>
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth={2.5}>
                            {isVendorsExpanded
                                ? <Path d="M18 15l-6-6-6 6" />
                                : <Path d="M6 9l6 6 6-6" />
                            }
                        </Svg>
                    </TouchableOpacity>
                )}
            </View>
        );
    }, [state.marketData?.vendors, isVendorsExpanded, navigation, handleDrop]);

    const isConfirmed = state.activeOrderStage === 'assigning_partner' ||
        state.activeOrderStage === 'partner_assigned' ||
        state.activeOrderStage === 'out_for_delivery' ||
        state.activeOrderStage === 'delivered';

    const isDelivered = state.activeOrderStage === 'delivered';

    const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
        const isUser = item.sender === 'user';

        // --- COLLAPSING LOGIC (Fallback) ---
        if (isDelivered && item.type !== 'post_delivery' && item.sender !== 'system') return null;

        const cardsToHide = ['checking_availability', 'order_summary', 'contacting_vendor'];
        if (isConfirmed && cardsToHide.includes(item.type || '')) return null;

        // --- ORDER CONFIRMED DETAIL CARD ---
        if (item.type === 'order_confirmed_detail') {
            return (
                <View style={styles.messageBotContainer}>
                    <View style={styles.avatarSmall}>
                        <Image source={require('../../../assets/ezer-avatar.png')} style={styles.avatarImage} resizeMode="cover" />
                    </View>
                    <OrderConfirmedDetailCard
                        orderId={item.data?.orderId}
                        items={item.data?.items}
                        total={item.data?.total}
                        vendorName={item.data?.vendorName}
                    />
                </View>
            );
        }

        // --- ORDER LIFECYCLE CARDS ---
        if (item.type === 'checking_availability' && item.data?.items) {
            return (
                <View style={styles.messageBotContainer}>
                    <View style={styles.avatarSmall}>
                        <Image source={require('../../../assets/ezer-avatar.png')} style={styles.avatarImage} resizeMode="cover" />
                    </View>
                    <CheckingAvailabilityCard items={item.data.items} />
                </View>
            );
        }

        if (item.type === 'contacting_vendor' && item.data?.vendorName) {
            return (
                <View style={styles.messageBotContainer}>
                    <View style={styles.avatarSmall}>
                        <Image source={require('../../../assets/ezer-avatar.png')} style={styles.avatarImage} resizeMode="cover" />
                    </View>
                    <ContactingVendorCard
                        vendorName={item.data.vendorName}
                        vendorImage={item.data.vendorImage}
                    />
                </View>
            );
        }

        if (item.type === 'order_summary' && item.data?.items) {
            const orderTotal = item.data.total || item.data.items.reduce((sum: number, oi: any) => sum + (oi.productPrice || oi.price || 0), 0);
            return (
                <View style={styles.messageBotContainer}>
                    <View style={styles.avatarSmall}>
                        <Image source={require('../../../assets/ezer-avatar.png')} style={styles.avatarImage} resizeMode="cover" />
                    </View>
                    <OrderSummaryCard
                        items={item.data.items}
                        total={orderTotal}
                        vendorName={item.data.vendorName}
                        paymentMethod={paymentMethod}
                        onSelectUPI={() => setPaymentMethod('upi')}
                        onSelectCOD={() => setPaymentMethod('cod')}
                        onPlaceOrder={handlePlaceOrder}
                    />
                </View>
            );
        }

        if (item.type === 'live_tracker' && item.data) {
            return (
                <View style={styles.messageBotContainer}>
                    <View style={styles.avatarSmall}>
                        <Image source={require('../../../assets/ezer-avatar.png')} style={styles.avatarImage} resizeMode="cover" />
                    </View>
                    <LiveTrackerCard
                        currentStep={item.data.currentStep || 0}
                        vendorName={item.data.vendorName}
                        estimatedTime={item.data.estimatedTime}
                        orderId={item.data.orderId}
                    />
                </View>
            );
        }

        if (item.type === 'partner_assignment_flow') {
            return (
                <View style={styles.messageBotContainer}>
                    <View style={styles.avatarSmall}>
                        <Image source={require('../../../assets/ezer-avatar.png')} style={styles.avatarImage} resizeMode="cover" />
                    </View>
                    <PartnerAssignmentFlowCard vendorName={item.data?.vendorName} />
                </View>
            );
        }

        if (item.type === 'order_tracking') {
            return (
                <View style={styles.messageBotContainer}>
                    <View style={styles.avatarSmall}>
                        <Image source={require('../../../assets/ezer-avatar.png')} style={styles.avatarImage} resizeMode="cover" />
                    </View>
                    <OrderTrackingCard />
                </View>
            );
        }

        if (item.type === 'post_delivery' && item.data) {
            return (
                <View style={styles.messageBotContainer}>
                    <View style={styles.avatarSmall}>
                        <Image source={require('../../../assets/ezer-avatar.png')} style={styles.avatarImage} resizeMode="cover" />
                    </View>
                    <PostDeliveryCard
                        orderId={item.data.orderId}
                        total={item.data.total}
                        itemCount={item.data.itemCount}
                        vendorName={item.data.vendorName}
                        onReorder={() => {
                            // TODO: Reorder the same items
                            const reorderMsg = createMessage("I'd like to reorder my last order", 'user');
                            dispatch({ type: 'ADD_MESSAGE', payload: reorderMsg });
                        }}
                        onSupport={() => {
                            const supportMsg = createMessage('I need help with my recent order', 'user');
                            dispatch({ type: 'ADD_MESSAGE', payload: supportMsg });
                        }}
                        onViewDetails={() => {
                            const detailsMsg = createMessage('Show me my order details', 'user');
                            dispatch({ type: 'ADD_MESSAGE', payload: detailsMsg });
                        }}
                    />
                </View>
            );
        }

        if (item.type === 'vendor_grid' && item.data?.vendors) {
            return (
                <View style={styles.messageBotContainer}>
                    <View style={styles.avatarSmall}>
                        <Image source={require('../../../assets/ezer-avatar.png')} style={styles.avatarImage} resizeMode="cover" />
                    </View>
                    {renderVendorGrid(item.data.vendors)}
                </View>
            );
        }

        return (
            <View style={[styles.messageRow, isUser ? styles.messageUserRow : styles.messageBotRow]}>
                {!isUser ? (
                    <View style={styles.avatarSmall}>
                        <Image source={require('../../../assets/ezer-avatar.png')} style={styles.avatarImage} resizeMode="cover" />
                    </View>
                ) : null}
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.botBubble]}>
                    <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>{item.text}</Text>
                </View>
            </View>
        );
    }, [isDelivered, isConfirmed, paymentMethod, handlePlaceOrder, renderVendorGrid, dispatch]);

    // Build the chat content list with aggressive filtering
    const chatData: ChatMessage[] = useMemo(() => [
        // 1. System Grids - Hide completely if delivered
        ...(!isDelivered ? [
            createMessage('__CATEGORIES__', 'system', 'category_grid'),
            ...(state.marketData?.vendors && state.marketData.vendors.length > 0
                ? [createMessage('__VENDORS__', 'system', 'vendor_grid', { vendors: state.marketData.vendors })]
                : [])
        ] : []),

        // 2. User/Bot/Stage Messages
        ...state.messages.filter(m => {
            if (isDelivered) return m.type === 'post_delivery';
            if (!isConfirmed) return true;
            const hideTypes = ['checking_availability', 'order_summary', 'contacting_vendor'];
            return !hideTypes.includes(m.type || '');
        }),
    ], [isDelivered, isConfirmed, state.marketData?.vendors, state.messages]);

    const renderItem = useCallback(({ item }: { item: ChatMessage }) => {
        if (item.type === 'category_grid' && item.sender === 'system') {
            return renderCategoryGrid();
        }
        if (item.type === 'vendor_grid' && item.sender === 'system') {
            return renderVendorGridSection();
        }
        return renderMessage({ item });
    }, [renderCategoryGrid, renderVendorGridSection, renderMessage]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={styles.container}>
                {renderHeader()}

                <KeyboardAvoidingView
                    style={styles.chatArea}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
                >
                    <FlatList
                        ref={flatListRef}
                        data={chatData}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.messagesList}
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        scrollEnabled={!draggedItem}
                        keyboardShouldPersistTaps="handled"
                    />

                    {/* Typing indicator */}
                    {isTyping ? (
                        <View style={styles.typingContainer}>
                            <View style={styles.avatarSmall}>
                                <Image source={require('../../../assets/ezer-avatar.png')} style={styles.avatarImage} resizeMode="cover" />
                            </View>
                            <View style={[styles.messageBubble, styles.botBubble, styles.typingBubble]}>
                                <ActivityIndicator size="small" color={Colors.brand.primary} />
                            </View>
                        </View>
                    ) : null}

                    {/* Input Bar */}
                    <Animated.View style={[
                        styles.inputBar,
                        {
                            paddingBottom: isKeyboardVisible
                                ? 8
                                : Math.max(insets.bottom, 16)
                        },
                        animatedDropZoneStyle
                    ]}>
                        <View style={styles.inputContainer}>
                            {/* Tags Area overlaying the input field area conceptually */}
                            {tags.length > 0 && (
                                <View style={styles.tagsContainer}>
                                    {tags.map((tag, idx) => (
                                        <View key={idx} style={styles.tag}>
                                            <Image source={resolveImageSource(tag.image)} style={styles.tagImage} />
                                            <Text style={styles.tagText} numberOfLines={1}>{tag.vendorName}</Text>
                                            <TouchableOpacity onPress={() => removeTag(idx)} style={styles.removeTag}>
                                                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={Colors.neutral.white} strokeWidth={2.5}>
                                                    <Path d="M18 6L6 18M6 6l12 12" />
                                                </Svg>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <View style={styles.inputRow}>
                                <TextInput
                                    style={[
                                        styles.chatInput,
                                        isFocused && styles.chatInputFocused,
                                        Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                                    ]}
                                    placeholder={tags.length > 0 ? "Add details..." : "Type a message or ask Ezer..."}
                                    placeholderTextColor={Colors.light.textMuted}
                                    value={message}
                                    onChangeText={setMessage}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    multiline
                                    maxLength={500}
                                    onSubmitEditing={handleSend}
                                    selectionColor={Colors.brand.primary}
                                    cursorColor={Colors.brand.primary}
                                />
                                <TouchableOpacity
                                    style={[styles.sendButton, (message.trim() || tags.length > 0) ? styles.sendButtonActive : null]}
                                    onPress={(message.trim() || tags.length > 0) ? handleSend : undefined}
                                >
                                    {(message.trim() || tags.length > 0) ? (
                                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.neutral.white} strokeWidth={2.5}>
                                            <Path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
                                        </Svg>
                                    ) : (
                                        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth={2}>
                                            <Path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                                            <Path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                                        </Svg>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>

                {/* Dragging Preview */}
                {draggedItem && (
                    <Animated.View style={[styles.dragPreview, dragPreviewStyle]}>
                        <Image source={resolveImageSource(draggedItem.image)} style={styles.previewImage} />
                        <View style={styles.previewInfo}>
                            <Text style={styles.previewName}>{draggedItem.vendorName}</Text>
                            <Text style={styles.previewSub}>{draggedItem.name}</Text>
                        </View>
                    </Animated.View>
                )}
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.backgroundSecondary,
    },
    // --- Header ---
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingBottom: 10,
        backgroundColor: Colors.light.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
        ...Shadows.header,
    },
    locationRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    locationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.brand.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationTextContainer: {
        flex: 1,
        maxWidth: '70%',
    },
    locationLabel: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 15,
        color: Colors.light.text,
    },
    locationBold: {
        fontFamily: Typography.fontFamily.headingBold,
        color: Colors.light.text,
    },
    locationSubtext: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 11,
        color: Colors.light.textMuted,
        marginTop: 1,
    },
    profileButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Colors.brand.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // --- Chat Area ---
    chatArea: {
        flex: 1,
    },
    messagesList: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },

    // --- Category Grid ---
    categorySection: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        marginBottom: Spacing.lg,
    },
    categoryTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 18,
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 12,
    },
    categoryItem: {
        width: '30%',
        alignItems: 'center',
    },
    categoryImageWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        marginBottom: 8,
        // Removed border and background for "floating" look
        ...Shadows.cardHover, // Using cardHover for a slightly stronger shadow to lift it
        elevation: 6,
    },
    categoryImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    categoryName: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 11,
        color: Colors.light.text,
        textAlign: 'center',
        lineHeight: 14,
    },

    // --- Vendor Grid ---
    vendorSection: {
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius['4xl'],
        padding: Spacing.xl,
        marginBottom: Spacing.lg,
        ...Shadows.card,
    },
    vendorSectionTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 18,
        color: Colors.light.text,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    vendorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    vendorCard: {
        width: (width - 80) / 2 - 5,
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius['3xl'],
        padding: Spacing.md,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 4,
    },
    vendorImage: {
        width: 64,
        height: 64,
        borderRadius: 20,
        marginBottom: Spacing.sm + 4,
        backgroundColor: Colors.light.backgroundSecondary,
    },
    vendorName: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 14,
        color: Colors.light.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    vendorSpecialty: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 11,
        color: Colors.light.textMuted,
        textAlign: 'center',
        marginBottom: Spacing.md,
        lineHeight: 15,
        height: 30,
    },
    vendorMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.04)',
    },
    vendorRatingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    vendorRating: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 12,
        color: Colors.light.text,
    },
    vendorDot: {
        fontSize: 10,
        color: Colors.light.textMuted,
        opacity: 0.5,
    },
    vendorDistanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    vendorDistance: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    viewMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.md,
        paddingVertical: 8,
        gap: 6,
    },
    viewMoreText: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 14,
        color: Colors.brand.primary,
    },

    // --- Message Bubbles ---
    messageRow: {
        flexDirection: 'row',
        marginBottom: 4,
        maxWidth: '75%',
    },
    messageUserRow: {
        alignSelf: 'flex-end',
    },
    messageBotRow: {
        alignSelf: 'flex-start',
    },
    messageBotContainer: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        alignItems: 'flex-start',
        marginBottom: 4,
        maxWidth: '88%',
    },
    messageBubble: {
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    userBubble: {
        backgroundColor: Colors.brand.primary,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 4,
    },
    botBubble: {
        backgroundColor: Colors.light.background,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        ...Shadows.card,
    },
    messageText: {
        fontSize: 13.5,
        lineHeight: 19,
    },
    userText: {
        fontFamily: Typography.fontFamily.bodyMedium,
        color: Colors.neutral.white,
    },
    botText: {
        fontFamily: Typography.fontFamily.body,
        color: Colors.light.text,
    },
    avatarSmall: {
        width: 24,
        height: 24,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 6,
        marginTop: 2,
        backgroundColor: Colors.neutral.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.card,
    },
    avatarImage: {
        width: '75%', // Scale down to hide the checkerboard border
        height: '75%',
        borderRadius: 12, // Circular clipping for the inner image too
    },
    typingContainer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    typingBubble: {
        paddingVertical: 16,
        paddingHorizontal: 24,
    },

    // --- Input Bar ---
    // --- Input Bar ---
    inputBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: 12,
        backgroundColor: Colors.light.background,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
        gap: 12,
        zIndex: 100,
    },
    chatInput: {
        flex: 1,
        fontFamily: Typography.fontFamily.body,
        fontSize: 15,
        color: Colors.light.text,
        backgroundColor: Colors.neutral.white,
        borderRadius: 28,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 12,
        minHeight: 50,
        maxHeight: 120,
        ...Shadows.card,
        elevation: 8,
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    chatInputFocused: {
        borderColor: Colors.brand.primary,
        borderWidth: 1.5,
        backgroundColor: Colors.neutral.white,
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.neutral.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.card,
        elevation: 4,
    },
    sendButtonActive: {
        backgroundColor: Colors.brand.primary,
        shadowColor: Colors.brand.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
        transform: [{ scale: 1.05 }],
    },
    inputContainer: {
        flex: 1,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
        gap: 8,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.brand.primary,
        borderRadius: 20,
        paddingLeft: 4,
        paddingRight: 8,
        paddingVertical: 4,
        ...Shadows.card,
    },
    tagImage: {
        width: 24,
        height: 24,
        borderRadius: 12,
        marginRight: 6,
    },
    tagText: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 12,
        color: Colors.neutral.white,
        maxWidth: 150,
    },
    removeTag: {
        marginLeft: 6,
        padding: 2,
    },
    dragPreview: {
        position: 'absolute',
        top: 0,
        left: 0,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.neutral.white,
        padding: 12,
        borderRadius: BorderRadius['2xl'],
        ...Shadows.cardHover,
        zIndex: 9999,
        borderWidth: 1.5,
        borderColor: Colors.brand.primarySoft,
    },
    previewImage: {
        width: 48,
        height: 48,
        borderRadius: 10,
        marginRight: 12,
    },
    previewInfo: {
        justifyContent: 'center',
    },
    previewName: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 14,
        color: Colors.light.text,
    },
    previewSub: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 12,
        color: Colors.light.textMuted,
    },
});
