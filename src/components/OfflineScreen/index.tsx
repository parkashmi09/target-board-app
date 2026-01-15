import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import GradientBackground from '../GradientBackground';
import SVGIcon from '../SVGIcon';
import { useTranslation } from 'react-i18next';
import { useNetworkStore } from '../../store/networkStore';
import { Images } from '../../assets/images';

const OfflineScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const { checkConnection, isConnected, isInternetReachable } = useNetworkStore();

  const handleRetry = async () => {
    await checkConnection();
  };

  // For emulators/dev mode, be very lenient - only show if explicitly disconnected
  // isInternetReachable can be null on emulators even when connected via adb reverse
  const isOffline = __DEV__ 
    ? !isConnected  // In dev, only check isConnected
    : !isConnected || isInternetReachable === false; // In production, check both
  
  if (!isOffline) {
    return null;
  }

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* Offline Icon */}
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.warning + '20' }]}>
            <Image 
              source={Images.NO_WIFI} 
              style={styles.offlineImage}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('offline.title') || 'No Internet Connection'}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {t('offline.message') || 'Please check your internet connection and try again.'}
          </Text>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={[styles.tipsTitle, { color: theme.colors.text }]}>
              {t('offline.tips') || 'Tips:'}
            </Text>
            <View style={styles.tipItem}>
              <Text style={[styles.tipBullet, { color: theme.colors.accent }]}>•</Text>
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                {t('offline.tip1') || 'Check your Wi-Fi or mobile data'}
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={[styles.tipBullet, { color: theme.colors.accent }]}>•</Text>
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                {t('offline.tip2') || 'Try moving to an area with better signal'}
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={[styles.tipBullet, { color: theme.colors.accent }]}>•</Text>
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                {t('offline.tip3') || 'Some features may work with cached data'}
              </Text>
            </View>
          </View>

          {/* Retry Button */}
          <TouchableOpacity
            onPress={handleRetry}
            style={[styles.retryButton, { backgroundColor: theme.colors.accent }]}
            activeOpacity={0.7}
          >
            <SVGIcon name="refresh" size={moderateScale(20)} color={theme.colors.textInverse} />
            <Text style={[styles.retryButtonText, { color: theme.colors.textInverse }]}>
              {t('offline.retry') || 'Retry Connection'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(3),
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconContainer: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getSpacing(3),
  },
  offlineImage: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: getSpacing(1.5),
  },
  message: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    lineHeight: moderateScale(24),
    marginBottom: getSpacing(3),
    paddingHorizontal: getSpacing(2),
  },
  tipsContainer: {
    width: '100%',
    marginBottom: getSpacing(3),
    paddingHorizontal: getSpacing(2),
  },
  tipsTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: getSpacing(1.5),
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: getSpacing(1),
  },
  tipBullet: {
    fontSize: moderateScale(16),
    marginRight: getSpacing(1),
    marginTop: moderateScale(2),
  },
  tipText: {
    flex: 1,
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getSpacing(2),
    paddingHorizontal: getSpacing(4),
    borderRadius: moderateScale(12),
    minHeight: moderateScale(50),
    gap: getSpacing(1.5),
    width: '100%',
  },
  retryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
});

export default OfflineScreen;

