import * as React from 'react';
import { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Dimensions,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList, Product } from '../../types';
import { useAppState, createMessage } from '../../store/AppContext';
import { Colors, Typography, Shadows, BorderRadius, Spacing } from '../../theme';
import { resolveImageSource, sendChatMessage } from '../../services/api';
import { formatCurrency } from '../../utils/formatting';
import Svg, { Path, Circle } from 'react-native-svg';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import DraggableItem from '../../components/common/DraggableItem';

const { width } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<MainStackParamList, 'CategoryMarketplace'>;
    route: RouteProp<MainStackParamList, 'CategoryMarketplace'>;
};

interface VendorPrice {
    vendorId: string;
    vendorName: string;
    vendorImage: string;
    vendorRating: number;
    vendorDistance: string;
    price: number;
}

interface ProductWithVendors {
    product: Product;
    vendors: VendorPrice[];
    bestPrice: number;
    bestVendorId: string;
}

// DraggableVendorRow is now imported as DraggableItem from components/common

export default function CategoryMarketplaceScreen({ navigation, route }: Props) {
    const { categoryName, categoryDisplayName } = route.params;
    const { state, dispatch } = useAppState();
    const [tags, setTags] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const insets = useSafeAreaInsets();

    // Drag & Drop State
    const isDragging = useSharedValue(false);
    const dragX = useSharedValue(0);
    const dragY = useSharedValue(0);
    const [draggedItem, setDraggedItem] = useState<any>(null);
    const dropZoneY = useSharedValue(0); // Y position of the drop zone

    const animatedDropZoneStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: withSpring(isDragging.value ? 1.05 : 1) }],
        };
    });

    const handleDrop = (item: any) => {
        // --- SINGLE VENDOR RULE ---
        const itemVendorId = item?.vendorId;

        // In CategoryMarketplaceScreen, we only allow ONE item to be tagged at a time
        // So we replace the tags array instead of appending
        setTags([item]);

        // Set active vendor
        if (itemVendorId) {
            dispatch({ type: 'SET_ACTIVE_VENDOR', payload: { vendorId: itemVendorId, vendorName: item.vendorName, vendorImage: item.vendorImage } });
        }

        setDraggedItem(null);
        isDragging.value = false;
    };

    const handleSend = async () => {
        if (!inputText.trim() && tags.length === 0) return;

        const messageText = inputText.trim() || `I want to order ${tags[0].name} from ${tags[0].vendorName}`;
        const attachedSkus = tags.map(t => ({
            productId: t.id || t.productId,
            productName: t.productName || t.name,
            vendorId: t.vendorId,
            vendorName: t.vendorName,
            weight: t.weight || '1kg',
            price: t.price
        }));

        setInputText('');
        setTags([]);
        setIsTyping(true);
        Keyboard.dismiss();

        // 1. Add user message
        const userMsg = createMessage(messageText, 'user');
        dispatch({ type: 'ADD_MESSAGE', payload: userMsg });

        // 2. Add tagged items to cart immediately
        tags.forEach(item => {
            dispatch({
                type: 'ADD_TO_CART',
                payload: {
                    id: item.id || item.productId,
                    name: item.name || item.productName,
                    price: item.price,
                    qty: 1,
                    weight: item.weight || '1kg',
                    vendor: item.vendorName,
                    vendorId: item.vendorId,
                    vendorImage: item.vendorImage || '',
                    image: item.image || item.productImage || '',
                }
            });
        });

        // 3. Initiate "Checking Availability" stage
        const checkMsg = createMessage(
            'Let me chcek the availabilities of the product',
            'bot',
            'checking_availability',
            { items: tags.map(t => ({ name: t.name || t.productName, vendorName: t.vendorName })) }
        );
        dispatch({ type: 'ADD_MESSAGE', payload: checkMsg });
        dispatch({ type: 'SET_ORDER_STAGE', payload: 'checking_availability' });

        // Navigate to Chat immediately to see the flow
        navigation.navigate('Chat');

        // 4. After a delay, show the order summary (Existing flow)
        setTimeout(() => {
            const total = tags.reduce((sum, t) => sum + t.price, 0);
            const summaryMsg = createMessage(
                "I've prepared your order summary.",
                'bot',
                'order_summary',
                {
                    items: tags.map(t => ({
                        productName: t.name || t.productName,
                        productId: t.id || t.productId,
                        weight: t.weight || '1kg',
                        vendorName: t.vendorName,
                        vendorId: t.vendorId,
                        vendorImage: t.vendorImage,
                        productPrice: t.price,
                        productImage: t.image || t.productImage,
                    })),
                    total,
                    vendorName: tags[0]?.vendorName,
                    vendorImage: tags[0]?.vendorImage
                }
            );
            dispatch({ type: 'ADD_MESSAGE', payload: summaryMsg });
            dispatch({ type: 'SET_ORDER_STAGE', payload: 'order_summary' });
            setIsTyping(false);
        }, 5000);
    };

    const removeTag = (index: number) => {
        setTags(prev => prev.filter((_, i) => i !== index));
    };

    // No manual add-to-cart. All items go through drag-to-tag.


    // Build products with vendor comparisons
    const productsWithVendors = useMemo(() => {
        if (!state.marketData) return [];

        const items: ProductWithVendors[] = [];

        for (const product of state.marketData.products) {
            // Simple category match
            if (!product.category?.toLowerCase().includes(categoryName.toLowerCase())) continue;

            const vendorPrices: VendorPrice[] = [];
            let bestPrice = Infinity;
            let bestVendorId = '';

            for (const [vendorId, price] of Object.entries(product.prices) as [string, number][]) {
                const vendor = state.marketData.vendors.find((v: any) => v.id === vendorId);
                if (vendor) {
                    vendorPrices.push({
                        vendorId,
                        vendorName: vendor.name,
                        vendorImage: vendor.image,
                        vendorRating: vendor.rating,
                        vendorDistance: vendor.distance,
                        price,
                    });
                    if (price < bestPrice) {
                        bestPrice = price;
                        bestVendorId = vendorId;
                    }
                }
            }

            if (vendorPrices.length > 0) {
                items.push({ product, vendors: vendorPrices, bestPrice, bestVendorId });
            }
        }

        return items;
    }, [state.marketData, categoryName]);

    // Exclusive deals: items with > 1 vendor
    const dealItems = productsWithVendors.filter((p: ProductWithVendors) => p.vendors.length > 1);

    return (
        <GestureHandlerRootView style={styles.container}>
            {/* Overlay for Dragged Item */}
            {draggedItem && (
                <Animated.View
                    style={[
                        styles.dragOverlay,
                        {
                            transform: [
                                { translateX: dragX },
                                { translateY: dragY }
                            ]
                        }
                    ]}
                    pointerEvents="none"
                >
                    <View style={styles.dragCard}>
                        <Text style={styles.dragCardText}>{draggedItem.name}</Text>
                        <Text style={styles.dragCardSubtext}>{draggedItem.vendorName} • {formatCurrency(draggedItem.price)}</Text>
                    </View>
                </Animated.View>
            )}
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.light.text} strokeWidth={2.5}>
                        <Path d="M19 12H5M5 12L12 19M5 12L12 5" />
                    </Svg>
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>{categoryDisplayName}</Text>
                    <Text style={styles.headerSubtitle}>COMPARE FRESH OPTIONS ACROSS SHOPS</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                style={{ flex: 1 }}
            >
                {/* Exclusive Deals Section */}
                {dealItems.length > 0 ? (
                    <View style={styles.dealsSection}>
                        <View style={styles.dealsHeader}>
                            <Text style={styles.fireEmoji}>🔥</Text>
                            <Text style={styles.dealsTitle}>EXCLUSIVE DEALS</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealsScroll}>
                            {dealItems.slice(0, 5).map((item: ProductWithVendors) => (
                                <View key={item.product.id} style={styles.dealCard}>
                                    <View style={styles.dealBadge}>
                                        <Text style={styles.dealBadgeText}>FLASH DEAL • 15% OFF</Text>
                                    </View>
                                    <Image
                                        source={resolveImageSource(item.product.image)}
                                        style={styles.dealImage}
                                        defaultSource={require('../../../assets/icon.png')}
                                    />
                                    <View style={styles.dealInfo}>
                                        <Text style={styles.dealName} numberOfLines={2}>{item.product.name}</Text>
                                        <Text style={styles.dealPrice}>{formatCurrency(item.bestPrice)} / kg</Text>
                                        <Text style={styles.dealOrigPrice}>{formatCurrency(Math.round(item.bestPrice * 1.18))}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                ) : null}

                {/* All Products with Vendor Comparison */}
                {productsWithVendors.map((item: ProductWithVendors) => (
                    <View key={item.product.id} style={styles.productSection}>
                        {/* Product Header */}
                        <View style={styles.productHeader}>
                            <Image
                                source={resolveImageSource(item.product.image)}
                                style={styles.productThumb}
                                defaultSource={require('../../../assets/icon.png')}
                            />
                            <View style={styles.productHeaderInfo}>
                                <Text style={styles.productName}>{item.product.name}</Text>
                                <Text style={styles.productVendorCount}>Available at {item.vendors.length} vendors</Text>
                            </View>
                        </View>

                        {/* Vendor Price List */}
                        {item.vendors.map((vp: VendorPrice) => {
                            const isBest = vp.vendorId === item.bestVendorId && item.vendors.length > 1;
                            return (
                                <DraggableItem
                                    key={vp.vendorId}
                                    productId={item.product.id}
                                    productName={item.product.name}
                                    productImage={item.product.image}
                                    vendor={vp}
                                    isBest={isBest}
                                    variant="row"
                                    onDragStart={(dragItem: any) => {
                                        setDraggedItem(dragItem);
                                        isDragging.value = true;
                                    }}
                                    onDragEnd={(x: number, y: number, item: any) => {
                                        const screenHeight = Dimensions.get('window').height;
                                        // Drop threshold: bottom 200px of the screen
                                        if (y > screenHeight - 200) {
                                            handleDrop(item);
                                        } else {
                                            setDraggedItem(null);
                                            isDragging.value = false;
                                        }
                                    }}
                                    dragX={dragX}
                                    dragY={dragY}
                                />
                            );
                        })}
                    </View>
                ))}

                {productsWithVendors.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No products found in this category yet.</Text>
                    </View>
                ) : null}
            </ScrollView>

            {/* Cart banner removed — ordering is AI-driven via drag-to-tag */}

            {/* Bottom input bar */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={0}
                style={[styles.bottomBarWrapper, { paddingBottom: insets.bottom + 16, marginBottom: 8 }]}
            >
                <Animated.View style={[styles.bottomBarContent, animatedDropZoneStyle]}>
                    {/* Tags Area */}
                    {tags.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsContainer}>
                            {tags.map((tag, index) => (
                                <View key={`${tag.id}-${index}`} style={styles.inputTag}>
                                    <Text style={styles.inputTagText}>{tag.name} • {tag.vendorName}</Text>
                                    <TouchableOpacity onPress={() => removeTag(index)}>
                                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={Colors.neutral.white} strokeWidth={2}>
                                            <Path d="M18 6L6 18M6 6l12 12" />
                                        </Svg>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )}

                    <View style={styles.inputRow}>
                        <TextInput
                            style={[
                                styles.chatInput,
                                isFocused && styles.chatInputFocused
                            ]}
                            placeholder={tags.length > 0 ? "Add message..." : "Drag items here or type..."}
                            placeholderTextColor={Colors.light.textMuted}
                            value={inputText}
                            onChangeText={setInputText}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            multiline
                            selectionColor={Colors.brand.primary}
                            cursorColor={Colors.brand.primary}
                            {...Platform.select({ web: { outline: 'none' } as any, default: {} })}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (inputText || tags.length > 0) ? styles.sendButtonActive : null]}
                            onPress={(inputText || tags.length > 0) ? handleSend : undefined}
                        >
                            {(inputText || tags.length > 0) ? (
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
                </Animated.View>
            </KeyboardAvoidingView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.backgroundSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: 14,
        backgroundColor: Colors.light.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
        gap: 12,
        ...Shadows.header,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.neutral.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.card,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    headerTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 22,
        color: Colors.light.text,
    },
    headerSubtitle: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 11,
        color: Colors.brand.primary,
        letterSpacing: 2,
        marginTop: 2,
    },
    scrollContent: {
        paddingBottom: 80,
    },

    // Deals
    dealsSection: {
        paddingTop: Spacing.xl,
        paddingLeft: Spacing.lg,
    },
    dealsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.lg,
    },
    fireEmoji: {
        fontSize: 20,
    },
    dealsTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 16,
        color: '#E74C3C',
        letterSpacing: 2,
    },
    dealsScroll: {
        paddingRight: Spacing.lg,
        gap: 12,
    },
    dealCard: {
        width: width * 0.65,
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius['4xl'],
        overflow: 'hidden',
        flexDirection: 'row',
        ...Shadows.card,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    dealBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#FFF0F0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: BorderRadius.sm,
        zIndex: 1,
    },
    dealBadgeText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 9,
        color: '#E74C3C',
        letterSpacing: 0.5,
    },
    dealImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        margin: 12,
        backgroundColor: Colors.light.backgroundSecondary,
    },
    dealInfo: {
        flex: 1,
        justifyContent: 'center',
        paddingRight: 12,
    },
    dealName: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 15,
        color: Colors.light.text,
        marginBottom: 6,
    },
    dealPrice: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 18,
        color: Colors.brand.primary,
    },
    dealOrigPrice: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 13,
        color: Colors.light.textMuted,
        textDecorationLine: 'line-through',
        marginTop: 2,
    },

    // Product Sections
    productSection: {
        marginTop: Spacing.xl,
        paddingHorizontal: Spacing.lg,
    },
    productHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: Spacing.lg,
    },
    productThumb: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.light.backgroundSecondary,
        borderWidth: 2,
        borderColor: Colors.light.border,
    },
    productHeaderInfo: {
        flex: 1,
    },
    productName: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 18,
        color: Colors.light.text,
    },
    productVendorCount: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 13,
        color: Colors.brand.primary,
        marginTop: 2,
    },

    // Vendor comparison rows
    vendorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius['3xl'],
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.light.border,
        ...Shadows.card,
    },
    vendorRowBest: {
        borderColor: Colors.brand.primary,
        borderWidth: 2,
    },
    bestBadge: {
        position: 'absolute',
        top: -10,
        right: Spacing.lg,
        backgroundColor: Colors.brand.primary,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: BorderRadius.sm,
    },
    bestBadgeText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 10,
        color: Colors.neutral.white,
        letterSpacing: 0.5,
    },
    vendorRowImage: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: Colors.light.backgroundSecondary,
    },
    vendorRowInfo: {
        flex: 1,
        marginLeft: 12,
    },
    vendorRowName: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 15,
        color: Colors.light.text,
    },
    vendorRowMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    vendorRowStar: {
        fontSize: 11,
    },
    vendorRowRating: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 12,
        color: Colors.light.text,
    },
    vendorRowDot: {
        fontSize: 10,
        color: Colors.light.textMuted,
    },
    vendorRowDistance: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    vendorRowPriceArea: {
        alignItems: 'flex-end',
        marginRight: 10,
    },
    vendorRowPrice: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 20,
        color: Colors.light.text,
    },
    vendorRowUnit: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 11,
        color: Colors.light.textMuted,
    },
    selectArrow: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.light.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectArrowBest: {
        backgroundColor: Colors.brand.primary,
    },

    emptyState: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 16,
        color: Colors.light.textMuted,
    },

    dragInput: {
        flex: 1,
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: BorderRadius['3xl'],
        paddingHorizontal: Spacing.lg,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    dragText: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 15,
        color: Colors.light.textMuted,
    },

    // Cart Banner
    cartBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.brand.primary,
        marginHorizontal: Spacing.lg,
        marginBottom: 8,
        paddingVertical: 14,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius['3xl'],
        ...Shadows.button,
    },
    cartBannerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    cartBadge: {
        backgroundColor: Colors.neutral.white,
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cartBadgeText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 12,
        color: Colors.brand.primary,
    },
    cartBannerText: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 14,
        color: Colors.neutral.white,
    },
    cartBannerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cartBannerTotal: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 16,
        color: Colors.neutral.white,
    },

    // Updated Bottom Bar
    bottomBarWrapper: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        zIndex: 100,
    },
    bottomBarContent: {
        paddingHorizontal: Spacing.lg,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    chatInput: {
        flex: 1,
        backgroundColor: Colors.neutral.white,
        borderRadius: 28,
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontFamily: Typography.fontFamily.body,
        fontSize: 15,
        color: Colors.light.text,
        maxHeight: 100,
        minHeight: 50,
        textAlignVertical: 'center',
        ...Shadows.card,
        elevation: 8,
    },
    chatInputFocused: {
        backgroundColor: Colors.neutral.white,
        borderColor: Colors.brand.primary,
        borderWidth: 1.5,
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

    // Tags
    tagsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    inputTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.brand.primary,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
    },
    inputTagText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 12,
        color: Colors.neutral.white,
    },

    // Drag Overlay
    dragOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 1000,
        width: 200,
    },
    dragCard: {
        backgroundColor: Colors.light.background,
        padding: 12,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: Colors.brand.primary,
    },
    dragCardText: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 14,
        color: Colors.light.text,
    },
    dragCardSubtext: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 12,
        color: Colors.light.textMuted,
    },
});
