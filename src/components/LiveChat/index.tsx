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
    ScrollView,
    Keyboard,
} from 'react-native';
import { Send, Smile, MoreVertical, X, Pin } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing, safeFont, safeLetterSpacing } from '../../utils/responsive';
import { socketService, ChatMessage, ChatSettings, ChatTag } from '../../services/socketService';
import EmojiPicker, { type EmojiType } from 'rn-emoji-keyboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    const insets = useSafeAreaInsets();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [settings, setSettings] = useState<ChatSettings | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [loading, setLoading] = useState(true);

    const flatListRef = useRef<FlatList>(null);

    const [pinnedMessage, setPinnedMessage] = useState<any | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
    const [reportReason, setReportReason] = useState<'spam' | 'harassment' | 'inappropriate' | 'other' | null>(null);
    const [reportDescription, setReportDescription] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    const [chatTags, setChatTags] = useState<ChatTag[]>([]);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);

    // Animation refs
    const emojiButtonScale = useRef(new Animated.Value(1)).current;
    const inputContainerTranslateY = useRef(new Animated.Value(0)).current;

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
                // Failed to decode token
            }
        }
    }, [token]);

    useEffect(() => {
        // Initialize socket
        console.log('[LiveChat] Initializing socket with token');
        socketService.initialize(token);

        // Join room
        console.log('[LiveChat] Joining stream:', streamId);
        socketService.joinStream(streamId);

        // Listeners
        socketService.onJoinedRoom((data) => {
            console.log('[LiveChat] Joined room:', data);
            console.log('[LiveChat] Pinned message:', data.pinnedMessage);
            console.log('[LiveChat] Is blocked:', data.isBlocked);
            setIsConnected(true);
            setMessages(data.recentMessages || []);
            setSettings(data.settings);
            setPinnedMessage(data.pinnedMessage);
            setIsBlocked(data.isBlocked || false);
            setLoading(false);
        });

        socketService.onMessageReceived((message) => {
            console.log('[LiveChat] Message received:', message);
            setMessages((prev) => [...prev, message]);
        });

        socketService.onMessageDeleted((data) => {
            console.log('[LiveChat] Message deleted:', data);
            setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
        });

        socketService.onMessagePinned((data) => {
            console.log('[LiveChat] Message pinned:', data);
            setPinnedMessage(data.pinnedMessage);
        });

        socketService.onMessageUnpinned(() => {
            console.log('[LiveChat] Message unpinned');
            setPinnedMessage(null);
        });

        socketService.onSettingsUpdated((data) => {
            console.log('[LiveChat] Settings updated:', data);
            setSettings(data.settings);
        });

        socketService.onError((error) => {
            console.error('[LiveChat] Socket error:', error);
        });

        socketService.onChatTags((data) => {
            console.log('[LiveChat] Chat tags received:', data);
            setChatTags(data.tags || []);
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

    // Keyboard listeners
    useEffect(() => {
        const keyboardWillShow = (e: any) => {
            const height = e.endCoordinates?.height || 0;
            setKeyboardHeight(height);
            Animated.timing(inputContainerTranslateY, {
                toValue: -height * 0.1, // Shift slightly upwards
                duration: 250,
                useNativeDriver: true,
            }).start();
        };

        const keyboardWillHide = () => {
            setKeyboardHeight(0);
            Animated.timing(inputContainerTranslateY, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start();
        };

        if (Platform.OS === 'ios') {
            const showSubscription = Keyboard.addListener('keyboardWillShow', keyboardWillShow);
            const hideSubscription = Keyboard.addListener('keyboardWillHide', keyboardWillHide);
            return () => {
                showSubscription.remove();
                hideSubscription.remove();
            };
        } else {
            const showSubscription = Keyboard.addListener('keyboardDidShow', keyboardWillShow);
            const hideSubscription = Keyboard.addListener('keyboardDidHide', keyboardWillHide);
            return () => {
                showSubscription.remove();
                hideSubscription.remove();
            };
        }
    }, [inputContainerTranslateY]);


    const handleEmojiSelect = useCallback((emojiObject: EmojiType) => {
        setInputText((prev) => prev + emojiObject.emoji);
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

        console.log('[LiveChat] Sending message:', inputText.trim());
        socketService.sendMessage(streamId, inputText.trim());
        setInputText('');
    };

    const handleTagSelect = useCallback((tag: string) => {
        console.log('[LiveChat] Tag selected:', tag);
        socketService.sendMessage(streamId, tag);
    }, [streamId]);

    const handlePinnedMessagePress = useCallback(() => {
        if (!pinnedMessage?.messageId) return;

        // Find the index of the pinned message
        const messageIndex = messages.findIndex((msg) => msg.id === pinnedMessage.messageId);

        if (messageIndex !== -1) {
            // Scroll to the message
            flatListRef.current?.scrollToIndex({
                index: messageIndex,
                animated: true,
                viewPosition: 0.5, // Center the message
            });
        } else {
            // Message not found in current messages, show alert
            Alert.alert('Message Not Found', 'The pinned message is not in the current chat history.');
        }
    }, [pinnedMessage, messages]);

    const handleReportMessage = useCallback((message: ChatMessage) => {
        // Don't allow reporting own messages
        if (message.userId === currentUserId) {
            Alert.alert('Cannot Report', 'You cannot report your own messages.');
            return;
        }
        console.log('[LiveChat] Opening report modal for message:', message.id);
        setSelectedMessage(message);
        setShowReportModal(true);
        setReportReason(null);
        setReportDescription('');
    }, [currentUserId]);

    const handleConfirmReport = useCallback(async () => {
        if (!selectedMessage || !reportReason || !streamId) return;

        console.log('[LiveChat] Reporting message:', {
            messageId: selectedMessage.id,
            reason: reportReason,
            description: reportDescription
        });

        setIsReporting(true);
        try {
            // Try Socket.io first (preferred for real-time)
            socketService.reportMessage(streamId, selectedMessage.id, reportReason, reportDescription || undefined);

            // Set up one-time listeners
            const successHandler = (data: { reportId: string; message: string }) => {
                console.log('[LiveChat] Report success:', data);
                Alert.alert('Success', 'Message reported successfully. Thank you for helping keep our community safe.');
                setShowReportModal(false);
                setSelectedMessage(null);
                setReportReason(null);
                setReportDescription('');
                setIsReporting(false);
                socketService.off('report-success');
                socketService.off('report-error');
            };

            const errorHandler = (error: { message: string }) => {
                console.error('[LiveChat] Report error:', error);
                Alert.alert('Error', error.message || 'Failed to report message. Please try again.');
                setIsReporting(false);
                socketService.off('report-success');
                socketService.off('report-error');
            };

            socketService.onReportSuccess(successHandler);
            socketService.onReportError(errorHandler);

            // Fallback to HTTP after 3 seconds if no socket response
            setTimeout(() => {
                if (isReporting) {
                    console.log('[LiveChat] Socket timeout, trying HTTP API');
                    socketService.off('report-success');
                    socketService.off('report-error');
                    handleReportViaHTTP();
                }
            }, 3000);
        } catch (error: any) {
            console.error('[LiveChat] Report error:', error);
            Alert.alert('Error', error.message || 'Failed to report message. Please try again.');
            setIsReporting(false);
        }
    }, [selectedMessage, reportReason, reportDescription, streamId, isReporting]);

    const handleReportViaHTTP = useCallback(async () => {
        if (!selectedMessage || !reportReason || !streamId) return;

        try {
            const CHAT_SERVICE_URL = 'https://shark-app-2-dzcvn.ondigitalocean.app';

            console.log('[LiveChat] Reporting via HTTP:', {
                url: `${CHAT_SERVICE_URL}/api/v1/chat/report/${streamId}`,
                messageId: selectedMessage.id,
                reason: reportReason
            });

            const response = await fetch(`${CHAT_SERVICE_URL}/api/v1/chat/report/${streamId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    messageId: selectedMessage.id,
                    reason: reportReason,
                    description: reportDescription || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data?.message || `Failed to report message`);
            }

            console.log('[LiveChat] Report success via HTTP:', data);
            Alert.alert('Success', 'Message reported successfully. Thank you for helping keep our community safe.');
            setShowReportModal(false);
            setSelectedMessage(null);
            setReportReason(null);
            setReportDescription('');
            setIsReporting(false);
        } catch (error: any) {
            console.error('[LiveChat] HTTP report error:', error);
            Alert.alert('Error', error.message || 'Failed to report message. Please try again.');
            setIsReporting(false);
        }
    }, [selectedMessage, reportReason, reportDescription, streamId, token]);

    const handleTextChange = (text: string) => {
        setInputText(text);
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
        const canReport = !isOwnMessage && isConnected;
        const isPinned = pinnedMessage?.messageId === item.id;

        // Debug: Log pinned message check
        if (isPinned) {
            console.log('[LiveChat] Pinned message found:', { messageId: item.id, pinnedMessageId: pinnedMessage?.messageId });
        }

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={() => canReport && handleReportMessage(item)}
                delayLongPress={500}
            >
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
                                ? '#FFD700'
                                : '#E0E0E0'
                        }]}>
                            <Text style={[styles.avatarText, {
                                color: isAdmin
                                    ? '#000000'
                                    : '#000000'
                            }]}>
                                {item.userName.charAt(0).toUpperCase()}
                            </Text>
                        </View>
                    )}

                    <View style={[
                        styles.messageBubble,
                        isOwnMessage ?
                            {
                                backgroundColor: '#f55473',
                                borderRadius: moderateScale(12),
                                position: 'relative',
                                borderWidth: isPinned ? 1 : 0,
                                borderColor: isPinned ? '#FFD700' : 'transparent',
                                // elevation: 1,
                                // shadowColor: '#000',
                                // shadowOffset: { width: 0, height: 1 },
                                // shadowOpacity: 0.1,
                                // shadowRadius: 1,
                            } :
                            {
                                backgroundColor: '#FFFFFF',
                                position: 'relative',
                                borderWidth: isPinned ? 1 : 0,
                                borderColor: isPinned ? '#FFD700' : 'transparent',

                            },
                        isAdmin && !isOwnMessage && {
                            backgroundColor: '#F5F5F5',
                        }
                    ]}>
                        {replyTo && (
                            <View style={[styles.replyContainer, { borderLeftColor: isOwnMessage ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)' }]}>
                                <Text style={[styles.replySender, { color: isOwnMessage ? '#FFFFFF' : '#000000' }]}>{replyTo.userName}</Text>
                                <Text numberOfLines={1} style={[styles.replyText, { color: isOwnMessage ? 'rgba(255,255,255,0.8)' : '#666666' }]}>
                                    {replyTo.message}
                                </Text>
                            </View>
                        )}

                        {/* Show sender name only for received messages */}
                        {!isOwnMessage && (
                            <View style={styles.senderNameContainer}>
                                <Text style={[styles.senderName, {
                                    color: '#000000'
                                }]}>
                                    {item.userName} {isAdmin && '👑'}
                                </Text>
                                {/* {isPinned && (
                                <Pin size={moderateScale(14)} color="#FFD700" fill="#FFD700" />
                            )} */}
                            </View>
                        )}



                        <Text style={[
                            styles.messageText,
                            {
                                color: isOwnMessage
                                    ? '#FFFFFF'
                                    : '#000000'
                            }
                        ]}>
                            {item.message}
                        </Text>

                        <View style={styles.timestampContainer}>
                            {isPinned && !isOwnMessage && (
                                <Pin size={moderateScale(12)} color="#FFD700" fill="#FFD700" />
                            )}
                            <Text style={[
                                styles.timestamp,
                                {
                                    color: isOwnMessage
                                        ? 'rgba(255,255,255,0.85)'
                                        : '#666666'
                                }
                            ]}>
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                            {isPinned && isOwnMessage && (
                                <Pin size={moderateScale(12)} color="rgba(255,255,255,0.9)" fill="rgba(255,255,255,0.9)" />
                            )}
                        </View>
                    </View>
                    {canReport && (
                        <TouchableOpacity
                            style={styles.reportButton}
                            onPress={() => handleReportMessage(item)}
                            activeOpacity={0.7}
                        >
                            <MoreVertical size={moderateScale(20)} color="#999999" />
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </TouchableOpacity>
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
            style={[styles.container, { backgroundColor: '#F5F5F5' }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >




            {/* Messages List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    { backgroundColor: '#F5F5F5' }
                ]}
                showsVerticalScrollIndicator={false}
                onScrollToIndexFailed={(info) => {
                    // Fallback: scroll to end if index not found
                    setTimeout(() => {
                        flatListRef.current?.scrollToOffset({
                            offset: info.averageItemLength * info.index,
                            animated: true,
                        });
                    }, 100);
                }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No messages yet. Start the conversation!
                        </Text>
                    </View>
                }
            />

            {/* Suggested Reply Buttons */}
            {!isBlocked && chatTags.length > 0 && !inputText && (
                <View style={styles.suggestedRepliesContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.suggestedRepliesContent}
                    >
                        {chatTags
                            .sort((a, b) => a.order - b.order)
                            .map((tag) => (
                                <TouchableOpacity
                                    key={tag.id}
                                    style={styles.suggestedReplyButton}
                                    onPress={() => handleTagSelect(tag.tag)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.suggestedReplyText}>{tag.tag}</Text>
                                </TouchableOpacity>
                            ))}
                    </ScrollView>
                </View>
            )}

            {/* Input Area */}
            {isBlocked ? (
                <View style={[styles.blockedContainer, {
                    backgroundColor: '#f55473',
                    // paddingBottom: Math.max(insets.bottom, getSpacing(2)),
                }]}>
                    <Text style={styles.blockedText}>You are blocked by admin</Text>
                </View>
            ) : settings?.isChatEnabled !== false ? (
                <Animated.View
                    style={[
                        styles.inputContainer,
                        {
                            // borderTopColor: '#E0E0E0', 
                            backgroundColor: '#FFFFFF',
                            paddingBottom: Math.max(insets.bottom, getSpacing(2)),
                            transform: [{ translateY: inputContainerTranslateY }],
                        }
                    ]}
                >
                    <Animated.View style={{ transform: [{ scale: emojiButtonScale }] }}>
                        <TouchableOpacity
                            style={styles.emojiPickerButton}
                            onPress={toggleEmojiPicker}
                        >
                            <Smile size={moderateScale(22)} color="#666666" />
                        </TouchableOpacity>
                    </Animated.View>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: '#F5F5F5',
                            color: '#000000',
                        }]}
                        placeholder="Type a message..."
                        placeholderTextColor="#999999"
                        value={inputText}
                        onChangeText={handleTextChange}
                        maxLength={settings?.maxMessageLength || 500}
                        onSubmitEditing={handleSendMessage}
                        multiline
                        editable={isConnected && settings?.isChatEnabled}
                        returnKeyType="send"
                        blurOnSubmit={false}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, {
                            backgroundColor: inputText.trim() && isConnected
                                ? '#f55473'
                                : '#E0E0E0'
                        }]}
                        onPress={handleSendMessage}
                        disabled={!inputText.trim() || !settings?.isChatEnabled || !isConnected}
                    >
                        <Send
                            size={20}
                            color={inputText.trim() && isConnected
                                ? '#FFFFFF'
                                : '#999999'}
                        />
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                <View style={[styles.disabledContainer, { backgroundColor: colors.cardBackground }]}>
                    <Text style={[styles.disabledText, { color: colors.textSecondary }]}>
                        Chat is currently disabled
                    </Text>
                </View>
            )}

            {/* Emoji Picker */}
            <EmojiPicker
                onEmojiSelected={handleEmojiSelect}
                open={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
            />

            {/* Report Message Modal */}
            <Modal
                visible={showReportModal}
                transparent
                animationType="fade"
                onRequestClose={() => !isReporting && setShowReportModal(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={[styles.reportModal, { backgroundColor: colors.cardBackground }]}>
                        <View style={styles.reportHeader}>
                            <View style={styles.reportHeaderLeft}>
                                <MoreVertical size={moderateScale(24)} color={colors.error || '#F44336'} />
                                <Text style={[styles.reportTitle, { color: colors.text }]}>
                                    Report Message
                                </Text>
                            </View>
                            {!isReporting && (
                                <TouchableOpacity
                                    onPress={() => setShowReportModal(false)}
                                    style={styles.closeReportButton}
                                >
                                    <X size={moderateScale(24)} color={colors.text} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView
                            style={styles.reportContent}
                            contentContainerStyle={styles.reportContentContainer}
                            showsVerticalScrollIndicator={true}
                            keyboardShouldPersistTaps="handled"
                            nestedScrollEnabled={true}
                            bounces={false}
                        >
                            <Text style={[styles.reportLabel, { color: colors.text }]}>
                                Why are you reporting this message?
                            </Text>

                            {(['spam', 'harassment', 'inappropriate', 'other'] as const).map((reason) => (
                                <TouchableOpacity
                                    key={reason}
                                    style={[
                                        styles.reportReasonOption,
                                        {
                                            backgroundColor: reportReason === reason ? colors.accent + '20' : colors.inputBackground,
                                            borderColor: reportReason === reason ? colors.accent : colors.border,
                                        },
                                    ]}
                                    onPress={() => setReportReason(reason)}
                                    disabled={isReporting}
                                >
                                    <View style={[
                                        styles.reportRadio,
                                        {
                                            borderColor: reportReason === reason ? colors.accent : colors.border,
                                            backgroundColor: reportReason === reason ? colors.accent : 'transparent',
                                        },
                                    ]}>
                                        {reportReason === reason && (
                                            <View style={[styles.reportRadioInner, { backgroundColor: colors.cardBackground }]} />
                                        )}
                                    </View>
                                    <Text style={[styles.reportReasonText, { color: colors.text }]}>
                                        {reason.charAt(0).toUpperCase() + reason.slice(1).replace(/_/g, ' ')}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            {reportReason === 'other' && (
                                <View style={styles.reportDescriptionContainer}>
                                    <Text style={[styles.reportLabel, { color: colors.text }]}>
                                        Please provide more details (optional)
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.reportDescriptionInput,
                                            {
                                                backgroundColor: colors.inputBackground,
                                                borderColor: colors.border,
                                                color: colors.text,
                                            },
                                        ]}
                                        placeholder="Describe the issue..."
                                        placeholderTextColor={colors.textSecondary}
                                        value={reportDescription}
                                        onChangeText={setReportDescription}
                                        multiline
                                        numberOfLines={3}
                                        maxLength={200}
                                        editable={!isReporting}
                                    />
                                </View>
                            )}

                            <View style={styles.reportActions}>
                                <TouchableOpacity
                                    style={[styles.reportCancelButton, { borderColor: colors.border }]}
                                    onPress={() => setShowReportModal(false)}
                                    disabled={isReporting}
                                >
                                    <Text style={[styles.reportCancelText, { color: colors.text }]}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.reportSubmitButton,
                                        {
                                            backgroundColor: reportReason && !isReporting
                                                ? colors.error || '#F44336'
                                                : colors.border,
                                        },
                                    ]}
                                    onPress={handleConfirmReport}
                                    disabled={!reportReason || isReporting}
                                >
                                    {isReporting ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.reportSubmitText}>Report</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
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
        fontSize: safeFont(14),
    },
    header: {
        paddingHorizontal: getSpacing(2),
        paddingVertical: getSpacing(2),
        borderBottomWidth: 1,
        zIndex: 10,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: getSpacing(1.5),
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonText: {
        fontSize: safeFont(24),
        color: '#000000',
        fontWeight: '400',
    },
    headerTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: getSpacing(1),
    },
    headerTitle: {
        fontSize: safeFont(20, 18),
        fontWeight: '600',
        letterSpacing: safeLetterSpacing(0.5),
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#f5547320',
        borderRadius: 12,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#f55473',
    },
    liveText: {
        fontSize: safeFont(11),
        fontWeight: '600',
        color: '#f55473',
        textTransform: 'uppercase',
    },
    searchButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchIcon: {
        fontSize: safeFont(20),
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
        fontSize: safeFont(10),
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
        gap: getSpacing(1),
    },
    pinnedLabel: {
        fontSize: safeFont(10),
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: safeLetterSpacing(0.5),
    },
    pinnedText: {
        fontSize: safeFont(13),
        flex: 1,
        fontWeight: '500',
    },
    listContent: {
        padding: getSpacing(2),
        paddingBottom: getSpacing(1),
        backgroundColor: '#F5F5F5',
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
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        marginTop: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    avatarText: {
        fontSize: safeFont(15),
        fontWeight: '600',
    },
    messageBubble: {
        borderRadius: moderateScale(12),
        paddingHorizontal: getSpacing(2),
        paddingVertical: getSpacing(0.8),
        maxWidth: '100%',
        // elevation: 1,
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 1 },
        // shadowOpacity: 0.08,
        // shadowRadius: 1,
    },
    replyContainer: {
        borderLeftWidth: 3,
        paddingLeft: 8,
        marginBottom: 8,
        opacity: 0.9,
    },
    replySender: {
        fontSize: safeFont(11),
        fontWeight: 'bold',
        marginBottom: 2,
    },
    replyText: {
        fontSize: safeFont(12),
    },
    senderNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: getSpacing(0.5),
        marginBottom: 4,
    },
    senderName: {
        fontSize: safeFont(11, 10),
        fontWeight: '600',
        letterSpacing: safeLetterSpacing(0.2),
    },
    pinnedIconInMessage: {
        marginLeft: getSpacing(0.5),
    },
    pinnedIconContainer: {
        alignSelf: 'flex-start',
        marginBottom: getSpacing(0.5),
    },
    pinnedIconTopRight: {
        position: 'absolute',
        top: getSpacing(0.5),
        right: getSpacing(0.5),
    },
    messageText: {
        fontSize: safeFont(14, 12),
        lineHeight: safeFont(20, 16),
        letterSpacing: safeLetterSpacing(0.1),
    },
    timestampContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: getSpacing(0.5),
        marginTop: 4,
    },
    timestamp: {
        fontSize: safeFont(9),
        opacity: 0.85,
        fontWeight: '400',
    },
    pinnedIconTimestamp: {
        marginLeft: getSpacing(0.5),
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: getSpacing(2),
        paddingTop: getSpacing(1.5),
        paddingBottom: getSpacing(1.5),
        alignItems: 'center',
        gap: getSpacing(1.5),
        // borderTopWidth: 1,
        minHeight: 60,
    },
    input: {
        flex: 1,
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: safeFont(15),
        maxHeight: 100,
        borderWidth: 0,
        minHeight: 44,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 0,
        shadowOpacity: 0,
    },
    disabledContainer: {
        padding: getSpacing(2),
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledText: {
        fontSize: safeFont(14),
        textAlign: 'center',
    },
    blockedContainer: {
        alignItems: 'center',
        width: '40%',
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: getSpacing(1),
        borderRadius: moderateScale(12),
        marginHorizontal: getSpacing(2),
        marginBottom: getSpacing(2),
        alignSelf: 'center',
    },
    blockedText: {
        fontSize: safeFont(10),
        color: '#FFFFFF',
        textAlign: 'center',
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
        textAlign: 'center',
    },
    emojiPickerButton: {
        width: moderateScale(44),
        height: moderateScale(44),
        borderRadius: moderateScale(22),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    reportButton: {
        alignSelf: 'flex-start',
        marginLeft: getSpacing(0),
        marginTop: getSpacing(0.5),
        padding: getSpacing(0.5),
        zIndex: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reportModal: {
        margin: getSpacing(3),
        borderRadius: moderateScale(20),
        maxHeight: '85%',
        minHeight: moderateScale(450),
        overflow: 'hidden',
        width: '90%',
        flexShrink: 1,
        flexDirection: 'column',
    },
    reportHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: getSpacing(2),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    reportHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: getSpacing(1),
    },
    reportTitle: {
        fontSize: safeFont(18),
        fontWeight: '700',
    },
    closeReportButton: {
        padding: getSpacing(0.5),
    },
    reportContent: {
        flex: 1,
    },
    reportContentContainer: {
        padding: getSpacing(2),
        paddingBottom: getSpacing(3),
        flexGrow: 1,
    },
    reportedMessagePreview: {
        padding: getSpacing(1.5),
        borderRadius: moderateScale(12),
        marginBottom: getSpacing(2),
    },
    reportedMessageText: {
        fontSize: safeFont(13),
        fontStyle: 'italic',
        marginBottom: getSpacing(0.5),
    },
    reportedMessageAuthor: {
        fontSize: safeFont(11),
        alignSelf: 'flex-end',
    },
    reportLabel: {
        fontSize: safeFont(14),
        fontWeight: '600',
        marginBottom: getSpacing(1.5),
    },
    reportReasonOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: getSpacing(1.5),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        marginBottom: getSpacing(1),
        gap: getSpacing(1.5),
    },
    reportRadio: {
        width: moderateScale(20),
        height: moderateScale(20),
        borderRadius: moderateScale(10),
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reportRadioInner: {
        width: moderateScale(10),
        height: moderateScale(10),
        borderRadius: moderateScale(5),
    },
    reportReasonText: {
        fontSize: safeFont(14),
        flex: 1,
    },
    reportDescriptionContainer: {
        marginTop: getSpacing(2),
    },
    reportDescriptionInput: {
        borderWidth: 1,
        borderRadius: moderateScale(12),
        padding: getSpacing(1.5),
        fontSize: safeFont(14),
        minHeight: moderateScale(80),
        textAlignVertical: 'top',
        marginTop: getSpacing(1),
    },
    reportActions: {
        flexDirection: 'row',
        gap: getSpacing(2),
        marginTop: getSpacing(3),
        paddingTop: getSpacing(2),
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    reportCancelButton: {
        flex: 1,
        padding: getSpacing(1.5),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        alignItems: 'center',
    },
    reportCancelText: {
        fontSize: safeFont(14),
        fontWeight: '600',
    },
    reportSubmitButton: {
        flex: 1,
        padding: getSpacing(1.5),
        borderRadius: moderateScale(12),
        alignItems: 'center',
        justifyContent: 'center',
    },
    reportSubmitText: {
        color: '#FFFFFF',
        fontSize: safeFont(14),
        fontWeight: '700',
    },
    suggestedRepliesContainer: {
        paddingHorizontal: getSpacing(2),
        paddingVertical: getSpacing(1),
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    suggestedRepliesContent: {
        paddingVertical: getSpacing(0.5),
        gap: getSpacing(1),
    },
    suggestedReplyButton: {
        paddingHorizontal: getSpacing(2),
        paddingVertical: getSpacing(1),
        borderRadius: moderateScale(20),
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginRight: getSpacing(1),
    },
    suggestedReplyText: {
        fontSize: safeFont(13),
        color: '#000000',
    },
});

export default LiveChat;
