import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { moderateScale } from '../../utils/responsive';

interface CustomToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  activeColor?: string;
  inactiveColor?: string;
  thumbColor?: string;
  disabled?: boolean;
}

const CustomToggle: React.FC<CustomToggleProps> = ({
  value,
  onValueChange,
  activeColor = '#FFD700',
  inactiveColor = '#E0E0E0',
  thumbColor = '#FFFFFF',
  disabled = false,
}) => {
  const translateX = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [value, translateX]);

  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  const trackWidth = moderateScale(50);
  const trackHeight = moderateScale(28);
  const thumbSize = moderateScale(24);
  const thumbMargin = moderateScale(2);
  const maxTranslate = trackWidth - thumbSize - thumbMargin * 2;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled}
      style={styles.container}
    >
      <View
        style={[
          styles.track,
          {
            width: trackWidth,
            height: trackHeight,
            backgroundColor: value ? activeColor : inactiveColor,
            borderRadius: trackHeight / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbSize,
              height: thumbSize,
              backgroundColor: thumbColor,
              borderRadius: thumbSize / 2,
              transform: [
                {
                  translateX: translateX.interpolate({
                    inputRange: [0, 1],
                    outputRange: [thumbMargin, maxTranslate],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  track: {
    justifyContent: 'center',
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default CustomToggle;

