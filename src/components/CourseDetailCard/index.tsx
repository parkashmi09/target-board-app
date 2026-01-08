import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import SVGIcon from '../SVGIcon';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../navigation/MainStack';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

interface Course {
  _id?: string;
  id?: string;
  name?: string;
  courseDescription?: string;
  courseImage?: string;
  strikeoutPrice?: number;
  packages?: Array<{ price: number; durationInMonths: number; isDefault: boolean }>;
  courseFeatures?: string;
  teachers?: Array<{ _id?: string; name?: string; image?: string; subject?: string }>;
  batchInfo?: { startDate?: string; endDate?: string };
  createdAt?: string;
  updatedAt?: string;
}

interface CourseDetailCardProps {
  course: Course | null | undefined;
  onDetailsPress?: () => void;
  onContentPress?: (courseId?: string, courseName?: string) => void;
  onWhatsAppPress?: () => void;
}

const CourseDetailCard: React.FC<CourseDetailCardProps> = ({
  course,
  onDetailsPress,
  onContentPress,
  onWhatsAppPress,
}) => {
  const theme = useTheme();
  const { colors } = theme;
  const navigation = useNavigation<NavigationProp>();
  const screenWidth = Dimensions.get('window').width;
  const cardPadding = getSpacing(2);
  const cardWidth = screenWidth - (cardPadding * 2);

  // Safety check: return null if course is undefined
  if (!course) {
    return null;
  }

  // Format expiry date
  const formatExpiryDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  const expiryDate = course?.batchInfo?.endDate 
    ? formatExpiryDate(course.batchInfo.endDate)
    : course?.updatedAt 
    ? formatExpiryDate(course.updatedAt)
    : 'N/A';

  const courseId = course._id || course.id;
  const courseName = course.name || 'Course';

  const handleDetailsPress = () => {
    navigation.navigate('CourseDetails', { courseId: String(courseId) });
    // if (onDetailsPress) {
    //   onDetailsPress();
    // } else if (courseId) {
    //   navigation.navigate('CourseDetails', { courseId: String(courseId) });
    // }
  };

  const handleContentPress = () => {
    navigation.navigate('Categories', { courseId: String(courseId), courseName });
    // if (onContentPress) {
    //   onContentPress(courseId, courseName);
    // } else if (courseId) {
    //   navigation.navigate('Categories', { courseId: String(courseId), courseName });
    // }
  };

  const handleWhatsAppPress = () => {
    if (onWhatsAppPress) {
      onWhatsAppPress();
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, shadowColor: colors.cardShadow }]}>
      {/* Banner Section */}
      <View style={styles.bannerContainer}>
        {course?.courseImage ? (
          <Image
            source={{ uri: course.courseImage }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.bannerImage, { backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ color: '#999', fontSize: moderateScale(14) }}>No Image</Text>
          </View>
        )}
      </View>

      {/* Course Details Section */}
      <View style={[styles.detailsSection, { backgroundColor: colors.background }]}>
        <Text style={[styles.detailsTitle, { color: colors.text }]} numberOfLines={2}>
          {courseName}
        </Text>
        <Text style={[styles.expiryDate, { color: colors.textSecondary }]}>
          Expiry Date : {expiryDate}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={handleWhatsAppPress}
            style={[styles.whatsappButton, { backgroundColor: '#25D366' }]}
          >
                <SVGIcon name="whatsapp" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDetailsPress}
            style={[styles.detailsButton, { backgroundColor: colors.info }]}
          >
            <Text style={styles.buttonText}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleContentPress}
            style={[styles.contentButton, { backgroundColor: colors.warning }]}
          >
            <Text style={styles.buttonText}>Content</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: moderateScale(16),
    marginBottom: getSpacing(2),
    overflow: 'hidden',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  bannerContainer: {
    width: '100%',
    height: moderateScale(220),
    position: 'relative',
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  detailsSection: {
    padding: getSpacing(2),
  },
  detailsTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginBottom: getSpacing(0.5),
  },
  expiryDate: {
    fontSize: moderateScale(12),
    marginBottom: getSpacing(1.5),
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(1),
  },
  whatsappButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  detailsButton: {
    flex: 1,
    paddingVertical: getSpacing(1.25),
    paddingHorizontal: getSpacing(2),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentButton: {
    flex: 1,
    paddingVertical: getSpacing(1.25),
    paddingHorizontal: getSpacing(2),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
});

export default CourseDetailCard;

