import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Animated,
    Easing,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import { getFontFamily } from '../utils/fonts';
import { Images } from '../assets/images';
import SVGIcon from '../components/SVGIcon';
import { useTeacherDetails } from '../hooks/queries/useTeachers';
import Video from 'react-native-video';
import TeacherCourseCard from '../components/TeacherCourseCard';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/HomeStack';
import { Award, BookOpen, Play, Users, Star } from 'lucide-react-native';
import { Svg, Circle, Rect, Path, G, Defs, LinearGradient, Stop, Ellipse, Line } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

type TeacherDetailsRouteProp = RouteProp<HomeStackParamList, 'TeacherDetails'>;
type TeacherDetailsNavigationProp = NativeStackNavigationProp<HomeStackParamList, 'TeacherDetails'>;

const TeacherDetailsScreen = () => {
    const theme = useTheme();
    const navigation = useNavigation<TeacherDetailsNavigationProp>();
    const route = useRoute<TeacherDetailsRouteProp>();
    const { teacherId } = route.params || {};
    const { data: teacher, isLoading, error } = useTeacherDetails(teacherId || '');
    const { t } = useTranslation();

    // Animation refs for stats cards (3 stats: courses, experience, subject)
    // MUST be called before any early returns to follow Rules of Hooks
    const statAnimations = useRef([
        {
            scale: new Animated.Value(0),
            opacity: new Animated.Value(0),
            translateY: new Animated.Value(20),
        },
        {
            scale: new Animated.Value(0),
            opacity: new Animated.Value(0),
            translateY: new Animated.Value(20),
        },
        {
            scale: new Animated.Value(0),
            opacity: new Animated.Value(0),
            translateY: new Animated.Value(20),
        },
    ]).current;

    // Calculate stats from teacher data (memoized to avoid recreating on every render)
    const stats = React.useMemo(() => {
        if (!teacher) return [];
        const coursesCount = teacher?.courses?.length || 0;
        return [
            { 
                label: 'Courses', 
                value: `${coursesCount}+`, 
                icon: 'courses',
                color: '#2196F3',
                gradient: ['#E3F2FD', '#BBDEFB']
            },
            { 
                label: 'Experience', 
                value: `${teacher?.experience || 0} Years`, 
                icon: 'experience',
                color: '#FF9800',
                gradient: ['#FFF3E0', '#FFE0B2']
            },
            { 
                label: 'Subject', 
                value: teacher?.subject || 'N/A', 
                icon: 'subject',
                color: '#4CAF50',
                gradient: ['#E8F5E9', '#C8E6C9']
            },
        ];
    }, [teacher]);

    // Animate stats cards on mount
    useEffect(() => {
        if (teacher && stats.length > 0) {
            const animations = stats.map((_, index) => {
                return Animated.parallel([
                    Animated.spring(statAnimations[index].scale, {
                        toValue: 1,
                        delay: index * 100,
                        tension: 50,
                        friction: 7,
                        useNativeDriver: true,
                    }),
                    Animated.timing(statAnimations[index].opacity, {
                        toValue: 1,
                        delay: index * 100,
                        duration: 400,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(statAnimations[index].translateY, {
                        toValue: 0,
                        delay: index * 100,
                        duration: 400,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                ]);
            });

            Animated.stagger(50, animations).start();
        }
    }, [teacher, stats.length, statAnimations]);

    // Validate required params - AFTER all hooks
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

    // Custom Enhanced Experience Badge SVG Component
    const ExperienceBadgeSVG = ({ years }: { years: number }) => {
        const pulseAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 0,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }, []);

        const scale = pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.05],
        });

        return (
            <Animated.View style={{ transform: [{ scale }] }}>
                <Svg width={moderateScale(140)} height={moderateScale(32)} viewBox="0 0 140 32">
                    <Defs>
                        <LinearGradient id="badgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <Stop offset="0%" stopColor="#FF9800" stopOpacity="1" />
                            <Stop offset="100%" stopColor="#FF6F00" stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    {/* Badge shape with curved bottom */}
                    <Path
                        d="M 0 0 L 120 0 L 140 16 L 120 32 L 0 32 L 0 0 Z"
                        fill="url(#badgeGradient)"
                        stroke="#FFFFFF"
                        strokeWidth="1"
                    />
                    {/* Decorative stars */}
                    <Circle cx="10" cy="16" r="2" fill="#FFD700" opacity="0.8" />
                    <Circle cx="130" cy="16" r="1.5" fill="#FFD700" opacity="0.6" />
                    {/* Award icon path */}
                    <G transform="translate(8, 8)">
                        <Path
                            d="M 8 0 L 10 6 L 16 6 L 11 10 L 13 16 L 8 12 L 3 16 L 5 10 L 0 6 L 6 6 Z"
                            fill="#FFFFFF"
                        />
                    </G>
                </Svg>
            </Animated.View>
        );
    };

    // Custom Stat Card SVG Background
    const StatCardBackground = ({ color, gradient, index }: { color: string; gradient: string[]; index: number }) => {
        return (
            <View style={StyleSheet.absoluteFill}>
                <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                    <Defs>
                        <LinearGradient id={`statGradient-${index}-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor={gradient[0]} stopOpacity="1" />
                            <Stop offset="100%" stopColor={gradient[1]} stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    <Rect 
                        width="100%" 
                        height="100%" 
                        rx={moderateScale(14)} 
                        fill={`url(#statGradient-${index}-${color})`} 
                    />
                </Svg>
            </View>
        );
    };

    return (
        <GradientBackground>
            <ScreenHeader 
                title={ t('teacher.teacherDetails') || 'Teacher Details'} 
                showSearch={false} 
            />

            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Section with Enhanced Design */}
                <View style={[styles.profileCard, { backgroundColor: theme.colors.cardBackground }]}>
                    {/* Decorative SVG Background */}
                    <View style={StyleSheet.absoluteFill}>
                        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                            <Defs>
                                <LinearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <Stop offset="0%" stopColor="#E3F2FD" stopOpacity="0.3" />
                                    <Stop offset="100%" stopColor="#FFF3E0" stopOpacity="0.2" />
                                </LinearGradient>
                            </Defs>
                            <Rect width="100%" height="100%" rx={moderateScale(20)} fill="url(#profileGradient)" />
                            {/* Decorative elements */}
                            <Circle cx="85%" cy="15%" r={moderateScale(30)} fill="#FF9800" opacity="0.1" />
                            <Circle cx="10%" cy="85%" r={moderateScale(25)} fill="#2196F3" opacity="0.1" />
                        </Svg>
                    </View>

                    <View style={styles.profileSection}>
                        <View style={styles.imageWrapper}>
                            {/* Decorative ring around image */}
                            <View style={styles.imageRing}>
                                <Svg width={moderateScale(140)} height={moderateScale(140)} style={StyleSheet.absoluteFill}>
                                    <Circle
                                        cx={moderateScale(70)}
                                        cy={moderateScale(70)}
                                        r={moderateScale(68)}
                                        fill="none"
                                        stroke="#E3F2FD"
                                        strokeWidth="4"
                                    />
                                    <Circle
                                        cx={moderateScale(70)}
                                        cy={moderateScale(70)}
                                        r={moderateScale(60)}
                                        fill="none"
                                        stroke="#FF9800"
                                        strokeWidth="2"
                                        strokeDasharray="8 4"
                                        opacity="0.5"
                                    />
                                </Svg>
                            </View>
                            <Image
                                source={teacher.image ? { uri: teacher.image } : Images.TEACHER}
                                style={styles.profileImage}
                                resizeMode="cover"
                            />
                            {teacher?.experience && (
                                <View style={styles.experienceBadgeContainer}>
                                    <ExperienceBadgeSVG years={teacher.experience} />
                                    <View style={styles.experienceBadgeContent}>
                                        <Award size={16} color="#FFFFFF" fill="#FFFFFF" />
                                        <Text style={styles.experienceText}>
                                            {teacher.experience} Year{teacher.experience !== 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={[styles.name, { color: theme.colors.text }]}>
                                {teacher.name}
                            </Text>
                            {teacher.subject && (
                                <View style={styles.subjectBadge}>
                                    <View style={styles.subjectBadgeIcon}>
                                        <BookOpen size={14} color="#2196F3" />
                                    </View>
                                    <Text style={styles.subjectText}>{teacher.subject}</Text>
                                </View>
                            )}
                            {teacher.description && (
                                <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                                    {teacher.description}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Enhanced Stats Section */}
                <View style={styles.statsContainer}>
                    {stats.map((stat, index) => {
                        const anim = statAnimations[index];
                        return (
                            <Animated.View 
                                key={index} 
                                style={[
                                    styles.statCard, 
                                    { 
                                        borderColor: stat.color + '30',
                                        borderWidth: 1.5,
                                        transform: [
                                            { scale: anim.scale },
                                            { translateY: anim.translateY },
                                        ],
                                        opacity: anim.opacity,
                                    }
                                ]}
                            >
                                {/* Gradient Background - Full Coverage */}
                                <StatCardBackground color={stat.color} gradient={stat.gradient} index={index} />
                                
                                <View style={styles.statContent}>
                                    <Animated.View 
                                        style={[
                                            styles.statIconContainer, 
                                            { 
                                                backgroundColor: stat.color,
                                                shadowColor: stat.color,
                                                transform: [{ scale: anim.scale }],
                                            }
                                        ]}
                                    >
                                        <SVGIcon 
                                            name={stat.icon} 
                                            size={20} 
                                            color="#FFFFFF"
                                        />
                                    </Animated.View>
                                    <Text style={[styles.statValue, { 
                                        color: '#1A1A1A',
                                    }]}>
                                        {stat.value}
                                    </Text>
                                    <Text style={[styles.statLabel, { 
                                        color: '#666666',
                                    }]}>
                                        {stat.label}
                                    </Text>
                                </View>
                            </Animated.View>
                        );
                    })}
                </View>

                {/* Enhanced Courses Section */}
                {teacher.courses && teacher.courses.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionIconContainer, { backgroundColor: '#E3F2FD' }]}>
                                <Svg width={moderateScale(24)} height={moderateScale(24)} viewBox="0 0 24 24">
                                    <Path
                                        d="M 4 6 C 4 4.895 4.895 4 6 4 L 18 4 C 19.105 4 20 4.895 20 6 L 20 18 C 20 19.105 19.105 20 18 20 L 6 20 C 4.895 20 4 19.105 4 18 Z"
                                        fill="#2196F3"
                                        opacity="0.2"
                                    />
                                    <Path
                                        d="M 6 6 L 18 6 L 18 8 L 6 8 Z"
                                        fill="#2196F3"
                                    />
                                    <Path
                                        d="M 6 10 L 14 10 L 14 12 L 6 12 Z"
                                        fill="#2196F3"
                                    />
                                    <Path
                                        d="M 6 14 L 12 14 L 12 16 L 6 16 Z"
                                        fill="#2196F3"
                                    />
                                </Svg>
                            </View>
                            <View style={styles.sectionTitleContainer}>
                                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                    Courses
                                </Text>
                                <View style={styles.sectionCountBadge}>
                                    <Text style={styles.sectionCountText}>{teacher.courses.length}</Text>
                                </View>
                            </View>
                        </View>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={styles.coursesScroll}
                        >
                            {teacher.courses.map((course: any) => (
                                <TeacherCourseCard 
                                    key={course._id}
                                    title={course.name} 
                                    image={course.courseImage ? { uri: course.courseImage } : undefined}
                                    onPress={() => {
                                        try {
                                            (navigation as any).navigate('CourseDetails', { 
                                                courseId: course._id 
                                            });
                                        } catch (error) {
                                            if (__DEV__) {
                                                console.error('[TeacherDetailsScreen] Navigation error:', error);
                                            }
                                        }
                                    }}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Enhanced Video Section */}
                {teacher.video && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                           
                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                Demo Video
                            </Text>
                        </View>
                        <View style={[styles.videoCard, { backgroundColor: theme.colors.cardBackground }]}>
                         
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
        padding: getSpacing(4),
    },
    scrollContent: {
        padding: getSpacing(2),
        paddingBottom: getSpacing(4),
    },
    profileCard: {
        borderRadius: moderateScale(20),
        padding: getSpacing(4),
        marginBottom: getSpacing(3),
        marginHorizontal: getSpacing(1),
        elevation: 6,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: '#F5F5F5',
        overflow: 'hidden',
        position: 'relative',
    },
    profileSection: {
        alignItems: 'center',
        zIndex: 1,
    },
    imageWrapper: {
        width: moderateScale(140),
        height: moderateScale(140),
        borderRadius: moderateScale(70),
        overflow: 'visible',
        marginBottom: getSpacing(2.5),
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageRing: {
        position: 'absolute',
        width: moderateScale(140),
        height: moderateScale(140),
        zIndex: 0,
    },
    profileImage: {
        width: moderateScale(120),
        height: moderateScale(120),
        borderRadius: moderateScale(60),
        borderWidth: 4,
        borderColor: '#FFFFFF',
        zIndex: 1,
    },
    experienceBadgeContainer: {
        position: 'absolute',
        bottom: moderateScale(-16),
        left: '50%',
        transform: [{ translateX: moderateScale(-70) }],
        zIndex: 2,
        alignItems: 'center',
        justifyContent: 'center',
        width: moderateScale(140),
        height: moderateScale(32),
    },
    experienceBadgeContent: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: getSpacing(0.5),
        width: '100%',
        height: '100%',
        paddingLeft: moderateScale(8),
    },
    experienceText: {
        color: '#FFFFFF',
        fontSize: moderateScale(12),
        fontFamily: getFontFamily('800'),
        letterSpacing: 0.5,
    },
    profileInfo: {
        alignItems: 'center',
        width: '100%',
    },
    name: {
        fontSize: moderateScale(24),
        fontFamily: getFontFamily('800'),
        marginBottom: getSpacing(1),
        textAlign: 'center',
    },
    subjectBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: getSpacing(2.5),
        paddingVertical: getSpacing(1),
        borderRadius: moderateScale(16),
        marginBottom: getSpacing(1.5),
        flexDirection: 'row',
        alignItems: 'center',
        gap: getSpacing(0.75),
        borderWidth: 1,
        borderColor: '#BBDEFB',
    },
    subjectBadgeIcon: {
        width: moderateScale(20),
        height: moderateScale(20),
        borderRadius: moderateScale(10),
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    subjectText: {
        color: '#2196F3',
        fontSize: moderateScale(13),
        fontFamily: getFontFamily('700'),
    },
    description: {
        fontSize: moderateScale(14),
        textAlign: 'center',
        lineHeight: moderateScale(20),
        marginTop: getSpacing(1),
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: getSpacing(2.5),
        gap: getSpacing(1),
    },
    statCard: {
        flex: 1,
        borderRadius: moderateScale(14),
        padding: getSpacing(1.5),
        alignItems: 'center',
        elevation: 4,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        overflow: 'hidden',
        minHeight: moderateScale(95),
        position: 'relative',
        marginHorizontal: getSpacing(0.5),
    },
    statContent: {
        alignItems: 'center',
        zIndex: 1,
        width: '100%',
    },
    statIconContainer: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: getSpacing(1),
        elevation: 2,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    statValue: {
        fontSize: moderateScale(12),
        fontFamily: getFontFamily('800'),
        marginBottom: getSpacing(0.25),
        textAlign: 'center',
        letterSpacing: 0.15,
    },
    statLabel: {
        fontSize: moderateScale(9),
        fontFamily: getFontFamily('600'),
        textAlign: 'center',
        letterSpacing: 0.1,
        textTransform: 'uppercase',
    },
    section: {
        marginBottom: getSpacing(3),
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getSpacing(2),
        paddingHorizontal: getSpacing(1),
        marginTop: getSpacing(1),
    },
    sectionIconContainer: {
        width: moderateScale(44),
        height: moderateScale(44),
        borderRadius: moderateScale(22),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: getSpacing(1.5),
        elevation: 2,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: getSpacing(1),
    },
    sectionTitle: {
        fontSize: moderateScale(20),
        fontFamily: getFontFamily('800'),
        letterSpacing: 0.3,
    },
    sectionCountBadge: {
        backgroundColor: '#2196F3',
        paddingHorizontal: getSpacing(1.5),
        paddingVertical: getSpacing(0.25),
        borderRadius: moderateScale(12),
        minWidth: moderateScale(28),
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionCountText: {
        color: '#FFFFFF',
        fontSize: moderateScale(12),
        fontFamily: getFontFamily('800'),
    },
    coursesScroll: {
        paddingRight: getSpacing(2),
        paddingBottom: getSpacing(10),
    },
    videoCard: {
        borderRadius: moderateScale(18),
        overflow: 'hidden',
        elevation: 6,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        borderWidth: 2,
        borderColor: '#FFEBEE',
        position: 'relative',
    },
    videoContainer: {
        width: '100%',
        height: moderateScale(240),
        backgroundColor: '#000',
        position: 'relative',
    },
    video: {
        width: '100%',
        height: '100%',
    },
    videoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
    },
    backButton: {
        marginTop: getSpacing(2),
        padding: getSpacing(1),
    },
});

export default TeacherDetailsScreen;

