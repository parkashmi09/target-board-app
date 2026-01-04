import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCourses } from '../hooks/queries/useCourses';
import { useSliders } from '../hooks/queries/useSliders';
import { useTeachers } from '../hooks/queries/useTeachers';
import { useBanners } from '../hooks/queries/useBanners';
import { useStickyBanners } from '../hooks/queries/useStickyBanners';
import { fetchClasses } from '../services/api';
import { useLoaderStore } from '../store/loaderStore';
import { useUIStore } from '../store';
import { Images } from '../assets/images';

// Import components (we'll create simplified versions)
import GradientBackground from '../components/GradientBackground';
import HomeHeader from '../components/Home/HomeHeader';
import ImageBanner from '../components/ImageBanner';
import BannerSlider from '../components/BannerSlider';
import CategoryTabs from '../components/CategoryTabs';
import ResponsiveView from '../components/ResponsiveView';
import CourseSection from '../components/Home/CourseSection';
import TeachersSection from '../components/Home/TeachersSection';
import ToppersSection from '../components/Home/ToppersSection';
import Drawer from '../components/Drawer';

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { forceHide } = useLoaderStore();

  // State variables
  const [categoryId, setCategoryId] = useState<string | number | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [classes, setClasses] = useState<Array<{ label: string; value: string | number }>>([]);
  const { setDrawerOpen } = useUIStore();

  // Fetch sticky banners data using custom hook
  const { data: stickyBannersData, isLoading: isLoadingStickyBanners, refetch: refetchStickyBanners } = useStickyBanners({
    enabled: true,
  });

  // Fetch banners data (for slider) using custom hook
  const { data: bannersData, isLoading: isLoadingBanners, refetch: refetchBanners } = useBanners({
    enabled: true,
  });

  // Fetch slider data using custom hook
  const { data: sliderData, isLoading: isLoadingSliders, refetch: refetchSliders } = useSliders({
    categoryId: categoryId || null,
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        // refetchSliders(),
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
  }, [refetchSliders, refetchTeachers, refetchCourses, refetchStickyBanners, refetchBanners]);

  const fullData = React.useMemo(() => ({
    slider: [],
    batches: [],
    live_class: [],
    onlineTest: [],
  }), []);

  // Transform API courses data to match CourseCard expected format
  const transformedCourses = React.useMemo(() => {
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
          _raw: course,
        };
      });

    return transformed;
  }, [coursesData]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          const userDataString = await AsyncStorage.getItem('userData');
          if (userDataString) {
            const userData = JSON.parse(userDataString);
            setUserData(userData);
            setCategoryId(userData?.class_id || userData?.classId || null);
          }
        } catch (error) {
          if (__DEV__) {
            console.error('Error reloading user data:', error);
          }
        }
      };
      loadData();

      const cleanupTimer = setTimeout(() => {
        const { isVisible, loadingCount } = useLoaderStore.getState();
        if (isVisible && loadingCount === 0) {
          forceHide();
        }
      }, 2000);

      return () => {
        clearTimeout(cleanupTimer);
      };
    }, [forceHide])
  );

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUserData(userData);
          setCategoryId(userData?.class_id || userData?.classId || null);
        }

        const classesData = await fetchClasses();
        if (Array.isArray(classesData)) {
          const formattedClasses = classesData.map((item: any) => ({
            label: item?.name || '',
            value: item?._id || item?.id || '',
          })).filter((item: any) => item.value);
          setClasses(formattedClasses);
        }
      } catch (error) {
        // Silent error handling
      }
    };

    loadInitialData();
  }, []);

  // Save sticky banner data to AsyncStorage
  useEffect(() => {
    if (stickyBannersData) {
      AsyncStorage.setItem('stickyBanners', JSON.stringify(stickyBannersData)).catch(err =>
        __DEV__ && console.error('Failed to save sticky banners to storage:', err)
      );
    }
  }, [stickyBannersData]);

  return (
    <GradientBackground>
      <View style={styles.contentWrapper}>
        <HomeHeader
          theme={theme}
          setDrawerOpen={setDrawerOpen}
          classes={classes}
          categoryId={categoryId}
          boardName={userData?.stateBoard?.name}
          className={userData?.class?.name}
          logo={userData?.stateBoard?.logo}
        />

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
          {stickyBannersData && Array.isArray(stickyBannersData) && stickyBannersData.length > 0 && stickyBannersData[0] ? (
            <ImageBanner
              key={stickyBannersData[0]?._id || 'sticky-banner'}
              imageUrl={stickyBannersData[0]?.image}
              onPress={() => {
                if (stickyBannersData[0]?.link) {
                  // Handle banner link
                }
              }}
            />
          ) : (
            <ImageBanner imageSource={Images.TB_LOGO} />
          )}

          <BannerSlider
            data={Array.isArray(bannersData) ? bannersData.map((banner: any) => ({
              id: banner?._id || banner?.id,
              image: banner?.mediaUrl || banner?.image || '',
              action: banner?.link || banner?.action || '',
              category_id: 0,
              status: 1,
              sorting_params: 1,
            })) : []}
            categoryId={categoryId}
            full_data={fullData}
            autoPlay={true}
            autoPlayInterval={3000}
          />

          <ResponsiveView padding={2}>
            <CategoryTabs />
          </ResponsiveView>

          <CourseSection courses={transformedCourses} theme={theme} />
          <TeachersSection theme={theme} teachers={teachersData || []} />
          <ToppersSection theme={theme} />
        </ScrollView>

        <Drawer />
      </View>
    </GradientBackground>
  );
};

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
});

export default HomeScreen;
