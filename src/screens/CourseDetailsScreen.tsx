import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../theme/theme';
import { getFontFamily } from '../utils/fonts';
import { ArrowLeft, Share2, Check, ChevronDown } from 'lucide-react-native';
import GradientBackground from '../components/GradientBackground';
import { fetchCourseDetails, getCourseStreams, Stream } from '../services/api';
import { useToast } from '../components/Toast';
import CourseBottomBar from '../components/CourseBottomBar';
import CoursePurchaseModal from '../components/CoursePurchaseModal';
import TeachersSection from '../components/TeachersSection';
import CourseVideoPlayer from '../components/CourseVideoPlayer';
import CourseFeaturesGrid from '../components/CourseFeaturesGrid';
import BatchInfoCard from '../components/BatchInfoCard';
import CourseDescription from '../components/CourseDescription';
import TimeTableSection from '../components/TimeTableSection';
import { moderateScale, getSpacing } from '../utils/responsive';
import LottieView from 'lottie-react-native';
import { Svg, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import SVGIcon from '../components/SVGIcon';
import supportAnimation from '../assets/lotties/support.json';

// Static FAQ Data
const FAQ_DATA = [
  {
    id: '1',
    question: 'How many classes will be taken in a week?',
    answer: 'The number of classes per week varies depending on the course. Typically, you can expect 3-5 live classes per week, along with recorded content and study materials. Please check the course timetable for specific class schedules.',
  },
  {
    id: '2',
    question: 'Can I access the course on both mobile and desktop?',
    answer: 'Yes, absolutely! Our platform is fully responsive and works seamlessly on both mobile devices and desktop computers. You can access all course content, live classes, and study materials from any device with an internet connection.',
  },
  {
    id: '3',
    question: 'How can I pay for the course?',
    answer: 'You can pay for the course using various payment methods including credit/debit cards, UPI, net banking, and digital wallets. Simply click on "Buy Now" and follow the secure payment process. All transactions are encrypted and secure.',
  },
];

const CourseDetailsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { courseId, openPurchaseModal } = route.params || {};
  const toast = useToast();
  const queryClient = useQueryClient();
  const { top } = useSafeAreaInsets();

  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [liveStreams, setLiveStreams] = useState<Stream[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const callScaleAnim = useRef(new Animated.Value(1)).current;
  const whatsappScaleAnim = useRef(new Animated.Value(1)).current;

  // Early validation - if courseId is missing, show error immediately
  if (!courseId) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: '#FFFFFF' }]}>
        <Text style={[styles.errorText, { color: 'red' }]}>
          Missing course information
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: '#001F3F' }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { data: course, isLoading, error, refetch } = useQuery({
    queryKey: ['courseDetails', courseId],
    queryFn: () => fetchCourseDetails(courseId),
    enabled: !!courseId,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data (gcTime replaces cacheTime in v5)
    refetchOnMount: true, // Refetch on every mount
    refetchOnWindowFocus: true, // Refetch when screen is focused
  });

  // Fetch live streams using React Query - refetch every time
  const { data: streamsData, refetch: refetchStreams } = useQuery({
    queryKey: ['courseStreams', courseId, 'live'],
    queryFn: () => getCourseStreams(courseId, 'live'),
    enabled: !!courseId && !!course,
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Don't cache data (gcTime replaces cacheTime in v5)
    refetchOnMount: true, // Refetch on every mount
    refetchOnWindowFocus: true, // Refetch when screen is focused
  });

  // Update live streams from API response
  useEffect(() => {
    if (streamsData) {
      setLiveStreams(Array.isArray(streamsData) ? streamsData : []);
    } else {
      setLiveStreams([]);
    }
  }, [streamsData]);

  // Use API response directly - all validation comes from API
  const courseFeatures = useMemo(() => {
    if (!course) return {};
    // API should return parsed courseFeatures, but handle string if needed
    if (!course.courseFeatures) return {};
    try {
      return typeof course.courseFeatures === 'string'
        ? JSON.parse(course.courseFeatures)
        : course.courseFeatures;
    } catch (e) {
      return {};
    }
  }, [course?.courseFeatures]);

  // Use API response for default package
  const defaultPackage = useMemo(() => {
    if (!course) return null;
    return (course as any).defaultPackage || 
      (course.packages && Array.isArray(course.packages) 
        ? (course.packages.find((pkg: any) => pkg?.isDefault === true) || course.packages[0] || null)
        : null);
  }, [course]);

  // Use API response for class name
  const className = useMemo(() => {
    if (!course) return null;
    return (course as any).className || 
      (course.courseMappings && Array.isArray(course.courseMappings) && course.courseMappings.length > 0
        ? course.courseMappings[0]?.class?.name || null
        : null) ||
      (course.class && typeof course.class === 'object' ? (course.class as any).name : null);
  }, [course]);

  // Use API response for prices - API should provide these values
  const originalPrice = useMemo(() => {
    if (!course) return 0;
    return (course as any).originalPrice || course.strikeoutPrice || 0;
  }, [course]);

  const currentPrice = useMemo(() => {
    if (!course) return 0;
    return (course as any).currentPrice || 
      (defaultPackage?.price !== undefined && defaultPackage.price > 0 
        ? defaultPackage.price 
        : course.coursePrice || 0);
  }, [course, defaultPackage]);

  // Use API response for discount
  const discount = useMemo(() => {
    if (!course) return 0;
    return (course as any).discount || 
      (originalPrice > 0 && originalPrice > currentPrice
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0);
  }, [course, originalPrice, currentPrice]);

  const handleShare = useCallback(async () => {
    if (!course?.name) {
      toast.show({ text: 'Course information not available', type: 'error' });
      return;
    }
    try {
      const message = `Check out this course: ${course.name}\n${course.whatsappGroupLink || ''}`;
      const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        toast.show({ text: 'WhatsApp is not installed', type: 'error' });
      }
    } catch (error) {
      toast.show({ text: 'Failed to share', type: 'error' });
    }
  }, [course, toast]);

  // Use API response for all validation flags - API should provide these
  const isCoursePaid = useMemo(() => {
    if (!course) return false;
    return (course as any).isCoursePaid !== undefined 
      ? (course as any).isCoursePaid 
      : (currentPrice > 0);
  }, [course, currentPrice]);

  const isPurchased = useMemo(() => {
    if (!course) return false;
    return (course as any).isPurchased || false;
  }, [course]);

  const hasLiveStreams = useMemo(() => {
    if (!course) return false;
    return (course as any).hasLiveStreams !== undefined
      ? (course as any).hasLiveStreams
      : (liveStreams.length > 0);
  }, [course, liveStreams]);

  // Get default package from API response
  useEffect(() => {
    if (course?.defaultPackage?._id) {
      setSelectedPackageId(course.defaultPackage._id);
    } else if (course?.packages && Array.isArray(course.packages) && course.packages.length > 0) {
      const defaultPkg = course.packages.find((pkg: any) => pkg?.isDefault === true);
      if (defaultPkg?._id) {
        setSelectedPackageId(defaultPkg._id);
      } else if (course.packages[0]?._id) {
        setSelectedPackageId(course.packages[0]._id);
      }
    }
  }, [course]);

  // Refetch data every time screen is focused to get latest API response
  useFocusEffect(
    useCallback(() => {
      if (courseId) {
        refetch();
        if (course) {
          refetchStreams();
        }
      }
    }, [courseId, course, refetch, refetchStreams])
  );

  // Open purchase modal if requested from navigation
  useEffect(() => {
    if (openPurchaseModal && course && !isLoading) {
      setTimeout(() => {
        setPurchaseModalVisible(true);
      }, 300);
    }
  }, [openPurchaseModal, course, isLoading]);

  const handleContentPress = useCallback(() => {
    if (!course || !courseId) {
      toast.show({ text: 'Course information not available', type: 'error' });
      return;
    }
    try {
      navigation.navigate('Categories', {
        courseId,
        courseName: course.name,
      });
    } catch (error) {
      if (__DEV__) {
        console.error('[CourseDetailsScreen] Navigation error:', error);
      }
      toast.show({ text: 'Failed to open content', type: 'error' });
    }
  }, [course, courseId, navigation, toast]);

  const handleBuyNow = useCallback(() => {
    // If course is already purchased, navigate to Categories screen
    if (isPurchased) {
      handleContentPress();
      return;
    }

    if (!isCoursePaid) {
      setPurchaseModalVisible(true);
      return;
    }

    if (isCoursePaid && hasLiveStreams && liveStreams.length > 0) {
      const firstLiveStream = liveStreams[0];
      if (firstLiveStream && (firstLiveStream._id || firstLiveStream.id)) {
        try {
          // navigation.navigate('StreamPlayer', {
          //   streamId: firstLiveStream._id || firstLiveStream.id || '',
          //   tpAssetId: firstLiveStream.tpAssetId,
          //   hlsUrl: firstLiveStream.hlsUrl,
          // });
          navigation.navigate('ClassStreams')
        } catch (error) {
          if (__DEV__) {
            console.error('[CourseDetailsScreen] Navigation error:', error);
          }
          toast.show({ text: 'Failed to open stream', type: 'error' });
        }
        return;
      }
    }

    setPurchaseModalVisible(true);
  }, [isCoursePaid, isPurchased, hasLiveStreams, liveStreams, navigation, toast, courseId, course]);

  const handlePayment = useCallback(() => {
    if (!course || !courseId) {
      toast.show({ text: 'Course information not available', type: 'error' });
      return;
    }
    try {
      setPurchaseModalVisible(false);
      navigation.navigate('PaymentCheckout', {
        courseId,
        packageId: selectedPackageId || undefined,
        originalPrice,
        currentPrice,
      });
    } catch (error) {
      toast.show({ text: 'Failed to open payment', type: 'error' });
    }
  }, [course, courseId, selectedPackageId, originalPrice, currentPrice, toast, navigation]);

  const handleClosePurchaseModal = useCallback(() => {
    setPurchaseModalVisible(false);
  }, []);

  const handlePackageSelect = useCallback((packageId: string) => {
    setSelectedPackageId(packageId);
  }, []);

  const handleTeacherPress = useCallback((teacherId: string) => {
    if (!teacherId) {
      toast.show({ text: 'Teacher information not available', type: 'error' });
      return;
    }
    try {
      navigation.navigate('TeacherDetails', { teacherId });
    } catch (error) {
      if (__DEV__) {
        console.error('[CourseDetailsScreen] Navigation error:', error);
      }
      toast.show({ text: 'Failed to open teacher details', type: 'error' });
    }
  }, [navigation, toast]);

  const handleBatchInfoPress = useCallback(() => {
    if (course?.batchInfo) {
      try {
        navigation.navigate('PDFViewer', { 
          url: course.batchInfo, 
          title: 'Batch Information',
          contentId: course._id || courseId || undefined
        });
      } catch (error) {
        if (__DEV__) {
          console.error('[CourseDetailsScreen] Navigation error:', error);
        }
        toast.show({ text: 'Failed to open batch information', type: 'error' });
      }
    }
  }, [course, courseId, navigation, toast]);

  const handleFAQToggle = useCallback((faqId: string) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  }, [expandedFAQ]);

  const handleCall = useCallback(() => {
    const phoneNumber = '8114532021';
    Linking.openURL(`tel:${phoneNumber}`);
  }, []);

  const handleWhatsApp = useCallback(() => {
    const phoneNumber = '8114532021';
    const message = 'Hello, I need help with the course.';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        return Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
      }
    }).catch(err => {
      if (__DEV__) {
        console.error('An error occurred', err);
      }
    });
  }, []);

  const handleCallPressIn = useCallback(() => {
    Animated.spring(callScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  }, [callScaleAnim]);

  const handleCallPressOut = useCallback(() => {
    Animated.spring(callScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [callScaleAnim]);

  const handleWhatsAppPressIn = useCallback(() => {
    Animated.spring(whatsappScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  }, [whatsappScaleAnim]);

  const handleWhatsAppPressOut = useCallback(() => {
    Animated.spring(whatsappScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [whatsappScaleAnim]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: '#FFFFFF' }]}>
        <ActivityIndicator size="large" color="#001F3F" />
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: '#FFFFFF' }]}>
        <Text style={[styles.errorText, { color: 'red' }]}>
          Failed to load course details
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: '#001F3F' }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GradientBackground>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          TARGET BOARD
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {course.introVideoLink && (
          <CourseVideoPlayer videoUrl={course.introVideoLink} />
        )}

        <View style={styles.contentPadding}>
          <Text style={[styles.courseTitle, { color: theme.colors.text }]}>
            {course.name || 'Course'}
          </Text>

          {/* Validity Badge */}
          {defaultPackage?.durationInMonths && (
            <View style={styles.validityWrapper}>
              <View style={styles.validityBadge}>
                <Check size={14} color="#FFFFFF" strokeWidth={4} />
              </View>
              <Text style={[styles.validityText, { color: theme.colors.text }]}>
                Validity- <Text style={[styles.validityValue, { color: theme.colors.text }]}>
                  {defaultPackage.durationInMonths} {defaultPackage.durationInMonths === 1 ? 'Month' : 'Months'}
                </Text>
              </Text>
            </View>
          )}

          <BatchInfoCard
            batchInfoUrl={course.batchInfo}
            onPress={handleBatchInfoPress}
          />

          <CourseFeaturesGrid features={courseFeatures} />

          <CourseDescription
            description={course.courseDescription}
            originalPrice={originalPrice}
            currentPrice={currentPrice}
            className={className}
          />

          <TimeTableSection timetableUrl={course.timetable} />

          {course.teachers && Array.isArray(course.teachers) && course.teachers.length > 0 && (
            <TeachersSection
              teachers={course.teachers}
              onTeacherPress={handleTeacherPress}
            />
          )}

          {/* FAQ Section */}
          <View style={styles.faqSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Frequently Asked Questions
            </Text>
            {FAQ_DATA.map((faq) => {
              const isExpanded = expandedFAQ === faq.id;
              return (
                <TouchableOpacity
                  key={faq.id}
                  style={[styles.faqItem, { backgroundColor: theme.colors.cardBackground }]}
                  onPress={() => handleFAQToggle(faq.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.faqHeader}>
                    <Text style={[styles.faqQuestion, { color: theme.colors.text }]}>
                      {faq.question}
                    </Text>
                    <ChevronDown
                      size={20}
                      color={theme.colors.textSecondary}
                      style={[
                        styles.chevronIcon,
                        isExpanded && styles.chevronIconExpanded,
                      ]}
                    />
                  </View>
                  {isExpanded && (
                    <View style={styles.faqAnswerContainer}>
                      <Text style={[styles.faqAnswer, { color: theme.colors.textSecondary }]}>
                        {faq.answer}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Need any help? Section */}
          <View style={styles.helpSection}>
            {/* Illustration Card - Horizontal Layout */}
            <View style={[styles.helpIllustrationCard, { backgroundColor: theme.colors.cardBackground }]}>
              <View style={styles.helpIllustrationWrapper}>
                <View style={styles.decorativeCircle1} />
                <View style={styles.decorativeCircle2} />
                <LottieView
                  source={supportAnimation}
                  style={styles.lottie}
                  autoPlay
                  loop
                />
              </View>
              <View style={styles.helpTextContainer}>
                <Text style={[styles.helpTitle, { color: theme.colors.text }]}>
                  Need any help?
                </Text>
                <Text style={[styles.helpDescription, { color: theme.colors.textSecondary }]}>
                  Our expert will help guide you at every step you need help.
                </Text>
              </View>
            </View>

            {/* Contact Cards */}
            <View style={styles.contactSection}>
              {/* Call Card */}
              <Animated.View style={{ transform: [{ scale: callScaleAnim }] }}>
                <TouchableOpacity
                  style={styles.contactCard}
                  onPress={handleCall}
                  onPressIn={handleCallPressIn}
                  onPressOut={handleCallPressOut}
                  activeOpacity={1}
                >
                  {/* Gradient Background */}
                  <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: moderateScale(20) }]}>
                    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                      <Defs>
                        <LinearGradient id="callGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <Stop offset="0%" stopColor="#E3F2FD" stopOpacity="1" />
                          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
                        </LinearGradient>
                      </Defs>
                      <Rect width="100%" height="100%" fill="url(#callGradient)" rx={moderateScale(20)} />
                    </Svg>
                  </View>

                  {/* Content */}
                  <View style={styles.cardInner}>
                    <View style={[styles.iconCircle, styles.callIconCircle]}>
                      <View style={styles.iconCircleInner}>
                        <SVGIcon name="phone" size={moderateScale(24)} color="#2196F3" />
                      </View>
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                        Call Us
                      </Text>
                      <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                        8114532021
                      </Text>
                    </View>
                    <View style={styles.chevronContainer}>
                      <SVGIcon name="chevron-right" size={moderateScale(20)} color={theme.colors.accent} />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>

              {/* WhatsApp Card */}
              <Animated.View style={{ transform: [{ scale: whatsappScaleAnim }] }}>
                <TouchableOpacity
                  style={styles.contactCard}
                  onPress={handleWhatsApp}
                  onPressIn={handleWhatsAppPressIn}
                  onPressOut={handleWhatsAppPressOut}
                  activeOpacity={1}
                >
                  {/* Gradient Background */}
                  <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: moderateScale(20) }]}>
                    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                      <Defs>
                        <LinearGradient id="whatsappGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <Stop offset="0%" stopColor="#E8F5E9" stopOpacity="1" />
                          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
                        </LinearGradient>
                      </Defs>
                      <Rect width="100%" height="100%" fill="url(#whatsappGradient)" rx={moderateScale(20)} />
                    </Svg>
                  </View>

                  {/* Content */}
                  <View style={styles.cardInner}>
                    <View style={[styles.iconCircle, styles.whatsappIconCircle]}>
                      <View style={styles.iconCircleInner}>
                        <SVGIcon name="whatsapp" size={moderateScale(24)} color="#4CAF50" />
                      </View>
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                        WhatsApp
                      </Text>
                      <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                        Chat with us
                      </Text>
                    </View>
                    <View style={styles.chevronContainer}>
                      <SVGIcon name="chevron-right" size={moderateScale(20)} color={theme.colors.accent} />
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Share Button */}
      <TouchableOpacity
        style={styles.shareFab}
        onPress={handleShare}
        activeOpacity={0.8}
      >
        <Share2 size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <CourseBottomBar
        currentPrice={currentPrice}
        originalPrice={originalPrice}
        discount={discount}
        isCoursePaid={isCoursePaid}
        isPurchased={isPurchased}
        hasLiveStreams={hasLiveStreams}
        onBuyNow={handleBuyNow}
        onContentPress={handleContentPress}
      />

      <CoursePurchaseModal
        visible={purchaseModalVisible}
        course={course}
        courseFeatures={courseFeatures}
        originalPrice={originalPrice}
        currentPrice={currentPrice}
        selectedPackageId={selectedPackageId}
        isProcessingPayment={isProcessingPayment}
        onClose={handleClosePurchaseModal}
        onPayment={handlePayment}
        onPackageSelect={handlePackageSelect}
      />
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: getFontFamily('600'),
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentPadding: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 18,
    fontFamily: getFontFamily('500'),
    marginBottom: 16,
  },
  validityWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  validityBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 50,
    padding: 4,
    marginRight: 8,
    elevation: 2,
  },
  validityText: {
    fontSize: 20,
    fontFamily: getFontFamily('600'),
  },
  validityValue: {
    fontFamily: getFontFamily('700'),
  },
  shareFab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    zIndex: 100,
  },
  backButton: {
    marginTop: 20,
    padding: 10,
  },
  backButtonText: {
    fontFamily: getFontFamily('600'),
  },
  faqSection: {
    marginTop: getSpacing(4),
    // marginBottom: getSpacing(4),
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    fontFamily: getFontFamily('700'),
    marginBottom: getSpacing(1),
    letterSpacing: -0.3,
  },
  faqItem: {
    borderRadius: moderateScale(12),
    marginBottom: getSpacing(2),
    padding: getSpacing(2),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: moderateScale(13),
    fontFamily: getFontFamily('600'),
    flex: 1,
    marginRight: getSpacing(2),
    lineHeight: moderateScale(22),
  },
  chevronIcon: {
    transform: [{ rotate: '0deg' }],
  },
  chevronIconExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  faqAnswerContainer: {
    marginTop: getSpacing(2),
    paddingTop: getSpacing(2),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  faqAnswer: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('400'),
    lineHeight: moderateScale(20),
  },
  helpSection: {
    // marginTop: getSpacing(3),
    marginBottom: getSpacing(3),
  },
  helpIllustrationCard: {
    flexDirection: 'row',
    borderRadius: moderateScale(16),
    padding: getSpacing(2),
    marginBottom: getSpacing(2.5),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    alignItems: 'center',
  },
  helpIllustrationWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: moderateScale(110),
    height: moderateScale(110),
    marginRight: getSpacing(2),
  },
  decorativeCircle1: {
    position: 'absolute',
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    top: moderateScale(-8),
    left: moderateScale(-8),
  },
  decorativeCircle2: {
    position: 'absolute',
    width: moderateScale(75),
    height: moderateScale(75),
    borderRadius: moderateScale(37.5),
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    bottom: moderateScale(-4),
    right: moderateScale(-4),
  },
  lottie: {
    width: moderateScale(90),
    height: moderateScale(90),
    zIndex: 1,
  },
  helpTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  helpTitle: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('700'),
    marginBottom: getSpacing(0.5),
    letterSpacing: -0.2,
  },
  helpDescription: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('400'),
    lineHeight: moderateScale(16),
  },
  contactSection: {
    width: '100%',
    gap: getSpacing(2),
  },
  contactCard: {
    borderRadius: moderateScale(20),
    overflow: 'hidden',
   
    minHeight: moderateScale(60),
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getSpacing(2),
    position: 'relative',
    zIndex: 1,
  },
  iconCircle: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getSpacing(2),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  callIconCircle: {
    backgroundColor: '#E3F2FD',
  },
  whatsappIconCircle: {
    backgroundColor: '#E8F5E9',
  },
  iconCircleInner: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: moderateScale(15),
    fontFamily: getFontFamily('700'),
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('400'),
    lineHeight: moderateScale(20),
  },
  chevronContainer: {
    marginLeft: getSpacing(1),
  },
});

export default CourseDetailsScreen;

