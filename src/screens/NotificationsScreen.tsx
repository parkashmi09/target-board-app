import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
} from 'react-native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import { getFontFamily } from '../utils/fonts';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import SVGIcon from '../components/SVGIcon';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';

const NOTIFICATIONS_STORAGE_KEY = '@notifications';
const READ_NOTIFICATIONS_KEY = '@read_notifications';

interface Notification {
  id: string;
  title: string;
  body: string;
  data?: any;
  timestamp: number;
  read: boolean;
  messageId?: string;
}

const NotificationsScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from storage
  const loadNotifications = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      const readIds = await AsyncStorage.getItem(READ_NOTIFICATIONS_KEY);
      const readSet = readIds ? new Set(JSON.parse(readIds)) : new Set();

      if (stored) {
        const parsed: Notification[] = JSON.parse(stored);
        // Mark notifications as read based on stored read IDs
        const updated = parsed.map(notif => ({
          ...notif,
          read: readSet.has(notif.id),
        }));
        // Sort by timestamp (newest first)
        updated.sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(updated);
        setUnreadCount(updated.filter(n => !n.read).length);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error loading notifications:', error);
      }
    }
  }, []);

  // Save notifications to storage
  const saveNotifications = useCallback(async (notifs: Notification[]) => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs));
    } catch (error) {
      if (__DEV__) {
        console.error('Error saving notifications:', error);
      }
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const readIds = await AsyncStorage.getItem(READ_NOTIFICATIONS_KEY);
      const readSet = readIds ? new Set(JSON.parse(readIds)) : new Set();
      readSet.add(notificationId);
      await AsyncStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(readSet)));

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      if (__DEV__) {
        console.error('Error marking notification as read:', error);
      }
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const allIds = notifications.map(n => n.id);
      await AsyncStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(allIds));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      if (__DEV__) {
        console.error('Error marking all as read:', error);
      }
    }
  }, [notifications]);

  // Helper function to add notification from message
  const addNotificationFromMessage = useCallback((remoteMessage: any) => {
    const newNotification: Notification = {
      id: remoteMessage.messageId || `notif_${Date.now()}_${Math.random()}`,
      title: remoteMessage.notification?.title || 'Notification',
      body: remoteMessage.notification?.body || '',
      data: remoteMessage.data || {},
      timestamp: remoteMessage.sentTime || Date.now(),
      read: false,
      messageId: remoteMessage.messageId,
    };

    setNotifications(prev => {
      const exists = prev.find(n => n.id === newNotification.id || n.messageId === newNotification.messageId);
      if (exists) return prev;

      const updated = [newNotification, ...prev];
      saveNotifications(updated);
      return updated;
    });
    setUnreadCount(prev => prev + 1);

    // Navigate if screen is specified in data
    if (remoteMessage.data?.screen) {
      setTimeout(() => {
        try {
          navigation.navigate(remoteMessage.data.screen, remoteMessage.data);
        } catch (error) {
          if (__DEV__) {
            console.error('Navigation error:', error);
          }
        }
      }, 500);
    }
  }, [navigation, saveNotifications]);

  // Handle foreground notifications
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      if (__DEV__) {
        console.log('📨 New notification received in NotificationsScreen:', remoteMessage);
      }
      addNotificationFromMessage(remoteMessage);
    });

    return unsubscribe;
  }, [addNotificationFromMessage]);

  // Handle notification opened from background/quit state
  useEffect(() => {
    // Check for notification that opened the app
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          if (__DEV__) {
            console.log('📨 Notification opened app from quit state:', remoteMessage);
          }
          addNotificationFromMessage(remoteMessage);
        }
      });

    // Handle notification opened from background
    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      if (__DEV__) {
        console.log('📨 Notification opened app from background:', remoteMessage);
      }
      addNotificationFromMessage(remoteMessage);
    });

    return unsubscribe;
  }, [addNotificationFromMessage]);

  // Load notifications on mount and focus
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <ScreenHeader
          showSearch={false}
          title="Notifications"
          rightElement={
            unreadCount > 0 ? (
              <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                <Text style={[styles.markAllText, { color: theme.colors.accent }]}>
                  Mark all read
                </Text>
              </TouchableOpacity>
            ) : null
          }
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.accent]}
              tintColor={theme.colors.accent}
            />
          }
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <SVGIcon name="bell" size={moderateScale(64)} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No notifications yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                You'll see your notifications here
              </Text>
            </View>
          ) : (
            notifications.map((notification, index) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                theme={theme}
                onPress={() => {
                  markAsRead(notification.id);
                  // Navigate if screen is specified in notification data
                  if (notification.data?.screen) {
                    setTimeout(() => {
                      try {
                        navigation.navigate(notification.data.screen, notification.data);
                      } catch (error) {
                        if (__DEV__) {
                          console.error('Navigation error:', error);
                        }
                      }
                    }, 300);
                  }
                }}
                formatTime={formatTime}
                index={index}
              />
            ))
          )}
        </ScrollView>
      </View>
    </GradientBackground>
  );
};

interface NotificationItemProps {
  notification: Notification;
  theme: any;
  onPress: () => void;
  formatTime: (timestamp: number) => string;
  index: number;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  theme,
  onPress,
  formatTime,
  index,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={[
          styles.notificationItem,
          {
            backgroundColor: notification.read
              ? theme.colors.cardBackground
              : theme.colors.background,
            borderLeftColor: notification.read ? 'transparent' : theme.colors.accent,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text
              style={[
                styles.notificationTitle,
                {
                  color: theme.colors.text,
                  fontFamily: notification.read
                    ? getFontFamily('500')
                    : getFontFamily('600'),
                },
              ]}
              numberOfLines={2}
            >
              {notification.title}
            </Text>
            {!notification.read && (
              <View style={[styles.unreadDot, { backgroundColor: theme.colors.accent }]} />
            )}
          </View>
          <Text
            style={[styles.notificationBody, { color: theme.colors.textSecondary }]}
            numberOfLines={3}
          >
            {notification.body}
          </Text>
          <Text style={[styles.notificationTime, { color: theme.colors.textSecondary }]}>
            {formatTime(notification.timestamp)}
          </Text>
        </View>
        <SVGIcon
          name="chevron-right"
          size={moderateScale(16)}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: getSpacing(2),
    paddingBottom: getSpacing(4),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getSpacing(8),
  },
  emptyText: {
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('600'),
    marginTop: getSpacing(2),
  },
  emptySubtext: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('400'),
    marginTop: getSpacing(1),
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: getSpacing(2),
    marginBottom: getSpacing(1.5),
    borderRadius: moderateScale(8),
    borderLeftWidth: 3,
  },
  notificationContent: {
    flex: 1,
    marginRight: getSpacing(1),
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getSpacing(0.5),
  },
  notificationTitle: {
    fontSize: moderateScale(16),
    flex: 1,
    marginRight: getSpacing(1),
  },
  unreadDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
  },
  notificationBody: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('400'),
    marginBottom: getSpacing(0.5),
    lineHeight: moderateScale(20),
  },
  notificationTime: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('400'),
    marginTop: getSpacing(0.5),
  },
  markAllButton: {
    paddingHorizontal: getSpacing(1.5),
    paddingVertical: getSpacing(0.5),
  },
  markAllText: {
    fontSize: moderateScale(14),
    fontFamily: getFontFamily('600'),
  },
});

export default NotificationsScreen;

