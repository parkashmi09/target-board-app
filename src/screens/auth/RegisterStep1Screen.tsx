import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, Animated } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { Images } from '../../assets/images';
import { useToast } from '../../components/Toast';
import type { AuthStackParamList } from '../../navigation/AuthStack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RegisterStep1NavigationProp = NativeStackNavigationProp<AuthStackParamList, 'RegisterStep1'>;

const RegisterStep1Screen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<RegisterStep1NavigationProp>();
  const route = useRoute();
  const toast = useToast();
  
  const { tempToken } = route.params as { tempToken: string };
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

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

  const handleNext = () => {
    if (!fullName.trim()) {
      toast.show({ text: 'Please enter your full name', type: 'error' });
      return;
    }

    setLoading(true);
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 500,
      useNativeDriver: false,
    }).start(() => {
      setTimeout(() => {
        navigation.navigate('RegisterStep2', { 
          tempToken,
          fullName: fullName.trim(),
        });
        setLoading(false);
      }, 300);
    });
  };

  const isValid = fullName.trim().length > 0;

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.imageContainer}>
            <Image
              source={Images.NAME_ILLUSTRATION}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            Almost there
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Please enter below details to complete your profile.
          </Text>

          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Full Name</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              style={[styles.input, { color: theme.colors.text, backgroundColor: theme.colors.inputBackground, borderWidth: 0 }]}
              placeholder="Enter your full name"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>

          <TouchableOpacity
            onPress={handleNext}
            disabled={!isValid || loading}
            style={[
              styles.button,
              { 
                backgroundColor: isValid ? theme.colors.secondary : theme.colors.border,
                overflow: 'hidden',
              }
            ]}
            activeOpacity={0.8}
          >
            <Animated.View
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: theme.colors.secondary,
              }}
            />
            <Text style={[styles.buttonText, { zIndex: 1 }]}>
              {loading ? 'Processing...' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: getSpacing(3),
    paddingTop: getSpacing(4),
  },
  imageContainer: {
    width: '100%',
    height: moderateScale(250),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing(3),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    marginBottom: getSpacing(1),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: moderateScale(14),
    marginBottom: getSpacing(4),
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: getSpacing(3),
  },
  label: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    marginBottom: getSpacing(1),
  },
  input: {
    borderRadius: moderateScale(12),
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(1.5),
    fontSize: moderateScale(16),
  },
  button: {
    width: '100%',
    paddingVertical: getSpacing(2),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getSpacing(3),
    position: 'relative',
    minHeight: moderateScale(45),
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
});

export default RegisterStep1Screen;


