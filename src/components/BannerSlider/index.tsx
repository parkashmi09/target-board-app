import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Image, Linking, Animated, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Video from 'react-native-video';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { useSliders } from '../../hooks/queries/useSliders';
import { SliderItem } from '../../types/slider';
import { Images } from '../../assets/images';

interface BannerSliderProps {
  /**
   * Direct slider data prop (optional - if not provided, will fetch using useSliders hook)
   * Matches old SliderComponent pattern for backward compatibility
   */
  data?: SliderItem[];
  /**
   * Category ID to filter sliders by
   */
  categoryId?: string | number | null;
  /**
   * Full data object for navigation to courses/live classes
   */
  full_data?: any;
  /**
   * Whether to enable auto-play
   */
  autoPlay?: boolean;
  /**
   * Auto-play interval in milliseconds
   */
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
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const screenWidth = Dimensions.get('window').width;
  const sidePadding = getSpacing(2);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoPlayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Show 1 card at a time - full width minus side padding
  const cardWidth = screenWidth - (sidePadding * 2);
  // 16:9 aspect ratio (YouTube thumbnail style)
  const cardHeight = cardWidth * (9 / 16);

  // Fetch slider data using custom hook
  const { data: fetchedSliderData, isLoading: loading } = useSliders({
    categoryId: categoryId,
    enabled: !data, // Enable if no data prop provided
  });

  // Create fallback slider items from local images
  const fallbackSliderItems: SliderItem[] = useMemo(() => [
    {
      id: -1,
      image: '',
      action: '',
      category_id: 0,
      status: 1,
      sorting_params: 1,
      localSource: Images.TB_LOGO,
    },
    {
      id: -2,
      image: '',
      action: '',
      category_id: 0,
      status: 1,
      sorting_params: 2,
      localSource: Images.TB_LOGO,
    },
    {
      id: -3,
      image: '',
      action: '',
      category_id: 0,
      status: 1,
      sorting_params: 3,
      localSource: Images.TB_LOGO,
    },
  ] as any, []);

  const sliderData = useMemo(() => {
    if (data && Array.isArray(data)) {
      return data;
    }
    if (!fetchedSliderData) {
      return [];
    }
    return Array.isArray(fetchedSliderData) ? fetchedSliderData : [];
  }, [data, fetchedSliderData]);

  const displayCards: SliderItem[] = useMemo(() => {
    if (sliderData && sliderData.length > 0) {
      return sliderData;
    }
    return fallbackSliderItems;
  }, [sliderData, fallbackSliderItems]);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && displayCards.length > 1 && !loading) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % displayCards.length;
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
              x: nextIndex * screenWidth,
              animated: true,
            });
          }
          return nextIndex;
        });
      }, autoPlayInterval);

      return () => {
        if (autoPlayTimerRef.current) {
          clearInterval(autoPlayTimerRef.current);
        }
      };
    }
  }, [autoPlay, displayCards.length, autoPlayInterval, loading]);

  // Determine if we should show skeleton
  const showSkeleton = loading && (!data || data.length === 0) && (!sliderData || sliderData.length === 0);

  // Handle banner press
  const handlePress = (item: SliderItem) => {
    // Check for new link field first
    if (item.link) {
      if (item.link.startsWith('http')) {
        Linking.openURL(item.link);
      }
      return;
    }

    // Fallback to old action field
    const action = item.action;
    if (!action) return;

    if (action.startsWith('course_')) {
      const courseId = action.split('_')[1];
      const batch = full_data?.batches?.find((batch: any) => batch.id === parseInt(courseId));
      if (batch) {
        (navigation as any).navigate('CourseDetails', { courseId: batch.id });
      }
    } else if (action.startsWith('live_class_')) {
      const liveClassId = action.split('_')[2];
      const liveClass = full_data?.live_class?.find((liveClass: any) => liveClass.id === parseInt(liveClassId));
      if (liveClass) {
        (navigation as any).navigate('ClassStreamsScreen', { link: liveClass.link, data: liveClass });
      }
    } else if (action.startsWith('http')) {
      Linking.openURL(action);
    }
  };

  const renderItem = (item: SliderItem, index: number) => {
    const isFallbackItem = (item as any).localSource;
    const mediaType = item.mediaType || 'image'; // Default to image if not specified
    const mediaUrl = item.mediaUrl || item.image || '';
    const hasValidMedia = mediaUrl && mediaUrl.trim().startsWith('http');
    let imageSource;
    let isTouchable = true;
    let isVideo = false;

    // Check if URL is a video file by extension
    const isVideoByExtension = hasValidMedia && /\.(mp4|mov|webm|avi|m4v)(\?|$)/i.test(mediaUrl);

    // Determine if this is a video
    if ((mediaType === 'video' || isVideoByExtension) && hasValidMedia) {
      isVideo = true;
      isTouchable = !!item.link; // Only touchable if there's a link
    } else if (isFallbackItem) {
      imageSource = (item as any).localSource || Images.TB_LOGO;
      isTouchable = false;
    } else if (!item || !hasValidMedia) {
      // Fallback for invalid item
      const fallbackIndex = index % fallbackSliderItems.length;
      imageSource = (fallbackSliderItems[fallbackIndex] as any).localSource || Images.TB_LOGO;
      isTouchable = false;
    } else {
      // Image case
      imageSource = { uri: mediaUrl };
    }

    const Content = (
      <View
        style={[
          styles.card,
          {
            width: cardWidth,
            height: cardHeight,
          },
        ]}
      >
        {isVideo ? (
          <Video
            source={{ uri: mediaUrl }}
            style={styles.cardVideo}
            muted={true}
            repeat={true}
            paused={false}
            playInBackground={false}
            playWhenInactive={true}
            ignoreSilentSwitch="ignore"
            allowsExternalPlayback={false}
            onError={(error) => {
              if (__DEV__) {
                console.warn('Video playback error:', error);
              }
            }}
          />
        ) : (
          <Image
            source={imageSource}
            style={styles.cardImage}
            resizeMode="cover"
            defaultSource={Images.TB_LOGO}
          />
        )}
      </View>
    );

    // If it's a valid remote item with link/action, wrap in Touchable
    if (isTouchable && !isFallbackItem && (item.link || item.action)) {
      return (
        <View key={item.id || index} style={{ width: screenWidth, alignItems: 'center' }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handlePress(item)}
          >
            {Content}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View key={item.id || index} style={{ width: screenWidth, alignItems: 'center' }}>
        {Content}
      </View>
    );
  };

  // Skeleton Component with shimmer effect
  const SkeletonCard = () => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const shimmerAnimation = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      );
      shimmerAnimation.start();
      return () => shimmerAnimation.stop();
    }, [shimmerAnim]);

    const translateX = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-cardWidth * 2, cardWidth * 2],
    });

    return (
      <View style={[styles.container, { paddingHorizontal: sidePadding }]}>
        <View
          style={[
            styles.card,
            styles.skeletonCard,
            {
              width: cardWidth,
              height: cardHeight,
              backgroundColor: theme.colors.border,
            },
          ]}
        >
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: -cardWidth,
                width: cardWidth * 2,
                height: '100%',
                opacity: 0.5,
                transform: [{ translateX }],
                backgroundColor: theme.isDark 
                  ? 'rgba(255, 255, 255, 0.15)' 
                  : 'rgba(255, 255, 255, 0.4)',
              },
            ]}
          />
        </View>
        {/* Skeleton Indicators */}
        <View style={styles.indicators}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                styles.skeletonIndicator,
                {
                  backgroundColor: theme.colors.border,
                  width: moderateScale(8),
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  // Show skeleton while loading
  if (showSkeleton) {
    return <SkeletonCard />;
  }

  if (!Array.isArray(displayCards) || displayCards.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e: any) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      >
        {displayCards.map((item, index) => renderItem(item, index))}
      </ScrollView>

      {/* Indicators */}
      {Array.isArray(displayCards) && displayCards.length > 1 && (
        <View style={styles.indicators}>
          {displayCards.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    index === currentIndex
                      ? theme.colors.navBackground || theme.colors.accent
                      : theme.colors.border,
                  width: index === currentIndex ? moderateScale(20) : moderateScale(8),
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
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(8),
  },
  cardVideo: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(8),
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getSpacing(1.5),
    gap: moderateScale(6),
  },
  indicator: {
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  skeletonCard: {
    position: 'relative',
    overflow: 'hidden',
  },
  skeletonIndicator: {
    opacity: 0.5,
  },
});

export default BannerSlider;
