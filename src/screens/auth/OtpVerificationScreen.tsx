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
import { verifyOtp, fetchUserDetails, sendOtp } from '../../services/api';
import LinearGradient from 'react-native-linear-gradient';
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
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

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
      Animated.timing(keyboardShiftY, {
        toValue: -moderateScale(40),
        duration: Platform.OS === 'ios' ? (event?.duration || 250) : 250,
        useNativeDriver: true,
      }).start();
    };

    const keyboardWillHide = (event: any) => {
      setIsKeyboardVisible(false);
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

  /* Resend OTP Timer */
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  /* Resend OTP Handler */
  const handleResendOtp = async () => {
    if (!canResend) return;
    
    try {
      setLoading(true);
      loader.show();
      const res = await sendOtp(mobile);
      if (res.success) {
        toast.show({ text: res.message || 'OTP sent successfully', type: 'success' });
        setResendTimer(60);
        setCanResend(false);
      } else {
        toast.show({ text: res.message || 'Failed to send OTP', type: 'error' });
      }
    } catch (e: any) {
      toast.show({ text: e?.message || 'Failed to resend OTP', type: 'error' });
    } finally {
      loader.hide();
      setLoading(false);
    }
  };

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
      
      let fcmToken: string | undefined;
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
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

  const formattedMobile = mobile ? `+91 ${mobile}` : '';

  return (
    <KeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Background Pattern - Only visible at bottom */}
      <Image
        source={Images.LOGIN_BG}
        resizeMode="cover"
        style={styles.backgroundImage}
      />

      {/* Gradient Overlay - Fades pattern from bottom */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 1)',      // Solid white at top
          'rgba(255, 255, 255, 1)',      // Keep solid
          'rgba(255, 255, 255, 1)',      // Keep solid
          'rgba(255, 255, 255, 0.95)',   // Start fading
          'rgba(255, 255, 255, 0.7)',    // More transparent
          'rgba(255, 255, 255, 0.3)',    // Show pattern
          'rgba(255, 255, 255, 0)',      // Fully transparent
        ]}
        locations={[0, 0.4, 0.6, 0.7, 0.8, 0.9, 1]}
        style={styles.gradientOverlay}
      />

      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <SVGIcon name="chevron-left" size={moderateScale(28)} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Main content */}
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
            <Text style={styles.title}>OTP Verification</Text>
          </Animated.View>

          {/* Instructional Text */}
          <Animated.View
            style={[
              styles.instructionContainer,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <Text style={styles.instructionText}>We have sent the verification code to</Text>
          </Animated.View>

          {/* Phone Number with Edit Icon */}
          <Animated.View
            style={[
              styles.phoneContainer,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <Text style={styles.phoneNumber}>{formattedMobile}</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.editButton}
              activeOpacity={0.7}
            >
              <SVGIcon name="edit" size={moderateScale(18)} color="#838383" />
            </TouchableOpacity>
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

          {/* Resend OTP */}
          <Animated.View
            style={[
              styles.resendContainer,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentTranslateY }],
              },
            ]}
          >
            <Text style={styles.resendText}>
              Didn't get the OTP?{' '}
              {canResend ? (
                <Text style={styles.resendLink} onPress={handleResendOtp}>
                  Request a new OTP
                </Text>
              ) : (
                <Text style={styles.resendTimer}>Request a new OTP in {resendTimer}s</Text>
              )}
            </Text>
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* Button */}
      <Animated.View
        style={[
          styles.buttonContainer,
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
            { backgroundColor: otp.length === 6 ? '#F6B432' : '#E0E0E0' },
          ]}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export default OtpVerificationScreen;

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    opacity: 0.25, // Reduced for subtle pattern at bottom only
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? moderateScale(50) : moderateScale(20),
    paddingHorizontal: getSpacing(3),
    paddingBottom: getSpacing(2),
    zIndex: 10,
  },
  backButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: moderateScale(40),
    paddingBottom: moderateScale(140),
  },
  contentContainer: {
    paddingHorizontal: getSpacing(3),
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(32),
  },
  title: {
    fontSize: moderateScale(28),
    fontFamily: getFontFamily('700'),
    textAlign: 'center',
    color: '#000000',
    letterSpacing: 0.3,
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(8),
  },
  instructionText: {
    fontSize: moderateScale(15),
    fontFamily: getFontFamily('400'),
    textAlign: 'center',
    color: '#666666',
    lineHeight: moderateScale(22),
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(48),
    gap: getSpacing(1.5),
  },
  phoneNumber: {
    fontSize: moderateScale(20),
    fontFamily: getFontFamily('700'),
    color: '#000000',
    letterSpacing: 0.5,
  },
  editButton: {
    padding: getSpacing(0.5),
  },
  otpWrapper: {
    marginBottom: moderateScale(32),
    width: '100%',
  },
  otpContainerStyle: {
    gap: moderateScale(10),
    justifyContent: 'center',
  },
  otpBox: {
    width: moderateScale(48),
    height: moderateScale(56),
    borderRadius: moderateScale(8),
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderBottomWidth: 2,
    borderBottomColor: '#D0D0D0',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: moderateScale(10),
  },
  otpFocused: {
    borderBottomColor: '#F6B432',
    borderBottomWidth: 3,
  },
  otpText: {
    fontSize: moderateScale(22),
    fontFamily: getFontFamily('600'),
    color: '#000000',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  resendText: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('400'),
    color: '#666666',
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
  resendLink: {
    color: '#F6B432',
    fontFamily: getFontFamily('600'),
    textDecorationLine: 'underline',
  },
  resendTimer: {
    color: '#999999',
    fontFamily: getFontFamily('400'),
  },
  buttonContainer: {
    position: 'absolute',
    bottom: moderateScale(40),
    left: 0,
    right: 0,
    paddingHorizontal: getSpacing(3),
    zIndex: 10,
  },
  button: {
    width: '100%',
    paddingVertical: getSpacing(2.5),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(56),
    shadowColor: '#F6B432',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: moderateScale(16),
    letterSpacing: 0.5,
    fontFamily: getFontFamily('700'),
    color: '#000000',
  },
});