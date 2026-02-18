import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../../types';
import { Colors, Typography, Shadows, BorderRadius, Spacing } from '../../theme';
import Svg, { Path, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<MainStackParamList, 'OrderPlaced'>;
    route: RouteProp<MainStackParamList, 'OrderPlaced'>;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function OrderPlacedScreen({ navigation, route }: Props) {
    const { orderId, vendorCount } = route.params;
    const checkScale = useRef(new Animated.Value(0)).current;
    const checkOpacity = useRef(new Animated.Value(0)).current;
    const circleProgress = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const contentTranslate = useRef(new Animated.Value(30)).current;

    const CIRCLE_LENGTH = 440; // 2 * PI * 70 (approx)

    useEffect(() => {
        // Psychological Animation: Circle fills first, then content appears
        Animated.sequence([
            // 1. Draw the circle
            Animated.timing(circleProgress, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            }),
            // 2. Pop the checkmark
            Animated.parallel([
                Animated.spring(checkScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
                Animated.timing(checkOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
            ]),
            // 3. Show the rest of the content
            Animated.parallel([
                Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
                Animated.timing(contentTranslate, { toValue: 0, duration: 600, useNativeDriver: true }),
            ]),
        ]).start();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Circle & Check Animation */}
                <View style={styles.checkContainer}>
                    <View style={styles.svgWrapper}>
                        <Svg width={150} height={150} viewBox="0 0 150 150">
                            {/* Static Background Circle */}
                            <Circle
                                cx="75"
                                cy="75"
                                r="70"
                                stroke="#F0F9F9"
                                strokeWidth="5"
                                fill="none"
                            />
                            {/* Animated Progress Circle */}
                            <AnimatedCircle
                                cx="75"
                                cy="75"
                                r="70"
                                stroke={Colors.brand.primary}
                                strokeWidth="5"
                                fill="none"
                                strokeDasharray={CIRCLE_LENGTH}
                                strokeDashoffset={circleProgress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [CIRCLE_LENGTH, 0],
                                })}
                                strokeLinecap="round"
                                transform="rotate(-90 75 75)"
                            />
                        </Svg>

                        {/* Checkmark inside */}
                        <Animated.View
                            style={[
                                styles.checkInner,
                                { opacity: checkOpacity, transform: [{ scale: checkScale }] },
                            ]}
                        >
                            <Svg width={70} height={70} viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth={3}>
                                <Path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                        </Animated.View>
                    </View>
                </View>

                {/* Title */}
                <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentTranslate }], alignItems: 'center' }}>
                    <Text style={styles.title}>Order Placed!</Text>

                    {/* Info Cards */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>DELIVERY IN</Text>
                            <Text style={styles.infoValue}>30 Mins</Text>
                        </View>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>ORDER ID</Text>
                            <Text style={styles.infoValueId}>#{orderId}</Text>
                        </View>
                    </View>

                    {/* Message with Highlighted Box */}
                    <View style={styles.messageRow}>
                        <Text style={styles.message}>Ezer has secured your items from </Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>{vendorCount}</Text>
                        </View>
                        <Text style={styles.message}> shops.</Text>
                    </View>
                </Animated.View>
            </View>

            {/* Back to Chat */}
            <View style={styles.ctaArea}>
                <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Chat' }] })}
                    activeOpacity={0.8}
                >
                    <Text style={styles.ctaText}>Back to Chat</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    checkContainer: {
        marginBottom: 48,
    },
    svgWrapper: {
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkInner: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 38,
        color: '#374151',
        marginBottom: 32,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    infoCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingVertical: 24,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.card,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    infoLabel: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 10,
        color: '#9CA3AF',
        letterSpacing: 1,
        marginBottom: 12,
    },
    infoValue: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 24,
        color: Colors.brand.primary,
    },
    infoValueId: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 20,
        color: Colors.brand.primary,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    message: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 17,
        color: '#6B7280',
        textAlign: 'center',
    },
    countBadge: {
        backgroundColor: '#E0F2F1',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginHorizontal: 4,
    },
    countText: {
        fontFamily: Typography.fontFamily.headingBold,
        color: Colors.brand.primary,
        fontSize: 17,
    },
    ctaArea: {
        position: 'absolute',
        bottom: 50,
        left: 24,
        right: 24,
    },
    ctaButton: {
        backgroundColor: '#000000',
        borderRadius: 25,
        paddingVertical: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    ctaText: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 18,
        color: '#FFFFFF',
    },
});
