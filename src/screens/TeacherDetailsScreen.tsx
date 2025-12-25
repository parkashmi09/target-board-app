import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import { Images } from '../assets/images';
import SVGIcon from '../components/SVGIcon';
import ResponsiveView from '../components/ResponsiveView';
import { useTeacherDetails } from '../hooks/queries/useTeachers';
import Video from 'react-native-video';
import TeacherCourseCard from '../components/TeacherCourseCard';
import GradientBackground from '../components/GradientBackground';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/HomeStack';

type TeacherDetailsRouteProp = RouteProp<HomeStackParamList, 'TeacherDetails'>;
type TeacherDetailsNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'TeacherDetails'>;

const TeacherDetailsScreen = () => {
    const theme = useTheme();
    const navigation = useNavigation<TeacherDetailsNavigationProp>();
    const route = useRoute<TeacherDetailsRouteProp>();
    const { teacherId } = route.params || {};
    const { data: teacher, isLoading, error } = useTeacherDetails(teacherId || '');
    // Teacher data loaded

    const screenWidth = Dimensions.get('window').width;

    // Validate required params
    if (!teacherId) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
                <Text style={{ color: theme.colors.error || 'red' }}>Missing teacher information</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={{ color: theme.colors.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (error || !teacher) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
                <Text style={{ color: theme.colors.error }}>Failed to load teacher details</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={{ color: theme.colors.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Static data for stats as per design
    const stats = [
        { label: 'Classes', value: '400+', type: 'Free' },
        { label: 'Study Material', value: '500+', type: 'Free' },
        { label: 'Automated Tests', value: '400+', type: 'Free' },
    ];

    return (
        <GradientBackground>
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <SVGIcon name="arrow-back" size={24} color={theme.colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.imageWrapper}>
                        <Image
                            source={teacher.image ? { uri: teacher.image } : Images.TEACHER}
                            style={styles.profileImage}
                            resizeMode="cover"
                        />
                    </View>
                    <Text style={[styles.name, { color: theme.colors.text }]}>{teacher.name}</Text>
                    <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                        {teacher.description}
                    </Text>
                </View>

                {/* Stats Section */}
                <View style={styles.statsContainer}>
                    {stats.map((stat, index) => (
                        <View key={index} style={[styles.statItem, index !== stats.length - 1 && styles.statBorder]}>
                            <View style={styles.statValueRow}>
                                <Text style={[styles.statValue, { color: theme.colors.text }]}>{stat.value}</Text>
                                <View style={styles.freeBadge}>
                                    <Text style={styles.freeBadgeText}>{stat.type}</Text>
                                </View>
                            </View>
                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Courses Section */}
                {teacher.courses && teacher.courses.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <SVGIcon name="play" size={20} color={theme.colors.text} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Courses</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coursesScroll}>
                            {teacher.courses.map((course: any) => (
                                <TouchableOpacity
                                    key={course._id}
                                    activeOpacity={0.9}
                                    onPress={() => {
                                        // @ts-ignore
                                        navigation.navigate('CourseDetails', { courseId: course._id });
                                    }}
                                >
                                    <TeacherCourseCard title={course.name} />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Video Section */}
                {teacher.video && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <SVGIcon name="play" size={20} color={theme.colors.text} />
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Demo Video</Text>
                        </View>
                        <View style={styles.videoContainer}>
                            <Video
                                source={{ uri: teacher.video }}
                                style={styles.video}
                                controls={true}
                                resizeMode="contain"
                                paused={true}
                            />
                        </View>
                    </View>
                )}
            </ScrollView>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
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
    header: {
        paddingHorizontal: getSpacing(2),
        paddingTop: getSpacing(2),
        paddingBottom: getSpacing(1),
    },
    headerButton: {
        padding: 4,
    },
    scrollContent: {
        paddingBottom: getSpacing(4),
    },
    profileSection: {
        alignItems: 'center',
        paddingHorizontal: getSpacing(3),
        marginBottom: getSpacing(3),
    },
    imageWrapper: {
        width: moderateScale(100),
        height: moderateScale(100),
        borderRadius: moderateScale(50),
        overflow: 'hidden',
        marginBottom: getSpacing(1.5),
        borderWidth: 2,
        borderColor: '#E3F2FD', // Light blue border
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    name: {
        fontSize: moderateScale(22),
        fontWeight: '800',
        marginBottom: getSpacing(1),
        textAlign: 'center',
    },
    description: {
        fontSize: moderateScale(14),
        textAlign: 'center',
        lineHeight: moderateScale(20),
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: getSpacing(2),
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#F0F0F0',
        marginBottom: getSpacing(3),
        marginHorizontal: getSpacing(2),
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statBorder: {
        borderRightWidth: 1,
        borderRightColor: '#E0E0E0',
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getSpacing(0.5),
    },
    statValue: {
        fontSize: moderateScale(16),
        fontWeight: '800',
        marginRight: 4,
    },
    freeBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    freeBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: moderateScale(12),
        fontWeight: '500',
    },
    section: {
        marginBottom: getSpacing(3),
        paddingHorizontal: getSpacing(2),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getSpacing(1.5),
    },
    sectionTitle: {
        fontSize: moderateScale(18),
        fontWeight: '700',
        marginLeft: getSpacing(1),
    },
    coursesScroll: {
        paddingRight: getSpacing(2),
    },
    videoContainer: {
        width: '100%',
        height: moderateScale(200),
        backgroundColor: '#000',
        borderRadius: moderateScale(12),
        overflow: 'hidden',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    backButton: {
        marginTop: getSpacing(2),
    },
});

export default TeacherDetailsScreen;

