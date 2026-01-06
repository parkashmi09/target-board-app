import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
    Modal,
    Animated,
    Easing,
    ScrollView,
} from 'react-native';
import { Send, Users, Radio, Smile } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { socketService, ChatMessage, ChatSettings } from '../../services/socketService';
import LottieView from 'lottie-react-native';

interface LiveChatProps {
    streamId: string;
    token: string;
    onClose?: () => void;
    streamTitle?: string;
    streamDescription?: string;
}

// Polyfill atob for React Native if needed
const atob = (input: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let str = input.replace(/=+$/, '');
    let output = '';

    if (str.length % 4 == 1) {
        throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
    }
    for (let bc = 0, bs = 0, buffer, i = 0;
        buffer = str.charAt(i++);

        ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
            bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0
    ) {
        buffer = chars.indexOf(buffer);
    }
    return output;
};

const LiveChat: React.FC<LiveChatProps> = ({ streamId, token, onClose, streamTitle, streamDescription }) => {
    const theme = useTheme();
    const { colors, isDark } = theme;
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [onlineCount, setOnlineCount] = useState(0);
    const [settings, setSettings] = useState<ChatSettings | null>(null);
    const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    const flatListRef = useRef<FlatList>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [pinnedMessage, setPinnedMessage] = useState<any | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    // Animation refs
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const emojiButtonScale = useRef(new Animated.Value(1)).current;

    // Simple JWT Decode to get user ID
    useEffect(() => {
        if (token) {
            try {
                const parts = token.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                    setCurrentUserId(payload.id);
                }
            } catch (e) {
                console.warn('Failed to decode token', e);
            }
        }
    }, [token]);

    useEffect(() => {
        // Initialize socket
        socketService.initialize(token);

        // Join room
        socketService.joinStream(streamId);

        // Listeners
        socketService.onJoinedRoom((data) => {
            console.log('Joined Room:', data);
            setIsConnected(true);
            setMessages(data.recentMessages || []);
            setOnlineCount(data.onlineCount);
            setSettings(data.settings);
            setPinnedMessage(data.pinnedMessage);
            setLoading(false);
        });

        socketService.onMessageReceived((message) => {
            setMessages((prev) => [...prev, message]);
        });

        socketService.onUserJoined((data) => setOnlineCount(data.onlineCount));

        socketService.onUserLeft((data) => setOnlineCount(data.onlineCount));

        socketService.onUserTyping((data) => {
            setTypingUsers((prev) => {
                if (!prev.find((u) => u.userId === data.userId)) {
                    return [...prev, { userId: data.userId, userName: data.userName }];
                }
                return prev;
            });
        });

        socketService.onUserStoppedTyping((data) => {
            setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
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

        socketService.onSettingsUpdated((data) => setSettings(data.settings));

        socketService.onError((error) => {
            console.error('Socket Error:', error);
            // Alert.alert('Chat Error', error.message || 'Something went wrong');
        });

        return () => {
            socketService.leaveStream(streamId);
            socketService.disconnect();
        };
    }, [streamId, token]);

    useEffect(() => {
        if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
        }
    }, [messages]);


    // Pulse animation for online indicator
    useEffect(() => {
        if (isConnected) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.3,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        }
    }, [isConnected]);


    const handleEmojiSelect = useCallback((emoji: string) => {
        setInputText((prev) => prev + emoji);
        setShowEmojiPicker(false);
    }, []);

    const toggleEmojiPicker = useCallback(() => {
        Animated.sequence([
            Animated.timing(emojiButtonScale, {
                toValue: 0.9,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(emojiButtonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
        setShowEmojiPicker((prev) => !prev);
    }, [emojiButtonScale]);

    const handleSendMessage = () => {
        if (!inputText.trim()) return;

        socketService.sendMessage(streamId, inputText.trim());
        setInputText('');

        // Stop typing immediately after sending
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            socketService.stopTyping(streamId);
        }
    };

    const handleTextChange = (text: string) => {
        setInputText(text);

        if (text.length > 0) {
            socketService.startTyping(streamId);

            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => socketService.stopTyping(streamId), 3000);
        } else {
            socketService.stopTyping(streamId);
        }
    };

    // Helper to find reply message
    const getReplyMessage = (originalId: string) => messages.find(m => m.id === originalId);

    // Polyfill for atob if needed (keeping it simple for now, assuming environment supports it or we use a hack)
    // If atob is not available in React Native JSC/Hermes by default, we need a lightweight implementation.
    // However, usually it can be polyfilled. To be safe, let's use a robust implementation or just Buffer if available.
    // For this snippet, I'll assume standard base64 decoding or add a tiny helper if it fails in runtime.

    // Message animations map
    const messageAnims = useRef<{ [key: string]: Animated.Value }>({});

    const getMessageAnim = useCallback((messageId: string) => {
        if (!messageAnims.current[messageId]) {
            messageAnims.current[messageId] = new Animated.Value(0);
            Animated.spring(messageAnims.current[messageId], {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }).start();
        }
        return messageAnims.current[messageId];
    }, []);

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        const isOwnMessage = currentUserId === item.userId;
        const isAdmin = item.isAdmin;
        const replyTo = item.originalMessageId ? getReplyMessage(item.originalMessageId) : null;
        const messageAnim = getMessageAnim(item.id);

        return (
            <Animated.View style={[
                styles.messageRow,
                isOwnMessage ? styles.ownMessageRow : styles.otherMessageRow,
                {
                    opacity: messageAnim,
                    transform: [
                        {
                            translateY: messageAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0],
                            }),
                        },
                        {
                            scale: messageAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.9, 1],
                            }),
                        },
                    ],
                },
            ]}>
                {!isOwnMessage && (
                    <View style={[styles.avatar, { 
                        backgroundColor: isAdmin 
                            ? (colors.accent || '#FFD700') 
                            : (colors.primary || colors.secondary) 
                    }]}>
                        <Text style={[styles.avatarText, { 
                            color: isAdmin 
                                ? '#000000' 
                                : (colors.primaryText || colors.secondaryText || '#FFFFFF') 
                        }]}>
                            {item.userName.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}

                <View style={[
                    styles.messageBubble,
                    isOwnMessage ?
                        { 
                            backgroundColor: isDark ? '#FFFFFF' : (colors.secondary || '#000000'), 
                            borderBottomRightRadius: moderateScale(4),
                            elevation: 2,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: isDark ? 0.2 : 0.1,
                            shadowRadius: 4,
                        } :
                        { 
                            backgroundColor: isDark ? '#1E1E1E' : (colors.cardBackground || '#F0F0F0'), 
                            borderBottomLeftRadius: moderateScale(4),
                            borderWidth: 1,
                            borderColor: colors.border,
                            elevation: 1,
                        },
                    isAdmin && !isOwnMessage && { 
                        backgroundColor: (colors.accent || '#FFD700') + '20', 
                        borderWidth: 1, 
                        borderColor: (colors.accent || '#FFD700') + '50' 
                    }
                ]}>
                    {replyTo && (
                        <View style={[styles.replyContainer, { borderLeftColor: isOwnMessage ? (isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)') : colors.primary }]}>
                            <Text style={[styles.replySender, { color: isOwnMessage ? (isDark ? '#000000' : 'rgba(255,255,255,0.9)') : colors.text }]}>{replyTo.userName}</Text>
                            <Text numberOfLines={1} style={[styles.replyText, { color: isOwnMessage ? (isDark ? '#666666' : 'rgba(255,255,255,0.7)') : colors.textSecondary }]}>
                                {replyTo.message}
                            </Text>
                        </View>
                    )}

                    {/* Show sender name for all messages */}
                    {/* Show sender name for all messages */}
                        <Text style={[styles.senderName, { 
                            color: isOwnMessage 
                                ? (isDark ? '#000000' : '#FFFFFF') 
                                : (isAdmin 
                                    ? (colors.accent || '#FFD700') 
                                    : colors.textSecondary)
                        }]}>
                            {isOwnMessage ? 'You' : item.userName} {isAdmin && '�️'}
                        </Text>

                    <Text style={[
                        styles.messageText,
                        { 
                            color: isOwnMessage 
                                ? (isDark ? '#000000' : '#FFFFFF') 
                                : colors.text 
                        }
                    ]}>
                        {item.message}
                    </Text>

                    <Text style={[
                        styles.timestamp,
                        { 
                            color: isOwnMessage 
                                ? (isDark ? '#666666' : 'rgba(255,255,255,0.8)') 
                                : (isDark ? 'rgba(255,255,255,0.7)' : colors.textSecondary)
                        }
                    ]}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Connecting to chat...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            {/* Header - Only Online Count */}
            <View style={[styles.header, { 
                borderBottomColor: colors.border, 
                backgroundColor: colors.cardBackground || (isDark ? '#1E1E1E' : '#FFFFFF') 
            }]}>
                <View style={styles.headerContent}>
                    <View style={styles.onlineContainer}>
                        <Animated.View 
                            style={[
                                styles.liveIndicator, 
                                { 
                                    backgroundColor: colors.success || '#4CAF50',
                                    transform: [{ scale: pulseAnim }]
                                }
                            ]} 
                        />
                        <Text style={[styles.onlineCount, { color: colors.text }]}>
                            {onlineCount} Online
                        </Text>
                    </View>
                    {settings?.isPrivateMode && (
                        <View style={[styles.privateBadge, { 
                            backgroundColor: colors.error + '20',
                            borderColor: colors.error 
                        }]}>
                            <Text style={[styles.privateModeText, { color: colors.error }]}>Private</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Pinned Message */}
            {pinnedMessage && (
                <View style={[styles.pinnedContainer, { backgroundColor: isDark ? '#332b00' : '#fff9c4', borderBottomColor: '#FFD700' }]}>
                    <View style={styles.pinnedContent}>
                        <Text style={[styles.pinnedLabel, { color: '#FFD700' }]}>Pinned</Text>
                        <Text numberOfLines={1} style={[styles.pinnedText, { color: colors.text }]}>{pinnedMessage.message}</Text>
                    </View>
                </View>
            )}

            {/* Messages List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    { backgroundColor: colors.background }
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No messages yet. Start the conversation!
                        </Text>
                    </View>
                }
                ListFooterComponent={
                    typingUsers.length > 0 ? (
                        <View style={styles.typingContainer}>
                            <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                                {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                            </Text>
                        </View>
                    ) : null
                }
            />

            {/* Input Area */}
            {settings?.isChatEnabled !== false ? (
                <View style={[styles.inputContainer, { 
                    borderTopColor: colors.border, 
                    backgroundColor: colors.cardBackground || (isDark ? '#1E1E1E' : '#F9F9F9') 
                }]}>
                    <Animated.View style={{ transform: [{ scale: emojiButtonScale }] }}>
                        <TouchableOpacity
                            style={[styles.emojiButton, {
                                backgroundColor: colors.inputBackground || (isDark ? '#333' : '#FFFFFF'),
                                borderColor: colors.border
                            }]}
                            onPress={toggleEmojiPicker}
                        >
                            <Smile size={moderateScale(20)} color={colors.text} />
                        </TouchableOpacity>
                    </Animated.View>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.inputBackground || (isDark ? '#333' : '#FFFFFF'),
                            color: colors.text,
                            borderColor: colors.border
                        }]}
                        placeholder="Type a message..."
                        placeholderTextColor={colors.textSecondary}
                        value={inputText}
                        onChangeText={handleTextChange}
                        maxLength={settings?.maxMessageLength || 500}
                        onSubmitEditing={handleSendMessage}
                        multiline
                        editable={isConnected && settings?.isChatEnabled}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, { 
                            backgroundColor: inputText.trim() && isConnected
                                ? (colors.secondary || colors.primary) 
                                : colors.border 
                        }]}
                        onPress={handleSendMessage}
                        disabled={!inputText.trim() || !settings?.isChatEnabled || !isConnected}
                    >
                        <Send 
                            size={18} 
                            color={inputText.trim() && isConnected
                                ? (colors.secondaryText || '#FFFFFF') 
                                : colors.textSecondary} 
                        />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={[styles.disabledContainer, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.disabledText, { color: colors.textSecondary }]}>
                        Chat is currently disabled
                    </Text>
                </View>
            )}

            {/* Emoji Picker Modal */}
            <Modal
                visible={showEmojiPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowEmojiPicker(false)}
            >
                <TouchableOpacity
                    style={styles.emojiModalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowEmojiPicker(false)}
                >
                    <View style={[styles.emojiPickerContainer, {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border
                    }]}>
                        <View style={[styles.emojiPickerHeader, {
                            borderBottomColor: colors.border
                        }]}>
                            <Text style={[styles.emojiPickerTitle, { color: colors.text }]}>
                                Select Emoji
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowEmojiPicker(false)}
                                style={styles.emojiPickerClose}
                            >
                                <Text style={[styles.emojiPickerCloseText, { color: colors.text }]}>
                                    ✕
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView 
                            style={styles.emojiScrollView}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.emojiGrid}>
                                {[
                                    // Smileys & People
                                    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠',
                                    // Gestures
                                    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
                                    // Hearts & Symbols
                                    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❓', '❕', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔜', '🔝', '✔️', '☑️', '🔘', '⚪', '⚫', '🔴', '🔵', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '⬛', '⬜', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '👁️‍🗨️', '💬', '💭', '🗯️', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧',
                                ].map((emoji) => (
                                    <TouchableOpacity
                                        key={emoji}
                                        style={[styles.emojiItem, {
                                            backgroundColor: colors.inputBackground
                                        }]}
                                        onPress={() => handleEmojiSelect(emoji)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.emojiItemText}>{emoji}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    loadingText: {
        fontSize: moderateScale(14),
    },
    header: {
        paddingHorizontal: getSpacing(2),
        paddingVertical: getSpacing(1.5),
        borderBottomWidth: 1,
        elevation: 2,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: getSpacing(1),
    },
    onlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    liveIndicator: {
        width: moderateScale(8),
        height: moderateScale(8),
        borderRadius: moderateScale(4),
    },
    onlineCount: {
        fontSize: moderateScale(13),
        fontWeight: '600',
    },
    privateBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#FF525220',
        borderWidth: 1,
        borderColor: '#FF5252',
    },
    privateModeText: {
        fontSize: moderateScale(10),
        fontWeight: 'bold',
        color: '#FF5252',
    },
    pinnedContainer: {
        padding: getSpacing(1.5),
        borderBottomWidth: 1,
    },
    pinnedContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pinnedLabel: {
        fontSize: moderateScale(10),
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    pinnedText: {
        fontSize: moderateScale(13),
        flex: 1,
    },
    listContent: {
        padding: getSpacing(2),
        paddingBottom: getSpacing(1),
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: getSpacing(2),
        width: '100%',
    },
    ownMessageRow: {
        justifyContent: 'flex-end',
    },
    otherMessageRow: {
        justifyContent: 'flex-start',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginTop: 4,
    },
    avatarText: {
        fontSize: moderateScale(14),
        fontWeight: 'bold',
    },
    messageBubble: {
        borderRadius: moderateScale(16),
        padding: getSpacing(1.5),
        maxWidth: '80%',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    replyContainer: {
        borderLeftWidth: 3,
        paddingLeft: 8,
        marginBottom: 8,
        opacity: 0.9,
    },
    replySender: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    replyText: {
        fontSize: 12,
    },
    senderName: {
        fontSize: moderateScale(11),
        fontWeight: '700',
        marginBottom: 4,
    },
    messageText: {
        fontSize: moderateScale(14),
        lineHeight: 20,
    },
    timestamp: {
        fontSize: moderateScale(9),
        marginTop: 4,
        alignSelf: 'flex-end',
        opacity: 0.8,
    },
    typingText: {
        fontSize: moderateScale(12),
        fontStyle: 'italic',
        marginLeft: getSpacing(2),
        marginBottom: getSpacing(1),
    },
    inputContainer: {
        flexDirection: 'row',
        padding: getSpacing(2),
        alignItems: 'flex-end',
        gap: getSpacing(1),
        borderTopWidth: 1,
    },
    emojiButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        borderRadius: moderateScale(20),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    input: {
        flex: 1,
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontSize: moderateScale(14),
        maxHeight: 100,
        borderWidth: 1,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    disabledContainer: {
        padding: getSpacing(2),
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledText: {
        fontSize: moderateScale(14),
        textAlign: 'center',
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
        textAlign: 'center',
    },
    typingContainer: {
        paddingHorizontal: getSpacing(2),
        paddingVertical: getSpacing(1),
    },
    emojiModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    emojiPickerContainer: {
        maxHeight: '50%',
        borderTopLeftRadius: moderateScale(20),
        borderTopRightRadius: moderateScale(20),
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
    },
    emojiPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: getSpacing(2),
        borderBottomWidth: 1,
    },
    emojiPickerTitle: {
        fontSize: moderateScale(18),
        fontWeight: '700',
    },
    emojiPickerClose: {
        padding: getSpacing(0.5),
    },
    emojiPickerCloseText: {
        fontSize: moderateScale(20),
        fontWeight: 'bold',
    },
    emojiScrollView: {
        maxHeight: moderateScale(300),
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: getSpacing(2),
    },
    emojiItem: {
        width: moderateScale(44),
        height: moderateScale(44),
        borderRadius: moderateScale(8),
        justifyContent: 'center',
        alignItems: 'center',
        margin: getSpacing(0.5),
    },
    emojiItemText: {
        fontSize: moderateScale(24),
    },
});

export default LiveChat;
