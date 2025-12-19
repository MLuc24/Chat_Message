// ChatWindow Component - Main chat container

import { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { ChatInfoPanel } from './ChatInfoPanel';
import { GroupMemberList } from './GroupMemberList';
import { EmptyState } from '../../common/EmptyState';
import { useChat } from '../../../hooks/useChat';
import { chatService } from '../../../services/api/chatService';
import type { SendMessageDto, Message } from '../../../types/chat.types';
import type { User } from '../../../types/user.types';

interface ChatWindowProps {
    conversationId: string | null;
    onStartVoiceCall?: (targetUser: User, conversationId: string) => void;
    onStartVideoCall?: (targetUser: User, conversationId: string) => void;
}

export function ChatWindow({ conversationId, onStartVoiceCall, onStartVideoCall }: ChatWindowProps) {
    const { currentMessages, sendMessage, isLoading, conversations, fetchConversations } = useChat(conversationId || undefined);
    const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
    const [isMemberListOpen, setIsMemberListOpen] = useState(false);
    const [sharedMedia, setSharedMedia] = useState<Message[]>([]);
    const [sharedDocuments, setSharedDocuments] = useState<Message[]>([]);

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

    // Load shared media and documents when conversation changes
    useEffect(() => {
        if (conversationId && isInfoPanelOpen) {
            loadSharedContent();
        }
    }, [conversationId, isInfoPanelOpen]);

    const loadSharedContent = async () => {
        if (!conversationId) return;
        try {
            const [media, documents] = await Promise.all([
                chatService.getSharedMedia(conversationId),
                chatService.getSharedDocuments(conversationId),
            ]);
            setSharedMedia(media);
            setSharedDocuments(documents);
        } catch (error) {
            console.error('Failed to load shared content:', error);
        }
    };

    // Handle voice call
    const handleVoiceCall = () => {
        if (recipient && conversationId && onStartVoiceCall) {
            onStartVoiceCall(recipient, conversationId);
        }
    };

    // Handle video call
    const handleVideoCall = () => {
        if (recipient && conversationId && onStartVideoCall) {
            onStartVideoCall(recipient, conversationId);
        }
    };

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
        <div className="flex h-full relative">
            {/* Main Chat Area */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Chat Header */}
                <ChatHeader
                    recipient={recipient}
                    conversation={currentConversation || undefined}
                    onVoiceCall={handleVoiceCall}
                    onVideoCall={handleVideoCall}
                    onViewInfo={() => setIsInfoPanelOpen(!isInfoPanelOpen)}
                    onViewMembers={() => setIsMemberListOpen(true)}
                    onLeaveGroup={async () => {
                        if (currentConversation && currentUserId) {
                            try {
                                await chatService.leaveGroup(currentConversation.id);
                                await fetchConversations();
                            } catch (error) {
                                console.error('Failed to leave group:', error);
                            }
                        }
                    }}
                />

                {/* Messages */}
                <MessageList
                    messages={Array.isArray(currentMessages) ? currentMessages : []}
                    conversation={currentConversation || undefined}
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

            {/* Chat Info Panel */}
            {recipient && (
                <ChatInfoPanel
                    isOpen={isInfoPanelOpen}
                    onClose={() => setIsInfoPanelOpen(false)}
                    otherUser={recipient}
                    conversationId={conversationId!}
                    sharedMedia={sharedMedia}
                    sharedDocuments={sharedDocuments}
                />
            )}

            {/* Group Member List Modal */}
            {currentConversation?.type === 'group' && (
                <GroupMemberList
                    conversation={currentConversation}
                    isOpen={isMemberListOpen}
                    onClose={() => setIsMemberListOpen(false)}
                    onMembersChanged={fetchConversations}
                />
            )}
        </div>
    );
}
