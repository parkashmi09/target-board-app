import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import SVGIcon from '../components/SVGIcon';
import { fetchCategoryTree, CategoryNode } from '../services/api';
import type { MainStackParamList } from '../navigation/MainStack';

type CategoriesScreenRouteProp = RouteProp<MainStackParamList, 'Categories'>;

const CategoriesScreen: React.FC = () => {
  const theme = useTheme();
  const { colors } = theme;
  const navigation = useNavigation();
  const route = useRoute<CategoriesScreenRouteProp>();
  const { courseId, courseName, parentCategory } = route.params || {};

  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCategories = useCallback(async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      const data = await fetchCategoryTree(courseId);
      setCategories(data);
    } catch (error) {
      if (__DEV__) {
        console.error('[CategoriesScreen] Error loading categories:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadCategories();
  }, [loadCategories]);

  const handleSearch = useCallback((searchText: string) => {
    setSearchQuery(searchText);
  }, []);

  const handleCategoryPress = useCallback(
    (category: CategoryNode) => {
      const hasChildren = category.children && category.children.length > 0;
      
      if (hasChildren) {
        // If category has children, navigate to show subcategories in same screen
        (navigation as any).navigate('Categories', {
          courseId,
          courseName: category.name,
          parentCategory: category,
        });
      } else {
        // If no children, navigate to content screen
        (navigation as any).navigate('CategoryContent', {
          category,
          courseId,
          courseName,
        });
      }
    },
    [navigation, courseId, courseName]
  );

  // Filter categories based on search
  const filteredCategories = React.useMemo(() => {
    const displayCategories = parentCategory?.children || categories;
    if (!searchQuery.trim()) return displayCategories;
    
    const query = searchQuery.toLowerCase();
    return displayCategories.filter((category: CategoryNode) => {
      const name = category?.name || '';
      return name.toLowerCase().includes(query);
    });
  }, [categories, parentCategory, searchQuery]);

  const renderCategoryItem = useCallback(
    ({ item }: { item: CategoryNode }) => {
      const hasChildren = item.children && item.children.length > 0;

      return (
        <TouchableOpacity
          key={item._id}
          style={[
            styles.categoryItem,
            {
              backgroundColor: colors.cardBackground,
              marginLeft: getSpacing(2),
              marginRight: getSpacing(2),
              marginBottom: getSpacing(1),
            },
          ]}
          onPress={() => handleCategoryPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.categoryContent}>
            <View style={styles.iconContainer}>
              <SVGIcon
                name="folder"
                size={28}
                color="#FF9800"
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={2}>
                {item.name}
              </Text>
              {hasChildren && (
                <Text style={[styles.subcategoryHint, { color: colors.textSecondary }]}>
                  {item.children?.length} subcategories
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [colors, handleCategoryPress]
  );

  return (
    <GradientBackground>
      <ScreenHeader
        title={parentCategory?.name || courseName || 'Categories'}
        showSearch={true}
        placeholder="Search categories..."
        onSearch={handleSearch}
        defaultValue={searchQuery}
      />
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading categories...
          </Text>
        </View>
      ) : filteredCategories.length > 0 ? (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery ? 'No categories found matching your search' : 'No categories available'}
          </Text>
        </View>
      )}
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingTop: getSpacing(2),
    marginTop: getSpacing(4),
    paddingBottom: getSpacing(18),
  },
  categoryItem: {
    borderRadius: moderateScale(12),
    padding: getSpacing(1.5),
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: getSpacing(1),
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: getSpacing(1.5),
  },
  textContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    lineHeight: moderateScale(20),
  },
  subcategoryHint: {
    fontSize: moderateScale(12),
    marginTop: getSpacing(0.25),
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(4),
  },
  loadingText: {
    marginTop: getSpacing(2),
    fontSize: moderateScale(14),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(4),
    minHeight: moderateScale(400),
  },
  emptyText: {
    fontSize: moderateScale(16),
    textAlign: 'center',
  },
});

export default CategoriesScreen;

