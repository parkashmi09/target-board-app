import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ImageBackground, ScrollView, Dimensions, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { Images } from '../../assets/images';
import { sendOtp } from '../../services/api';
import { useToast } from '../../components/Toast';
import { useGlobalLoaderManual } from '../../components/GlobalLoader';
import { useRegistrationDataStore } from '../../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type LandingPageNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'LandingPage'>;

const LandingPage: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<LandingPageNavigationProp>();
  const toast = useToast();
  const loader = useGlobalLoaderManual();
  const { loadAllData } = useRegistrationDataStore();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    const digitCount = (phone || '').replace(/\D/g, '').length;
    const progress = digitCount / 10;

    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [phone, progressAnim]);

  const handleContinue = async () => {
    if (!phone || phone.trim().length === 0) {
      toast.show({ text: 'Please enter a valid mobile number.', type: 'error' });
      return;
    }

    const cleaned = (phone || '').replace(/\D/g, '');

    if (!/^\d{10}$/.test(cleaned)) {
      toast.show({ text: 'Please enter a valid 10-digit mobile number.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      loader.show();
      await AsyncStorage.setItem('pendingMobileNumber', cleaned);
      const res = await sendOtp(cleaned);

      if (res.success) {
        toast.show({ text: res.message || 'OTP sent successfully', type: 'success' });
        const mobileToPass = cleaned || phone.replace(/\D/g, '');
        navigation.navigate('OtpVerification', { mobile: mobileToPass, userExists: res.userExists || false });
      } else {
        toast.show({ text: res.message || 'Failed to send OTP', type: 'error' });
      }
    } catch (e: any) {
      toast.show({ text: e?.message || 'An unexpected error occurred. Please try again.', type: 'error' });
    } finally {
      loader.hide();
      setLoading(false);
    }
  };

  const isValid = /^\d{10}$/.test(phone);
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const BACKGROUND_HEIGHT = SCREEN_HEIGHT * 0.5;
  const CONTENT_HEIGHT = SCREEN_HEIGHT * 0.5;

  return (
    <KeyboardAvoidingView
      style={[styles.mainContainer, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <ImageBackground
          source={Images.LOGIN_BG}
          style={[styles.backgroundImage, { height: BACKGROUND_HEIGHT }]}
          resizeMode="cover"
        >
          <View style={styles.logoContainer}>
            <Image
              source={Images.TB_LOGO}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </ImageBackground>

        <View style={[styles.contentOverlay, { backgroundColor: theme.colors.background, minHeight: CONTENT_HEIGHT }]}>
          <View style={styles.contentContainer}>
            <View style={styles.headingContainer}>
              <Text style={[styles.largestText, { color: theme.colors.secondary }]}>Largest Learning</Text>
              <Text style={[styles.destinationText, { color: theme.colors.text }]}>Destination</Text>
            </View>

            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>Log in/Sign up</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            </View>

            <Text style={[styles.label, { color: theme.colors.text }]}>Mobile Number</Text>

            <View style={styles.inputContainer}>
              <TextInput
                value={phone}
                maxLength={10}
                keyboardType="numeric"
                onChangeText={setPhone}
                style={[styles.input, {
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }]}
                placeholder="Enter Your 10 digit Mobile no."
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>

            <TouchableOpacity
              onPress={handleContinue}
              disabled={!isValid || loading}
              style={[styles.button, {
                backgroundColor: theme.colors.border,
                overflow: 'hidden',
              }]}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[
                  styles.buttonProgress,
                  {
                    backgroundColor: theme.colors.secondary,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    borderTopLeftRadius: moderateScale(8),
                    borderBottomLeftRadius: moderateScale(8),
                    borderTopRightRadius: progressAnim.interpolate({
                      inputRange: [0.99, 1],
                      outputRange: [0, moderateScale(8)],
                      extrapolate: 'clamp',
                    }),
                    borderBottomRightRadius: progressAnim.interpolate({
                      inputRange: [0.99, 1],
                      outputRange: [0, moderateScale(8)],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
              <View style={styles.buttonContent}>
                <Text style={[styles.buttonText, { color: theme.colors.secondaryText }]}>
                  {loading ? 'Processing...' : "Let's Get Started"}
                </Text>
                <Text style={[styles.buttonArrow, { color: theme.colors.secondaryText }]}>→</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  backgroundImage: {
    width: '100%',
  },
  contentOverlay: {
    width: '100%',
    paddingTop: moderateScale(20),
  },
  contentContainer: {
    paddingHorizontal: getSpacing(3),
    paddingVertical: moderateScale(20),
  },
  logoContainer: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  logo: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(30),
  },
  largestText: {
    fontSize: moderateScale(26),
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  destinationText: {
    fontSize: moderateScale(22),
    fontWeight: '400',
    marginTop: moderateScale(2),
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: moderateScale(25),
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: getSpacing(2),
    fontSize: moderateScale(14),
  },
  label: {
    fontSize: moderateScale(15),
    marginBottom: getSpacing(1),
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: getSpacing(3),
  },
  input: {
    borderRadius: moderateScale(8),
    paddingHorizontal: getSpacing(1.5),
    paddingVertical: getSpacing(1.5),
    fontSize: moderateScale(15),
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
  buttonProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '700',
    letterSpacing: 1,
  },
  buttonArrow: {
    color: '#FFFFFF',
    fontSize: moderateScale(20),
    marginLeft: getSpacing(1),
    fontWeight: '700',
  },
});

export default LandingPage;


