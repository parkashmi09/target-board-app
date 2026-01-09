import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import ResponsiveView from '../components/ResponsiveView';
import GradientBackground from '../components/GradientBackground';
import CourseCard from '../components/CourseCard';
import { useCourses } from '../hooks/queries/useCourses';
import { useUserDetails } from '../hooks/queries/useUserDetails';
import { Images } from '../assets/images';
import ScreenHeader from '../components/ScreenHeader';

const MyCourseScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [refreshing, setRefreshing] = useState(false);
  const [categoryId, setCategoryId] = useState<string | number | null>(null);

  // Fetch user details using React Query (same as HomeScreen)
  const { data: userData, refetch: refetchUserDetails } = useUserDetails({
    enabled: true,
  });

  // Fetch courses using the same API as HomeScreen
  const { data: coursesData, isLoading, refetch } = useCourses({
    categoryId: categoryId || null,
    enabled: true,
  });

  // Update categoryId when userData changes (same as HomeScreen)
  useEffect(() => {
    if (userData) {
      const classId = userData.class?._id || userData.classId || null;
      setCategoryId(classId);
    }
  }, [userData]);

  useFocusEffect(
    useCallback(() => {
      // Refetch user details and courses when screen is focused
      refetchUserDetails();
      refetch();
    }, [refetchUserDetails, refetch])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchUserDetails(),
        refetch(),
      ]);
    } catch (error) {
      if (__DEV__) {
        console.error('Refresh failed:', error);
      }
    } finally {
      setRefreshing(false);
    }
  }, [refetchUserDetails, refetch]);

  // Transform API courses data to match CourseCard expected format
  const transformedCourses = React.useMemo(() => {
    if (!coursesData || !Array.isArray(coursesData) || coursesData.length === 0) {
      return [];
    }

    return coursesData.map((course: any) => {
      // Get selected package (default or first package)
      const selectedPackage = course?.packages?.find((pkg: any) => pkg.isDefault === true) 
        || course?.packages?.[0] 
        || null;
      
      // Get pricing from package or fallback to course data
      const packagePrice = selectedPackage?.price || 0;
      const originalPrice = course.strikeoutPrice || course.coursePrice || course.originalPrice || 0;
      const currentPrice = packagePrice > 0 ? packagePrice : (course.coursePrice || course.currentPrice || 0);
      
      // Calculate discount
      const discount = originalPrice > currentPrice && originalPrice > 0
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

      return {
        id: course._id || course.id,
        _id: course._id,
        name: course.name,
        title: course.name || course.title || 'Course',
        subtitle: course.courseDescription || course.description || '',
        medium: course.class?.name || course.medium || 'All Classes',
        board: course.stateBoardId ? 'State Board' : 'CBSE',
        targetAudience: course.class?.name || course.targetAudience || 'All Students',
        originalPrice: originalPrice,
        currentPrice: currentPrice,
        discount: discount,
        startDate: course.batchInfo?.startDate || course.createdAt || new Date().toISOString(),
        endDate: course.batchInfo?.endDate || course.updatedAt || new Date().toISOString(),
        batchType: course.courseType?.name || course.batchType || 'Regular',
        bannerImage: course.courseImage ? { uri: course.courseImage } : Images.TB_LOGO,
        courseImage: course.courseImage,
        gradientColors: ['#FFFACD', '#FFE4B5'] as [string, string],
        packages: course.packages || [], // Include packages array
        strikeoutPrice: course.strikeoutPrice, // Include for fallback
        coursePrice: course.coursePrice, // Include for fallback
        purchased: course.purchased || false, // Include purchased status (same as HomeScreen)
        _raw: course,
      };
    });
  }, [coursesData]);

  const handlePress = useCallback((courseId: string) => {
    navigation.navigate('CourseDetails', { courseId });
  }, [navigation]);

  return (
    <GradientBackground>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.accent]}
            tintColor={theme.colors.accent}
          />
        }
      >
        <ScreenHeader showSearch={false} title="Courses Available" />
        <ResponsiveView padding={2}>
      

          {isLoading && !refreshing ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.coursesContainer}>
              {transformedCourses.length > 0 ? (
                transformedCourses.map((item) => (
                  <CourseCard
                    key={item.id}
                    title={item.title}
                    subtitle={item.subtitle}
                    medium={item.medium}
                    board={item.board}
                    targetAudience={item.targetAudience}
                    originalPrice={item.originalPrice}
                    currentPrice={item.currentPrice}
                    discount={item.discount}
                    startDate={item.startDate}
                    endDate={item.endDate}
                    batchType={item.batchType}
                    bannerImage={item.bannerImage}
                    gradientColors={item.gradientColors}
                    courseId={item.id}
                    purchased={item.purchased}
                    packages={item.packages}
                    onPress={() => handlePress(item.id)}
                    onExplore={() => handlePress(item.id)}
                    // onBuyNow is handled internally by CourseCard to open the modal
                  />
                ))
              ) : (
                <Text
                  style={[
                    styles.subtitle,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: moderateScale(16),
                      fontFamily: theme.typography.body.fontFamily,
                      textAlign: 'center',
                      marginTop: 20,
                    },
                  ]}
                >
                  No courses available at the moment.
                </Text>
              )}
            </View>
          )}
        </ResponsiveView>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: getSpacing(2),
    paddingBottom: moderateScale(100), // Add padding for tab bar
  },
  title: {
    fontWeight: 'bold',
    marginBottom: getSpacing(2),
  },
  subtitle: {
    marginTop: getSpacing(1),
  },
  coursesContainer: {
    gap: getSpacing(2),
  },
});

export default MyCourseScreen;
