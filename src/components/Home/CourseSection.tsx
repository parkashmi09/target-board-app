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

    const renderItem = useCallback(({ item }: { item: any }) => {
        if (!item) return null;

        const handlePress = () => {
            if (item?.id || item?._id) {
                navigation.navigate('CourseDetails', {
                    courseId: String(item.id || item._id),
                });
            }
        };

        return (
            <View style={styles.courseCardWrapper}>
                <CourseCard
                    title={item?.title || 'Course'}
                    subtitle={item?.subtitle || ''}
                    medium={item?.medium || ''}
                    board={item?.board || ''}
                    targetAudience={item?.targetAudience || ''}
                    originalPrice={item?.originalPrice || 0}
                    currentPrice={item?.currentPrice || 0}
                    discount={item?.discount || 0}
                    startDate={item?.startDate}
                    endDate={item?.endDate}
                    batchType={item?.batchType || ''}
                    bannerImage={item?.bannerImage}
                    gradientColors={item?.gradientColors || ['#FFFACD', '#FFE4B5']}
                    courseId={item?.id || item?._id}
                    onExplore={handlePress}
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


