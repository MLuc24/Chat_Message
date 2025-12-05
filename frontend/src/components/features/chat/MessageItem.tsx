// MessageItem Component - Individual chat message bubble

import { memo } from 'react';
import { Avatar } from '../../common/Avatar';
import type { Message } from '../../../types/chat.types';
import type { User } from '../../../types/user.types';

interface MessageItemProps {
    message: Message;
    isOwn: boolean;
    sender?: User;
}

function formatMessageTime(date: Date | string): string {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

export const MessageItem = memo(function MessageItem({
    message,
    isOwn,
    sender
}: MessageItemProps) {
    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 gap-2`}>
            {/* Avatar for received messages */}
            {!isOwn && sender && (
                <Avatar
                    src={sender.avatar}
                    alt={sender.name}
                    name={sender.name}
                    size="sm"
                />
            )}

            <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                {/* Sender name for received messages */}
                {!isOwn && sender && (
                    <span className="text-xs text-gray-600 mb-1 px-1">
                        {sender.name}
                    </span>
                )}

                {/* Message bubble */}
                <div
                    className={`rounded-lg px-4 py-2 ${isOwn
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-200 text-gray-900 rounded-bl-none'
                        }`}
                >
                    <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
                </div>

                {/* Timestamp and read status */}
                <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                    <span className="text-xs text-gray-500">
                        {formatMessageTime(message.createdAt)}
                    </span>

                    {/* Read status for sent messages */}
                    {isOwn && (
                        <span className="text-blue-500">
                            {/* Double check mark for read, single for delivered */}
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                <path d="M12.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-.5-.5a1 1 0 011.414-1.414l7.793-7.793a1 1 0 011.414 0z" opacity="0.5" />
                            </svg>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
});
