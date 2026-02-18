import * as React from 'react';
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { Colors, Typography } from '../../theme';

const { width, height } = Dimensions.get('window');

type Props = {
    navigation: NativeStackNavigationProp<AuthStackParamList, 'Splash'>;
};

export default function SplashScreen({ navigation }: Props) {
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoTranslateY = useRef(new Animated.Value(20)).current;
    const sloganOpacity = useRef(new Animated.Value(0)).current;
    const loadingWidth = useRef(new Animated.Value(0)).current;
    const loadingTextOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Logo entrance
        Animated.parallel([
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(logoTranslateY, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        // Slogan delay
        setTimeout(() => {
            Animated.timing(sloganOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start();
        }, 400);

        // Loading text & bar
        setTimeout(() => {
            Animated.timing(loadingTextOpacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
            Animated.timing(loadingWidth, {
                toValue: width * 0.7,
                duration: 1800,
                useNativeDriver: false,
            }).start();
        }, 600);

        // Navigate after 2.4s
        const timer = setTimeout(() => {
            navigation.replace('SignIn');
        }, 2800);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Animated.View
                    style={{
                        opacity: logoOpacity,
                        transform: [{ translateY: logoTranslateY }],
                        alignItems: 'center',
                    }}
                >
                    <Text style={styles.logo}>
                        bezgo<Text style={styles.logoFresh}>Fresh</Text>
                    </Text>

                    <Animated.Text style={[styles.slogan, { opacity: sloganOpacity }]}>
                        EVERYTHING DELIVERED FRESH
                    </Animated.Text>
                </Animated.View>
            </View>

            <View style={styles.loadingArea}>
                <Animated.Text style={[styles.loadingText, { opacity: loadingTextOpacity }]}>
                    Loading your fresh experience...
                </Animated.Text>
                <View style={styles.loadingTrack}>
                    <Animated.View style={[styles.loadingBar, { width: loadingWidth }]} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#008080',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        marginTop: -60, // Slight upward shift to match visual center
    },
    logo: {
        fontFamily: 'Sansita_700Bold',
        fontSize: 56,
        color: Colors.neutral.white,
        letterSpacing: -1,
    },
    logoFresh: {
        fontFamily: 'Sansita_800ExtraBold',
    },
    slogan: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: 4,
        marginTop: 20,
        textTransform: 'uppercase',
    },
    loadingArea: {
        position: 'absolute',
        bottom: 100,
        alignItems: 'center',
        width: '100%',
    },
    loadingText: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 16,
    },
    loadingTrack: {
        width: width * 0.7,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    loadingBar: {
        height: '100%',
        backgroundColor: Colors.neutral.white,
        borderRadius: 2,
    },
});
