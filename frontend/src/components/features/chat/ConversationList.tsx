// ConversationList Component - List of conversations in sidebar

import { useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { formatTimestamp } from '@/utils/formatters';

interface ConversationListProps {
    onSelectConversation: (conversationId: string) => void;
    activeConversationId: string | null;
}

export function ConversationList({
    onSelectConversation,
    activeConversationId,
}: ConversationListProps) {
    const { conversations, fetchConversations, isLoading } = useChat();

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Ensure conversations is always an array
    const conversationList = Array.isArray(conversations) ? conversations : [];

    if (isLoading && conversationList.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (conversationList.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Start chatting with someone!</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-200">
            {conversationList.map((conversation) => {
                const otherUser = conversation.participants[0]; // Simplified - assumes 1:1 chat
                const isActive = conversation.id === activeConversationId;

                return (
                    <button
                        key={conversation.id}
                        onClick={() => onSelectConversation(conversation.id)}
                        className={`w-full p-4 text-left transition-colors hover:bg-gray-50 ${isActive ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                                {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline justify-between">
                                    <h3 className="font-semibold text-gray-900 truncate">
                                        {otherUser?.name || 'Unknown User'}
                                    </h3>
                                    {conversation.lastMessage && (
                                        <span className="text-xs text-gray-500 ml-2">
                                            {formatTimestamp(conversation.lastMessage.createdAt)}
                                        </span>
                                    )}
                                </div>

                                {conversation.lastMessage && (
                                    <p className="text-sm text-gray-600 truncate mt-1">
                                        {conversation.lastMessage.content}
                                    </p>
                                )}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
