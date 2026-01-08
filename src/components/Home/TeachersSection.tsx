import React, { memo, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import TeacherCard from '../TeacherCard';
import ResponsiveView from '../ResponsiveView';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { getFontFamily } from '../../utils/fonts';
import { Theme } from '../../theme/theme';

interface TeachersSectionProps {
    theme: Theme;
    teachers: any[];
    title?: string;
    hideTitle?: boolean;
}

const TeachersSection = memo(({ theme, teachers, title, hideTitle }: TeachersSectionProps) => {
    const navigation = useNavigation<any>();

    const renderItem = useCallback(({ item, index }: { item: any, index: number }) => {
        if (!item) return null;

        const gradients = [
            ['#FFF9C4', '#FFE082'],
            ['#FFFFFF', '#F0F8FF'],
            ['#E8F5E9', '#C8E6C9'],
            ['#FCE4EC', '#F8BBD0'],
            ['#E1F5FE', '#B3E5FC']
        ];
        const gradientColors = item?.gradientColors || gradients[index % gradients.length];

        const teacherId = item?._id || item?.id;
        if (!teacherId) return null;

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                    navigation.navigate('TeacherDetails', { teacherId });
                }}
            >
                <TeacherCard
                    name={item?.name || 'Teacher'}
                    expertise={item?.description || "Subject Expert"}
                    experience={item?.experience || "Experienced"}
                    rating={item?.rating || 5}
                    isVerified={true}
                    gradientColors={gradientColors}
                    imageUrl={item?.image}
                />
            </TouchableOpacity>
        );
    }, [navigation]);

    if (!teachers || teachers.length === 0) {
        return null;
    }

    return (
        <ResponsiveView padding={2}>
            <View style={styles.teachersSection}>
                {!hideTitle && (
                    <Text
                        style={[
                            styles.teachersSectionTitle,
                            {
                                color: theme.colors.text,
                                fontSize: moderateScale(20),
                                fontWeight: '800',
                                marginBottom: getSpacing(2),
                            },
                        ]}
                    >
                        {title || 'Top Teachers'}
                    </Text>
                )}
                <FlatList
                    data={teachers}
                    renderItem={renderItem}
                    keyExtractor={(item, index) => {
                        if (!item) return `teacher-${index}`;
                        return item._id?.toString() || item.id?.toString() || `teacher-${index}`;
                    }}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.teachersScrollContent}
                />
            </View>
        </ResponsiveView>
    );
});

const styles = StyleSheet.create({
    teachersSection: {},
    teachersSectionTitle: {
        fontWeight: '800',
        fontFamily: getFontFamily('200'),
    },
    teachersScrollContent: {
        paddingRight: getSpacing(2),
    },
});

export default TeachersSection;


