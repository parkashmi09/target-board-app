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
} from 'react-native';
import { Send, Smile, MoreVertical, X } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { socketService, ChatMessage, ChatSettings } from '../../services/socketService';
import EmojiSelector from 'react-native-emoji-selector';
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
    
    // Animation refs
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
            setIsConnected(true);
            setMessages(data.recentMessages || []);
            setSettings(data.settings);
            setPinnedMessage(data.pinnedMessage);
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

        console.log('[LiveChat] Sending message:', inputText.trim());
        socketService.sendMessage(streamId, inputText.trim());
        setInputText('');
    };

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
                            backgroundColor: '#FFFFFF', 
                            borderRadius: moderateScale(4),
                            elevation: 1,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.08,
                            shadowRadius: 1,
                        } :
                        { 
                            backgroundColor: '#FF4444', 
                            borderRadius: moderateScale(4),
                            elevation: 1,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 1,
                        },
                    isAdmin && !isOwnMessage && { 
                        backgroundColor: '#FF6666', 
                    }
                ]}>
                    {replyTo && (
                        <View style={[styles.replyContainer, { borderLeftColor: isOwnMessage ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }]}>
                            <Text style={[styles.replySender, { color: isOwnMessage ? '#000000' : '#FFFFFF' }]}>{replyTo.userName}</Text>
                            <Text numberOfLines={1} style={[styles.replyText, { color: isOwnMessage ? '#666666' : 'rgba(255,255,255,0.8)' }]}>
                                {replyTo.message}
                            </Text>
                        </View>
                    )}

                    {/* Show sender name for all messages */}
                        <Text style={[styles.senderName, { 
                            color: isOwnMessage 
                                ? '#000000' 
                                : '#FFFFFF'
                        }]}>
                            {isOwnMessage ? 'You' : item.userName} {isAdmin && '�️'}
                        </Text>

                    <Text style={[
                        styles.messageText,
                        { 
                            color: isOwnMessage 
                                ? '#000000' 
                                : '#FFFFFF'
                        }
                    ]}>
                        {item.message}
                    </Text>

                    <Text style={[
                        styles.timestamp,
                        { 
                            color: isOwnMessage 
                                ? '#666666' 
                                : 'rgba(255,255,255,0.85)'
                        }
                    ]}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
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
            {/* Header */}
            <View style={[styles.header, { 
                borderBottomColor: colors.border, 
                backgroundColor: '#FFFFFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 4,
            }]}>
                <View style={styles.headerContent}>
                    {onClose && (
                        <TouchableOpacity onPress={onClose} style={styles.backButton}>
                            <Text style={styles.backButtonText}>←</Text>
                        </TouchableOpacity>
                    )}
                    <View style={styles.headerTitleContainer}>
                        <Text style={[styles.headerTitle, { color: '#000000' }]}>
                            Live Chat
                        </Text>
                        {isConnected && (
                            <View style={styles.liveIndicator}>
                                <View style={styles.liveDot} />
                                <Text style={styles.liveText}>Live</Text>
                    </View>
                        )}
                    </View>
                    <TouchableOpacity style={styles.searchButton}>
                        <Text style={styles.searchIcon}>🔍</Text>
                    </TouchableOpacity>
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
                    { backgroundColor: '#F5F5F5' }
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No messages yet. Start the conversation!
                        </Text>
                    </View>
                }
            />

            {/* Input Area */}
            {settings?.isChatEnabled !== false ? (
                <View style={[styles.inputContainer, { 
                    borderTopColor: '#E0E0E0', 
                    backgroundColor: '#FFFFFF',
                    paddingBottom: Math.max(insets.bottom, getSpacing(2)),
                }]}>
                    <Animated.View style={{ transform: [{ scale: emojiButtonScale }] }}>
                        <TouchableOpacity
                            style={styles.emojiButton}
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
                                ? '#FF4444' 
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
                        <EmojiSelector
                            onEmojiSelected={(emoji: string) => handleEmojiSelect(emoji)}
                            showTabs={true}
                            showSearchBar={true}
                            showSectionTitles={true}
                            columns={8}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Report Message Modal */}
            <Modal
                visible={showReportModal}
                transparent
                animationType="fade"
                onRequestClose={() => !isReporting && setShowReportModal(false)}
            >
                <View style={styles.modalOverlay}>
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

                        <ScrollView style={styles.reportContent} showsVerticalScrollIndicator={false}>
                            {selectedMessage && (
                                <View style={[styles.reportedMessagePreview, { backgroundColor: colors.inputBackground }]}>
                                    <Text style={[styles.reportedMessageText, { color: colors.textSecondary }]}>
                                        "{selectedMessage.message}"
                                    </Text>
                                    <Text style={[styles.reportedMessageAuthor, { color: colors.textSecondary }]}>
                                        - {selectedMessage.userName}
                                    </Text>
                                </View>
                            )}

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
                </View>
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
        fontSize: moderateScale(24),
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
        fontSize: moderateScale(20),
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#FF444420',
        borderRadius: 12,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF4444',
    },
    liveText: {
        fontSize: moderateScale(11),
        fontWeight: '600',
        color: '#FF4444',
        textTransform: 'uppercase',
    },
    searchButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchIcon: {
        fontSize: moderateScale(20),
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
        fontSize: moderateScale(15),
        fontWeight: '600',
    },
    messageBubble: {
        borderRadius: moderateScale(4),
        paddingHorizontal: getSpacing(1.5),
        paddingVertical: getSpacing(1),
        maxWidth: '80%',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 1,
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
        fontWeight: '600',
        marginBottom: 4,
        letterSpacing: 0.2,
    },
    messageText: {
        fontSize: moderateScale(14),
        lineHeight: 20,
        letterSpacing: 0.1,
    },
    timestamp: {
        fontSize: moderateScale(9),
        marginTop: 4,
        alignSelf: 'flex-end',
        opacity: 0.85,
        fontWeight: '400',
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: getSpacing(2),
        paddingTop: getSpacing(1.5),
        paddingBottom: getSpacing(1.5),
        alignItems: 'center',
        gap: getSpacing(1.5),
        borderTopWidth: 1,
        minHeight: 60,
    },
    emojiButton: {
        width: moderateScale(44),
        height: moderateScale(44),
        borderRadius: moderateScale(22),
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    input: {
        flex: 1,
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: moderateScale(15),
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
    reportButton: {
        alignSelf: 'flex-start',
        marginLeft: getSpacing(0.5),
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
        maxHeight: '80%',
        overflow: 'hidden',
        width: '90%',
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
        fontSize: moderateScale(18),
        fontWeight: '700',
    },
    closeReportButton: {
        padding: getSpacing(0.5),
    },
    reportContent: {
        padding: getSpacing(2),
        maxHeight: moderateScale(400),
    },
    reportedMessagePreview: {
        padding: getSpacing(1.5),
        borderRadius: moderateScale(12),
        marginBottom: getSpacing(2),
    },
    reportedMessageText: {
        fontSize: moderateScale(13),
        fontStyle: 'italic',
        marginBottom: getSpacing(0.5),
    },
    reportedMessageAuthor: {
        fontSize: moderateScale(11),
        alignSelf: 'flex-end',
    },
    reportLabel: {
        fontSize: moderateScale(14),
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
        fontSize: moderateScale(14),
        flex: 1,
    },
    reportDescriptionContainer: {
        marginTop: getSpacing(2),
    },
    reportDescriptionInput: {
        borderWidth: 1,
        borderRadius: moderateScale(12),
        padding: getSpacing(1.5),
        fontSize: moderateScale(14),
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
        fontSize: moderateScale(14),
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
        fontSize: moderateScale(14),
        fontWeight: '700',
    },
});

export default LiveChat;
