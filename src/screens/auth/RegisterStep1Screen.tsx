import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, Animated, Keyboard, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { getFontFamily } from '../../utils/fonts';
import { Images } from '../../assets/images';
import { useToast } from '../../components/Toast';
import { useGlobalLoaderManual } from '../../components/GlobalLoader';
import LinearGradient from 'react-native-linear-gradient';
import SVGIcon from '../../components/SVGIcon';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type RegisterStep1NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RegisterStep1'>;

const RegisterStep1Screen: React.FC = () => {
  const navigation = useNavigation<RegisterStep1NavigationProp>();
  const route = useRoute();
  const toast = useToast();
  const loader = useGlobalLoaderManual();
  
  const routeParams = route.params as { tempToken?: string } | undefined;
  const tempToken = routeParams?.tempToken || '';
  
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const imageHeightAnim = useRef(new Animated.Value(moderateScale(180))).current;

  useEffect(() => {
    const nameLength = fullName.trim().length;
    const maxLength = 50;
    const progress = Math.min((nameLength / maxLength) * 100, 100);
    
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [fullName, progressAnim]);

  useEffect(() => {
    if (!tempToken) {
      toast.show({ text: 'Invalid session. Please try again.', type: 'error' });
      setTimeout(() => navigation.goBack(), 2000);
      return;
    }
  }, [tempToken, navigation, toast]);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        Animated.timing(imageHeightAnim, {
          toValue: moderateScale(100),
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        Animated.timing(imageHeightAnim, {
          toValue: moderateScale(180),
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [imageHeightAnim]);

  const handleNext = async () => {
    if (!tempToken) {
      toast.show({ text: 'Invalid session. Please try again.', type: 'error' });
      navigation.goBack();
      return;
    }

    if (!fullName.trim()) {
      toast.show({ text: 'Please enter your full name', type: 'error' });
      return;
    }

    if (fullName.trim().length < 2) {
      toast.show({ text: 'Please enter a valid full name', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      loader.show();
      
      Animated.timing(progressAnim, {
        toValue: 100,
        duration: 500,
        useNativeDriver: false,
      }).start(() => {
        setTimeout(() => {
          try {
            navigation.navigate('RegisterStep2', { 
              tempToken,
              fullName: fullName.trim(),
            });
          } catch (navError) {
            console.error('Navigation error:', navError);
            toast.show({ text: 'Failed to proceed. Please try again.', type: 'error' });
          } finally {
            setLoading(false);
            loader.hide();
          }
        }, 300);
      });
    } catch (error: any) {
      console.error('Error in handleNext:', error);
      toast.show({ text: error?.message || 'An error occurred. Please try again.', type: 'error' });
      setLoading(false);
      loader.hide();
    }
  };

  const isValid = fullName.trim().length > 0;

  if (!tempToken) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid session. Redirecting...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Background Pattern */}
      <Image
        source={Images.LOGIN_BG}
        resizeMode="cover"
        style={styles.backgroundImage}
      />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 1)',
          'rgba(255, 255, 255, 1)',
          'rgba(255, 255, 255, 1)',
          'rgba(255, 255, 255, 0.95)',
          'rgba(255, 255, 255, 0.7)',
          'rgba(255, 255, 255, 0.3)',
          'rgba(255, 255, 255, 0)',
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

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
      >
        <View style={styles.content}>
          <Animated.View style={[styles.imageContainer, { height: imageHeightAnim }]}>
            <Image
              source={Images.NAME_ILLUSTRATION}
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>

          <Text style={styles.title}>
            Almost there
          </Text>
          <Text style={styles.subtitle}>
            Please enter below details to complete your profile.
          </Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#838383"
              maxLength={50}
              autoCapitalize="words"
            />
          </View>

          <TouchableOpacity
            onPress={handleNext}
            disabled={!isValid || loading}
            style={[
              styles.button,
              { 
                backgroundColor: isValid ? '#F6B432' : '#E0E0E0',
                overflow: 'hidden',
              }
            ]}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.buttonProgress,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                }
              ]}
            />
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>
                {loading ? 'Processing...' : 'Next'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
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
    opacity: 0.25,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: getSpacing(3),
  },
  errorText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('500'),
    color: '#666666',
    textAlign: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: moderateScale(20),
    paddingBottom: moderateScale(40),
  },
  content: {
    paddingHorizontal: getSpacing(3),
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: moderateScale(32),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: moderateScale(28),
    fontFamily: getFontFamily('700'),
    marginBottom: moderateScale(8),
    textAlign: 'center',
    color: '#000000',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: moderateScale(15),
    fontFamily: getFontFamily('400'),
    marginBottom: moderateScale(40),
    textAlign: 'center',
    color: '#666666',
    lineHeight: moderateScale(22),
  },
  inputWrapper: {
    width: '100%',
    marginBottom: moderateScale(32),
  },
  label: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('500'),
    marginBottom: getSpacing(1),
    color: '#000000',
  },
  input: {
    borderRadius: moderateScale(12),
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(2),
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('400'),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    color: '#000000',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    width: '100%',
    paddingVertical: getSpacing(2.5),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: moderateScale(20),
    position: 'relative',
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
    color: '#000000',
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('700'),
    letterSpacing: 0.5,
  },
});

export default RegisterStep1Screen;


