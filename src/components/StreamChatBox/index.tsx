import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../../theme/theme';

interface StreamChatBoxProps {
    chatEmbedUrl?: string;
    username?: string;
    title?: string;
}

const StreamChatBox: React.FC<StreamChatBoxProps> = ({ 
    chatEmbedUrl, 
    username = 'Guest',
    title = 'Chat'
}) => {
    const theme = useTheme();
    const { isDark } = theme;

    // Extract room ID from chatEmbedUrl
    // From API response: "chatEmbedUrl": "https://app.tpstreams.com/live-chat/kuepke/4nAjs6Nr4aB/"
    // The roomId is: "4nAjs6Nr4aB" (extracted from the URL path)
    const roomId = useMemo(() => {
        if (!chatEmbedUrl) {
            if (__DEV__) {
                console.log('[StreamChatBox] No chatEmbedUrl provided');
            }
            return null;
        }

        if (__DEV__) {
            console.log('[StreamChatBox] Extracting roomId from:', chatEmbedUrl);
        }

        // Extract room ID from URL pattern: /live-chat/{orgId}/{roomId}/
        // Examples:
        // - "https://app.tpstreams.com/live-chat/kuepke/4nAjs6Nr4aB/"
        // - "/live-chat/kuepke/4nAjs6Nr4aB/"
        // - "4nAjs6Nr4aB"
        
        // Try multiple patterns to extract roomId
        let urlMatch = chatEmbedUrl.match(/live-chat\/[^\/]+\/([^\/]+)/);
        if (!urlMatch) {
            // Try pattern without leading slash
            urlMatch = chatEmbedUrl.match(/live-chat[^\/]+\/([^\/]+)/);
        }
        
        if (urlMatch && urlMatch[1]) {
            // Remove trailing slash if present and trim
            const extractedRoomId = urlMatch[1].replace(/\/$/, '').trim();
            if (__DEV__) {
                console.log('[StreamChatBox] Extracted roomId:', extractedRoomId);
            }
            return extractedRoomId;
        }

        // If it's just a room ID without URL structure
        if (!chatEmbedUrl.includes('/') && !chatEmbedUrl.startsWith('http')) {
            if (__DEV__) {
                console.log('[StreamChatBox] Using chatEmbedUrl as roomId:', chatEmbedUrl);
            }
            return chatEmbedUrl;
        }

        if (__DEV__) {
            console.warn('[StreamChatBox] Could not extract roomId from:', chatEmbedUrl);
        }
        return null;
    }, [chatEmbedUrl]);

    // Create HTML content with TPStreams Chat SDK
    // Using the exact simple pattern from the example
    const htmlContent = useMemo(() => {
        if (!roomId) {
            return null;
        }

        // Escape values for HTML to prevent XSS
        const escapedUsername = username.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const escapedRoomId = roomId.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const escapedTitle = title.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link rel="stylesheet" href="https://static.tpstreams.com/static/css/live_chat_v1.css">
                <script src="https://static.tpstreams.com/static/js/live_chat_v1.umd.cjs"></script>
                <style>
                    body { 
                        margin: 0; 
                        background-color: #000;
                        -webkit-touch-callout: none;
                        -webkit-user-select: none;
                        user-select: none;
                    }
                    #app {
                        width: 100%;
                        height: 100%;
                        pointer-events: auto;
                        touch-action: manipulation;
                    }
                    * {
                        -webkit-tap-highlight-color: transparent;
                    }
                    /* Hide SDK's join form and auto-join */
                    [class*="join-form"],
                    [id*="join-form"],
                    [class*="joinForm"],
                    [id*="joinForm"],
                    .chat-join-form,
                    .join-form,
                    form[class*="join"],
                    div[class*="join"]:not([class*="joined"]) {
                        display: none !important;
                        visibility: hidden !important;
                        opacity: 0 !important;
                        height: 0 !important;
                        overflow: hidden !important;
                    }
                </style>
            </head>
            <body>
                <div id="app"></div>
                <script>
                    // Override console methods to send logs to React Native
                    const originalLog = console.log;
                    const originalError = console.error;
                    console.log = function(...args) {
                        originalLog.apply(console, args);
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', data: args.join(' ') }));
                        }
                    };
                    console.error = function(...args) {
                        originalError.apply(console, args);
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', data: args.join(' ') }));
                        }
                    };
                    
                    console.log('[ChatSDK] Initializing chat with config:', {
                        username: "${escapedUsername}",
                        roomId: "${escapedRoomId}",
                        title: "${escapedTitle}"
                    });
                    
                    const config = {
                        username: "${escapedUsername}",
                        roomId: "${escapedRoomId}",
                        title: "${escapedTitle}",
                        autoJoin: true
                    };
                    
                    let retryCount = 0;
                    const maxRetries = 50; // 5 seconds max wait
                    let chatInstance = null;
                    
                    function autoJoinChat() {
                        console.log('[ChatSDK] Attempting to auto-join chat...');
                        const appElement = document.querySelector("#app");
                        if (!appElement) return false;
                        
                        // Try multiple methods to join
                        // Method 1: Find and fill the join form, then submit
                        const allInputs = appElement.querySelectorAll('input[type="text"], input[type="email"], input:not([type="hidden"])');
                        const allButtons = appElement.querySelectorAll('button, [role="button"], [onclick]');
                        
                        let joinInput = null;
                        let joinButton = null;
                        
                        // Find input that looks like a name input
                        for (let input of allInputs) {
                            const placeholder = (input.placeholder || '').toLowerCase();
                            const name = (input.name || '').toLowerCase();
                            if (placeholder.includes('name') || placeholder.includes('enter') || name.includes('name') || name.includes('user')) {
                                joinInput = input;
                                break;
                            }
                        }
                        
                        // Find button that looks like a join button
                        for (let button of allButtons) {
                            const text = (button.textContent || button.innerText || '').toLowerCase();
                            if (text.includes('join') || text.includes('enter')) {
                                joinButton = button;
                                break;
                            }
                        }
                        
                        if (joinInput && joinButton) {
                            console.log('[ChatSDK] Found join form, auto-filling and submitting...');
                            joinInput.focus();
                            joinInput.value = "${escapedUsername}";
                            
                            // Trigger events to ensure SDK recognizes the input
                            joinInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                            joinInput.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                            joinInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true }));
                            
                            // Wait a bit then click join
                            setTimeout(() => {
                                joinButton.focus();
                                joinButton.click();
                                console.log('[ChatSDK] Join button clicked');
                            }, 150);
                            return true;
                        }
                        
                        // Method 2: Try calling join method on chat instance
                        if (chatInstance) {
                            if (typeof chatInstance.join === 'function') {
                                console.log('[ChatSDK] Calling chatInstance.join()');
                                try {
                                    chatInstance.join("${escapedUsername}");
                                    console.log('[ChatSDK] join() called successfully');
                                    return true;
                                } catch (e) {
                                    console.error('[ChatSDK] join() error:', e);
                                }
                            }
                            
                            if (typeof chatInstance.autoJoin === 'function') {
                                console.log('[ChatSDK] Calling chatInstance.autoJoin()');
                                try {
                                    chatInstance.autoJoin();
                                    console.log('[ChatSDK] autoJoin() called successfully');
                                    return true;
                                } catch (e) {
                                    console.error('[ChatSDK] autoJoin() error:', e);
                                }
                            }
                        }
                        
                        return false;
                    }
                    
                    // Watch for join form to appear and auto-join
                    const observer = new MutationObserver((mutations) => {
                        const appElement = document.querySelector("#app");
                        if (!appElement) return;
                        
                        // Check if join form exists
                        const hasJoinForm = appElement.querySelector('input[type="text"], input[placeholder*="name"], input[placeholder*="Name"]');
                        if (hasJoinForm) {
                            console.log('[ChatSDK] Join form detected, attempting auto-join...');
                            if (autoJoinChat()) {
                                observer.disconnect();
                            }
                        }
                    });
                    
                    function init() {
                        console.log('[ChatSDK] Init function called, checking for TPStreamsChat... (attempt ' + (retryCount + 1) + ')');
                        if (window.TPStreamsChat) {
                            console.log('[ChatSDK] TPStreamsChat found, loading...');
                            try {
                                chatInstance = new TPStreamsChat.load(document.querySelector("#app"), config);
                                console.log('[ChatSDK] Chat instance created successfully');
                                console.log('[ChatSDK] Chat instance:', chatInstance);
                                
                                // Enable pointer events and interactions
                                const appElement = document.querySelector("#app");
                                if (appElement) {
                                    appElement.style.pointerEvents = 'auto';
                                    appElement.style.touchAction = 'manipulation';
                                }
                                
                                // Start observing for join form
                                observer.observe(appElement, {
                                    childList: true,
                                    subtree: true,
                                    attributes: true
                                });
                                
                                // Try to auto-join immediately and then retry
                                setTimeout(() => {
                                    if (!autoJoinChat()) {
                                        // Retry auto-join after a bit more time
                                        setTimeout(() => {
                                            if (!autoJoinChat()) {
                                                // Final retry
                                                setTimeout(() => {
                                                    autoJoinChat();
                                                }, 1000);
                                            }
                                        }, 500);
                                    }
                                }, 300);
                                
                            } catch (error) {
                                console.error('[ChatSDK] Error loading chat:', error);
                                console.error('[ChatSDK] Error details:', error.message, error.stack);
                                document.querySelector("#app").innerHTML = '<div style="padding: 20px; color: #fff; text-align: center; background: #f00;">Error loading chat: ' + error.message + '</div>';
                            }
                        } else {
                            retryCount++;
                            if (retryCount < maxRetries) {
                                console.log('[ChatSDK] TPStreamsChat not found, retrying in 100ms...');
                                setTimeout(init, 100);
                            } else {
                                console.error('[ChatSDK] TPStreamsChat failed to load after ' + maxRetries + ' attempts');
                                document.querySelector("#app").innerHTML = '<div style="padding: 20px; color: #fff; text-align: center; background: #f00;">Chat SDK failed to load. Please check your connection.</div>';
                            }
                        }
                    }
                    
                    // Wait for DOM to be ready
                    if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', init);
                    } else {
                        init();
                    }
                </script>
            </body>
            </html>
        `;
    }, [roomId, username, title]);

    if (!chatEmbedUrl || !roomId) {
        return (
            <View style={[styles.container, styles.placeholderContainer]}>
                <View style={styles.placeholderContent}>
                    <Text style={[styles.placeholderText, { color: theme.colors.textSecondary }]}>
                        Chat not available for this stream
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <WebView
                source={{ html: htmlContent || '' }}
                style={styles.webview}
                startInLoadingState={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                originWhitelist={['*']}
                mixedContentMode="always"
                allowsBackForwardNavigationGestures={false}
                bounces={false}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                pointerEvents="auto"
                onMessage={(event) => {
                    if (__DEV__) {
                        console.log('[StreamChatBox] Message from WebView:', event.nativeEvent.data);
                    }
                }}
                onLoadStart={() => {
                    if (__DEV__) {
                        console.log('[StreamChatBox] WebView load started');
                    }
                }}
                onLoadEnd={() => {
                    if (__DEV__) {
                        console.log('[StreamChatBox] WebView load ended');
                    }
                }}
                onShouldStartLoadWithRequest={(request) => {
                    // Allow all navigation within the WebView
                    return true;
                }}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.accent || '#4A90E2'} />
                    </View>
                )}
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('[StreamChatBox] WebView error:', nativeEvent);
                }}
                onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('[StreamChatBox] WebView HTTP error:', nativeEvent);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        backgroundColor: '#000',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    placeholderContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    placeholderContent: {
        padding: 20,
    },
    placeholderText: {
        fontSize: 14,
        textAlign: 'center',
    },
});

export default StreamChatBox;
