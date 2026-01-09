import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Modal,
  ScrollView,
  Switch,
  Clipboard,
  Alert,
} from 'react-native';
import { Svg, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing, safeFont } from '../../utils/responsive';
import { Send, Radio, Settings, X, Copy, Trash2, MessageSquare } from 'lucide-react-native';
import { socketService, ChatMessage, ChatSettings, RoomData } from '../../services/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface LiveChatInterfaceProps {
  roomId?: string;
  username?: string;
  onMessageSend?: (message: string) => void;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface Message {
  id: string;
  streamId: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  isAdmin: boolean;
  isReply: boolean;
  originalMessageId?: string | null;
}

const LiveChatInterface: React.FC<LiveChatInterfaceProps> = ({
  roomId,
  username = 'Student',
  onMessageSend,
}) => {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [isSending, setIsSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null);
  const [pinnedMessage, setPinnedMessage] = useState<any | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const inputScaleAnim = useRef(new Animated.Value(1)).current;
  const messageAnimations = useRef<{ [key: string]: Animated.Value }>({});

  // Load token and initialize socket
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (!storedToken) {
          setConnectionStatus('disconnected');
          return;
        }

        setToken(storedToken);
        
        // Decode token to get user ID
        try {
          const parts = storedToken.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(
              atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
            );
            setCurrentUserId(payload.id);
          }
        } catch (e) {
          // Failed to decode token
        }

        // Initialize socket service
        socketService.initialize(storedToken);

        // Setup socket listeners
        socketService.onJoinedRoom((data: RoomData) => {
          
          setConnectionStatus('connected');
          setChatSettings(data.settings);
          setPinnedMessage(data.pinnedMessage);
          
          // Convert recent messages to Message format
          const formattedMessages: Message[] = (data.recentMessages || []).map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          
          setMessages(formattedMessages);
          
          // Animate in
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
          ]).start();

          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        });

        socketService.onMessageReceived((message: ChatMessage) => {
          const newMessage: Message = {
            ...message,
            timestamp: new Date(message.timestamp),
          };
          
          // Create animation for new message
          const animValue = new Animated.Value(0);
          messageAnimations.current[message.id] = animValue;
          
          Animated.spring(animValue, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }).start();
          
          setMessages((prev) => [...prev, newMessage]);
          
          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        });

        socketService.onMessageSent(() => {
          setIsSending(false);
        });

        socketService.onMessageDeleted((data) => {
          setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
        });

        socketService.onMessagePinned((data) => {
          setPinnedMessage(data.pinnedMessage);
        });

        socketService.onMessageUnpinned(() => {
          setPinnedMessage(null);
        });

        socketService.onSettingsUpdated((data) => {
          setChatSettings(data.settings);
        });

        socketService.onError((error) => {
          Alert.alert('Error', error.message || 'An error occurred');
        });

        // Join stream room if roomId is provided
        if (roomId) {
          socketService.joinStream(roomId);
        } else {
          setConnectionStatus('connected');
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
              toValue: 1,
              tension: 50,
              friction: 7,
              useNativeDriver: true,
            }),
          ]).start();
        }
      } catch (error) {
        setConnectionStatus('disconnected');
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      if (roomId) {
        socketService.leaveStream(roomId);
      }
      socketService.disconnect();
    };
  }, [roomId]);

  // Pulse animation for connection indicator
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [connectionStatus]);

  const copyMessage = useCallback((text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied', 'Message copied to clipboard');
  }, []);

  const clearChat = useCallback(() => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setMessages([]);
          },
        },
      ]
    );
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || isSending || !roomId || connectionStatus !== 'connected') return;

    const messageText = inputText.trim();
    
    // Check message length
    if (chatSettings && messageText.length > chatSettings.maxMessageLength) {
      Alert.alert(
        'Message Too Long',
        `Maximum message length is ${chatSettings.maxMessageLength} characters.`
      );
      return;
    }

    setInputText('');
    setIsSending(true);

    // Animate input scale
    Animated.sequence([
      Animated.timing(inputScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(inputScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Send message via socket
    socketService.sendMessage(roomId, messageText);

    // Call callback if provided
    if (onMessageSend) {
      onMessageSend(messageText);
    }
  }, [inputText, isSending, roomId, connectionStatus, chatSettings, onMessageSend]);

  const getConnectionStatusColor = useMemo(() => {
    switch (connectionStatus) {
      case 'connected':
        return theme.colors.success || '#4CAF50';
      case 'connecting':
      case 'reconnecting':
        return theme.colors.warning || '#FF9800';
      case 'disconnected':
        return theme.colors.error || '#F44336';
      default:
        return theme.colors.textSecondary;
    }
  }, [connectionStatus, theme.colors]);

  const getConnectionStatusText = useMemo(() => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  }, [connectionStatus]);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isUser = item.userId === currentUserId;
    const isAdmin = item.isAdmin;
    const animValue = messageAnimations.current[item.id] || new Animated.Value(1);

    return (
        <Animated.View
          style={[
            styles.messageContainer,
            isUser ? styles.userMessageContainer : styles.teacherMessageContainer,
            {
              opacity: animValue,
              transform: [
                {
                  scale: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
                {
                  translateY: animValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
        {/* Gradient Background for User Messages */}
        {isUser && (
          <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: moderateScale(16) }]}>
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id={`userMsgGrad-${item.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={theme.colors.secondary} stopOpacity="1" />
                  <Stop offset="100%" stopColor={theme.colors.accent} stopOpacity="0.9" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill={`url(#userMsgGrad-${item.id})`} rx={moderateScale(16)} />
            </Svg>
          </View>
        )}

        <View style={styles.messageContent}>
          {!isUser && (
            <Text style={[styles.senderName, { color: isAdmin ? theme.colors.accent : theme.colors.textSecondary }]}>
              {isAdmin ? '👨‍🏫 Admin' : item.userName}
            </Text>
          )}
          <Text
            style={[
              styles.messageText,
              {
                color: isUser ? theme.colors.secondaryText : theme.colors.text,
              },
            ]}
          >
            {item.message}
          </Text>
          <Text
            style={[
              styles.timestamp,
              {
                color: isUser
                  ? 'rgba(255, 255, 255, 0.7)'
                  : theme.colors.textSecondary,
              },
            ]}
          >
            {item.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {isUser && (
          <TouchableOpacity
            style={styles.messageActionButton}
            onPress={() => copyMessage(item.message)}
          >
            <Copy size={moderateScale(12)} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }, [theme.colors, currentUserId, copyMessage]);

  const renderConnectionIndicator = () => {
    const indicatorSize = moderateScale(8);
    const indicatorStyle = {
      width: indicatorSize,
      height: indicatorSize,
      borderRadius: indicatorSize / 2,
      backgroundColor: getConnectionStatusColor,
    };

    return (
      <View style={styles.connectionIndicatorContainer}>
        <Animated.View
          style={[
            indicatorStyle,
            {
              transform: [{ scale: pulseAnim }],
              opacity: connectionStatus === 'connected' ? 1 : 0.6,
            },
          ]}
        />
        {connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? (
          <ActivityIndicator
            size="small"
            color={getConnectionStatusColor}
            style={{ marginLeft: getSpacing(0.5) }}
          />
        ) : null}
        <Text
          style={[
            styles.connectionStatusText,
            { color: getConnectionStatusColor },
          ]}
        >
          {getConnectionStatusText}
        </Text>
      </View>
    );
  };

  const isChatEnabled = chatSettings?.isChatEnabled !== false;
  const maxLength = chatSettings?.maxMessageLength || 500;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <Animated.View
        style={[
          styles.chatContainer,
          {
            backgroundColor: theme.colors.cardBackground,
            borderColor: theme.colors.border,
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Header with Gradient */}
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor={theme.colors.cardBackground} stopOpacity="1" />
                  <Stop offset="100%" stopColor={theme.colors.backgroundSecondary || theme.colors.cardBackground} stopOpacity="0.3" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#headerGradient)" />
            </Svg>
          </View>
          
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              {renderConnectionIndicator()}
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                Live Chat
              </Text>
              {connectionStatus === 'connected' && (
                <View style={styles.liveBadge}>
                  <Radio size={moderateScale(10)} color="#FFFFFF" />
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setShowSettings(true)}
              style={styles.settingsButton}
            >
              <Settings size={moderateScale(20)} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pinned Message */}
        {pinnedMessage && (
          <View style={[styles.pinnedMessageContainer, { backgroundColor: theme.colors.accent + '20', borderColor: theme.colors.accent }]}>
            <Text style={[styles.pinnedLabel, { color: theme.colors.accent }]}>📌 Pinned</Text>
            <Text style={[styles.pinnedText, { color: theme.colors.text }]}>
              {pinnedMessage.message}
            </Text>
          </View>
        )}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.messagesList,
            { backgroundColor: theme.colors.background },
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MessageSquare size={moderateScale(48)} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Start asking questions...
              </Text>
            </View>
          }
        />

        {/* Input Area with Gradient */}
        <View style={[styles.inputContainer, { borderTopColor: theme.colors.border }]}>
          <Animated.View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: theme.colors.inputBackground,
                borderColor: theme.colors.border,
                transform: [{ scale: inputScaleAnim }],
              },
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                {
                  color: theme.colors.text,
                  fontSize: safeFont(14),
                },
              ]}
              placeholder="Type your question..."
              placeholderTextColor={theme.colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={maxLength}
              editable={connectionStatus === 'connected' && !isSending && isChatEnabled}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isSending || connectionStatus !== 'connected' || !isChatEnabled}
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    inputText.trim() && connectionStatus === 'connected' && isChatEnabled
                      ? theme.colors.secondary
                      : theme.colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={theme.colors.secondaryText} />
              ) : (
                <Send
                  size={moderateScale(18)}
                  color={
                    inputText.trim() && connectionStatus === 'connected' && isChatEnabled
                      ? theme.colors.secondaryText
                      : theme.colors.textSecondary
                  }
                />
              )}
            </TouchableOpacity>
          </Animated.View>
          {!isChatEnabled && (
            <Text style={[styles.chatDisabledText, { color: theme.colors.error }]}>
              Chat is currently disabled
            </Text>
          )}
        </View>
      </Animated.View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.settingsModal,
              {
                backgroundColor: theme.colors.cardBackground,
              },
            ]}
          >
            <View style={styles.settingsHeader}>
              <Text style={[styles.settingsTitle, { color: theme.colors.text }]}>
                Chat Settings
              </Text>
              <TouchableOpacity
                onPress={() => setShowSettings(false)}
                style={styles.closeSettingsButton}
              >
                <X size={moderateScale(24)} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.settingsContent}>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                    Auto Scroll
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    Automatically scroll to new messages
                  </Text>
                </View>
                <Switch
                  value={true}
                  onValueChange={(value) => {
                    // Auto-scroll is always enabled
                  }}
                  trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.border, marginVertical: getSpacing(2) },
                ]}
              />

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                onPress={clearChat}
              >
                <Trash2 size={moderateScale(18)} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Clear Chat</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

// Simple atob polyfill
const atob = (input: string) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/=+$/, '');
  let output = '';
  for (let bc = 0, bs = 0, buffer, i = 0;
    buffer = str.charAt(i++);
    ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
      bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
  ) {
    buffer = chars.indexOf(buffer);
  }
  return output;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
    borderRadius: moderateScale(20),
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(1.5),
    borderBottomWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: getSpacing(1),
  },
  headerTitle: {
    fontSize: safeFont(18),
    fontWeight: '700',
    marginLeft: getSpacing(0.5),
  },
  settingsButton: {
    padding: getSpacing(0.5),
  },
  connectionIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionStatusText: {
    fontSize: safeFont(11),
    fontWeight: '600',
    marginLeft: getSpacing(0.5),
    textTransform: 'uppercase',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F44336',
    paddingHorizontal: getSpacing(1),
    paddingVertical: getSpacing(0.5),
    borderRadius: moderateScale(12),
    gap: getSpacing(0.5),
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: safeFont(10),
    fontWeight: '700',
  },
  pinnedMessageContainer: {
    padding: getSpacing(1.5),
    borderBottomWidth: 1,
    borderTopWidth: 0,
  },
  pinnedLabel: {
    fontSize: safeFont(10),
    fontWeight: '700',
    marginBottom: getSpacing(0.5),
    textTransform: 'uppercase',
  },
  pinnedText: {
    fontSize: safeFont(13),
    lineHeight: safeFont(18, 16),
  },
  messagesList: {
    flexGrow: 1,
    padding: getSpacing(2),
  },
  messageContainer: {
    padding: getSpacing(1.5),
    borderRadius: moderateScale(16),
    marginBottom: getSpacing(1),
    minWidth: moderateScale(100),
    maxWidth: '75%',
    position: 'relative',
    overflow: 'hidden',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: moderateScale(4),
  },
  teacherMessageContainer: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: moderateScale(4),
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  messageContent: {
    position: 'relative',
    zIndex: 1,
  },
  senderName: {
    fontSize: safeFont(11),
    fontWeight: '600',
    marginBottom: getSpacing(0.5),
  },
  messageText: {
    fontSize: safeFont(14),
    lineHeight: safeFont(20, 16),
  },
  timestamp: {
    fontSize: safeFont(10),
    marginTop: getSpacing(0.5),
    alignSelf: 'flex-end',
  },
  inputContainer: {
    padding: getSpacing(2),
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: moderateScale(24),
    borderWidth: 1,
    paddingHorizontal: getSpacing(1.5),
    paddingVertical: getSpacing(1),
    minHeight: moderateScale(44),
    maxHeight: moderateScale(100),
  },
  textInput: {
    flex: 1,
    maxHeight: moderateScale(80),
    paddingVertical: getSpacing(1),
  },
  sendButton: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: getSpacing(1),
  },
  chatDisabledText: {
    fontSize: safeFont(11),
    marginTop: getSpacing(0.5),
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getSpacing(8),
  },
  emptyText: {
    fontSize: safeFont(14),
    fontStyle: 'italic',
    marginTop: getSpacing(1),
  },
  messageActionButton: {
    position: 'absolute',
    top: getSpacing(0.5),
    right: getSpacing(0.5),
    padding: getSpacing(0.5),
    zIndex: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  settingsModal: {
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    maxHeight: '80%',
    paddingBottom: getSpacing(4),
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getSpacing(2),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  settingsTitle: {
    fontSize: safeFont(20),
    fontWeight: '700',
  },
  closeSettingsButton: {
    padding: getSpacing(0.5),
  },
  settingsContent: {
    padding: getSpacing(2),
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getSpacing(2),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingLeft: {
    flex: 1,
    marginRight: getSpacing(2),
  },
  settingLabel: {
    fontSize: safeFont(16),
    fontWeight: '600',
    marginBottom: getSpacing(0.5),
  },
  settingDescription: {
    fontSize: safeFont(12),
  },
  divider: {
    height: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: getSpacing(1.5),
    borderRadius: moderateScale(12),
    gap: getSpacing(1),
    marginTop: getSpacing(1),
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: safeFont(14),
    fontWeight: '600',
  },
});

export default LiveChatInterface;
