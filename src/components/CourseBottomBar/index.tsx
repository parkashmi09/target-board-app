import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { useTheme } from '../../theme/theme';
import { getFontFamily } from '../../utils/fonts';
import SVGIcon from '../SVGIcon';
import { moderateScale } from '../../utils/responsive';

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
    // Animation values
    const iconBounceAnim = useRef(new Animated.Value(1)).current;
    const textBounceAnim = useRef(new Animated.Value(1)).current;

    // Continuous bounce animation for icon
    useEffect(() => {
        if (isPurchased) {
            const iconAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(iconBounceAnim, {
                        toValue: 1.2,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(iconBounceAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            );
            iconAnimation.start();

            // Text bounce animation
            const textAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(textBounceAnim, {
                        toValue: 1.1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(textBounceAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            );
            textAnimation.start();

            return () => {
                iconAnimation.stop();
                textAnimation.stop();
            };
        }
    }, [isPurchased, iconBounceAnim, textBounceAnim]);

    const getButtonText = () => {
        if (isPurchased) {
            return 'Watch Live';
        }
        if (isCoursePaid && hasLiveStreams) {
            return 'Watch Live';
        }
        return 'Buy Now';
    };

    // If purchased, show only Watch Live with animation
    if (isPurchased) {
        return (
            <View style={styles.container}>
                <TouchableOpacity 
                    style={styles.watchLiveButton} 
                    activeOpacity={0.9} 
                    onPress={onBuyNow}
                >
                    <Animated.View
                        style={{
                            transform: [{ scale: iconBounceAnim }],
                            marginRight: moderateScale(12),
                        }}
                    >
                        <SVGIcon 
                            name="play" 
                            size={24} 
                            color="#FFFFFF" 
                        />
                    </Animated.View>
                    <Animated.Text 
                        style={[
                            styles.watchLiveText,
                            {
                                transform: [{ scale: textBounceAnim }],
                            }
                        ]}
                    >
                        Watch Live
                    </Animated.Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Regular buy button for non-purchased courses
    const buttonStyle = styles.buyButton;

    return (
        <View style={styles.container}>
            <View style={styles.priceContainer}>
                <Text style={styles.priceMain}>₹{currentPrice}</Text>
                <Text style={styles.priceOriginal}>₹{originalPrice}</Text>
                {discount > 0 && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{discount}% OFF</Text>
                    </View>
                )}
            </View>
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
        fontFamily: getFontFamily('700'),
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
        fontFamily: getFontFamily('700'),
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
        fontFamily: getFontFamily('700'),
    },
    watchLiveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(12),
    },
    watchLiveText: {
        color: '#FFFFFF',
        fontSize: moderateScale(20),
        fontFamily: getFontFamily('700'),
        letterSpacing: 0.5,
    },
});

export default CourseBottomBar;

