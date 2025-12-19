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

    // Get current user ID to exclude from participants
    const currentUserId = localStorage.getItem('user') 
        ? JSON.parse(localStorage.getItem('user') || '{}').id 
        : null;

    // Get the other participant (not current user)
    const otherParticipant = conversation.participants?.find(
        (p) => p.id !== currentUserId
    );

    // Display name: group name or other participant's name
    const displayName = conversation.type === 'group'
        ? (conversation.name || 'Group Chat')
        : (otherParticipant?.name || 'Direct Chat');

    // Avatar: use group avatar or other participant's avatar
    const avatarUrl = conversation.type === 'group'
        ? conversation.avatarUrl
        : otherParticipant?.avatarUrl;

    // Online status for direct conversations
    const isOnline = conversation.type === 'direct' && otherParticipant?.isOnline;

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
                status={isOnline ? 'online' : undefined}
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

                    {/* Unread Indicator - just a dot */}
                    {unreadCount > 0 && (
                        <div className="flex-shrink-0 ml-2">
                            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
