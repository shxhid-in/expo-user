import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Pressable,
    ScrollView,
    Image,
    Alert,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    withTiming,
    withSpring,
    Easing,
    interpolate,
    Extrapolate,
    runOnJS,
    SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors, Typography, Shadows, BorderRadius, Spacing } from '../../theme';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAppState } from '../../store/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveImageSource } from '../../services/api';
import { formatCurrency } from '../../utils/formatting';
import DraggableItem from './DraggableItem';
import { Product, Vendor } from '../../types';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('screen');
const WINDOW_WIDTH = Math.min(SCREEN_WIDTH - 32, 450);
// Removed fixed WINDOW_HEIGHT constant to calculate dynamically inside

interface Props {
    isVisible: boolean;
    onClose: () => void;
    vendor: Vendor | null;
    onDragStart: (item: any) => void;
    onDragEnd: (x: number, y: number, item: any) => void;
    dragX: SharedValue<number>;
    dragY: SharedValue<number>;
}

export default function VendorSheet({ isVisible, onClose, vendor, onDragStart, onDragEnd, dragX, dragY }: Props) {
    const { state, dispatch } = useAppState();
    const insets = useSafeAreaInsets();

    // Calculate dynamic height to maintain uniform gaps at top and bottom
    const WINDOW_HEIGHT = useMemo(() => {
        const topSpace = insets.top + 20;
        const bottomSpace = insets.bottom + 100; // Uniform gap to chat bar
        const pillArea = 74; // Height of pill + margin
        return SCREEN_HEIGHT - topSpace - bottomSpace - pillArea;
    }, [insets]);

    const [activeVendor, setActiveVendor] = useState<Vendor | null>(vendor);
    const animation = useSharedValue(0);
    const [shouldRender, setShouldRender] = useState(isVisible);

    // Transition animations
    const contentTranslateX = useSharedValue(0);
    const contentOpacity = useSharedValue(1);
    const contentScale = useSharedValue(1);

    // Dummy shared values for DraggableItem props
    const dummyDragX = useSharedValue(0);
    const dummyDragY = useSharedValue(0);

    // Scroll tracking for full screen transition
    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const vendors = useMemo(() => state.marketData?.vendors || [], [state.marketData]);

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            scrollY.value = 0; // Reset scroll on open
            if (vendor) setActiveVendor(vendor);
            animation.value = 0;
            animation.value = withTiming(1, {
                duration: 600,
                easing: Easing.bezier(0.16, 1, 0.3, 1)
            });
        } else {
            animation.value = withTiming(0, {
                duration: 300,
                easing: Easing.out(Easing.quad)
            }, (finished) => {
                if (finished) {
                    runOnJS(setShouldRender)(false);
                }
            });
        }
    }, [isVisible, vendor]);

    const isLockRef = React.useRef(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Final cleanup after animation completes
    const onInteractionComplete = useCallback(() => {
        setIsTransitioning(false);
        isLockRef.current = false;
    }, []);

    const performTransition = useCallback((nextVendor: Vendor, direction: 'next' | 'prev') => {
        if (isLockRef.current) return;
        isLockRef.current = true;
        setIsTransitioning(true);

        const slideDistance = 140; // Increased for better look
        const outValue = direction === 'next' ? -slideDistance : slideDistance;

        // Phase 1: Rapid Exit
        contentOpacity.value = withTiming(0, { duration: 180 });
        contentTranslateX.value = withTiming(outValue, { duration: 180 });
        contentScale.value = withTiming(0.96, { duration: 180 });

        // Phase 2: Switch Vendor Mid-Air
        setTimeout(() => {
            setActiveVendor(nextVendor);
            contentTranslateX.value = -outValue; // Snap to opposite side
        }, 180);

        // Phase 3: Smooth Re-entry
        setTimeout(() => {
            contentOpacity.value = withTiming(1, { duration: 350 });
            contentTranslateX.value = withTiming(0, {
                duration: 400,
                easing: Easing.out(Easing.quad) // More stable than Easing.back for rapid changes
            }, (finished) => {
                if (finished) {
                    runOnJS(onInteractionComplete)();
                }
            });
            contentScale.value = withTiming(1, { duration: 350 });
        }, 220);
    }, [contentOpacity, contentTranslateX, contentScale, onInteractionComplete]);

    const handleNextVendor = useCallback(() => {
        const isLocked = state.cart.length > 0 || state.tags.length > 0;
        if (!activeVendor || vendors.length < 2 || isLocked) return;
        const currentIndex = vendors.findIndex(v => v.id === activeVendor.id);
        const nextIndex = (currentIndex + 1) % vendors.length;
        performTransition(vendors[nextIndex], 'next');
    }, [activeVendor, vendors, performTransition, state.cart.length, state.tags.length]);

    const handlePrevVendor = useCallback(() => {
        const isLocked = state.cart.length > 0 || state.tags.length > 0;
        if (!activeVendor || vendors.length < 2 || isLocked) return;
        const currentIndex = vendors.findIndex(v => v.id === activeVendor.id);
        const prevIndex = (currentIndex - 1 + vendors.length) % vendors.length;
        performTransition(vendors[prevIndex], 'prev');
    }, [activeVendor, vendors, performTransition, state.cart.length, state.tags.length]);

    const swipeGesture = Gesture.Pan()
        .onEnd((e) => {
            const isLocked = state.cart.length > 0 || state.tags.length > 0;
            if (isLocked) return;
            if (e.velocityX > 500) {
                runOnJS(handlePrevVendor)();
            } else if (e.velocityX < -500) {
                runOnJS(handleNextVendor)();
            }
        });

    const containerStyle = useAnimatedStyle(() => {
        return {
            paddingTop: insets.top + 20,
        };
    });

    const modalContentStyle = useAnimatedStyle(() => {
        return {
            width: WINDOW_WIDTH, // Locked to prevent Pill expansion
        };
    });

    const pillStyle = useAnimatedStyle(() => {
        const opacity = interpolate(animation.value, [0, 0.5, 1], [0, 1, 1], Extrapolate.CLAMP);
        const entryTranslateY = interpolate(animation.value, [0, 1], [-30, 0], Extrapolate.CLAMP);
        const scale = interpolate(animation.value, [0, 1], [0.9, 1], Extrapolate.CLAMP);

        return {
            opacity,
            transform: [{ translateY: entryTranslateY }, { scale }],
            borderRadius: 20, // Locked
            marginBottom: 10, // Locked
            borderBottomWidth: 1, // Locked
            zIndex: 10,
        };
    });

    const windowStyle = useAnimatedStyle(() => {
        const threshold = 450;
        const scale = interpolate(animation.value, [0, 1], [0.8, 1], Extrapolate.CLAMP);
        const opacity = interpolate(animation.value, [0, 0.4, 1], [0, 1, 1], Extrapolate.CLAMP);
        const entryTranslateY = interpolate(animation.value, [0, 1], [50, 0], Extrapolate.CLAMP);

        const width = interpolate(scrollY.value, [0, threshold], [WINDOW_WIDTH, SCREEN_WIDTH], Extrapolate.CLAMP);
        const targetHeight = SCREEN_HEIGHT + 100;
        const height = interpolate(scrollY.value, [0, threshold], [WINDOW_HEIGHT, targetHeight], Extrapolate.CLAMP);

        // Exact offset to pull the window to the very top of the screen
        const topOffset = interpolate(scrollY.value, [0, threshold], [0, -(insets.top + 20 + 74)], Extrapolate.CLAMP);

        return {
            opacity,
            height,
            width,
            top: topOffset,
            transform: [{ scale }, { translateY: entryTranslateY }],
            borderTopLeftRadius: interpolate(scrollY.value, [0, threshold], [BorderRadius['4xl'], 0], Extrapolate.CLAMP),
            borderTopRightRadius: interpolate(scrollY.value, [0, threshold], [BorderRadius['4xl'], 0], Extrapolate.CLAMP),
            borderBottomLeftRadius: interpolate(scrollY.value, [0, threshold], [BorderRadius['4xl'], 0], Extrapolate.CLAMP),
            borderBottomRightRadius: interpolate(scrollY.value, [0, threshold], [BorderRadius['4xl'], 0], Extrapolate.CLAMP),
            zIndex: 1,
        };
    });

    const contentAnimationStyle = useAnimatedStyle(() => {
        return {
            opacity: contentOpacity.value,
            transform: [
                { translateX: contentTranslateX.value },
                { scale: contentScale.value }
            ],
        };
    });

    const backdropStyle = useAnimatedStyle(() => {
        const extraDarken = interpolate(scrollY.value, [0, 450], [0, 0.15], Extrapolate.CLAMP);
        return { opacity: animation.value + extraDarken };
    });

    // Removed localized handleDrop as ChatScreen will manage state through onDragEnd

    const groupedProducts = useMemo(() => {
        if (!activeVendor) return {};
        const products = state.marketData?.products.filter((p: Product) =>
            p.prices[activeVendor.id] !== undefined
        ) || [];
        const groups: Record<string, Product[]> = {};
        products.forEach(p => {
            if (!groups[p.category]) groups[p.category] = [];
            groups[p.category].push(p);
        });
        return groups;
    }, [activeVendor, state.marketData]);

    const handleAddItem = (item: any) => {
        if (!activeVendor) return;

        // Tag on click
        dispatch({
            type: 'ADD_TAG',
            payload: {
                vendorId: activeVendor.id,
                vendorName: activeVendor.name,
                image: item.image || activeVendor.image,
                productId: item.id,
                productName: item.name,
                isProduct: true
            }
        });

        if (state.activeVendorId && state.activeVendorId !== activeVendor.id) {
            dispatch({ type: 'CLEAR_CART' });
            dispatch({ type: 'SET_ACTIVE_VENDOR', payload: { vendorId: activeVendor.id, vendorName: activeVendor.name, vendorImage: activeVendor.image } });
            dispatch({
                type: 'ADD_TO_CART',
                payload: {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    qty: 1,
                    weight: '1kg',
                    vendor: activeVendor.name,
                    vendorId: activeVendor.id,
                    vendorImage: activeVendor.image || '',
                    image: item.image || '',
                }
            });
            return;
        }
        if (!state.activeVendorId) {
            dispatch({ type: 'SET_ACTIVE_VENDOR', payload: { vendorId: activeVendor.id, vendorName: activeVendor.name, vendorImage: activeVendor.image } });
        }
        dispatch({
            type: 'ADD_TO_CART',
            payload: {
                id: item.id,
                name: item.name,
                price: item.price,
                qty: 1,
                weight: '1kg',
                vendor: activeVendor.name,
                vendorId: activeVendor.id,
                vendorImage: activeVendor.image || '',
                image: item.image || '',
            }
        });
    };

    if (!activeVendor || !shouldRender) return null;

    return (
        <View style={styles.root}>
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            <Animated.View style={[styles.container, containerStyle]}>
                <Animated.View style={[styles.modalContent, modalContentStyle]}>
                    <GestureDetector gesture={swipeGesture}>
                        <Animated.View style={[styles.vendorPill, pillStyle]}>
                            {!(state.cart.length > 0 || state.tags.length > 0) && (
                                <TouchableOpacity
                                    onPress={handlePrevVendor}
                                    style={styles.navButton}
                                    activeOpacity={0.6}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.light.text} strokeWidth={2.5}>
                                        <Path d="M15 18l-6-6 6-6" />
                                    </Svg>
                                </TouchableOpacity>
                            )}

                            <Animated.View style={[styles.pillCenter, contentAnimationStyle]}>
                                <Image source={resolveImageSource(activeVendor.image)} style={styles.pillAvatar} />
                                <View style={styles.pillNameContainer}>
                                    <Text style={styles.pillName} numberOfLines={1}>{activeVendor.name}</Text>
                                    <View style={styles.pillMeta}>
                                        <Svg width={10} height={10} viewBox="0 0 24 24" fill={Colors.brand.primary}>
                                            <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                        </Svg>
                                        <Text style={styles.pillRating}>{activeVendor.rating}</Text>
                                    </View>
                                </View>
                            </Animated.View>

                            <View style={styles.navGroup}>
                                {!(state.cart.length > 0 || state.tags.length > 0) && (
                                    <TouchableOpacity
                                        onPress={handleNextVendor}
                                        style={styles.navButton}
                                        activeOpacity={0.6}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.light.text} strokeWidth={2.5}>
                                            <Path d="M9 18l6-6-6-6" />
                                        </Svg>
                                    </TouchableOpacity>
                                )}
                                <View style={styles.pillDivider} />
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={styles.pillClose}
                                    activeOpacity={0.6}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.light.textMuted} strokeWidth={2.5}>
                                        <Path d="M18 6L6 18M6 6l12 12" />
                                    </Svg>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </GestureDetector>

                    <Animated.View style={[styles.window, windowStyle]}>
                        <Animated.View style={[styles.contentWrapper, contentAnimationStyle]}>
                            <Animated.ScrollView
                                contentContainerStyle={styles.scrollContent}
                                showsVerticalScrollIndicator={false}
                                onScroll={scrollHandler}
                                scrollEventThrottle={16}
                                bounces={false}
                            >
                                {Object.entries(groupedProducts).length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyText}>No items available</Text>
                                    </View>
                                ) : (
                                    Object.entries(groupedProducts).map(([category, products]) => (
                                        <View key={category} style={styles.categorySection}>
                                            <View style={styles.categoryHeader}>
                                                <Text style={styles.categoryTitle}>{category.toUpperCase()}</Text>
                                                <View style={styles.categoryLine} />
                                            </View>
                                            <View style={styles.productGrid}>
                                                {products.map((product) => (
                                                    <View key={product.id} style={styles.productWrapper}>
                                                        <DraggableItem
                                                            productId={product.id}
                                                            productName={product.name}
                                                            productImage={product.image}
                                                            vendor={{
                                                                vendorId: activeVendor.id,
                                                                vendorName: activeVendor.name,
                                                                vendorImage: activeVendor.image,
                                                                vendorRating: activeVendor.rating,
                                                                vendorDistance: activeVendor.distance,
                                                                price: product.prices[activeVendor.id],
                                                            }}
                                                            onDragStart={onDragStart}
                                                            onDragEnd={(x: number, y: number, item: any) => {
                                                                runOnJS(onDragEnd)(x, y, item);
                                                            }}
                                                            dragX={dragX}
                                                            dragY={dragY}
                                                            onSelect={() => handleAddItem(product)}
                                                            variant="grid"
                                                        />
                                                    </View>
                                                ))}
                                            </View>
                                        </View>
                                    ))
                                )}
                            </Animated.ScrollView>
                        </Animated.View>
                    </Animated.View>
                </Animated.View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 2000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        overflow: 'visible',
    },
    modalContent: {
        width: WINDOW_WIDTH,
        alignItems: 'center',
        overflow: 'visible',
    },
    vendorPill: {
        backgroundColor: Colors.neutral.white,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        ...Shadows.cardHover,
        borderWidth: 1,
        borderColor: Colors.light.border,
        width: '100%',
    },
    pillCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 8,
    },
    pillAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    pillNameContainer: {
        flex: 1,
        maxWidth: '65%',
        alignItems: 'center',
    },
    pillName: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 15,
        color: Colors.light.text,
        textAlign: 'center',
    },
    pillMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 2,
    },
    pillRating: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 11,
        color: Colors.brand.primary,
        textAlign: 'center',
    },
    navGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    navButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.light.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pillDivider: {
        width: 1,
        height: 24,
        backgroundColor: Colors.light.border,
        marginHorizontal: 4,
    },
    pillClose: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    window: {
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius['4xl'],
        width: '100%',
        overflow: 'hidden',
        ...Shadows.cardHover,
    },
    contentWrapper: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.xl,
        paddingBottom: 160, // Ensure items can clear the chat bar in full screen
    },
    categorySection: {
        marginBottom: 32,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    categoryTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 20,
        color: Colors.light.text,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    categoryLine: {
        flex: 1,
        height: 1,
        backgroundColor: Colors.light.border,
        opacity: 0.5,
    },
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 16,
    },
    productWrapper: {
        width: '48%',
    },
    emptyState: {
        padding: 60,
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: Typography.fontFamily.body,
        color: Colors.light.textMuted,
    },
});
