// MessageList Component - Scrollable list of messages

import { memo, useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import type { Message } from '@/types/chat.types';

interface MessageListProps {
    messages: Message[];
}

export const MessageList = memo(function MessageList({ messages }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-500">
                No messages yet. Start the conversation!
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
                <MessageItem key={message.id} message={message} />
            ))}
            <div ref={bottomRef} />
        </div>
    );
});
