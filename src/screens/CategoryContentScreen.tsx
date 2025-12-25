import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import { CategoryNode, fetchContentByCategory, ContentItem } from '../services/api';
import { FileText, Video, Play } from 'lucide-react-native';
import { useToast } from '../components/Toast';
import type { MainStackParamList } from '../navigation/MainStack';

type CategoryContentScreenRouteProp = RouteProp<MainStackParamList, 'CategoryContent'>;

const CategoryContentScreen: React.FC = () => {
  const theme = useTheme();
  const { colors } = theme;
  const navigation = useNavigation();
  const route = useRoute<CategoryContentScreenRouteProp>();
  const { category, courseId, courseName } = route.params || {};
  const toast = useToast();

  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
        (navigation as any).navigate('PDFViewer', {
          url: item.pdf.url,
          title: item.title || 'PDF Document',
          contentId: item._id,
        });
      } else if (item.type === 'video' && item.video?.assetId) {
        // Navigate to video player
        (navigation as any).navigate('StreamPlayer', {
          streamId: item._id,
          tpAssetId: item.video.assetId,
          hlsUrl: item.video.url,
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
                  <Text style={[styles.subcategoryName, { color: colors.text }]}>
                    {child.name || 'Unnamed Category'}
                  </Text>
                  {child.children && Array.isArray(child.children) && child.children.length > 0 && (
                    <Text style={[styles.subcategoryCount, { color: colors.textSecondary }]}>
                      {child.children.length} subcategories
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Content Items (Videos/PDFs) - Only show for leaf categories */}
        {isLeafCategory && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Content
            </Text>
            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading content...
                </Text>
              </View>
            ) : contentItems.length > 0 ? (
              <FlatList
                data={contentItems}
                renderItem={({ item }: { item: ContentItem }) => {
                  if (!item || !item._id) return null;
                  return (
                    <TouchableOpacity
                      style={[styles.contentCard, { backgroundColor: colors.cardBackground }]}
                      onPress={() => handleContentPress(item)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.contentIcon}>
                        {item.type === 'video' ? (
                          <Video size={24} color={colors.primary} />
                        ) : (
                          <FileText size={24} color={colors.primary} />
                        )}
                      </View>
                      <View style={styles.contentInfo}>
                        <Text style={[styles.contentTitle, { color: colors.text }]} numberOfLines={2}>
                          {item.title || 'Untitled'}
                        </Text>
                        <Text style={[styles.contentType, { color: colors.textSecondary }]}>
                          {item.type === 'video' ? 'Video' : 'PDF Document'}
                        </Text>
                      </View>
                      <View style={styles.contentAction}>
                        {item.type === 'video' ? (
                          <Play size={20} color={colors.primary} />
                        ) : (
                          <FileText size={20} color={colors.primary} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                keyExtractor={(item) => item._id || `item-${Math.random()}`}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : !loading ? (
              <View style={[styles.contentPlaceholder, { backgroundColor: colors.cardBackground }]}>
                <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                  No content available in this category
                </Text>
              </View>
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
    marginBottom: getSpacing(1),
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
  contentCard: {
    borderRadius: moderateScale(12),
    padding: getSpacing(2),
    marginBottom: getSpacing(1),
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  contentIcon: {
    marginRight: getSpacing(1.5),
  },
  contentInfo: {
    flex: 1,
  },
  contentTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: getSpacing(0.25),
  },
  contentType: {
    fontSize: moderateScale(12),
  },
  contentAction: {
    marginLeft: getSpacing(1),
  },
});

export default CategoryContentScreen;

