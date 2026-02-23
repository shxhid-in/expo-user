import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Pressable,
    TextInput,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
    runOnJS,
} from 'react-native-reanimated';
import { Colors, Typography, Shadows, BorderRadius, Spacing } from '../../theme';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAppState } from '../../store/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6; // Increased to ensure it clips correctly on all devices

interface Props {
    isVisible: boolean;
    onClose: () => void;
}

export default function LocationSheet({ isVisible, onClose }: Props) {
    const { state, dispatch } = useAppState();
    const insets = useSafeAreaInsets();
    const HEADER_HEIGHT = insets.top + 62; // Precise height of the ChatScreen header

    const [savedAddresses, setSavedAddresses] = useState<Array<{ label: string, location: string, icon: string }>>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newLabel, setNewLabel] = useState('');
    const [newLocation, setNewLocation] = useState('');

    const translateY = useSharedValue(-SHEET_HEIGHT);
    const opacity = useSharedValue(0);
    const [shouldRender, setShouldRender] = React.useState(isVisible);

    useEffect(() => {
        if (isVisible) {
            setShouldRender(true);
            opacity.value = withTiming(1, { duration: 300 });
            translateY.value = withTiming(0, {
                duration: 400,
                easing: Easing.out(Easing.cubic),
            });
        } else {
            opacity.value = withTiming(0, { duration: 250 });
            translateY.value = withTiming(-SHEET_HEIGHT, {
                duration: 300,
                easing: Easing.in(Easing.cubic),
            }, (finished) => {
                if (finished) {
                    runOnJS(setShouldRender)(false);
                }
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

    const handleSelectLocation = (location: string, label: string) => {
        dispatch({ type: 'SET_LOCATION', payload: { location, label } });
        onClose();
    };

    const handleUseCurrentLocation = () => {
        dispatch({
            type: 'SET_LOCATION',
            payload: { location: 'Current Location', label: 'Current Location' },
        });
        onClose();
    };

    const handleSaveNewLocation = () => {
        if (!newLabel.trim() || !newLocation.trim()) return;
        const newAddr = { label: newLabel.trim(), location: newLocation.trim(), icon: 'home' };
        setSavedAddresses([...savedAddresses, newAddr]);
        handleSelectLocation(newAddr.location, newAddr.label);
        setNewLabel('');
        setNewLocation('');
        setIsAdding(false);
    };

    const handleDeleteLocation = (index: number) => {
        const updatedAddresses = [...savedAddresses];
        updatedAddresses.splice(index, 1);
        setSavedAddresses(updatedAddresses);
    };

    if (!shouldRender) return null;

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={isVisible ? 'auto' : 'none'}>
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
            </Animated.View>

            {/* Clipping container: starts below the location bar to make it look like the sheet slides out from it */}
            <View style={[styles.sheetContainer, { top: HEADER_HEIGHT }]}>
                <Animated.View style={[styles.sheet, animatedStyle]}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <View>
                                <Text style={styles.title}>Select Location</Text>
                                <Text style={styles.subtitle}>CHOOSE YOUR DELIVERY AREA</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.light.text} strokeWidth={2.5}>
                                    <Path d="M18 6L6 18M6 6l12 12" />
                                </Svg>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.currentLocation} onPress={handleUseCurrentLocation}>
                            <View style={styles.iconContainer}>
                                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth={2}>
                                    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                    <Circle cx={12} cy={10} r={3} />
                                </Svg>
                            </View>
                            <View style={styles.locationInfo}>
                                <Text style={styles.locationTitle}>Use current location</Text>
                                <Text style={styles.locationSubtitle}>Using GPS for better accuracy</Text>
                            </View>
                        </TouchableOpacity>

                        {savedAddresses.length > 0 && <Text style={styles.sectionTitle}>SAVED ADDRESSES</Text>}

                        {savedAddresses.map((addr, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.addressItem}
                                onPress={() => handleSelectLocation(addr.location, addr.label)}
                            >
                                <View style={styles.iconContainerSmall}>
                                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.brand.primary} strokeWidth={2}>
                                        {addr.icon === 'home' ? (
                                            <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        ) : (
                                            <Path d="M21 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2z M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
                                        )}
                                    </Svg>
                                </View>
                                <View style={styles.locationInfo}>
                                    <Text style={styles.addressLabel}>{addr.label}</Text>
                                    <Text style={styles.addressText} numberOfLines={1}>{addr.location}</Text>
                                </View>
                                {state.currentLocationLabel === addr.label && (
                                    <View style={styles.activeBadge}>
                                        <View style={styles.activeDot} />
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.deleteLocationButton}
                                    onPress={() => handleDeleteLocation(index)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={Colors.light.textMuted} strokeWidth={2.5}>
                                        <Path d="M18 6L6 18M6 6l12 12" />
                                    </Svg>
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}

                        {isAdding ? (
                            <View style={styles.addingContainer}>
                                <Text style={styles.sectionTitle}>ADD NEW LOCATION</Text>
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Label (e.g. Home, Office)"
                                    placeholderTextColor={Colors.light.textMuted}
                                    value={newLabel}
                                    onChangeText={setNewLabel}
                                    autoFocus
                                />
                                <TextInput
                                    style={styles.inputField}
                                    placeholder="Full Address"
                                    placeholderTextColor={Colors.light.textMuted}
                                    value={newLocation}
                                    onChangeText={setNewLocation}
                                />
                                <View style={styles.formActions}>
                                    <TouchableOpacity style={styles.cancelButton} onPress={() => setIsAdding(false)}>
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.saveButton, (!newLabel.trim() || !newLocation.trim()) && styles.saveButtonDisabled]}
                                        onPress={handleSaveNewLocation}
                                        disabled={!newLabel.trim() || !newLocation.trim()}
                                    >
                                        <Text style={styles.saveButtonText}>Save & Select</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity style={styles.addLocation} onPress={() => setIsAdding(true)}>
                                <View style={[styles.iconContainerSmall, { backgroundColor: Colors.brand.primarySoft }]}>
                                    <Text style={styles.plusIcon}>+</Text>
                                </View>
                                <Text style={styles.addLocationText}>Add new location</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <View style={styles.handle} />
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheetContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        zIndex: 1000,
    },
    sheet: {
        backgroundColor: Colors.light.background,
        borderBottomLeftRadius: BorderRadius['4xl'],
        borderBottomRightRadius: BorderRadius['4xl'],
        ...Shadows.header,
    },
    content: {
        padding: Spacing.xl,
        paddingTop: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
        paddingTop: Spacing.lg,
    },
    title: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 22,
        color: Colors.light.text,
    },
    subtitle: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 10,
        color: Colors.brand.primary,
        letterSpacing: 1.5,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.light.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.brand.primarySoft,
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.brand.primary + '20',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.neutral.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        ...Shadows.card,
    },
    iconContainerSmall: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.light.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    locationInfo: {
        flex: 1,
    },
    locationTitle: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 16,
        color: Colors.brand.primary,
    },
    locationSubtitle: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 12,
        color: Colors.brand.primary,
        opacity: 0.8,
    },
    sectionTitle: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 12,
        color: Colors.light.textMuted,
        letterSpacing: 1,
        marginBottom: Spacing.lg,
    },
    addressItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border,
    },
    addressLabel: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 15,
        color: Colors.light.text,
    },
    addressText: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 13,
        color: Colors.light.textMuted,
        marginTop: 2,
    },
    activeBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.brand.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.brand.primary,
    },
    deleteLocationButton: {
        padding: Spacing.xs,
        marginLeft: Spacing.sm,
    },
    addLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xl,
        paddingVertical: Spacing.sm,
    },
    addLocationText: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 14,
        color: Colors.brand.primary,
    },
    plusIcon: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 18,
        color: Colors.brand.primary,
        textAlign: 'center',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.light.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 8,
    },
    addingContainer: {
        marginTop: Spacing.xl,
        backgroundColor: Colors.light.backgroundSecondary,
        padding: Spacing.lg,
        borderRadius: BorderRadius['2xl'],
    },
    inputField: {
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 14,
        color: Colors.light.text,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.light.background,
    },
    cancelButtonText: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        color: Colors.light.textMuted,
    },
    saveButton: {
        paddingVertical: 10,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.brand.primary,
    },
    saveButtonDisabled: {
        backgroundColor: Colors.light.border,
    },
    saveButtonText: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        color: Colors.neutral.white,
    },
});
