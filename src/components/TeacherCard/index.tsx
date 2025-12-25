import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Svg, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import LottieView from 'lottie-react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import SVGIcon from '../SVGIcon';
import { Images } from '../../assets/images';
import verifiedAnimation from '../../assets/lotties/Verified.json';

interface TeacherCardProps {
  name: string;
  expertise: string;
  experience: string;
  rating: number; // 1-5
  imageUrl?: string; // Optional - will use local image if not provided
  isVerified?: boolean;
  gradientColors?: [string, string]; // [startColor, endColor] for gradient
}

const TeacherCard: React.FC<TeacherCardProps> = ({
  name,
  expertise,
  experience,
  rating,
  imageUrl,
  isVerified = true,
  gradientColors,
}) => {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const sidePadding = getSpacing(2);
  const cardWidth = screenWidth * 0.75; // 75% of screen width for horizontal scroll

  // Default gradient colors if not provided - pink gradient like in the image
  const defaultGradient: [string, string] = gradientColors || ['#FFE4E9', '#FFD4DC'];

  // Render stars
  const renderStars = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <SVGIcon
        key={index}
        name="star"
        size={moderateScale(16)}
        color={index < rating ? '#FFD700' : '#E0E0E0'}
      />
    ));
  };

  return (
    <View
      style={[
        styles.card1,
        {
          width: cardWidth,
          shadowColor: theme.colors.cardShadow,
          overflow: 'visible',
        },
      ]}
    >
      {/* Gradient Background */}
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={`teacherGradient-${name}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={defaultGradient[0]} stopOpacity="1" />
              <Stop offset="100%" stopColor={defaultGradient[1]} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#teacherGradient-${name})`} />
        </Svg>
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Teacher Image Section - Positioned outside the card */}
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            <Image
              source={imageUrl ? { uri: imageUrl } : Images.TEACHER}
              style={styles.teacherImage}
              resizeMode="cover"
            />
          </View>
          {/* Experience Badge with Stripe Background */}
          <View style={styles.experienceBadge}>
            <Image
              source={Images.BADGE_STRIPE}
              style={styles.badgeStripeImage}
              resizeMode="cover"
            />
            <View style={styles.experienceTextContainer}>
              <Text style={styles.experienceText}>{experience} </Text>
              <Text style={styles.experienceTextYear}>Years</Text>
            </View>
          </View>
        </View>

        {/* Teacher Details Section */}
        <View style={styles.detailsContainer}>
          {/* Name with Verified Badge */}
          <View style={styles.nameRow}>
            <Text style={[styles.teacherName, { color: '#000000' }]} numberOfLines={1}>
              {name.toUpperCase()}
            </Text>
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <LottieView
                  source={verifiedAnimation}
                  style={{
                    width: moderateScale(24),
                    height: moderateScale(24),
                  }}
                  autoPlay
                  loop
                />
              </View>
            )}
          </View>

          {/* Expertise */}
          <Text style={[styles.expertise, { color: '#000000' }]} numberOfLines={1}>
            {expertise.toUpperCase()}
          </Text>

          {/* Rating Stars */}
          <View style={styles.ratingContainer}>
            {renderStars()}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card1: {
    marginRight: getSpacing(2),
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginTop: moderateScale(60),
  },
  contentContainer: {
    flexDirection: 'row',
    padding: getSpacing(2),
    paddingTop: getSpacing(0.5),
    paddingBottom: getSpacing(1.5),
    zIndex: 1,
  },
  imageContainer: {
    position: 'absolute',
    top: moderateScale(-50),
    left: getSpacing(2),
    zIndex: 2,
  },
  imageWrapper: {
    width: moderateScale(100),
    height: moderateScale(120),
    overflow: 'hidden',
  },
  teacherImage: {
    width: '100%',
    height: '100%',
  },
  experienceBadge: {
    position: 'absolute',
    bottom: moderateScale(-10),
    left: moderateScale(-28),
    width: moderateScale(140),
    height: moderateScale(30),
    overflow: 'hidden',
    backgroundColor: 'transparent',
    zIndex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeStripeImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,

  },
  experienceTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: moderateScale(8),
    marginLeft: moderateScale(-36),
  },
  experienceText: {
    color: '#FFFFFF',
    fontSize: moderateScale(11),
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    // marginLeft: moderateScale(-19),
    zIndex: 1,
    textTransform: 'uppercase',
  },
  experienceTextYear: {
    color: '#FFFFFF',
    fontSize: moderateScale(11),
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginLeft: moderateScale(1),
    zIndex: 1,
    textTransform: 'uppercase',
  },
  logoContainer: {
    marginTop: moderateScale(4),
    alignItems: 'center',
  },
  logoText: {
    fontSize: moderateScale(8),
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: moderateScale(110),
    paddingTop: getSpacing(0.5),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing(0.5),
  },
  teacherName: {
    fontSize: moderateScale(11),
    fontWeight: '800',
    letterSpacing: 0.5,
    marginRight: getSpacing(0.5),
    flexShrink: 1,
  },
  verifiedBadge: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expertise: {
    fontSize: moderateScale(8),
    fontWeight: '600',
    marginBottom: getSpacing(1),
    letterSpacing: 0.3,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: moderateScale(2),
  },
});

export default TeacherCard;
