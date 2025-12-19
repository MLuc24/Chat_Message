// ChatWindow Component - Main chat container

import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { EmptyState } from '../../common/EmptyState';
import { useChat } from '../../../hooks/useChat';
import type { SendMessageDto } from '../../../types/chat.types';

interface ChatWindowProps {
    conversationId: string | null;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
    const { currentMessages, sendMessage, isLoading, conversations } = useChat(conversationId || undefined);

    // Find current conversation to get recipient info
    const currentConversation = conversationId
        ? conversations?.find((c) => c.id === conversationId)
        : null;

    // Get recipient from participants (exclude current user)
    const currentUserId = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user') || '{}').id
        : null;

    const recipient = currentConversation?.participants?.find(
        (p) => p.id !== currentUserId
    );

    const handleSendMessage = async (content: string) => {
        if (!conversationId) return;

        const dto: SendMessageDto = {
            conversationId,
            text: content,
            type: 'text',
        };

        try {
            await sendMessage(dto);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleSendMedia = async (
        mediaUrl: string,
        type: 'image' | 'video',
        metadata?: {
            publicId: string;
            width?: number;
            height?: number;
            duration?: number;
            thumbnailUrl?: string;
        }
    ) => {
        if (!conversationId) return;

        const dto: SendMessageDto = {
            conversationId,
            type,
            mediaUrl,
            mediaPublicId: metadata?.publicId,
            mediaWidth: metadata?.width,
            mediaHeight: metadata?.height,
            mediaDuration: metadata?.duration,
            thumbnailUrl: metadata?.thumbnailUrl,
        };

        try {
            await sendMessage(dto);
        } catch (error) {
            console.error('Failed to send media message:', error);
        }
    };

    // Show empty state if no conversation selected
    if (!conversationId) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50">
                <EmptyState
                    icon={
                        <svg
                            className="w-24 h-24"
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
                    title="Select a conversation"
                    description="Choose a conversation from the list to start chatting"
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Chat Header */}
            <ChatHeader
                recipient={recipient}
                onVoiceCall={() => console.log('Voice call')}
                onVideoCall={() => console.log('Video call')}
                onViewInfo={() => console.log('View info')}
            />

            {/* Messages */}
            <MessageList
                messages={Array.isArray(currentMessages) ? currentMessages : []}
                otherUser={recipient}
                isTyping={false}
            />

            {/* Input */}
            <ChatInput
                onSend={handleSendMessage}
                onSendMedia={handleSendMedia}
                disabled={isLoading}
            />
        </div>
    );
}
