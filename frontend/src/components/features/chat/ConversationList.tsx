// ConversationList Component - List of conversations in sidebar

import { useEffect, useState } from 'react';
import { ConversationItem } from './ConversationItem';
import { EmptyState } from '../../common/EmptyState';
import { Spinner } from '../../common/Spinner';
import { useChat } from '../../../hooks/useChat';

interface ConversationListProps {
    onSelectConversation: (conversationId: string) => void;
    activeConversationId: string | null;
}

export function ConversationList({
    onSelectConversation,
    activeConversationId,
}: ConversationListProps) {
    const { conversations, fetchConversations, isLoading } = useChat();
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch conversations once on mount
    useEffect(() => {
        fetchConversations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Ensure conversations is always an array
    const conversationList = Array.isArray(conversations) ? conversations : [];
    console.log('🔍 [ConversationList] conversations from useChat:', conversations);
    console.log('🔍 [ConversationList] conversationList:', conversationList);

    // Filter conversations based on search
    const filteredConversations = conversationList.filter((conv) => {
        // For group conversations, use name; for direct, we'll need populated participants later
        const conversationName = (conv.name || conv.type || '').toLowerCase();
        const lastMessage = (conv.lastMessage?.content || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return conversationName.includes(query) || lastMessage.includes(query);
    });
    console.log('🔍 [ConversationList] filteredConversations:', filteredConversations);

    if (isLoading && conversationList.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <Spinner size="md" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <EmptyState
                        icon={
                            <svg
                                className="w-16 h-16"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                        }
                        title={searchQuery ? 'No conversations found' : 'No conversations yet'}
                        description={
                            searchQuery
                                ? 'Try a different search term'
                                : 'Start chatting with someone!'
                        }
                    />
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredConversations.map((conversation) => (
                            <ConversationItem
                                key={conversation.id}
                                conversation={conversation}
                                isActive={conversation.id === activeConversationId}
                                onClick={() => onSelectConversation(conversation.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
