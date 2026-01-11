import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  Animated,
  Keyboard,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OtpInput } from 'react-native-otp-entry';

import { Images } from '../../assets/images';
import { verifyOtp, fetchUserDetails } from '../../services/api';
import { useTheme } from '../../theme/theme';
import messaging from '@react-native-firebase/messaging';
import { useToast } from '../../components/Toast';
import { useGlobalLoaderManual } from '../../components/GlobalLoader';
import { useAuthStore } from '../../store';
import { useLoaderStore } from '../../store/loaderStore';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { getFontFamily } from '../../utils/fonts';
import SVGIcon from '../../components/SVGIcon';
import type { AuthStackParamList } from '../../navigation/AuthStack';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/* ===================== TYPES ===================== */

type OtpVerificationNavigationProp =
  NativeStackNavigationProp<AuthStackParamList, 'OtpVerification'>;

type OtpVerificationRouteProp =
  RouteProp<AuthStackParamList, 'OtpVerification'>;

/* ===================== COMPONENT ===================== */

const OtpVerificationScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<OtpVerificationNavigationProp>();
  const route = useRoute<OtpVerificationRouteProp>();
  const toast = useToast();
  const loader = useGlobalLoaderManual();
  const { login } = useAuthStore();
  const { reset: resetLoader } = useLoaderStore();

  const [mobile, setMobile] = useState<string>(route.params?.mobile || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  /* Animations */
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.9)).current;
  const keyboardShiftY = useRef(new Animated.Value(0)).current;

  /* Keyboard listeners */
  useEffect(() => {
    const keyboardWillShow = (event: any) => {
      setIsKeyboardVisible(true);
      // Shift content up slightly when keyboard appears
      Animated.timing(keyboardShiftY, {
        toValue: -moderateScale(40),
        duration: Platform.OS === 'ios' ? (event?.duration || 250) : 250,
        useNativeDriver: true,
      }).start();
    };

    const keyboardWillHide = (event: any) => {
      setIsKeyboardVisible(false);
      // Return content to original position when keyboard hides
      Animated.timing(keyboardShiftY, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? (event?.duration || 250) : 250,
        useNativeDriver: true,
      }).start();
    };

    if (Platform.OS === 'ios') {
      const showSubscription = Keyboard.addListener('keyboardWillShow', keyboardWillShow);
      const hideSubscription = Keyboard.addListener('keyboardWillHide', keyboardWillHide);
      return () => {
        showSubscription.remove();
        hideSubscription.remove();
      };
    } else {
      const showSubscription = Keyboard.addListener('keyboardDidShow', keyboardWillShow);
      const hideSubscription = Keyboard.addListener('keyboardDidHide', keyboardWillHide);
      return () => {
        showSubscription.remove();
        hideSubscription.remove();
      };
    }
  }, [keyboardShiftY]);

  /* Entry animations */
  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 800,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 800,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 800,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 800,
        delay: 700,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 40,
        friction: 8,
        delay: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  /* OTP Verify */
  const handleVerifyOtp = async (value?: string) => {
    const otpValue = value || otp;
    if (otpValue.length !== 6) {
      toast.show({ text: 'Enter valid 6 digit OTP', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      loader.show();
      
      // Get FCM token with retry logic
      let fcmToken: string | undefined;
      try {
        // Request permission if not already granted
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          // Try to get token with retry (sometimes token needs a moment)
          let retries = 3;
          while (retries > 0 && !fcmToken) {
            try {
              fcmToken = await messaging().getToken();
              if (fcmToken && fcmToken.length > 0) {
                if (__DEV__) {
                  console.log('✅ FCM Token for OTP verification:', fcmToken.substring(0, 20) + '...');
                  console.log('📱 Full FCM Token length:', fcmToken.length);
                }
                break;
              }
            } catch (tokenError) {
              if (__DEV__) {
                console.warn(`⚠️ Token retrieval attempt ${4 - retries} failed:`, tokenError);
              }
              retries--;
              if (retries > 0) {
                // Wait a bit before retrying
                await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
              }
            }
          }
          
          if (!fcmToken) {
            if (__DEV__) {
              console.error('❌ Failed to get FCM token after retries');
            }
          }
        } else {
          if (__DEV__) {
            console.warn('⚠️ FCM Permission not granted, token not available');
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error('❌ Failed to get FCM token for OTP verification:', error);
        }
      }
      
      const res = await verifyOtp(mobile, otpValue, fcmToken);

      if (res.token) {
        await AsyncStorage.setItem('token', res.token);
        const userRes = await fetchUserDetails();
        if (userRes?.user) {
          await AsyncStorage.setItem('userData', JSON.stringify(userRes.user));
        }
        login();
      } else if (res.tempToken) {
        await AsyncStorage.setItem('tempToken', res.tempToken);
        navigation.navigate('RegisterStep1', { tempToken: res.tempToken });
      } else {
        toast.show({ text: 'Invalid OTP', type: 'error' });
      }
    } catch {
      toast.show({ text: 'OTP verification failed', type: 'error' });
    } finally {
      loader.hide();
      resetLoader();
      setLoading(false);
    }
  };

  // Calculate responsive sizes
  const TOP_BG_HEIGHT = SCREEN_HEIGHT * 0.15;
  const BOTTOM_BG_HEIGHT = SCREEN_HEIGHT * 0.28;
  const FLOWER_SIZE = moderateScale(SCREEN_WIDTH * 0.25);

  return (
    <View style={styles.mainContainer}>
      {/* Top background - always visible */}
      <Image
        source={Images.TOP_RIGHT_BG}
        resizeMode="contain"
        style={[
          styles.topRightBg,
          {
            height: TOP_BG_HEIGHT,
            width: SCREEN_WIDTH * 0.45,
          },
        ]}
      />

      {/* Main content */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          <Animated.View 
            style={[
              styles.contentContainer,
              {
                transform: [{ translateY: keyboardShiftY }],
              },
            ]}
          >
            {/* Logo */}
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                },
              ]}
            >
              <Image source={Images.TB_LOGO} style={styles.logo} resizeMode="contain" />
            </Animated.View>

            {/* Title */}
            <Animated.View
              style={[
                styles.titleContainer,
                {
                  opacity: titleOpacity,
                  transform: [{ translateY: titleTranslateY }],
                },
              ]}
            >
              <Text style={styles.title}>Enter OTP</Text>
              <Text style={styles.subtitle}>
                We've sent a 6-digit OTP to {mobile}
              </Text>
            </Animated.View>

            {/* OTP Input */}
            <Animated.View
              style={[
                styles.otpWrapper,
                {
                  opacity: contentOpacity,
                  transform: [{ translateY: contentTranslateY }],
                },
              ]}
            >
              <OtpInput
                numberOfDigits={6}
                onTextChange={setOtp}
                onFilled={handleVerifyOtp}
                theme={{
                  containerStyle: styles.otpContainerStyle,
                  pinCodeContainerStyle: styles.otpBox,
                  pinCodeTextStyle: styles.otpText,
                  focusedPinCodeContainerStyle: styles.otpFocused,
                }}
              />
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom section - fixed at bottom */}
      <View style={[styles.bottomSection, { height: BOTTOM_BG_HEIGHT + moderateScale(80) }]} pointerEvents="box-none">
        {/* Bottom background image */}
        <Image
          source={Images.BOTTOM_ROUND_BG}
          resizeMode="cover"
          style={[
            styles.bottomRoundBg,
            {
              height: BOTTOM_BG_HEIGHT,
              width: SCREEN_WIDTH,
            },
          ]}
        />

        {/* Left flower - commented out like landing page */}
        {/* <Image
          source={Images.LEFT_FLOWER}
          resizeMode="contain"
          style={[
            styles.leftFlower,
            {
              width: FLOWER_SIZE,
              height: FLOWER_SIZE,
            },
          ]}
        /> */}

        {/* Right flower - commented out like landing page */}
        {/* <Image
          source={Images.RIGHT_FLOWER}
          resizeMode="contain"
          style={[
            styles.rightFlower,
            {
              width: FLOWER_SIZE,
              height: FLOWER_SIZE,
            },
          ]}
        /> */}

        {/* Button */}
        <Animated.View
          style={[
            styles.bottomButtonContainer,
            {
              opacity: buttonOpacity,
              transform: [{ scale: buttonScale }],
            },
          ]}
        >
          <TouchableOpacity
            disabled={otp.length !== 6 || loading}
            onPress={() => handleVerifyOtp()}
            style={[
              styles.button,
              { backgroundColor: otp.length === 6 ? '#FFCC3E' : '#E0E0E0' },
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Text>
              <View style={styles.buttonArrowContainer}>
                <SVGIcon name="chevron-right" size={moderateScale(20)} color="#1A1A1A" />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

export default OtpVerificationScreen;

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FBFF',
  },
  topRightBg: {
    position: 'absolute',
    top: moderateScale(-28),
    right: 0,
    zIndex: 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: moderateScale(80),
    paddingBottom: moderateScale(280),
  },
  contentContainer: {
    paddingHorizontal: getSpacing(3),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  logo: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(30),
  },
  title: {
    fontSize: moderateScale(24),
    fontFamily: getFontFamily('700'),
    textAlign: 'center',
    marginBottom: getSpacing(1),
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('400'),
    textAlign: 'center',
    color: '#666',
  },
  otpWrapper: {
    marginBottom: moderateScale(20),
  },
  otpContainerStyle: {
    gap: moderateScale(12),
    justifyContent: 'center',
  },
  otpBox: {
    width: moderateScale(50),
    height: moderateScale(60),
    borderRadius: moderateScale(8),
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  otpFocused: {
    borderColor: '#FFCC3E',
    borderWidth: 2,
  },
  otpText: {
    fontSize: moderateScale(20),
    fontFamily: getFontFamily('600'),
    color: '#1A1A1A',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bottomRoundBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  leftFlower: {
    position: 'absolute',
    bottom: moderateScale(70),
    left: 0,
  },
  rightFlower: {
    position: 'absolute',
    bottom: moderateScale(70),
    right: 0,
  },
  bottomButtonContainer: {
    width: '100%',
    paddingHorizontal: getSpacing(3),
    marginBottom: moderateScale(50),
    zIndex: 3,
  },
  button: {
    width: '100%',
    paddingVertical: getSpacing(1.5),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: moderateScale(50),
    position: 'relative',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  buttonText: {
    fontSize: moderateScale(16),
    letterSpacing: 1,
    fontFamily: getFontFamily('700'),
    color: '#1A1A1A',
  },
  buttonArrowContainer: {
    marginLeft: getSpacing(1),
    justifyContent: 'center',
    alignItems: 'center',
  },
});