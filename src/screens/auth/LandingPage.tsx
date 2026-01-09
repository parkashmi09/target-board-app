import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView, Dimensions, KeyboardAvoidingView, Platform, Animated, Keyboard } from 'react-native';
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
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const inputTranslateY = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Keyboard listeners to handle scroll to input
  useEffect(() => {
    const keyboardWillShow = (e: any) => {
      const height = e.endCoordinates?.height || 0;
      setKeyboardHeight(height);
      
      // Scroll to input when keyboard opens
      setTimeout(() => {
        inputRef.current?.focus();
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

  // Initial animations on mount
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

    // Input animation - smoother transition
    Animated.parallel([
      Animated.timing(inputOpacity, {
        toValue: 1,
        duration: 800,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(inputTranslateY, {
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

  const isValid = /^\d{10}$/.test(phone.replace(/\D/g, ''));

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

          {/* Welcome Text */}
          <Animated.View
            style={[
              styles.welcomeContainer,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            <View style={styles.welcomeTextContainer}>
              <Text style={styles.welcomeText}>Welcome to </Text>
              <Text style={styles.targetboardText}>Targetboard</Text>
            </View>
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
            <Text style={styles.mainTitle}>Let's Get Started</Text>
          </Animated.View>

          {/* Input Field */}
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
              ref={inputRef}
              value={phone}
              onChangeText={(text) => {
                // Only allow numbers
                const numbersOnly = text.replace(/\D/g, '');
                if (numbersOnly.length <= 10) {
                  setPhone(numbersOnly);
                }
              }}
              keyboardType="numeric"
              maxLength={10}
              style={[styles.input, {
                backgroundColor: theme.colors.inputBackground || '#F5F5F5',
                color: theme.colors.text,
                borderBottomWidth: 2,
                borderBottomColor: theme.colors.primaryText || '#1A1A1A',
              }]}
              placeholder="Enter Your 10 digit Mobile no."
              placeholderTextColor={theme.colors.textSecondary || '#999'}
              returnKeyType="done"
              blurOnSubmit={true}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }}
            />
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
            onPress={handleContinue}
            disabled={!isValid || loading}
            style={[styles.button, {
              backgroundColor: isValid ? '#FFCC3E' : '#E0E0E0',
              overflow: 'hidden',
            }]}
            // activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.buttonProgress,
                {
                  backgroundColor: '#FFCC3E',
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
              <Text style={[styles.buttonText, { color: isValid ? '#1A1A1A' : '#1A1A1A' }]}>
                {loading ? 'Processing...' : "Let's Get Started"}
              </Text>
              <View style={styles.buttonArrowContainer}>
                <SVGIcon
                  name="chevron-right"
                  size={moderateScale(20)}
                  color={'#1A1A1A'}
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
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  welcomeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  welcomeText: {
    fontSize: moderateScale(28),
    fontFamily: getFontFamily('400'),
    color: '#1A1A1A',
  },
  targetboardText: {
    fontSize: moderateScale(28),
    fontFamily: getFontFamily('700'),
    color: '#FFCC3E',
    textShadowColor: '#000000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
    // Additional shadow layers effect
    includeFontPadding: false,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(40),
  },
  mainTitle: {
    fontSize: moderateScale(24),
    fontFamily: getFontFamily('700'),
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: moderateScale(20),
  },
  leftFlower: {
    position: 'absolute',
    bottom: moderateScale(165),
    left: 0,
    width: moderateScale(100),
    height: moderateScale(100),
  },
  leftFLowerImage: {
    width: moderateScale(100),
    height: moderateScale(100),
  },
  rightFlowerImage: {
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
  label: {
    fontSize: moderateScale(15),
    marginBottom: getSpacing(1),
    fontFamily: getFontFamily('500'),
  },
  input: {
    borderRadius: moderateScale(8),
    paddingHorizontal: getSpacing(1.5),
    paddingVertical: getSpacing(1.5),
    fontSize: moderateScale(15),
    borderWidth: 0,
    fontFamily: getFontFamily('400'),
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: moderateScale(40),
    zIndex: 2,
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

export default LandingPage;
