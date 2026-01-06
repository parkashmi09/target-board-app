import React, { memo, useCallback } from 'react';
import { View, Text, FlatList, Dimensions, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CourseCard from '../CourseCard';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { Theme } from '../../theme/theme';

interface CourseSectionProps {
    courses: any[];
    theme: Theme;
}

const CourseSection = memo(({ courses, theme }: CourseSectionProps) => {
    const navigation = useNavigation<any>();

    console.log('courses###', courses);

    const renderItem = useCallback(({ item }: { item: any }) => {
        if (!item) return null;

        // Get selected package (default or first package)
        const selectedPackage = item?.packages?.find((pkg: any) => pkg.isDefault === true)
            || item?.packages?.[0]
            || null;

        // Get pricing from package or fallback to course data
        const packagePrice = selectedPackage?.price || 0;
        const originalPrice = item?.strikeoutPrice || item?.originalPrice || 0;
        const currentPrice = packagePrice > 0 ? packagePrice : (item?.coursePrice || item?.currentPrice || 0);

        // Calculate discount
        const discount = originalPrice > currentPrice && originalPrice > 0
            ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
            : 0;

        const handlePress = () => {
            if (item?.id || item?._id) {
                navigation.navigate('CourseDetails', {
                    courseId: String(item.id || item._id),
                });
            }
        };

        const handleBuyNow = () => {
            if (item?.id || item?._id) {
                navigation.navigate('CourseDetails', {
                    courseId: String(item.id || item._id),
                    openPurchaseModal: true,
                });
            }
        };

        return (
            <View style={styles.courseCardWrapper}>
                <CourseCard
                    title={item?.name || item?.title || 'Course'}
                    subtitle={item?.subtitle || ''}
                    medium={item?.medium || ''}
                    board={item?.board || ''}
                    targetAudience={item?.targetAudience || ''}
                    originalPrice={originalPrice}
                    currentPrice={currentPrice}
                    discount={discount}
                    startDate={item?.startDate}
                    endDate={item?.endDate}
                    batchType={item?.batchType || ''}
                    bannerImage={item?.bannerImage || item?.courseImage}
                    gradientColors={item?.gradientColors || ['#FFFACD', '#FFE4B5']}
                    courseId={item?.id || item?._id}
                    packages={item?.packages}
                    onExplore={handlePress}
                    onBuyNow={handleBuyNow}
                />
            </View>
        );
    }, [navigation]);

    return (
        <View style={styles.courseSectionContainer}>
            <View style={[styles.courseSection, { paddingHorizontal: getSpacing(2) }]}>
                <Text
                    style={[
                        styles.courseSectionTitle,
                        {
                            color: theme.colors.text,
                            fontSize: moderateScale(18),
                            fontWeight: '700',
                            marginBottom: getSpacing(2),
                        },
                    ]}
                >
                    COURSE
                </Text>
                {courses && Array.isArray(courses) && courses.length > 0 ? (
                    <FlatList
                        data={courses}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => {
                            if (!item) return `course-${index}`;
                            return item.id?.toString() || item._id?.toString() || `course-${index}`;
                        }}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.courseScrollContent}
                        decelerationRate="fast"
                        snapToInterval={Dimensions.get('window').width - (getSpacing(2) * 2) + moderateScale(12)}
                    />
                ) : null}
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    courseSectionContainer: {
        marginVertical: getSpacing(2),
    },
    courseSection: {
        marginTop: getSpacing(1),
    },
    courseSectionTitle: {
        fontWeight: '700',
    },
    courseScrollContent: {
        alignItems: 'center',
    },
    courseCardWrapper: {
        width: Dimensions.get('window').width - (getSpacing(2) * 2),
        paddingRight: moderateScale(12),
    },
});

export default CourseSection;


