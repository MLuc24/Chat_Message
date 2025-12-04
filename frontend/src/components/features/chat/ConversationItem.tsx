import { memo } from 'react';
import { Avatar } from '../../common/Avatar';
import { Badge } from '../../common/Badge';
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
    const otherParticipant = conversation.participants?.[0]; // Assuming 1-on-1 chat

    return (
        <div
            onClick={onClick}
            className={`
        flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
        ${isActive
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                }
      `}
        >
            {/* Avatar */}
            <Avatar
                src={otherParticipant?.avatar}
                alt={otherParticipant?.name || 'User'}
                name={otherParticipant?.name}
                size="md"
                status={otherParticipant?.isOnline ? 'online' : 'offline'}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                        {otherParticipant?.name || 'Unknown User'}
                    </h3>
                    {lastMessage && (
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {formatTimestamp(lastMessage.createdAt)}
                        </span>
                    )}
                </div>

                {lastMessage && (
                    <p className="text-sm text-gray-600 truncate">
                        {lastMessage.content}
                    </p>
                )}
            </div>

            {/* Unread Badge */}
            {unreadCount > 0 && (
                <Badge variant="info" size="sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
            )}
        </div>
    );
});
