import { memo } from 'react';
import { Avatar } from '../../common/Avatar';
import type { Conversation } from '../../../types/chat.types';

interface ConversationItemProps {
    conversation: Conversation;
    isActive?: boolean;
    onClick?: () => void;
}

function formatTimestamp(date: Date | string): string {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMs = now.getTime() - messageDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
        // Today: show time
        return messageDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    } else if (diffInDays === 1) {
        return 'Yesterday';
    } else if (diffInDays < 7) {
        return messageDate.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
        return messageDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    }
}

export const ConversationItem = memo(function ConversationItem({
    conversation,
    isActive = false,
    onClick,
}: ConversationItemProps) {
    const unreadCount = conversation.unreadCount || 0;
    const lastMessage = conversation.lastMessage;

    // Display name: group name or "Direct Chat" for direct conversations
    const displayName = conversation.type === 'group'
        ? (conversation.name || 'Group Chat')
        : (conversation.participants?.[0]?.name || 'Direct Chat');

    // Avatar: use group avatar or first participant's avatar
    const avatarUrl = conversation.type === 'group'
        ? conversation.avatarUrl
        : conversation.participants?.[0]?.avatar;

    return (
        <div
            onClick={onClick}
            className={`
        flex items-center gap-3 px-4 py-3 cursor-pointer transition-all
        ${isActive
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-100'
                }
      `}
        >
            {/* Avatar */}
            <Avatar
                src={avatarUrl}
                alt={displayName}
                name={displayName}
                size="md"
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-gray-900' : 'text-gray-900'}`}>
                        {displayName}
                    </h3>
                    {lastMessage && (
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {formatTimestamp(lastMessage.createdAt)}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    {lastMessage && (
                        <p className={`text-xs truncate ${unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                            {lastMessage.text}
                        </p>
                    )}

                    {/* Unread Badge */}
                    {unreadCount > 0 && (
                        <div className="flex-shrink-0 ml-2">
                            <div className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center bg-blue-600 text-white text-xs font-bold rounded-full">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
