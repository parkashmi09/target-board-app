import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Animated,
  Easing,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import { CategoryNode, fetchContentByCategory, ContentItem, Stream } from '../services/api';
import { FileText, Video, Play, Radio, ClipboardList } from 'lucide-react-native';
import { useToast } from '../components/Toast';
import SVGIcon from '../components/SVGIcon';
import FilterTabs, { FilterTab } from '../components/FilterTabs';
import { Svg, Circle, Rect, Path, G, Text as SvgText, TSpan } from 'react-native-svg';
import type { MainStackParamList } from '../navigation/MainStack';

type ContentTabType = 'video' | 'pdf' | 'test';

type CategoryContentScreenRouteProp = RouteProp<MainStackParamList, 'CategoryContent'>;

const CategoryContentScreen: React.FC = () => {
  const theme = useTheme();
  const { colors } = theme;
  const navigation = useNavigation();
  const route = useRoute<CategoryContentScreenRouteProp>();
  const { category, courseId, courseName } = route.params || {};
  const toast = useToast();

  const [contentItems, setContentItems] = useState<ContentItem[]>([]);

  console.log("contentItems", contentItems);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentTabType>('video');

  // Safe check for leaf category - fix potential crash
  const isLeafCategory = !category || !category.children || category.children.length === 0;

  const loadContent = useCallback(async () => {
    if (!category?._id || !isLeafCategory) {
      setContentItems([]);
      return;
    }

    try {
      setLoading(true);
      const content = await fetchContentByCategory(category._id);
      setContentItems(content || []);
    } catch (error) {
      if (__DEV__) {
        console.error('[CategoryContentScreen] Error loading content:', error);
      }
      setContentItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category?._id, isLeafCategory]);

  useEffect(() => {
    if (isLeafCategory && category?._id) {
      loadContent();
    }
  }, [isLeafCategory, category?._id, loadContent]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadContent();
  }, [loadContent]);

  const handleContentPress = useCallback((item: ContentItem) => {
    if (!item || !item._id) {
      toast.show({ text: 'Invalid content item', type: 'error' });
      return;
    }

    try {
      if (item.type === 'pdf' && item.pdf?.url) {
        (navigation as any).navigate('PDFDownload', {
          url: item.pdf.url,
          title: item.title || 'PDF Document',
          contentId: item._id,
        });
      } else if (item.type === 'video' && (item.video?.assetId || item.video?.url)) {
        // Navigate to video player
        (navigation as any).navigate('VideoPlayer', {
          tpAssetId: item.video.assetId,
          hlsUrl: item.video.url,
          title: item.title || 'Video',
        });
      } else {
        toast.show({ text: 'Content not available', type: 'error' });
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[CategoryContentScreen] Navigation error:', error);
      }
      toast.show({ text: 'Failed to open content', type: 'error' });
    }
  }, [navigation, toast]);

  const handleStreamPress = useCallback((stream: Stream) => {
    if (!stream || !stream._id) {
      toast.show({ text: 'Invalid stream', type: 'error' });
      return;
    }

    try {
      // For live streams, use StreamPlayer (with chat)
      if (stream.status === 'live' || stream.tpStatus === 'STREAMING') {
        (navigation as any).navigate('StreamPlayer', {
          streamId: stream._id,
          tpAssetId: stream.tpAssetId,
          hlsUrl: stream.hlsUrl,
        });
      } else {
        // For scheduled/completed streams, use VideoPlayer (simple player)
        (navigation as any).navigate('VideoPlayer', {
          tpAssetId: stream.tpAssetId,
          hlsUrl: stream.hlsUrl,
          title: stream.title || 'Video',
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[CategoryContentScreen] Navigation error:', error);
      }
      toast.show({ text: 'Failed to open stream', type: 'error' });
    }
  }, [navigation, toast]);

  // Get streams from category - separate live streams from scheduled/completed
  const allStreams = category?.streams || [];
  const liveStreams = allStreams.filter((stream: Stream) => 
    stream.status === 'live' || stream.tpStatus === 'STREAMING'
  );
  const scheduledStreams = allStreams.filter((stream: Stream) => 
    stream.status === 'scheduled' || stream.status === 'upcoming' || 
    stream.status === 'completed' || stream.tpStatus === 'COMPLETED' || stream.tpStatus === 'STOPPED'
  );

  // Filter tabs configuration - only show for leaf categories
  const filterTabs: FilterTab[] = React.useMemo(() => {
    if (!isLeafCategory) return [];
    
    return [
      { 
        id: 'video', 
        label: 'Video',
        icon: Video as unknown as React.ComponentType<{ size: number; color: string }>
      },
      { 
        id: 'pdf', 
        label: 'PDF',
        icon: FileText as unknown as React.ComponentType<{ size: number; color: string }>
      },
      { 
        id: 'test', 
        label: 'Test',
        icon: ClipboardList as unknown as React.ComponentType<{ size: number; color: string }>
      },
    ];
  }, [isLeafCategory]);

  // Filter content based on active tab
  const filteredContent = React.useMemo(() => {
    if (!isLeafCategory) return [];

    type ContentWithStream = ContentItem & { isStream?: boolean; stream?: Stream };

    const allContent: ContentWithStream[] = [
      // Add scheduled streams as video items
      ...scheduledStreams.map((stream: Stream) => ({
        _id: stream._id,
        title: stream.title,
        type: 'video' as const,
        video: {
          assetId: stream.tpAssetId || '',
          url: stream.hlsUrl || '',
        },
        isStream: true,
        stream: stream,
      } as ContentWithStream)),
      // Add regular content items
      ...contentItems.map(item => item as ContentWithStream),
    ];

    if (activeTab === 'video') {
      // Show all video content related to this chapter (including scheduled streams)
      return allContent.filter((item) => item.type === 'video');
    } else if (activeTab === 'pdf') {
      return allContent.filter((item) => item.type === 'pdf');
    } else if (activeTab === 'test') {
      // Test tab - return empty array to show "Coming Soon"
      return [];
    }

    return [];
  }, [isLeafCategory, activeTab, contentItems, scheduledStreams]);

  // Animated "Coming Soon" SVG Component for Test Tab
  const ComingSoonIllustration = () => {
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0.8)).current;
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      // Clock hand rotation
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulsing effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Scale animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Opacity animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0.4,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.9,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, []);

    const rotateInterpolate = rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const pulseScale = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.2],
    });

    const pulseOpacity = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1],
    });

    return (
      <View style={styles.comingSoonContainer}>
        <View style={{ width: moderateScale(200), height: moderateScale(200), position: 'relative' }}>
          <Svg
            width={moderateScale(200)}
            height={moderateScale(200)}
            viewBox="0 0 200 200"
            style={{ position: 'absolute' }}
          >
            {/* Background circle */}
            <Circle
              cx="100"
              cy="100"
              r="85"
              fill="#FFF9E6"
              opacity="0.6"
            />
            
            {/* Clock face */}
            <Circle
              cx="100"
              cy="100"
              r="60"
              fill="none"
              stroke="#FFD700"
              strokeWidth="3"
            />
            
            {/* Clock center */}
            <Circle
              cx="100"
              cy="100"
              r="5"
              fill="#FFD700"
            />
            
            {/* Clock numbers */}
            <G transform="translate(100, 100)">
              <SvgText
                x="0"
                y="-50"
                fontSize="16"
                fill="#FF9800"
                textAnchor="middle"
                fontWeight="bold"
              >
                <TSpan>12</TSpan>
              </SvgText>
              <SvgText
                x="45"
                y="5"
                fontSize="16"
                fill="#FF9800"
                textAnchor="middle"
                fontWeight="bold"
              >
                <TSpan>3</TSpan>
              </SvgText>
              <SvgText
                x="0"
                y="60"
                fontSize="16"
                fill="#FF9800"
                textAnchor="middle"
                fontWeight="bold"
              >
                <TSpan>6</TSpan>
              </SvgText>
              <SvgText
                x="-45"
                y="5"
                fontSize="16"
                fill="#FF9800"
                textAnchor="middle"
                fontWeight="bold"
              >
                <TSpan>9</TSpan>
              </SvgText>
            </G>
            
            {/* Hour hand (static) */}
            <G transform="translate(100, 100)">
              <Rect
                x="-2"
                y="-30"
                width="4"
                height="30"
                fill="#FF9800"
                rx="2"
              />
            </G>
          </Svg>
          
          {/* Animated minute hand */}
          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(100),
              top: moderateScale(100),
              transform: [{ rotate: rotateInterpolate }],
              transformOrigin: '0 0',
            }}
          >
            <Svg width={moderateScale(200)} height={moderateScale(200)}>
              <G transform="translate(0, 0)">
                <Rect
                  x={moderateScale(-1.5)}
                  y={moderateScale(0)}
                  width={moderateScale(3)}
                  height={moderateScale(50)}
                  fill="#FF9800"
                  rx={moderateScale(1.5)}
                />
              </G>
            </Svg>
          </Animated.View>
          
          {/* Pulsing notification badge */}
          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(140),
              top: moderateScale(60),
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            }}
          >
            <Svg width={moderateScale(30)} height={moderateScale(30)}>
              <Circle
                cx={moderateScale(15)}
                cy={moderateScale(15)}
                r={moderateScale(15)}
                fill="#FF5722"
              />
              <SvgText
                x={moderateScale(15)}
                y={moderateScale(20)}
                fontSize={moderateScale(14)}
                fill="#FFFFFF"
                textAnchor="middle"
                fontWeight="bold"
              >
                <TSpan>!</TSpan>
              </SvgText>
            </Svg>
          </Animated.View>
          
          {/* Animated stars */}
          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(50),
              top: moderateScale(40),
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            }}
          >
            <Svg width={moderateScale(20)} height={moderateScale(20)}>
              <Path
                d="M 10 0 L 12 8 L 20 10 L 12 12 L 10 20 L 8 12 L 0 10 L 8 8 Z"
                fill="#FFD700"
              />
            </Svg>
          </Animated.View>
          
          <Animated.View
            style={{
              position: 'absolute',
              left: moderateScale(150),
              top: moderateScale(150),
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            }}
          >
            <Svg width={moderateScale(16)} height={moderateScale(16)}>
              <Path
                d="M 8 0 L 9.5 6 L 16 8 L 9.5 10 L 8 16 L 6.5 10 L 0 8 L 6.5 6 Z"
                fill="#FFD700"
              />
            </Svg>
          </Animated.View>
        </View>
      </View>
    );
  };

  if (!category) {
    return (
      <GradientBackground>
        <ScreenHeader title="Category" showSearch={false} />
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            Category not found
          </Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <ScreenHeader
        title={category.name || 'Category Content'}
        showSearch={false}
      />
      {/* Filter Tabs - Only show for leaf categories */}
      {isLeafCategory && filterTabs.length > 0 && (
        <FilterTabs
          tabs={filterTabs}
          activeTab={activeTab}
          onTabChange={(tabId: string) => setActiveTab(tabId as ContentTabType)}
        />
      )}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Category Info */}
        {category && (
          <View style={[styles.categoryInfoCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.categoryTitle, { color: colors.text }]}>
              {category.name || 'Category'}
            </Text>
            {category.level !== undefined && category.level !== null && (
              <Text style={[styles.categoryLevel, { color: colors.textSecondary }]}>
                Level {category.level + 1}
              </Text>
            )}
          </View>
        )}

        {/* Subcategories */}
        {category?.children && Array.isArray(category.children) && category.children.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Subcategories
            </Text>
            {category.children.map((child) => {
              if (!child || !child._id) return null;
              return (
                <TouchableOpacity
                  key={child._id}
                  style={[styles.subcategoryCard, { backgroundColor: colors.cardBackground }]}
                  onPress={() => {
                    try {
                      (navigation as any).navigate('CategoryContent', {
                        category: child,
                        courseId,
                        courseName,
                      });
                    } catch (error) {
                      if (__DEV__) {
                        console.error('[CategoryContentScreen] Navigation error:', error);
                      }
                      toast.show({ text: 'Failed to navigate', type: 'error' });
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.subcategoryContent}>
                    <View style={[styles.subcategoryIcon, { backgroundColor: '#E3F2FD' }]}>
                      <SVGIcon
                        name="folder"
                        size={28}
                        color="#FF9800"
                      />
                    </View>
                    <View style={styles.subcategoryTextContainer}>
                      <Text style={[styles.subcategoryName, { color: colors.text }]}>
                        {child.name || 'Unnamed Category'}
                      </Text>
                      {child.children && Array.isArray(child.children) && child.children.length > 0 && (
                        <Text style={[styles.subcategoryCount, { color: colors.textSecondary }]}>
                          {child.children.length} subcategories
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Live Streams Section - Show only live streams */}
        {liveStreams.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Live Streams
            </Text>
            <FlatList
              data={liveStreams}
              renderItem={({ item }: { item: Stream }) => {
                if (!item || !item._id) return null;
                const isLive = item.status === 'live' || item.tpStatus === 'STREAMING';
                return (
                  <TouchableOpacity
                    style={[styles.contentCard, { backgroundColor: colors.cardBackground }]}
                    onPress={() => handleStreamPress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.contentIcon, { backgroundColor: '#FFEBEE' }]}>
                      <Radio size={28} color={isLive ? '#FF0000' : colors.primary} />
                    </View>
                    <View style={styles.contentInfo}>
                      <View style={styles.streamHeader}>
                        <Text style={[styles.contentTitle, { color: colors.text }]} numberOfLines={2}>
                          {item.title || 'Untitled Stream'}
                        </Text>
                        {isLive && (
                          <View style={[styles.liveBadge, { backgroundColor: '#FF0000' }]}>
                            <Text style={styles.liveBadgeText}>LIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.contentType, { color: colors.textSecondary }]}>
                        Live Now
                      </Text>
                      {item.description && (
                        <Text style={[styles.streamDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                          {item.description}
                        </Text>
                      )}
                    </View>
                    <View style={styles.contentAction}>
                      <Play size={20} color={colors.primary} />
                    </View>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item._id || `stream-${Math.random()}`}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Content Items (Videos/PDFs/Scheduled Streams) - Only show for leaf categories */}
        {isLeafCategory && (
          <View style={styles.section}>
            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading content...
                </Text>
              </View>
            ) : filteredContent.length > 0 ? (
              <FlatList
                data={filteredContent}
                renderItem={({ item }: { item: ContentItem & { isStream?: boolean; stream?: Stream } }) => {
                  if (!item || !item._id) return null;
                  
                  // Handle scheduled streams as videos
                  if (item.isStream && item.stream) {
                    // Use Hindi title from API if available
                    const hindiTitle = (item as any).hindiTitle || item.stream.description || '';
                    return (
                      <View style={styles.contentItemWrapper}>
                        <TouchableOpacity
                          style={[styles.contentCard, { backgroundColor: colors.cardBackground }]}
                          onPress={() => handleStreamPress(item.stream!)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.contentIcon, { backgroundColor: '#E3F2FD' }]}>
                            <View style={styles.playButtonContainer}>
                              <Play size={24} color="#FFFFFF" />
                            </View>
                          </View>
                          <View style={styles.contentInfo}>
                            <Text style={[styles.contentTitle, { color: colors.text }]} numberOfLines={2}>
                              {item.title || 'Untitled'}
                            </Text>
                            {hindiTitle ? (
                              <Text style={[styles.contentTitleHindi, { color: colors.text }]} numberOfLines={1}>
                                {hindiTitle}
                              </Text>
                            ) : null}
                            <Text style={[styles.contentType, { color: colors.textSecondary }]}>
                              Video
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  }
                  
                  // Handle regular content items
                  // Use Hindi title from API if available
                  const hindiTitle = item.hindiTitle || '';
                  // Find related PDF for video items
                  const relatedPdf = item.type === 'video' 
                    ? contentItems.find((content) => 
                        content.type === 'pdf' && 
                        content.title.toLowerCase().includes(item.title?.toLowerCase().split(' ')[0] || '')
                      )
                    : null;

                  return (
                    <View style={styles.contentItemWrapper}>
                      <TouchableOpacity
                        style={[styles.contentCard, { backgroundColor: colors.cardBackground }]}
                        onPress={() => handleContentPress(item)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.contentIcon,
                          { backgroundColor: item.type === 'video' ? '#E3F2FD' : '#FFF3E0' }
                        ]}>
                          {item.type === 'video' ? (
                            <View style={styles.playButtonContainer}>
                              <Play size={24} color="#FFFFFF" />
                            </View>
                          ) : (
                            <FileText size={28} color="#FF9800" />
                          )}
                        </View>
                        <View style={styles.contentInfo}>
                          <Text style={[styles.contentTitle, { color: colors.text }]} numberOfLines={2}>
                            {item.title || 'Untitled'}
                          </Text>
                          {hindiTitle ? (
                            <Text style={[styles.contentTitleHindi, { color: colors.text }]} numberOfLines={1}>
                              {hindiTitle}
                            </Text>
                          ) : null}
                          <Text style={[styles.contentType, { color: colors.textSecondary }]}>
                            {item.type === 'video' ? 'Video' : 'PDF Document'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      
                      {/* PDF Button for Video Items */}
                      {item.type === 'video' && relatedPdf && (
                        <TouchableOpacity
                          style={[styles.pdfButton, { backgroundColor: '#FFEBEE', borderColor: '#FF0000' }]}
                          onPress={() => handleContentPress(relatedPdf)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.pdfButtonContent}>
                            <FileText size={18} color="#FF9800" />
                            <View style={styles.pdfButtonText}>
                              <Text style={[styles.pdfButtonTitle, { color: colors.text }]} numberOfLines={1}>
                                {relatedPdf.title}
                              </Text>
                              {relatedPdf.hindiTitle ? (
                                <Text style={[styles.pdfButtonTitleHindi, { color: colors.text }]} numberOfLines={1}>
                                  {relatedPdf.hindiTitle}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }}
                keyExtractor={(item) => item._id || `item-${Math.random()}`}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : !loading ? (
              activeTab === 'test' ? (
                <View style={[styles.comingSoonCard, { backgroundColor: colors.cardBackground }]}>
                  <ComingSoonIllustration />
                  <Text style={[styles.comingSoonTitle, { color: colors.text }]}>
                    Coming Soon
                  </Text>
                  <Text style={[styles.comingSoonSubtitle, { color: colors.textSecondary }]}>
                    Tests feature will be available soon. Stay tuned!
                  </Text>
                </View>
              ) : (
                <View style={[styles.contentPlaceholder, { backgroundColor: colors.cardBackground }]}>
                  <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                    {`No ${activeTab === 'video' ? 'videos' : 'PDFs'} available`}
                  </Text>
                </View>
              )
            ) : null}
          </View>
        )}
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: getSpacing(2),
    paddingBottom: getSpacing(4),
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(4),
  },
  errorText: {
    fontSize: moderateScale(16),
    textAlign: 'center',
  },
  categoryInfoCard: {
    borderRadius: moderateScale(12),
    padding: getSpacing(2),
    marginBottom: getSpacing(2),
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  categoryTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    marginBottom: getSpacing(0.5),
  },
  categoryLevel: {
    fontSize: moderateScale(14),
  },
  section: {
    marginTop: getSpacing(2),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    marginBottom: getSpacing(1.5),
  },
  subcategoryCard: {
    borderRadius: moderateScale(12),
    padding: getSpacing(2),
    marginBottom: getSpacing(1.5),
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  subcategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subcategoryIcon: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getSpacing(2),
  },
  subcategoryTextContainer: {
    flex: 1,
  },
  subcategoryName: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: getSpacing(0.5),
  },
  subcategoryCount: {
    fontSize: moderateScale(12),
  },
  contentPlaceholder: {
    borderRadius: moderateScale(12),
    padding: getSpacing(3),
    minHeight: moderateScale(200),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  placeholderText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
  loadingContainer: {
    padding: getSpacing(3),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(150),
  },
  loadingText: {
    marginTop: getSpacing(1),
    fontSize: moderateScale(14),
  },
  contentItemWrapper: {
    marginBottom: getSpacing(1.5),
  },
  contentCard: {
    borderRadius: moderateScale(12),
    padding: getSpacing(2),
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  contentIcon: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getSpacing(2),
  },
  playButtonContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: getSpacing(0.25),
  },
  contentTitleHindi: {
    fontSize: moderateScale(15),
    fontWeight: '500',
    marginBottom: getSpacing(0.25),
  },
  contentType: {
    fontSize: moderateScale(12),
  },
  contentAction: {
    marginLeft: getSpacing(1),
  },
  pdfButton: {
    borderRadius: moderateScale(8),
    padding: getSpacing(1.5),
    marginTop: getSpacing(1),
    borderWidth: 1,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pdfButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pdfButtonText: {
    marginLeft: getSpacing(1.5),
    flex: 1,
  },
  pdfButtonTitle: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    marginBottom: getSpacing(0.25),
  },
  pdfButtonTitleHindi: {
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  streamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing(0.25),
    gap: getSpacing(1),
  },
  liveBadge: {
    paddingHorizontal: getSpacing(1),
    paddingVertical: getSpacing(0.25),
    borderRadius: moderateScale(4),
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  streamDescription: {
    fontSize: moderateScale(12),
    marginTop: getSpacing(0.25),
  },
  comingSoonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing(2),
  },
  comingSoonCard: {
    borderRadius: moderateScale(16),
    padding: getSpacing(4),
    marginTop: getSpacing(2),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: moderateScale(350),
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  comingSoonTitle: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    marginTop: getSpacing(2),
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: moderateScale(14),
    marginTop: getSpacing(1),
    textAlign: 'center',
    paddingHorizontal: getSpacing(4),
    lineHeight: moderateScale(20),
  },
});

export default CategoryContentScreen;

