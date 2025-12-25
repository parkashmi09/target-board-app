import React from 'react';
import { ActivityIndicator, Modal, View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme/theme';
import { useLoaderStore } from '../../store/loaderStore';
import { moderateScale } from '../../utils/responsive';

/**
 * Global Loader Component (Zustand-based)
 * 
 * Efficiently manages global loading state:
 * - Uses Zustand for global state management
 * - Counter pattern for multiple simultaneous loads
 */

export const GlobalLoaderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const { isVisible, message } = useLoaderStore();

  return (
    <>
      {children}
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.backdrop}>
          <View style={[styles.indicatorWrap, { backgroundColor: theme.colors.cardBackground }]}>
            <ActivityIndicator
              size="large"
              color={theme.colors.accent}
            />
            {message && (
              <Text
                style={[
                  styles.message,
                  {
                    color: theme.colors.text,
                    marginTop: moderateScale(12),
                  },
                ]}
              >
                {message}
              </Text>
            )}
          </View>
        </View>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorWrap: {
    padding: moderateScale(20),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: moderateScale(100),
    minHeight: moderateScale(100),
  },
  message: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    textAlign: 'center',
    marginTop: moderateScale(12),
  },
});


