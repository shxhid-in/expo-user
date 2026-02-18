import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';
import { useAppState } from '../../store/AppContext';
import { Colors, Typography, Shadows, BorderRadius, Spacing } from '../../theme';
import * as storageService from '../../services/storage';
import Svg, { Path, Circle } from 'react-native-svg';

type Props = {
    navigation: NativeStackNavigationProp<MainStackParamList, 'Profile'>;
};

export default function ProfileScreen({ navigation }: Props) {
    const { state, dispatch } = useAppState();
    const insets = useSafeAreaInsets();
    const user = state.user;

    const handleLogout = async () => {
        await storageService.clearAll();
        dispatch({ type: 'LOGOUT' });
    };

    const memberDate = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth={2}>
                        <Path d="M19 12H5M5 12L12 19M5 12L12 5" />
                    </Svg>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile Context</Text>
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
                        onPress={() => navigation.navigate('Location')}
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
        </View>
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
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Colors.brand.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 24,
        color: Colors.light.text,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 40,
    },

    // Profile Card
    profileCard: {
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius['4xl'],
        padding: Spacing['2xl'],
        alignItems: 'center',
        marginBottom: Spacing.lg,
        ...Shadows.card,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: Spacing.xl,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: Colors.brand.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.brand.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.neutral.white,
    },
    avatarBadgeIcon: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 16,
        color: Colors.neutral.white,
    },
    userName: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 26,
        color: Colors.light.text,
        marginBottom: Spacing.md,
    },
    memberSince: {
        backgroundColor: Colors.light.backgroundSecondary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    memberText: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 13,
        color: Colors.light.textMuted,
    },

    // Section Cards
    sectionCard: {
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius['4xl'],
        padding: Spacing['2xl'],
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.light.border,
        ...Shadows.card,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: Spacing.lg,
    },
    sectionIcon: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: Colors.brand.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 18,
        color: Colors.light.text,
    },
    sectionSubtitle: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 11,
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
        fontSize: 15,
        color: Colors.light.text,
        lineHeight: 22,
        marginBottom: Spacing.sm,
    },
    defaultBadge: {
        backgroundColor: Colors.brand.primary,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    defaultBadgeText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 11,
        color: Colors.neutral.white,
        letterSpacing: 0.5,
    },
    changeButton: {
        borderWidth: 1.5,
        borderColor: Colors.brand.primary,
        borderRadius: BorderRadius['3xl'],
        paddingVertical: 12,
        alignItems: 'center',
    },
    changeButtonText: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 14,
        color: Colors.brand.primary,
    },

    // Order History
    emptyOrderText: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 14,
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
        fontSize: 14,
        color: Colors.light.text,
    },
    orderDateText: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 12,
        color: Colors.light.textMuted,
        marginTop: 2,
    },
    orderTotalText: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 16,
        color: Colors.brand.primary,
    },

    // Logout
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius['3xl'],
        paddingVertical: 16,
        borderWidth: 1.5,
        borderColor: '#FECACA',
        ...Shadows.card,
    },
    logoutText: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 16,
        color: '#EF4444',
    },
});
