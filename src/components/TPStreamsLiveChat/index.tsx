import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, InteractionManager, ActivityIndicator, ViewStyle } from 'react-native';
// @ts-ignore - react-native-tpstreams types may not be available
import { TPStreamsLiveChat } from 'react-native-tpstreams';
import { useTheme } from '../../theme/theme';
import { moderateScale } from '../../utils/responsive';

interface TPStreamsLiveChatComponentProps {
  username: string;
  roomId: string;
  title?: string;
  /** Custom container style */
  containerStyle?: ViewStyle;
  /** Enable dark mode styling */
  enableDarkMode?: boolean;
  /** Custom primary color override */
  primaryColor?: string;
  /** Custom background color override */
  backgroundColor?: string;
  /** Custom text color override */
  textColor?: string;
  /** Custom font size multiplier (default: 1) */
  fontSizeMultiplier?: number;
  /** Custom CSS to inject for advanced styling */
  customCSS?: string;
}

const TPStreamsLiveChatComponent: React.FC<TPStreamsLiveChatComponentProps> = ({
  username,
  roomId,
  title = 'Live Chat',
  containerStyle,
  enableDarkMode,
  primaryColor,
  backgroundColor,
  textColor,
  fontSizeMultiplier = 1,
  customCSS,
}) => {
  const { colors, isDark } = useTheme();
  const [isReady, setIsReady] = useState(false);

  // Determine if we should use dark mode
  const shouldUseDarkMode = enableDarkMode !== undefined ? enableDarkMode : isDark;

  // Memoized color configuration with custom overrides
  const chatColors = useMemo(() => {
    const basePrimary = primaryColor || colors.primary || '#9C27B0';
    const baseBackground = backgroundColor || (shouldUseDarkMode ? '#1A1A2E' : colors.background || '#FFFFFF');
    const baseText = textColor || (shouldUseDarkMode ? '#FFFFFF' : colors.text || '#000000');
    const baseInputBg = shouldUseDarkMode ? '#2A2A3E' : colors.cardBackground || '#F5F5F5';
    const baseBorder = shouldUseDarkMode ? '#3A3A4E' : colors.border || '#E0E0E0';

    return {
      primary: basePrimary,
      background: baseBackground,
      text: baseText,
      inputBackground: baseInputBg,
      border: baseBorder,
    };
  }, [colors, shouldUseDarkMode, primaryColor, backgroundColor, textColor]);

  // Memoized typography configuration
  const chatTypography = useMemo(() => {
    const baseFontSize = moderateScale(14) * fontSizeMultiplier;
    return {
      fontSize: baseFontSize,
      fontFamily: 'System',
      fontWeight: '500' as const,
      lineHeight: baseFontSize * 1.4,
    };
  }, [fontSizeMultiplier]);

  // Enhanced custom CSS with theme-aware styling
  const enhancedCustomCSS = useMemo(() => {
    const baseCSS = customCSS || '';
    const themeCSS = `
      /* Enhanced Chat UI Customization */
      [class*="message"] {
        border-radius: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all 0.2s ease;
      }
      
      [class*="own"], [class*="sent"], [class*="user"] {
        background: ${chatColors.primary} !important;
        color: ${shouldUseDarkMode ? '#FFFFFF' : '#FFFFFF'} !important;
        border-bottom-right-radius: 4px;
        margin-left: 20%;
        margin-right: 0;
      }
      
      [class*="received"], [class*="other"], [class*="incoming"] {
        background: ${shouldUseDarkMode ? '#2A2A3E' : '#FFFFFF'} !important;
        color: ${chatColors.text} !important;
        border: 1px solid ${chatColors.border} !important;
        border-bottom-left-radius: 4px;
        margin-right: 20%;
        margin-left: 0;
      }
      
      [class*="messages"], main, [class*="message-list"] {
        background: ${chatColors.background} !important;
        padding: 12px;
      }
      
      input, textarea {
        background: ${chatColors.inputBackground} !important;
        color: ${chatColors.text} !important;
        border-color: ${chatColors.border} !important;
        border-radius: 24px;
        padding: 12px 16px;
        font-size: ${chatTypography.fontSize}px;
      }
      
      input:focus, textarea:focus {
        border-color: ${chatColors.primary} !important;
        box-shadow: 0 0 0 3px ${chatColors.primary}33;
      }
      
      button[type="submit"] {
        background: ${chatColors.primary} !important;
        color: ${shouldUseDarkMode ? '#FFFFFF' : '#FFFFFF'} !important;
        border-radius: 24px;
        padding: 12px 20px;
        font-weight: 600;
        transition: all 0.2s ease;
      }
      
      button[type="submit"]:active {
        transform: scale(0.95);
        opacity: 0.9;
      }
      
      [class*="username"], strong {
        font-size: ${chatTypography.fontSize * 0.8}px;
        opacity: 0.8;
        font-weight: 600;
      }
      
      /* Smooth scrolling */
      [class*="messages"] {
        scroll-behavior: smooth;
      }
      
      /* Custom scrollbar for webkit browsers */
      [class*="messages"]::-webkit-scrollbar {
        width: 6px;
      }
      
      [class*="messages"]::-webkit-scrollbar-track {
        background: ${chatColors.background};
      }
      
      [class*="messages"]::-webkit-scrollbar-thumb {
        background: ${chatColors.border};
        border-radius: 3px;
      }
      
      [class*="messages"]::-webkit-scrollbar-thumb:hover {
        background: ${chatColors.primary};
      }
    `;
    return `${baseCSS}\n${themeCSS}`;
  }, [chatColors, chatTypography, shouldUseDarkMode, customCSS]);

  // Debug import (DEV only)
  useEffect(() => {
    if (__DEV__) {
      console.log('[TPStreamsLiveChatComponent] TPStreamsLiveChat:', TPStreamsLiveChat);
      console.log('[TPStreamsLiveChatComponent] roomId:', roomId);
      console.log('[TPStreamsLiveChatComponent] username:', username);
    }
  }, [roomId, username]);

  // Delay rendering of the chat component until the navigation transition is complete
  useEffect(() => {
    // Only delay if we have valid roomId and SDK is available
    if (!roomId || !TPStreamsLiveChat) {
      return;
    }

    const task = InteractionManager.runAfterInteractions(() => {
      setIsReady(true);
    });

    return () => task.cancel();
  }, [roomId]);

  // 🚨 Guard: SDK not loaded
  if (!TPStreamsLiveChat) {
    return (
      <View style={styles.center}>
        <Text style={[styles.errorText, { color: 'red' }]}>
          TPStreams Live Chat SDK not available
        </Text>
      </View>
    );
  }

  // 🚨 Guard: missing roomId
  if (!roomId) {
    return (
      <View style={styles.center}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          Chat room ID not available
        </Text>
      </View>
    );
  }

  // Show loading indicator while waiting for interactions to complete
  if (!isReady) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary || '#9C27B0'} />
      </View>
    );
  }

  return (
    <View style={[styles.chatContainer, containerStyle]}>
      <TPStreamsLiveChat
        username={username}
        roomId={roomId}
        title={title}
        colors={chatColors}
        typography={chatTypography}
        customCSS={enhancedCustomCSS}
        style={styles.chat}
        onChatReady={() => {
          if (__DEV__) {
            console.log('[TPStreamsLiveChatComponent] Chat ready');
          }
        }}
        onChatError={(error: any) => {
          console.error('[TPStreamsLiveChatComponent] Chat error:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(16),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: moderateScale(8),
  },
  chat: {
    flex: 1,
  },
  errorText: {
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
});

export default TPStreamsLiveChatComponent;
