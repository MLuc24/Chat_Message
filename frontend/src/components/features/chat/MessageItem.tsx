// MessageItem Component - Individual chat message bubble

import { memo } from 'react';
import { Avatar } from '../../common/Avatar';
import type { Message } from '../../../types/chat.types';
import type { User } from '../../../types/user.types';

interface MessageItemProps {
    message: Message;
    isOwn: boolean;
    sender?: User;
    showAvatar?: boolean;
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
    sender,
    showAvatar = true
}: MessageItemProps) {
    return (
        <div className={`flex items-start ${isOwn ? 'justify-end' : 'justify-start'} mb-1 gap-2`}>
            {/* Avatar for received messages - only show on last message in group */}
            {!isOwn && (
                <div className="w-7 h-7 mt-2.5 flex-shrink-0">
                    {showAvatar && sender && (
                        <Avatar
                            src={sender.avatarUrl || sender.avatar}
                            alt={sender.name}
                            name={sender.name}
                            size="sm"
                        />
                    )}
                </div>
            )}

            <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[65%]`}>
                {/* Message bubble */}
                <div
                    className={`rounded-2xl overflow-hidden ${message.type === 'text'
                        ? 'px-4 py-2.5'
                        : 'p-1'
                        } ${message.type === 'text' 
                            ? isOwn
                                ? 'bg-blue-600 text-white rounded-br-sm'
                                : 'bg-gray-200 text-gray-900 rounded-bl-sm'
                            : 'bg-transparent'
                        }`}
                >
                    {/* Text message */}
                    {message.type === 'text' && message.text && (
                        <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    )}

                    {/* Image message */}
                    {message.type === 'image' && (
                        <>
                            {message.mediaUrl ? (
                                <img
                                    src={message.mediaUrl}
                                    alt="Shared image"
                                    className="w-64 h-64 object-cover cursor-pointer rounded-lg"
                                    onClick={() => window.open(message.mediaUrl, '_blank')}
                                    onError={(e) => {
                                        console.error('Failed to load image:', message.mediaUrl);
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <div className="px-4 py-2 text-sm text-gray-500">Image not available</div>
                            )}
                        </>
                    )}

                    {/* Video message */}
                    {message.type === 'video' && (
                        <>
                            {message.mediaUrl ? (
                                <video
                                    src={message.mediaUrl}
                                    controls
                                    className="w-80 h-auto rounded-lg"
                                    poster={message.thumbnailUrl}
                                />
                            ) : (
                                <div className="px-4 py-2 text-sm text-gray-500">Video not available</div>
                            )}
                        </>
                    )}
                </div>

                {/* Timestamp - only show on last message in group */}
                {showAvatar && (
                    <div className={`flex items-center gap-1 mt-1`}>
                        <span className="text-xs text-gray-500">
                            {formatMessageTime(message.createdAt)}
                        </span>

                        {/* Read status for sent messages */}
                        {isOwn && (
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

