import React, { memo, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Svg, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { Images } from '../../assets/images';
import SVGIcon from '../SVGIcon';

interface TopperCardProps {
  name: string;
  rank: number;
  percentage: string;
  studentImage?: any;
  gradientColors?: [string, string];
  width?: number;
}

const TopperCard: React.FC<TopperCardProps> = memo(({
  name,
  rank,
  percentage,
  studentImage,
  width,
}) => {
  const theme = useTheme();
  const screenWidth = useMemo(() => Dimensions.get('window').width, []);
  const cardWidth = useMemo(() => width || screenWidth * 0.75, [width, screenWidth]);

  const getRankConfig = (r: number) => {
    switch (r) {
      case 1: 
        return { 
          color: '#FFD700', 
          colorSecondary: '#FFA500',
          bgColor: '#FFF9E6',
          bgColorSecondary: '#FFFFFF',
          darkBgColor: '#332D00',
          darkBgColorSecondary: '#4A3D00',
          label: '1st',
          icon: '👑',
          gradient: ['#FFF9E6', '#FFFFFF', '#FFF9E6'],
          darkGradient: ['#332D00', '#4A3D00', '#332D00'],
        };
      case 2: 
        return { 
          color: '#C0C0C0', 
          colorSecondary: '#E8E8E8',
          bgColor: '#F5F5F5',
          bgColorSecondary: '#FFFFFF',
          darkBgColor: '#2A2A2A',
          darkBgColorSecondary: '#3A3A3A',
          label: '2nd',
          icon: '🥈',
          gradient: ['#F5F5F5', '#FFFFFF', '#F5F5F5'],
          darkGradient: ['#2A2A2A', '#3A3A3A', '#2A2A2A'],
        };
      case 3: 
        return { 
          color: '#CD7F32', 
          colorSecondary: '#E6A55C',
          bgColor: '#FFF4E6',
          bgColorSecondary: '#FFFFFF',
          darkBgColor: '#332B1F',
          darkBgColorSecondary: '#4A3D2E',
          label: '3rd',
          icon: '🥉',
          gradient: ['#FFF4E6', '#FFFFFF', '#FFF4E6'],
          darkGradient: ['#332B1F', '#4A3D2E', '#332B1F'],
        };
      default: 
        return { 
          color: '#1976D2', 
          colorSecondary: '#42A5F5',
          bgColor: '#E3F2FD',
          bgColorSecondary: '#FFFFFF',
          darkBgColor: '#1A2838',
          darkBgColorSecondary: '#2A3D5A',
          label: `${r}th`,
          icon: '⭐',
          gradient: ['#E3F2FD', '#FFFFFF', '#E3F2FD'],
          darkGradient: ['#1A2838', '#2A3D5A', '#1A2838'],
        };
    }
  };

  const rankConfig = useMemo(() => getRankConfig(rank), [rank]);
  const gradientColors = useMemo(() => theme.isDark ? rankConfig.darkGradient : rankConfig.gradient, [theme.isDark, rankConfig]);
  const gradientId = useMemo(() => `topperGradient-${rank}-${name}`, [rank, name]);

  return (
    <View
      style={[
        styles.card,
        {
          width: cardWidth,
        },
      ]}
    >
      {/* Gradient Background */}
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: moderateScale(24) }]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="1" />
              <Stop offset="50%" stopColor={gradientColors[1]} stopOpacity="1" />
              <Stop offset="100%" stopColor={gradientColors[2]} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${gradientId})`} rx={moderateScale(24)} />
        </Svg>
      </View>

      {/* Decorative corner accent with glow */}
      <View style={[styles.cornerAccent, { backgroundColor: rankConfig.color }]} />
      <View style={[styles.cornerAccentGlow, { backgroundColor: rankConfig.color }]} />
      
      {/* Sparkle effects */}
      <View style={[styles.sparkle, styles.sparkle1, { backgroundColor: rankConfig.color }]} />
      <View style={[styles.sparkle, styles.sparkle2, { backgroundColor: rankConfig.colorSecondary || rankConfig.color }]} />
      <View style={[styles.sparkle, styles.sparkle3, { backgroundColor: rankConfig.color }]} />
      
      {/* Top Header */}
      <View style={styles.header}>
        <View style={[styles.rankPill, { 
          backgroundColor: rankConfig.color,
          shadowColor: rankConfig.color,
        }]}>
          <Text style={styles.rankEmoji}>{rankConfig.icon}</Text>
          <Text style={styles.rankText}>{rankConfig.label}</Text>
        </View>
        
        <View style={styles.logoContainer}>
          <Image
            source={Images.TB_LOGO}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Profile Image */}
        <View style={styles.imageSection}>
          {/* Glow effect behind image */}
          <View style={[styles.imageGlow, { 
            backgroundColor: rankConfig.color,
            shadowColor: rankConfig.color,
          }]} />
          
          <View style={[styles.imageContainer, { 
            borderColor: rankConfig.color,
            shadowColor: rankConfig.color,
          }]}>
            {/* Inner glow ring */}
            <View style={[styles.imageInnerRing, { borderColor: rankConfig.colorSecondary || rankConfig.color }]} />
            
            <Image
              source={studentImage || Images.TB_LOGO}
              style={styles.studentImage}
              resizeMode="cover"
            />
          </View>
          
          {/* Floating Trophy Icon with enhanced styling */}
          <View style={[styles.floatingTrophy, { 
            backgroundColor: rankConfig.color,
            shadowColor: rankConfig.color,
          }]}>
            <View style={styles.trophyInnerGlow} />
            <SVGIcon name="trophy" size={16} color="#FFF" />
          </View>
          
          {/* Rank badge glow */}
          <View style={[styles.rankBadgeGlow, { backgroundColor: rankConfig.color }]} />
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Text 
            style={[styles.studentName, { color: theme.colors.text }]} 
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {name}
          </Text>
          
          <View style={styles.scoreContainer}>
            <Text 
              style={[styles.percentage, { color: rankConfig.color }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {percentage}
            </Text>
            <Text 
              style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}
              numberOfLines={1}
            >
              Overall Score
            </Text>
          </View>

          {/* Achievement Badge with gradient */}
          <View style={styles.achievementBadgeContainer}>
            <View style={[styles.achievementBadge, { 
              backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: rankConfig.color,
            }]}>
              <Text 
                style={[styles.achievementText, { color: theme.colors.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                🎯 Top Performer
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom decoration with enhanced design */}
      {/* <View style={styles.bottomDecoration}>
        <View style={[styles.decorativeLine, { backgroundColor: rankConfig.color }]} />
        <View style={[styles.decorativeDot, { backgroundColor: rankConfig.color }]} />
        <View style={[styles.decorativeLine, { backgroundColor: rankConfig.color }]} />
        <View style={[styles.decorativeDot, { backgroundColor: rankConfig.colorSecondary || rankConfig.color }]} />
        <View style={[styles.decorativeLine, { backgroundColor: rankConfig.color }]} />
      </View> */}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: moderateScale(20),
    marginRight: getSpacing(1.5),
    padding: getSpacing(1.5),
    overflow: 'hidden',
    minHeight: moderateScale(260),
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  cornerAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: moderateScale(100),
    height: moderateScale(100),
    borderBottomLeftRadius: moderateScale(100),
    opacity: 0.2,
  },
  cornerAccentGlow: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: moderateScale(120),
    height: moderateScale(120),
    borderBottomLeftRadius: moderateScale(120),
    opacity: 0.1,
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  sparkle1: {
    top: moderateScale(60),
    right: moderateScale(40),
  },
  sparkle2: {
    top: moderateScale(100),
    left: moderateScale(30),
  },
  sparkle3: {
    bottom: moderateScale(80),
    right: moderateScale(60),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing(1),
    zIndex: 1,
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getSpacing(1),
    paddingVertical: getSpacing(0.5),
    borderRadius: moderateScale(16),
    gap: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  rankEmoji: {
    fontSize: moderateScale(14),
  },
  rankText: {
    color: '#FFF',
    fontSize: moderateScale(12),
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: moderateScale(14),
    padding: getSpacing(0.25),
  },
  logo: {
    width: moderateScale(28),
    height: moderateScale(28),
    opacity: 0.9,
  },
  mainContent: {
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  imageSection: {
    position: 'relative',
    marginBottom: getSpacing(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageGlow: {
    position: 'absolute',
    width: moderateScale(100),
    height: moderateScale(100),
    borderRadius: moderateScale(50),
    opacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 0,
  },
  imageContainer: {
    width: moderateScale(85),
    height: moderateScale(85),
    borderRadius: moderateScale(42.5),
    borderWidth: 3,
    padding: 3,
    backgroundColor: '#FFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
    overflow: 'hidden',
  },
  imageInnerRing: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: moderateScale(39.5),
    borderWidth: 1.5,
    opacity: 0.5,
  },
  studentImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(39.5),
  },
  floatingTrophy: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 10,
  },
  trophyInnerGlow: {
    position: 'absolute',
    width: '70%',
    height: '70%',
    borderRadius: moderateScale(11),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  rankBadgeGlow: {
    position: 'absolute',
    top: moderateScale(35),
    left: moderateScale(35),
    width: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    opacity: 0.2,
  },
  infoSection: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: getSpacing(0.5),
  },
  studentName: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: getSpacing(0.75),
    letterSpacing: 0.2,
    maxWidth: '100%',
    paddingHorizontal: getSpacing(0.5),
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: getSpacing(0.75),
    width: '100%',
    paddingHorizontal: getSpacing(0.5),
  },
  percentage: {
    fontSize: moderateScale(32),
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: moderateScale(32),
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    maxWidth: '100%',
  },
  scoreLabel: {
    fontSize: moderateScale(10),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
    maxWidth: '100%',
    textAlign: 'center',
  },
  achievementBadgeContainer: {
    marginTop: getSpacing(0.25),
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: getSpacing(0.5),
  },
  achievementBadge: {
    paddingHorizontal: getSpacing(1.5),
    paddingVertical: getSpacing(0.75),
    borderRadius: moderateScale(12),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    maxWidth: '100%',
  },
  achievementText: {
    fontSize: moderateScale(10),
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  bottomDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: getSpacing(1),
    gap: 6,
  },
  decorativeLine: {
    height: 3,
    width: moderateScale(35),
    borderRadius: 1.5,
    opacity: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  decorativeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

TopperCard.displayName = 'TopperCard';

export default TopperCard;