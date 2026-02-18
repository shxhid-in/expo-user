import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Pressable,
    StatusBar as RNStatusBar,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../types';
import { Colors, Typography, Shadows, BorderRadius, Spacing } from '../../theme';
import { isValidName } from '../../utils/validation';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Name'>;
    route: RouteProp<AuthStackParamList, 'Name'>;
};

export default function NameScreen({ navigation, route }: Props) {
    const { phone } = route.params;
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isFocused, setIsFocused] = useState<'first' | 'last' | null>(null);

    // Animations
    const contentAnim = useRef(new Animated.Value(20)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;
    const btnScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(contentAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
            Animated.timing(contentOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(btnScale, { toValue: 0.98, useNativeDriver: true }).start();
    };

    const handlePressOut = () => {
        Animated.spring(btnScale, { toValue: 1, friction: 3, useNativeDriver: true }).start();
    };

    const handleContinue = () => {
        if (isValidName(firstName)) {
            Keyboard.dismiss();
            navigation.navigate('Transition', {
                phone,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            });
        }
    };

    const isDisabled = !isValidName(firstName);

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.container}>
                <RNStatusBar barStyle="dark-content" />

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        bounces={false}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header */}
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
                            <Text style={styles.headerTitle}>Profile Setup</Text>
                            <View style={{ width: 44 }} />
                        </View>

                        <Animated.View style={[
                            styles.content,
                            { opacity: contentOpacity, transform: [{ translateY: contentAnim }] }
                        ]}>
                            <View style={styles.titleSection}>
                                <Text style={styles.titleText}>What's your name?</Text>
                                <Text style={styles.subtitleText}>We'd love to know who we're delivering to</Text>
                            </View>

                            <View style={styles.formSection}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>FIRST NAME *</Text>
                                    <View style={[
                                        styles.inputWrapper,
                                        isFocused === 'first' && styles.inputWrapperFocused
                                    ]}>
                                        <TextInput
                                            style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                                            placeholder="Enter first name"
                                            placeholderTextColor={Colors.light.textMuted + '60'}
                                            value={firstName}
                                            onChangeText={setFirstName}
                                            onFocus={() => setIsFocused('first')}
                                            onBlur={() => setIsFocused(null)}
                                            autoCapitalize="words"
                                            selectionColor={Colors.brand.primary}
                                            cursorColor={Colors.brand.primary}
                                        />
                                    </View>
                                </View>

                                <View style={[styles.inputGroup, { marginTop: 25 }]}>
                                    <Text style={styles.inputLabel}>LAST NAME (OPTIONAL)</Text>
                                    <View style={[
                                        styles.inputWrapper,
                                        isFocused === 'last' && styles.inputWrapperFocused
                                    ]}>
                                        <TextInput
                                            style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                                            placeholder="Enter last name"
                                            placeholderTextColor={Colors.light.textMuted + '60'}
                                            value={lastName}
                                            onChangeText={setLastName}
                                            onFocus={() => setIsFocused('last')}
                                            onBlur={() => setIsFocused(null)}
                                            autoCapitalize="words"
                                            selectionColor={Colors.brand.primary}
                                            cursorColor={Colors.brand.primary}
                                        />
                                    </View>
                                </View>
                            </View>

                            <View style={styles.spacer} />

                            <Animated.View style={[styles.ctaWrapper, { transform: [{ scale: btnScale }] }]}>
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
                                        <Text style={styles.ctaText}>Finish Setup</Text>
                                        {!isDisabled && (
                                            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                                                <Path d="M5 12h14M12 5l7 7-7 7" />
                                            </Svg>
                                        )}
                                    </LinearGradient>
                                </Pressable>
                            </Animated.View>
                        </Animated.View>
                    </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
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
        paddingTop: 20,
    },
    titleSection: {
        marginBottom: 40,
    },
    titleText: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 30,
        color: '#1E293B',
        marginBottom: 8,
    },
    subtitleText: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 16,
        color: '#64748B',
        lineHeight: 22,
    },
    formSection: {
        flex: 1,
    },
    inputGroup: {
        width: '100%',
    },
    inputLabel: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 11,
        color: '#94A3B8',
        letterSpacing: 1,
        marginBottom: 10,
        marginLeft: 4,
    },
    inputWrapper: {
        backgroundColor: '#F8FAFC',
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        paddingHorizontal: 20,
    },
    inputWrapperFocused: {
        borderColor: '#008080',
        backgroundColor: '#fff',
    },
    input: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 17,
        color: '#1E293B',
        paddingVertical: 18,
    },
    spacer: {
        height: 40,
    },
    ctaWrapper: {
        marginBottom: Platform.OS === 'ios' ? 50 : 30,
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
        paddingVertical: 20,
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
});
