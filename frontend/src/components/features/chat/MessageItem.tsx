// MessageItem Component - Individual chat message bubble

import { memo } from 'react';
import { formatTimestamp } from '@/utils/formatters';
import type { Message } from '@/types/chat.types';
import { useAuth } from '@/hooks/useAuth';

interface MessageItemProps {
    message: Message;
}

export const MessageItem = memo(function MessageItem({ message }: MessageItemProps) {
    const { user } = useAuth();
    const isOwn = message.senderId === user?.id;

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
            <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${isOwn
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
            >
                <p className="text-sm break-words">{message.content}</p>
                <span
                    className={`text-xs mt-1 block ${isOwn ? 'text-primary-100' : 'text-gray-600'
                        }`}
                >
                    {formatTimestamp(message.createdAt)}
                </span>
            </div>
        </div>
    );
});
