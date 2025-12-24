// ChatWindow Component - Main chat container

import { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { ChatInfoPanel } from './ChatInfoPanel';
import { GroupMemberList } from './GroupMemberList';
import { EmptyState } from '../../common/EmptyState';
import { useChat } from '../../../hooks/useChat';
import { useTheme } from '../../../hooks/useTheme';
import { useDefaultEmoji } from '../../../hooks/useDefaultEmoji';
import { NicknameProvider } from '../../../contexts/NicknameContext';
import { chatService } from '../../../services/api/chatService';
import { uploadService } from '../../../services/api/uploadService';
import type { SendMessageDto, Message, MediaItem } from '../../../types/chat.types';
import type { User } from '../../../types/user.types';

interface UploadingFile {
    id: string;
    file: File;
    preview: string;
    progress: number;
    type: 'image' | 'video' | 'file';
}

interface ChatWindowProps {
    conversationId: string | null;
    onStartVoiceCall?: (targetUser: User, conversationId: string) => void;
    onStartVideoCall?: (targetUser: User, conversationId: string) => void;
    onStartGroupVoiceCall?: (conversationId: string, conversationName: string, participantIds: string[]) => void;
    onStartGroupVideoCall?: (conversationId: string, conversationName: string, participantIds: string[]) => void;
}

export function ChatWindow({ conversationId, onStartVoiceCall, onStartVideoCall, onStartGroupVoiceCall, onStartGroupVideoCall }: ChatWindowProps) {
    const { currentMessages, sendMessage, isLoading, conversations, fetchConversations } = useChat(conversationId || undefined);
    const { loadConversationTheme } = useTheme();
    const { defaultEmoji } = useDefaultEmoji(conversationId || '');
    const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
    const [isMemberListOpen, setIsMemberListOpen] = useState(false);
    const [sharedMedia, setSharedMedia] = useState<Message[]>([]);
    const [sharedDocuments, setSharedDocuments] = useState<Message[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

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

    // Load conversation theme when conversation changes
    useEffect(() => {
        if (currentConversation?.themeId) {
            loadConversationTheme(currentConversation.themeId);
        } else if (currentConversation) {
            // If conversation has no theme, use default
            loadConversationTheme('default');
        }
    }, [currentConversation?.id, currentConversation?.themeId, loadConversationTheme]);

    // Listen for theme changes via WebSocket
    useEffect(() => {
        if (!conversationId) return;

        const handleGroupUpdated = (event: any) => {
            // Only apply theme if this is the active conversation and theme changed
            if (event.conversationId === conversationId && event.themeId) {
                loadConversationTheme(event.themeId);
            }
        };

        // Import socketManager
        import('../../../services/websocket/socketManager').then(({ socketManager }) => {
            socketManager.on('group_updated', handleGroupUpdated);
            
            return () => {
                socketManager.off('group_updated', handleGroupUpdated);
            };
        });
    }, [conversationId, loadConversationTheme]);

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
        if (!conversationId) return;
        
        if (currentConversation?.type === 'group') {
            // Group voice call
            const participantIds = currentConversation.participants?.map(p => p.id) || [];
            const conversationName = currentConversation.name || 'Cuộc gọi nhóm';
            if (onStartGroupVoiceCall) {
                onStartGroupVoiceCall(conversationId, conversationName, participantIds);
            }
        } else if (recipient && onStartVoiceCall) {
            // Direct voice call
            onStartVoiceCall(recipient, conversationId);
        }
    };

    // Handle video call
    const handleVideoCall = () => {
        if (!conversationId) return;
        
        if (currentConversation?.type === 'group') {
            // Group video call
            const participantIds = currentConversation.participants?.map(p => p.id) || [];
            const conversationName = currentConversation.name || 'Cuộc gọi nhóm';
            if (onStartGroupVideoCall) {
                onStartGroupVideoCall(conversationId, conversationName, participantIds);
            }
        } else if (recipient && onStartVideoCall) {
            // Direct video call
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

    const handleSendMediaGroup = async (mediaItems: MediaItem[]) => {
        if (!conversationId) return;

        const dto: SendMessageDto = {
            conversationId,
            type: 'media_group',
            mediaItems,
        };

        try {
            await sendMessage(dto);
        } catch (error) {
            console.error('Failed to send media group message:', error);
        }
    };

    const handleSendVoice = async (audioBlob: Blob, duration: number) => {
        if (!conversationId) return;

        try {
            // Upload audio to Cloudinary (reuse the upload service)
            const result = await uploadService.uploadFile(
                audioBlob,
                'audio',
                '/chat',
                () => {} // No progress callback needed for voice
            );

            const dto: SendMessageDto = {
                conversationId,
                type: 'audio',
                mediaUrl: result.secureUrl,
                mediaPublicId: result.publicId,
                mediaDuration: duration,
            };

            await sendMessage(dto);
        } catch (error) {
            console.error('Failed to send voice message:', error);
            alert('Failed to send voice message');
        }
    };

    const handleSendLocation = async (location: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        address?: string;
    }) => {
        if (!conversationId) return;

        const dto: SendMessageDto = {
            conversationId,
            type: 'location',
            location,
        };

        try {
            await sendMessage(dto);
        } catch (error) {
            console.error('Failed to send location message:', error);
        }
    };

    const handleSendFile = async (
        fileUrl: string,
        fileName: string,
        fileSize: number,
        fileType: string
    ) => {
        if (!conversationId) return;

        const dto: SendMessageDto = {
            conversationId,
            type: 'file',
            fileUrl,
            fileName,
            fileSize,
            fileType,
        };

        try {
            await sendMessage(dto);
        } catch (error) {
            console.error('Failed to send file message:', error);
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
            <NicknameProvider conversationId={conversationId}>
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
                        uploadingFiles={uploadingFiles}
                    />

                    {/* Input */}
                    <ChatInput
                        onSend={handleSendMessage}
                        onSendMedia={handleSendMedia}
                        onSendMediaGroup={handleSendMediaGroup}
                        onSendVoice={handleSendVoice}
                        onSendLocation={handleSendLocation}
                        onSendFile={handleSendFile}
                        disabled={isLoading}
                        onUploadingFilesChange={setUploadingFiles}
                        defaultEmoji={defaultEmoji}
                    />
                </div>

                {/* Chat Info Panel */}
                <ChatInfoPanel
                    isOpen={isInfoPanelOpen}
                    onClose={() => setIsInfoPanelOpen(false)}
                    otherUser={recipient}
                    conversation={currentConversation || undefined}
                    conversationId={conversationId!}
                    sharedMedia={sharedMedia}
                    sharedDocuments={sharedDocuments}
                    onConversationUpdate={() => fetchConversations()}
                />

                {/* Group Member List Modal */}
                {currentConversation?.type === 'group' && (
                    <GroupMemberList
                        conversation={currentConversation}
                        isOpen={isMemberListOpen}
                        onClose={() => setIsMemberListOpen(false)}
                        onMemberAdded={fetchConversations}
                        onMemberRemoved={fetchConversations}
                    />
                )}
            </NicknameProvider>
        </div>
    );
}
