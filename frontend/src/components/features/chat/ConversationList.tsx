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

    // Filter conversations based on search
    const filteredConversations = conversationList.filter((conv) => {
        // For group conversations, use name; for direct, we'll need populated participants later
        const conversationName = (conv.name || conv.type || '').toLowerCase();
        const lastMessage = (conv.lastMessage?.text || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        return conversationName.includes(query) || lastMessage.includes(query);
    });

    if (isLoading && conversationList.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <Spinner size="md" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">Đoạn chat</h1>
                <div className="flex items-center gap-2">
                    {/* Camera/Video Icon */}
                    <button
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="New video call"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                        </svg>
                    </button>
                    {/* Create New Chat Icon */}
                    <button
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="New message"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-3 py-2">
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                        placeholder="Tìm kiếm trên Messenger"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-100 border-0 rounded-full text-sm focus:outline-none focus:bg-gray-200 transition-colors"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto bg-white">
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
                    <div>
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
