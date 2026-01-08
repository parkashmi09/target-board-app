import io, { Socket } from 'socket.io-client';

const BASE_URL = 'https://shark-app-2-dzcvn.ondigitalocean.app/';

export interface ChatMessage {
    id: string;
    streamId: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: string;
    isAdmin: boolean;
    isReply: boolean;
    originalMessageId?: string | null;
}

export interface ChatSettings {
    isPrivateMode: boolean;
    isChatEnabled: boolean;
    maxMessageLength: number;
    rateLimitPerMinute: number;
    messageGapSeconds: number;
}

export interface RoomData {
    streamId: string;
    settings: ChatSettings;
    recentMessages: ChatMessage[];
    onlineCount: number;
    userName: string;
    pinnedMessage: any | null;
    isAdmin: boolean;
}

export interface JoinRoomPayload {
    streamId: string;
}

export interface SendMessagePayload {
    streamId: string;
    message: string;
}

class SocketService {
    private socket: Socket | null = null;
    private token: string | null = null;

    initialize(token: string) {
        if (this.socket) {
            this.disconnect();
        }
        this.token = token;
        this.socket = io(BASE_URL, {
            auth: {
                token: this.token,
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.setupCommonListeners();
    }

    private setupCommonListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            if (__DEV__) {
                console.log('✅ Connected to chat service', this.socket?.id);
            }
        });

        this.socket.on('connect_error', (error) => {
            if (__DEV__) {
                console.error('❌ Connection error:', error.message);
            }
        });

        this.socket.on('disconnect', (reason) => {
            if (__DEV__) {
                console.log('❌ Disconnected:', reason);
            }
        });

        this.socket.on('error', (error) => {
            if (__DEV__) {
                console.error('Socket error event:', error);
            }
        });
    }

    joinStream(streamId: string) {
        if (!this.socket) return;
        this.socket.emit('join-stream', { streamId });
    }

    leaveStream(streamId: string) {
        if (!this.socket) return;
        this.socket.emit('leave-stream', { streamId });
    }

    sendMessage(streamId: string, message: string) {
        if (!this.socket) return;
        this.socket.emit('send-message', { streamId, message });
    }

    startTyping(streamId: string) {
        if (!this.socket) return;
        this.socket.emit('typing-start', { streamId });
    }

    stopTyping(streamId: string) {
        if (!this.socket) return;
        this.socket.emit('typing-stop', { streamId });
    }

    // Event Listeners
    onJoinedRoom(callback: (data: RoomData) => void) {
        this.socket?.on('joined-room', callback);
    }

    onMessageReceived(callback: (message: ChatMessage) => void) {
        this.socket?.on('message-received', callback);
    }

    onMessageSent(callback: (data: { messageId: string }) => void) {
        this.socket?.on('message-sent', callback);
    }

    onUserJoined(callback: (data: { userId: string; userName: string; onlineCount: number }) => void) {
        this.socket?.on('user-joined', callback);
    }

    onUserLeft(callback: (data: { userId: string; onlineCount: number }) => void) {
        this.socket?.on('user-left', callback);
    }

    onUserTyping(callback: (data: { userId: string; userName: string; streamId: string }) => void) {
        this.socket?.on('user-typing', callback);
    }

    onUserStoppedTyping(callback: (data: { userId: string; streamId: string }) => void) {
        this.socket?.on('user-stopped-typing', callback);
    }

    onMessageDeleted(callback: (data: { messageId: string; streamId: string }) => void) {
        this.socket?.on('message-deleted', callback);
    }

    onMessagePinned(callback: (data: { streamId: string; pinnedMessage: any }) => void) {
        this.socket?.on('message-pinned', callback);
    }

    onMessageUnpinned(callback: (data: { streamId: string }) => void) {
        this.socket?.on('message-unpinned', callback);
    }

    onSettingsUpdated(callback: (data: { streamId: string; settings: ChatSettings }) => void) {
        this.socket?.on('settings-updated', callback);
    }

    onError(callback: (error: any) => void) {
        this.socket?.on('error', callback);
    }

    off(event: string) {
        this.socket?.off(event);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
