import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';

const StreamSkeletonCard: React.FC = React.memo(() => {
    const theme = useTheme();
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    const screenWidth = Dimensions.get('window').width;
    const sidePadding = getSpacing(2);
    const cardWidth = screenWidth - (sidePadding * 2);
    const bannerHeight = cardWidth * (9 / 16);

    useEffect(() => {
        const shimmerAnimation = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            })
        );
        shimmerAnimation.start();
        return () => {
            shimmerAnimation.stop();
        };
    }, [shimmerAnim]);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-cardWidth * 2, cardWidth * 2],
    });

    return (
        <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={[styles.bannerContainer, { height: bannerHeight, backgroundColor: theme.colors.border }]}>
                <Animated.View
                    style={[
                        styles.shimmer,
                        {
                            transform: [{ translateX }],
                            backgroundColor: theme.isDark 
                                ? 'rgba(255, 255, 255, 0.15)' 
                                : 'rgba(255, 255, 255, 0.4)',
                        },
                    ]}
                />
            </View>
            <View style={[styles.titleContainer, { backgroundColor: theme.colors.cardBackground }]}>
                <View style={[styles.titleRow, { height: moderateScale(40), backgroundColor: theme.colors.border }]} />
                <View style={[styles.titleRow, { height: moderateScale(20), width: '60%', marginTop: getSpacing(0.5), backgroundColor: theme.colors.border }]} />
            </View>
        </View>
    );
});

StreamSkeletonCard.displayName = 'StreamSkeletonCard';

const styles = StyleSheet.create({
    card: {
        borderRadius: moderateScale(16),
        marginBottom: getSpacing(2),
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        width: '100%',
    },
    bannerContainer: {
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        left: -200,
        width: 200,
        height: '100%',
        opacity: 0.5,
    },
    titleContainer: {
        padding: getSpacing(1.5),
    },
    titleRow: {
        borderRadius: moderateScale(4),
    },
});

export default StreamSkeletonCard;

