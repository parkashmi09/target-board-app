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
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient'; // or 'expo-linear-gradient'
import { Images } from '../../assets/images';
import { sendOtp } from '../../services/api';
import { useToast } from '../../components/Toast';
import { useGlobalLoaderManual } from '../../components/GlobalLoader';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { getFontFamily } from '../../utils/fonts';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LandingPage = () => {
  const navigation = useNavigation<any>();
  const { show: showToast } = useToast();
  const { show: showLoader, hide: hideLoader } = useGlobalLoaderManual();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

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

  // Update progress animation based on phone number length
  useEffect(() => {
    const digitCount = (phone || '').replace(/\D/g, '').length;
    const progress = digitCount / 10; // 0 to 1 based on 10 digits
    
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [phone, progressAnim]);

  return (
    <KeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Background Pattern */}
      <Image
        source={Images.LOGIN_BG}
        resizeMode="cover"
        style={styles.backgroundImage}
      />

      {/* Smooth Gradient Overlay - Creates the blend effect */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 0)',      // Fully transparent at top
          'rgba(255, 255, 255, 0.1)',    // Slight white
          'rgba(255, 255, 255, 0.3)',    // More white
          'rgba(255, 255, 255, 0.6)',    // Increasing
          'rgba(255, 255, 255, 0.85)',   // Almost solid
          'rgba(255, 255, 255, 0.95)',   // Very solid
          'rgba(255, 255, 255, 1)',      // Completely solid white
        ]}
        locations={[0, 0.2, 0.35, 0.5, 0.65, 0.8, 0.9]}
        style={styles.gradientOverlay}
      />

      {/* Content Container */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        <View style={styles.contentContainer}>
          {/* Logo with White Background and Shadow */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image source={Images.TB_LOGO} style={styles.logo} resizeMode="contain" />
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.mainTitle}>TARGET BOARD</Text>
          </View>

          {/* Subtitle */}
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>Enter your mobile number to continue</Text>
          </View>

          {/* Input Field with Country Code */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <View style={styles.countryCodeContainer}>
                <Text style={styles.countryCode}>+91</Text>
              </View>
              <View style={styles.inputDivider} />
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
                placeholder="Enter your mob number"
                placeholderTextColor="#838383"
                returnKeyType="done"
                blurOnSubmit={true}
              />
            </View>
          </View>

          {/* Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleContinue}
              disabled={!isValid || loading}
              style={styles.button}
              activeOpacity={0.8}
            >
              {/* Progress Fill */}
              <Animated.View
                style={[
                  styles.buttonProgress,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
              {/* Button Text */}
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>
                  {loading ? 'Processing...' : 'Sent OTP'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LandingPage;

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
    opacity: 0.4, // Adjust opacity for desired pattern visibility
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: moderateScale(40),
    paddingHorizontal: getSpacing(3),
  },
  contentContainer: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(24),
  },
  logoBackground: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: moderateScale(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  logo: {
    width: moderateScale(80),
    height: moderateScale(80),
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  mainTitle: {
    fontSize: moderateScale(26),
    fontFamily: getFontFamily('700'),
    color: '#000000',
    letterSpacing: 1.2,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: moderateScale(40),
  },
  subtitle: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('400'),
    color: '#666666',
  },
  inputContainer: {
    width: '100%',
    marginBottom: moderateScale(30),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: '#D0D0D0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  countryCodeContainer: {
    paddingHorizontal: getSpacing(2.5),
    paddingVertical: getSpacing(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryCode: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('600'),
    color: '#000000',
  },
  inputDivider: {
    width: 1,
    height: moderateScale(24),
    backgroundColor: '#D0D0D0',
  },
  input: {
    flex: 1,
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(2),
    fontSize: moderateScale(16),
    color: '#000000',
    fontFamily: getFontFamily('400'),
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    width: '100%',
    paddingVertical: getSpacing(2.2),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(54),
    backgroundColor: '#E0E0E0',
    shadowColor: '#F6B432',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#F6B432',
    borderTopLeftRadius: moderateScale(12),
    borderBottomLeftRadius: moderateScale(12),
  },
  buttonContent: {
    position: 'relative',
    zIndex: 1,
  },
  buttonText: {
    fontSize: moderateScale(16),
    letterSpacing: 0.5,
    fontFamily: getFontFamily('700'),
    color: '#000000',
  },
});