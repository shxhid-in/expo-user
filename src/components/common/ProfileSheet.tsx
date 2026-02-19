import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Pressable,
    ScrollView,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Shadows, BorderRadius, Spacing } from '../../theme';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAppState } from '../../store/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as storageService from '../../services/storage';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;

interface Props {
    isVisible: boolean;
    onClose: () => void;
    onOpenLocation?: () => void;
}

export default function ProfileSheet({ isVisible, onClose, onOpenLocation }: Props) {
    const { state, dispatch } = useAppState();
    const insets = useSafeAreaInsets();
    const user = state.user;

    const translateY = useSharedValue(SHEET_HEIGHT);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (isVisible) {
            opacity.value = withTiming(1, { duration: 300 });
            translateY.value = withTiming(0, {
                duration: 400,
                easing: Easing.out(Easing.cubic),
            });
        } else {
            opacity.value = withTiming(0, { duration: 250 });
            translateY.value = withTiming(SHEET_HEIGHT, {
                duration: 300,
                easing: Easing.in(Easing.cubic),
            });
        }
    }, [isVisible]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    const backdropStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    const handleLogout = async () => {
        await storageService.clearAll();
        dispatch({ type: 'LOGOUT' });
        onClose();
    };

    const memberDate = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    if (!isVisible && opacity.value === 0) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={isVisible ? 'auto' : 'none'}>
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            <Animated.View style={[styles.sheet, animatedStyle, { paddingBottom: insets.bottom }]}>
                <View style={styles.handle} />

                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile Context</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.light.text} strokeWidth={2.5}>
                            <Path d="M18 6L6 18M6 6l12 12" />
                        </Svg>
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Svg width={48} height={48} viewBox="0 0 24 24" fill={Colors.brand.primary} stroke="none">
                                    <Circle cx={12} cy={8} r={4} />
                                    <Path d="M20 21c0-4.418-3.582-8-8-8s-8 3.582-8 8" />
                                </Svg>
                            </View>
                            <View style={styles.avatarBadge}>
                                <Text style={styles.avatarBadgeIcon}>+</Text>
                            </View>
                        </View>
                        <Text style={styles.userName}>
                            {user?.firstName || 'User'} {user?.lastName || ''}
                        </Text>
                        <View style={styles.memberSince}>
                            <Text style={styles.memberText}>Member since {memberDate}</Text>
                        </View>
                    </View>

                    {/* Delivery Location Card */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2}>
                                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                    <Circle cx={12} cy={10} r={3} />
                                </Svg>
                            </View>
                            <View>
                                <Text style={styles.sectionTitle}>Delivery Location</Text>
                                <Text style={styles.sectionSubtitle}>PRIMARY CONTEXT</Text>
                            </View>
                        </View>

                        <View style={styles.locationContent}>
                            <Text style={styles.locationText}>{state.currentLocation}</Text>
                            <View style={styles.defaultBadge}>
                                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.changeButton}
                            onPress={() => {
                                if (onOpenLocation) {
                                    onClose();
                                    setTimeout(onOpenLocation, 300);
                                }
                            }}
                        >
                            <Text style={styles.changeButtonText}>Change Location</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Order History Card */}
                    <View style={styles.sectionCard}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionIcon}>
                                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth={2}>
                                    <Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                                    <Path d="M9 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2h-2A2 2 0 019 5z" />
                                </Svg>
                            </View>
                            <View>
                                <Text style={styles.sectionTitle}>Order History</Text>
                                <Text style={styles.sectionSubtitle}>
                                    {state.orderHistory.length} ORDER{state.orderHistory.length !== 1 ? 'S' : ''} PLACED
                                </Text>
                            </View>
                        </View>

                        {state.orderHistory.length === 0 ? (
                            <Text style={styles.emptyOrderText}>No orders yet. Start shopping!</Text>
                        ) : (
                            state.orderHistory.slice(0, 3).map((order) => (
                                <View key={order.id} style={styles.orderRow}>
                                    <View>
                                        <Text style={styles.orderIdText}>#{order.id}</Text>
                                        <Text style={styles.orderDateText}>{order.timestamp}</Text>
                                    </View>
                                    <Text style={styles.orderTotalText}>₹{order.total}</Text>
                                </View>
                            ))
                        )}
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2}>
                            <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                            <Path d="M16 17l5-5-5-5M21 12H9" />
                        </Svg>
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </ScrollView>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.light.background,
        borderTopLeftRadius: BorderRadius['4xl'],
        borderTopRightRadius: BorderRadius['4xl'],
        ...Shadows.cardHover,
        maxHeight: SHEET_HEIGHT,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.light.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    headerTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 22,
        color: Colors.light.text,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.light.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: Spacing.xl,
        paddingBottom: 40,
    },
    profileCard: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: BorderRadius['3xl'],
        padding: Spacing['2xl'],
        alignItems: 'center',
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: Spacing.xl,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.brand.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.brand.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.neutral.white,
    },
    avatarBadgeIcon: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 14,
        color: Colors.neutral.white,
    },
    userName: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 24,
        color: Colors.light.text,
        marginBottom: Spacing.sm,
    },
    memberSince: {
        backgroundColor: Colors.neutral.white,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    memberText: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    sectionCard: {
        backgroundColor: Colors.neutral.white,
        borderRadius: BorderRadius['3xl'],
        padding: Spacing.xl,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.light.border,
        ...Shadows.card,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: Spacing.lg,
    },
    sectionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.brand.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 16,
        color: Colors.light.text,
    },
    sectionSubtitle: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 10,
        color: Colors.brand.primary,
        letterSpacing: 1,
        marginTop: 2,
    },
    locationContent: {
        backgroundColor: Colors.light.backgroundSecondary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    locationText: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 14,
        color: Colors.light.text,
        lineHeight: 20,
        marginBottom: Spacing.xs,
    },
    defaultBadge: {
        backgroundColor: Colors.brand.primary,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
    },
    defaultBadgeText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 10,
        color: Colors.neutral.white,
        letterSpacing: 0.5,
    },
    changeButton: {
        borderWidth: 1.5,
        borderColor: Colors.brand.primary,
        borderRadius: BorderRadius['2xl'],
        paddingVertical: 10,
        alignItems: 'center',
    },
    changeButtonText: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 13,
        color: Colors.brand.primary,
    },
    emptyOrderText: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 13,
        color: Colors.light.textMuted,
        textAlign: 'center',
        paddingVertical: Spacing.xl,
    },
    orderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.light.border,
    },
    orderIdText: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 13,
        color: Colors.light.text,
    },
    orderDateText: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 11,
        color: Colors.light.textMuted,
        marginTop: 2,
    },
    orderTotalText: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 15,
        color: Colors.brand.primary,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: Colors.neutral.white,
        borderRadius: BorderRadius['3xl'],
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: '#FECACA',
        marginTop: Spacing.lg,
    },
    logoutText: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 15,
        color: '#EF4444',
    },
});
