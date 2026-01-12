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
  
  // Consistent background color for all cards
  const cardBackground = '#F5F7FA';

  return (
    <View style={styles.grid}>
      {features.live && (
        <FeatureCard
          backgroundColor={cardBackground}
          delay={delayCounter++ * 100}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: '#D32F2F' }]}>
              <MonitorPlay size={20} color="#FFFFFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>LIVE</Text>
            </View>
          </View>
        </FeatureCard>
      )}

      {features.video && (
        <FeatureCard
          backgroundColor={cardBackground}
          delay={delayCounter++ * 100}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: '#009688' }]}>
              <Play size={14} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>VIDEO</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Recorded class</Text>
            </View>
          </View>
        </FeatureCard>
      )}

      {features.notes && (
        <FeatureCard
          backgroundColor={cardBackground}
          delay={delayCounter++ * 100}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: '#03A9F4' }]}>
              <FileText size={20} color="#FFFFFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>NOTES</Text>
            </View>
          </View>
        </FeatureCard>
      )}

      {features.panelPdf && (
        <FeatureCard
          backgroundColor={cardBackground}
          delay={delayCounter++ * 100}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: '#3F51B5' }]}>
              <FileDown size={20} color="#FFFFFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>PANEL</Text>
              <Text style={[styles.title, { color: theme.colors.text }]}>PDF</Text>
            </View>
          </View>
        </FeatureCard>
      )}

      {features.topper && (
        <FeatureCard
          backgroundColor={cardBackground}
          delay={delayCounter++ * 100}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFA000' }]}>
              <Award size={20} color="#FFFFFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>TOPPER</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Talks</Text>
            </View>
          </View>
        </FeatureCard>
      )}

      {features.test && (
        <FeatureCard
          backgroundColor={cardBackground}
          delay={delayCounter++ * 100}
        >
          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: '#FBC02D' }]}>
              <ClipboardList size={20} color="#FFFFFF" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>TEST</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Chapter Wise</Text>
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
    marginBottom: 24,
    gap: 12,
  },
  card: {
    width: '48%',
    borderRadius: 12,
    padding: moderateScale(14),
    minHeight: moderateScale(80),
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginBottom: moderateScale(12),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: moderateScale(14),
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

