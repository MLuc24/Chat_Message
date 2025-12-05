// useChat Hook - Convenience wrapper for chat store

import { useChatStore } from '@/stores/chatStore';
import { useEffect } from 'react';

export function useChat(conversationId?: string) {
    const {
        conversations,
        messages,
        activeConversationId,
        isLoading,
        error,
        fetchConversations,
        fetchMessages,
        sendMessage,
        setActiveConversation,
        clearError,
        initWebSocketListeners,
    } = useChatStore();

    // Initialize WebSocket listeners on mount
    useEffect(() => {
        initWebSocketListeners();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Set active conversation if provided
    useEffect(() => {
        if (conversationId) {
            setActiveConversation(conversationId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversationId]);

    // Use conversationId param if provided, otherwise fall back to activeConversationId
    const messageKey = conversationId || activeConversationId;
    const currentMessages = messageKey
        ? messages[messageKey] || []
        : [];

    return {
        conversations,
        currentMessages,
        activeConversationId,
        isLoading,
        error,
        fetchConversations,
        fetchMessages,
        sendMessage,
        setActiveConversation,
        clearError,
    };
}
