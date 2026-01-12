import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../theme/theme';
import { getFontFamily } from '../utils/fonts';
import { ArrowLeft, Share2, Check } from 'lucide-react-native';
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
    marginBottom: 20,
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
});

export default CourseDetailsScreen;

