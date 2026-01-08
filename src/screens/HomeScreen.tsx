import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCourses } from '../hooks/queries/useCourses';
import { useTeachers } from '../hooks/queries/useTeachers';
import { useBanners } from '../hooks/queries/useBanners';
import { useStickyBanners } from '../hooks/queries/useStickyBanners';
import { useUserDetails } from '../hooks/queries/useUserDetails';
import { fetchClasses } from '../services/api';
import { useLoaderStore } from '../store/loaderStore';
import { useUIStore } from '../store';
import { Images } from '../assets/images';

import GradientBackground from '../components/GradientBackground';
import HomeHeader from '../components/Home/HomeHeader';
import ImageBanner from '../components/ImageBanner';
import BannerSlider from '../components/BannerSlider';
import CategoryTabs from '../components/CategoryTabs';
import ResponsiveView from '../components/ResponsiveView';
import CourseSection from '../components/Home/CourseSection';
import TeachersSection from '../components/Home/TeachersSection';
import Drawer from '../components/Drawer';
import ToppersSection from '../components/Home/ToppersSection';
import { CourseCardSkeleton, TeacherCardSkeleton, BannerSkeleton } from '../components/Skeletons';

const HomeScreen: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { forceHide } = useLoaderStore();

  // State variables
  const [categoryId, setCategoryId] = useState<string | number | null>(null);
  const [classes, setClasses] = useState<Array<{ label: string; value: string | number }>>([]);
  const { setDrawerOpen } = useUIStore();

  // Animation values for smooth fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch user details using React Query
  const { data: userData, refetch: refetchUserDetails } = useUserDetails({
    enabled: true,
  });

  // Fetch sticky banners data using custom hook
  const { data: stickyBannersData, isLoading: isLoadingStickyBanners, refetch: refetchStickyBanners } = useStickyBanners({
    enabled: true,
  });

  // Fetch banners data (for slider) using custom hook
  const { data: bannersData, isLoading: isLoadingBanners, refetch: refetchBanners } = useBanners({
    enabled: true,
  });

  // Fetch teachers data
  const { data: teachersData, isLoading: isLoadingTeachers, refetch: refetchTeachers } = useTeachers({
    enabled: true,
  });

  // Fetch courses data
  const { data: coursesData, isLoading: isLoadingCourses, refetch: refetchCourses } = useCourses({
    categoryId: categoryId || null,
    enabled: true,
  });

  const [refreshing, setRefreshing] = useState(false);

  // Check if initial loading is complete - only show skeletons if ALL data is loading
  const isInitialLoading = isLoadingStickyBanners || isLoadingBanners || isLoadingTeachers || isLoadingCourses;
  
  // Track if we have any data loaded to prevent showing skeletons when data exists
  const hasAnyData = useMemo(() => {
    return (
      (stickyBannersData && stickyBannersData.length > 0) ||
      (bannersData && bannersData.length > 0) ||
      (teachersData && teachersData.length > 0) ||
      (coursesData && coursesData.length > 0)
    );
  }, [stickyBannersData, bannersData, teachersData, coursesData]);

  // Animate content fade-in when data loads
  useEffect(() => {
    if (!isInitialLoading && isInitialLoad) {
      setIsInitialLoad(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [isInitialLoading, isInitialLoad, fadeAnim]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchUserDetails(),
        refetchTeachers(),
        refetchCourses(),
        refetchStickyBanners(),
        refetchBanners(),
        fetchClasses(),
      ]);

      const classesData = await fetchClasses();
      if (Array.isArray(classesData)) {
        const formattedClasses = classesData.map((item: any) => ({
          label: item?.name || '',
          value: item?._id || item?.id || '',
        })).filter((item: any) => item.value);
        setClasses(formattedClasses);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Refresh failed:', error);
      }
    } finally {
      setRefreshing(false);
    }
  }, [refetchUserDetails, refetchTeachers, refetchCourses, refetchStickyBanners, refetchBanners]);

  const fullData = useMemo(() => ({
    slider: [],
    batches: [],
    live_class: [],
    onlineTest: [],
  }), []);

  // Transform API courses data to match CourseCard expected format
  const transformedCourses = useMemo(() => {
    if (!coursesData || !Array.isArray(coursesData) || coursesData.length === 0) {
      return [];
    }

    const transformed = coursesData
      .filter((course: any) => course && (course._id || course.id))
      .map((course: any) => {
        // Get selected package (default or first package)
        const selectedPackage = course?.packages?.find((pkg: any) => pkg.isDefault === true)
          || course?.packages?.[0]
          || null;

        // Get pricing from package or fallback to course data
        const packagePrice = selectedPackage?.price || 0;
        const originalPrice = course.strikeoutPrice || course.coursePrice || 0;
        const currentPrice = packagePrice > 0 ? packagePrice : (course.coursePrice || 0);

        // Calculate discount
        const discount = originalPrice > currentPrice && originalPrice > 0
          ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
          : 0;

        let courseFeatures = {};
        if (course.courseFeatures) {
          try {
            courseFeatures = typeof course.courseFeatures === 'string'
              ? JSON.parse(course.courseFeatures)
              : course.courseFeatures;
          } catch (e) {
            if (__DEV__) {
              console.warn('Error parsing courseFeatures:', e);
            }
          }
        }

        return {
          id: course._id || course.id,
          _id: course._id,
          name: course.name,
          title: course.name || 'Course',
          subtitle: course.courseDescription || '',
          medium: course.class?.name || 'All Classes',
          board: course.stateBoardId ? 'State Board' : 'CBSE',
          targetAudience: course.class?.name || 'All Students',
          originalPrice: originalPrice,
          currentPrice: currentPrice,
          discount: discount,
          startDate: course.batchInfo?.startDate || course.createdAt || new Date().toISOString(),
          endDate: course.batchInfo?.endDate || course.updatedAt || new Date().toISOString(),
          batchType: course.courseType?.name || 'Regular',
          bannerImage: course.courseImage ? { uri: course.courseImage } : Images.TB_LOGO,
          courseImage: course.courseImage,
          gradientColors: ['#FFFACD', '#FFE4B5'] as [string, string],
          packages: course.packages || [], // Include packages array for CourseSection
          strikeoutPrice: course.strikeoutPrice, // Include for CourseSection
          coursePrice: course.coursePrice, // Include for fallback
          purchased: course.purchased || false, // Include purchased status
          _raw: course,
        };
      });

    return transformed;
  }, [coursesData]);

  // Memoize banners data transformation
  const transformedBanners = useMemo(() => {
    if (!bannersData || !Array.isArray(bannersData)) return [] as Array<{
      id: string | number | undefined;
      image: string;
      action: string;
      category_id: number;
      status: number;
      sorting_params: number;
    }>;
    return bannersData.map((banner: any) => ({
      id: banner?._id || banner?.id,
      image: banner?.mediaUrl || banner?.image || '',
      action: banner?.link || banner?.action || '',
      category_id: 0,
      status: 1,
      sorting_params: 1,
    }));
  }, [bannersData]);

  // Memoize sticky banner
  const stickyBanner = useMemo(() => {
    if (stickyBannersData && Array.isArray(stickyBannersData) && stickyBannersData.length > 0 && stickyBannersData[0]) {
      return stickyBannersData[0];
    }
    return null;
  }, [stickyBannersData]);

  // Memoize HomeHeader props to prevent unnecessary re-renders
  const homeHeaderProps = useMemo(() => ({
    theme,
    setDrawerOpen,
    classes,
    categoryId,
    boardName: userData?.stateBoard?.name,
    className: userData?.class?.name,
    logo: userData?.stateBoard?.logo,
  }), [theme, setDrawerOpen, classes, categoryId, userData?.stateBoard?.name, userData?.class?.name, userData?.stateBoard?.logo]);

  // Update categoryId when userData changes
  useEffect(() => {
    if (userData) {
      const classId = userData.class?._id || userData.classId || null;
      setCategoryId(classId);
    }
  }, [userData]);

  useFocusEffect(
    useCallback(() => {
      // Refetch user details when screen comes into focus
      refetchUserDetails();

      const cleanupTimer = setTimeout(() => {
        const { isVisible, loadingCount } = useLoaderStore.getState();
        if (isVisible && loadingCount === 0) {
          forceHide();
        }
      }, 2000);

      return () => {
        clearTimeout(cleanupTimer);
      };
    }, [refetchUserDetails, forceHide])
  );

  // Load classes on mount
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const classesData = await fetchClasses();
        if (Array.isArray(classesData)) {
          const formattedClasses = classesData.map((item: any) => ({
            label: item?.name || '',
            value: item?._id || item?.id || '',
          })).filter((item: any) => item.value);
          setClasses(formattedClasses);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error loading classes:', error);
        }
      }
    };

    loadClasses();
  }, []);

  // Save sticky banner data to AsyncStorage
  useEffect(() => {
    if (stickyBannersData) {
      AsyncStorage.setItem('stickyBanners', JSON.stringify(stickyBannersData)).catch(err =>
        __DEV__ && console.error('Failed to save sticky banners to storage:', err)
      );
    }
  }, [stickyBannersData]);

  // Render skeleton loaders during initial load - only show if no data exists
  const renderSkeletons = () => {
    // Don't show skeletons if we already have data
    if (hasAnyData) {
      return null;
    }

    return (
      <View>
        {/* Banner skeleton - match actual banner height */}
        {isLoadingStickyBanners && (
          <View style={styles.bannerSkeletonWrapper}>
            <BannerSkeleton />
          </View>
        )}
        
        {/* Banner slider skeleton - match actual slider height */}
        {isLoadingBanners && (
          <View style={styles.bannerSkeletonWrapper}>
            <BannerSkeleton />
          </View>
        )}

        {/* Category tabs - always show */}
        <ResponsiveView padding={2}>
          <CategoryTabs />
        </ResponsiveView>

        {/* Courses skeleton - match CourseSection layout */}
        {isLoadingCourses && (
          <View style={styles.skeletonContainer}>
            <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.border }]} />
            <View style={styles.courseSkeletonWrapper}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={styles.skeletonCard}>
                  <CourseCardSkeleton />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Teachers skeleton - match TeachersSection layout */}
        {isLoadingTeachers && (
          <View style={styles.skeletonContainer}>
            <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.border }]} />
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={styles.skeletonScroll}
            >
              {[1, 2, 3, 4].map((i) => (
                <TeacherCardSkeleton key={i} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Toppers section skeleton placeholder */}
        <View style={styles.skeletonContainer}>
          <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.border, width: moderateScale(120) }]} />
        </View>
      </View>
    );
  };

  return (
    <GradientBackground>
      <View style={styles.contentWrapper}>
        <HomeHeader {...homeHeaderProps} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.accent]}
              tintColor={theme.colors.accent}
            />
          }
        >
          {isInitialLoading && !hasAnyData ? (
            renderSkeletons()
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              {/* Show banner even if loading, but with skeleton if no data */}
              {isLoadingStickyBanners && !stickyBanner ? (
                <View style={styles.bannerSkeletonWrapper}>
                  <BannerSkeleton />
                </View>
              ) : stickyBanner ? (
                <ImageBanner
                  key={stickyBanner?._id || 'sticky-banner'}
                  imageUrl={stickyBanner?.image}
                  onPress={() => {
                    if (stickyBanner?.link) {
                      // Handle banner link
                    }
                  }}
                />
              ) : (
                <ImageBanner imageSource={Images.TB_LOGO} />
              )}

              {/* Show banner slider skeleton if loading, otherwise show actual slider */}
              {isLoadingBanners && transformedBanners.length === 0 ? (
                <View style={styles.bannerSkeletonWrapper}>
                  <BannerSkeleton />
                </View>
              ) : transformedBanners.length > 0 ? (
                <BannerSlider
                  data={transformedBanners}
                  categoryId={categoryId}
                  full_data={fullData}
                  autoPlay={transformedBanners.length > 1}
                  autoPlayInterval={3000}
                />
              ) : null}

              <ResponsiveView padding={2}>
                <CategoryTabs />
              </ResponsiveView>

              {/* Show course skeleton if loading, otherwise show courses */}
              {isLoadingCourses && transformedCourses.length === 0 ? (
                <View style={styles.skeletonContainer}>
                  <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.border }]} />
                  <View style={styles.courseSkeletonWrapper}>
                    {[1, 2, 3].map((i) => (
                      <View key={i} style={styles.skeletonCard}>
                        <CourseCardSkeleton />
                      </View>
                    ))}
                  </View>
                </View>
              ) : transformedCourses.length > 0 ? (
                <CourseSection courses={transformedCourses} theme={theme} />
              ) : null}

              {/* Show teachers skeleton if loading, otherwise show teachers */}
              {(() => {
                const hasTeachers = Array.isArray(teachersData) && teachersData.length > 0;
                if (isLoadingTeachers && !hasTeachers) {
                  return (
                    <View style={styles.skeletonContainer}>
                      <View style={[styles.skeletonTitle, { backgroundColor: theme.colors.border }]} />
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        contentContainerStyle={styles.skeletonScroll}
                      >
                        {[1, 2, 3, 4].map((i) => (
                          <TeacherCardSkeleton key={i} />
                        ))}
                      </ScrollView>
                    </View>
                  );
                }
                if (hasTeachers) {
                  return <TeachersSection theme={theme} teachers={teachersData} />;
                }
                return null;
              })()}

              <ToppersSection theme={theme} />
            </Animated.View>
          )}
        </ScrollView>

        <Drawer />
      </View>
    </GradientBackground>
  );
});

HomeScreen.displayName = 'HomeScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  contentWrapper: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: moderateScale(100),
  },
  skeletonContainer: {
    marginVertical: getSpacing(2),
  },
  skeletonTitle: {
    height: moderateScale(20),
    width: moderateScale(150),
    borderRadius: moderateScale(4),
    marginLeft: getSpacing(2),
    marginBottom: getSpacing(1),
  },
  skeletonScroll: {
    paddingHorizontal: getSpacing(2),
  },
  skeletonCard: {
    marginRight: getSpacing(2),
  },
  bannerSkeletonWrapper: {
    marginBottom: getSpacing(1),
  },
  courseSkeletonWrapper: {
    flexDirection: 'row',
    paddingHorizontal: getSpacing(2),
    gap: getSpacing(2),
  },
});

export default HomeScreen;
