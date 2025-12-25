import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import SVGIcon from '../SVGIcon';
import { Images } from '../../assets/images';
import LottieView from 'lottie-react-native';
import liveAnimation from '../../assets/lotties/live.json';

export type CategoryTab = 'all' | 'live' | 'notes';

interface CategoryTabsProps {
  activeTab?: CategoryTab; // Optional since tabs are not selectable
}

interface TabConfig {
  id: CategoryTab;
  label: string;
  icon: string;
}

const CategoryTabs: React.FC<CategoryTabsProps> = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Handle tab press and navigate to corresponding screen
  const handleTabPress = (tabId: CategoryTab) => {
    switch (tabId) {
      case 'all':
        // Stay on Home - no navigation needed
        navigation.navigate('Batches');
        break;
      case 'live':
        // Navigate to ClassStreamsScreen
        navigation.navigate('ClassStreamsScreen');
        break;
      case 'notes':
        // Navigate to Notes screen
        navigation.navigate('Notes');
        break;
    }
  };

  // Pulse animation for NEW badge
  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, [pulseAnim]);

  const tabs: TabConfig[] = [
    {
      id: 'all', // Using 'all' for Free Batches to keep ID consistent if used elsewhere, or I should change it. Let's keep 'all' but label it Free Batches.
      label: 'All Courses',
      icon: 'course',
    },
    {
      id: 'live',
      label: 'Live Class',
      icon: 'live',
    },
    {
      id: 'notes', // Using 'notes' for Recorded Batches
      label: 'Notes',
      icon: 'notes',
    },
  ];

  // Get tab colors
  const getTabColors = (tabId: CategoryTab) => {
    if (tabId === 'live') {
      // Live Batches - Peach bg, Red icon circle
      return {
        backgroundColor: '#FFF5E6', // Light peach
        iconBgColor: '#fff', // Red
        iconColor: '#FFFFFF', // White icon
        textColor: '#000000',
        borderColor: '#FFF5E6',
      };
    }

    if (tabId === 'all') {
      // Free Batches - White bg, Dark icon circle
      return {
        backgroundColor: '#FFFFFF',
        iconBgColor: '#1A1A2E', // Dark blue/black
        iconColor: '#FFFFFF',
        textColor: '#000000',
        borderColor: theme.colors.border,
      };
    }

    // Recorded Batches (notes) - White bg, Cyan icon circle
    return {
      backgroundColor: '#FFFFFF',
      iconBgColor: '#06B6D4', // Cyan
      iconColor: '#FFFFFF',
      textColor: '#000000',
      borderColor: theme.colors.border,
    };
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const colors = getTabColors(tab.id);

        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => handleTabPress(tab.id)}
            activeOpacity={0.7}
            style={[
              styles.tab,
              {
                backgroundColor: colors.backgroundColor,
                borderColor: colors.borderColor,
                borderWidth: tab.id === 'live' ? 0 : 1,
                shadowColor: '#000',
                shadowOpacity: 0.1,
              },
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: colors.iconBgColor,
                },
              ]}
            >
              {tab.id === 'live' ? (
                <LottieView
                  source={liveAnimation}
                  style={{
                    width: moderateScale(80),
                    height: moderateScale(80),
                  }}
                  autoPlay
                  loop
                />
              ) : (
                <SVGIcon
                  name={tab.icon}
                  size={moderateScale(24)}
                  color={colors.iconColor}
                />
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: colors.textColor,
                  fontSize: moderateScale(12),
                  fontFamily: theme.typography.body.fontFamily,
                  fontWeight: '600',
                  marginTop: getSpacing(0.5),
                },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
            {tab.id === 'live' && (
              <Animated.View
                style={[
                  styles.newBadge,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <Image
                  source={Images.NEW_BADGE}
                  style={styles.newBadgeImage}
                  resizeMode="contain"
                />
              </Animated.View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    // paddingHorizontal: getSpacing(2),
    // paddingVertical: getSpacing(2.5),
    gap: getSpacing(1.5),
  },
  tab: {
    flex: 1,
    borderRadius: moderateScale(12),
    paddingVertical: getSpacing(2),
    paddingHorizontal: getSpacing(1),
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: 1,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    position: 'relative',
    overflow: 'visible',
  },
  iconContainer: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24), // Circle
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    marginBottom: getSpacing(0.5),
  },
  tabLabel: {
    textAlign: 'center',
    letterSpacing: 0.3,
    zIndex: 1,
  },
  newBadge: {
    position: 'absolute',
    top: moderateScale(-4),
    right: moderateScale(-4),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  newBadgeImage: {
    width: moderateScale(36),
    height: moderateScale(36),
  },
});

export default CategoryTabs;
