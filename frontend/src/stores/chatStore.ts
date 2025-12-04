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
}

export const useChatStore = create<ChatState>()(
    devtools((set, get) => ({
        // Initial state
        conversations: [],
        messages: {},
        activeConversationId: null,
        isLoading: false,
        error: null,

        // Fetch conversations
        fetchConversations: async () => {
            set({ isLoading: true, error: null });
            try {
                const conversations = await chatService.getConversations();
                // Ensure conversations is always an array
                set({ conversations: Array.isArray(conversations) ? conversations : [], isLoading: false });
            } catch (error: any) {
                const errorMessage = error.response?.data?.message || 'Failed to fetch conversations';
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
                set({ error: errorMessage, isLoading: false });
            }
        },

        // Send message
        sendMessage: async (dto) => {
            try {
                const message = await chatService.sendMessage(dto);
                get().addMessage(message);
            } catch (error: any) {
                const errorMessage = error.response?.data?.message || 'Failed to send message';
                set({ error: errorMessage });
                throw error;
            }
        },

        // Set active conversation
        setActiveConversation: (conversationId) => {
            set({ activeConversationId: conversationId });

            if (conversationId) {
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

        // Initialize WebSocket listeners
        initWebSocketListeners: () => {
            // Listen for new messages
            socketManager.on(WS_EVENTS.MESSAGE_NEW, (message: Message) => {
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
        },
    }))
);
