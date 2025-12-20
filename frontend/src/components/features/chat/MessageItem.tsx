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
    onMediaClick?: (message: Message) => void;
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
    showAvatar = true,
    onMediaClick
}: MessageItemProps) {
    const handleMediaClick = () => {
        if ((message.type === 'image' || message.type === 'video') && onMediaClick) {
            onMediaClick(message);
        }
    };

    // Kiểm tra xem tin nhắn có phải chỉ là emoji không
    const isOnlyEmoji = (text: string): boolean => {
        if (!text) return false;
        const trimmed = text.trim();
        // Regex chặt chẽ hơn: chỉ emoji, không có chữ cái, số, ký tự đặc biệt
        const emojiRegex = /^[\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200D]+$/u;
        // Loại bỏ các ký tự không phải emoji
        const withoutSpaces = trimmed.replace(/\s/g, '');
        return withoutSpaces.length > 0 && withoutSpaces.length <= 10 && emojiRegex.test(withoutSpaces);
    };

    const isEmojiMessage = message.type === 'text' && message.text && isOnlyEmoji(message.text);

    return (
        <div className={`flex items-start ${isOwn ? 'justify-end' : 'justify-start'} mb-1 gap-2`}>
            {/* Avatar for received messages - only show on last message in group */}
            {!isOwn && (
                <div className="w-7 h-7 mt-2.5 flex-shrink-0">
                    {showAvatar && sender && (
                        <Avatar
                            src={sender.avatarUrl}
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
                    className={`rounded-2xl overflow-hidden ${
                        isEmojiMessage 
                            ? '' // Không có padding và background cho emoji
                            : message.type === 'text'
                                ? 'px-4 py-2.5'
                                : 'p-1'
                        } ${
                        isEmojiMessage
                            ? 'bg-transparent' // Không có background cho emoji
                            : message.type === 'text' 
                                ? isOwn
                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                    : 'bg-gray-200 text-gray-900 rounded-bl-sm'
                                : 'bg-transparent'
                        }`}
                >
                    {/* Text message */}
                    {message.type === 'text' && message.text && (
                        <p className={`${isEmojiMessage ? 'text-3xl' : 'text-sm'} break-words whitespace-pre-wrap leading-relaxed`}>
                            {message.text}
                        </p>
                    )}

                    {/* Image message */}
                    {message.type === 'image' && (
                        <>
                            {message.mediaUrl ? (
                                <div className="relative group cursor-pointer" onClick={handleMediaClick}>
                                    <img
                                        src={message.mediaUrl}
                                        alt="Shared image"
                                        className="w-64 h-64 object-cover rounded-lg hover:opacity-90 transition-opacity"
                                        onError={(e) => {
                                            console.error('Failed to load image:', message.mediaUrl);
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg pointer-events-none">
                                        <span className="text-white text-sm font-medium">Click to view</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-4 py-2 text-sm text-gray-500">Image not available</div>
                            )}
                        </>
                    )}

                    {/* Video message */}
                    {message.type === 'video' && (
                        <>
                            {message.mediaUrl ? (
                                <div className="relative group cursor-pointer" onClick={handleMediaClick}>
                                    <video
                                        src={message.mediaUrl}
                                        className="w-80 h-auto rounded-lg pointer-events-none"
                                        poster={message.thumbnailUrl}
                                    />
                                    {/* Play button overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg group-hover:bg-black/40 transition-colors">
                                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
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

