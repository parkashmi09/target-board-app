import React, { useMemo, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';

interface StreamChatBoxProps {
  chatEmbedUrl?: string;
  roomId?: string;
  username?: string;
  title?: string;
  onLoadComplete?: () => void;
}

const StreamChatBox: React.FC<StreamChatBoxProps> = ({
  chatEmbedUrl,
  roomId: propRoomId,
  username = 'Guest',
  title = 'Chat',
  onLoadComplete,
}) => {
  const theme = useTheme();

  /* -------------------- ROOM ID -------------------- */
  const roomId = useMemo(() => {
    if (propRoomId) return propRoomId;
    if (!chatEmbedUrl) return null;

    const match = chatEmbedUrl.match(/live-chat\/[^/]+\/([^/]+)/);
    return match?.[1] ?? null;
  }, [chatEmbedUrl, propRoomId]);

  /* -------------------- HTML -------------------- */
  const htmlContent = useMemo(() => {
    if (!roomId) return null;

    const esc = (v: string) =>
      v.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, maximum-scale=1"
/>

<link
  rel="stylesheet"
  href="https://static.tpstreams.com/static/css/live_chat_v1.css"
/>
<script src="https://static.tpstreams.com/static/js/live_chat_v1.umd.cjs"></script>

<style>
  html, body {
    margin: 0;
    padding: 0;
    height: 100%;
    background: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto;
  }

  #app {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* Chat layout */
  [class*="chat"] {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #ffffff;
  }

  /* Messages */
  [class*="messages"], main, [class*="message-list"], ul, ol {
    flex: 1;
    padding: 10px;
    overflow-y: auto !important;
    background: #f6f6f6;
    min-height: 200px;
    max-height: 100%;
  }
  
  /* Ensure message list items are visible */
  li, [role="listitem"], [class*="message-item"] {
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
    margin-bottom: 8px;
  }

  [class*="message"] {
    max-width: 100%;
    padding: 10px 14px;
    margin-bottom: 8px;
    border-radius: 14px;
    font-size: 14px;
    line-height: 1.4;
    word-break: break-word;
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* Own message */
  [class*="own"], [class*="sent"], [class*="user"] {
    margin-left: auto;
    margin-right: 0;
    background: #7b1fa2;
    color: #ffffff !important;
    border-bottom-right-radius: 4px;
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* Other message */
  [class*="received"], [class*="other"], [class*="incoming"] {
    margin-right: auto;
    margin-left: 0;
    background: #ffffff;
    color: #212121 !important;
    border: 1px solid #e0e0e0;
    border-bottom-left-radius: 4px;
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
  
  /* Message text visibility */
  [class*="message"] p,
  [class*="message"] span,
  [class*="message"] div,
  [class*="message"] * {
    color: inherit !important;
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* Username */
  [class*="username"], strong {
    font-size: 11px;
    opacity: 0.7;
    margin-bottom: 2px;
    display: block;
  }

  /* Input bar */
  form, [class*="input"], [class*="compose"] {
    display: flex;
    gap: 8px;
    padding: 8px;
    background: #ffffff;
    border-top: 1px solid #ddd;
    position: sticky;
    bottom: 0;
  }

  input, textarea {
    flex: 1;
    border-radius: 20px;
    border: 1px solid #ccc;
    padding: 10px 14px;
    font-size: 14px;
    outline: none;
  }

  input:focus, textarea:focus {
    border-color: #7b1fa2;
  }

  button[type="submit"] {
    background: #7b1fa2;
    color: #ffffff;
    border: none;
    border-radius: 20px;
    padding: 0 16px;
    font-size: 14px;
    font-weight: 600;
  }

  * {
    box-shadow: none !important;
  }
  
  /* Force visibility for all text elements */
  p, span, div, li, td, th, strong, b, em, i {
    color: inherit !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
  
  /* Ensure input and button are visible */
  input, textarea, button {
    opacity: 1 !important;
    visibility: visible !important;
  }
  
  /* Auto-scroll to bottom when new messages arrive */
  [class*="messages"] {
    scroll-behavior: smooth;
  }
</style>
</head>

<body>
  <div id="app"></div>

  <script>
    const config = {
      username: "${esc(username)}",
      roomId: "${esc(roomId)}",
      title: "${esc(title)}",
      autoJoin: true
    };

    let chatInstance = null;
    let isInitialized = false;

    function init() {
      if (window.TPStreamsChat) {
        try {
          chatInstance = TPStreamsChat.load(
            document.getElementById("app"),
            config
          );
          isInitialized = true;
          
          // Notify parent that chat is ready
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'chat_ready'
            }));
          }
          
          // Auto-scroll to bottom when messages are added
          const observer = new MutationObserver(function(mutations) {
            const messagesContainer = document.querySelector('[class*="messages"]') || 
                                     document.querySelector('main') ||
                                     document.getElementById("app");
            if (messagesContainer) {
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
          });
          
          // Observe changes in the app container
          const appElement = document.getElementById("app");
          if (appElement) {
            observer.observe(appElement, {
              childList: true,
              subtree: true
            });
          }
          
        } catch (error) {
          console.error('Chat initialization error:', error);
        }
      } else {
        setTimeout(init, 100);
      }
    }

    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", init)
      : init();
      
    // Also notify when page is fully loaded
    window.addEventListener('load', function() {
      if (isInitialized && window.ReactNativeWebView) {
        setTimeout(function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'chat_ready'
          }));
        }, 1000);
      }
    });
  </script>
</body>
</html>
    `;
  }, [roomId, username, title]);

  const htmlRef = useRef(htmlContent);
  if (htmlContent && htmlRef.current !== htmlContent) {
    htmlRef.current = htmlContent;
  }

  if (!roomId) {
    return (
      <View style={styles.placeholder}>
        <Text style={{ color: theme.colors.textSecondary }}>
          Chat not available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
    

      <WebView
        source={{ html: htmlRef.current || '' }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        keyboardDisplayRequiresUserAction={false}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        androidLayerType="hardware"
        originWhitelist={['*']}
        mixedContentMode="always"
        startInLoadingState
        showsVerticalScrollIndicator={false}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#7b1fa2" />
          </View>
        )}
        onLoadEnd={() => {
          // Notify parent that chat is loaded after a short delay
          if (onLoadComplete) {
            // Reduced delay for faster sync
            setTimeout(() => {
              onLoadComplete();
            }, 1000);
          }
        }}
        onMessage={(event) => {
          // Check if chat is initialized via message from WebView
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'chat_ready' && onLoadComplete) {
              // Chat SDK is ready, notify immediately
              onLoadComplete();
            }
          } catch (e) {
            // Not a JSON message, ignore
          }
        }}
      />
    </View>
  );
};

export default StreamChatBox;

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: {
    padding: getSpacing(1),
    backgroundColor: '#fff7e6',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  bannerText: {
    fontSize: moderateScale(12),
    color: '#333',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
