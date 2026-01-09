import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
  BackHandler,
} from 'react-native';
import { ChevronLeft, X, Search } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';

interface ScreenHeaderProps {
  title?: string;
  showSearch?: boolean;
  placeholder?: string;
  defaultValue?: string;
  rightComponent?: React.ReactNode;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showSearch = true,
  placeholder = 'Search',
  defaultValue = '',
  rightComponent,
}) => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const backgroundColor = isDark ? colors.background : colors.yellow;

  const [searchText, setSearchText] = useState(defaultValue);
  const [isSearchActive, setIsSearchActive] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;

  /* ---------------- SMART BACK LOGIC ---------------- */

  const goHomeOrBack = useCallback(() => {
    const state = navigation.getState();
    if (!state || !state.routes) return true;

    const currentRoute = state.routes[state.index];

    // Case 1: HomeStack
    if (currentRoute.name === 'HomeStack') {
      const stackState = currentRoute.state;

      // Inside HomeStack (not HomeScreen)
      if (stackState?.index > 0) {
        navigation.goBack();
        return true;
      }

      // Already HomeScreen → refresh
      navigation.navigate('HomeStack', {
        screen: 'HomeScreen',
        params: { refresh: Date.now() },
      });
      return true;
    }

    // Case 2: Any other tab → Home
    navigation.navigate('HomeStack', {
      screen: 'HomeScreen',
      params: { refresh: Date.now() },
    });

    return true;
  }, [navigation]);

  /* Android hardware back */
  useFocusEffect(
    useCallback(() => {
      const onBack = () => goHomeOrBack();
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [goHomeOrBack])
  );

  /* ---------------- SEARCH ANIMATION ---------------- */

  useEffect(() => {
    setSearchText(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (!showSearch) setIsSearchActive(false);
  }, [showSearch]);

  useEffect(() => {
    if (isSearchActive) {
      slideAnim.setValue(-screenWidth);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => inputRef.current?.focus(), 80);
      });
    } else {
      Animated.timing(slideAnim, {
        toValue: -screenWidth,
        duration: 220,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [isSearchActive, screenWidth]);

  /* ---------------- HANDLERS ---------------- */

  const handleBackPress = () => {
    if (isSearchActive) {
      setIsSearchActive(false);
      setSearchText('');
      return;
    }
    goHomeOrBack();
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
  };

  const closeSearch = () => {
    setIsSearchActive(false);
    setSearchText('');
  };

  /* ---------------- UI ---------------- */

  if (!showSearch) {
    return (
      <View style={[styles.header, { backgroundColor }]}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <ChevronLeft size={moderateScale(26)} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>

        <View style={styles.rightPlaceholder}>{rightComponent}</View>
      </View>
    );
  }

  return (
    <View style={[styles.headerContainer, { backgroundColor }]}>
      {/* NORMAL HEADER */}
      {!isSearchActive && (
        <View style={[styles.header, { backgroundColor }]}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <ChevronLeft size={moderateScale(24)} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>

          <View style={styles.rightIcons}>
            {rightComponent}
            <TouchableOpacity
              onPress={() => setIsSearchActive(true)}
              style={styles.iconButton}
            >
              <Search size={moderateScale(22)} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* SEARCH HEADER */}
      <Animated.View
        pointerEvents={isSearchActive ? 'auto' : 'none'}
        style={[
          styles.searchHeader,
          {
            backgroundColor: colors.cardBackground,
            transform: [{ translateX: slideAnim }],
            opacity: isSearchActive ? 1 : 0,
          },
        ]}
      >
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <ChevronLeft size={moderateScale(24)} color={colors.text} />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          value={searchText}
          onChangeText={handleSearchChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.searchInput,
            { color: colors.text, backgroundColor: colors.background },
          ]}
          returnKeyType="search"
        />

        <TouchableOpacity onPress={closeSearch} style={styles.iconButton}>
          <X size={moderateScale(20)} color={colors.textSecondary} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default ScreenHeader;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  headerContainer: {
    marginTop: getSpacing(4),
    minHeight: moderateScale(56),
    position: 'relative',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: getSpacing(2),
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(1.5),
  },
  backButton: {
    padding: getSpacing(0.5),
    marginRight: getSpacing(1),
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: moderateScale(18),
    fontWeight: '700',
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightPlaceholder: {
    width: moderateScale(40),
    alignItems: 'flex-end',
  },
  iconButton: {
    padding: getSpacing(0.5),
    marginLeft: getSpacing(1),
  },
  searchHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(1.5),
    borderRadius: moderateScale(8),
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16),
    paddingHorizontal: getSpacing(1.5),
    borderRadius: moderateScale(8),
    minHeight: moderateScale(36),
  },
});
