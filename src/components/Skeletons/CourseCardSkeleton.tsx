import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';

const CourseCardSkeleton: React.FC = React.memo(() => {
  const theme = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  // Match CourseSection carousel layout: windowWidth - horizontalPadding * 2 - peekAmount
  const horizontalPadding = getSpacing(1.5);
  const peekAmount = moderateScale(28);
  const cardWidth = screenWidth - horizontalPadding * 2 - peekAmount;
  const cardHeight = cardWidth * (9 / 16) + moderateScale(130); // Match CourseSection cardHeight
  const imageHeight = cardWidth * (9 / 16); // 16:9 aspect ratio

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-cardWidth * 2, cardWidth * 2],
  });

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, width: cardWidth, height: cardHeight }]}>
      {/* Image skeleton */}
      <View style={[styles.imageContainer, { height: imageHeight, backgroundColor: theme.colors.border }]}>
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

      {/* Content skeleton */}
      <View style={styles.contentContainer}>
        {/* Title */}
        <View style={[styles.titleLine, { backgroundColor: theme.colors.border, height: moderateScale(16) }]} />
        <View style={[styles.titleLine, { backgroundColor: theme.colors.border, height: moderateScale(12), width: '70%', marginTop: getSpacing(0.5) }]} />

        {/* Price */}
        <View style={styles.priceContainer}>
          <View style={[styles.priceLine, { backgroundColor: theme.colors.border, height: moderateScale(18) }]} />
          <View style={[styles.priceLine, { backgroundColor: theme.colors.border, height: moderateScale(14), width: '40%' }]} />
        </View>

        {/* Badge */}
        <View style={[styles.badge, { backgroundColor: theme.colors.border, height: moderateScale(20) }]} />
      </View>
    </View>
  );
});

CourseCardSkeleton.displayName = 'CourseCardSkeleton';

const styles = StyleSheet.create({
  card: {
    borderRadius: moderateScale(12),
    marginBottom: getSpacing(2),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
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
  contentContainer: {
    padding: getSpacing(1.5),
  },
  titleLine: {
    borderRadius: moderateScale(4),
    marginBottom: getSpacing(0.5),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: getSpacing(1),
    gap: getSpacing(1),
  },
  priceLine: {
    borderRadius: moderateScale(4),
  },
  badge: {
    position: 'absolute',
    top: getSpacing(1.5),
    right: getSpacing(1.5),
    width: moderateScale(40),
    borderRadius: moderateScale(4),
  },
});

export default CourseCardSkeleton;

