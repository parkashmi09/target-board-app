import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';
import { Play, FileText, FileDown, MonitorPlay, ClipboardList, Award } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';
import { getFontFamily } from '../../utils/fonts';
import { moderateScale } from '../../utils/responsive';

interface CourseFeaturesGridProps {
  features: {
    live?: boolean;
    video?: boolean;
    notes?: boolean;
    panelPdf?: boolean;
    topper?: boolean;
    test?: boolean;
  };
}

interface FeatureCardProps {
  children: React.ReactNode;
  backgroundColor: string;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ children, backgroundColor, delay = 0 }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    // Scale in animation on mount
    const scaleAnimation = Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 400,
      delay: delay,
      useNativeDriver: true,
    });

    scaleAnimation.start();
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [pulseAnim, scaleAnim, delay]);

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor,
          transform: [
            { scale: Animated.multiply(pulseAnim, scaleAnim) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const CourseFeaturesGrid: React.FC<CourseFeaturesGridProps> = React.memo(({ features }) => {
  const theme = useTheme();
  let delayCounter = 0;
  
  // Get background color for feature cards - using consistent light blue color
  const getCardBackground = () => {
    return '#EFF6FF';
  };

  // Get text color for light blue background - always use dark text for contrast
  const getTextColor = () => {
    // Since background is always light blue, use dark text for visibility
    return theme.isDark ? '#1A1A2E' : '#000000';
  };

  // Get secondary text color for light blue background
  const getSecondaryTextColor = () => {
    // Since background is always light blue, use darker secondary text
    return theme.isDark ? '#4A4A4A' : '#666666';
  };

  return (
    <View style={styles.grid}>
      {features.live && (
        <FeatureCard
          backgroundColor={getCardBackground()}
          delay={delayCounter++ * 100}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: '#D32F2F' }]}>
              <MonitorPlay size={16} color="#FFFFFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: getTextColor() }]}>LIVE</Text>
            </View>
          </View>
        </FeatureCard>
      )}

      {features.video && (
        <FeatureCard
          backgroundColor={getCardBackground()}
          delay={delayCounter++ * 100}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: '#009688' }]}>
              <Play size={14} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: getTextColor() }]}>VIDEO</Text>
              <Text style={[styles.subtitle, { color: getSecondaryTextColor() }]}>Recorded class</Text>
            </View>
          </View>
        </FeatureCard>
      )}

      {features.notes && (
        <FeatureCard
          backgroundColor={getCardBackground()}
          delay={delayCounter++ * 100}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: '#03A9F4' }]}>
              <FileText size={16} color="#FFFFFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: getTextColor() }]}>NOTES</Text>
            </View>
          </View>
        </FeatureCard>
      )}

      {features.panelPdf && (
        <FeatureCard
          backgroundColor={getCardBackground()}
          delay={delayCounter++ * 100}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: '#3F51B5' }]}>
              <FileDown size={16} color="#FFFFFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: getTextColor() }]}>PANEL PDF</Text>
            </View>
          </View>
        </FeatureCard>
      )}

      {features.topper && (
        <FeatureCard
          backgroundColor={getCardBackground()}
          delay={delayCounter++ * 100}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFA000' }]}>
              <Award size={16} color="#FFFFFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: getTextColor() }]}>TOPPER</Text>
              <Text style={[styles.subtitle, { color: getSecondaryTextColor() }]}>Talks</Text>
            </View>
          </View>
        </FeatureCard>
      )}

      {features.test && (
        <FeatureCard
          backgroundColor={getCardBackground()}
          delay={delayCounter++ * 100}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: '#FBC02D' }]}>
              <ClipboardList size={16} color="#FFFFFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: getTextColor() }]}>TEST</Text>
              <Text style={[styles.subtitle, { color: getSecondaryTextColor() }]}>Chapter Wise</Text>
            </View>
          </View>
        </FeatureCard>
      )}
    </View>
  );
});

CourseFeaturesGrid.displayName = 'CourseFeaturesGrid';

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  card: {
    width: '48%',
    borderRadius: 8,
    padding: moderateScale(12),
    minHeight: moderateScale(80),
    justifyContent: 'center',
    // elevation: 4,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.15,
    // shadowRadius: 4,
    marginBottom: moderateScale(8),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
    // elevation: 2,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.2,
    // shadowRadius: 2,
  },
  textContainer: {
    flex: 1,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('700'),
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: moderateScale(10),
    fontFamily: getFontFamily('500'),
    marginTop: 2,
  },
});

export default CourseFeaturesGrid;

