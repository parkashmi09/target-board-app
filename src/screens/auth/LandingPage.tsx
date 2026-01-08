import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ImageBackground, ScrollView, Dimensions, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { getFontFamily } from '../../utils/fonts';
import { Images } from '../../assets/images';
import { sendOtp } from '../../services/api';
import { useToast } from '../../components/Toast';
import { useGlobalLoaderManual } from '../../components/GlobalLoader';
import { useRegistrationDataStore } from '../../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SVGIcon from '../../components/SVGIcon';

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
  
  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const heading1Opacity = useRef(new Animated.Value(0)).current;
  const heading1TranslateY = useRef(new Animated.Value(20)).current;
  const heading2Opacity = useRef(new Animated.Value(0)).current;
  const heading2TranslateY = useRef(new Animated.Value(20)).current;
  const dividerOpacity = useRef(new Animated.Value(0)).current;
  const dividerScale = useRef(new Animated.Value(0.8)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const inputTranslateY = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Initial animations on mount
  useEffect(() => {
    // Logo animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Heading animations (staggered)
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heading1Opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(heading1TranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(heading2Opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(heading2TranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Divider animation
    Animated.parallel([
      Animated.timing(dividerOpacity, {
        toValue: 1,
        duration: 500,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.spring(dividerScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Input animation
    Animated.parallel([
      Animated.timing(inputOpacity, {
        toValue: 1,
        duration: 600,
        delay: 600,
        useNativeDriver: true,
      }),
      Animated.timing(inputTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Button animation
    Animated.parallel([
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 600,
        delay: 800,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
       
        </ImageBackground>

        <View style={[styles.contentOverlay, { backgroundColor: theme.colors.background, minHeight: CONTENT_HEIGHT }]}>
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
          <View style={styles.contentContainer}>
            {/* <View style={styles.headingContainer}>
              <Animated.Text
                style={[
                  styles.largestText,
                  {
                    color: theme.colors.secondary,
                    opacity: heading1Opacity,
                    transform: [{ translateY: heading1TranslateY }],
                  },
                ]}
              >
                Largest Learning
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.destinationText,
                  {
                    color: theme.colors.text,
                    opacity: heading2Opacity,
                    transform: [{ translateY: heading2TranslateY }],
                  },
                ]}
              >
                Destination
              </Animated.Text>
            </View> */}

            <Animated.View
              style={[
                styles.dividerContainer,
                {
                  opacity: dividerOpacity,
                  transform: [{ scale: dividerScale }],
                },
              ]}
            >
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>Log in/Sign up</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            </Animated.View>


            <Animated.View
              style={[
                styles.inputContainer,
                {
                  opacity: inputOpacity,
                  transform: [{ translateY: inputTranslateY }],
                },
              ]}
            >
              <Text style={[styles.label, { color: theme.colors.text }]}>Mobile Number</Text>
              <TextInput
                value={phone}
                maxLength={10}
                keyboardType="numeric"
                onChangeText={setPhone}
                style={[styles.input, {
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderBottomWidth: 2,
                  borderBottomColor: theme.colors.primaryText,
                }]}
                placeholder="Enter Your 10 digit Mobile no."
                placeholderTextColor={theme.colors.textSecondary}
              />
            </Animated.View>

            <Animated.View
              style={{
                opacity: buttonOpacity,
                transform: [{ scale: buttonScale }],
              }}
            >
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
                <View style={styles.buttonArrowContainer}>
                  <SVGIcon
                    name="chevron-right"
                    size={moderateScale(20)}
                    color={theme.colors.secondaryText}
                  />
                </View>
              </View>
            </TouchableOpacity>
            </Animated.View>
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
    // top: '30%',
    top:'-10%',
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
    fontFamily: getFontFamily('200'),
  },
  destinationText: {
    fontSize: moderateScale(22),
    fontWeight: '400',
    marginTop: moderateScale(2),
    fontFamily: getFontFamily('200'),
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
    fontFamily: getFontFamily('200'),
  },
  label: {
    fontSize: moderateScale(15),
    marginBottom: getSpacing(1),
    fontWeight: '500',
    fontFamily: getFontFamily('200'),
  },
  inputContainer: {
    marginBottom: getSpacing(3),
  },
  input: {
    borderRadius: moderateScale(8),
    paddingHorizontal: getSpacing(1.5),
    paddingVertical: getSpacing(1.5),
    fontSize: moderateScale(15),
    borderWidth: 0,
    fontFamily: getFontFamily('200'),
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
    fontFamily: getFontFamily('200'),
  },
  buttonArrowContainer: {
    marginLeft: getSpacing(1),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LandingPage;


