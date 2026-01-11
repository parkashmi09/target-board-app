import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { getFontFamily } from '../../utils/fonts';
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
                {image ? (
                    <Image
                        source={image}
                        style={styles.image}
                        resizeMode="contain"
                    />
                ) : (
                    <View style={styles.placeholderContainer}>
                        <SVGIcon name="course" size={40} color="#FFFFFF" />
                    </View>
                )}
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
        width: moderateScale(200),
        borderRadius: moderateScale(12),
        marginRight: getSpacing(2),
        overflow: 'hidden',
     
        marginBottom: getSpacing(1),
    },
    imageContainer: {
        height: moderateScale(140),
        width: '100%',
        position: 'relative',
        backgroundColor: '#212121',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#212121',
    },
    content: {
        padding: getSpacing(1),
    },
    title: {
        fontSize: moderateScale(10),
        fontFamily: getFontFamily('600'),
        textAlign: 'center',
    },
});

export default TeacherCourseCard;

