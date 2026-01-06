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
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { Send, Radio, Settings, Users, X, Copy, Trash2, MessageSquare } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CHAT_HEIGHT = SCREEN_HEIGHT * 0.7; // 70% of screen height

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'teacher' | 'system';
  timestamp: Date;
  isTyping?: boolean;
}

interface LiveChatInterfaceProps {
  roomId?: string;
  username?: string;
  onMessageSend?: (message: string) => void;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

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
  const [onlineCount, setOnlineCount] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [chatSettings, setChatSettings] = useState({
    soundEnabled: true,
    notificationsEnabled: true,
    autoScroll: true,
    showTimestamps: true,
    maxMessageLength: 500,
  });
  
  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const inputScaleAnim = useRef(new Animated.Value(1)).current;
  const messageAnimations = useRef<{ [key: string]: Animated.Value }>({});

  // Simulate connection status changes
  useEffect(() => {
    // Simulate connecting
    const connectTimer = setTimeout(() => {
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

      // Add welcome message
      addSystemMessage('Connected to live chat. You can now ask questions!');
      // Simulate online users
      setOnlineCount(Math.floor(Math.random() * 50) + 10);
    }, 1500);

    return () => clearTimeout(connectTimer);
  }, []);

  // Simulate typing indicator
  useEffect(() => {
    if (connectionStatus === 'connected' && messages.length > 0) {
      const typingTimer = setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }, 3000);
      return () => clearTimeout(typingTimer);
    }
  }, [messages, connectionStatus]);

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

  const addSystemMessage = useCallback((text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'system',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

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
            addSystemMessage('Chat cleared');
          },
        },
      ]
    );
  }, [addSystemMessage]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
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

    // Add user message with animation
    const messageId = Date.now().toString();
    const userMessage: Message = {
      id: messageId,
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    
    // Create animation for new message
    const animValue = new Animated.Value(0);
    messageAnimations.current[messageId] = animValue;
    
    Animated.spring(animValue, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
    
    setMessages((prev) => [...prev, userMessage]);

    // Call onMessageSend callback if provided
    if (onMessageSend) {
      onMessageSend(messageText);
    }

    // Simulate teacher response (for demo)
    setTimeout(() => {
      const teacherMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Thank you for your question: "${messageText}". I'll get back to you shortly.`,
        sender: 'teacher',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, teacherMessage]);
      setIsSending(false);
    }, 1000);
  }, [inputText, isSending, onMessageSend]);

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
    const isUser = item.sender === 'user';
    const isSystem = item.sender === 'system';
    const animValue = messageAnimations.current[item.id] || new Animated.Value(1);

    if (isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={[styles.systemMessageText, { color: theme.colors.textSecondary }]}>
            {item.text}
          </Text>
        </View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.teacherMessageContainer,
          {
            backgroundColor: isUser
              ? theme.colors.secondary
              : theme.colors.cardBackground,
            alignSelf: isUser ? 'flex-end' : 'flex-start',
            maxWidth: '75%',
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
        {!isUser && (
          <Text style={[styles.senderName, { color: theme.colors.accent }]}>
            Teacher
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
          {item.text}
        </Text>
        {chatSettings.showTimestamps && (
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
        )}
        {isUser && (
          <TouchableOpacity
            style={styles.messageActionButton}
            onPress={() => copyMessage(item.text)}
          >
            <Copy size={moderateScale(12)} color="rgba(255, 255, 255, 0.7)" />
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  }, [theme.colors, chatSettings.showTimestamps, copyMessage]);

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Animated.View
        style={[
          styles.chatContainer,
          {
            height: CHAT_HEIGHT,
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
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.cardBackground,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            {renderConnectionIndicator()}
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              Live Chat
            </Text>
            {connectionStatus === 'connected' && (
              <View style={styles.onlineCountContainer}>
                <Users size={moderateScale(12)} color={theme.colors.textSecondary} />
                <Text style={[styles.onlineCountText, { color: theme.colors.textSecondary }]}>
                  {onlineCount}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            {connectionStatus === 'connected' && (
              <View style={styles.liveBadge}>
                <Radio size={moderateScale(12)} color="#FFFFFF" />
                <Text style={styles.liveBadgeText}>LIVE</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => setShowSettings(true)}
              style={styles.settingsButton}
            >
              <Settings size={moderateScale(20)} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>

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
        {isTyping && connectionStatus === 'connected' && (
          <View style={styles.typingIndicator}>
            <Text style={[styles.typingText, { color: theme.colors.textSecondary }]}>
              Teacher is typing...
            </Text>
          </View>
        )}

        {/* Input Area */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.colors.cardBackground,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
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
                  fontSize: moderateScale(14),
                },
              ]}
              placeholder="Type your question..."
              placeholderTextColor={theme.colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={connectionStatus === 'connected' && !isSending}
            />
            <TouchableOpacity
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isSending || connectionStatus !== 'connected'}
              style={[
                styles.sendButton,
                {
                  backgroundColor:
                    inputText.trim() && connectionStatus === 'connected'
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
                    inputText.trim() && connectionStatus === 'connected'
                      ? theme.colors.secondaryText
                      : theme.colors.textSecondary
                  }
                />
              )}
            </TouchableOpacity>
          </Animated.View>
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
                    Sound Notifications
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    Play sound when receiving messages
                  </Text>
                </View>
                <Switch
                  value={chatSettings.soundEnabled}
                  onValueChange={(value) =>
                    setChatSettings((prev) => ({ ...prev, soundEnabled: value }))
                  }
                  trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                    Push Notifications
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    Receive notifications for new messages
                  </Text>
                </View>
                <Switch
                  value={chatSettings.notificationsEnabled}
                  onValueChange={(value) =>
                    setChatSettings((prev) => ({ ...prev, notificationsEnabled: value }))
                  }
                  trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>

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
                  value={chatSettings.autoScroll}
                  onValueChange={(value) =>
                    setChatSettings((prev) => ({ ...prev, autoScroll: value }))
                  }
                  trackColor={{ false: theme.colors.border, true: theme.colors.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                    Show Timestamps
                  </Text>
                  <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                    Display time on messages
                  </Text>
                </View>
                <Switch
                  value={chatSettings.showTimestamps}
                  onValueChange={(value) =>
                    setChatSettings((prev) => ({ ...prev, showTimestamps: value }))
                  }
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatContainer: {
    borderRadius: moderateScale(16),
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(1.5),
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(1),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginLeft: getSpacing(1),
  },
  onlineCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: getSpacing(1),
    gap: getSpacing(0.5),
  },
  onlineCountText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  settingsButton: {
    padding: getSpacing(0.5),
  },
  connectionIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionStatusText: {
    fontSize: moderateScale(11),
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
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  messagesList: {
    flexGrow: 1,
    padding: getSpacing(2),
  },
  messageContainer: {
    padding: getSpacing(1.5),
    borderRadius: moderateScale(12),
    marginBottom: getSpacing(1),
    minWidth: moderateScale(100),
  },
  userMessageContainer: {
    borderBottomRightRadius: moderateScale(4),
  },
  teacherMessageContainer: {
    borderBottomLeftRadius: moderateScale(4),
    borderWidth: 1,
  },
  senderName: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    marginBottom: getSpacing(0.5),
  },
  messageText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  timestamp: {
    fontSize: moderateScale(10),
    marginTop: getSpacing(0.5),
    alignSelf: 'flex-end',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: getSpacing(1),
  },
  systemMessageText: {
    fontSize: moderateScale(12),
    fontStyle: 'italic',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getSpacing(8),
  },
  emptyText: {
    fontSize: moderateScale(14),
    fontStyle: 'italic',
    marginTop: getSpacing(1),
  },
  typingIndicator: {
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(1),
  },
  typingText: {
    fontSize: moderateScale(12),
    fontStyle: 'italic',
  },
  messageActionButton: {
    position: 'absolute',
    top: getSpacing(0.5),
    right: getSpacing(0.5),
    padding: getSpacing(0.5),
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
    fontSize: moderateScale(20),
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
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: getSpacing(0.5),
  },
  settingDescription: {
    fontSize: moderateScale(12),
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
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
});

export default LiveChatInterface;

