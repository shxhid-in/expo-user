import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Animated,
    Dimensions,
    Pressable,
    TouchableWithoutFeedback,
    Keyboard,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors, Typography, Shadows, BorderRadius, Spacing } from '../../theme';
import { isValidPhone } from '../../utils/validation';

import Svg, { Path, Rect, Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'SignIn'>;
};

export default function SignInScreen({ navigation }: Props) {
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    // Animations
    const formAnim = useRef(new Animated.Value(20)).current;
    const formOpacity = useRef(new Animated.Value(0)).current;
    const btnScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(formAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
            Animated.timing(formOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(btnScale, { toValue: 0.98, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.spring(btnScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    };

    const handleContinue = () => {
        setError('');
        if (!isValidPhone(phone)) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }
        Keyboard.dismiss();
        navigation.navigate('OTP', { phone });
    };

    const isDisabled = phone.length < 10;

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

                {/* Fixed Hero Background */}
                <View style={styles.heroWrapper}>
                    <Image
                        source={require('../../../assets/Sig in new image.jpg')}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.heroOverlay}
                    />

                    <View style={styles.heroTextContainer}>
                        <Text style={styles.heroTitle}>India's Champion in Freshness</Text>
                    </View>
                </View>

                <KeyboardAvoidingView
                    style={styles.interactionArea}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        bounces={true}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.spacer} />

                        <Animated.View style={[
                            styles.formCard,
                            { opacity: formOpacity, transform: [{ translateY: formAnim }] }
                        ]}>
                            <View style={styles.handle} />

                            <View style={styles.headerText}>
                                <Text style={styles.welcomeText}>Login or Signup</Text>
                                <Text style={styles.subWelcomeText}>Enter your details to start ordering</Text>
                            </View>

                            <View style={styles.inputSection}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
                                </View>

                                <View style={styles.phoneRow}>
                                    <View style={styles.countryBadge}>
                                        <IndianFlagIcon />
                                        <Text style={styles.prefix}>+91</Text>
                                    </View>

                                    <View style={[
                                        styles.phoneInputBox,
                                        isFocused && styles.phoneInputBoxFocused
                                    ]}>
                                        <TextInput
                                            style={[styles.phoneInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                                            placeholder="888 888 8888"
                                            placeholderTextColor={Colors.light.textMuted + '80'}
                                            keyboardType="phone-pad"
                                            maxLength={10}
                                            value={phone}
                                            onChangeText={(text) => {
                                                setPhone(text.replace(/[^0-9]/g, ''));
                                                setError('');
                                            }}
                                            onFocus={() => setIsFocused(true)}
                                            onBlur={() => setIsFocused(false)}
                                            cursorColor={Colors.brand.primary}
                                            selectionColor={Colors.brand.primary}
                                        />
                                    </View>
                                </View>

                                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                            </View>

                            <Animated.View style={[styles.buttonContainer, { transform: [{ scale: btnScale }] }]}>
                                <Pressable
                                    onPress={handleContinue}
                                    onPressIn={handlePressIn}
                                    onPressOut={handlePressOut}
                                    disabled={isDisabled}
                                    style={({ pressed }) => [
                                        styles.ctaButton,
                                        isDisabled && styles.ctaDisabled
                                    ]}
                                >
                                    <LinearGradient
                                        colors={isDisabled ? ['#CBD5E1', '#94A3B8'] : ['#008080', '#004D4D']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.gradientButton}
                                    >
                                        <Text style={styles.ctaText}>Get OTP</Text>
                                        {!isDisabled && (
                                            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                                                <Path d="M5 12h14M12 5l7 7-7 7" />
                                            </Svg>
                                        )}
                                    </LinearGradient>
                                </Pressable>
                            </Animated.View>

                            <View style={styles.legalSection}>
                                <Text style={styles.legalText}>
                                    By continuing, you agree to our{' '}
                                    <Text style={styles.legalLink}>Terms of Service</Text>
                                    {' & '}
                                    <Text style={styles.legalLink}>Privacy Policy</Text>
                                </Text>
                            </View>

                            {/* Extra space for scrolling comfort */}
                            <View style={{ height: 20 }} />
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
}

const IndianFlagIcon = () => (
    <Svg width="22" height="16" viewBox="0 0 32 24" fill="none">
        <Rect width="32" height="24" rx="2" fill="#FFFFFF" />
        <Rect width="32" height="8" fill="#FF9933" />
        <Rect y="16" width="32" height="8" fill="#138808" />
        <Circle cx="16" cy="12" r="3" fill="none" stroke="#000080" strokeWidth="0.8" />
    </Svg>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    heroWrapper: {
        ...StyleSheet.absoluteFillObject,
        height: height * 0.55,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    heroTextContainer: {
        position: 'absolute',
        top: height * 0.15,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 30,
    },
    heroTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 34,
        color: '#fff',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: -1,
        lineHeight: 42,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    interactionArea: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    spacer: {
        height: height * 0.42,
    },
    formCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingHorizontal: 30,
        paddingTop: 15,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        minHeight: height * 0.58,
        ...Shadows.card,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 25,
    },
    headerText: {
        marginBottom: 35,
    },
    welcomeText: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 26,
        color: '#1E293B',
        marginBottom: 6,
    },
    subWelcomeText: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 15,
        color: '#64748B',
    },
    inputSection: {
        marginBottom: 30,
    },
    labelRow: {
        marginBottom: 10,
        paddingLeft: 4,
    },
    inputLabel: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 11,
        color: '#94A3B8',
        letterSpacing: 1,
    },
    phoneRow: {
        flexDirection: 'row',
        gap: 12,
    },
    countryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 15,
        paddingVertical: 12,
        gap: 8,
    },
    prefix: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 16,
        color: '#1E293B',
    },
    phoneInputBox: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 18,
    },
    phoneInputBoxFocused: {
        borderColor: '#008080',
        backgroundColor: '#fff',
    },
    phoneInput: {
        flex: 1,
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 18,
        color: '#1E293B',
        paddingVertical: 14,
        letterSpacing: 1.5,
    },
    errorText: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 13,
        color: '#EF4444',
        marginTop: 8,
        marginLeft: 4,
    },
    buttonContainer: {
        width: '100%',
        marginBottom: 30,
    },
    ctaButton: {
        borderRadius: 20,
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
    legalSection: {
        alignItems: 'center',
    },
    legalText: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
    },
    legalLink: {
        color: '#008080',
        fontFamily: Typography.fontFamily.bodySemiBold,
    },
});
