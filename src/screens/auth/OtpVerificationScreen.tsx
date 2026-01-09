import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform, Animated, Dimensions, Keyboard } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { getFontFamily } from '../../utils/fonts';
import { Images } from '../../assets/images';
import { verifyOtp, fetchUserDetails } from '../../services/api';
import { useToast } from '../../components/Toast';
import { useGlobalLoaderManual } from '../../components/GlobalLoader';
import { useAuthStore } from '../../store';
import { useLoaderStore } from '../../store/loaderStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OtpInput } from 'react-native-otp-entry';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SVGIcon from '../../components/SVGIcon';

type OtpVerificationNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'OtpVerification'>;

const OtpVerificationScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<OtpVerificationNavigationProp>();
  const route = useRoute();
  const toast = useToast();
  const loader = useGlobalLoaderManual();
  const { login } = useAuthStore();
  const { reset: resetLoader } = useLoaderStore();

  const routeParams = route.params as { mobile?: string; userExists?: boolean } | undefined;
  const [mobile, setMobile] = useState<string>(routeParams?.mobile || '');
  const [userExists, setUserExists] = useState<boolean>(routeParams?.userExists || false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [timer, setTimer] = useState(90);
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Logo animation - smoother with easing
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

    // Title animation - smoother transition
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

    // Content animation - smoother transition
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

    // Button animation - smoother spring
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

  // Keyboard listeners to handle scroll to input
  useEffect(() => {
    const keyboardWillShow = (e: any) => {
      const height = e.endCoordinates?.height || 0;
      setKeyboardHeight(height);
      
      // Scroll to OTP input when keyboard opens
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    const keyboardWillHide = () => {
      setKeyboardHeight(0);
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
  }, []);

  useEffect(() => {
    const loadMobile = async () => {
      try {
        const params = route.params as { mobile?: string; userExists?: boolean } | undefined;
        if (params?.mobile && params.mobile.trim().length > 0) {
          setMobile(params.mobile);
          setUserExists(params.userExists || false);
        } else {
          const storedMobile = await AsyncStorage.getItem('pendingMobileNumber');
          if (storedMobile && storedMobile.trim().length > 0) {
            setMobile(storedMobile);
          } else {
            toast.show({ text: 'Mobile number is missing. Please try again.', type: 'error' });
            setTimeout(() => {
              navigation.goBack();
            }, 2000);
          }
        }
      } catch (error) {
        toast.show({ text: 'Error loading mobile number. Please try again.', type: 'error' });
      }
    };
    loadMobile();
  }, [route.params]);

  useEffect(() => {
    if (showTimer && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setShowTimer(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showTimer, timer]);

  const handleVerifyOtp = async (otpValue?: string) => {
    const otpToVerify = otpValue || otp;
    
    if (!otpToVerify || otpToVerify.length !== 6) {
      toast.show({ text: 'Please enter a valid 6-digit OTP.', type: 'error' });
      return;
    }

    if (!mobile || mobile.trim().length === 0) {
      toast.show({ text: 'Mobile number is missing. Please try again.', type: 'error' });
      return;
    }
    
    if (loading) {
      return; // Prevent multiple calls
    }
    
    setLoading(true);
    try {
      loader.show();
      const res = await verifyOtp(mobile, otpToVerify);

      if (res.token) {
        await AsyncStorage.setItem('token', res.token);
        await AsyncStorage.setItem('firstTimeVisited', 'true');

        try {
          const userDetailsRes = await fetchUserDetails();
          if (userDetailsRes?.user) {
            await AsyncStorage.setItem('userData', JSON.stringify(userDetailsRes.user));
            await AsyncStorage.setItem('userId', String(userDetailsRes.user.id || userDetailsRes.user._id || ''));
          } else if (res.user) {
            await AsyncStorage.setItem('userData', JSON.stringify(res.user));
            await AsyncStorage.setItem('userId', String(res.user.id || res.user._id || ''));
          }
        } catch (fetchError) {
          if (res.user) {
            await AsyncStorage.setItem('userData', JSON.stringify(res.user));
            await AsyncStorage.setItem('userId', String(res.user.id || res.user._id || ''));
          }
        }

        if (res.stickyBanners && Array.isArray(res.stickyBanners) && res.stickyBanners.length > 0) {
          await AsyncStorage.setItem('stickyBanners', JSON.stringify(res.stickyBanners));
        }

        toast.show({ text: res.message || 'Login successful!', type: 'success' });
        loader.hide();
        resetLoader();
        setTimeout(() => {
          login();
        }, 500);
      } else if (res.tempToken) {
        await AsyncStorage.setItem('tempToken', res.tempToken);
        toast.show({ text: res.message || 'OTP verified!', type: 'success' });
        loader.hide();
        resetLoader();
        navigation.navigate('RegisterStep1', { tempToken: res.tempToken });
      } else {
        toast.show({ text: res.message || 'Invalid OTP. Please try again.', type: 'error' });
        loader.hide();
      }
    } catch (e: any) {
      toast.show({ text: e?.message || 'An unexpected error occurred. Please try again.', type: 'error' });
      loader.hide();
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      style={[styles.mainContainer, { backgroundColor: '#F8FBFF' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.backgroundContainer}>
        <Image 
          source={Images.TOP_RIGHT_BG} 
          resizeMode='contain' 
          style={styles.topRightBg} 
        />
        <Image 
          source={Images.LEFT_FLOWER} 
          resizeMode='contain' 
          style={styles.leftFlower} 
        />
        <Image 
          source={Images.RIGHT_FLOWER} 
          resizeMode='contain' 
          style={styles.rightFlower} 
        />
        <Image 
          source={Images.BOTTOM_ROUND_BG} 
          resizeMode='cover' 
          style={styles.bottomRoundBg} 
        />
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : moderateScale(120) }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardDismissMode="on-drag"
      >
        <View style={styles.contentOverlay}>
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
            <Image
              source={Images.TB_LOGO}
              style={styles.logo}
              resizeMode="contain"
            />
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
              We've sent a 6-digit OTP to {mobile || 'your mobile number'}
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
            <View style={styles.otpContainer}>
              <OtpInput
                numberOfDigits={6}
                onTextChange={(text: string) => {
                  setOtp(text);
                  // Scroll to ensure input is visible when typing
                  if (text.length > 0) {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }
                }}
                onFilled={(text: string) => {
                  setOtp(text);
                  if (text.length === 6) {
                    setTimeout(() => {
                      handleVerifyOtp(text);
                    }, 100);
                  }
                }}
                theme={{
                  containerStyle: styles.otpContainerStyle,
                  pinCodeContainerStyle: {
                    backgroundColor: theme.colors.inputBackground || '#F5F5F5',
                    borderColor: theme.colors.border || '#E0E0E0',
                    borderWidth: 1,
                    borderRadius: moderateScale(8),
                    width: moderateScale(50),
                    height: moderateScale(60),
                  },
                  pinCodeTextStyle: {
                    color: theme.colors.text,
                    fontSize: moderateScale(20),
                    fontFamily: getFontFamily('600'),
                  },
                  focusedPinCodeContainerStyle: {
                    borderColor: '#FFCC3E',
                    borderWidth: 2,
                  },
                }}
                autoFocus
              />
            </View>

            {/* Resend Container */}
            <View style={styles.resendContainer}>
              <TouchableOpacity
                onPress={() => {
                  setShowTimer(true);
                  setTimer(90);
                }}
                disabled={showTimer}
              >
                <Text style={[
                  styles.resendText,
                  {
                    color: showTimer ? theme.colors.textSecondary || '#999' : '#FFCC3E',
                  }
                ]}>
                  Resend OTP
                </Text>
              </TouchableOpacity>
              {showTimer && (
                <Text style={[styles.timerText, { color: theme.colors.textSecondary || '#999' }]}>
                  {formatTime(timer)}
                </Text>
              )}
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Button inside bottom background */}
      <View style={styles.bottomButtonContainer}>
        <Animated.View
          style={{
            opacity: buttonOpacity,
            transform: [{ scale: buttonScale }],
            width: '100%',
            paddingHorizontal: getSpacing(3),
          }}
        >
          <TouchableOpacity
            onPress={() => handleVerifyOtp()}
            disabled={loading || otp.length !== 6}
            style={[
              styles.verifyButton,
              {
                backgroundColor: otp.length === 6 ? '#FFCC3E' : '#E0E0E0',
              }
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Text style={[styles.verifyButtonText, { color: otp.length === 6 ? '#1A1A1A' : '#999' }]}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Text>
              <View style={styles.buttonArrowContainer}>
                <SVGIcon
                  name="chevron-right"
                  size={moderateScale(20)}
                  color={otp.length === 6 ? '#1A1A1A' : '#999'}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  topRightBg: {
    position: 'absolute',
    top: 0,
    right: moderateScale(-25),
    width: '100%',
    height: '25%',
  },
  bottomRoundBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: '25%',
  },
  leftFlower: {
    position: 'absolute',
    bottom: moderateScale(165),
    left: 0,
    width: moderateScale(100),
    height: moderateScale(100),
  },
  rightFlower: {
    position: 'absolute',
    bottom: moderateScale(165),
    right: 0,
    width: moderateScale(100),
    height: moderateScale(100),
  },
  scrollContainer: {
    flexGrow: 1,
    zIndex: 1,
  },
  contentOverlay: {
    width: '100%',
    paddingHorizontal: getSpacing(3),
    paddingTop: moderateScale(180),
    paddingBottom: moderateScale(20), // Reduced, will be handled by ScrollView
    flexGrow: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(30),
    marginTop: moderateScale(20),
  },
  logo: {
    width: moderateScale(120),
    height: moderateScale(120),
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(40),
  },
  title: {
    fontSize: moderateScale(24),
    fontFamily: getFontFamily('700'),
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: getSpacing(1),
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('400'),
    color: '#666',
    textAlign: 'center',
  },
  otpWrapper: {
    marginBottom: moderateScale(20),
  },
  otpContainer: {
    marginBottom: getSpacing(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpContainerStyle: {
    gap: moderateScale(12),
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: getSpacing(2),
  },
  resendText: {
    fontSize: moderateScale(15),
    fontFamily: getFontFamily('700'),
  },
  timerText: {
    fontSize: moderateScale(15),
    fontFamily: getFontFamily('600'),
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: moderateScale(40),
    zIndex: 2,
  },
  verifyButton: {
    width: '100%',
    paddingVertical: getSpacing(1.5),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: moderateScale(50),
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    fontSize: moderateScale(16),
    letterSpacing: 1,
    fontFamily: getFontFamily('700'),
  },
  buttonArrowContainer: {
    marginLeft: getSpacing(1),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default OtpVerificationScreen;
