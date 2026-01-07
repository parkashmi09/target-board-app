import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import ResponsiveView from '../components/ResponsiveView';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import { Svg, Circle, Rect, Path, G, Text as SvgText, TSpan, Line } from 'react-native-svg';

const NotesScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { colors } = theme;

  // Animated "Coming Soon" Illustration Component
  const NotesComingSoonIllustration = () => {
    const pageFlipAnim = useRef(new Animated.Value(0)).current;
    const pencilAnim = useRef(new Animated.Value(0)).current;
    const sparkleAnim = useRef(new Animated.Value(0)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;
    const writeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      // Page flipping animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pageFlipAnim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pageFlipAnim, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pencil writing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pencilAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pencilAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
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

      // Writing line animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(writeAnim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(writeAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const pageFlipInterpolate = pageFlipAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '15deg'],
    });

    const pencilTranslateY = pencilAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 8],
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

    const writeLineScaleX = writeAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <View style={styles.comingSoonContainer}>
        <View style={{ width: moderateScale(250), height: moderateScale(250), position: 'relative' }}>
          {/* Notebook Background */}
          <Svg
            width={moderateScale(250)}
            height={moderateScale(250)}
            viewBox="0 0 250 250"
            style={{ position: 'absolute' }}
          >
            {/* Notebook cover */}
            <Rect
              x="30"
              y="40"
              width="120"
              height="160"
              rx="4"
              fill="#FFF9E6"
              stroke="#FFD700"
              strokeWidth="3"
            />
            
            {/* Notebook pages */}
            <Rect
              x="35"
              y="45"
              width="110"
              height="150"
              rx="2"
              fill="#FFFFFF"
            />
            
            {/* Spiral binding */}
            <G>
              {[...Array(8)].map((_, i) => (
                <Circle
                  key={i}
                  cx="35"
                  cy={50 + i * 20}
                  r="3"
                  fill="#FFD700"
                />
              ))}
            </G>
            
            {/* Lines on page */}
            <G>
              {[...Array(6)].map((_, i) => (
                <Line
                  key={i}
                  x1="50"
                  y1={60 + i * 22}
                  x2="135"
                  y2={60 + i * 22}
                  stroke="#E0E0E0"
                  strokeWidth="1"
                />
              ))}
            </G>
          </Svg>

          {/* Animated page flip */}
          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(30),
              top: moderateScale(40),
              transform: [{ rotate: pageFlipInterpolate }, { perspective: 1000 }],
            }}
          >
            <Svg width={moderateScale(120)} height={moderateScale(160)}>
              <Rect
                x="0"
                y="0"
                width="120"
                height="160"
                rx="4"
                fill="#FFFFFF"
                opacity="0.9"
                stroke="#FFD700"
                strokeWidth="2"
              />
            </Svg>
          </Animated.View>

          {/* Animated writing line */}
          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(50),
              top: moderateScale(100),
              width: moderateScale(80),
              height: 2,
              backgroundColor: '#FF9800',
              borderRadius: 1,
              transform: [{ scaleX: writeLineScaleX }],
              transformOrigin: 'left',
            }}
          />

          {/* Animated pencil */}
          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(130),
              top: moderateScale(95),
              transform: [{ translateY: pencilTranslateY }],
            }}
          >
            <Svg width={moderateScale(40)} height={moderateScale(40)}>
              <G transform="rotate(45 20 20)">
                {/* Pencil body */}
                <Rect
                  x="8"
                  y="12"
                  width="24"
                  height="4"
                  rx="2"
                  fill="#FF5722"
                />
                {/* Pencil tip */}
                <Path
                  d="M 8 12 L 4 14 L 8 16 Z"
                  fill="#FF9800"
                />
                {/* Pencil eraser */}
                <Rect
                  x="28"
                  y="12"
                  width="4"
                  height="4"
                  rx="1"
                  fill="#E91E63"
                />
              </G>
            </Svg>
          </Animated.View>

          {/* Floating note papers */}
          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(160),
              top: moderateScale(60),
              transform: [{ translateY: floatTranslateY }],
            }}
          >
            <Svg width={moderateScale(50)} height={moderateScale(50)}>
              <Rect
                x="0"
                y="0"
                width="50"
                height="50"
                rx="2"
                fill="#FFFFFF"
                stroke="#FFD700"
                strokeWidth="2"
                opacity="0.9"
              />
              <Line
                x1="8"
                y1="15"
                x2="42"
                y2="15"
                stroke="#E0E0E0"
                strokeWidth="1"
              />
              <Line
                x1="8"
                y1="25"
                x2="35"
                y2="25"
                stroke="#E0E0E0"
                strokeWidth="1"
              />
              <Circle
                cx="38"
                cy="12"
                r="3"
                fill="#FF9800"
              />
            </Svg>
          </Animated.View>

          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(180),
              top: moderateScale(180),
              transform: [{ translateY: floatTranslateY }],
            }}
          >
            <Svg width={moderateScale(40)} height={moderateScale(40)}>
              <Rect
                x="0"
                y="0"
                width="40"
                height="40"
                rx="2"
                fill="#FFFFFF"
                stroke="#FFD700"
                strokeWidth="2"
                opacity="0.9"
              />
              <Line
                x1="6"
                y1="12"
                x2="34"
                y2="12"
                stroke="#E0E0E0"
                strokeWidth="1"
              />
              <Line
                x1="6"
                y1="20"
                x2="28"
                y2="20"
                stroke="#E0E0E0"
                strokeWidth="1"
              />
            </Svg>
          </Animated.View>

          {/* Animated sparkles */}
          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(50),
              top: moderateScale(50),
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
              left: moderateScale(200),
              top: moderateScale(120),
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
              top: moderateScale(200),
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
        <ScreenHeader showSearch={false} title={t('notes.title') || t('navigation.notes')} />
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ResponsiveView padding={2}>
            <View style={[styles.comingSoonCard, { backgroundColor: colors.cardBackground }]}>
              <NotesComingSoonIllustration />
              <Text style={[styles.comingSoonTitle, { color: colors.text }]}>
                {t('notes.comingSoon')}
              </Text>
              <Text style={[styles.comingSoonSubtitle, { color: colors.textSecondary }]}>
                {t('notes.subtitle')}
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
    marginBottom: getSpacing(1),
    marginTop: getSpacing(2),
  },
  subtitle: {
    marginTop: getSpacing(1),
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

export default NotesScreen;

