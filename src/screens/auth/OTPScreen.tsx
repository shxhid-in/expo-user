import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { Colors, Typography, Shadows, BorderRadius, Spacing } from '../../theme';
import { isValidOTP } from '../../utils/validation';
import { maskPhone } from '../../utils/formatting';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'OTP'>;
    route: RouteProp<AuthStackParamList, 'OTP'>;
};

export default function OTPScreen({ navigation, route }: Props) {
    const { phone } = route.params;
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [focusedIndex, setFocusedIndex] = useState<number>(0);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    // Animations
    const contentAnim = useRef(new Animated.Value(20)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const btnScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(contentAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
            Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start();

        // Auto-focus first input
        setTimeout(() => inputRefs.current[0]?.focus(), 400);
    }, []);

    const handlePressIn = () => {
        Animated.spring(btnScale, { toValue: 0.98, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.spring(btnScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    };

    const handleOtpChange = (text: string, index: number) => {
        if (text.length > 1) {
            text = text[text.length - 1];
        }
        if (text && !/^\d$/.test(text)) return;

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
            const newOtp = [...otp];
            newOtp[index - 1] = '';
            setOtp(newOtp);
        }
    };

    const handleVerify = () => {
        if (isValidOTP(otp)) {
            Keyboard.dismiss();
            navigation.navigate('Name', { phone });
        }
    };

    const allFilled = isValidOTP(otp);

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* Header / Back */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                        >
                            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.light.text} strokeWidth={2.5}>
                                <Path d="M19 12H5M5 12L12 19M5 12L12 5" />
                            </Svg>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Verification</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <Animated.View style={[
                        styles.content,
                        { opacity: contentOpacity, transform: [{ translateY: contentAnim }] }
                    ]}>
                        {/* Visual Icon */}
                        <View style={styles.promoCard}>
                            <View style={styles.iconCircle}>
                                <Svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth={2}>
                                    <Rect x="2" y="4" width="20" height="16" rx="4" />
                                    <Path d="M22 7L13.03 12.7a1.94 1.94 0 01-2.06 0L2 7" />
                                </Svg>
                            </View>
                            <View>
                                <Text style={styles.titleText}>Check your SMS</Text>
                                <Text style={styles.subtitleText}>Code sent to {maskPhone(phone)}</Text>
                            </View>
                        </View>

                        {/* OTP Inputs */}
                        <View style={styles.otpSection}>
                            <Text style={styles.inputLabel}>ENTER 6-DIGIT CODE</Text>
                            <View style={styles.otpRow}>
                                {otp.map((digit, index) => (
                                    <TextInput
                                        key={index}
                                        ref={(ref) => { inputRefs.current[index] = ref; }}
                                        style={[
                                            styles.otpInput,
                                            digit ? styles.otpInputFilled : null,
                                            focusedIndex === index ? styles.otpInputFocused : null,
                                            Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)
                                        ]}
                                        value={digit}
                                        onChangeText={(text) => handleOtpChange(text, index)}
                                        onKeyPress={(e) => handleKeyPress(e, index)}
                                        onFocus={() => setFocusedIndex(index)}
                                        onBlur={() => setFocusedIndex(-1)}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        selectTextOnFocus
                                        selectionColor={Colors.brand.primary}
                                        cursorColor={Colors.brand.primary}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Verify Button */}
                        <Animated.View style={[styles.ctaWrapper, { transform: [{ scale: btnScale }] }]}>
                            <Pressable
                                onPress={handleVerify}
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                disabled={!allFilled}
                                style={({ pressed }) => [
                                    styles.ctaButton,
                                    !allFilled && styles.ctaDisabled
                                ]}
                            >
                                <LinearGradient
                                    colors={allFilled ? ['#008080', '#004D4D'] : ['#CBD5E1', '#94A3B8']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.gradientButton}
                                >
                                    <Text style={styles.ctaText}>Verify & Continue</Text>
                                    {allFilled && (
                                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                                            <Path d="M20 6L9 17l-5-5" />
                                        </Svg>
                                    )}
                                </LinearGradient>
                            </Pressable>
                        </Animated.View>

                        {/* Resend Action */}
                        <View style={styles.resendContainer}>
                            <Text style={styles.resendText}>Didn't receive the code?</Text>
                            <TouchableOpacity activeOpacity={0.7}>
                                <Text style={styles.resendLink}>Resend OTP</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 25,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 15,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    headerTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 16,
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 30,
        paddingTop: 30,
    },
    promoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDFA',
        padding: 20,
        borderRadius: 22,
        gap: 16,
        marginBottom: 40,
        borderWidth: 1,
        borderColor: '#CCFBF1',
    },
    iconCircle: {
        width: 54,
        height: 54,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.card,
    },
    titleText: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 18,
        color: '#1E293B',
        marginBottom: 2,
    },
    subtitleText: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 13,
        color: '#64748B',
    },
    otpSection: {
        marginBottom: 40,
    },
    inputLabel: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 11,
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 20,
        textAlign: 'center',
    },
    otpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    otpInput: {
        width: (width - 60 - 40) / 6,
        height: 60,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        textAlign: 'center',
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 22,
        color: '#1E293B',
    },
    otpInputFilled: {
        borderColor: '#008080',
        backgroundColor: '#fff',
    },
    otpInputFocused: {
        borderColor: '#008080',
        borderWidth: 2,
        backgroundColor: '#fff',
    },
    ctaWrapper: {
        width: '100%',
        marginBottom: 35,
    },
    ctaButton: {
        borderRadius: 22,
        overflow: 'hidden',
        ...Shadows.button,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 12,
    },
    ctaDisabled: {
        opacity: 0.8,
    },
    ctaText: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 18,
        color: '#fff',
    },
    resendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    resendText: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 14,
        color: '#64748B',
    },
    resendLink: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 14,
        color: '#008080',
        textDecorationLine: 'underline',
    },
});
