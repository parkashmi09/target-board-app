import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Svg, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { Images } from '../../assets/images';

interface CourseCardProps {
  title: string;
  subtitle?: string;
  medium: string;
  board: string;
  targetAudience: string;
  originalPrice: number;
  currentPrice: number;
  discount?: number;
  startDate: string;
  endDate: string;
  batchType?: string;
  bannerImage?: any;
  gradientColors?: [string, string];
  courseId?: string | number;
  onExplore?: () => void;
  onBuyNow?: () => void;
  onPress?: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({
  title,
  medium,
  board,
  targetAudience,
  originalPrice,
  currentPrice,
  discount,
  batchType,
  bannerImage,
  gradientColors,
  onExplore,
  onBuyNow,
}) => {
  const theme = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const sidePadding = getSpacing(2);
  const cardWidth = screenWidth - (sidePadding * 2.8);
  const bannerHeight = cardWidth * (9 / 16);
  const defaultGradient: [string, string] = gradientColors || ['#FFFACD', '#FFE4B5'];

  const handleBuyNowClick = useCallback(() => {
    if (onBuyNow) {
      onBuyNow();
    }
  }, [onBuyNow]);

  return (
    <View style={styles.card}>
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: theme.isDark ? theme.colors.cardBackground : 'transparent' }]}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={`courseGradient-${title}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={theme.isDark ? theme.colors.cardBackground : defaultGradient[0]} stopOpacity="1" />
              <Stop offset="100%" stopColor={theme.isDark ? theme.colors.background : defaultGradient[1]} stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#courseGradient-${title})`} />
        </Svg>
      </View>

      <View style={styles.contentContainer}>
        <View style={[styles.bannerContainer, { height: bannerHeight }]}>
          <Image
            source={bannerImage || Images.TB_LOGO}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.detailsContainer}>
          <Text style={[styles.courseTitle, { color: theme.colors.text }]}>
            {title} ({medium}) {board} {targetAudience}
          </Text>

          <View style={styles.pricingSection}>
            <View style={styles.priceContainer}>
              <Text style={[styles.currentPrice, { color: theme.isDark ? theme.colors.text : '#1f1e1d' }]}>
                ₹ {currentPrice}
              </Text>
              <Text style={[styles.originalPrice, { color: theme.colors.textSecondary }]}>
                ₹ {originalPrice}
              </Text>
              {batchType && (
                <Text style={[styles.batchType, { color: theme.colors.textSecondary }]}>
                  ({batchType})
                </Text>
              )}
            </View>
            {discount && discount > 0 && (
              <View style={[styles.discountBadge, { backgroundColor: '#4CAF50' }]}>
                <Text style={styles.discountText}>Discount of {discount}% applied</Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: theme.colors.accent }]}
              onPress={onExplore}
              activeOpacity={0.8}
            >
              <Text style={[styles.exploreButtonText, { color: '#1f1e1d' }]}>DETAILS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buyButton, { backgroundColor: '#1f1e1d' }]}
              onPress={handleBuyNowClick}
              activeOpacity={0.8}
            >
              <Text style={[styles.buyButtonText, { color: '#FFFFFF' }]}>BUY NOW</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: moderateScale(16),
    marginBottom: getSpacing(2),
    overflow: 'hidden',
    position: 'relative',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  contentContainer: {
    position: 'relative',
    zIndex: 1,
  },
  bannerContainer: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    paddingHorizontal: getSpacing(2),
    paddingBottom: getSpacing(2),
  },
  courseTitle: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginBottom: getSpacing(1),
  },
  pricingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getSpacing(1.5),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(1),
  },
  currentPrice: {
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: moderateScale(14),
    textDecorationLine: 'line-through',
  },
  batchType: {
    fontSize: moderateScale(12),
  },
  discountBadge: {
    paddingHorizontal: getSpacing(1),
    paddingVertical: getSpacing(0.5),
    borderRadius: moderateScale(4),
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: moderateScale(10),
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: getSpacing(1.5),
  },
  exploreButton: {
    flex: 1,
    paddingVertical: getSpacing(1.5),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  exploreButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  buyButton: {
    flex: 1,
    paddingVertical: getSpacing(1.5),
    borderRadius: moderateScale(8),
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
});

export default CourseCard;


