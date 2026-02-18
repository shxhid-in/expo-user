import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Platform,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';
import { useAppState } from '../../store/AppContext';
import { Colors, Typography, Shadows, BorderRadius, Spacing } from '../../theme';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

type Props = {
    navigation: NativeStackNavigationProp<MainStackParamList, 'Location'>;
};

export default function LocationScreen({ navigation }: Props) {
    const { state, dispatch } = useAppState();
    const insets = useSafeAreaInsets();
    const [search, setSearch] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleUseCurrentLocation = () => {
        dispatch({
            type: 'SET_LOCATION',
            payload: { location: 'Pkd, bezgo HQ near Shadhi Mahal', label: 'Pkd' },
        });
        navigation.goBack();
    };

    const handleSelectAddress = (addr: string, label: string) => {
        dispatch({ type: 'SET_LOCATION', payload: { location: addr, label } });
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.neutral.white} strokeWidth={2}>
                        <Path d="M19 12H5M5 12L12 19M5 12L12 5" />
                    </Svg>
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <View style={styles.headerTitleRow}>
                        <Text style={styles.headerTitle}>Location</Text>
                        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth={2}>
                            <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                            <Circle cx={12} cy={10} r={3} />
                        </Svg>
                    </View>
                    <Text style={styles.headerSubtitle}>UPDATE THE LOCATION</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Search Bar */}
                <View style={[
                    styles.searchContainer,
                    isFocused && styles.searchContainerFocused
                ]}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={isFocused ? Colors.brand.primary : Colors.light.textMuted} strokeWidth={2}>
                        <Circle cx={11} cy={11} r={8} />
                        <Path d="M21 21l-4.35-4.35" />
                    </Svg>
                    <TextInput
                        style={[styles.searchInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                        placeholder="Search for area, street, or city..."
                        placeholderTextColor={Colors.light.textMuted}
                        value={search}
                        onChangeText={setSearch}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        selectionColor={Colors.brand.primary}
                        cursorColor={Colors.brand.primary}
                    />
                </View>

                {/* Use Current Location */}
                <TouchableOpacity style={styles.currentLocationCard} onPress={handleUseCurrentLocation}>
                    <View style={styles.currentLocationIcon}>
                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth={2}>
                            <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                            <Circle cx={12} cy={10} r={3} />
                        </Svg>
                    </View>
                    <View style={styles.currentLocationInfo}>
                        <Text style={styles.currentLocationTitle}>Use Current Location</Text>
                        <Text style={styles.currentLocationSubtitle}>Using GPS for precise location</Text>
                    </View>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.light.textMuted} strokeWidth={2}>
                        <Path d="M9 18l6-6-6-6" />
                    </Svg>
                </TouchableOpacity>

                {/* Add Location */}
                <TouchableOpacity style={styles.addLocationCard}>
                    <View style={styles.addLocationIcon}>
                        <Text style={styles.addLocationPlus}>+</Text>
                    </View>
                    <View style={styles.addLocationInfo}>
                        <Text style={styles.addLocationTitle}>Add Location</Text>
                        <Text style={styles.addLocationSubtitle}>Enter address manually</Text>
                    </View>
                </TouchableOpacity>

                {/* Saved Addresses */}
                <Text style={styles.savedTitle}>SAVED ADDRESSES</Text>

                <TouchableOpacity
                    style={styles.savedCard}
                    onPress={() => handleSelectAddress('Palakkad, bezgo HQ, near Shadi Mahal', 'Pkd')}
                >
                    <View style={styles.savedIcon}>
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth={2}>
                            <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <Path d="M9 22V12h6v10" />
                        </Svg>
                    </View>
                    <View style={styles.savedInfo}>
                        <Text style={styles.savedLabel}>Home</Text>
                        <Text style={styles.savedAddress}>Palakkad, bezgo HQ, near Shadi Mahal</Text>
                    </View>
                    <View style={styles.savedDefaultBadge}>
                        <Text style={styles.savedDefaultText}>DEFAULT</Text>
                    </View>
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
        backgroundColor: Colors.brand.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 24,
        color: Colors.light.text,
    },
    headerSubtitle: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 11,
        color: Colors.light.textMuted,
        letterSpacing: 1,
        marginTop: 2,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 40,
    },

    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius['3xl'],
        paddingHorizontal: 18,
        paddingVertical: 14,
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
        marginBottom: Spacing.xl,
        ...Shadows.input,
    },
    searchContainerFocused: {
        borderColor: Colors.brand.primary,
        borderWidth: 1.5,
        backgroundColor: Colors.light.background,
        ...Shadows.cardHover,
    },
    searchInput: {
        flex: 1,
        fontFamily: Typography.fontFamily.body,
        fontSize: 15,
        color: Colors.light.text,
        textAlignVertical: 'center',
    },

    // Current Location
    currentLocationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius['4xl'],
        padding: Spacing.xl,
        gap: 14,
        borderWidth: 1,
        borderColor: Colors.light.border,
        marginBottom: Spacing.lg,
        ...Shadows.card,
    },
    currentLocationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.brand.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentLocationInfo: {
        flex: 1,
    },
    currentLocationTitle: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 16,
        color: Colors.light.text,
    },
    currentLocationSubtitle: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 13,
        color: Colors.light.textMuted,
        marginTop: 2,
    },

    // Add Location
    addLocationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.neutral.tealVeryLight,
        borderRadius: BorderRadius['4xl'],
        padding: Spacing.xl,
        gap: 14,
        borderWidth: 2,
        borderColor: Colors.brand.primary,
        borderStyle: 'dashed',
        marginBottom: Spacing['4xl'],
    },
    addLocationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.neutral.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.card,
    },
    addLocationPlus: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 24,
        color: Colors.brand.primary,
    },
    addLocationInfo: {
        flex: 1,
    },
    addLocationTitle: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 16,
        color: Colors.light.text,
    },
    addLocationSubtitle: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 13,
        color: Colors.light.textMuted,
        marginTop: 2,
    },

    // Saved
    savedTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 14,
        color: Colors.light.text,
        letterSpacing: 2,
        marginBottom: Spacing.lg,
    },
    savedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius['4xl'],
        padding: Spacing.xl,
        gap: 14,
        borderWidth: 1,
        borderColor: Colors.light.border,
        ...Shadows.card,
    },
    savedIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Colors.brand.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    savedInfo: {
        flex: 1,
    },
    savedLabel: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 15,
        color: Colors.light.text,
    },
    savedAddress: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 12,
        color: Colors.light.textMuted,
        marginTop: 2,
    },
    savedDefaultBadge: {
        backgroundColor: Colors.brand.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    savedDefaultText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 10,
        color: Colors.neutral.white,
        letterSpacing: 0.5,
    },
});
