import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import ResponsiveView from '../components/ResponsiveView';
import GradientBackground from '../components/GradientBackground';
import CourseCard from '../components/CourseCard';
import { useUserCourses } from '../hooks/queries/useUserCourses';
import { Images } from '../assets/images';

const MyCourseScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user's purchased courses
  const { data: coursesData, isLoading, refetch } = useUserCourses({
    enabled: true,
  });

  useFocusEffect(
    useCallback(() => {
      // Refresh courses when screen is focused
      refetch();
    }, [refetch])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      if (__DEV__) {
        console.error('Refresh failed:', error);
      }
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Transform API courses data to match CourseCard expected format
  const transformedCourses = React.useMemo(() => {
    if (!coursesData || !Array.isArray(coursesData) || coursesData.length === 0) {
      return [];
    }

    return coursesData.map((course: any) => {
      // Calculate discount percentage
      const originalPrice = course.strikeoutPrice || course.coursePrice || course.originalPrice || 0;
      const currentPrice = course.coursePrice || course.currentPrice || 0;
      const discount = originalPrice > currentPrice
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

      return {
        id: course._id || course.id,
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
        gradientColors: ['#FFFACD', '#FFE4B5'] as [string, string],
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
        <ResponsiveView padding={2}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.text,
                fontSize: moderateScale(24),
                fontFamily: theme.typography.h1.fontFamily,
              },
            ]}
          >
            My Courses
          </Text>

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
