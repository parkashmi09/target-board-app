/**
 * TARGET BOARD Education App
 * React Native application with i18n, theming, Zustand state management, and navigation
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
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
import { useLoaderStore } from './src/store/loaderStore';
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
  const [isInitializing, setIsInitializing] = useState(true);
  const { isLoggedIn, checkAuthStatus } = useAuthStore();
  const { initialize: initializeNetwork } = useNetworkStore();
  const { show: showLoader, hide: hideLoader } = useLoaderStore();

  useEffect(() => {
    // Show global loader during initialization (without message)
    showLoader();

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
        await new Promise<void>(resolve => setTimeout(() => resolve(), 800));
      } catch (error) {
        if (__DEV__) {
          console.warn('App initialization failed:', error);
        }
      } finally {
        setIsInitializing(false);
        hideLoader();
        
        // Hide splash after initialization
        setTimeout(() => {
          setShowSplash(false);
        }, 200); // Small delay for smooth transition
      }
    };

    try {
      initializeApp();
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to initialize app:', error);
      }
      setIsInitializing(false);
      hideLoader();
      setTimeout(() => setShowSplash(false), 200);
    }
  }, [checkAuthStatus, initializeNetwork, showLoader, hideLoader]);

  return (
    <NavigationContainer
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
  );
}

export default App;
