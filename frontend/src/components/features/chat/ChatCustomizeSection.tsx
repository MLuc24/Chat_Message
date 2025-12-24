import { useState, useCallback, useEffect } from 'react';
import { 
    PencilIcon, 
    PhotoIcon, 
    SwatchIcon, 
    FaceSmileIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    XMarkIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '../../common/Modal';
import { Avatar } from '../../common/Avatar';
import { ThemeSelector } from '../theme/ThemeSelector';
import { DefaultEmojiPicker } from './DefaultEmojiPicker';
import { useNicknameStore } from '../../../stores/nicknameStore';
import { useDefaultEmoji } from '../../../hooks/useDefaultEmoji';
import type { Conversation } from '../../../types/chat.types';
import type { User } from '../../../types/user.types';
import { chatService } from '../../../services/api/chatService';
import { useUpload } from '../../../hooks/useUpload';

interface ChatCustomizeSectionProps {
    conversation: Conversation;
    isGroup: boolean;
    currentUserId: string;
    onConversationUpdate?: (updated: Partial<Conversation>) => void;
}

export function ChatCustomizeSection({
    conversation,
    isGroup,
    currentUserId,
    onConversationUpdate,
}: ChatCustomizeSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
    const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [groupName, setGroupName] = useState(conversation.name || '');
    const [editingNickname, setEditingNickname] = useState<string | null>(null);
    const [tempNickname, setTempNickname] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSavingNickname, setIsSavingNickname] = useState(false);
    
    const { nicknamesByConversation, loadNicknames, setNickname: setNicknameInStore } = useNicknameStore();
    const nicknames = nicknamesByConversation[conversation.id] || {};
    
    const { defaultEmoji, updateDefaultEmoji, reloadDefaultEmoji } = useDefaultEmoji(conversation.id);
    
    const { upload: uploadAvatar, isUploading: isUploadingAvatar } = useUpload({
        uploadType: 'avatar',
        onSuccess: async (result) => {
            try {
                await chatService.updateConversation(conversation.id, { avatarUrl: result.url });
                onConversationUpdate?.({ avatarUrl: result.url });
            } catch (error) {
                console.error('Failed to update avatar:', error);
                alert('Không thể thay đổi ảnh. Vui lòng thử lại.');
            }
        },
        onError: (error) => {
            console.error('Failed to upload avatar:', error);
            alert('Không thể tải lên ảnh. Vui lòng thử lại.');
        },
    });

    // Load nicknames when nickname modal opens
    useEffect(() => {
        if (isNicknameModalOpen) {
            loadNicknames(conversation.id);
        }
    }, [isNicknameModalOpen, conversation.id, loadNicknames]);

    // Handle rename group
    const handleRenameGroup = useCallback(async () => {
        if (!groupName.trim() || groupName === conversation.name) {
            setIsRenameModalOpen(false);
            return;
        }

        setIsLoading(true);
        try {
            await chatService.updateConversation(conversation.id, { name: groupName.trim() });
            onConversationUpdate?.({ name: groupName.trim() });
            setIsRenameModalOpen(false);
        } catch (error) {
            console.error('Failed to rename group:', error);
            alert('Không thể đổi tên nhóm. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    }, [conversation.id, conversation.name, groupName, onConversationUpdate]);

    // Handle change avatar
    const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Kích thước file không được vượt quá 5MB.');
            return;
        }

        // Upload using the hook - callbacks handle success/error
        uploadAvatar(file);
    }, [uploadAvatar]);

    // Handle nickname edit start
    const handleStartEditNickname = (userId: string, currentNickname: string) => {
        setEditingNickname(userId);
        setTempNickname(currentNickname);
    };

    // Handle save nickname
    const handleSaveNickname = useCallback(async (userId: string) => {
        const trimmedNickname = tempNickname.trim();
        
        setIsSavingNickname(true);
        try {
            // Save to store (which handles backend)
            await setNicknameInStore(conversation.id, userId, trimmedNickname);
            
            setEditingNickname(null);
            setTempNickname('');
        } catch (error) {
            console.error('Failed to save nickname:', error);
            alert('Không thể lưu biệt danh. Vui lòng thử lại.');
        } finally {
            setIsSavingNickname(false);
        }
    }, [conversation.id, tempNickname, setNicknameInStore]);

    // Handle cancel nickname edit
    const handleCancelNickname = () => {
        setEditingNickname(null);
        setTempNickname('');
    };

    // Get member's display name (nickname or real name)
    const getMemberDisplayName = (member: User) => {
        return nicknames[member.id] || member.name;
    };

    // Menu items based on chat type
    const menuItems = [
        ...(isGroup ? [
            {
                id: 'rename',
                icon: PencilIcon,
                label: 'Đổi tên đoạn chat',
                onClick: () => {
                    setGroupName(conversation.name || '');
                    setIsRenameModalOpen(true);
                },
                disabled: false,
                isLoading: false,
            },
            {
                id: 'avatar',
                icon: PhotoIcon,
                label: 'Thay đổi ảnh',
                onClick: () => document.getElementById('group-avatar-input')?.click(),
                disabled: false,
                isLoading: isUploadingAvatar,
            },
        ] : []),
        {
            id: 'theme',
            icon: SwatchIcon,
            label: 'Đổi chủ đề',
            onClick: () => setIsThemeSelectorOpen(true),
            disabled: false,
            isLoading: false,
        },
        {
            id: 'emoji',
            icon: FaceSmileIcon,
            label: 'Thay đổi biểu tượng cảm xúc',
            emoji: defaultEmoji,
            onClick: () => setIsEmojiPickerOpen(true),
            disabled: false,
            isLoading: false,
        },
        {
            id: 'nickname',
            icon: () => <span className="text-sm font-bold w-5 h-5 flex items-center justify-center">Aa</span>,
            label: 'Chỉnh sửa biệt danh',
            onClick: () => setIsNicknameModalOpen(true),
            disabled: false,
            isLoading: false,
        },
    ];

    return (
        <>
            <div className="px-6 py-4 border-b border-gray-200">
                {/* Section Header */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-between w-full text-left"
                >
                    <h3 className="text-base font-semibold text-gray-900">
                        Tùy chỉnh đoạn chat
                    </h3>
                    {isExpanded ? (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                    )}
                </button>

                {/* Menu Items */}
                {isExpanded && (
                    <div className="mt-4 space-y-1">
                        {menuItems.map((item) => {
                            const IconComponent = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={item.onClick}
                                    disabled={item.disabled || item.isLoading}
                                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors
                                        ${item.disabled 
                                            ? 'text-gray-400 cursor-not-allowed' 
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }
                                        ${item.isLoading ? 'opacity-50 cursor-wait' : ''}
                                    `}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                        {item.isLoading ? (
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        ) : typeof IconComponent === 'function' && IconComponent.name ? (
                                            <IconComponent className="w-5 h-5 text-gray-600" />
                                        ) : (
                                            <IconComponent />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                                    {item.emoji && (
                                        <span className="text-xl">{item.emoji}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Hidden file input for avatar */}
            <input
                id="group-avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
            />

            {/* Rename Group Modal */}
            <Modal
                isOpen={isRenameModalOpen}
                onClose={() => setIsRenameModalOpen(false)}
                title="Đổi tên đoạn chat"
            >
                <div className="space-y-4">
                    <div>
                        <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-1">
                            Tên nhóm
                        </label>
                        <input
                            id="group-name"
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Nhập tên nhóm..."
                            maxLength={100}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                        <p className="mt-1 text-xs text-gray-500">{groupName.length}/100 ký tự</p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsRenameModalOpen(false)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleRenameGroup}
                            disabled={isLoading || !groupName.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Nickname Modal */}
            <Modal
                isOpen={isNicknameModalOpen}
                onClose={() => {
                    setIsNicknameModalOpen(false);
                    setEditingNickname(null);
                }}
                title="Chỉnh sửa biệt danh"
            >
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    <p className="text-sm text-gray-500 mb-4">
                        Biệt danh chỉ hiển thị trong cuộc trò chuyện này.
                    </p>
                    {conversation.participants?.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                        >
                            <Avatar
                                src={member.avatarUrl}
                                alt={member.name}
                                name={member.name}
                                size="sm"
                            />
                            <div className="flex-1 min-w-0">
                                {editingNickname === member.id ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={tempNickname}
                                            onChange={(e) => setTempNickname(e.target.value)}
                                            placeholder={member.name}
                                            maxLength={50}
                                            disabled={isSavingNickname}
                                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !isSavingNickname) handleSaveNickname(member.id);
                                                if (e.key === 'Escape' && !isSavingNickname) handleCancelNickname();
                                            }}
                                        />
                                        <button
                                            onClick={() => handleSaveNickname(member.id)}
                                            disabled={isSavingNickname}
                                            className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                                        >
                                            {isSavingNickname ? (
                                                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <CheckIcon className="w-4 h-4" />
                                            )}
                                        </button>
                                        <button
                                            onClick={handleCancelNickname}
                                            disabled={isSavingNickname}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {getMemberDisplayName(member)}
                                                {member.id === currentUserId && (
                                                    <span className="text-gray-500"> (Bạn)</span>
                                                )}
                                            </p>
                                            {nicknames[member.id] && (
                                                <p className="text-xs text-gray-500">
                                                    Tên thật: {member.name}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleStartEditNickname(member.id, nicknames[member.id] || '')}
                                            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* Theme Selector Modal */}
            <ThemeSelector 
                isOpen={isThemeSelectorOpen}
                onClose={() => setIsThemeSelectorOpen(false)}
                conversationId={conversation.id}
            />

            {/* Default Emoji Picker Modal */}
            <DefaultEmojiPicker
                isOpen={isEmojiPickerOpen}
                currentEmoji={defaultEmoji}
                onSelect={updateDefaultEmoji}
                onClose={() => setIsEmojiPickerOpen(false)}
            />
        </>
    );
}
