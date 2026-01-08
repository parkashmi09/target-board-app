import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Modal, View, StyleSheet, Text, Animated } from 'react-native';
import { useTheme } from '../../theme/theme';
import { useLoaderStore } from '../../store/loaderStore';
import { moderateScale, getSpacing } from '../../utils/responsive';

/**
 * Global Loader Component (Zustand-based)
 * 
 * Efficiently manages global loading state:
 * - Uses Zustand for global state management
 * - Counter pattern for multiple simultaneous loads
 * - Smooth animations for better UX
 */

export const GlobalLoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const { isVisible } = useLoaderStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, fadeAnim]);

  return (
    <>
      {children}
      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <Animated.View 
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={theme.colors.accent}
          />
        </Animated.View>
      </Modal>
    </>
  );
};

/**
 * Hook for manual loader control
 * Use this when you need to manually show/hide the loader
 */
export const useGlobalLoaderManual = () => {
  const { show, hide, isVisible } = useLoaderStore();
  return { show, hide, isVisible };
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White overlay
    alignItems: 'center',
    justifyContent: 'center',
  },
});


