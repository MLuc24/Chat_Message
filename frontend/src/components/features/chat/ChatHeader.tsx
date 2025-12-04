import { memo } from 'react';
import { Avatar } from '../../common/Avatar';
import { Dropdown, DropdownItem, DropdownDivider } from '../../common/Dropdown';
import type { User } from '../../../types/user.types';

interface ChatHeaderProps {
    recipient?: User;
    onVoiceCall?: () => void;
    onVideoCall?: () => void;
    onViewInfo?: () => void;
}

export const ChatHeader = memo(function ChatHeader({
    recipient,
    onVoiceCall,
    onVideoCall,
    onViewInfo,
}: ChatHeaderProps) {
    if (!recipient) {
        return null;
    }

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
            {/* Recipient Info */}
            <div className="flex items-center gap-3">
                <Avatar
                    src={recipient.avatar}
                    alt={recipient.name}
                    name={recipient.name}
                    size="md"
                    status={recipient.isOnline ? 'online' : 'offline'}
                />

                <div>
                    <h2 className="font-semibold text-gray-900">
                        {recipient.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {recipient.isOnline ? 'Active now' : 'Offline'}
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                {/* Voice Call */}
                {onVoiceCall && (
                    <button
                        onClick={onVoiceCall}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Voice call"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                        </svg>
                    </button>
                )}

                {/* Video Call */}
                {onVideoCall && (
                    <button
                        onClick={onVideoCall}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Video call"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="More options"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
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
                            View Info
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
                        Mute Notifications
                    </DropdownItem>
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
                        Delete Conversation
                    </DropdownItem>
                </Dropdown>
            </div>
        </div>
    );
});
