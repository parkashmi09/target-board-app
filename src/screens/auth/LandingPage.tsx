import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  Dimensions,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Images } from '../../assets/images';
import { sendOtp } from '../../services/api';
import { useToast } from '../../components/Toast';
import { useGlobalLoaderManual } from '../../components/GlobalLoader';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { getFontFamily } from '../../utils/fonts';
import SVGIcon from '../../components/SVGIcon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LandingPage = () => {
  const navigation = useNavigation<any>();
  const { show: showToast } = useToast();
  const { show: showLoader, hide: hideLoader } = useGlobalLoaderManual();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  // Animation values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const inputTranslateY = useRef(new Animated.Value(30)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0.9)).current;

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = () => {
      setIsKeyboardVisible(true);
    };

    const keyboardWillHide = () => {
      setIsKeyboardVisible(false);
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
      showToast({ text: 'Please enter a valid mobile number.', type: 'error' });
      return;
    }

    const cleaned = (phone || '').replace(/\D/g, '');

    if (!/^\d{10}$/.test(cleaned)) {
      showToast({ text: 'Please enter a valid 10-digit mobile number.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      showLoader();
      await AsyncStorage.setItem('pendingMobileNumber', cleaned);
      const res = await sendOtp(cleaned);

      if (res.success) {
        showToast({ text: res.message || 'OTP sent successfully', type: 'success' });
        const mobileToPass = cleaned || phone.replace(/\D/g, '');
        navigation.navigate('OtpVerification', { mobile: mobileToPass, userExists: res.userExists || false });
      } else {
        showToast({ text: res.message || 'Failed to send OTP', type: 'error' });
      }
    } catch (e: any) {
      showToast({ text: e?.message || 'An unexpected error occurred. Please try again.', type: 'error' });
    } finally {
      hideLoader();
      setLoading(false);
    }
  };

  const isValid = /^\d{10}$/.test(phone.replace(/\D/g, ''));

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
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        <View style={styles.contentContainer}>
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
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              ref={inputRef}
              value={phone}
              onChangeText={(text) => {
                const numbersOnly = text.replace(/\D/g, '');
                if (numbersOnly.length <= 10) {
                  setPhone(numbersOnly);
                }
              }}
              keyboardType="numeric"
              maxLength={10}
              style={styles.input}
              placeholder="Enter Your 10 digit Mobile no."
              placeholderTextColor="#999"
              returnKeyType="done"
              blurOnSubmit={true}
            />
          </Animated.View>
        </View>
      </ScrollView>

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

        {/* Left flower */}
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

        {/* Right flower */}
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
            onPress={handleContinue}
            disabled={!isValid || loading}
            style={[
              styles.button,
              {
                backgroundColor: isValid ? '#FFCC3E' : '#E0E0E0',
              },
            ]}
            activeOpacity={0.8}
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
                },
              ]}
            />
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>
                {loading ? 'Processing...' : "Let's Get Started"}
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

export default LandingPage;

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
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(4),
  },
  welcomeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  welcomeText: {
    fontSize: moderateScale(20),
    fontFamily: getFontFamily('400'),
    color: '#1A1A1A',
  },
  targetboardText: {
    fontSize: moderateScale(24),
    fontFamily: getFontFamily('700'),
    color: '#FFCC3E',
    textShadowColor: '#000000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(30),
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
  label: {
    fontSize: moderateScale(15),
    marginBottom: getSpacing(1),
    fontFamily: getFontFamily('500'),
    color: '#1A1A1A',
  },
  input: {
    borderRadius: moderateScale(8),
    paddingHorizontal: getSpacing(1.5),
    paddingVertical: getSpacing(1.5),
    fontSize: moderateScale(15),
    backgroundColor: '#F5F5F5',
    color: '#1A1A1A',
    borderBottomWidth: 2,
    borderBottomColor: '#1A1A1A',
    fontFamily: getFontFamily('400'),
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
    overflow: 'hidden',
  },
  buttonProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderTopLeftRadius: moderateScale(8),
    borderBottomLeftRadius: moderateScale(8),
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