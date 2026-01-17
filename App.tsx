/**
 * TARGET BOARD Education App
 * React Native application with i18n, theming, Zustand state management, and navigation
 */

import React, { useEffect, useState, useRef } from 'react';
import { StatusBar, View, LogBox, Alert, Platform, PermissionsAndroid, InteractionManager } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import messaging from '@react-native-firebase/messaging';
import { ThemeProvider, useTheme } from './src/theme/theme';
import { useAuthStore } from './src/store';
import SplashScreen from './src/screens/SplashScreen';
import AuthStack from './src/navigation/AuthStack';
import MainStack from './src/navigation/MainStack';
import { ToastProvider } from './src/components/Toast';
import { GlobalLoaderProvider } from './src/components/GlobalLoader';
import ErrorBoundary from './src/components/ErrorBoundary';
import { queryClient } from './src/services/queryClient';
import { useNetworkStore } from './src/store/networkStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OfflineScreen from './src/components/OfflineScreen';
import AlertBox from './src/components/AlertBox';
import { checkAppVersion, openPlayStore, VersionInfo } from './src/services/versionCheck';
import './src/i18n';

// Initialize TPStreams
// @ts-ignore - react-native-tpstreams types may not be available
import { TPStreams } from 'react-native-tpstreams';
import { TPSTREAMS_ORG_ID } from './src/services/config';

TPStreams.initialize(TPSTREAMS_ORG_ID);

// Suppress InteractionManager deprecation warning from react-native-modal
// This is a third-party library issue and will be fixed when the library is updated
LogBox.ignoreLogs([
  'InteractionManager has been deprecated',
]);

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <SafeAreaProvider>
            <ToastProvider>
              <GlobalLoaderProvider>
                <AppContent />
              </GlobalLoaderProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const theme = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const { isLoggedIn, checkAuthStatus } = useAuthStore();
  const { initialize: initializeNetwork, isConnected, type, isWifi, isCellular, isEthernet } = useNetworkStore();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  
  // Check if app is offline
  // Only show offline UI when BOTH WiFi and mobile data are off (no active connection)
  // This prevents false positives when device is connected but isInternetReachable is temporarily false
  // Offline means: no WiFi, no cellular, no ethernet - truly disconnected
  const isOffline = !isConnected && type === 'none';

  // Firebase Cloud Messaging Setup
  useEffect(() => {
    // Request notification permission (only on first launch for Android)
    const requestPermission = async () => {
      try {
        // Check if permission has been requested before
        const permissionRequested = await AsyncStorage.getItem('@notification_permission_requested');
        
        if (permissionRequested === 'true') {
          if (__DEV__) {
            console.log('📱 Notification permission already requested before');
          }
          // Still try to get token if permission was granted previously
          try {
            const token = await messaging().getToken();
            if (__DEV__) {
              console.log('✅ FCM Token Retrieved:', token.substring(0, 50) + '...');
            }
          } catch (error) {
            if (__DEV__) {
              console.log('⚠️ No FCM token available (permission may have been denied)');
            }
          }
          return;
        }

        // For Android 13+ (API 33+), use PermissionsAndroid
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          try {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
              {
                title: 'Notification Permission',
                message: 'This app needs notification permission to send you important updates and alerts.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
              }
            );

            if (__DEV__) {
              console.log('📱 Android Notification Permission:', granted);
            }

            // Mark that permission has been requested
            await AsyncStorage.setItem('@notification_permission_requested', 'true');

            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
              // Get FCM token
              const token = await messaging().getToken();
              if (__DEV__) {
                console.log('✅ FCM Token Generated:', token);
                console.log('📱 Token Length:', token.length);
                console.log('🔑 Token (first 50 chars):', token.substring(0, 50) + '...');
              }
              // TODO: Send token to backend API when ready
              // await api.updateFCMToken(token);
            } else {
              if (__DEV__) {
                console.warn('⚠️ Android Notification Permission Denied');
              }
            }
          } catch (error) {
            if (__DEV__) {
              console.error('❌ Android Permission Request Error:', error);
            }
            // Mark as requested even if there was an error
            await AsyncStorage.setItem('@notification_permission_requested', 'true');
          }
        } else {
          // For iOS or Android < 13, use Firebase messaging permission
          const authStatus = await messaging().requestPermission();
          const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

          if (__DEV__) {
            console.log('Notification permission:', enabled ? 'Granted' : 'Denied');
          }

          // Mark that permission has been requested
          await AsyncStorage.setItem('@notification_permission_requested', 'true');

          if (enabled) {
            // Get FCM token
            const token = await messaging().getToken();
            if (__DEV__) {
              console.log('✅ FCM Token Generated:', token);
              console.log('📱 Token Length:', token.length);
              console.log('🔑 Token (first 50 chars):', token.substring(0, 50) + '...');
            }
            // TODO: Send token to backend API when ready
            // await api.updateFCMToken(token);
          } else {
            if (__DEV__) {
              console.warn('⚠️ FCM Permission Denied - Token not generated');
            }
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error('❌ FCM Permission Error:', error);
        }
        // Mark as requested even if there was an error
        try {
          await AsyncStorage.setItem('@notification_permission_requested', 'true');
        } catch (storageError) {
          // Silent error
        }
      }
    };

    // Handle foreground notifications
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      if (__DEV__) {
        console.log('📨 Foreground Notification Received:');
        console.log('   Title:', remoteMessage.notification?.title);
        console.log('   Body:', remoteMessage.notification?.body);
        console.log('   Data:', remoteMessage.data);
        console.log('   Full Message:', JSON.stringify(remoteMessage, null, 2));
      }
      
      // Save notification to local storage
      try {
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
        const exists = notifications.find((n: any) => n.id === newNotification.id || n.messageId === newNotification.messageId);
        if (!exists) {
          notifications.unshift(newNotification);
          // Keep only last 100 notifications
          const limited = notifications.slice(0, 100);
          await AsyncStorage.setItem('@notifications', JSON.stringify(limited));
          if (__DEV__) {
            console.log('✅ Notification saved to local storage');
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error('❌ Error saving foreground notification:', error);
        }
      }
      
      // Show alert for foreground notifications
      Alert.alert(
        remoteMessage.notification?.title || 'Notification',
        remoteMessage.notification?.body || 'New notification received',
        [{ text: 'OK' }]
      );
    });

    // Handle notification opened from background state
    const unsubscribeBackground = messaging().onNotificationOpenedApp(remoteMessage => {
      if (__DEV__) {
        console.log('🔔 Notification Opened from Background:');
        console.log('   Title:', remoteMessage.notification?.title);
        console.log('   Body:', remoteMessage.notification?.body);
        console.log('   Data:', remoteMessage.data);
        console.log('   Screen to navigate:', remoteMessage.data?.screen);
      }
      // Navigate to specific screen based on notification data
      if (navigationRef.current?.isReady()) {
        const screen = remoteMessage.data?.screen;
        if (screen) {
          try {
            // @ts-ignore - Dynamic navigation based on notification data
            navigationRef.current.navigate(screen, remoteMessage.data);
          } catch (error) {
            if (__DEV__) {
              console.error('Navigation error:', error);
            }
          }
        }
      }
    });

    // Handle notification opened from quit/killed state
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          if (__DEV__) {
            console.log('🔔 Notification Opened from Quit State:');
            console.log('   Title:', remoteMessage.notification?.title);
            console.log('   Body:', remoteMessage.notification?.body);
            console.log('   Data:', remoteMessage.data);
            console.log('   Screen to navigate:', remoteMessage.data?.screen);
          }
          // Navigate to specific screen based on notification data
          // Use setTimeout to ensure navigation is ready
          setTimeout(() => {
            if (navigationRef.current?.isReady()) {
              const screen = remoteMessage.data?.screen;
              if (screen) {
                try {
                  // @ts-ignore - Dynamic navigation based on notification data
                  navigationRef.current.navigate(screen, remoteMessage.data);
                } catch (error) {
                  if (__DEV__) {
                    console.error('Navigation error:', error);
                  }
                }
              }
            }
          }, 1000);
        }
      });

    // Handle token refresh
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async token => {
      if (__DEV__) {
        console.log('🔄 FCM Token Refreshed:', token);
        console.log('📱 New Token Length:', token.length);
        console.log('🔑 New Token (first 50 chars):', token.substring(0, 50) + '...');
      }
      // TODO: Send new token to backend API when ready
      // await api.updateFCMToken(token);
    });

    // Request permission on first launch only (Android)
    if (Platform.OS === 'android') {
      // Small delay to ensure app is fully initialized
      setTimeout(() => {
        requestPermission();
      }, 1500);
    }

    // Cleanup
    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
      unsubscribeTokenRefresh();
    };
  }, []);

  useEffect(() => {
    // Initialize network monitoring
    initializeNetwork();

    // Check auth status on mount
    try {
      checkAuthStatus();
    } catch (error) {
      if (__DEV__) {
        console.error('Error checking auth status:', error);
      }
    }

    // Initialize app
    const initializeApp = async () => {
      try {
        // Add any initialization logic here (prefetching, etc.)
        // Network check is already done by initializeNetwork()
        
        // Simulate minimum initialization time for smooth UX
        await new Promise<void>(resolve => setTimeout(() => resolve(), 1000));
      } catch (error) {
        if (__DEV__) {
          console.warn('App initialization failed:', error);
        }
      } finally {
        // Use InteractionManager to ensure all interactions are complete
        // This prevents navigation crashes when fragment is not ready
        InteractionManager.runAfterInteractions(() => {
          // Additional small delay for smooth transition and fragment attachment
          setTimeout(() => {
            setShowSplash(false);
          }, 300);
        });
      }
    };

    try {
      initializeApp();
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to initialize app:', error);
      }
      setTimeout(() => setShowSplash(false), 300);
    }
  }, [checkAuthStatus, initializeNetwork]);

  // Version check - runs after splash screen is hidden
  useEffect(() => {
    if (!showSplash && isConnected) {
      const performVersionCheck = async () => {
        try {
          const versionCheckResult = await checkAppVersion();
          
          if (versionCheckResult && versionCheckResult.needsUpdate) {
            if (__DEV__) {
              console.log('[App] Update required:', versionCheckResult);
            }
            setVersionInfo(versionCheckResult);
            setShowUpdateAlert(true);
          } else if (__DEV__) {
            console.log('[App] App is up to date or version check skipped');
          }
        } catch (error) {
          if (__DEV__) {
            console.error('[App] Error during version check:', error);
          }
          // Silently fail - don't block app usage if version check fails
        }
      };

      // Small delay to ensure app is fully loaded before checking version
      const timeoutId = setTimeout(() => {
        performVersionCheck();
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [showSplash, isConnected]);

  return (
    <>
      <NavigationContainer
        ref={navigationRef}
        theme={{
          dark: theme.isDark,
          colors: {
            primary: theme.colors.accent,
            background: theme.colors.background,
            card: theme.colors.cardBackground,
            text: theme.colors.text,
            border: theme.colors.border,
            notification: theme.colors.accent,
          },
        }}
      >
        <StatusBar 
          barStyle={theme.isDark ? 'light-content' : 'dark-content'} 
          backgroundColor={theme.colors.background}
        />
        {showSplash ? (
          <SplashScreen />
        ) : isLoggedIn ? (
          <MainStack />
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
      {/* Show offline screen when app is offline */}
      {!showSplash && isOffline && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
          <OfflineScreen />
        </View>
      )}
      
      {/* Version Update Alert */}
      <AlertBox
        visible={showUpdateAlert}
        onClose={() => {
          // If it's a force update, don't allow closing
          if (versionInfo?.isForceUpdate) {
            return;
          }
          setShowUpdateAlert(false);
        }}
        title="Update Available"
        message={
          versionInfo?.updateMessage ||
          `A new version (${versionInfo?.latestVersion}) of the app is available. Please update to continue using the app.`
        }
        confirmText="Update Now"
        cancelText={versionInfo?.isForceUpdate ? undefined : "Later"}
        onConfirm={async () => {
          await openPlayStore();
          // Don't close if it's a force update
          if (!versionInfo?.isForceUpdate) {
            setShowUpdateAlert(false);
          }
        }}
        onCancel={() => {
          if (!versionInfo?.isForceUpdate) {
            setShowUpdateAlert(false);
          }
        }}
        type="info"
        icon="download"
      />
    </>
  );
}

export default App;
