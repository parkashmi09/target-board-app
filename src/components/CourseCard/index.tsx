import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Svg, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { getFontFamily } from '../../utils/fonts';
import { Images } from '../../assets/images';
import { fetchCourseDetails } from '../../services/api';
import CoursePurchaseModal from '../CoursePurchaseModal';

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
  packages?: any[];
  purchased?: boolean;
  onExplore?: () => void;
  onBuyNow?: () => void;
  onPress?: () => void;
}

const CourseCard: React.FC<CourseCardProps> = React.memo(
  ({
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
    courseId,
    packages,
    purchased = false,
    onExplore,
  }) => {
    const theme = useTheme();
    const navigation = useNavigation<any>();
    const cardRef = useRef<View>(null);
    const [cardWidth, setCardWidth] = useState<number | null>(null);

    // Calculate banner height based on actual card width (16:9 aspect ratio)
    const bannerHeight = useMemo(() => {
      if (cardWidth) {
        return cardWidth * (9 / 16);
      }
      // Fallback calculation using window width
      const windowWidth = Dimensions.get('window').width;
      const horizontalPadding = moderateScale(12);
      const peekAmount = moderateScale(26);
      const estimatedCardWidth = windowWidth - horizontalPadding * 2 - peekAmount;
      return estimatedCardWidth * (9 / 16);
    }, [cardWidth]);

    const handleCardLayout = useCallback((event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      if (width > 0 && width !== cardWidth) {
        setCardWidth(width);
      }
    }, [cardWidth]);

    const gradient = gradientColors || ['#FFFACD', '#FFE4B5'];

    const [showModal, setShowModal] = useState(false);
    const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    const { data: course } = useQuery({
      queryKey: ['courseDetails', courseId],
      queryFn: () => fetchCourseDetails(String(courseId)),
      enabled: showModal && !!courseId,
    });

    // Set default package when course loads
    React.useEffect(() => {
      if (course?.packages && course.packages.length > 0) {
        const defaultPackage = course.packages.find((pkg: any) => pkg.isDefault) || course.packages[0];
        if (defaultPackage?._id) {
          setSelectedPackageId(defaultPackage._id);
        }
      }
    }, [course]);

    const handleBuyNow = useCallback(() => {
      if (!courseId) return;

      if (packages && packages.length > 1) {
        setShowModal(true);
      } else {
        navigation.navigate('PaymentCheckout', {
          courseId: String(courseId),
          packageId: packages?.[0]?._id,
          originalPrice,
          currentPrice,
        });
      }
    }, [courseId, packages, originalPrice, currentPrice, navigation]);

    const handlePackageSelect = useCallback((packageId: string) => {
      setSelectedPackageId(packageId);
    }, []);

    const handlePayment = useCallback(() => {
      if (!courseId || !selectedPackageId) return;
      setIsProcessingPayment(true);
      const selectedPackage = course?.packages?.find((pkg: any) => pkg._id === selectedPackageId);
      const packagePrice = selectedPackage?.price || currentPrice;

      navigation.navigate('PaymentCheckout', {
        courseId: String(courseId),
        packageId: selectedPackageId,
        originalPrice,
        currentPrice: packagePrice,
      });

      setShowModal(false);
      setIsProcessingPayment(false);
    }, [courseId, selectedPackageId, course, originalPrice, currentPrice, navigation]);

    const handleDetailsPress = useCallback(() => {
      if (courseId) {
        navigation.navigate('CourseDetails', { courseId: String(courseId) });
      } else if (onExplore) {
        onExplore();
      }
    }, [courseId, navigation, onExplore]);

    const handleContentPress = useCallback(() => {
      if (courseId) {
        navigation.navigate('Categories', {
          courseId: String(courseId),
          courseName: title
        });
      }
    }, [courseId, navigation, title]);

    return (
      <View
        ref={cardRef}
        style={styles.card}
        onLayout={handleCardLayout}
      >
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id={`grad-${title}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradient[0]} />
              <Stop offset="100%" stopColor={gradient[1]} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#grad-${title})`} />
        </Svg>

        <View style={styles.content}>
          <View style={[styles.banner, { height: bannerHeight }]}>
            <Image
              source={bannerImage || Images.TB_LOGO}
              style={styles.image}
              resizeMode="cover"
            />
          </View>

          <View style={styles.details}>
            <Text style={[styles.title, { color: '#1A1A1A' }]}>
              {title}
            </Text>

            <View style={styles.priceContainer}>
              <View style={styles.priceRow}>
                <Text style={[styles.currentPrice, { color: '#1A1A1A' }]}>₹ {currentPrice}</Text>
                <Text style={[styles.originalPrice, { color: '#666666' }]}>₹ {originalPrice}</Text>
                {batchType && <Text style={[styles.batchType, { color: '#666666' }]}>({batchType})</Text>}
              </View>

              {discount ? (
                <View style={styles.discount}>
                  <Text style={styles.discountText}>
                    Discount of {discount}% applied
                  </Text>
                </View>
              ) : null}

            </View>
            <View style={styles.actions}>
              {purchased ? (
                <>
                  <TouchableOpacity
                    style={[styles.detailsBtn, { backgroundColor: theme.colors.info }]}
                    onPress={handleDetailsPress}
                  >
                    <Text style={styles.detailsText}>DETAILS</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.contentBtn, { backgroundColor: theme.colors.warning }]}
                    onPress={handleContentPress}
                  >
                    <Text style={styles.contentText}>CONTENT</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.detailsBtn, { backgroundColor: '#FFD700' }]}
                    onPress={onExplore}
                  >
                    <Text style={[styles.detailsText, { color: '#000000' }]}>DETAILS</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.buyBtn}
                    onPress={handleBuyNow}
                  >
                    <Text style={styles.buyText}>BUY NOW</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>

        {course && (
          <CoursePurchaseModal
            visible={showModal}
            course={course}
            courseFeatures={course.courseFeatures || {}}
            originalPrice={originalPrice}
            currentPrice={currentPrice}
            selectedPackageId={selectedPackageId}
            isProcessingPayment={isProcessingPayment}
            onClose={() => {
              setShowModal(false);
              setIsProcessingPayment(false);
            }}
            onPayment={handlePayment}
            onPackageSelect={handlePackageSelect}
          />
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    width: '95%',
    maxWidth: '100%',
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  content: {
    position: 'relative',
    width: '100%',
  },
  banner: {
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  details: {
    padding: getSpacing(1),
  },
  title: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('600'),
    marginBottom: getSpacing(0.5),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(1),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(1),
  },
  currentPrice: {
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('800'),
  },
  originalPrice: {
    fontSize: moderateScale(12),
    textDecorationLine: 'line-through',
  },
  batchType: {
    fontSize: moderateScale(10),
  },
  discount: {
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: 6,
  },
  discountText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: getFontFamily('700'),
  },
  actions: {
    flexDirection: 'row',
    gap: getSpacing(1),
    marginTop: getSpacing(0.8),
  },
  detailsBtn: {
    flex: 1,
    paddingVertical: getSpacing(1.25),
    paddingHorizontal: getSpacing(2),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('700'),
  },
  contentBtn: {
    flex: 1,
    paddingVertical: getSpacing(1.25),
    paddingHorizontal: getSpacing(2),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('700'),
  },
  buyBtn: {
    flex: 1,
    backgroundColor: '#1f1e1d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyText: {
    color: '#fff',
    fontFamily: getFontFamily('700'),
  },
  purchasedBtn: {
    backgroundColor: '#4CAF50',
    opacity: 0.8,
  },
});

export default CourseCard;