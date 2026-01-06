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
} from 'react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { Send, Radio } from 'lucide-react-native';

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
  
  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const inputScaleAnim = useRef(new Animated.Value(1)).current;

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
    }, 1500);

    return () => clearTimeout(connectTimer);
  }, []);

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

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
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
      </Animated.View>
    );
  }, [theme.colors]);

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
          </View>
          {connectionStatus === 'connected' && (
            <View style={styles.liveBadge}>
              <Radio size={moderateScale(12)} color="#FFFFFF" />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
          )}
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
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Start asking questions...
              </Text>
            </View>
          }
        />

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
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginLeft: getSpacing(1),
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
  },
});

export default LiveChatInterface;

