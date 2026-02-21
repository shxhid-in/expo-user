import * as React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SharedValue, runOnJS } from 'react-native-reanimated';
import { Colors, Typography, Shadows, BorderRadius, Spacing } from '../../theme';
import { resolveImageSource } from '../../services/api';
import { formatCurrency } from '../../utils/formatting';
import Svg, { Path, Circle } from 'react-native-svg';

interface VendorInfo {
    vendorId: string;
    vendorName: string;
    vendorImage: string;
    vendorRating: number;
    vendorDistance: string;
    price: number;
}

interface DraggableItemProps {
    productId: string;
    productName: string;
    productImage: string;
    vendor: VendorInfo;
    isBest?: boolean;
    onDragStart: (item: any) => void;
    onDragEnd: (x: number, y: number, item: any) => void;
    dragX: SharedValue<number>;
    dragY: SharedValue<number>;
    onSelect?: () => void;
    variant?: 'grid' | 'row' | 'vendor-card'; // Grid card for vendor store, Row for category marketplace, vendor-card for chat discovery
}

export default function DraggableItem({
    productId,
    productName,
    productImage,
    vendor,
    isBest = false,
    onDragStart,
    onDragEnd,
    dragX,
    dragY,
    onSelect,
    variant = 'row',
}: DraggableItemProps) {
    const item = {
        id: productId,
        name: productName,
        vendorId: vendor.vendorId,
        vendorName: vendor.vendorName,
        price: vendor.price,
        image: productImage,
    };

    const pan = Gesture.Pan()
        .activateAfterLongPress(150)
        .onStart(() => {
            runOnJS(onDragStart)(item);
        })
        .onUpdate((e) => {
            dragX.value = e.absoluteX - 80;
            dragY.value = e.absoluteY - 40;
        })
        .onEnd((e) => {
            runOnJS(onDragEnd)(e.absoluteX, e.absoluteY, item);
        });

    const tap = Gesture.Tap()
        .onEnd(() => {
            if (onSelect) {
                runOnJS(onSelect)();
            }
        });

    const combined = Gesture.Simultaneous(tap, pan);

    if (variant === 'grid') {
        // Grid card variant (used in VendorStoreScreen)
        return (
            <GestureDetector gesture={combined}>
                <View style={styles.gridCard}>
                    <Image
                        source={resolveImageSource(productImage)}
                        style={styles.gridImage}
                        defaultSource={require('../../../assets/icon.png')}
                    />
                    <View style={styles.gridInfo}>
                        <Text style={styles.gridName} numberOfLines={2}>
                            {productName}
                        </Text>
                        <Text style={styles.gridPrice}>{formatCurrency(vendor.price)}/kg</Text>
                        <Text style={styles.gridHint}>Long press to drag</Text>
                    </View>
                </View>
            </GestureDetector>
        );
    }

    if (variant === 'vendor-card') {
        const specialty = (vendor as any).specialty || 'Fresh Produce';
        return (
            <GestureDetector gesture={combined}>
                <View style={styles.vendorDiscoveryCard}>
                    <View style={styles.vendorLogoCircle}>
                        <Image
                            source={resolveImageSource(vendor.vendorImage)}
                            style={styles.vendorLogo}
                            defaultSource={require('../../../assets/icon.png')}
                        />
                    </View>
                    <Text style={styles.vendorCardName} numberOfLines={1}>{vendor.vendorName}</Text>
                    <Text style={styles.vendorCardSpecialty} numberOfLines={1}>{specialty.toUpperCase()}</Text>

                    <View style={styles.vendorCardDivider} />

                    <View style={styles.vendorCardFooter}>
                        <View style={styles.vendorCardMetaItem}>
                            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={Colors.light.textMuted} strokeWidth={2}>
                                <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                <Circle cx={12} cy={10} r={3} />
                            </Svg>
                            <Text style={styles.vendorCardMetaText}>{vendor.vendorDistance}</Text>
                        </View>
                    </View>
                </View>
            </GestureDetector>
        );
    }

    // Row variant
    return (
        <GestureDetector gesture={combined}>
            <View style={[styles.vendorRow, isBest ? styles.vendorRowBest : null]}>
                {isBest && (
                    <View style={styles.bestBadge}>
                        <Text style={styles.bestBadgeText}>BEST PRICE</Text>
                    </View>
                )}
                <Image
                    source={resolveImageSource(vendor.vendorImage)}
                    style={styles.vendorRowImage}
                    defaultSource={require('../../../assets/icon.png')}
                />
                <View style={styles.vendorRowInfo}>
                    <Text style={styles.vendorRowName}>{vendor.vendorName}</Text>
                    <View style={styles.vendorRowMeta}>
                        <Text style={styles.vendorRowStar}>⭐</Text>
                        <Text style={styles.vendorRowRating}>{vendor.vendorRating}</Text>
                        <Text style={styles.vendorRowDot}>•</Text>
                        <Text style={styles.vendorRowDistance}>{vendor.vendorDistance}</Text>
                    </View>
                    <Text style={styles.dragHint}>Long press to drag</Text>
                </View>
                <View style={styles.vendorRowPriceArea}>
                    <Text style={styles.vendorRowPrice}>{formatCurrency(vendor.price)}</Text>
                    <Text style={styles.vendorRowUnit}>/ KG</Text>
                </View>
                {onSelect && (
                    <TouchableOpacity
                        style={[styles.selectArrow, isBest ? styles.selectArrowBest : null]}
                        onPress={onSelect}
                    >
                        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={isBest ? Colors.neutral.white : Colors.light.textMuted} strokeWidth={2}>
                            <Path d="M9 18l6-6-6-6" />
                        </Svg>
                    </TouchableOpacity>
                )}
            </View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    // Grid variant styles
    gridCard: {
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius['3xl'],
        overflow: 'hidden',
        ...Shadows.card,
        marginBottom: 4,
    },
    gridImage: {
        width: '100%',
        height: 140,
        backgroundColor: Colors.light.backgroundSecondary,
    },
    gridInfo: {
        padding: 12,
    },
    gridName: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 14,
        color: Colors.light.text,
        lineHeight: 18,
        marginBottom: 4,
    },
    gridPrice: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 16,
        color: Colors.brand.primary,
        marginBottom: 4,
    },
    gridHint: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 10,
        color: Colors.light.textMuted,
    },

    // Row variant styles
    vendorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius['3xl'],
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.light.border,
        ...Shadows.card,
    },
    vendorRowBest: {
        borderColor: Colors.brand.primary,
        borderWidth: 2,
    },
    bestBadge: {
        position: 'absolute',
        top: -10,
        right: Spacing.lg,
        backgroundColor: Colors.brand.primary,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: BorderRadius.sm,
    },
    bestBadgeText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 10,
        color: Colors.neutral.white,
        letterSpacing: 0.5,
    },
    vendorRowImage: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: Colors.light.backgroundSecondary,
    },
    vendorRowInfo: {
        flex: 1,
        marginLeft: 12,
    },
    vendorRowName: {
        fontFamily: Typography.fontFamily.heading,
        fontSize: 15,
        color: Colors.light.text,
    },
    vendorRowMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    vendorRowStar: {
        fontSize: 11,
    },
    vendorRowRating: {
        fontFamily: Typography.fontFamily.bodySemiBold,
        fontSize: 12,
        color: Colors.light.text,
    },
    vendorRowDot: {
        fontSize: 10,
        color: Colors.light.textMuted,
    },
    vendorRowDistance: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 12,
        color: Colors.light.textMuted,
    },
    dragHint: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 10,
        color: Colors.brand.primary,
        marginTop: 4,
    },
    vendorRowPriceArea: {
        alignItems: 'flex-end',
        marginRight: 10,
    },
    vendorRowPrice: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 20,
        color: Colors.light.text,
    },
    vendorRowUnit: {
        fontFamily: Typography.fontFamily.body,
        fontSize: 11,
        color: Colors.light.textMuted,
    },
    selectArrow: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.light.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectArrowBest: {
        backgroundColor: Colors.brand.primary,
    },

    // Vendor Discovery Card variant styles (ChatScreen)
    vendorDiscoveryCard: {
        width: (Dimensions.get('window').width - 80) / 2 - 5,
        backgroundColor: Colors.light.background,
        borderRadius: BorderRadius['3xl'],
        padding: Spacing.md,
        alignItems: 'center',
        ...Shadows.card,
        marginBottom: 8,
    },
    vendorLogoCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    vendorLogo: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    vendorCardName: {
        fontFamily: Typography.fontFamily.headingBold,
        fontSize: 14,
        color: Colors.light.text,
        marginBottom: 2,
    },
    vendorCardSpecialty: {
        fontFamily: Typography.fontFamily.bodyMedium,
        fontSize: 10,
        color: Colors.light.textMuted,
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    vendorCardDivider: {
        width: '100%',
        height: 1,
        backgroundColor: '#F1F5F9',
        marginBottom: 8,
    },
    vendorCardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    vendorCardMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    vendorCardMetaText: {
        fontFamily: Typography.fontFamily.bodyBold,
        fontSize: 11,
        color: Colors.light.text,
    },
    vendorCardDot: {
        fontSize: 10,
        color: Colors.light.textMuted,
        opacity: 0.5,
    },
});
