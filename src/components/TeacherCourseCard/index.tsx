import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { Images } from '../../assets/images';
import SVGIcon from '../SVGIcon';

interface TeacherCourseCardProps {
    title: string;
    image?: any;
    onPress?: () => void;
}

const TeacherCourseCard: React.FC<TeacherCourseCardProps> = ({ title, image, onPress }) => {
    const theme = useTheme();

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}
            onPress={onPress}
            activeOpacity={0.9}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={image || Images.TB_LOGO}
                    style={styles.image}
                    resizeMode="cover"
                />
                {/* Overlay Icon */}
                <View style={styles.iconOverlay}>
                    <SVGIcon name="course" size={40} color="#FFFFFF" />
                </View>
            </View>
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
                    {title}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: moderateScale(160),
        borderRadius: moderateScale(12),
        marginRight: getSpacing(2),
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        marginBottom: getSpacing(1),
    },
    imageContainer: {
        height: moderateScale(140),
        width: '100%',
        position: 'relative',
        backgroundColor: '#212121', // Dark background for placeholder
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        opacity: 0.8,
    },
    iconOverlay: {
        position: 'absolute',
        zIndex: 1,
    },
    content: {
        padding: getSpacing(1.5),
    },
    title: {
        fontSize: moderateScale(14),
        fontWeight: '600',
        textAlign: 'center',
    },
});

export default TeacherCourseCard;

