import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import { getFontFamily } from '../utils/fonts';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import SVGIcon from '../components/SVGIcon';
import { CategoryNode } from '../services/api';
import type { MainStackParamList } from '../navigation/MainStack';

type CategoryLevelThirdScreenRouteProp = RouteProp<MainStackParamList, 'CategoryLevelThird'>;

const CategoryLevelThirdScreen: React.FC = () => {
  const theme = useTheme();
  const { colors } = theme;
  const navigation = useNavigation();
  const route = useRoute<CategoryLevelThirdScreenRouteProp>();
  const { categories, courseId, courseName, parentCategory } = route.params || {};

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback((searchText: string) => {
    setSearchQuery(searchText);
  }, []);

  const handleCategoryPress = useCallback(
    (category: CategoryNode) => {
      const hasChildren = category.children && category.children.length > 0;
      
      if (hasChildren) {
        // If still has children, navigate to content screen (shouldn't happen at level 3+)
        (navigation as any).navigate('CategoryContent', {
          category,
          courseId,
          courseName,
        });
      } else {
        // Navigate to content screen
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
    const displayCategories = categories || [];
    if (!searchQuery.trim()) return displayCategories;
    
    const query = searchQuery.toLowerCase();
    return displayCategories.filter((category: CategoryNode) => {
      const name = category?.name || '';
      return name.toLowerCase().includes(query);
    });
  }, [categories, searchQuery]);

  const renderCategoryItem = useCallback(
    ({ item }: { item: CategoryNode }) => {
      const hasChildren = item.children && item.children.length > 0;
      const hindiName = item.hindiName || '';

      return (
        <TouchableOpacity
          key={item._id}
          style={[
            styles.categoryItem,
            {
              backgroundColor: colors.cardBackground,
              marginLeft: getSpacing(2),
              marginRight: getSpacing(2),
              marginBottom: getSpacing(1.5),
            },
          ]}
          onPress={() => handleCategoryPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.categoryContent}>
            <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
              <SVGIcon
                name="folder"
                size={32}
                color="#FF9800"
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              {hindiName ? (
                <Text style={[styles.categoryNameHindi, { color: colors.text }]} numberOfLines={1}>
                  {hindiName}
                </Text>
              ) : null}
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
      {filteredCategories.length > 0 ? (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => setRefreshing(false)}
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
    paddingBottom: getSpacing(20),
  },
  categoryItem: {
    borderRadius: moderateScale(12),
    padding: getSpacing(2),
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginBottom: getSpacing(1.5),
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getSpacing(2),
  },
  textContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('600'),
    lineHeight: moderateScale(22),
    marginBottom: getSpacing(0.25),
  },
  categoryNameHindi: {
    fontSize: moderateScale(15),
    fontFamily: getFontFamily('500'),
    lineHeight: moderateScale(20),
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

export default CategoryLevelThirdScreen;

