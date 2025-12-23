// MessageList Component - Scrollable list of messages

import { memo, useEffect, useRef, useMemo } from 'react';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { EmptyState } from '../../common/EmptyState';
import { MediaModal } from '../../common/MediaModal';
import { useAuth } from '../../../hooks/useAuth';
import { useMediaModal } from '../../../hooks/useMediaModal';
import type { Message, Conversation } from '../../../types/chat.types';
import type { User } from '../../../types/user.types';

interface UploadingFile {
    id: string;
    file: File;
    preview: string;
    progress: number;
    type: 'image' | 'video' | 'file';
}

interface MessageListProps {
    messages: Message[];
    conversation?: Conversation;
    otherUser?: User; // deprecated, for backward compatibility
    isTyping?: boolean;
    uploadingFiles?: UploadingFile[];
}

function formatDateSeparator(date: Date | string): string {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return messageDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        });
    }
}

function shouldShowDateSeparator(currentMsg: Message, prevMsg?: Message): boolean {
    if (!prevMsg) return true;

    const currentDate = new Date(currentMsg.createdAt).toDateString();
    const prevDate = new Date(prevMsg.createdAt).toDateString();

    return currentDate !== prevDate;
}

export const MessageList = memo(function MessageList({
    messages,
    conversation,
    otherUser,
    isTyping = false,
    uploadingFiles = []
}: MessageListProps) {
    const { user } = useAuth();
    const bottomRef = useRef<HTMLDivElement>(null);
    const {
        isOpen,
        currentMedia,
        mediaGallery,
        openModal,
        closeModal,
        goToPrevious,
        goToNext,
        goToIndex,
        hasPrevious,
        hasNext,
        currentIndex,
    } = useMediaModal();

    // Ensure messages is always an array to prevent "map is not a function" errors
    const messageList = Array.isArray(messages) ? messages : [];

    // Filter media messages for gallery navigation
    const mediaMessages = useMemo(
        () => messageList.filter((msg) => msg.type === 'image' || msg.type === 'video'),
        [messageList]
    );

    // Handle media click
    const handleMediaClick = (message: Message) => {
        openModal(message, mediaMessages);
    };

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messageList, isTyping, uploadingFiles]);

    if (messageList.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
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
                    title="No messages yet"
                    description="Start the conversation by sending a message below"
                />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
            {messageList.map((message, index) => {
                const isOwn = message.senderId === user?.id;
                const showDateSeparator = shouldShowDateSeparator(message, messageList[index - 1]);

                // Check if next message is from a different sender (or is last message)
                const nextMessage = messageList[index + 1];
                const isLastInGroup = !nextMessage || nextMessage.senderId !== message.senderId;

                // Get the actual sender from conversation participants
                let sender: User | undefined;
                if (!isOwn) {
                    if (conversation?.participants) {
                        // For group chats: find sender in participants
                        sender = conversation.participants.find(p => p.id === message.senderId);
                    } else if (otherUser) {
                        // For direct chats: use otherUser (backward compatibility)
                        sender = otherUser;
                    }
                    
                    // Fallback if sender not found
                    if (!sender) {
                        sender = {
                            id: message.senderId,
                            name: 'Unknown User',
                            username: 'unknown',
                            email: '',
                            isOnline: false,
                            createdAt: message.createdAt,
                            updatedAt: message.updatedAt,
                        };
                    }
                }

                return (
                    <div key={message.id}>
                        {/* Date Separator */}
                        {showDateSeparator && (
                            <div className="flex items-center justify-center my-6">
                                <span className="px-3 py-1 text-xs font-medium text-gray-500 bg-white rounded-full shadow-sm">
                                    {formatDateSeparator(message.createdAt)}
                                </span>
                            </div>
                        )}

                        {/* Message */}
                        <MessageItem
                            message={message}
                            isOwn={isOwn}
                            sender={isOwn ? undefined : sender}
                            showAvatar={isLastInGroup}
                            onMediaClick={handleMediaClick}
                        />
                    </div>
                );
            })}

            {/* Uploading Files Preview */}
            {uploadingFiles.length > 0 && (() => {
                // Separate media files (images/videos) from documents
                const mediaFiles = uploadingFiles.filter(f => f.type === 'image' || f.type === 'video');
                const documentFiles = uploadingFiles.filter(f => f.type === 'file');

                return (
                    <>
                        {/* Media Group (Images/Videos) - Grid Layout */}
                        {mediaFiles.length > 0 && (
                            <div className="flex items-start justify-end mb-1 gap-2">
                                <div className="flex flex-col items-end max-w-[65%]">
                                    {/* Single Image/Video - Match sent message styling */}
                                    {mediaFiles.length === 1 ? (
                                        <div className="relative overflow-hidden rounded-2xl shadow-md">
                                            {mediaFiles[0].type === 'image' ? (
                                                <img 
                                                    src={mediaFiles[0].preview} 
                                                    alt="Uploading" 
                                                    className="max-w-[280px] max-h-[320px] object-cover"
                                                />
                                            ) : (
                                                <video 
                                                    src={mediaFiles[0].preview} 
                                                    className="max-w-[320px] max-h-[360px] object-cover"
                                                />
                                            )}
                                            
                                            {/* Circular Progress Overlay */}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <div className="relative w-16 h-16">
                                                    {/* Background Circle */}
                                                    <svg className="w-16 h-16 transform -rotate-90">
                                                        <circle
                                                            cx="32"
                                                            cy="32"
                                                            r="28"
                                                            stroke="rgba(255,255,255,0.3)"
                                                            strokeWidth="4"
                                                            fill="none"
                                                        />
                                                        {/* Progress Circle */}
                                                        <circle
                                                            cx="32"
                                                            cy="32"
                                                            r="28"
                                                            stroke="white"
                                                            strokeWidth="4"
                                                            fill="none"
                                                            strokeDasharray={`${2 * Math.PI * 28}`}
                                                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - mediaFiles[0].progress / 100)}`}
                                                            className="transition-all duration-300"
                                                        />
                                                    </svg>
                                                    {/* Percentage Text */}
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-white text-sm font-semibold">
                                                            {mediaFiles[0].progress}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* Multiple Media - Grid Layout */
                                        <div className={`grid gap-1 max-w-md ${
                                            mediaFiles.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
                                        }`}>
                                            {mediaFiles.map((uploadingFile) => (
                                                <div key={uploadingFile.id} className="relative aspect-square overflow-hidden rounded-lg">
                                                    {uploadingFile.type === 'image' ? (
                                                        <img 
                                                            src={uploadingFile.preview} 
                                                            alt="Uploading" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <video 
                                                            src={uploadingFile.preview} 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    )}
                                                    
                                                    {/* Circular Progress Overlay */}
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                        <div className="relative w-12 h-12">
                                                            {/* Background Circle */}
                                                            <svg className="w-12 h-12 transform -rotate-90">
                                                                <circle
                                                                    cx="24"
                                                                    cy="24"
                                                                    r="20"
                                                                    stroke="rgba(255,255,255,0.3)"
                                                                    strokeWidth="3"
                                                                    fill="none"
                                                                />
                                                                {/* Progress Circle */}
                                                                <circle
                                                                    cx="24"
                                                                    cy="24"
                                                                    r="20"
                                                                    stroke="white"
                                                                    strokeWidth="3"
                                                                    fill="none"
                                                                    strokeDasharray={`${2 * Math.PI * 20}`}
                                                                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - uploadingFile.progress / 100)}`}
                                                                    className="transition-all duration-300"
                                                                />
                                                            </svg>
                                                            {/* Percentage Text */}
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className="text-white text-xs font-semibold">
                                                                    {uploadingFile.progress}%
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Timestamp */}
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-xs text-gray-500">
                                            Sending {mediaFiles.length} {mediaFiles.length === 1 ? 'file' : 'files'}...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Document Files - Individual Rows */}
                        {documentFiles.map((uploadingFile) => (
                            <div key={uploadingFile.id} className="flex items-start justify-end mb-1 gap-2">
                                <div className="flex flex-col items-end max-w-[65%]">
                                    <div className="bg-blue-600 rounded-2xl min-w-[240px] max-w-[280px]">
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            {/* File Icon */}
                                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            
                                            {/* File Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">
                                                    {uploadingFile.file.name}
                                                </p>
                                                <p className="text-xs text-white/80 mt-0.5">
                                                    {uploadingFile.progress}%
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Linear Progress Bar */}
                                        <div className="px-4 pb-3">
                                            <div className="bg-white/20 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-white h-full transition-all duration-300"
                                                    style={{ width: `${uploadingFile.progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timestamp */}
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-xs text-gray-500">
                                            Sending...
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                );
            })()}

            {/* Typing Indicator */}
            {isTyping && otherUser && (
                <TypingIndicator userName={otherUser.name} />
            )}

            {/* Auto-scroll anchor */}
            <div ref={bottomRef} />

            {/* Media Modal */}
            {currentMedia && (
                <MediaModal
                    media={currentMedia}
                    isOpen={isOpen}
                    onClose={closeModal}
                    onPrevious={goToPrevious}
                    onNext={goToNext}
                    onJumpTo={goToIndex}
                    hasPrevious={hasPrevious}
                    hasNext={hasNext}
                    gallery={mediaGallery}
                    currentIndex={currentIndex}
                />
            )}
        </div>
    );
});
