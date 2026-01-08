import React, { memo, useCallback } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSharedValue } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import CourseCard from '../CourseCard';
import ToppersSection from './ToppersSection';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { getFontFamily } from '../../utils/fonts';
import { Theme } from '../../theme/theme';

interface CourseSectionProps {
  courses: any[];
  theme: Theme;
}

const CourseSection: React.FC<CourseSectionProps> = memo(({ courses, theme }) => {

  // console.log('courses', courses.length);
  const navigation = useNavigation<any>();
  const progress = useSharedValue(0);
  const windowWidth = Dimensions.get('window').width;

  // 🔥 TIGHT WIDTH (like 2nd image)
  const horizontalPadding = getSpacing(1.5);
  const peekAmount = moderateScale(28);

  const cardWidth =
    windowWidth - horizontalPadding * 2 - peekAmount;

  const cardHeight = cardWidth * (9 / 16) + moderateScale(130);

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      if (!item) return <View />;

      const selectedPackage =
        item?.packages?.find((p: any) => p.isDefault) ||
        item?.packages?.[0];

      const originalPrice =
        item?.strikeoutPrice || item?.originalPrice || 0;

      const currentPrice =
        selectedPackage?.price ||
        item?.coursePrice ||
        item?.currentPrice ||
        0;

      const discount =
        originalPrice > currentPrice
          ? Math.round(
              ((originalPrice - currentPrice) / originalPrice) * 100
            )
          : 0;

      const goToDetails = () => {
        navigation.navigate('CourseDetails', {
          courseId: String(item.id || item._id),
        });
      };

      return (
        <View style={[styles.cardWrapper, { width: cardWidth }]}>
          <CourseCard
            title={item?.name || item?.title || ''}
            subtitle={item?.subtitle}
            medium={item?.medium || ''}
            board={item?.board || ''}
            targetAudience={item?.targetAudience || item?.class || ''}
            originalPrice={originalPrice}
            currentPrice={currentPrice}
            discount={discount}
            startDate={item?.startDate || ''}
            endDate={item?.endDate || ''}
            batchType={item?.batchType}
            bannerImage={item?.bannerImage}
            gradientColors={item?.gradientColors}
            courseId={item?.id || item?._id}
            packages={item?.packages}
            purchased={item?.purchased || false}
            onExplore={goToDetails}
            onBuyNow={goToDetails}
            onPress={goToDetails}
          />
        </View>
      );
    },
    [navigation, cardWidth]
  );

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            marginLeft: horizontalPadding,
          },
        ]}
      >
        Latest Courses
      </Text>

      {courses?.length > 0 && (
        <Carousel
          width={cardWidth}
          height={cardHeight}
          data={courses}
          renderItem={renderItem}
          loop={courses.length > 1}
          autoPlay={courses.length > 1}
          autoPlayInterval={4000}
          pagingEnabled
          snapEnabled
          mode="parallax"
          modeConfig={{
            parallaxScrollingScale: 0.96,
            parallaxScrollingOffset: peekAmount,
          }}
          style={{ marginLeft: horizontalPadding, overflow: 'visible' }}
          enabled={true}
          windowSize={2}
        />
      )}

      {/* Integrated Toppers Section */}
      {/* <ToppersSection theme={theme} /> */}
    </View>
  );
});

CourseSection.displayName = 'CourseSection';

const styles = StyleSheet.create({
  container: {
    marginVertical: getSpacing(1.2),
  },
  title: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginBottom: getSpacing(0.8),
    fontFamily: getFontFamily('200'),
  },
  cardWrapper: {
    alignItems: 'stretch', // 🔥 FULL WIDTH
  },
});

export default CourseSection;
