import * as React from 'react';
import { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Animated,
    Easing,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { Colors, Typography, Shadows, BorderRadius, Spacing } from '../../theme';
import { formatCurrency } from '../../utils/formatting';
import { resolveImageSource } from '../../services/api';
import Svg, { Path, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

// ========================================
// 1. CHECKING AVAILABILITY CARD
// ========================================
interface CheckingAvailabilityProps {
    items: { name: string; vendorName?: string }[];
}

export function CheckingAvailabilityCard({ items }: CheckingAvailabilityProps) {
    const fadeIn = useRef(new Animated.Value(0)).current;
    const [checkedItems, setCheckedItems] = React.useState<number[]>([]);

    useEffect(() => {
        Animated.timing(fadeIn, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        // Sequential checkmark simulation
        items.forEach((_, index) => {
            setTimeout(() => {
                setCheckedItems((prev: number[]) => [...prev, index]);
            }, (index + 1) * 600);
        });
    }, [items]);

    return (
        <Animated.View style={[styles.stageCard, styles.premiumCheckingCard, { opacity: fadeIn }]}>
            <View style={styles.premiumCheckingHeader}>
                <View style={styles.scanningIconContainer}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.neutral.white} strokeWidth={2}>
                        <Path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </Svg>
                    {/* Pulsing Scan Ring */}
                    <Animated.View style={styles.scanningPulse} />
                </View>
                <View>
                    <Text style={styles.premiumCheckingTitle}>Verifying Inventory</Text>
                    <Text style={styles.premiumCheckingSubtitle}>Checking real-time stock availability</Text>
                </View>
            </View>

            <View style={styles.premiumItemsList}>
                {items.map((item, idx) => {
                    const isChecked = checkedItems.includes(idx);
                    return (
                        <View key={idx} style={[styles.premiumCheckingItem, isChecked && styles.premiumCheckingItemChecked]}>
                            <View style={styles.itemCheckIcon}>
                                {isChecked ? (
                                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={Colors.status.success} strokeWidth={3}>
                                        <Path d="M20 6L9 17l-5-5" />
                                    </Svg>
                                ) : (
                                    <ActivityIndicator size="small" color={Colors.brand.primary} />
                                )}
                            </View>
                            <Text style={[styles.premiumCheckingItemName, isChecked && styles.premiumCheckingItemNameChecked]}>
                                {item.name}
                            </Text>
                            {isChecked && (
                                <View style={styles.availableBadge}>
                                    <Text style={styles.availableBadgeText}>AVAILABLE</Text>
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>
        </Animated.View>
    );
}

// ========================================
// 2. CONTACTING VENDOR CARD
// ========================================
interface ContactingVendorProps {
    vendorName: string;
    vendorImage?: string;
    onAccepted?: () => void;
}

export function ContactingVendorCard({ vendorName, vendorImage, onAccepted }: ContactingVendorProps) {
    const dotAnim1 = useRef(new Animated.Value(0)).current;
    const dotAnim2 = useRef(new Animated.Value(0)).current;
    const dotAnim3 = useRef(new Animated.Value(0)).current;
    const fadeIn = useRef(new Animated.Value(0)).current;
    const waveAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeIn, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();

        // Wave/ripple animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(waveAnim, { toValue: 1, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                Animated.timing(waveAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
            ])
        ).start();

        // Bouncing dots
        const animateDot = (anim: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, { toValue: -6, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ])
            );
        };

        animateDot(dotAnim1, 0).start();
        animateDot(dotAnim2, 150).start();
        animateDot(dotAnim3, 300).start();
    }, []);

    const waveScale = waveAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.5] });
    const waveOpacity = waveAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] });

    return (
        <Animated.View style={[styles.stageCard, styles.contactingCard, { opacity: fadeIn }]}>
            <View style={styles.contactingContent}>
                <View style={styles.vendorAvatarContainer}>
                    {/* Ripple effect */}
                    <Animated.View
                        style={[
                            styles.ripple,
                            { transform: [{ scale: waveScale }], opacity: waveOpacity },
                        ]}
                    />
                    <Image
                        source={vendorImage ? resolveImageSource(vendorImage) : require('../../../assets/icon.png')}
                        style={styles.contactingVendorAvatar}
                        defaultSource={require('../../../assets/icon.png')}
                    />
                </View>
                <Text style={styles.contactingTitle}>Contacting {vendorName}...</Text>
                <Text style={styles.contactingSubtext}>Waiting for vendor to accept your order</Text>
                <View style={styles.bouncingDots}>
                    <Animated.View style={[styles.bounceDot, { transform: [{ translateY: dotAnim1 }] }]} />
                    <Animated.View style={[styles.bounceDot, { transform: [{ translateY: dotAnim2 }] }]} />
                    <Animated.View style={[styles.bounceDot, { transform: [{ translateY: dotAnim3 }] }]} />
                </View>
            </View>
        </Animated.View>
    );
}

// ========================================
// 3. ORDER SUMMARY CARD (Enhanced with UPI/COD)
// ========================================
interface OrderSummaryCardProps {
    items: any[];
    total: number;
    vendorName?: string;
    onSelectUPI?: () => void;
    onSelectCOD?: () => void;
    onPlaceOrder?: () => void;
    paymentMethod?: 'upi' | 'cod' | null;
}

export function OrderSummaryCard({
    items,
    total,
    vendorName,
    onSelectUPI,
    onSelectCOD,
    onPlaceOrder,
    paymentMethod,
}: OrderSummaryCardProps) {
    const slideIn = useRef(new Animated.Value(40)).current;
    const fadeIn = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(slideIn, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.stageCard, styles.summaryCard, { opacity: fadeIn, transform: [{ translateY: slideIn }] }]}>
            {/* Header */}
            <View style={styles.summaryHeader}>
                <View style={styles.summaryIconBg}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.neutral.white} strokeWidth={2}>
                        <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 01-8 0" />
                    </Svg>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.summaryTitle} numberOfLines={1}>Order Summary</Text>
                    <Text style={styles.summarySubtitle} numberOfLines={1}>{items.length} {items.length === 1 ? 'item' : 'items'} from {new Set(items.map((i: any) => i.vendorName || vendorName)).size} shop{new Set(items.map((i: any) => i.vendorName || vendorName)).size > 1 ? 's' : ''}</Text>
                </View>
            </View>

            <View style={styles.dashedDivider} />

            {/* Vendor Badge */}
            <View style={styles.vendorBadgeContainer}>
                <View style={styles.vendorBadge}>
                    <Text style={styles.vendorBadgeText}>ORDERING FROM {vendorName?.toUpperCase()}</Text>
                </View>
            </View>

            {/* Items Card List */}
            <View style={styles.summaryItems}>
                {items.map((item: any, idx: number) => (
                    <View key={idx} style={styles.itemInnerCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Image
                                source={item.productImage ? resolveImageSource(item.productImage) : require('../../../assets/icon.png')}
                                style={styles.itemInnerImage}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemInnerName} numberOfLines={1}>{item.productName || item.name}</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.itemInnerWeight}>Weight: <Text style={{ fontFamily: Typography.fontFamily.bodySemiBold }}>{item.weight || '1kg'}</Text></Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={styles.qtyBubble}>
                                    <Text style={styles.qtyBubbleText}>×{item.qty || 1}</Text>
                                </View>
                                <Text style={styles.itemInnerPrice}>
                                    {formatCurrency(item.productPrice || item.price || 0)}
                                </Text>
                            </View>
                        </View>
                    </View>
                ))}
            </View>

            {/* Total Amount Row */}
            <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Total Amount</Text>
                <Text style={styles.summaryTotalValue}>{formatCurrency(total)}</Text>
            </View>

            {/* Payment Section */}
            <View style={styles.paymentSectionContainer}>
                <View style={styles.paymentInnerCard}>
                    <Text style={styles.paymentInnerTitle}>Select Payment Method</Text>
                    <View style={styles.paymentTilesRow}>
                        <TouchableOpacity
                            style={[styles.paymentTile, paymentMethod === 'upi' && styles.paymentTileActive]}
                            onPress={onSelectUPI}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.paymentTileIcon, paymentMethod === 'upi' && styles.paymentTileIconActive]}>
                                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={paymentMethod === 'upi' ? Colors.brand.primary : Colors.light.textMuted} strokeWidth={2}>
                                    <Path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </Svg>
                            </View>
                            <Text style={[styles.paymentTileText, paymentMethod === 'upi' && styles.paymentTileTextActive]}>UPI</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.paymentTile, paymentMethod === 'cod' && styles.paymentTileActive]}
                            onPress={onSelectCOD}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.paymentTileIcon, paymentMethod === 'cod' && styles.paymentTileIconActive]}>
                                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={paymentMethod === 'cod' ? Colors.brand.primary : Colors.light.textMuted} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                    <Path d="M6 3h12M6 8h12M14.5 21L6 13h4c6.667 0 8-3 8-5s-1.333-5-8-5" />
                                </Svg>
                            </View>
                            <Text style={[styles.paymentTileText, paymentMethod === 'cod' && styles.paymentTileTextActive]}>Cash on Delivery</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Process Button */}
            {paymentMethod && (
                <TouchableOpacity style={styles.placeOrderButton} onPress={onPlaceOrder} activeOpacity={0.8}>
                    <Text style={styles.placeOrderText}>
                        {paymentMethod === 'upi' ? 'Pay Now' : 'Place Order'}
                    </Text>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.neutral.white} strokeWidth={2.5}>
                        <Path d="M5 12h14M12 5l7 7-7 7" />
                    </Svg>
                </TouchableOpacity>
            )}
        </Animated.View>
    );
}

// ========================================
// 4. LIVE TRACKER CARD
// ========================================
interface LiveTrackerProps {
    currentStep: number; // 0=Confirmed, 1=Preparing, 2=Out for delivery, 3=Delivered
    vendorName?: string;
    estimatedTime?: string;
    orderId?: string;
}

const TRACKER_STEPS = [
    { label: 'Order Confirmed', icon: '✓', description: 'Vendor accepted your order' },
    { label: 'Preparing', icon: '🔪', description: 'Fresh items being prepared' },
    { label: 'Out for Delivery', icon: '🛵', description: 'On the way to you' },
    { label: 'Delivered', icon: '📦', description: 'Enjoy your fresh items!' },
];

export function LiveTrackerCard({ currentStep, vendorName, estimatedTime, orderId }: LiveTrackerProps) {
    const fadeIn = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        Animated.spring(progressAnim, { toValue: currentStep, friction: 8, useNativeDriver: false }).start();
    }, [currentStep]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 3],
        outputRange: ['8%', '100%'],
    });

    return (
        <Animated.View style={[styles.stageCard, styles.trackerCard, { opacity: fadeIn }]}>
            {/* Header */}
            <View style={styles.trackerHeader}>
                <View style={styles.trackerIconBg}>
                    <Text style={{ fontSize: 16 }}>📍</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.trackerTitle}>Live Tracking</Text>
                    {orderId && <Text style={styles.trackerOrderId}>Order #{orderId}</Text>}
                </View>
                {estimatedTime && (
                    <View style={styles.etaBadge}>
                        <Text style={styles.etaText}>{estimatedTime}</Text>
                    </View>
                )}
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
            </View>

            {/* Steps */}
            <View style={styles.trackerSteps}>
                {TRACKER_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                        <View key={idx} style={styles.trackerStepRow}>
                            <View style={[
                                styles.trackerStepDot,
                                isCompleted && styles.trackerStepDotCompleted,
                                isCurrent && styles.trackerStepDotCurrent,
                            ]}>
                                <Text style={[
                                    styles.trackerStepIcon,
                                    isCompleted && styles.trackerStepIconCompleted,
                                ]}>{step.icon}</Text>
                            </View>
                            <View style={styles.trackerStepInfo}>
                                <Text style={[
                                    styles.trackerStepLabel,
                                    isCompleted && styles.trackerStepLabelCompleted,
                                    isCurrent && styles.trackerStepLabelCurrent,
                                ]}>{step.label}</Text>
                                {isCurrent && (
                                    <Text style={styles.trackerStepDescription}>{step.description}</Text>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        </Animated.View>
    );
}

// ========================================
// 5. PARTNER ASSIGNMENT FLOW CARD (Merged)
// ========================================
export function PartnerAssignmentFlowCard({ vendorName }: { vendorName?: string }) {
    const [status, setStatus] = React.useState<'assigning' | 'assigned'>('assigning');

    // Animations
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Triple Ripples
    const ripple1 = useRef(new Animated.Value(0)).current;
    const ripple2 = useRef(new Animated.Value(0)).current;
    const ripple3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createRippleLoop = (anim: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    })
                ])
            );
        };

        const rippleLoops = [
            createRippleLoop(ripple1, 0),
            createRippleLoop(ripple2, 600),
            createRippleLoop(ripple3, 1200)
        ];

        rippleLoops.forEach(loop => loop.start());

        // Transition to Assigned after 4 seconds
        const timeout = setTimeout(() => {
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true })
            ]).start(() => {
                setStatus('assigned');
                Animated.parallel([
                    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                    Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true })
                ]).start();
            });
        }, 4000);

        return () => {
            clearTimeout(timeout);
            rippleLoops.forEach(loop => loop.stop());
        };
    }, []);

    const getRippleStyle = (anim: Animated.Value) => ({
        opacity: anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, 0.4, 0],
        }),
        transform: [{
            scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 2.5],
            })
        }]
    });

    if (status === 'assigning') {
        return (
            <Animated.View style={[styles.stageCard, styles.assigningCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                {/* Status Badge Top Right */}
                <View style={[styles.statusBadge, styles.assigningBadge]}>
                    <Text style={styles.assigningBadgeText}>ASSIGNING</Text>
                </View>

                <View style={styles.assigningHeader}>
                    <View style={styles.mapRadarContainer}>
                        {/* Realistic Multi-Layer Ripple */}
                        <Animated.View style={[styles.radarCircleRipple, getRippleStyle(ripple1)]} />
                        <Animated.View style={[styles.radarCircleRipple, getRippleStyle(ripple2)]} />
                        <Animated.View style={[styles.radarCircleRipple, getRippleStyle(ripple3)]} />

                        <View style={styles.radarCircle1} />
                        <View style={styles.radarCircle2} />

                        <View style={styles.centralAvatarBg}>
                            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth={2.5}>
                                <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                <Circle cx={12} cy={7} r={4} />
                            </Svg>
                        </View>
                    </View>
                </View>
                <View style={styles.assigningContent}>
                    <Text style={styles.assigningTitle}>Assigning Partner</Text>
                    <Text style={styles.assigningSubtitle}>Verifying partner availability...</Text>
                    <ActivityIndicator size="large" color={Colors.brand.primary} style={{ marginTop: 20 }} />
                </View>
            </Animated.View>
        );
    }

    // Assigned State
    return (
        <Animated.View style={[styles.stageCard, styles.assignedCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            {/* Status Badge Top Right */}
            <View style={[styles.statusBadge, styles.confirmedBadge]}>
                <Text style={styles.confirmedText}>CONFIRMED</Text>
            </View>

            <View style={styles.assignedHeaderOverlay}>
                <View style={styles.mapRadarContainer}>
                    <View style={styles.radarCircle1} />
                    <View style={styles.radarCircle2} />
                    <View style={styles.centralAvatarBg}>
                        <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth={2}>
                            <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                            <Circle cx={12} cy={7} r={4} />
                        </Svg>
                    </View>
                </View>
            </View>


            <View style={styles.assignedContent}>
                <Text style={styles.assignedTitle}>Partner Assigned!</Text>
                <Text style={styles.assignedSubtitle}>{vendorName || 'Partner'} has been assigned to your order.</Text>

                <Animated.View style={[styles.assignedCheckmark, { transform: [{ scale: fadeAnim }] }]}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.neutral.white} strokeWidth={3}><Path d="M20 6L9 17l-5-5" /></Svg>
                </Animated.View>
            </View>

            <View style={styles.driverCard}>
                <View style={styles.driverAvatar}>
                    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={Colors.neutral.white} strokeWidth={2}><Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><Circle cx={12} cy={7} r={4} /></Svg>
                </View>
                <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>Sarath is on the way</Text>
                    <View style={styles.driverMeta}>
                        <Svg width={12} height={12} viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B"><Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></Svg>
                        <Text style={styles.driverRating}>4.8</Text>
                        <View style={styles.driverBadge}>
                            <Text style={styles.driverBadgeText}>1000+ deliveries</Text>
                        </View>
                    </View>
                </View>
            </View>
        </Animated.View>
    );
}



// ========================================
// 7. ORDER TRACKING CARD (On The Way)
// ========================================
// ========================================
// 6. ORDER TRACKING CARD (Premium)
// ========================================
export function OrderTrackingCard() {
    const { width } = require('react-native').Dimensions.get('window');
    const [progress, setProgress] = React.useState(0);

    useEffect(() => {
        let p = 0;
        const interval = setInterval(() => {
            p += 0.005;
            if (p > 1) p = 1;
            setProgress(p);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    // Width calculation to fit within card padding
    // Card maxWidth is width * 0.9, Padding is XL (approx 24-32px)
    // Safe width is approx width * 0.65
    const sliderWidth = width * 0.65;
    const homePosition = sliderWidth; // Place home at the end of the track

    return (
        <View style={[styles.stageCard, styles.trackingCardPremium]}>
            <View style={styles.trackingHeaderPremium}>
                <View style={styles.trackingIconContainerPremium}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.neutral.white} strokeWidth={2}><Circle cx={12} cy={12} r={10} /><Path d="M12 6v6l4 2" /></Svg>
                </View>
                <View>
                    <Text style={styles.trackingTitlePremium}>On the way</Text>
                    <Text style={styles.trackingSubtitlePremium}>Arriving in 30 mins</Text>
                </View>
            </View>

            {/* Slider Section */}
            <View style={[styles.sliderContainerPremium, { width: sliderWidth, alignSelf: 'center' }]}>
                {/* Background Track */}
                <View style={[styles.sliderTrackPremium, { width: sliderWidth }]} />

                {/* Fill Track */}
                <View style={[styles.sliderFillPremium, { width: Math.min(progress * sliderWidth, homePosition) }]} />

                {/* Home Icon (Destination) */}
                <View style={[styles.sliderHomeIconPremium, { left: homePosition - 12 }]}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth={2}>
                        <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </Svg>
                </View>

                {/* Arrow Thumb (Premium replacement for vehicle) */}
                <View style={[styles.sliderThumbPremium, { left: progress * (sliderWidth - 24) }]}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M5 12h14m-4-4 4 4-4 4" />
                    </Svg>
                </View>
            </View>

            {/* Footer Text */}
            <View style={styles.trackingFooterPremium}>
                <Text style={[styles.trackingDistancePremium, { textAlign: 'center' }]}>PARTNER IS CURRENTLY 2.4KM AWAY</Text>
            </View>
        </View>
    );
}

// ==============================
// 8. ORDER CONFIRMED DETAIL CARD
// ==============================
interface OrderConfirmedDetailProps {
    orderId: string;
    items: any[];
    total: number;
    vendorName: string;
    deliveryAddress?: string;
}

export function OrderConfirmedDetailCard({
    orderId,
    items,
    total,
    vendorName,
    deliveryAddress = 'PALAKKAD, BEZGO HQ, NEAR SHADI MAHAL'
}: OrderConfirmedDetailProps) {
    const fadeIn = useRef(new Animated.Value(0)).current;
    const slideIn = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(slideIn, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.stageCard, styles.confirmedDetailCard, { opacity: fadeIn, transform: [{ translateY: slideIn }] }]}>
            {/* Header with Background */}
            <View style={styles.confirmedHeaderBg}>
                <View style={styles.confirmedIconContainer}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.neutral.white} strokeWidth={2}>
                        <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 01-8 0" />
                    </Svg>
                </View>
                <View style={styles.confirmedHeaderText}>
                    <Text style={styles.confirmedMainTitle}>Order Confirmed!</Text>
                    <Text style={styles.confirmedSubTitle}>Order #{orderId} • {items.length} {items.length === 1 ? 'Item' : 'Items'} from {new Set(items.map(i => i.vendorName || vendorName)).size} {new Set(items.map(i => i.vendorName || vendorName)).size === 1 ? 'Shop' : 'Shops'}</Text>
                </View>
            </View>

            {/* Vendor Confirmation Line */}
            <View style={styles.vendorConfirmLine}>
                <Text style={styles.vendorConfirmText}>CONFIRMED BY {vendorName.toUpperCase()} ✨</Text>
            </View>

            {/* Items List */}
            <View style={styles.confirmedItemsList}>
                {items.map((item, idx) => (
                    <View key={idx} style={styles.confirmedItemRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <View style={styles.confirmedItemIconContainer}>
                                <Image
                                    source={item.productImage ? resolveImageSource(item.productImage) : require('../../../assets/icon.png')}
                                    style={styles.confirmedItemImage}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.confirmedItemName} numberOfLines={2}>{item.productName || item.name}</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.confirmedItemWeight}>Weight: <Text style={{ fontWeight: '700' }}>{item.weight || '1kg'}</Text></Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={styles.confirmedItemQty}>
                                    <Text style={styles.confirmedItemQtyText}>×{item.qty || 1}</Text>
                                </View>
                                <Text style={styles.confirmedItemPrice}>{formatCurrency(item.productPrice || item.price || 0)}</Text>
                            </View>
                        </View>
                    </View>
                ))}
            </View>

            {/* Dash Divider */}
            <View style={styles.confirmedDashedLine} />

            {/* Grand Total */}
            <View style={styles.confirmedTotalRow}>
                <Text style={styles.confirmedTotalLabel}>Grand Total Paid</Text>
                <Text style={styles.confirmedTotalValue}>{formatCurrency(total)}</Text>
            </View>

            {/* Delivery Footer */}
            <View style={styles.deliveryFooter}>
                <Text style={styles.deliveryFooterText}>DELIVERING TO: {deliveryAddress.toUpperCase()}</Text>
            </View>
        </Animated.View>
    );
}

// ========================================
// 9. POST-DELIVERY SUMMARY CARD  
// ========================================
interface PostDeliveryProps {
    orderId: string;
    total: number;
    itemCount: number;
    vendorName: string;
    deliveryAddress?: string;
    timestamp?: string;
    onReorder?: () => void;
    onSupport?: () => void;
    onViewDetails?: () => void;
}

export function PostDeliveryCard({
    orderId,
    total,
    itemCount,
    vendorName,
    deliveryAddress = 'Palakkad, bezgo HQ, near Shadi Mahal',
    timestamp = '02:48 PM',
    onReorder,
    onSupport,
    onViewDetails
}: PostDeliveryProps) {
    const fadeIn = useRef(new Animated.Value(0)).current;
    const scaleIn = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(scaleIn, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.stageCard, styles.postDeliveryCardPremium, { opacity: fadeIn, transform: [{ scale: scaleIn }] }]}>
            {/* 1. Green Header */}
            <View style={styles.postDeliveryHeaderPremium}>
                <View style={styles.postDeliveryIconOutline}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3.5}>
                        <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                </View>
                <View>
                    <Text style={styles.postDeliveryTitlePremium}>Order Delivered</Text>
                    <Text style={styles.postDeliverySubtitlePremium}>#{orderId.toUpperCase()} • {timestamp}</Text>
                </View>
            </View>

            {/* 2. Content Details */}
            <View style={styles.postDeliveryBodyPremium}>
                <View style={styles.postDeliveryRowPremium}>
                    <Text style={styles.postDeliveryLabelPremium}>Shops</Text>
                    <Text style={styles.postDeliveryValuePremium}>{vendorName}</Text>
                </View>

                <View style={styles.postDeliveryRowPremium}>
                    <Text style={styles.postDeliveryLabelPremium}>Items</Text>
                    <Text style={styles.postDeliveryValuePremium}>{itemCount} Items Ordered</Text>
                </View>

                <View style={styles.postDeliveryRowPremium}>
                    <Text style={styles.postDeliveryLabelPremium}>Location</Text>
                    <Text style={[styles.postDeliveryValuePremium, styles.postDeliveryLocationText]}>
                        {deliveryAddress}
                    </Text>
                </View>
            </View>

            {/* 3. Action Buttons (Vertical Stack) */}
            <View style={styles.postDeliveryActionsVertical}>
                <TouchableOpacity style={styles.actionButtonReorder} onPress={onReorder}>
                    <View style={styles.actionButtonIcon}>
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                            <Path d="M1 4v6h6M23 20v-6h-6" strokeLinecap="round" strokeLinejoin="round" />
                            <Path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                    </View>
                    <Text style={styles.actionButtonTextPrimary}>Order Again / Help</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButtonDetails} onPress={onViewDetails}>
                    <View style={styles.actionButtonIcon}>
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth={2}>
                            <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                            <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                        </Svg>
                    </View>
                    <Text style={styles.actionButtonTextSecondary}>View details</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButtonSupport} onPress={onSupport}>
                    <View style={styles.actionButtonIcon}>
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2}>
                            <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </Svg>
                    </View>
                    <Text style={styles.actionButtonTextPrimary}>Complaint / Support</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

// ========================================
// STYLES
// ========================================
const styles = StyleSheet.create({
    // --- Base Stage Card ---
    stageCard: {
        backgroundColor: Colors.light.background,
        borderRadius: 18,
        padding: 12,
        marginBottom: 10,
        ...Shadows.card,
        width: '100%',
    },

    // --- Checking Availability (Premium) ---
    premiumCheckingCard: {
        width: '100%',
        backgroundColor: Colors.light.background,
        padding: 12,
        borderRadius: 18,
    },
    premiumCheckingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    scanningIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: Colors.brand.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanningPulse: {
        position: 'absolute',
        width: 28,
        height: 28,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: Colors.brand.primary,
        opacity: 0.3,
    },
    premiumCheckingTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 14,
        color: Colors.light.text,
    },
    premiumCheckingSubtitle: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 11,
        color: Colors.light.textMuted,
        marginTop: 1,
    },
    premiumItemsList: {
        gap: 6,
    },
    premiumCheckingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        backgroundColor: Colors.neutral.tealVeryLight,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 6,
    },
    premiumCheckingItemChecked: {
        backgroundColor: Colors.neutral.white,
        borderColor: Colors.status.success + '20',
    },
    itemCheckIcon: {
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    premiumCheckingItemName: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 11,
        color: Colors.light.textMuted,
        flex: 1,
    },
    premiumCheckingItemNameChecked: {
        color: Colors.light.text,
        fontFamily: Typography.fontFamily.heading,
    },
    availableBadge: {
        backgroundColor: Colors.status.successBg,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    availableBadgeText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 7,
        color: Colors.status.success,
    },

    // --- Contacting Vendor ---
    contactingCard: {
        alignItems: 'center',
        paddingVertical: 10,
        width: '100%',
    },
    contactingContent: {
        alignItems: 'center',
    },
    vendorAvatarContainer: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    ripple: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: Colors.brand.primary,
    },
    contactingVendorAvatar: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: Colors.light.backgroundSecondary,
    },
    contactingTitle: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 13,
        color: Colors.light.text,
        marginBottom: 2,
    },
    contactingSubtext: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 11,
        color: Colors.light.textMuted,
        marginBottom: 8,
    },
    bouncingDots: {
        flexDirection: 'row',
        gap: 6,
    },
    bounceDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.brand.primary,
    },

    // --- Order Summary ---
    summaryCard: {
        width: '100%',
        padding: 0,
        overflow: 'hidden',
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 18,
        backgroundColor: Colors.light.background,
    },
    summaryIconBg: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: Colors.brand.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 14,
        color: Colors.light.text,
    },
    summarySubtitle: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 11,
        color: Colors.light.textMuted,
        marginTop: 0,
    },
    dashedDivider: {
        height: 1,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderStyle: 'dashed',
        marginHorizontal: 12,
        marginBottom: 10,
    },
    vendorBadgeContainer: {
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    vendorBadge: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.brand.primarySoft,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 4,
    },
    vendorBadgeText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 8,
        color: Colors.brand.primary,
        letterSpacing: 0.2,
    },
    summaryItems: {
        paddingHorizontal: 16,
        gap: 10,
    },
    itemInnerCard: {
        backgroundColor: Colors.light.backgroundSecondary,
        padding: 16,
        borderRadius: 14,
        gap: 10,
    },
    itemInnerImage: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: Colors.neutral.white,
    },
    itemInnerInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    itemInnerName: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 13,
        color: Colors.light.text,
        textAlign: 'left',
    },
    itemInnerWeight: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 10,
        color: Colors.light.textMuted,
        marginTop: 0,
    },
    qtyBubble: {
        backgroundColor: '#E2F2F2',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BorderRadius.full,
    },
    qtyBubbleText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 9,
        color: Colors.brand.primary,
    },
    itemInnerPrice: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 13,
        color: Colors.light.text,
    },
    summaryTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.light.borderLight,
        marginTop: 8,
    },
    summaryTotalLabel: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 13,
        color: '#64748B',
    },
    summaryTotalValue: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 20,
        color: Colors.brand.primary,
    },

    // Payment Options
    paymentSectionContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    paymentInnerCard: {
        backgroundColor: '#FCFCFD',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
    },
    paymentInnerTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 11,
        color: Colors.light.text,
        marginBottom: 6,
    },
    paymentTilesRow: {
        flexDirection: 'row',
        gap: 8,
    },
    paymentTile: {
        flex: 1,
        aspectRatio: 1.5,
        backgroundColor: Colors.neutral.white,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.light.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    },
    paymentTileActive: {
        borderColor: Colors.brand.primarySoft,
        backgroundColor: '#F0F9F9',
    },
    paymentTileIcon: {
        width: 24,
        height: 24,
        borderRadius: 6,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    paymentTileIconActive: {
        backgroundColor: Colors.neutral.white,
    },
    paymentTileText: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 9,
        color: '#64748B',
        textAlign: 'center',
    },
    paymentTileTextActive: {
        color: Colors.brand.primary,
    },
    placeOrderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginHorizontal: 8,
        marginBottom: 8,
        paddingVertical: 8,
        backgroundColor: Colors.brand.primary,
        borderRadius: 10,
    },
    placeOrderText: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 12,
        color: Colors.neutral.white,
    },
    trackerCard: {
        width: '100%',
        padding: 12,
    },
    trackerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    trackerIconBg: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: Colors.brand.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackerTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 15,
        color: Colors.light.text,
    },
    trackerOrderId: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 11,
        color: Colors.light.textMuted,
        marginTop: 1,
    },
    etaBadge: {
        backgroundColor: Colors.status.successBg,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    etaText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 10,
        color: Colors.status.success,
    },
    progressBarBg: {
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.light.backgroundSecondary,
        marginBottom: 10,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2,
        backgroundColor: Colors.brand.primary,
    },
    trackerSteps: {
        gap: 4,
    },
    trackerStepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingVertical: 4,
    },
    trackerStepDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.light.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackerStepDotCompleted: {
        backgroundColor: Colors.brand.primarySoft,
    },
    trackerStepDotCurrent: {
        backgroundColor: Colors.brand.primary,
        ...Shadows.button,
    },
    trackerStepIcon: {
        fontSize: 10,
        opacity: 0.3,
    },
    trackerStepIconCompleted: {
        opacity: 1,
    },
    trackerStepInfo: {
        flex: 1,
        paddingTop: 4,
    },
    trackerStepLabel: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 13,
        color: Colors.light.textMuted,
    },
    trackerStepLabelCompleted: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        color: Colors.light.text,
    },
    trackerStepLabelCurrent: {
        fontFamily: Typography.fontFamily.heading,
        color: Colors.brand.primary,
    },
    trackerStepDescription: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 10,
        color: Colors.light.textMuted,
        marginTop: 1,
    },

    // --- Post Delivery (Premium Screen Style) ---
    postDeliveryCardPremium: {
        width: '100%',
        padding: 0,
        backgroundColor: Colors.neutral.white,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        borderRadius: 18,
    },
    postDeliveryHeaderPremium: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#10B981',
        gap: 10,
    },
    postDeliveryIconOutline: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    postDeliveryTitlePremium: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 14,
        color: Colors.neutral.white,
    },
    postDeliverySubtitlePremium: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 1,
    },
    postDeliveryBodyPremium: {
        padding: 10,
        gap: 8,
    },
    postDeliveryRowPremium: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    postDeliveryLabelPremium: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 11,
        color: '#64748B',
    },
    postDeliveryValuePremium: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 11,
        color: '#1E293B',
        textAlign: 'right',
    },
    postDeliveryLocationText: {
        flex: 1,
        marginLeft: 32,
        lineHeight: 18,
    },
    postDeliveryActionsVertical: {
        padding: 8,
        paddingTop: 0,
        gap: 5,
    },
    actionButtonReorder: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        backgroundColor: '#008080',
        borderRadius: 10,
        gap: 6,
    },
    actionButtonDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        gap: 6,
    },
    actionButtonSupport: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        backgroundColor: '#EF4444',
        borderRadius: 10,
        gap: 6,
    },
    actionButtonIcon: {
        width: 20,
        alignItems: 'center',
    },
    actionButtonTextPrimary: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 11,
        color: Colors.neutral.white,
    },
    actionButtonTextSecondary: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 11,
        color: '#475569',
    },

    // --- Assigning & Assigned & Tracking Shared Styles ---
    mapRadarContainer: {
        width: width * 0.4,
        height: width * 0.4,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 4,
    },
    radarCircle1: {
        position: 'absolute',
        width: '90%',
        height: '90%',
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(0,128,128, 0.05)',
    },
    radarCircle2: {
        position: 'absolute',
        width: '60%',
        height: '60%',
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(0,128,128, 0.1)',
    },
    centralAvatarBg: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.light.background,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.card,
        zIndex: 10,
    },

    // Assigning
    assigningCard: {
        alignItems: 'center',
        paddingVertical: 12,
        width: '100%',
        paddingHorizontal: 12,
        minHeight: 180,
        justifyContent: 'center',
    },
    assigningHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    statusBadge: {
        position: 'absolute',
        top: 24,
        right: 24,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        zIndex: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    assigningBadge: {
        backgroundColor: '#FEF3C7',
        borderColor: 'rgba(217, 119, 6, 0.2)',
    },
    assigningBadgeText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 10,
        color: '#D97706',
        letterSpacing: 0.8,
    },
    assigningContent: {
        alignItems: 'center',
    },
    assigningTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 14,
        color: Colors.light.text,
        marginBottom: 4,
    },
    assigningSubtitle: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 11,
        color: Colors.brand.primary,
        opacity: 0.8,
    },
    radarCircleRipple: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: Colors.brand.primary,
        backgroundColor: Colors.brand.primarySoft,
    },

    // Assigned
    assignedCard: {
        alignItems: 'center',
        paddingVertical: 12,
        width: '100%',
        paddingHorizontal: 12,
        minHeight: 180,
        justifyContent: 'space-between',
    },
    assignedHeaderOverlay: {
        alignItems: 'center',
        marginBottom: 8,
    },
    assignedContent: {
        alignItems: 'center',
        marginBottom: 12,
    },
    assignedTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 14,
        color: Colors.light.text,
        marginBottom: 4,
    },
    assignedSubtitle: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 11,
        color: Colors.brand.primary,
        opacity: 0.8,
        textAlign: 'center',
    },
    confirmedBadge: {
        backgroundColor: '#E6FFFA', // Light mint
        borderColor: 'rgba(0, 128, 128, 0.15)',
    },
    confirmedText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 10,
        color: '#008080',
        letterSpacing: 0.8,
    },


    assignedCheckmark: {
        marginTop: 20,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.status.success,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.button,
    },
    driverCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDFA',
        padding: 16,
        borderRadius: 24,
        width: '100%',
        borderWidth: 1,
        borderColor: '#CCFBF1',
    },
    driverAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.brand.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    driverInfo: {
        flex: 1,
    },
    driverName: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 16,
        color: Colors.light.text,
        marginBottom: 4,
    },
    driverMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    driverRating: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 13,
        color: Colors.light.text,
    },
    driverBadge: {
        backgroundColor: '#CCFBF1',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    driverBadgeText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 11,
        color: Colors.brand.primary,
    },

    // Tracking
    trackingCard: {
        padding: 10,
        width: '100%',
    },
    trackingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    trackingIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: Colors.brand.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackingTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 12,
        color: Colors.light.text,
    },
    trackingSubtitle: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 11,
        color: Colors.light.textMuted,
    },
    sliderContainer: {
        height: 40,
        justifyContent: 'center',
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    sliderTrack: {
        position: 'absolute',
        top: 18,
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#F3F4F6',
        borderRadius: 2,
    },
    sliderFill: {
        position: 'absolute',
        top: 18,
        left: 0,
        height: 4,
        backgroundColor: 'rgba(0,128,128,0.3)', // Fade tail
        borderRadius: 2,
    },
    sliderThumb: {
        position: 'absolute',
        top: 0,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -20, // Centre
    },
    sliderHomeIcon: {
        position: 'absolute',
        top: 10,
        right: 0,
        width: 20,
        height: 20,
    },
    trackingFooter: {
        alignItems: 'center',
        gap: 12,
    },
    trackingProgressBarBase: {
        width: '100%',
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    trackingProgressBarFill: {
        height: '100%',
        backgroundColor: Colors.brand.primary,
        borderRadius: 3,
    },
    trackingDistance: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 11,
        color: Colors.light.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    // --- Assigned (New) ---
    assignedTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 20,
    },
    mapRadarContainerSmall: {
        width: 80,
        height: 80,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radarCircleSmall: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 1,
        borderColor: 'rgba(0,128,128, 0.1)',
        backgroundColor: 'rgba(0,128,128, 0.05)',
    },
    centralAvatarBgSmall: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.light.background,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.button,
    },

    // --- Premium Tracking (Swiggy/Uber Style) ---
    trackingCardPremium: {
        width: '100%',
        padding: 12,
        backgroundColor: Colors.neutral.white,
        borderRadius: 18,
        overflow: 'hidden',
    },
    trackingHeaderPremium: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    trackingIconContainerPremium: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: Colors.brand.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackingTitlePremium: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 14,
        color: Colors.light.text,
    },
    trackingSubtitlePremium: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 11,
        color: Colors.light.textMuted,
        marginTop: 1,
    },

    // Slider
    sliderContainerPremium: {
        height: 40,
        justifyContent: 'center',
        marginBottom: 40,
        marginTop: 10,
        paddingHorizontal: 0,
    },
    sliderTrackPremium: {
        position: 'absolute',
        top: 18.5,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#F1F5F9',
        borderRadius: 1.5,
    },
    sliderFillPremium: {
        position: 'absolute',
        top: 18.5,
        left: 0,
        height: 3,
        backgroundColor: 'rgba(0,128,128, 0.4)',
        borderRadius: 1.5,
    },
    sliderHomeIconPremium: {
        position: 'absolute',
        top: 8,
        marginLeft: -12,
        backgroundColor: 'transparent',
    },
    sliderThumbPremium: {
        position: 'absolute',
        top: 8,
        marginLeft: 0,
        backgroundColor: 'transparent',
    },

    // Footer
    trackingFooterPremium: {
        marginTop: 10,
    },
    distanceProgressBar: {
        width: 140,
        height: 6,
        backgroundColor: Colors.brand.primary,
        borderRadius: 3,
        marginBottom: 12,
    },
    distanceProgressFill: {
        // This is actually static in the screenshot, or visually just a bar
        // I'll interpret "distanceProgressBar" as the green bar line.
        // We'll just style the bar itself as the green line.
    },
    trackingDistancePremium: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 11,
        color: '#64748B',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },

    // --- Order Confirmed Detail (Screenshot style) ---
    confirmedDetailCard: {
        width: '100%',
        padding: 0,
        backgroundColor: Colors.neutral.white,
        borderWidth: 1,
        borderColor: '#E6FFFA',
        overflow: 'hidden',
        borderRadius: 18,
    },
    confirmedHeaderBg: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        margin: 4,
        borderRadius: 10,
        backgroundColor: '#F0FDF4',
        gap: 6,
    },
    confirmedIconContainer: {
        width: 26,
        height: 26,
        borderRadius: 8,
        backgroundColor: '#22C55E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmedHeaderText: {
        flex: 1,
    },
    confirmedMainTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 14,
        color: '#15803D',
        marginBottom: 0,
    },
    confirmedSubTitle: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 10,
        color: '#64748B',
    },
    vendorConfirmLine: {
        paddingHorizontal: 10,
        marginBottom: 6,
    },
    vendorConfirmText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 8,
        color: '#166534',
        letterSpacing: 0.5,
    },
    confirmedItemsList: {
        paddingHorizontal: 10,
        gap: 4,
        marginBottom: 8,
    },
    confirmedItemRow: {
        backgroundColor: '#F8FAFC',
        padding: 6,
        borderRadius: 8,
        gap: 4,
    },
    confirmedItemIconContainer: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: Colors.neutral.white,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    confirmedItemImage: {
        width: '100%',
        height: '100%',
    },
    confirmedItemInfo: {
        flex: 1,
    },
    confirmedItemName: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 11,
        color: Colors.light.text,
    },
    confirmedItemWeight: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 9,
        color: Colors.light.textMuted,
    },
    confirmedItemQty: {
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
    },
    confirmedItemQtyText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 9,
        color: '#64748B',
    },
    confirmedItemPrice: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 13,
        color: Colors.light.text,
    },
    confirmedDashedLine: {
        height: 1,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        marginHorizontal: 8,
        marginBottom: 8,
    },
    confirmedTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
        marginBottom: 6,
    },
    confirmedTotalLabel: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 13,
        color: '#64748B',
    },
    confirmedTotalValue: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 18,
        color: '#22C55E',
    },
    deliveryFooter: {
        backgroundColor: '#F0FDF4',
        padding: 8,
        margin: 4,
        borderRadius: 10,
        alignItems: 'center',
    },
    deliveryFooterText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 11,
        color: '#16A34A',
        textAlign: 'center',
        letterSpacing: 0.3,
        lineHeight: 16,
    },
});
