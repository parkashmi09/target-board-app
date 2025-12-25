import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
} from 'react-native';
import { Svg, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import LottieView from 'lottie-react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import SVGIcon from '../SVGIcon';
import { Images } from '../../assets/images';
import verifiedAnimation from '../../assets/lotties/Verified.json';

interface CourseTeacherCardProps {
    name: string;
    expertise: string;
    experience: string;
    rating: number; // 1-5
    imageUrl?: string;
    isVerified?: boolean;
    gradientColors?: [string, string];
}

const CourseTeacherCard: React.FC<CourseTeacherCardProps> = ({
    name,
    expertise,
    experience,
    rating,
    imageUrl,
    isVerified = true,
    gradientColors,
}) => {
    const theme = useTheme();

    // Default gradient colors if not provided
    const defaultGradient: [string, string] = gradientColors || ['#FFE4E9', '#FFD4DC'];

    // Render stars
    const renderStars = () => {
        return Array.from({ length: 5 }).map((_, index) => (
            <SVGIcon
                key={index}
                name="star"
                size={moderateScale(10)}
                color={index < rating ? '#FFD700' : '#E0E0E0'}
            />
        ));
    };

    return (
        <View
            style={[
                styles.card,
                {
                    shadowColor: theme.colors.cardShadow || '#000',
                    overflow: 'visible',
                },
            ]}
        >
            {/* Gradient Background */}
            <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: moderateScale(8) }]}>
                <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                    <Defs>
                        <LinearGradient id={`teacherGradient-${name}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor={defaultGradient[0]} stopOpacity="1" />
                            <Stop offset="100%" stopColor={defaultGradient[1]} stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill={`url(#teacherGradient-${name})`} rx={moderateScale(8)} />
                </Svg>
            </View>

            {/* Content Container */}
            <View style={styles.contentContainer}>
                {/* Teacher Image Section */}
                <View style={styles.imageContainer}>
                    <View style={styles.imageWrapper}>
                        <Image
                            source={imageUrl ? { uri: imageUrl } : Images.TEACHER}
                            style={styles.teacherImage}
                            resizeMode="cover"
                        />
                    </View>
                    {/* Experience Badge with Stripe Background */}
                    <View style={styles.experienceBadge}>
                        <Image
                            source={Images.BADGE_STRIPE}
                            style={styles.badgeStripeImage}
                            resizeMode="cover"
                        />
                        <View style={styles.experienceTextContainer}>
                            <Text style={styles.experienceText}>{experience} </Text>
                            <Text style={styles.experienceTextYear}>Years</Text>
                        </View>
                    </View>
                </View>

                {/* Teacher Details Section */}
                <View style={styles.detailsContainer}>
                    {/* Name with Verified Badge */}
                    <View style={styles.nameRow}>
                        <Text style={[styles.teacherName, { color: '#1a1a1a' }]} numberOfLines={1}>
                            {name.toUpperCase()}
                        </Text>
                        {isVerified && (
                            <View style={styles.verifiedBadge}>
                                <LottieView
                                    source={verifiedAnimation}
                                    style={{
                                        width: moderateScale(16),
                                        height: moderateScale(16),
                                    }}
                                    autoPlay
                                    loop
                                />
                            </View>
                        )}
                    </View>

                    {/* Expertise */}
                    <Text style={[styles.expertise, { color: '#4a4a4a' }]} numberOfLines={2}>
                        {expertise.toUpperCase()}
                    </Text>

                    {/* Rating Stars */}
                    <View style={styles.ratingContainer}>
                        {renderStars()}
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        marginRight: 0,
        marginTop: moderateScale(30),
    },
    contentContainer: {
        flexDirection: 'row',
        padding: getSpacing(1),
        paddingTop: getSpacing(0.5),
        paddingBottom: getSpacing(1),
        zIndex: 1,
    },
    imageContainer: {
        position: 'absolute',
        top: moderateScale(-13),
        left: getSpacing(0),
        zIndex: 2,
    },
    imageWrapper: {
        width: moderateScale(58),
        height: moderateScale(70),
        overflow: 'hidden',
    },
    teacherImage: {
        width: '100%',
        height: '100%',
    },
    experienceBadge: {
        position: 'absolute',
        bottom: moderateScale(-10),
        left: moderateScale(-8),
        width: moderateScale(70),
        height: moderateScale(15),
        overflow: 'hidden',
        backgroundColor: 'transparent',
        zIndex: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeStripeImage: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
    },
    experienceTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: moderateScale(1),
        marginLeft: moderateScale(-18),
    },
    experienceText: {
        color: '#FFFFFF',
        fontSize: moderateScale(6),
        fontWeight: '800',
        letterSpacing: 0.3,
        textAlign: 'center',
        zIndex: 1,
        marginLeft: moderateScale(1),
        textTransform: 'uppercase',
    },
    experienceTextYear: {
        color: '#FFFFFF',
        fontSize: moderateScale(6),
        fontWeight: '800',
        letterSpacing: 0.3,
        textAlign: 'center',
        marginLeft: moderateScale(1),
        zIndex: 1,
        textTransform: 'uppercase',
    },
    detailsContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingLeft: moderateScale(55),
        paddingTop: getSpacing(0.5),
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getSpacing(0.25),
    },
    teacherName: {
        fontSize: moderateScale(7),
        fontWeight: '800',
        letterSpacing: 0.3,
        marginRight: getSpacing(0.25),
        flexShrink: 1,
    },
    verifiedBadge: {
        width: moderateScale(16),
        height: moderateScale(16),
        borderRadius: moderateScale(8),
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    expertise: {
        fontSize: moderateScale(5),
        fontWeight: '600',
        marginBottom: getSpacing(0.5),
        letterSpacing: 0.2,
    },
    ratingContainer: {
        flexDirection: 'row',
        gap: moderateScale(1),
    },
});

export default CourseTeacherCard;

