// MessageList Component - Scrollable list of messages

import { memo, useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { EmptyState } from '../../common/EmptyState';
import { useAuth } from '../../../hooks/useAuth';
import type { Message } from '../../../types/chat.types';
import type { User } from '../../../types/user.types';

interface MessageListProps {
    messages: Message[];
    otherUser?: User;
    isTyping?: boolean;
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
    otherUser,
    isTyping = false
}: MessageListProps) {
    const { user } = useAuth();
    const bottomRef = useRef<HTMLDivElement>(null);

    // Ensure messages is always an array to prevent "map is not a function" errors
    const messageList = Array.isArray(messages) ? messages : [];

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messageList, isTyping]);

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

                return (
                    <div key={message.id}>
                        {/* Date Separator */}
                        {showDateSeparator && (
                            <div className="flex items-center justify-center my-4">
                                <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-white rounded-full shadow-sm">
                                    {formatDateSeparator(message.createdAt)}
                                </span>
                            </div>
                        )}

                        {/* Message */}
                        <MessageItem
                            message={message}
                            isOwn={isOwn}
                            sender={isOwn ? undefined : otherUser}
                        />
                    </div>
                );
            })}

            {/* Typing Indicator */}
            {isTyping && otherUser && (
                <TypingIndicator userName={otherUser.name} />
            )}

            {/* Auto-scroll anchor */}
            <div ref={bottomRef} />
        </div>
    );
});
