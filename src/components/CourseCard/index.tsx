import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Svg, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
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

    // ✅ NO WIDTH CALCULATION HERE
    const bannerHeight = useMemo(() => {
      const width = Dimensions.get('window').width;
      return width * (9 / 18);
    }, []);

    const gradient = gradientColors || ['#FFFACD', '#FFE4B5'];

    const [showModal, setShowModal] = useState(false);

    const { data: course } = useQuery({
      queryKey: ['courseDetails', courseId],
      queryFn: () => fetchCourseDetails(String(courseId)),
      enabled: showModal && !!courseId,
    });

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
      <View style={styles.card}>
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
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {title} ({medium}) {board} {targetAudience}
            </Text>

         <View style={styles.priceContainer}>
         <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>₹ {currentPrice}</Text>
              <Text style={styles.originalPrice}>₹ {originalPrice}</Text>
              {batchType && <Text style={styles.batchType}>({batchType})</Text>}
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
            originalPrice={originalPrice}
            currentPrice={currentPrice}
            onClose={() => setShowModal(false)}
            onPayment={() => setShowModal(false)}
          />
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    width: '95%', // 🔥 FULL WIDTH
    borderRadius: moderateScale(16),
    overflow: 'hidden',

  },
  content: {
    position: 'relative',
  },
  banner: {
    width: '100%',
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
    fontWeight: '600',
    marginBottom: getSpacing(0.5),
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
    gap: getSpacing(1),
  },
  priceRow: {
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
  },
  purchasedBtn: {
    backgroundColor: '#4CAF50',
    opacity: 0.8,
  },
});

export default CourseCard;
