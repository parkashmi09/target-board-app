import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Clipboard, Linking } from 'react-native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import { getFontFamily } from '../utils/fonts';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import SVGIcon from '../components/SVGIcon';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AlertBox from '../components/AlertBox';
import messaging from '@react-native-firebase/messaging';

const LANGUAGE_STORAGE_KEY = '@app_language';

const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { logout } = useAuthStore();
  const navigation = useNavigation<any>();

  // Get current language from i18n or default to 'en'
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'hi'>('en');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [fcmToken, setFcmToken] = useState<string>('');

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        // Get language from i18n first, then fallback to AsyncStorage
        const i18nLang = i18n?.language || 'en';
        const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        const lang = savedLang === 'en' || savedLang === 'hi' ? savedLang : (i18nLang.startsWith('hi') ? 'hi' : 'en');
        setCurrentLanguage(lang);
      } catch (error) {
        if (__DEV__) {
          console.error('Load language error:', error);
        }
        setCurrentLanguage('en');
      }
    };
    loadLanguage();
  }, [i18n]);

  // Load FCM Token
  useEffect(() => {
    const loadFcmToken = async () => {
      try {
        const token = await messaging().getToken();
        setFcmToken(token);
        if (__DEV__) {
          console.log('📱 FCM Token loaded in settings:', token);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Failed to get FCM token:', error);
        }
        setFcmToken('Not available');
      }
    };
    loadFcmToken();
  }, []);

  const copyFcmToken = useCallback(() => {
    if (fcmToken && fcmToken !== 'Not available') {
      Clipboard.setString(fcmToken);
      Alert.alert('Copied!', 'FCM Token copied to clipboard');
    }
  }, [fcmToken]);

  const changeLanguage = useCallback(async (lng: 'en' | 'hi') => {
    try {
      // Change language in i18n
      if (i18n && i18n.changeLanguage) {
        await i18n.changeLanguage(lng);
      }
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
      setCurrentLanguage(lng);
    } catch (error) {
      if (__DEV__) {
        console.error('Language change error:', error);
      }
    }
  }, [i18n]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      // Navigate to login screen if needed
      // navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      if (__DEV__) {
        console.error('Logout error:', error);
      }
      Alert.alert(
        t('common.error') || 'Error',
        t('common.logoutError') || 'Failed to logout. Please try again.',
        [{ text: t('common.ok') || 'OK' }]
      );
    }
  }, [logout, t]);

  const handleDeleteAccount = useCallback(async () => {
    try {
      // Close modal first
      setShowDeleteModal(false);
      
      // Open account deletion URL in browser
      const accountDeletionUrl = 'https://teachmania.online/accountdel/';
      const canOpen = await Linking.canOpenURL(accountDeletionUrl);
      
      if (canOpen) {
        await Linking.openURL(accountDeletionUrl);
      } else {
        Alert.alert(
          t('common.error') || 'Error',
          'Cannot open account deletion page. Please try again later.',
          [{ text: t('common.ok') || 'OK' }]
        );
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('Open account deletion URL error:', error);
      }
      
      Alert.alert(
        t('common.error') || 'Error',
        error?.message || 'Failed to open account deletion page. Please try again later.',
        [{ text: t('common.ok') || 'OK' }]
      );
    }
  }, [t]);

  const renderSettingItem = (
    icon: string, 
    label: string, 
    onPress?: () => void, 
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={[styles.item, { borderBottomColor: theme.colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.itemLeft}>
        <SVGIcon name={icon} size={moderateScale(20)} color={theme.colors.text} />
        <Text style={[styles.itemText, { color: theme.colors.text }]}>{label}</Text>
      </View>
      {rightElement || (
        <SVGIcon name="chevron-right" size={moderateScale(18)} color={theme.colors.textSecondary} />
      )}
    </TouchableOpacity>
  );


  return (
    <GradientBackground>
      <View style={styles.container}>
        <ScreenHeader showSearch={false} title={t('drawer.settings') || 'Settings'} />

        <ScrollView contentContainerStyle={styles.content}>
          {/* Language Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              {t('drawer.language') || 'Language'}
            </Text>
            <View style={styles.languageContainer}>
              <TouchableOpacity
                onPress={() => changeLanguage('en')}
                style={[
                  styles.languageButton,
                  {
                    backgroundColor: currentLanguage === 'en' ? theme.colors.accent : 'transparent',
                    borderColor: currentLanguage === 'en' ? theme.colors.accent : theme.colors.border,
                  }
                ]}
              >
                <Text style={{
                  color: currentLanguage === 'en' ? theme.colors.text : theme.colors.textSecondary,
                  fontFamily: getFontFamily('600'),
                  fontSize: moderateScale(14),
                }}>English</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => changeLanguage('hi')}
                style={[
                  styles.languageButton,
                  {
                    backgroundColor: currentLanguage === 'hi' ? theme.colors.accent : 'transparent',
                    borderColor: currentLanguage === 'hi' ? theme.colors.accent : theme.colors.border,
                  }
                ]}
              >
                <Text style={{
                  color: currentLanguage === 'hi' ? theme.colors.text : theme.colors.textSecondary,
                  fontFamily: getFontFamily('600'),
                  fontSize: moderateScale(14),
                }}>हिंदी</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Profile Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              {t('navigation.profile') || 'Profile'}
            </Text>
            {renderSettingItem(
              'user', 
              t('profile.editProfile') || 'Edit Profile', 
              () => {
                navigation.navigate('EditProfile');
              }
            )}
          </View>

          {/* General Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              General
            </Text>
            {renderSettingItem(
              'shield', 
              t('profile.privacyPolicy') || 'Privacy Policy', 
              () => {
                navigation.navigate('PrivacyPolicy');
              }
            )}
            {renderSettingItem(
              'file', 
              t('profile.termsAndConditions') || 'Terms & Conditions', 
              () => {
                navigation.navigate('TermsAndConditions');
              }
            )}
          </View>

          {/* FCM Token Section (Temporary for Testing) */}
          {/* <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              FCM Token (Testing)
            </Text>
            <TouchableOpacity
              style={[styles.fcmTokenContainer, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
              onPress={copyFcmToken}
              activeOpacity={0.7}
            >
              <View style={styles.fcmTokenContent}>
                <Text style={[styles.fcmTokenLabel, { color: theme.colors.textSecondary }]}>
                  FCM Token:
                </Text>
                <Text style={[styles.fcmTokenText, { color: theme.colors.text }]} numberOfLines={2}>
                  {fcmToken || 'Loading...'}
                </Text>
              </View>
              <SVGIcon name="copy" size={moderateScale(20)} color={theme.colors.accent} />
            </TouchableOpacity>
            <Text style={[styles.fcmTokenHint, { color: theme.colors.textSecondary }]}>
              Tap to copy token for testing
            </Text>
          </View> */}

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              {t('profile.account') || 'Account'}
            </Text>
            {renderSettingItem(
              'trash-2', 
              t('profile.deleteAccount') || 'Delete Account', 
              () => {
                setShowDeleteModal(true);
              }
            )}
          </View>
        </ScrollView>

        <View style={[styles.footerContainer, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: '#ffebee' }]}
            onPress={() => setShowLogoutModal(true)}
            activeOpacity={0.7}
          >
            <SVGIcon name="logout" size={moderateScale(20)} color="#ff4d4d" />
            <Text style={styles.logoutText}>
              {t('common.logout') || 'Logout'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout Confirmation Modal */}
      <AlertBox
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title={t('common.logout') || 'Logout'}
        message={t('common.logoutConfirm') || 'Are you sure you want to logout?'}
        confirmText={t('common.logout') || 'Logout'}
        cancelText={t('common.cancel') || 'Cancel'}
        onConfirm={handleLogout}
        type="warning"
        icon="logout"
      />

      {/* Delete Account Confirmation Modal */}
      <AlertBox
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('profile.deleteAccount') || 'Delete Account'}
        message={t('profile.deleteAccountWarning') || 'Are you sure you want to delete your account? This action cannot be undone. All your data, courses, and progress will be permanently deleted.'}
        confirmText={t('profile.delete') || 'Delete'}
        cancelText={t('common.cancel') || 'Cancel'}
        onConfirm={handleDeleteAccount}
        type="danger"
        icon="trash-2"
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: getSpacing(2),
    paddingBottom: getSpacing(4),
  },
  section: {
    marginBottom: getSpacing(3),
  },
  sectionTitle: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('500'),
    marginBottom: getSpacing(1.5),
    marginLeft: getSpacing(1),
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getSpacing(1.5),
    paddingHorizontal: getSpacing(1),
    borderBottomWidth: 0.5,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('400'),
    marginLeft: getSpacing(2),
  },
  languageContainer: {
    flexDirection: 'row',
    gap: getSpacing(2),
    paddingHorizontal: getSpacing(1),
  },
  languageButton: {
    flex: 1,
    paddingVertical: getSpacing(1.25),
    paddingHorizontal: getSpacing(2),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getSpacing(1.5),
    borderRadius: moderateScale(8),
    marginTop: getSpacing(2),
    gap: getSpacing(1.5),
  },
  logoutText: {
    color: '#ff4d4d',
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('600'),
  },
  footerContainer: {
    padding: getSpacing(2),
    borderTopWidth: 1,
    backgroundColor: 'transparent',
    marginBottom: getSpacing(2),
  },
  fcmTokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getSpacing(2),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    marginHorizontal: getSpacing(1),
  },
  fcmTokenContent: {
    flex: 1,
    marginRight: getSpacing(2),
  },
  fcmTokenLabel: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('500'),
    marginBottom: getSpacing(0.5),
  },
  fcmTokenText: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('400'),
    lineHeight: moderateScale(16),
  },
  fcmTokenHint: {
    fontSize: moderateScale(11),
    fontFamily: getFontFamily('400'),
    marginTop: getSpacing(1),
    marginLeft: getSpacing(1),
    fontStyle: 'italic',
  },
});

export default SettingsScreen;
