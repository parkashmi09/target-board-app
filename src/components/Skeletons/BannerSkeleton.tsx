import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';

const BannerSkeleton: React.FC = React.memo(() => {
  const theme = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  const bannerHeight = screenWidth * 0.4;

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
    outputRange: [-screenWidth * 2, screenWidth * 2],
  });

  return (
    <View style={[styles.container, { height: bannerHeight, backgroundColor: theme.colors.border }]}>
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
  );
});

BannerSkeleton.displayName = 'BannerSkeleton';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: getSpacing(2),
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: -200,
    width: 200,
    height: '100%',
    opacity: 0.5,
  },
});

export default BannerSkeleton;

