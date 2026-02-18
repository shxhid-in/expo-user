import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions, StatusBar } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthStackParamList } from '../../types';
import { useAppState } from '../../store/AppContext';
import { Colors, Typography, Shadows, Spacing, BorderRadius } from '../../theme';

const { width } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Transition'>;
    route: RouteProp<AuthStackParamList, 'Transition'>;
};

export default function TransitionScreen({ navigation, route }: Props) {
    const { phone, firstName, lastName } = route.params;
    const { dispatch } = useAppState();

    // Animation Values
    const progressAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        // Premium Progress Animation (Exactly 3 seconds)
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: false,
        }).start();

        // Move to main app after completion
        const timer = setTimeout(() => {
            dispatch({
                type: 'SET_USER',
                payload: { phone, firstName, lastName },
            });
        }, 3400);

        return () => clearTimeout(timer);
    }, []);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.gradient}
            />

            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                {/* Text Section */}
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Initialing the agent</Text>
                    <Text style={styles.subtitle}>Ezer is running</Text>
                </View>

                {/* Premium Progress Section */}
                <View style={styles.loaderArea}>
                    <View style={styles.progressTrack}>
                        <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
                            <LinearGradient
                                colors={[Colors.brand.primary, Colors.brand.tealLight]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFill}
                            />
                        </Animated.View>
                    </View>
                </View>

                {/* Quality Indicator */}
                <View style={styles.footer}>
                    <View style={styles.dot} />
                    <Text style={styles.footerText}>Secure AI Environment</Text>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing['4xl'],
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 24,
        color: Colors.light.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 14,
        color: Colors.light.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },
    loaderArea: {
        width: '100%',
        alignItems: 'center',
    },
    progressTrack: {
        height: 8,
        width: width * 0.7,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    percentageContainer: {
        marginTop: 16,
    },
    percentageText: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 13,
        color: Colors.brand.primary,
        letterSpacing: 1,
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.brand.primary,
    },
    footerText: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 11,
        color: Colors.light.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
