import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import { MainStackParamList } from '../navigation/MainStack';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import { TERMS_AND_CONDITIONS_URL } from '../services/config';
import { useTranslation } from 'react-i18next';

type TermsAndConditionsRouteProp = RouteProp<MainStackParamList, 'TermsAndConditions'>;

const TermsAndConditionsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const route = useRoute<TermsAndConditionsRouteProp>();
  const { url } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use URL from route params, or fallback to config, or show error
  const termsUrl = url || TERMS_AND_CONDITIONS_URL;

  const handleError = () => {
    setLoading(false);
    setError(t('profile.termsLoadError') || 'Failed to load Terms & Conditions. Please check your internet connection.');
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  if (!termsUrl) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <ScreenHeader 
            title={t('profile.termsAndConditions') || 'Terms & Conditions'} 
            showSearch={false}
            onBackPress={() => navigation.goBack()}
          />
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error || 'red' }]}>
              {t('profile.termsNotConfigured') || 'Terms & Conditions URL is not configured.'}
            </Text>
            <Text style={[styles.errorSubtext, { color: theme.colors.textSecondary }]}>
              {t('profile.contactSupport') || 'Please contact support or check your settings.'}
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={[styles.backButton, { backgroundColor: theme.colors.accent }]}
            >
              <Text style={[styles.backButtonText, { color: '#fff' }]}>
                {t('common.goBack') || 'Go Back'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <View style={styles.container}>
        <ScreenHeader 
          title={t('profile.termsAndConditions') || 'Terms & Conditions'} 
          showSearch={false}
          onBackPress={() => navigation.goBack()}
        />
        
        <View style={styles.webViewContainer}>
          {loading && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                {t('common.loading') || 'Loading Terms & Conditions...'}
              </Text>
            </View>
          )}
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.colors.error || 'red' }]}>
                {error}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setError(null);
                  setLoading(true);
                }} 
                style={[styles.retryButton, { backgroundColor: theme.colors.accent }]}
              >
                <Text style={[styles.retryButtonText, { color: '#fff' }]}>
                  {t('common.retry') || 'Retry'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              source={{ uri: termsUrl }}
              style={styles.webview}
              onLoadEnd={handleLoadEnd}
              onError={handleError}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loader}>
                  <ActivityIndicator size="large" color={theme.colors.accent} />
                </View>
              )}
              onShouldStartLoadWithRequest={(request) => {
                // Allow same-origin navigation
                if (termsUrl && request.url.startsWith(termsUrl.split('/').slice(0, 3).join('/'))) {
                  return true;
                }
                // Block external links (optional - you can allow them if needed)
                return false;
              }}
            />
          )}
        </View>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webViewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
  },
  loadingText: {
    marginTop: getSpacing(1),
    fontSize: moderateScale(14),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(3),
  },
  errorText: {
    fontSize: moderateScale(16),
    marginBottom: getSpacing(1),
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: moderateScale(14),
    marginBottom: getSpacing(2),
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: getSpacing(1.5),
    paddingHorizontal: getSpacing(3),
    borderRadius: moderateScale(8),
    marginTop: getSpacing(2),
  },
  backButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  retryButton: {
    paddingVertical: getSpacing(1.5),
    paddingHorizontal: getSpacing(3),
    borderRadius: moderateScale(8),
    marginTop: getSpacing(2),
  },
  retryButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#fff',
  },
});

export default TermsAndConditionsScreen;

