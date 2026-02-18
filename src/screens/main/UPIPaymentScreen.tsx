import * as React from 'react';
import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../../types';
import { useAppState, createMessage } from '../../store/AppContext';
import { Colors, Typography, Shadows, BorderRadius, Spacing } from '../../theme';
import { formatCurrency } from '../../utils/formatting';
import { generateOrderId, getUniqueVendors } from '../../utils/cartUtils';
import Svg, { Path } from 'react-native-svg';

type Props = {
    navigation: NativeStackNavigationProp<MainStackParamList, 'UPIPayment'>;
    route: RouteProp<MainStackParamList, 'UPIPayment'>;
};

const UPI_APPS = [
    { id: 'upi', name: "Pay via any UPI app's", image: require('../../../assets/UPI icon.jpg') },
    { id: 'gpay', name: 'Google Pay', image: require('../../../assets/Gpay Icon.jpg') },
    { id: 'paytm', name: 'Paytm', image: require('../../../assets/Paytm icon.png') },
    { id: 'phonepe', name: 'PhonePe', image: require('../../../assets/Phone pe icon.png') },
    { id: 'slice', name: 'Slice', image: require('../../../assets/Slice icon.png') },
    { id: 'cred', name: 'Cred', image: require('../../../assets/Cred icon.png') },
];

export default function UPIPaymentScreen({ navigation, route }: Props) {
    const { total } = route.params;
    const { state, dispatch } = useAppState();
    const insets = useSafeAreaInsets();
    const [selectedApp, setSelectedApp] = useState('upi');
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePay = () => {
        setIsProcessing(true);
        // Simulate UPI payment processing logic
        setTimeout(() => {
            setIsProcessing(false);

            // Payment successful
            const selectedAppName = UPI_APPS.find(a => a.id === selectedApp)?.name || 'UPI App';
            const paymentMsg = createMessage(
                `✅ UPI payment of ${formatCurrency(total)} successful via ${selectedAppName}.`,
                'bot'
            );
            dispatch({ type: 'ADD_MESSAGE', payload: paymentMsg });

            // Navigate back to Chat and notify that payment is done
            navigation.navigate('Chat', { upiPaymentSuccess: true });
        }, 2000);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.light.text} strokeWidth={2.5}>
                        <Path d="M19 12H5M5 12L12 19M5 12L12 5" />
                    </Svg>
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Secure Payment</Text>
                    <Text style={styles.headerSubtitle}>CHOOSE YOUR PREFERRED UPI APP</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Amount Card */}
                <View style={styles.amountCard}>
                    <View style={styles.amountHeader}>
                        <View style={styles.secureBadge}>
                            <Svg width={12} height={12} viewBox="0 0 24 24" fill={Colors.brand.primary} stroke={Colors.brand.primary} strokeWidth={2}>
                                <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </Svg>
                            <Text style={styles.secureBadgeText}>SECURE TRANSACTION</Text>
                        </View>
                    </View>
                    <Text style={styles.amountLabel}>AMOUNT TO PAY</Text>
                    <Text style={styles.amountValue}>{formatCurrency(total)}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.orderIdText}>Order ID: {generateOrderId().slice(0, 8).toUpperCase()}</Text>
                </View>

                <Text style={styles.selectionTitle}>Select UPI App</Text>

                {/* UPI App Selection */}
                {UPI_APPS.map((app) => (
                    <TouchableOpacity
                        key={app.id}
                        style={[styles.upiCard, selectedApp === app.id && styles.upiCardSelected]}
                        onPress={() => setSelectedApp(app.id)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.upiIconContainer}>
                            <Image source={app.image} style={styles.upiIcon} resizeMode="contain" />
                        </View>
                        <View style={styles.upiInfo}>
                            <Text style={[styles.upiName, selectedApp === app.id && styles.upiNameSelected]}>
                                {app.name}
                            </Text>
                            {app.id === 'upi' && <Text style={styles.upiTagline}>Instant Pay via any UPI App</Text>}
                        </View>
                        <View style={styles.radioBlock}>
                            <View style={[styles.radioOuter, selectedApp === app.id && styles.radioOuterActive]}>
                                {selectedApp === app.id && <View style={styles.radioInner} />}
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* CTA */}
            <View style={[styles.ctaContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <TouchableOpacity style={{ width: '100%' }} onPress={handlePay} disabled={isProcessing} activeOpacity={0.8}>
                    <LinearGradient
                        colors={[Colors.brand.primary, '#005f5f']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.ctaButton}
                    >
                        <Text style={styles.ctaText}>{isProcessing ? 'Processing...' : `Pay ${formatCurrency(total)}`}</Text>
                        {!isProcessing ? (
                            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.neutral.white} strokeWidth={2.5}>
                                <Path d="M5 12h14M12 5l7 7-7 7" />
                            </Svg>
                        ) : (
                            <ActivityIndicator size="small" color="#FFF" style={{ marginLeft: 10 }} />
                        )}
                    </LinearGradient>
                </TouchableOpacity>
                <View style={styles.footerInfo}>
                    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={Colors.light.textMuted} strokeWidth={2}>
                        <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </Svg>
                    <Text style={styles.warningText}>PCI-DSS COMPLIANT • SECURE ENCRYPTION</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: 14,
        backgroundColor: Colors.light.background,
        gap: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
        ...Shadows.header,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 22,
        color: Colors.light.text,
    },
    headerSubtitle: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 10,
        color: Colors.brand.primary,
        letterSpacing: 1.5,
        marginTop: 2,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 160,
    },

    // Amount Card
    amountCard: {
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius['3xl'],
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        ...Shadows.card,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    amountHeader: {
        marginBottom: 16,
    },
    secureBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.brand.primarySoft,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
    },
    secureBadgeText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 9,
        color: Colors.brand.primary,
        letterSpacing: 0.5,
    },
    amountLabel: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 12,
        color: Colors.light.textMuted,
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    amountValue: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 40,
        color: Colors.light.text,
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 16,
    },
    orderIdText: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 12,
        color: Colors.light.textMuted,
    },

    selectionTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 16,
        color: Colors.light.text,
        marginBottom: 16,
        marginLeft: 4,
    },

    // UPI cards
    upiCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        ...Shadows.card,
    },
    upiCardSelected: {
        borderColor: Colors.brand.primary,
        backgroundColor: '#F0F9F9',
        elevation: 2,
    },
    upiIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    upiIcon: {
        width: '100%',
        height: '100%',
    },
    upiInfo: {
        flex: 1,
    },
    upiName: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 15,
        color: Colors.light.text,
    },
    upiNameSelected: {
        color: Colors.brand.primary,
    },
    upiTagline: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 11,
        color: Colors.light.textMuted,
        marginTop: 2,
    },
    radioBlock: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterActive: {
        borderColor: Colors.brand.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.brand.primary,
    },

    // CTA
    ctaContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.lg,
        paddingTop: 16,
        backgroundColor: Colors.light.background,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        ...Shadows.header,
    },
    ctaButton: {
        flexDirection: 'row',
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        ...Shadows.button,
    },
    ctaText: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 18,
        color: Colors.neutral.white,
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
        opacity: 0.7,
    },
    warningText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 10,
        color: Colors.light.textMuted,
        letterSpacing: 0.5,
    },
});
