import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';

const TeacherCardSkeleton: React.FC = React.memo(() => {
  const theme = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

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
    outputRange: [-200, 200],
  });

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
      {/* Avatar skeleton */}
      <View style={[styles.avatarContainer, { backgroundColor: theme.colors.border }]}>
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
        <View style={[styles.nameLine, { backgroundColor: theme.colors.border, height: moderateScale(16) }]} />
        <View style={[styles.subjectLine, { backgroundColor: theme.colors.border, height: moderateScale(12), width: '60%', marginTop: getSpacing(0.5) }]} />
        <View style={[styles.ratingLine, { backgroundColor: theme.colors.border, height: moderateScale(14), width: '40%', marginTop: getSpacing(1) }]} />
      </View>
    </View>
  );
});

TeacherCardSkeleton.displayName = 'TeacherCardSkeleton';

const styles = StyleSheet.create({
  card: {
    borderRadius: moderateScale(12),
    padding: getSpacing(2),
    marginRight: getSpacing(2),
    alignItems: 'center',
    width: moderateScale(120),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: moderateScale(40),
    position: 'relative',
    overflow: 'hidden',
    marginBottom: getSpacing(1),
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
    width: '100%',
    alignItems: 'center',
  },
  nameLine: {
    borderRadius: moderateScale(4),
    width: '80%',
  },
  subjectLine: {
    borderRadius: moderateScale(4),
  },
  ratingLine: {
    borderRadius: moderateScale(4),
  },
});

export default TeacherCardSkeleton;

