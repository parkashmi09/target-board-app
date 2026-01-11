import io, { Socket } from 'socket.io-client';
import { SOCKET_URL } from './config';

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

export interface ChatTag {
    id: string;
    tag: string;
    order: number;
}

export interface RoomData {
    streamId: string;
    settings: ChatSettings;
    recentMessages: ChatMessage[];
    onlineCount: number;
    userName: string;
    pinnedMessage: any | null;
    isAdmin: boolean;
    isBlocked?: boolean;
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
    private isConnected: boolean = false;
    private pendingJoinStream: string | null = null;

    initialize(token: string) {
        if (this.socket) {
            this.disconnect();
        }
        this.token = token;
        
        // Get socket URL from config or use fallback
        let socketUrl = SOCKET_URL || 'https://shark-app-2-dzcvn.ondigitalocean.app/';
        
        // Remove trailing slash for socket.io (it adds its own path)
        socketUrl = socketUrl.replace(/\/+$/, '');
        
        // Validate URL - warn if using wrong URL
        const correctUrl = 'shark-app-2-dzcvn.ondigitalocean.app';
        if (__DEV__) {
            console.log('[SocketService] Initializing socket with URL:', socketUrl);
            if (!SOCKET_URL) {
                console.warn('[SocketService] SOCKET_URL not found in config, using fallback URL');
            } else if (!socketUrl.includes(correctUrl)) {
                console.error('[SocketService] ⚠️ WARNING: Using incorrect socket URL!');
                console.error('[SocketService] Current URL:', socketUrl);
                console.error('[SocketService] Expected URL should contain:', correctUrl);
                console.error('[SocketService] Please check your .env file and rebuild the app');
            }
        }
        
        this.socket = io(socketUrl, {
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
            this.isConnected = true;
            if (__DEV__) {
                console.log('[SocketService] Connected to socket server');
            }
            
            // If there's a pending join stream, execute it now
            if (this.pendingJoinStream && this.socket) {
                if (__DEV__) {
                    console.log('[SocketService] Joining pending stream:', this.pendingJoinStream);
                }
                this.socket.emit('join-stream', { streamId: this.pendingJoinStream });
                this.pendingJoinStream = null;
            }
        });

        this.socket.on('connect_error', (error) => {
            this.isConnected = false;
            if (__DEV__) {
                console.error('[SocketService] Connection error:', error);
            }
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            if (__DEV__) {
                console.log('[SocketService] Disconnected:', reason);
            }
        });

        this.socket.on('error', (error) => {
            if (__DEV__) {
                console.error('[SocketService] Socket error:', error);
            }
        });
    }

    isSocketConnected(): boolean {
        return this.isConnected && this.socket?.connected === true;
    }

    joinStream(streamId: string) {
        if (!this.socket) {
            if (__DEV__) {
                console.warn('[SocketService] Cannot join stream: socket not initialized');
            }
            return;
        }

        // If socket is already connected, join immediately
        if (this.isSocketConnected()) {
            if (__DEV__) {
                console.log('[SocketService] Joining stream immediately:', streamId);
            }
            this.socket.emit('join-stream', { streamId });
        } else {
            // Store as pending to join when connected
            if (__DEV__) {
                console.log('[SocketService] Socket not connected yet, storing as pending:', streamId);
            }
            this.pendingJoinStream = streamId;
        }
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

    reportMessage(streamId: string, messageId: string, reason: string, description?: string) {
        if (!this.socket) return;
        this.socket.emit('report-message', { streamId, messageId, reason, description });
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

    onReportSuccess(callback: (data: { reportId: string; message: string }) => void) {
        this.socket?.on('report-success', callback);
    }

    onReportError(callback: (error: { message: string }) => void) {
        this.socket?.on('report-error', callback);
    }

    onChatTags(callback: (data: { tags: ChatTag[] }) => void) {
        this.socket?.on('chat-tags', callback);
    }

    off(event: string) {
        this.socket?.off(event);
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
        this.pendingJoinStream = null;
    }

    // Listen for connection status changes
    onConnect(callback: () => void) {
        this.socket?.on('connect', callback);
    }

    onDisconnect(callback: (reason: string) => void) {
        this.socket?.on('disconnect', callback);
    }

    onConnectError(callback: (error: Error) => void) {
        this.socket?.on('connect_error', callback);
    }
}

export const socketService = new SocketService();
