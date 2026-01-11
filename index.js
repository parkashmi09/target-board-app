/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import messaging from '@react-native-firebase/messaging';

// Initialize i18n early
import './src/i18n';

// Register background handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  
  // Save notification to local storage for later display
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const stored = await AsyncStorage.getItem('@notifications');
    const notifications = stored ? JSON.parse(stored) : [];
    
    const newNotification = {
      id: remoteMessage.messageId || `notif_${Date.now()}_${Math.random()}`,
      title: remoteMessage.notification?.title || 'Notification',
      body: remoteMessage.notification?.body || '',
      data: remoteMessage.data || {},
      timestamp: remoteMessage.sentTime || Date.now(),
      read: false,
      messageId: remoteMessage.messageId,
    };
    
    // Check if already exists
    const exists = notifications.find(n => n.id === newNotification.id || n.messageId === newNotification.messageId);
    if (!exists) {
      notifications.unshift(newNotification);
      // Keep only last 100 notifications
      const limited = notifications.slice(0, 100);
      await AsyncStorage.setItem('@notifications', JSON.stringify(limited));
    }
  } catch (error) {
    console.error('Error saving background notification:', error);
  }
});

import App from './App';

AppRegistry.registerComponent(appName, () => App);
