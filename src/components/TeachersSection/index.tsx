import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/theme';
import CourseTeacherCard from '../CourseTeacherCard';

interface TeachersSectionProps {
    teachers: any[];
    onTeacherPress: (teacherId: string) => void;
}

const TeachersSection: React.FC<TeachersSectionProps> = React.memo(({ teachers, onTeacherPress }) => {
    const theme = useTheme();

    const gradients = [
        ['#FFF9C4', '#FFE082'],
        ['#FFFFFF', '#F0F8FF'],
        ['#E8F5E9', '#C8E6C9'],
        ['#FCE4EC', '#F8BBD0'],
        ['#E1F5FE', '#B3E5FC']
    ];

    if (!teachers || teachers.length === 0) {
        return (
            <View style={styles.notAvailableContainer}>
                <Text style={[styles.notAvailableText, { color: theme.colors.textSecondary }]}>
                    Teachers information not available
                </Text>
            </View>
        );
    }

    return (
        <>
            <View style={styles.headerWrapper}>
                <View style={[styles.headerPill, { backgroundColor: theme.isDark ? 'rgba(179, 157, 219, 0.3)' : '#B39DDB' }]}>
                    <Text style={[styles.headerPillText, { color: theme.colors.text }]}>इस बैच के शिक्षक</Text>
                </View>
            </View>
            <View style={styles.grid}>
                {teachers.map((teacher, index) => {
                    const gradientColors = gradients[index % gradients.length] as [string, string];
                    return (
                        <View key={teacher._id || teacher.id || index} style={styles.cardWrapper}>
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => onTeacherPress(teacher._id || teacher.id)}
                            >
                                <CourseTeacherCard
                                    name={teacher.name}
                                    expertise={teacher.description || teacher.subject || "Subject Expert"}
                                    experience={String(teacher.experience || "5")}
                                    rating={teacher.rating || 5}
                                    isVerified={true}
                                    gradientColors={gradientColors}
                                    imageUrl={teacher.image}
                                />
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>
        </>
    );
});

TeachersSection.displayName = 'TeachersSection';

const styles = StyleSheet.create({
    headerWrapper: {
        alignItems: 'center',
        marginBottom: 16,
    },
    headerPill: {
        paddingHorizontal: 32,
        paddingVertical: 10,
        borderRadius: 24,
        elevation: 1,
    },
    headerPillText: {
        fontSize: 16,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    cardWrapper: {
        width: '48%',
        marginBottom: 16,
    },
    notAvailableContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(128, 128, 128, 0.1)',
        borderRadius: 8,
        marginTop: 8,
    },
    notAvailableText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
});

export default TeachersSection;

