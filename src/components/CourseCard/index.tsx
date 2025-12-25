import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Svg, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { Images } from '../../assets/images';
import { fetchCourseDetails } from '../../services/api';
import CoursePurchaseModal from '../CoursePurchaseModal';
import type { MainStackParamList } from '../../navigation/MainStack';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

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

const CourseCard: React.FC<CourseCardProps> = React.memo(({
  title,
  subtitle,
  medium,
  board,
  targetAudience,
  originalPrice,
  currentPrice,
  discount,
  startDate,
  endDate,
  batchType,
  bannerImage,
  gradientColors,
  courseId,
  onExplore,
  onBuyNow,
  onPress,
}) => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  
  // Memoize dimensions to avoid recalculation on every render
  const { screenWidth, bannerHeight, defaultGradient } = useMemo(() => {
    const width = Dimensions.get('window').width;
    const padding = getSpacing(2);
    const cardWidth = width - (padding * 2.8);
    const height = cardWidth * (9 / 16);
    const gradient: [string, string] = gradientColors || ['#FFFACD', '#FFE4B5'];
    return {
      screenWidth: width,
      bannerHeight: height,
      defaultGradient: gradient,
    };
  }, [gradientColors]);

  // Purchase modal state
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Fetch course details when modal is opened
  const { data: course, isLoading: isLoadingCourse } = useQuery({
    queryKey: ['courseDetails', courseId],
    queryFn: () => fetchCourseDetails(String(courseId || '')),
    enabled: !!courseId && purchaseModalVisible,
  });

  // Parse courseFeatures if it's a string
  const courseFeatures = useMemo(() => {
    if (!course?.courseFeatures) return {};
    try {
      return typeof course.courseFeatures === 'string'
        ? JSON.parse(course.courseFeatures)
        : course.courseFeatures;
    } catch (e) {
      return {};
    }
  }, [course?.courseFeatures]);

  // Calculate prices from course data or use props
  const modalOriginalPrice = course?.strikeoutPrice || course?.coursePrice || originalPrice;
  const modalCurrentPrice = course?.coursePrice || currentPrice;

  // Get default package on mount
  useEffect(() => {
    if (course?.packages && Array.isArray(course.packages)) {
      const defaultPackage = course.packages.find((pkg: any) => pkg.isDefault === true);
      if (defaultPackage) {
        setSelectedPackageId(defaultPackage._id);
      } else if (course.packages.length > 0) {
        setSelectedPackageId(course.packages[0]._id);
      }
    }
  }, [course]);

  const handleBuyNowClick = useCallback(() => {

  if(courseId) {
    setPurchaseModalVisible(true);
  }
  }, [onBuyNow, courseId]);

  const handleClosePurchaseModal = useCallback(() => {
    setPurchaseModalVisible(false);
  }, []);

  const handlePackageSelect = useCallback((packageId: string) => {
    setSelectedPackageId(packageId);
  }, []);

  const handlePayment = useCallback(() => {
    if (!course || !courseId) {
      return;
    }
    setPurchaseModalVisible(false);
    navigation.navigate('PaymentCheckout', {
      courseId: String(courseId),
      packageId: selectedPackageId || undefined,
      originalPrice: modalOriginalPrice,
      currentPrice: modalCurrentPrice,
    });
  }, [course, courseId, selectedPackageId, modalOriginalPrice, modalCurrentPrice, navigation]);

  const handleExploreClick = useCallback(() => {
    if (onExplore) {
      onExplore();
    }
  }, [onExplore]);

  return (
    <View style={styles.card}>
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: theme.isDark ? theme.colors.cardBackground : 'transparent', zIndex: 0 }]}>
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

      <View style={[styles.contentContainer, { zIndex: 1 }]}>
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
                {originalPrice}
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

          <View style={[styles.actionButtons, { zIndex: 10 }]}>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: theme.colors.accent }]}
              onPress={handleExploreClick}
              activeOpacity={0.8}
            >
              <Text style={[styles.exploreButtonText, { color: '#1f1e1d', fontFamily: theme.typography?.h3?.fontFamily || undefined }]}>DETAILS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buyButton, { backgroundColor: '#1f1e1d', shadowColor: '#1f1e1d' }]}
              onPress={handleBuyNowClick}
              activeOpacity={0.8}
            >
              <Text style={[styles.buyButtonText, { color: '#FFFFFF', fontFamily: theme.typography?.h3?.fontFamily || undefined }]}>BUY NOW</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Purchase Modal */}
      {course && (
        <CoursePurchaseModal
          visible={purchaseModalVisible}
          course={course}
          courseFeatures={courseFeatures}
          originalPrice={modalOriginalPrice}
          currentPrice={modalCurrentPrice}
          selectedPackageId={selectedPackageId}
          isProcessingPayment={isProcessingPayment}
          onClose={handleClosePurchaseModal}
          onPayment={handlePayment}
          onPackageSelect={handlePackageSelect}
        />
      )}
    </View>
  );
});

CourseCard.displayName = 'CourseCard';

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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentContainer: {
    position: 'relative',
    zIndex: 1,
    backgroundColor: 'transparent',
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
    paddingHorizontal: getSpacing(1),
    paddingBottom: getSpacing(1),
  },
  courseTitle: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginBottom: getSpacing(0.5),
  },
  pricingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getSpacing(1),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(1),
  },
  currentPrice: {
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
  originalPrice: {
    fontSize: moderateScale(12),
    textDecorationLine: 'line-through',
  },
  batchType: {
    fontSize: moderateScale(10),
  },
  discountBadge: {
    borderRadius: moderateScale(20),
    paddingHorizontal: getSpacing(1.5),
    paddingVertical: moderateScale(4),
  },
  discountText: {
    fontSize: moderateScale(9),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: getSpacing(1),
    marginTop: getSpacing(0.5),
  },
  exploreButton: {
    flex: 1,
    borderRadius: moderateScale(8),
    paddingVertical: getSpacing(1.5),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exploreButtonText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buyButton: {
    flex: 1,
    paddingVertical: getSpacing(1.5),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buyButtonText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default CourseCard;


