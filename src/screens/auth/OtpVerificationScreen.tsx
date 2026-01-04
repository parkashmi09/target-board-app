import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
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

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast.show({ text: 'Please enter a valid 6-digit OTP.', type: 'error' });
      return;
    }

    if (!mobile || mobile.trim().length === 0) {
      toast.show({ text: 'Mobile number is missing. Please try again.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      loader.show();
      const res = await verifyOtp(mobile, otp);

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
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.imageContainer}>
          <Image
            source={Images.OTP_BACKGROUND}
            style={styles.otpImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Enter OTP
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            We've sent a 6-digit OTP to {mobile || 'your mobile number'}
          </Text>

          <View style={styles.otpContainer}>
            <OtpInput
              numberOfDigits={6}
              onTextChange={(text: string) => setOtp(text)}
              onFilled={(text: string) => {
                setOtp(text);
                // Auto-verify when OTP is complete
                if (text.length === 6 && !loading) {
                  handleVerifyOtp();
                }
              }}
              theme={{
                containerStyle: styles.otpContainerStyle,
                pinCodeContainerStyle: {
                  backgroundColor: theme.colors.inputBackground,
                  borderColor: theme.colors.border,
                  borderWidth: 1,
                  borderRadius: moderateScale(8),
                  width: moderateScale(50),
                  height: moderateScale(60),
                },
                pinCodeTextStyle: {
                  color: theme.colors.text,
                  fontSize: moderateScale(20),
                  fontWeight: '600',
                },
                focusedPinCodeContainerStyle: {
                  borderColor: theme.colors.secondary,
                  borderWidth: 2,
                },
              }}
              autoFocus
            />
          </View>

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
                  color: showTimer ? theme.colors.textSecondary : theme.colors.accent,
                  fontWeight: 'bold',
                }
              ]}>
                Resend OTP
              </Text>
            </TouchableOpacity>
            {showTimer && (
              <Text style={[styles.timerText, { color: theme.colors.textSecondary }]}>
                {formatTime(timer)}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleVerifyOtp}
            disabled={loading || otp.length !== 6}
            style={[
              styles.verifyButton,
              {
                backgroundColor: otp.length === 6 ? theme.colors.secondary : theme.colors.border,
              }
            ]}
          >
            <Text style={styles.verifyButtonText}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  imageContainer: {
    width: '100%',
    height: moderateScale(200),
  },
  otpImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: getSpacing(3),
    paddingTop: getSpacing(3),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: getSpacing(1),
  },
  subtitle: {
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginBottom: getSpacing(3),
  },
  otpContainer: {
    marginBottom: getSpacing(2),
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
    marginTop: getSpacing(3),
    marginBottom: getSpacing(2),
  },
  resendText: {
    fontSize: moderateScale(15),
  },
  timerText: {
    fontSize: moderateScale(15),
    fontWeight: '600',
  },
  verifyButton: {
    width: '100%',
    paddingVertical: getSpacing(2.5),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getSpacing(2),
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
});

export default OtpVerificationScreen;


