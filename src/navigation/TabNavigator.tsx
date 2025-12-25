import React, { useMemo, useCallback } from 'react';
import { View, Image, StyleSheet, Platform, TouchableOpacity, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import SVGIcon from '../components/SVGIcon';
import { Images } from '../assets/images';
import { getFocusedRouteNameFromRoute, useNavigation } from '@react-navigation/native';

import HomeStack from './HomeStack';
import MyCourseScreen from '../screens/MyCourseScreen';
import BatchesScreen from '../screens/BatchesScreen';
import NotesScreen from '../screens/NotesScreen';
import TestsScreen from '../screens/TestsScreen';

const Tab = createBottomTabNavigator();

// Custom Tab Icon with conditional label - Memoized for performance
const TabIcon = React.memo(({ name, label, focused, theme }: any) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', top: Platform.OS === 'ios' ? 10 : 0 }}>
    <SVGIcon
      name={name}
      size={24}
      color={focused ? theme.colors.secondaryText : theme.colors.text}
    />
    {!focused && (
      <Text style={{
        color: theme.colors.text,
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4
      }}>
        {label}
      </Text>
    )}
  </View>
));

TabIcon.displayName = 'TabIcon';

// Dynamic Tab Button that floats when active - Memoized for performance
const ResponsiveTabBarButton = React.memo(({ children, onPress, accessibilityState, theme, label, shouldFloat }: any) => {
  const focused = accessibilityState?.selected;

  if (focused) {
    return (
      <TouchableOpacity
        style={{
          top: shouldFloat ? -24 : 0, // Float up when active
          justifyContent: 'center',
          alignItems: 'center',
          ...styles.shadow,
        }}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View
          style={{
            width: moderateScale(65), // Increased size to fit label
            height: moderateScale(65),
            borderRadius: moderateScale(32.5),
            backgroundColor: theme.colors.secondary,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 4,
            borderColor: theme.colors.background, // Create cutout effect
          }}
        >
          {children}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onPress={onPress}
      activeOpacity={1}
    >
      {children}
    </TouchableOpacity>
  );
});

ResponsiveTabBarButton.displayName = 'ResponsiveTabBarButton';

const TabNavigator: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  // Memoize getTabBarStyle to prevent unnecessary recalculations
  const getTabBarStyle = useCallback((route: any) => {
    // Get the focused route name from nested stack navigators
    const routeName = getFocusedRouteNameFromRoute(route) ?? route.name;
    
    // For HomeStack, check the nested route
    let focusedRouteName = routeName;
    if (route.name === 'HomeStack' && route.params) {
      // Try to get the nested route from params if available
      const nestedRoute = route.params.screen || route.params.routeName;
      if (nestedRoute) {
        focusedRouteName = nestedRoute;
      }
    }
    
    const isStreamPlayer = focusedRouteName === 'StreamPlayer';
    
    if (isStreamPlayer) {
      return {
        position: 'absolute' as const,
        bottom: getSpacing(2),
        left: getSpacing(2),
        right: getSpacing(2),
        height: 0,
        opacity: 0,
        pointerEvents: 'none' as const,
      };
    }
    
    return {
      position: 'absolute' as const,
      bottom: getSpacing(2),
      left: getSpacing(2),
      right: getSpacing(2),
      backgroundColor: theme.isDark ? theme.colors.cardBackground : '#FFFFFF',
      borderRadius: moderateScale(20),
      height: moderateScale(70),
      borderTopWidth: 0,
      opacity: 1,
      ...styles.shadow,
    };
  }, [theme.isDark, theme.colors.cardBackground]);

  // Memoize handleTabPress to prevent recreation on every render
  const handleTabPress = useCallback((tabName: string, initialScreen?: string) => {
    return (e: any) => {
      const state = navigation.getState();
      if (!state || !state.routes || state.index === undefined) {
        return;
      }
      
      const currentRoute = state.routes[state.index];
      
      // If clicking on the same tab
      if (currentRoute && currentRoute.name === tabName) {
        // For stack navigators, reset to initial screen if not already there
        if (tabName === 'HomeStack') {
          const homeStackState = currentRoute.state;
          if (homeStackState && typeof homeStackState.index === 'number' && homeStackState.index > 0) {
            e.preventDefault();
            // Reset HomeStack to HomeScreen
            (navigation as any).navigate('HomeStack', {
              screen: 'HomeScreen',
            });
            return;
          }
        }
        // For other direct screens, allow default behavior (stays on same screen)
      } else {
        // Navigating to a different tab - ensure proper navigation
        // Default navigation will handle switching tabs
      }
    };
  }, [navigation]);

  // Memoize handleDirectScreenTabPress to prevent recreation on every render
  const handleDirectScreenTabPress = useCallback((screenName: string) => {
    return (e: any) => {
      const state = navigation.getState();
      if (!state || !state.routes || state.index === undefined) {
        return;
      }
      
      const currentRoute = state.routes[state.index];
      
      // If not already on this screen, ensure navigation happens
      if (!currentRoute || currentRoute.name !== screenName) {
        // Default navigation will handle this, but we ensure it works
        // Don't prevent default - let React Navigation handle it
      }
      // If already on this screen, default behavior keeps it there (which is correct)
    };
  }, [navigation]);

  // Memoize screen options to prevent recreation
  const screenOptions = useMemo(() => ({
    headerShown: true,
    headerStyle: {
      backgroundColor: theme.colors.background,
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerTitle: () => (
      <Image
        source={Images.TB_LOGO}
        style={{
          width: moderateScale(120),
          height: moderateScale(32),
        }}
        resizeMode="contain"
      />
    ),
    headerTitleAlign: 'center' as const,
    headerTitleStyle: {
      fontSize: moderateScale(18),
      fontWeight: 'bold' as const,
      color: theme.colors.text,
    },
    tabBarShowLabel: false, // Hide default labels, we handle them in TabIcon
  }), [theme.colors.background, theme.colors.border, theme.colors.text]);

  // Memoize tab icon and button functions to prevent recreation
  const homeTabIcon = useCallback(({ focused }: { focused: boolean }) => (
    <TabIcon name="home" label={t('navigation.home') || 'Home'} focused={focused} theme={theme} />
  ), [t, theme]);

  const homeTabButton = useCallback((props: any) => (
    <ResponsiveTabBarButton {...props} theme={theme} label={t('navigation.home') || 'Home'} shouldFloat={false} />
  ), [t, theme]);

  const myCourseTabIcon = useCallback(({ focused }: { focused: boolean }) => (
    <TabIcon name="course" label={t('navigation.myCourse') || 'My Course'} focused={focused} theme={theme} />
  ), [t, theme]);

  const myCourseTabButton = useCallback((props: any) => (
    <ResponsiveTabBarButton {...props} theme={theme} label={t('navigation.myCourse') || 'My Course'} shouldFloat={false} />
  ), [t, theme]);

  const batchesTabIcon = useCallback(({ focused }: { focused: boolean }) => (
    <TabIcon name="classes" label={t('navigation.batches') || 'Batches'} focused={focused} theme={theme} />
  ), [t, theme]);

  const batchesTabButton = useCallback((props: any) => (
    <ResponsiveTabBarButton {...props} theme={theme} label={t('navigation.batches') || 'Batches'} shouldFloat={true} />
  ), [t, theme]);

  const notesTabIcon = useCallback(({ focused }: { focused: boolean }) => (
    <TabIcon name="notes" label={t('navigation.notes') || 'Notes'} focused={focused} theme={theme} />
  ), [t, theme]);

  const notesTabButton = useCallback((props: any) => (
    <ResponsiveTabBarButton {...props} theme={theme} label={t('navigation.notes') || 'Notes'} shouldFloat={false} />
  ), [t, theme]);

  const testsTabIcon = useCallback(({ focused }: { focused: boolean }) => (
    <TabIcon name="tests" label={t('navigation.tests') || 'Tests'} focused={focused} theme={theme} />
  ), [t, theme]);

  const testsTabButton = useCallback((props: any) => (
    <ResponsiveTabBarButton {...props} theme={theme} label={t('navigation.tests') || 'Tests'} shouldFloat={false} />
  ), [t, theme]);

  // Memoize listeners to prevent recreation
  const homeTabPress = useMemo(() => handleTabPress('HomeStack', 'HomeScreen'), [handleTabPress]);
  const myCourseTabPress = useMemo(() => handleDirectScreenTabPress('MyCourse'), [handleDirectScreenTabPress]);
  const batchesTabPress = useMemo(() => handleDirectScreenTabPress('Batches'), [handleDirectScreenTabPress]);
  const notesTabPress = useMemo(() => handleDirectScreenTabPress('Notes'), [handleDirectScreenTabPress]);
  const testsTabPress = useMemo(() => handleDirectScreenTabPress('Tests'), [handleDirectScreenTabPress]);

  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={({ route }) => ({
        ...screenOptions,
        tabBarStyle: getTabBarStyle(route),
      })}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStack}
        options={{
          headerShown: false,
          tabBarIcon: homeTabIcon,
          tabBarButton: homeTabButton,
        }}
        listeners={{
          tabPress: homeTabPress,
        }}
      />
      <Tab.Screen
        name="MyCourse"
        component={MyCourseScreen}
        options={{
          tabBarIcon: myCourseTabIcon,
          tabBarButton: myCourseTabButton,
          headerShown: false,
        }}
        listeners={{
          tabPress: myCourseTabPress,
        }}
      />
      <Tab.Screen
        name="Batches"
        component={BatchesScreen}
        options={{
          tabBarIcon: batchesTabIcon,
          tabBarButton: batchesTabButton,
          headerShown: false,
        }}
        listeners={{
          tabPress: batchesTabPress,
        }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          tabBarIcon: notesTabIcon,
          tabBarButton: notesTabButton,
          headerShown: false,
        }}
        listeners={{
          tabPress: notesTabPress,
        }}
      />
      <Tab.Screen
        name="Tests"
        component={TestsScreen}
        options={{
          tabBarIcon: testsTabIcon,
          tabBarButton: testsTabButton,
          headerShown: false,
        }}
        listeners={{
          tabPress: testsTabPress,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 8,
  },
});

export default TabNavigator;

