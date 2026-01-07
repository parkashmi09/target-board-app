import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Linking,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSharedValue } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import Video from 'react-native-video';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { useSliders } from '../../hooks/queries/useSliders';
import { SliderItem } from '../../types/slider';
import { Images } from '../../assets/images';

interface BannerSliderProps {
  data?: SliderItem[];
  categoryId?: string | number | null;
  full_data?: any;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

const BannerSlider: React.FC<BannerSliderProps> = ({
  data,
  categoryId,
  full_data,
  autoPlay = true,
  autoPlayInterval = 3000,
}) => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [currentIndex, setCurrentIndex] = useState(0);

  const screenWidth = Dimensions.get('window').width;
  const sidePadding = getSpacing(1);
  const peek = moderateScale(20); // 🔥 space for left + right peek

  const cardWidth = screenWidth - sidePadding * 2 - peek;
  const cardHeight = cardWidth * (9 / 16);

  const progress = useSharedValue(0);

  const { data: fetchedSliderData, isLoading: loading } = useSliders({
    categoryId,
    enabled: !data,
  });

  const fallbackSliderItems: SliderItem[] = useMemo(
    () => [
      { id: -1, localSource: Images.TB_LOGO } as any,
      { id: -2, localSource: Images.TB_LOGO } as any,
      { id: -3, localSource: Images.TB_LOGO } as any,
    ],
    []
  );

  const sliderData = useMemo(() => {
    if (Array.isArray(data) && data.length > 0) return data;
    if (Array.isArray(fetchedSliderData)) return fetchedSliderData;
    return [];
  }, [data, fetchedSliderData]);

  const displayCards = sliderData.length
    ? sliderData
    : fallbackSliderItems;

  const handlePress = (item: SliderItem) => {
    if (item.link?.startsWith('http')) {
      Linking.openURL(item.link);
      return;
    }

    if (!item.action) return;

    if (item.action.startsWith('course_')) {
      const id = item.action.split('_')[1];
      navigation.navigate('CourseDetails', { courseId: id });
    }

    if (item.action.startsWith('live_class_')) {
      const id = item.action.split('_')[2];
      navigation.navigate('ClassStreamsScreen', { id });
    }
  };

  const BannerItem = ({
    item,
    index,
  }: {
    item: SliderItem;
    index: number;
  }) => {
    const [videoError, setVideoError] = useState(false);
    const mediaUrl = item.mediaUrl || item.image || '';
    const isVideo =
      mediaUrl &&
      /\.(mp4|mov|webm|avi|m4v)$/i.test(mediaUrl) &&
      !videoError;

    return (
      <View style={[styles.card, { width: cardWidth, height: cardHeight }]}>
        {isVideo ? (
          <Video
            source={{ uri: mediaUrl }}
            style={styles.media}
            muted
            repeat
            resizeMode="cover"
            onError={() => setVideoError(true)}
          />
        ) : (
          <Image
            source={
              mediaUrl
                ? { uri: mediaUrl }
                : (item as any).localSource || Images.TB_LOGO
            }
            style={styles.media}
            resizeMode="cover"
          />
        )}
      </View>
    );
  };

  const renderItem = useCallback(
    ({ item, index }: { item: SliderItem; index: number }) => (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handlePress(item)}
        style={{ width: cardWidth, alignItems: 'center' }}
      >
        <BannerItem item={item} index={index} />
      </TouchableOpacity>
    ),
    [cardWidth]
  );

  if (!displayCards.length) return null;

  return (
    <View style={styles.container}>
      <Carousel
        width={cardWidth}
        height={cardHeight}
        data={displayCards}
        renderItem={renderItem}
        loop={displayCards.length > 1}
        autoPlay={autoPlay && displayCards.length > 1 && !loading}
        autoPlayInterval={autoPlayInterval}
        pagingEnabled
        snapEnabled
        alignItems="center"
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.95,
          parallaxScrollingOffset: peek,
        }}
        style={{ overflow: 'visible' }}
        containerStyle={{ overflow: 'visible' }}
        contentContainerStyle={{
          paddingHorizontal: sidePadding, // 🔥 BALANCED PEEK
        }}
        onProgressChange={(_, absoluteProgress) => {
          progress.value = absoluteProgress;
          setCurrentIndex(
            Math.round(absoluteProgress) % displayCards.length
          );
        }}
      />

      {displayCards.length > 1 && (
        <View style={styles.indicators}>
          {displayCards.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    index === currentIndex
                      ? theme.colors.accent
                      : theme.colors.border,
                  width:
                    index === currentIndex
                      ? moderateScale(20)
                      : moderateScale(8),
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: getSpacing(2),
  },
  card: {
    borderRadius: moderateScale(10),
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: getSpacing(1.5),
    gap: moderateScale(6),
  },
  indicator: {
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
});

export default BannerSlider;
