import React from 'react';
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
}

const TopperCard: React.FC<TopperCardProps> = ({
  name,
  rank,
  percentage,
  studentImage,
  gradientColors,
}) => {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth * 0.85;
  const defaultGradient: [string, string] = gradientColors || ['#E3F2FD', '#FFFFFF'];

  const getRankColor = (r: number) => {
    switch (r) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#1976D2';
    }
  };

  const rankColor = getRankColor(rank);

  return (
    <View
      style={[
        styles.card,
        {
          width: cardWidth,
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: moderateScale(16) }]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={`topperGradient-${name.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={defaultGradient[0]} stopOpacity="1" />
              <Stop offset="100%" stopColor={defaultGradient[1]} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#topperGradient-${name.replace(/\s+/g, '')})`} rx={moderateScale(16)} />
        </Svg>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.leftSection}>
          <View style={[styles.imageFrame, { borderColor: rankColor }]}>
            <Image
              source={studentImage || Images.TB_LOGO}
              style={styles.studentImage}
              resizeMode="cover"
            />
            <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
              <Text style={styles.rankBadgeText}>{rank}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={styles.headerRow}>
            <View style={styles.trophyContainer}>
              <SVGIcon name="trophy" size={24} color={rankColor} />
              <Text style={[styles.rankLabel, { color: rankColor }]}>RANK {rank}</Text>
            </View>
            <Image
              source={Images.TB_LOGO}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.percentageContainer}>
            <Text style={[styles.percentageValue, { color: theme.colors.text }]}>{percentage}</Text>
            <Text style={[styles.percentageLabel, { color: theme.colors.textSecondary }]}>Score</Text>
          </View>

          <Text style={[styles.studentName, { color: theme.colors.text }]} numberOfLines={1}>
            {name}
          </Text>

          <View style={styles.congratsContainer}>
            <Text style={[styles.congratsText, { color: theme.colors.text }]}>
              Top Performer
            </Text>
            <View style={[styles.underline, { backgroundColor: rankColor }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: moderateScale(16),
    marginRight: getSpacing(2),
    padding: getSpacing(2),
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: moderateScale(160),
  },
  leftSection: {
    width: '35%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: getSpacing(1),
  },
  imageFrame: {
    width: moderateScale(100),
    height: moderateScale(130),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    padding: 2,
    position: 'relative',
  },
  studentImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(10),
  },
  rankBadge: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    width: moderateScale(30),
    height: moderateScale(30),
    borderRadius: moderateScale(15),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  rankBadgeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: moderateScale(14),
  },
  rightSection: {
    flex: 1,
    paddingLeft: getSpacing(1.5),
    justifyContent: 'space-between',
    height: moderateScale(130),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trophyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rankLabel: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logo: {
    width: moderateScale(40),
    height: moderateScale(40),
    marginTop: -8,
  },
  percentageContainer: {
    marginTop: getSpacing(0.5),
  },
  percentageValue: {
    fontSize: moderateScale(28),
    fontWeight: '900',
    letterSpacing: 0.5,
    lineHeight: moderateScale(32),
  },
  percentageLabel: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  studentName: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: getSpacing(1),
  },
  congratsContainer: {
    marginTop: 'auto',
  },
  congratsText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  underline: {
    height: 3,
    width: '40%',
    marginTop: 4,
    borderRadius: 2,
  },
});

export default TopperCard;


