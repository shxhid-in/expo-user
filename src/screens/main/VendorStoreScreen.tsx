import * as React from 'react';
import { useState } from 'react';
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

const { width, height } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<MainStackParamList, 'VendorStore'>;
    route: RouteProp<MainStackParamList, 'VendorStore'>;
};

export default function VendorStoreScreen({ navigation, route }: Props) {
    const { vendor } = route.params;
    const { state, dispatch } = useAppState();
    const insets = useSafeAreaInsets();
    const [tags, setTags] = useState<any[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    // Drag & Drop State
    const isDragging = useSharedValue(false);
    const dragX = useSharedValue(0);
    const dragY = useSharedValue(0);
    const [draggedItem, setDraggedItem] = useState<any>(null);

    const animatedDropZoneStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: withSpring(isDragging.value ? 1.05 : 1) }],
        };
    });

    // Filter products for this vendor
    const vendorProducts = state.marketData?.products.filter((p: Product) =>
        p.prices[vendor.id] !== undefined
    ) || [];

    const handleDrop = (item: any) => {
        // --- SINGLE VENDOR RULE ---
        // If cart has items from a different vendor, block the drop
        if (state.activeVendorId && state.activeVendorId !== vendor.id) {
            Alert.alert(
                'Different Vendor',
                `You already have items from ${state.activeVendorName || 'another vendor'}. Clear your cart to order from ${vendor.name}.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Clear & Add',
                        style: 'destructive',
                        onPress: () => {
                            dispatch({ type: 'CLEAR_CART' });
                            dispatch({ type: 'SET_ACTIVE_VENDOR', payload: { vendorId: vendor.id, vendorName: vendor.name, vendorImage: vendor.image } });
                            setTags(prev => [...prev, item]);
                            setDraggedItem(null);
                        },
                    },
                ]
            );
            setDraggedItem(null);
            return;
        }

        // Set active vendor if not set
        if (!state.activeVendorId) {
            dispatch({ type: 'SET_ACTIVE_VENDOR', payload: { vendorId: vendor.id, vendorName: vendor.name, vendorImage: vendor.image } });
        }

        setTags(prev => [...prev, item]);
        setDraggedItem(null);
        isDragging.value = false;
    };

    const handleSend = async () => {
        if (!inputText.trim() && tags.length === 0) return;

        const messageText = inputText.trim() || `I want to order ${tags.length} items from ${vendor.name}`;
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
                    vendor: vendor.name,
                    vendorId: vendor.id,
                    vendorImage: vendor.image || '',
                    image: item.image || item.productImage || '',
                }
            });
        });

        // 3. Initiate "Checking Availability" stage
        const checkMsg = createMessage(
            'Let me chcek the availabilities of the product',
            'bot',
            'checking_availability',
            { items: tags.map(t => ({ name: t.name || t.productName, vendorName: t.vendorName || vendor.name })) }
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
                        vendorName: t.vendorName || vendor.name,
                        vendorId: t.vendorId || vendor.id,
                        vendorImage: t.vendorImage || vendor.image,
                        productPrice: t.price,
                        productImage: t.image || t.productImage,
                    })),
                    total,
                    vendorName: vendor.name,
                    vendorImage: vendor.image
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
                        <Text style={styles.dragCardSubtext}>{vendor.name} • {formatCurrency(draggedItem.price)}</Text>
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
                <View style={styles.headerInfo}>
                    <Image
                        source={resolveImageSource(vendor.image)}
                        style={styles.vendorAvatar}
                        defaultSource={require('../../../assets/icon.png')}
                    />
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.vendorTitle}>{vendor.name}</Text>
                        <View style={styles.metaRow}>
                            <View style={styles.metaRatingContainer}>
                                <Svg width={14} height={14} viewBox="0 0 24 24" fill={Colors.brand.primary} stroke={Colors.brand.primary} strokeWidth={2}>
                                    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </Svg>
                                <Text style={styles.metaText}>{vendor.rating}</Text>
                            </View>
                            <Text style={styles.metaDot}>•</Text>
                            <View style={styles.metaDistanceContainer}>
                                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={Colors.light.textMuted} strokeWidth={2}>
                                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                    <Circle cx={12} cy={10} r={3} />
                                </Svg>
                                <Text style={styles.metaDistance}>{vendor.distance}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Products Grid */}
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionTitle}>Fresh Availability</Text>

                {vendorProducts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No products available right now</Text>
                        <Text style={styles.emptySubtext}>Check back soon for fresh arrivals!</Text>
                    </View>
                ) : (
                    <View style={styles.productGrid}>
                        {vendorProducts.map((product: Product) => (
                            <View key={product.id} style={styles.productCardWrapper}>
                                <DraggableItem
                                    productId={product.id}
                                    productName={product.name}
                                    productImage={product.image}
                                    vendor={{
                                        vendorId: vendor.id,
                                        vendorName: vendor.name,
                                        vendorImage: vendor.image,
                                        vendorRating: vendor.rating,
                                        vendorDistance: vendor.distance,
                                        price: product.prices[vendor.id],
                                    }}
                                    variant="grid"
                                    onDragStart={(item: any) => {
                                        setDraggedItem(item);
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
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

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
                                    <Text style={styles.inputTagText}>{tag.name}</Text>
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
        paddingBottom: 16,
        backgroundColor: Colors.light.background,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        zIndex: 10,
        gap: 16,
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
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    vendorAvatar: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: Colors.light.backgroundSecondary,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    headerTextContainer: {
        flex: 1,
    },
    vendorTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 20,
        color: Colors.light.text,
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaRatingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.brand.primarySoft,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    metaText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 12,
        color: Colors.brand.primary,
    },
    metaDot: {
        fontSize: 10,
        color: Colors.light.textMuted,
    },
    metaDistanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaDistance: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
    },
    sectionTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 18,
        color: Colors.light.text,
        marginBottom: Spacing.lg,
        opacity: 0.8,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 18,
        color: Colors.light.text,
        marginBottom: 8,
    },
    emptySubtext: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 14,
        color: Colors.light.textMuted,
    },
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    productCardWrapper: {
        width: (width - 48) / 2,
    },

    // Drag overlay
    dragOverlay: {
        position: 'absolute',
        zIndex: 1000,
        pointerEvents: 'none',
    },
    dragCard: {
        backgroundColor: Colors.brand.primary,
        borderRadius: BorderRadius['3xl'],
        padding: 12,
        ...Shadows.button,
        minWidth: 200,
    },
    dragCardText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 14,
        color: Colors.neutral.white,
        marginBottom: 4,
    },
    dragCardSubtext: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },

    // Bottom bar
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
    tagsContainer: {
        paddingBottom: 8,
        gap: 8,
    },
    inputTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.brand.primary,
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 12,
        gap: 8,
    },
    inputTagText: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 12,
        color: Colors.neutral.white,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    chatInput: {
        flex: 1,
        fontFamily: Typography.fontFamily.body,
        fontSize: 15,
        color: Colors.light.text,
        backgroundColor: Colors.neutral.white,
        borderRadius: 28,
        paddingHorizontal: 20,
        paddingVertical: 12,
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
});
