import React, { useEffect, useRef, useState, useContext, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainStack';
import { useTheme, ThemeContext } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import SVGIcon from '../SVGIcon';
import CustomToggle from '../CustomToggle';
import { useUIStore } from '../../store';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
  id?: string | number;
  _id?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  image?: string | null;
  city?: string;
  city_id?: number;
  state_id?: number;
  classId?: string;
  class_id?: number | string;
  stateBoardId?: string;
  isOnboarded?: boolean;
  onboardingStep?: number;
}

const Drawer: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.isDark;
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  // Safely get toggleTheme from context
  const themeContext = useContext(ThemeContext);
  const toggleTheme = themeContext?.toggleTheme || (() => {});

  const { t } = useTranslation();
  const { isDrawerOpen, setDrawerOpen } = useUIStore();
  const [userData, setUserData] = useState<UserData | null>(null);
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const isTogglingRef = useRef(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    // Reload user data when drawer opens to get latest data
    if (isDrawerOpen) {
      loadUserData();
    }
  }, [isDrawerOpen]);

  const loadUserData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const user = JSON.parse(userDataStr);
        setUserData(user);
      }
    } catch (error) {
      // Silent error handling
      setUserData(null);
    }
  };

  const getInitials = useCallback((name?: string) => {
    if (!name) return 'U';
    const trimmed = name.trim();
    if (!trimmed) return 'U';
    const names = trimmed.split(' ').filter(n => n.length > 0);
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return trimmed[0].toUpperCase();
  }, []);

  const userDisplayName = useMemo(() => {
    if (!userData) return 'Guest User';
    return userData.name || userData.fullName || 'Guest User';
  }, [userData]);

  const userContact = useMemo(() => {
    if (!userData) return '';
    return userData.email || userData.phone || userData.mobile || '';
  }, [userData]);

  const userInitials = useMemo(() => {
    return getInitials(userDisplayName);
  }, [userDisplayName, getInitials]);

  useEffect(() => {
    if (isDrawerOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isDrawerOpen, slideAnim, backdropOpacity]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, [setDrawerOpen]);

  const renderDrawerItem = (icon: string, label: string, onPress?: () => void, rightIcon: string = 'chevron-right') => (
    <TouchableOpacity
      style={styles.drawerItem}
      onPress={onPress || closeDrawer}
      activeOpacity={0.7}
    >
      <View style={styles.drawerItemLeft}>
        <SVGIcon
          name={icon}
          size={moderateScale(20)}
          color={theme.colors.text}
        />
        <Text
          style={[
            styles.drawerItemText,
            {
              color: theme.colors.text,
              fontSize: moderateScale(16),
              marginLeft: getSpacing(1.5),
            },
          ]}
        >
          {label}
        </Text>
      </View>
      <SVGIcon
        name={rightIcon}
        size={moderateScale(18)}
        color={theme.colors.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isDrawerOpen}
      transparent
      animationType="none"
      onRequestClose={closeDrawer}
    >
      <TouchableWithoutFeedback onPress={closeDrawer}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.drawer,
          {
            backgroundColor: theme.colors.cardBackground,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* Drawer Header - Only Close Button */}
        <View
          style={[
            styles.drawerHeader,
            {
              backgroundColor: theme.colors.cardBackground,
              paddingTop: getSpacing(2),
              paddingBottom: getSpacing(1),
              paddingHorizontal: getSpacing(2),
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
            },
          ]}
        >
          <TouchableOpacity
            onPress={closeDrawer}
            style={styles.closeButton}
          >
            <SVGIcon
              name="close"
              size={moderateScale(24)}
              color={theme.colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Drawer Items */}
        <ScrollView
          style={styles.drawerContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Profile Section */}
          <View
            style={[
              styles.profileSection,
              {
                backgroundColor: 'transparent',
                padding: getSpacing(2),
                marginBottom: getSpacing(1),
              },
            ]}
          >
            <View style={styles.profileImageContainer}>
              {userData?.image ? (
                <Image
                  source={{ uri: userData.image }}
                  style={[
                    styles.profileImage,
                    {
                      width: moderateScale(60),
                      height: moderateScale(60),
                      borderRadius: moderateScale(30),
                    },
                  ]}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.profileInitials,
                    {
                      backgroundColor: theme.colors.accent,
                      width: moderateScale(60),
                      height: moderateScale(60),
                      borderRadius: moderateScale(30),
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: moderateScale(24),
                      fontWeight: 'bold',
                      color: '#000000',
                    }}
                  >
                    {userInitials}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.userName,
                {
                  color: theme.colors.text,
                  fontSize: moderateScale(16),
                  fontWeight: 'bold',
                  marginTop: getSpacing(1),
                  textAlign: 'center',
                },
              ]}
            >
              {userDisplayName}
            </Text>
            <Text
              style={[
                styles.userEmail,
                {
                  color: theme.colors.textSecondary,
                  fontSize: moderateScale(12),
                  marginTop: getSpacing(0.5),
                  textAlign: 'center',
                },
              ]}
            >
              {userContact}
            </Text>
          </View>

          {/* Divider */}
          <View
            style={[
              styles.divider,
              {
                backgroundColor: theme.colors.border,
                marginVertical: getSpacing(1),
                marginHorizontal: getSpacing(2),
              },
            ]}
          />

          {/* Dark Theme Toggle */}
          <View
            style={[
              styles.drawerItem,
              {
                paddingHorizontal: getSpacing(2),
                justifyContent: 'space-between',
              },
            ]}
          >
            <View style={styles.drawerItemLeft}>
              <SVGIcon
                name={isDark ? 'moon' : 'sun'}
                size={moderateScale(20)}
                color={theme.colors.text}
              />
              <Text
                style={[
                  styles.drawerItemText,
                  {
                    color: theme.colors.text,
                    fontSize: moderateScale(16),
                    marginLeft: getSpacing(1.5),
                  },
                ]}
              >
                {t('common.darkMode') || 'Dark Mode'}
              </Text>
            </View>
            <CustomToggle
              value={isDark}
              onValueChange={(newValue) => {
                if (isTogglingRef.current || !toggleTheme) return;
                if (newValue !== isDark) {
                  isTogglingRef.current = true;
                  toggleTheme();
                  setTimeout(() => {
                    isTogglingRef.current = false;
                  }, 300);
                }
              }}
              activeColor={theme.colors.accent || '#FFD700'}
              inactiveColor="#E0E0E0"
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Menu Items */}
          {renderDrawerItem('download', t('drawer.downloads') || 'Downloads', () => {
            closeDrawer();
            navigation.navigate('Downloads' as any);
          })}
          {renderDrawerItem('course', t('drawer.myCourses') || 'My Courses', () => {
            closeDrawer();
            navigation.navigate('MyCourse' as any);
          })}
          {renderDrawerItem('notes', t('drawer.notes') || 'Notes', () => {
            closeDrawer();
            navigation.navigate('Notes' as any);
          })}
          {renderDrawerItem('help', t('drawer.help') || 'Help', () => {
            closeDrawer();
            navigation.navigate('Help' as any);
          })}
          {renderDrawerItem('share', t('drawer.share') || 'Share', async () => {
            closeDrawer();
            try {
              await Share.share({
                message: 'Check out this app!',
              });
            } catch (error) {
              // Ignore
            }
          })}

          {/* Settings Item */}
          {renderDrawerItem('settings', t('drawer.settings') || 'Settings', () => {
            closeDrawer();
            navigation.navigate('Settings');
          })}


        </ScrollView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: moderateScale(280),
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  drawerHeader: {
    borderBottomWidth: 0,
  },
  closeButton: {
    padding: getSpacing(1),
  },
  drawerContent: {
    flex: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getSpacing(1.5),
    paddingHorizontal: getSpacing(2),
  },
  drawerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  drawerItemText: {
    fontWeight: '500',
  },
  logoutButton: {
    marginBottom: getSpacing(2),
  },
  logoutText: {
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
  },
  profileImageContainer: {
    marginBottom: getSpacing(0.5),
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profileInitials: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontWeight: 'bold',
  },
  userEmail: {
    fontWeight: '400',
  },
  divider: {
    height: 1,
  },
  settingsSection: {
    marginTop: getSpacing(0.5),
  },
  sectionTitle: {
    fontWeight: '600',
  },
  languageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  languageButton: {
    alignItems: 'center',
  },
  languageButtonText: {
    fontWeight: '600',
  },
});

export default Drawer;
