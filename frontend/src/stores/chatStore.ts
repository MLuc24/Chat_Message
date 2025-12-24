// Chat Store - Zustand

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { chatService } from '@/services/api/chatService';
import { socketManager } from '@/services/websocket/socketManager';
import { WS_EVENTS } from '@/utils/constants';
import { useAuthStore } from './authStore';
import type { 
    Conversation, 
    Message, 
    SendMessageDto,
    MemberAddedEvent,
    MemberRemovedEvent,
    GroupUpdatedEvent,
    MessageReactionEvent
} from '@/types/chat.types';

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
    
    // Group actions
    addConversation: (conversation: Conversation) => void;
    updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
    removeConversation: (conversationId: string) => void;
    handleMemberAdded: (event: MemberAddedEvent) => void;
    handleMemberRemoved: (event: MemberRemovedEvent) => void;
    handleGroupUpdated: (event: GroupUpdatedEvent) => void;
    
    // Reaction actions
    toggleReaction: (messageId: string, emoji: string) => Promise<void>;
    handleReactionEvent: (event: MessageReactionEvent) => void;
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

                // Ensure conversations is always an array
                const conversationsArray = Array.isArray(conversations) ? conversations : [];
                
                // Initialize online users from current socket state
                const currentOnlineUsers = get().onlineUsers;
                
                // Update participants with current online status
                const conversationsWithOnlineStatus = conversationsArray.map((conv) => ({
                    ...conv,
                    participants: conv.participants?.map((p) => ({
                        ...p,
                        isOnline: currentOnlineUsers.has(p.id),
                    })),
                }));
                
                // Sort conversations by last message timestamp (most recent first)
                const sortedConversations = conversationsWithOnlineStatus.sort((a, b) => {
                    const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
                    const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
                    return timeB - timeA;
                });
                
                set({ conversations: sortedConversations, isLoading: false });
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
        setActiveConversation: async (conversationId) => {
            const previousConversationId = get().activeConversationId;

            // Don't do anything if it's the same conversation
            if (previousConversationId === conversationId) {
                return;
            }

            // Leave previous conversation for typing indicators
            if (previousConversationId && socketManager.isConnected) {
                socketManager.emit(WS_EVENTS.LEAVE_CONVERSATION, { conversationId: previousConversationId });
            }

            set({ activeConversationId: conversationId });

            if (conversationId) {
                // Join new conversation for typing indicators only
                if (socketManager.isConnected) {
                    socketManager.emit(WS_EVENTS.JOIN_CONVERSATION, { conversationId });
                }

                // Mark conversation as read (clear unread count and bold styling)
                get().markConversationAsRead(conversationId);

                // Mark as read on backend
                try {
                    await chatService.markConversationAsRead(conversationId);
                } catch (error) {
                    console.error('[chatStore] Failed to mark conversation as read:', error);
                }

                // Fetch messages if not already loaded
                const { messages } = get();
                if (!messages[conversationId]) {
                    get().fetchMessages(conversationId);
                }
            }
        },

        // Add message (called by WebSocket or after sending)
        addMessage: (message) => {
            const { activeConversationId } = get();
            const currentUserId = useAuthStore.getState().user?.id;
            const isActiveConversation = message.conversationId === activeConversationId;
            const isOwnMessage = message.senderId === currentUserId;

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

            // Update conversation's last message, unread count, and re-sort
            set((state) => {
                const updatedConversations = state.conversations.map((conv) =>
                    conv.id === message.conversationId
                        ? {
                              ...conv,
                              lastMessage: message,
                              // Increment unread count only if not viewing this conversation
                              // and the message is from someone else (not current user)
                              unreadCount: !isActiveConversation && !isOwnMessage
                                  ? (conv.unreadCount || 0) + 1
                                  : conv.unreadCount,
                          }
                        : conv
                );

                // Sort conversations by last message timestamp (most recent first)
                const sortedConversations = updatedConversations.sort((a, b) => {
                    const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
                    const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
                    return timeB - timeA;
                });

                return { conversations: sortedConversations };
            });
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

        // Add a new conversation (e.g., when creating a group)
        addConversation: (conversation) => {
            set((state) => {
                // Check if conversation already exists
                const exists = state.conversations.some((c) => c.id === conversation.id);
                if (exists) return state;
                
                return {
                    conversations: [conversation, ...state.conversations],
                };
            });
        },

        // Update an existing conversation
        updateConversation: (conversationId, updates) => {
            set((state) => ({
                conversations: state.conversations.map((conv) =>
                    conv.id === conversationId
                        ? { ...conv, ...updates }
                        : conv
                ),
            }));
        },

        // Remove a conversation (e.g., when leaving a group)
        removeConversation: (conversationId) => {
            set((state) => {
                const newMessages = { ...state.messages };
                delete newMessages[conversationId];
                
                return {
                    conversations: state.conversations.filter((c) => c.id !== conversationId),
                    messages: newMessages,
                    activeConversationId: 
                        state.activeConversationId === conversationId 
                            ? null 
                            : state.activeConversationId,
                };
            });
        },

        // Handle member added to group
        handleMemberAdded: (event) => {
            set((state) => ({
                conversations: state.conversations.map((conv) => {
                    if (conv.id !== event.conversationId) return conv;
                    
                    // Add new member if not already present
                    const memberExists = conv.members.some((m) => m.userId === event.userId);
                    if (memberExists) return conv;
                    
                    return {
                        ...conv,
                        members: [
                            ...conv.members,
                            { userId: event.userId, role: event.role },
                        ],
                    };
                }),
            }));
        },

        // Handle member removed from group
        handleMemberRemoved: (event) => {
            const currentUserId = useAuthStore.getState().user?.id;
            
            // If current user was removed, remove the conversation
            if (event.userId === currentUserId) {
                get().removeConversation(event.conversationId);
                return;
            }
            
            // Otherwise, just update the members list
            set((state) => ({
                conversations: state.conversations.map((conv) => {
                    if (conv.id !== event.conversationId) return conv;
                    
                    return {
                        ...conv,
                        members: conv.members.filter((m) => m.userId !== event.userId),
                        participants: conv.participants?.filter((p) => p.id !== event.userId),
                    };
                }),
            }));
        },

        // Handle group updated (name, avatar, theme)
        handleGroupUpdated: (event) => {
            set((state) => ({
                conversations: state.conversations.map((conv) => {
                    if (conv.id !== event.conversationId) return conv;
                    
                    return {
                        ...conv,
                        name: event.name ?? conv.name,
                        avatarUrl: event.avatarUrl ?? conv.avatarUrl,
                        themeId: event.themeId ?? conv.themeId,
                    };
                }),
            }));
        },

        // Initialize WebSocket listeners
        initWebSocketListeners: () => {
            // Join active conversation when socket connects/reconnects
            const handleAuthenticated = (data: { userId: string }) => {
                const { activeConversationId } = get();
                if (activeConversationId && socketManager.isConnected) {
                    socketManager.emit(WS_EVENTS.JOIN_CONVERSATION, { conversationId: activeConversationId });
                }

                // Mark current user as online in local state
                set((state) => {
                    const newOnlineUsers = new Set(state.onlineUsers);
                    newOnlineUsers.add(data.userId);
                    return {
                        onlineUsers: newOnlineUsers,
                        conversations: state.conversations.map((conv) => ({
                            ...conv,
                            participants: conv.participants?.map((p) =>
                                p.id === data.userId ? { ...p, isOnline: true } : p
                            ),
                        })),
                    };
                });
            };
            socketManager.on('authenticated', handleAuthenticated);

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

            // Listen for presence updates
            socketManager.on(WS_EVENTS.USER_ONLINE, ({ userId }: { userId: string }) => {
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
            socketManager.on('presence_update', ({ userId, status, timestamp }: { userId: string; status: string; timestamp?: string }) => {
                const isOnline = status === 'online';
                const lastSeen = !isOnline && timestamp ? new Date(timestamp) : undefined;
                
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
                                p.id === userId ? { ...p, isOnline, lastSeen: lastSeen || p.lastSeen } : p
                            ),
                        })),
                    };
                });
            });

            // Listen for group events
            socketManager.on(WS_EVENTS.MEMBER_ADDED, (event: MemberAddedEvent) => {
                console.log('[chatStore] Member added event:', event);
                get().handleMemberAdded(event);
                // Refetch conversations to get updated member details
                get().fetchConversations();
            });

            socketManager.on(WS_EVENTS.MEMBER_REMOVED, (event: MemberRemovedEvent) => {
                console.log('[chatStore] Member removed event:', event);
                get().handleMemberRemoved(event);
            });

            socketManager.on(WS_EVENTS.GROUP_UPDATED, (event: GroupUpdatedEvent) => {
                console.log('[chatStore] Group updated event:', event);
                get().handleGroupUpdated(event);
            });

            // Listen for reaction events
            socketManager.on(WS_EVENTS.MESSAGE_REACTION, (event: MessageReactionEvent) => {
                console.log('[chatStore] Message reaction event:', event);
                get().handleReactionEvent(event);
            });
        },

        // Toggle reaction on a message
        toggleReaction: async (messageId: string, emoji: string) => {
            const currentUserId = useAuthStore.getState().user?.id;
            if (!currentUserId) return;

            // Find the message in all conversations
            let targetMessage: Message | undefined;
            let conversationId: string | undefined;

            const { messages } = get();
            for (const [convId, msgs] of Object.entries(messages)) {
                const msg = msgs.find((m) => m.id === messageId);
                if (msg) {
                    targetMessage = msg;
                    conversationId = convId;
                    break;
                }
            }

            if (!targetMessage || !conversationId) return;

            // Check if user already reacted with this emoji
            const hasReacted = targetMessage.reactions?.some(
                (r) => r.userId === currentUserId && r.emoji === emoji
            );

            try {
                if (hasReacted) {
                    // Remove reaction
                    await chatService.removeReaction(messageId, emoji);
                } else {
                    // Add reaction
                    await chatService.addReaction(messageId, emoji);
                }

                // Optimistic update - will be confirmed by WebSocket event
            } catch (error) {
                console.error('[chatStore] Failed to toggle reaction:', error);
                set({ error: 'Failed to update reaction' });
            }
        },

        // Handle reaction event from WebSocket
        handleReactionEvent: (event: MessageReactionEvent) => {
            const { messageId, emoji, userId, action, conversationId, createdAt } = event;

            set((state) => {
                const conversationMessages = state.messages[conversationId] || [];
                
                return {
                    messages: {
                        ...state.messages,
                        [conversationId]: conversationMessages.map((msg) => {
                            if (msg.id !== messageId) return msg;

                            const reactions = msg.reactions || [];
                            
                            if (action === 'add') {
                                // Add new reaction
                                const existingIndex = reactions.findIndex(
                                    (r) => r.userId === userId && r.emoji === emoji
                                );
                                
                                if (existingIndex === -1) {
                                    return {
                                        ...msg,
                                        reactions: [
                                            ...reactions,
                                            { emoji, userId, createdAt }
                                        ]
                                    };
                                }
                                return msg;
                            } else {
                                // Remove reaction
                                return {
                                    ...msg,
                                    reactions: reactions.filter(
                                        (r) => !(r.userId === userId && r.emoji === emoji)
                                    )
                                };
                            }
                        })
                    }
                };
            });
        },
    }))
);
