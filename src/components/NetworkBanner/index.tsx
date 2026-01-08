import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { useNetworkStore } from '../../store/networkStore';
import { useTranslation } from 'react-i18next';
import SVGIcon from '../SVGIcon';

const NetworkBanner: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { isConnected, isInternetReachable, checkConnection } = useNetworkStore();
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  // Check connection status periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      checkConnection();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [checkConnection]);

  const isOffline = !isConnected || isInternetReachable === false;

  useEffect(() => {
    if (isOffline) {
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      // Slide up
      Animated.spring(slideAnim, {
        toValue: -100,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  }, [isOffline, slideAnim]);

  if (!isOffline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.warning,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <SVGIcon name="wifi-off" size={moderateScale(18)} color={theme.colors.textInverse} />
        <Text style={[styles.text, { color: theme.colors.textInverse }]}>
          {t('offline.banner') || 'No Internet Connection'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingVertical: getSpacing(1),
    paddingHorizontal: getSpacing(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: getSpacing(1),
  },
  text: {
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
});

export default NetworkBanner;

