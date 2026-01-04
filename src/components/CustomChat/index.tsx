import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Send, MessageCircle } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';

interface ChatMessage {
    id: string;
    text: string;
    sender: string;
    timestamp: Date;
    isOwnMessage?: boolean;
}

interface CustomChatProps {
    roomId?: string;
    username?: string;
}

const CustomChat: React.FC<CustomChatProps> = ({ roomId, username = 'Guest' }) => {
    const theme = useTheme();
    const { colors, isDark } = theme;
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        // Add welcome message
        const welcomeMessage: ChatMessage = {
            id: '1',
            text: 'No chats yet! Start conversing to see your messages here.',
            sender: 'System',
            timestamp: new Date(),
            isOwnMessage: false,
        };
        setMessages([welcomeMessage]);
    }, []);

    const handleSend = () => {
        if (inputText.trim()) {
            const newMessage: ChatMessage = {
                id: Date.now().toString(),
                text: inputText.trim(),
                sender: username,
                timestamp: new Date(),
                isOwnMessage: true,
            };
            setMessages((prev) => [...prev, newMessage]);
            setInputText('');
            
            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => {
        if (item.sender === 'System') {
            return (
                <View style={styles.systemMessageContainer}>
                    <View style={styles.systemMessage}>
                        <MessageCircle size={48} color={colors.textSecondary || '#999'} />
                        <Text style={[styles.systemMessageText, { color: colors.textSecondary || '#999' }]}>
                            {item.text}
                        </Text>
                    </View>
                </View>
            );
        }

        return (
            <View
                style={[
                    styles.messageContainer,
                    item.isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
                ]}
            >
                <View
                    style={[
                        styles.messageBubble,
                        item.isOwnMessage
                            ? {
                                  backgroundColor: colors.primary || '#7b1fa2',
                              }
                            : {
                                  backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                                  borderWidth: 1,
                                  borderColor: isDark ? colors.border || '#333' : '#E0E0E0',
                              },
                    ]}
                >
                    {!item.isOwnMessage && (
                        <Text
                            style={[
                                styles.senderName,
                                { color: colors.textSecondary || '#999' },
                            ]}
                        >
                            {item.sender}
                        </Text>
                    )}
                    <Text
                        style={[
                            styles.messageText,
                            {
                                color: item.isOwnMessage
                                    ? '#FFFFFF'
                                    : colors.text || (isDark ? '#FFFFFF' : '#000000'),
                            },
                        ]}
                    >
                        {item.text}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        styles.messagesList,
                        messages.length === 0 && styles.emptyList,
                    ]}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }}
                />

                {/* Input Area */}
                <View
                    style={[
                        styles.inputContainer,
                        {
                            backgroundColor: isDark
                                ? colors.cardBackground || '#2A2A2A'
                                : '#F8F8F8',
                            borderTopColor: isDark
                                ? colors.border || '#333'
                                : '#E0E0E0',
                        },
                    ]}
                >
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: isDark
                                    ? '#1A1A1A'
                                    : '#FFFFFF',
                                color: colors.text || (isDark ? '#FFFFFF' : '#000000'),
                                borderColor: isDark
                                    ? colors.border || '#333'
                                    : '#E0E0E0',
                            },
                        ]}
                        placeholder="Type a message..."
                        placeholderTextColor={colors.textSecondary || '#999'}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                        onSubmitEditing={handleSend}
                        blurOnSubmit={false}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        style={[
                            styles.sendButton,
                            {
                                backgroundColor: colors.primary || '#7b1fa2',
                            },
                        ]}
                        disabled={!inputText.trim()}
                    >
                        <Send
                            size={20}
                            color={inputText.trim() ? '#FFFFFF' : colors.textSecondary || '#999'}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    keyboardView: {
        flex: 1,
    },
    messagesList: {
        flexGrow: 1,
        padding: getSpacing(2),
        paddingBottom: getSpacing(1),
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageContainer: {
        marginVertical: getSpacing(0.5),
        paddingHorizontal: getSpacing(1),
    },
    ownMessageContainer: {
        alignItems: 'flex-end',
    },
    otherMessageContainer: {
        alignItems: 'flex-start',
    },
    systemMessageContainer: {
        alignItems: 'center',
        paddingVertical: getSpacing(3),
    },
    messageBubble: {
        maxWidth: '75%',
        paddingHorizontal: getSpacing(2),
        paddingVertical: getSpacing(1.5),
        borderRadius: 16,
        marginBottom: getSpacing(0.5),
    },
    senderName: {
        fontSize: moderateScale(12),
        fontWeight: '600',
        marginBottom: getSpacing(0.5),
    },
    messageText: {
        fontSize: moderateScale(14),
        lineHeight: moderateScale(20),
    },
    systemMessage: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: getSpacing(2),
    },
    systemMessageText: {
        fontSize: moderateScale(14),
        fontWeight: '600',
        textAlign: 'center',
        marginTop: getSpacing(1),
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: getSpacing(2),
        borderTopWidth: 1,
        gap: getSpacing(1.5),
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        paddingHorizontal: getSpacing(2),
        paddingVertical: getSpacing(1.5),
        borderRadius: 20,
        borderWidth: 1,
        fontSize: moderateScale(14),
        textAlignVertical: 'center',
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default CustomChat;

