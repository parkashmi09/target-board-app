import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import CourseDetailCard from '../components/CourseDetailCard';
import { useUserCourses } from '../hooks/queries/useUserCourses';
import { MainStackParamList } from '../navigation/MainStack';

type MyCourseScreenNavigationProp = NativeStackNavigationProp<MainStackParamList>;

const MyCourseScreen: React.FC = () => {
  const theme = useTheme();
  const { colors } = theme;
  const navigation = useNavigation<MyCourseScreenNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Transform API courses data - extract course from purchasedCourse structure
  const transformedCourses = React.useMemo(() => {
    if (!coursesData || !Array.isArray(coursesData) || coursesData.length === 0) {
      return [];
    }

    return coursesData.map((purchasedCourse: any) => {
      // Extract course data from nested structure
      const course = purchasedCourse.course || purchasedCourse;
      
      // Merge purchase info with course data
      return {
        ...course,
        _id: course._id || course.id,
        id: course._id || course.id,
        // Add purchase-specific fields
        purchasedAt: purchasedCourse.purchasedAt,
        expiryDate: purchasedCourse.expiryDate,
        status: purchasedCourse.status || 'active',
        packageId: purchasedCourse.packageId,
        // Use expiryDate for batchInfo.endDate if available
        batchInfo: {
          ...course.batchInfo,
          endDate: purchasedCourse.expiryDate || course.batchInfo?.endDate,
        },
      };
    });
  }, [coursesData]);

  // Filter courses based on search query
  const filteredCourses = React.useMemo(() => {
    if (!searchQuery.trim()) return transformedCourses;
    
    const query = searchQuery.toLowerCase();
    return transformedCourses.filter((course: any) => {
      const name = course?.name || course?.title || '';
      const description = course?.courseDescription || course?.description || '';
      return (
        name.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query)
      );
    });
  }, [transformedCourses, searchQuery]);

  const handleSearch = useCallback((searchText: string) => {
    setSearchQuery(searchText.trim());
  }, []);

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

  const handleWhatsAppPress = useCallback(() => {
    const phoneNumber = '8114532021';
    const message = 'Hello, I am interested in your courses.';
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      // Fallback to web WhatsApp if app is not installed
      Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
    });
  }, []);

  const handleDetailsPress = useCallback((courseId: string) => {
    // Navigation handled by CourseDetailCard component
  }, []);

  const handleContentPress = useCallback((courseId: string, courseName?: string) => {
    // Navigate to CourseDetails for now - can be updated when Categories screen is added
    navigation.navigate('CourseDetails', { courseId });
  }, [navigation]);

  const renderCourseCard = useCallback(({ item }: { item: any }) => (
    <CourseDetailCard
      course={item}
      onWhatsAppPress={handleWhatsAppPress}
      onDetailsPress={() => handleDetailsPress(item._id || item.id)}
      onContentPress={() => handleContentPress(item._id || item.id, item.name)}
    />
  ), [handleWhatsAppPress, handleDetailsPress, handleContentPress]);

  return (
    <GradientBackground>
      <ScreenHeader
        title="My Courses"
        placeholder="Search courses..."
        onSearch={handleSearch}
        defaultValue={searchQuery}
        showSearch={true}
      />
      {isLoading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading courses...
          </Text>
        </View>
      ) : filteredCourses && filteredCourses.length > 0 ? (
        <FlatList
          data={filteredCourses}
          renderItem={renderCourseCard}
          keyExtractor={(item) => item._id || item.id || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<View style={{ height: getSpacing(1) }} />}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        >
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery ? 'No courses found matching your search' : 'No courses available'}
          </Text>
        </ScrollView>
      )}
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: getSpacing(12),
  },
  listContent: {
    padding: getSpacing(2),
    marginTop: getSpacing(4),
    paddingBottom: getSpacing(18),
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(4),
  },
  loadingText: {
    marginTop: getSpacing(2),
    fontSize: moderateScale(14),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(4),
    minHeight: moderateScale(400),
    paddingBottom: getSpacing(4),
  },
  emptyText: {
    fontSize: moderateScale(16),
    textAlign: 'center',
  },
});

export default MyCourseScreen;
