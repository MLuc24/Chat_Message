import { memo } from 'react';
import { Avatar } from '../../common/Avatar';
import { Dropdown, DropdownItem, DropdownDivider } from '../../common/Dropdown';
import type { User } from '../../../types/user.types';
import type { Conversation } from '../../../types/chat.types';

interface ChatHeaderProps {
    conversation?: Conversation;
    recipient?: User; // For direct chats
    onVoiceCall?: () => void;
    onVideoCall?: () => void;
    onViewInfo?: () => void;
    onViewMembers?: () => void; // For group chats
    onLeaveGroup?: () => void; // For group chats
}

function getLastSeenText(lastSeen?: Date | string | null): string {
    if (!lastSeen) return 'Không hoạt động';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Vừa hoạt động';
    if (diffMinutes < 60) return `Hoạt động ${diffMinutes} phút trước`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hoạt động ${diffHours} giờ trước`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Hoạt động ${diffDays} ngày trước`;
}

export const ChatHeader = memo(function ChatHeader({
    conversation,
    recipient,
    onVoiceCall,
    onVideoCall,
    onViewInfo,
    onLeaveGroup,
}: ChatHeaderProps) {
    const isGroup = conversation?.type === 'group';
    
    // For group: use group name and avatar
    // For direct: use recipient info
    const displayName = isGroup 
        ? (conversation?.name || 'Nhóm chat')
        : (recipient?.name || 'User');
    
    const displayAvatar = isGroup 
        ? conversation?.avatarUrl 
        : recipient?.avatarUrl;
    
    const isOnline = !isGroup && (recipient?.isOnline ?? false);
    
    // Calculate member count for groups
    const memberCount = isGroup ? (conversation?.members?.length || 0) : 0;
    
    // Get online count for group (if participants available)
    const onlineCount = isGroup 
        ? (conversation?.participants?.filter(p => p.isOnline)?.length || 0)
        : 0;

    return (
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
            {/* Chat Info */}
            <div className="flex items-center gap-3">
                {isGroup ? (
                    // Group Avatar (stacked avatars or default group icon)
                    <div className="relative">
                        {displayAvatar ? (
                            <Avatar
                                src={displayAvatar}
                                alt={displayName}
                                name={displayName}
                                size="md"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        )}
                    </div>
                ) : (
                    <Avatar
                        src={displayAvatar}
                        alt={displayName}
                        name={displayName}
                        size="md"
                        status={isOnline ? 'online' : undefined}
                    />
                )}

                <div>
                    <h2 className="font-semibold text-base text-gray-900">
                        {displayName}
                    </h2>
                    {isGroup ? (
                        <p className="text-sm text-gray-500">
                            {memberCount} thành viên
                            {onlineCount > 0 && ` • ${onlineCount} đang hoạt động`}
                        </p>
                    ) : (
                        <p className={`text-sm ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                            {isOnline ? 'Đang hoạt động' : getLastSeenText(recipient?.lastSeen)}
                        </p>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
                {/* Voice Call - for both direct chats and groups */}
                {onVoiceCall && (
                    <button
                        onClick={onVoiceCall}
                        className="p-2.5 hover:bg-gray-100 rounded-full transition-colors chat-icon"
                        style={{ color: 'var(--chat-icon-primary)' }}
                        aria-label="Voice call"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                        </svg>
                    </button>
                )}

                {/* Video Call - for both direct chats and groups */}
                {onVideoCall && (
                    <button
                        onClick={onVideoCall}
                        className="p-2.5 hover:bg-gray-100 rounded-full transition-colors chat-icon"
                        style={{ color: 'var(--chat-icon-primary)' }}
                        aria-label="Video call"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                    </button>
                )}

                {/* More Options */}
                <Dropdown
                    trigger={
                        <button
                            className="p-2.5 hover:bg-gray-100 rounded-full transition-colors chat-icon"
                            style={{ color: 'var(--chat-icon-primary)' }}
                            aria-label="More options"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>
                    }
                >
                    {onViewInfo && (
                        <DropdownItem
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            }
                            onClick={onViewInfo}
                        >
                            {isGroup ? 'Thông tin nhóm' : 'Xem thông tin'}
                        </DropdownItem>
                    )}
                    
                    <DropdownDivider />
                    
                    <DropdownItem
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                                />
                            </svg>
                        }
                    >
                        Tắt thông báo
                    </DropdownItem>
                    
                    {isGroup && onLeaveGroup && (
                        <DropdownItem
                            variant="danger"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            }
                            onClick={onLeaveGroup}
                        >
                            Rời nhóm
                        </DropdownItem>
                    )}
                    
                    {!isGroup && (
                        <DropdownItem
                            variant="danger"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            }
                        >
                            Xóa đoạn chat
                        </DropdownItem>
                    )}
                </Dropdown>
            </div>
        </div>
    );
});
