// Chat Store - Zustand

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { chatService } from '@/services/api/chatService';
import { socketManager } from '@/services/websocket/socketManager';
import { WS_EVENTS } from '@/utils/constants';
import type { Conversation, Message, SendMessageDto } from '@/types/chat.types';

interface ChatState {
    // State
    conversations: Conversation[];
    messages: Record<string, Message[]>; // conversationId -> messages
    activeConversationId: string | null;
    onlineUsers: Set<string>; // Set of online user IDs
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId: string) => Promise<void>;
    sendMessage: (dto: SendMessageDto) => Promise<void>;
    setActiveConversation: (conversationId: string | null) => void;
    addMessage: (message: Message) => void;
    clearError: () => void;
    initWebSocketListeners: () => void;
    markConversationAsRead: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>()(
    devtools((set, get) => ({
        // Initial state
        conversations: [],
        messages: {},
        activeConversationId: null,
        onlineUsers: new Set<string>(),
        isLoading: false,
        error: null,

        // Fetch conversations
        fetchConversations: async () => {
            // Check if user is authenticated
            const token = localStorage.getItem('auth_token');
            if (!token) {
                console.warn('[chatStore] No auth token, skipping fetch conversations');
                return;
            }

            set({ isLoading: true, error: null });
            try {
                const conversations = await chatService.getConversations();
                console.log('[chatStore] Fetched conversations:', conversations);

                // Ensure conversations is always an array
                const conversationsArray = Array.isArray(conversations) ? conversations : [];
                set({ conversations: conversationsArray, isLoading: false });
            } catch (error: any) {
                // Don't set error if it's a 401 (handled by interceptor)
                if (error.response?.status === 401) {
                    console.warn('[chatStore] Unauthorized, token may be expired');
                    set({ isLoading: false });
                    return;
                }

                const errorMessage = error.response?.data?.message || 'Failed to fetch conversations';
                console.error('❌ [chatStore] Error fetching conversations:', error);
                set({ error: errorMessage, isLoading: false, conversations: [] });
            }
        },

        // Fetch messages for a conversation
        fetchMessages: async (conversationId) => {
            set({ isLoading: true, error: null });
            try {
                const messages = await chatService.getMessages(conversationId);
                set((state) => ({
                    messages: {
                        ...state.messages,
                        [conversationId]: messages,
                    },
                    isLoading: false,
                }));
            } catch (error: any) {
                const errorMessage = error.response?.data?.message || 'Failed to fetch messages';
                console.error('❌ [chatStore] Error fetching messages:', error);
                set({ error: errorMessage, isLoading: false });
            }
        },

        // Send message
        sendMessage: async (dto) => {
            try {
                const message = await chatService.sendMessage(dto.conversationId, dto);
                get().addMessage(message);
            } catch (error: any) {
                const errorMessage = error.response?.data?.message || 'Failed to send message';
                set({ error: errorMessage });
                throw error;
            }
        },

        // Set active conversation
        setActiveConversation: (conversationId) => {
            const previousConversationId = get().activeConversationId;

            // Don't do anything if it's the same conversation
            if (previousConversationId === conversationId) {
                return;
            }

            // Leave previous conversation
            if (previousConversationId && socketManager.isConnected) {
                socketManager.emit(WS_EVENTS.LEAVE_CONVERSATION, { conversationId: previousConversationId });
                console.log('[chatStore] Left conversation:', previousConversationId);
            }

            set({ activeConversationId: conversationId });

            if (conversationId) {
                // Join new conversation (only if socket is connected)
                if (socketManager.isConnected) {
                    socketManager.emit(WS_EVENTS.JOIN_CONVERSATION, { conversationId });
                    console.log('[chatStore] Joined conversation:', conversationId);
                } else {
                    console.warn('[chatStore] Socket not connected, will join on connect');
                }

                // Mark conversation as read (clear unread count and bold styling)
                get().markConversationAsRead(conversationId);

                // Fetch messages if not already loaded
                const { messages } = get();
                if (!messages[conversationId]) {
                    get().fetchMessages(conversationId);
                }
            }
        },

        // Add message (called by WebSocket or after sending)
        addMessage: (message) => {
            set((state) => {
                const conversationMessages = state.messages[message.conversationId] || [];

                // Check if message already exists
                const exists = conversationMessages.some((m) => m.id === message.id);
                if (exists) return state;

                return {
                    messages: {
                        ...state.messages,
                        [message.conversationId]: [...conversationMessages, message],
                    },
                };
            });

            // Update conversation's last message
            set((state) => ({
                conversations: state.conversations.map((conv) =>
                    conv.id === message.conversationId
                        ? { ...conv, lastMessage: message }
                        : conv
                ),
            }));
        },

        // Clear error
        clearError: () => set({ error: null }),

        // Mark conversation as read (clear unread count)
        markConversationAsRead: (conversationId) => {
            set((state) => ({
                conversations: state.conversations.map((conv) =>
                    conv.id === conversationId
                        ? { ...conv, unreadCount: 0 }
                        : conv
                ),
            }));
        },

        // Initialize WebSocket listeners
        initWebSocketListeners: () => {
            // Join active conversation when socket connects/reconnects
            const handleAuthenticated = () => {
                const { activeConversationId } = get();
                if (activeConversationId && socketManager.isConnected) {
                    console.log('[chatStore] Socket authenticated, joining conversation:', activeConversationId);
                    socketManager.emit(WS_EVENTS.JOIN_CONVERSATION, { conversationId: activeConversationId });
                }
            };
            socketManager.on('authenticated', handleAuthenticated);

            // Listen for new messages
            socketManager.on(WS_EVENTS.MESSAGE_NEW, (message: Message) => {
                console.log('[chatStore] Received new message via WebSocket:', message);
                get().addMessage(message);
            });

            // Listen for message updates
            socketManager.on(WS_EVENTS.MESSAGE_UPDATED, (message: Message) => {
                set((state) => {
                    const conversationMessages = state.messages[message.conversationId] || [];
                    return {
                        messages: {
                            ...state.messages,
                            [message.conversationId]: conversationMessages.map((m) =>
                                m.id === message.id ? message : m
                            ),
                        },
                    };
                });
            });

            // Listen for message deletions
            socketManager.on(WS_EVENTS.MESSAGE_DELETED, ({ messageId, conversationId }) => {
                set((state) => {
                    const conversationMessages = state.messages[conversationId] || [];
                    return {
                        messages: {
                            ...state.messages,
                            [conversationId]: conversationMessages.filter((m) => m.id !== messageId),
                        },
                    };
                });
            });

            // Listen for presence updates
            socketManager.on(WS_EVENTS.USER_ONLINE, ({ userId }: { userId: string }) => {
                console.log('[chatStore] User came online:', userId);
                set((state) => {
                    const newOnlineUsers = new Set(state.onlineUsers);
                    newOnlineUsers.add(userId);
                    return {
                        onlineUsers: newOnlineUsers,
                        // Update participant's online status in conversations
                        conversations: state.conversations.map((conv) => ({
                            ...conv,
                            participants: conv.participants?.map((p) =>
                                p.id === userId ? { ...p, isOnline: true } : p
                            ),
                        })),
                    };
                });
            });

            socketManager.on(WS_EVENTS.USER_OFFLINE, ({ userId }: { userId: string }) => {
                console.log('[chatStore] User went offline:', userId);
                set((state) => {
                    const newOnlineUsers = new Set(state.onlineUsers);
                    newOnlineUsers.delete(userId);
                    return {
                        onlineUsers: newOnlineUsers,
                        // Update participant's online status in conversations
                        conversations: state.conversations.map((conv) => ({
                            ...conv,
                            participants: conv.participants?.map((p) =>
                                p.id === userId ? { ...p, isOnline: false } : p
                            ),
                        })),
                    };
                });
            });

            // Listen for general presence updates
            socketManager.on('presence_update', ({ userId, status }: { userId: string; status: string }) => {
                console.log('[chatStore] Presence update:', userId, status);
                const isOnline = status === 'online';
                set((state) => {
                    const newOnlineUsers = new Set(state.onlineUsers);
                    if (isOnline) {
                        newOnlineUsers.add(userId);
                    } else {
                        newOnlineUsers.delete(userId);
                    }
                    return {
                        onlineUsers: newOnlineUsers,
                        conversations: state.conversations.map((conv) => ({
                            ...conv,
                            participants: conv.participants?.map((p) =>
                                p.id === userId ? { ...p, isOnline } : p
                            ),
                        })),
                    };
                });
            });
        },
    }))
);
