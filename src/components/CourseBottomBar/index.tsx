import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { Svg, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { getFontFamily } from '../../utils/fonts';
import { moderateScale } from '../../utils/responsive';
import { ArrowRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface CourseBottomBarProps {
    currentPrice: number;
    originalPrice: number;
    discount: number;
    isCoursePaid: boolean;
    isPurchased?: boolean;
    hasLiveStreams: boolean;
    onBuyNow: () => void;
    onContentPress?: () => void;
}

const CourseBottomBar: React.FC<CourseBottomBarProps> = React.memo(({
    currentPrice,
    originalPrice,
    discount,
    isCoursePaid,
    isPurchased = false,
    hasLiveStreams,
    onBuyNow,
    onContentPress,
}) => {
    const { t } = useTranslation();
    // Animation values for purchased content button
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const iconSlideAnim = useRef(new Animated.Value(0)).current;
    const textScaleAnim = useRef(new Animated.Value(1)).current;

    // Continuous animations for content button
    useEffect(() => {
        if (isPurchased) {
            // Pulse animation
            const pulseAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ])
            );

            // Shimmer effect
            const shimmerAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(shimmerAnim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(shimmerAnim, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ])
            );

            // Icon slide animation
            const iconAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(iconSlideAnim, {
                        toValue: 4,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(iconSlideAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            );

            // Text scale animation
            const textAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(textScaleAnim, {
                        toValue: 1.05,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(textScaleAnim, {
                        toValue: 1,
                        duration: 1200,
                        useNativeDriver: true,
                    }),
                ])
            );

            pulseAnimation.start();
            shimmerAnimation.start();
            iconAnimation.start();
            textAnimation.start();

            return () => {
                pulseAnimation.stop();
                shimmerAnimation.stop();
                iconAnimation.stop();
                textAnimation.stop();
            };
        }
    }, [isPurchased, pulseAnim, shimmerAnim, iconSlideAnim, textScaleAnim]);

    const getButtonText = () => {
        if (isCoursePaid && hasLiveStreams) {
            return 'Watch Live';
        }
        return 'Buy Now';
    };

    // Shimmer gradient interpolation
    const shimmerOpacity = shimmerAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.3, 0.8, 0.3],
    });

    // If purchased, show Content button with gradient and animations
    if (isPurchased) {
        return (
            <View style={[styles.container, styles.contentContainer]}>
                <Animated.View
                    style={[
                        styles.contentButtonWrapper,
                        {
                            transform: [{ scale: pulseAnim }],
                        },
                    ]}
                >
                    <TouchableOpacity 
                        style={styles.contentButton} 
                        activeOpacity={0.9} 
                        onPress={onContentPress || onBuyNow}
                    >
                        <View style={StyleSheet.absoluteFill}>
                            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                                <Defs>
                                    <LinearGradient id="contentButtonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <Stop offset="0%" stopColor="#A5D6A7" stopOpacity="1" />
                                        <Stop offset="30%" stopColor="#81C784" stopOpacity="1" />
                                        <Stop offset="60%" stopColor="#66BB6A" stopOpacity="1" />
                                        <Stop offset="100%" stopColor="#4CAF50" stopOpacity="1" />
                                    </LinearGradient>
                                </Defs>
                                <Rect width="100%" height="100%" rx={8} fill="url(#contentButtonGradient)" />
                            </Svg>
                            {/* Shimmer overlay */}
                            <Animated.View
                                style={[
                                    StyleSheet.absoluteFill,
                                    {
                                        opacity: shimmerOpacity,
                                    },
                                ]}
                            >
                                <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                                    <Defs>
                                        <LinearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                                            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.5" />
                                            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                                        </LinearGradient>
                                    </Defs>
                                    <Rect width="100%" height="100%" rx={8} fill="url(#shimmerGradient)" />
                                </Svg>
                            </Animated.View>
                        </View>
                        <View style={styles.contentButtonInner}>
                            <Animated.Text 
                                style={[
                                    styles.contentButtonText,
                                    {
                                        transform: [{ scale: textScaleAnim }],
                                    },
                                ]}
                            >
                                {t('navigation.viewContent')}
                            </Animated.Text>
                            <Animated.View
                                style={{
                                    transform: [{ translateX: iconSlideAnim }],
                                }}
                            >
                                <ArrowRight size={20} color="#FFFFFF" strokeWidth={3} />
                            </Animated.View>
                        </View>
                    </TouchableOpacity>
                </Animated.View>
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
    contentButtonWrapper: {
        flex: 1,
        borderRadius: 8,
        elevation: 4,
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    contentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: moderateScale(20),
        paddingVertical: moderateScale(14),
        borderRadius: 8,
        overflow: 'hidden',
        minHeight: 50,
    },
    contentButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        zIndex: 1,
    },
    contentButtonText: {
        color: '#FFFFFF',
        fontSize: moderateScale(18),
        fontFamily: getFontFamily('700'),
        letterSpacing: 0.5,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    contentContainer: {
        backgroundColor: 'transparent',
    },
});

export default CourseBottomBar;

