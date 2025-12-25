import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../../theme/theme';

interface CourseBottomBarProps {
    currentPrice: number;
    originalPrice: number;
    discount: number;
    isCoursePaid: boolean;
    hasLiveStreams: boolean;
    onBuyNow: () => void;
}

const CourseBottomBar: React.FC<CourseBottomBarProps> = React.memo(({
    currentPrice,
    originalPrice,
    discount,
    isCoursePaid,
    hasLiveStreams,
    onBuyNow,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.priceContainer}>
                <Text style={styles.priceMain}>₹{currentPrice}</Text>
                <Text style={styles.priceOriginal}>₹{originalPrice}</Text>
                <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{discount}% OFF</Text>
                </View>
            </View>
            <TouchableOpacity style={styles.buyButton} activeOpacity={0.9} onPress={onBuyNow}>
                <Text style={styles.buyButtonText}>
                    {isCoursePaid && hasLiveStreams ? 'Watch Live' : 'Buy Now'}
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
});

export default CourseBottomBar;

