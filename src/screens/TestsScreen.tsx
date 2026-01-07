import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/theme';
import { getSpacing, moderateScale } from '../utils/responsive';
import ResponsiveView from '../components/ResponsiveView';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import { Svg, Circle, Rect, Path, G, Text as SvgText, TSpan, Line, Polygon } from 'react-native-svg';

const TestsScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme;

  // Animated "Coming Soon" Illustration Component for Tests
  const TestsComingSoonIllustration = () => {
    const paperAnim = useRef(new Animated.Value(0)).current;
    const checkmarkAnim = useRef(new Animated.Value(0)).current;
    const timerAnim = useRef(new Animated.Value(0)).current;
    const sparkleAnim = useRef(new Animated.Value(0)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      // Paper floating animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(paperAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(paperAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Checkmark animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(checkmarkAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(500),
          Animated.timing(checkmarkAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(500),
        ])
      ).start();

      // Timer hand rotation
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(timerAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Sparkle animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Floating animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const paperTranslateY = paperAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -10],
    });

    const checkmarkScale = checkmarkAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 1.2, 1],
    });

    const timerRotate = timerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const sparkleScale = sparkleAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.8, 1.3, 0.8],
    });

    const sparkleOpacity = sparkleAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.4, 1, 0.4],
    });

    const floatTranslateY = floatAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -15],
    });

    return (
      <View style={styles.comingSoonContainer}>
        <View style={{ width: moderateScale(250), height: moderateScale(250), position: 'relative' }}>
          {/* Test Paper Background */}
          <Svg
            width={moderateScale(250)}
            height={moderateScale(250)}
            viewBox="0 0 250 250"
            style={{ position: 'absolute' }}
          >
            {/* Main test paper */}
            <Rect
              x="40"
              y="50"
              width="140"
              height="180"
              rx="4"
              fill="#FFFFFF"
              stroke="#FFD700"
              strokeWidth="3"
            />
            
            {/* Paper lines */}
            <G>
              {[...Array(8)].map((_, i) => (
                <Line
                  key={i}
                  x1="50"
                  y1={70 + i * 20}
                  x2="170"
                  y2={70 + i * 20}
                  stroke="#E0E0E0"
                  strokeWidth="1"
                />
              ))}
            </G>
            
            {/* Question numbers */}
            <G>
              {[...Array(4)].map((_, i) => (
                <Circle
                  key={i}
                  cx="55"
                  cy={75 + i * 40}
                  r="4"
                  fill="#FF9800"
                />
              ))}
            </G>
          </Svg>

          {/* Animated floating test paper */}
          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(40),
              top: moderateScale(50),
              transform: [{ translateY: paperTranslateY }],
            }}
          >
            <Svg width={moderateScale(140)} height={moderateScale(180)}>
              <Rect
                x="0"
                y="0"
                width="140"
                height="180"
                rx="4"
                fill="#FFFFFF"
                opacity="0.95"
                stroke="#FFD700"
                strokeWidth="2"
              />
            </Svg>
          </Animated.View>

          {/* Animated checkmark */}
          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(180),
              top: moderateScale(100),
              transform: [{ scale: checkmarkScale }],
            }}
          >
            <Svg width={moderateScale(50)} height={moderateScale(50)}>
              <Circle
                cx="25"
                cy="25"
                r="20"
                fill="#4CAF50"
                opacity="0.9"
              />
              <Path
                d="M 10 25 L 20 35 L 40 15"
                stroke="#FFFFFF"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </Animated.View>

          {/* Timer/Clock */}
          <View
            style={{
              position: 'absolute',
              left: moderateScale(190),
              top: moderateScale(180),
            }}
          >
            <Svg width={moderateScale(40)} height={moderateScale(40)}>
              <Circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="#FF9800"
                strokeWidth="2"
              />
              <Circle
                cx="20"
                cy="20"
                r="2"
                fill="#FF9800"
              />
              {/* Static hour hand */}
              <Line
                x1="20"
                y1="20"
                x2="20"
                y2="12"
                stroke="#FF9800"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </Svg>
            {/* Animated minute hand */}
            <Animated.View
              style={{
                position: 'absolute',
                left: moderateScale(20),
                top: moderateScale(20),
                transform: [{ rotate: timerRotate }],
                transformOrigin: '0 0',
              }}
            >
              <Svg width={moderateScale(40)} height={moderateScale(40)}>
                <Line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="-14"
                  stroke="#FF9800"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>
          </View>

          {/* Floating question marks */}
          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(60),
              top: moderateScale(30),
              transform: [{ translateY: floatTranslateY }],
            }}
          >
            <Svg width={moderateScale(30)} height={moderateScale(30)}>
              <Circle
                cx="15"
                cy="15"
                r="12"
                fill="#FFEB3B"
                opacity="0.9"
              />
              <SvgText
                x="15"
                y="20"
                fontSize="18"
                fill="#000000"
                textAnchor="middle"
                fontWeight="bold"
              >
                <TSpan>?</TSpan>
              </SvgText>
            </Svg>
          </Animated.View>

          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(200),
              top: moderateScale(60),
              transform: [{ translateY: floatTranslateY }],
            }}
          >
            <Svg width={moderateScale(25)} height={moderateScale(25)}>
              <Circle
                cx="12.5"
                cy="12.5"
                r="10"
                fill="#FFEB3B"
                opacity="0.9"
              />
              <SvgText
                x="12.5"
                y="17"
                fontSize="14"
                fill="#000000"
                textAnchor="middle"
                fontWeight="bold"
              >
                <TSpan>?</TSpan>
              </SvgText>
            </Svg>
          </Animated.View>

          {/* Animated sparkles */}
          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(50),
              top: moderateScale(200),
              transform: [{ scale: sparkleScale }],
              opacity: sparkleOpacity,
            }}
          >
            <Svg width={moderateScale(20)} height={moderateScale(20)}>
              <Path
                d="M 10 0 L 12 8 L 20 10 L 12 12 L 10 20 L 8 12 L 0 10 L 8 8 Z"
                fill="#FFD700"
              />
            </Svg>
          </Animated.View>

          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(180),
              top: moderateScale(50),
              transform: [{ scale: sparkleScale }],
              opacity: sparkleOpacity,
            }}
          >
            <Svg width={moderateScale(16)} height={moderateScale(16)}>
              <Path
                d="M 8 0 L 9.5 6 L 16 8 L 9.5 10 L 8 16 L 6.5 10 L 0 8 L 6.5 6 Z"
                fill="#FFD700"
              />
            </Svg>
          </Animated.View>

          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(70),
              top: moderateScale(230),
              transform: [{ scale: sparkleScale }],
              opacity: sparkleOpacity,
            }}
          >
            <Svg width={moderateScale(18)} height={moderateScale(18)}>
              <Path
                d="M 9 0 L 11 7 L 18 9 L 11 11 L 9 18 L 7 11 L 0 9 L 7 7 Z"
                fill="#FFD700"
              />
            </Svg>
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <ScreenHeader showSearch={false} title={t('tests.title') || t('features.quizTest')} />
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ResponsiveView padding={2}>
            <View style={[styles.comingSoonCard, { backgroundColor: colors.cardBackground }]}>
              <TestsComingSoonIllustration />
              <Text style={[styles.comingSoonTitle, { color: colors.text }]}>
                {t('tests.comingSoon')}
              </Text>
              <Text style={[styles.comingSoonSubtitle, { color: colors.textSecondary }]}>
                {t('tests.subtitle')}
              </Text>
            </View>
          </ResponsiveView>
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: getSpacing(2),
    paddingBottom: getSpacing(4),
  },
  title: {
    fontWeight: 'bold',
    marginTop: getSpacing(2),
  },
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing(2),
  },
  comingSoonCard: {
    borderRadius: moderateScale(16),
    padding: getSpacing(4),
    marginTop: getSpacing(2),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(400),
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  comingSoonTitle: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    marginTop: getSpacing(3),
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: moderateScale(15),
    marginTop: getSpacing(2),
    textAlign: 'center',
    paddingHorizontal: getSpacing(4),
    lineHeight: moderateScale(22),
  },
});

export default TestsScreen;

