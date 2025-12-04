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
    }, [initWebSocketListeners]);

    // Set active conversation if provided
    useEffect(() => {
        if (conversationId) {
            setActiveConversation(conversationId);
        }
    }, [conversationId, setActiveConversation]);

    const currentMessages = activeConversationId
        ? messages[activeConversationId] || []
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
