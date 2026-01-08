import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../../theme/theme';

interface CourseBottomBarProps {
    currentPrice: number;
    originalPrice: number;
    discount: number;
    isCoursePaid: boolean;
    isPurchased?: boolean;
    hasLiveStreams: boolean;
    onBuyNow: () => void;
}

const CourseBottomBar: React.FC<CourseBottomBarProps> = React.memo(({
    currentPrice,
    originalPrice,
    discount,
    isCoursePaid,
    isPurchased = false,
    hasLiveStreams,
    onBuyNow,
}) => {
    const getButtonText = () => {
        if (isPurchased) {
            if (hasLiveStreams) {
                return 'Watch Live';
            }
            return 'View Content';
        }
        if (isCoursePaid && hasLiveStreams) {
            return 'Watch Live';
        }
        return 'Buy Now';
    };

    const buttonStyle = isPurchased 
        ? [styles.buyButton, styles.purchasedButton]
        : styles.buyButton;

    return (
        <View style={styles.container}>
            {!isPurchased && (
                <View style={styles.priceContainer}>
                    <Text style={styles.priceMain}>₹{currentPrice}</Text>
                    <Text style={styles.priceOriginal}>₹{originalPrice}</Text>
                    {discount > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{discount}% OFF</Text>
                        </View>
                    )}
                </View>
            )}
            {isPurchased && (
                <View style={styles.purchasedContainer}>
                    <Text style={styles.purchasedText}>Course Purchased</Text>
                </View>
            )}
            <TouchableOpacity 
                style={buttonStyle} 
                activeOpacity={0.9} 
                onPress={onBuyNow}
                disabled={false}
            >
                <Text style={styles.buyButtonText}>
                    {getButtonText()}
                </Text>
            </TouchableOpacity>
        </View>
    );
});

CourseBottomBar.displayName = 'CourseBottomBar';

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#001F3F',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        elevation: 10,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priceMain: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '700',
    },
    priceOriginal: {
        color: '#B0BEC5',
        fontSize: 16,
        textDecorationLine: 'line-through',
        marginTop: 6,
    },
    discountBadge: {
        backgroundColor: '#FFC107',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 4,
    },
    discountText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '700',
    },
    buyButton: {
        backgroundColor: '#FFC107',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 6,
        elevation: 2,
    },
    buyButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '700',
    },
    purchasedButton: {
        backgroundColor: '#4CAF50',
    },
    purchasedContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    purchasedText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CourseBottomBar;

