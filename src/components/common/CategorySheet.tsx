import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Pressable,
    Image,
    Alert,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    withTiming,
    Easing,
    interpolate,
    Extrapolate,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors, Typography, Shadows, BorderRadius, Spacing } from '../../theme';
import Svg, { Path } from 'react-native-svg';
import { useAppState } from '../../store/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveImageSource } from '../../services/api';
import DraggableItem from './DraggableItem';
import { Product, Vendor } from '../../types';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('screen');
const WINDOW_WIDTH = Math.min(SCREEN_WIDTH - 32, 450);

const CATEGORIES = [
    { name: 'Chicken', key: 'poultry', image: require('../../../assets/Chicekn curry cut.jpg') },
    { name: 'Mutton', key: 'mutton', image: require('../../../assets/Mutton Ribbs.jpg') },
    { name: 'Beef', key: 'beef', image: require('../../../assets/beef boneless.jpg') },
    { name: 'Fish', key: 'fish', image: require('../../../assets/Mackerel.png') },
    { name: 'Seafood', key: 'seafood', image: require('../../../assets/Tiger prawns.png') },
    { name: 'Steak Fishes', key: 'steak_fishes', image: require('../../../assets/salmon.jpg') },
];

interface Category {
    name: string;
    key: string;
    image: any;
}

interface Props {
    isVisible: boolean;
    onClose: () => void;
    categoryKey: string | null;
}

export default function CategorySheet({ isVisible, onClose, categoryKey }: Props) {
    const { state, dispatch } = useAppState();
    const insets = useSafeAreaInsets();

    const initialCategory = useMemo(() =>
        CATEGORIES.find(c => c.key === categoryKey) || CATEGORIES[0],
        [categoryKey]);

    const [activeCategory, setActiveCategory] = useState<Category>(initialCategory);

    // Update active category when categoryKey changes externally
    useEffect(() => {
        if (categoryKey) {
            const found = CATEGORIES.find(c => c.key === categoryKey);
            if (found) setActiveCategory(found);
        }
    }, [categoryKey]);

    const WINDOW_HEIGHT = useMemo(() => {
        const topSpace = insets.top + 20;
        const bottomSpace = insets.bottom + 100;
        const pillArea = 74;
        return SCREEN_HEIGHT - topSpace - bottomSpace - pillArea;
    }, [insets]);

    const animation = useSharedValue(0);
    const [shouldRender, setShouldRender] = useState(isVisible);

    const contentTranslateX = useSharedValue(0);
    const contentOpacity = useSharedValue(1);
    const contentScale = useSharedValue(1);

    // Dummy shared values for DraggableItem props
    const dummyDragX = useSharedValue(0);
    const dummyDragY = useSharedValue(0);

    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            scrollY.value = 0;
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
    }, [isVisible]);

    const isLockRef = React.useRef(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const onInteractionComplete = useCallback(() => {
        setIsTransitioning(false);
        isLockRef.current = false;
    }, []);

    const performTransition = useCallback((nextCat: Category, direction: 'next' | 'prev') => {
        if (isLockRef.current) return;
        isLockRef.current = true;
        setIsTransitioning(true);

        const slideDistance = 140;
        const outValue = direction === 'next' ? -slideDistance : slideDistance;

        contentOpacity.value = withTiming(0, { duration: 180 });
        contentTranslateX.value = withTiming(outValue, { duration: 180 });
        contentScale.value = withTiming(0.96, { duration: 180 });

        setTimeout(() => {
            setActiveCategory(nextCat);
            contentTranslateX.value = -outValue;
        }, 180);

        setTimeout(() => {
            contentOpacity.value = withTiming(1, { duration: 350 });
            contentTranslateX.value = withTiming(0, {
                duration: 400,
                easing: Easing.out(Easing.quad)
            }, (finished) => {
                if (finished) {
                    runOnJS(onInteractionComplete)();
                }
            });
            contentScale.value = withTiming(1, { duration: 350 });
        }, 220);
    }, [contentOpacity, contentTranslateX, contentScale, onInteractionComplete]);

    const handleNextCategory = useCallback(() => {
        const currentIndex = CATEGORIES.findIndex(c => c.key === activeCategory.key);
        const nextIndex = (currentIndex + 1) % CATEGORIES.length;
        performTransition(CATEGORIES[nextIndex], 'next');
    }, [activeCategory, performTransition]);

    const handlePrevCategory = useCallback(() => {
        const currentIndex = CATEGORIES.findIndex(c => c.key === activeCategory.key);
        const prevIndex = (currentIndex - 1 + CATEGORIES.length) % CATEGORIES.length;
        performTransition(CATEGORIES[prevIndex], 'prev');
    }, [activeCategory, performTransition]);

    const swipeGesture = Gesture.Pan()
        .onEnd((e) => {
            if (e.velocityX > 500) {
                runOnJS(handlePrevCategory)();
            } else if (e.velocityX < -500) {
                runOnJS(handleNextCategory)();
            }
        });

    const containerStyle = useAnimatedStyle(() => ({
        paddingTop: insets.top + 20,
    }));

    const modalContentStyle = useAnimatedStyle(() => ({
        width: WINDOW_WIDTH,
    }));

    const pillStyle = useAnimatedStyle(() => {
        const opacity = interpolate(animation.value, [0, 0.5, 1], [0, 1, 1], Extrapolate.CLAMP);
        const entryTranslateY = interpolate(animation.value, [0, 1], [-30, 0], Extrapolate.CLAMP);
        const scale = interpolate(animation.value, [0, 1], [0.9, 1], Extrapolate.CLAMP);
        return {
            opacity,
            transform: [{ translateY: entryTranslateY }, { scale }],
            borderRadius: 20,
            marginBottom: 10,
            borderBottomWidth: 1,
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

    const contentAnimationStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
        transform: [
            { translateX: contentTranslateX.value },
            { scale: contentScale.value }
        ],
    }));

    const backdropStyle = useAnimatedStyle(() => {
        const extraDarken = interpolate(scrollY.value, [0, 450], [0, 0.15], Extrapolate.CLAMP);
        return { opacity: animation.value + extraDarken };
    });

    const groupedProducts = useMemo(() => {
        const products = state.marketData?.products.filter((p: Product) => p.category === activeCategory.key) || [];
        const groups: Record<string, { products: Product[], vendor: Vendor }> = {};

        products.forEach(p => {
            Object.keys(p.prices).forEach(vendorId => {
                const vendor = state.marketData?.vendors.find(v => v.id === vendorId);
                if (vendor) {
                    if (!groups[vendorId]) {
                        groups[vendorId] = { products: [], vendor };
                    }
                    groups[vendorId].products.push(p);
                }
            });
        });
        return groups;
    }, [activeCategory, state.marketData]);

    const handleAddItem = (item: any, v: Vendor) => {
        if (state.activeVendorId && state.activeVendorId !== v.id) {
            Alert.alert(
                'Different Vendor',
                `You already have items from ${state.activeVendorName || 'another vendor'}. Clear your cart to order from ${v.name}.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Clear & Add',
                        style: 'destructive',
                        onPress: () => {
                            dispatch({ type: 'CLEAR_CART' });
                            dispatch({ type: 'SET_ACTIVE_VENDOR', payload: { vendorId: v.id, vendorName: v.name, vendorImage: v.image } });
                            dispatch({
                                type: 'ADD_TO_CART',
                                payload: {
                                    id: item.id,
                                    name: item.name,
                                    price: item.prices[v.id],
                                    qty: 1,
                                    weight: '1kg',
                                    vendor: v.name,
                                    vendorId: v.id,
                                    vendorImage: v.image || '',
                                    image: item.image || '',
                                }
                            });
                        },
                    },
                ]
            );
            return;
        }
        if (!state.activeVendorId) {
            dispatch({ type: 'SET_ACTIVE_VENDOR', payload: { vendorId: v.id, vendorName: v.name, vendorImage: v.image } });
        }
        dispatch({
            type: 'ADD_TO_CART',
            payload: {
                id: item.id,
                name: item.name,
                price: item.prices[v.id],
                qty: 1,
                weight: '1kg',
                vendor: v.name,
                vendorId: v.id,
                vendorImage: v.image || '',
                image: item.image || '',
            }
        });
    };

    if (!shouldRender) return null;

    return (
        <View style={styles.root}>
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            <Animated.View style={[styles.container, containerStyle]}>
                <Animated.View style={[styles.modalContent, modalContentStyle]}>
                    <GestureDetector gesture={swipeGesture}>
                        <Animated.View style={[styles.vendorPill, pillStyle]}>
                            <TouchableOpacity onPress={handlePrevCategory} style={styles.navButton}>
                                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.light.text} strokeWidth={2.5}>
                                    <Path d="M15 18l-6-6 6-6" />
                                </Svg>
                            </TouchableOpacity>

                            <Animated.View style={[styles.pillCenter, contentAnimationStyle]}>
                                <Image source={activeCategory.image} style={styles.pillAvatar} />
                                <View style={styles.pillNameContainer}>
                                    <Text style={styles.pillName} numberOfLines={1}>{activeCategory.name}</Text>
                                    <Text style={styles.pillSubtext}>{Object.keys(groupedProducts).length} Shops nearby</Text>
                                </View>
                            </Animated.View>

                            <View style={styles.navGroup}>
                                <TouchableOpacity onPress={handleNextCategory} style={styles.navButton}>
                                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.light.text} strokeWidth={2.5}>
                                        <Path d="M9 18l6-6-6-6" />
                                    </Svg>
                                </TouchableOpacity>
                                <View style={styles.pillDivider} />
                                <TouchableOpacity onPress={onClose} style={styles.pillClose}>
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
                                        <Text style={styles.emptyText}>No items available in this category</Text>
                                    </View>
                                ) : (
                                    Object.entries(groupedProducts).map(([vendorId, { products, vendor }]) => (
                                        <View key={vendorId} style={styles.categorySection}>
                                            <View style={styles.categoryHeader}>
                                                <Image source={resolveImageSource(vendor.image)} style={styles.vendorIcon} />
                                                <Text style={styles.categoryTitle}>{vendor.name.toUpperCase()}</Text>
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
                                                                vendorId: vendor.id,
                                                                vendorName: vendor.name,
                                                                vendorImage: vendor.image,
                                                                vendorRating: vendor.rating,
                                                                vendorDistance: vendor.distance,
                                                                price: product.prices[vendor.id],
                                                            }}
                                                            variant="grid"
                                                            onDragStart={() => { }}
                                                            onDragEnd={() => { }}
                                                            dragX={dummyDragX}
                                                            dragY={dummyDragY}
                                                            onSelect={() => handleAddItem(product, vendor)}
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
    pillSubtext: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 10,
        color: Colors.light.textMuted,
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
        paddingBottom: 160,
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
    vendorIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
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
