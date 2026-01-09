import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Text, Animated } from 'react-native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';

const SplashScreen: React.FC = () => {
  const theme = useTheme();
  
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      // Logo scale and fade in
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.2,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Tagline animation (delayed)
    Animated.parallel([
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
      Animated.timing(taglineTranslateY, {
        toValue: 0,
        duration: 600,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <Animated.View 
        style={[
          styles.logoWrap,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../assets/images/tblogo.webp')}
          style={{ width: moderateScale(110), height: moderateScale(110) }}
          resizeMode="contain"
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.tagline,
          {
            color: theme.colors.text,
            fontSize: moderateScale(14),
            fontFamily: theme.typography.body.fontFamily,
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }],
          },
        ]}
      >
        Empowering Students for 9th–12th Board Success
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing(2),
  },
  tagline: {
    textAlign: 'center',
  },
});

export default SplashScreen;

