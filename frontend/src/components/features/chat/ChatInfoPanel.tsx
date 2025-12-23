// ChatInfoPanel - Right side panel showing chat info, media, and settings

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from '../../../types/user.types';
import type { Message, Conversation } from '../../../types/chat.types';
import { chatService } from '../../../services/api/chatService';
import { userService } from '../../../services/api/userService';
import { MediaModal } from '../../common/MediaModal';
import { useMediaModal } from '../../../hooks/useMediaModal';
import { Avatar } from '../../common/Avatar';
import {
    XMarkIcon,
    EnvelopeIcon,
    PhoneIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    PlayIcon,
    PlusIcon,
    UserMinusIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '../../common/Modal';
import { useAuthStore } from '@/stores/authStore';

interface ChatInfoPanelProps {
    isOpen: boolean;
    onClose: () => void;
    otherUser?: User;
    conversation?: Conversation;
    conversationId: string;
    sharedMedia?: Message[];
    sharedDocuments?: Message[];
}

interface NotificationSettings {
    mute: boolean;
    sound: boolean;
    popups: boolean;
    hide: boolean;
}

export function ChatInfoPanel({
    isOpen,
    onClose,
    otherUser,
    conversation,
    conversationId,
    sharedMedia = [],
    sharedDocuments = [],
}: ChatInfoPanelProps) {
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
        mute: false,
        sound: true,
        popups: true,
        hide: false,
    });
    const [showAllMedia, setShowAllMedia] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        members: false,
        sharedMedia: false,
        sharedDocuments: false,
        links: false,
        notifications: true,
    });
    const [isLoadingSettings, setIsLoadingSettings] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAddingMember, setIsAddingMember] = useState(false);

    const currentUser = useAuthStore((state) => state.user);
    const isGroup = conversation?.type === 'group';
    
    // Check if current user is admin
    const isCurrentUserAdmin = conversation?.members?.some(
        (m) => m.userId === currentUser?.id && m.role === 'admin'
    );

    // Media modal hook
    const {
        isOpen: isMediaModalOpen,
        currentMedia,
        mediaGallery,
        openModal,
        closeModal,
        goToPrevious,
        goToNext,
        goToIndex,
        hasPrevious,
        hasNext,
        currentIndex,
    } = useMediaModal();

    // Filter media messages (images and videos)
    const mediaMessages = useMemo(
        () => sharedMedia.filter((msg) => msg.type === 'image' || msg.type === 'video'),
        [sharedMedia]
    );

    // Filter document messages
    const documentMessages = sharedDocuments.filter(
        (msg) => msg.type === 'file'
    );

    // Show max 6 media thumbnails
    const displayedMedia = showAllMedia ? mediaMessages : mediaMessages.slice(0, 6);

    // Handle media click to open modal
    const handleMediaClick = (media: Message) => {
        openModal(media, mediaMessages);
    };

    const loadSettings = useCallback(async () => {
        try {
            const settings = await chatService.getConversationSettings(conversationId);
            setNotificationSettings(settings);
        } catch (error) {
            console.error('Failed to load conversation settings:', error);
        }
    }, [conversationId]);

    // Load settings when conversation changes
    useEffect(() => {
        if (conversationId && isOpen) {
            loadSettings();
        }
    }, [conversationId, isOpen, loadSettings]);

    const toggleNotificationSetting = async (key: keyof NotificationSettings) => {
        const newValue = !notificationSettings[key];
        
        // Optimistic update
        setNotificationSettings((prev) => ({
            ...prev,
            [key]: newValue,
        }));

        // Save to backend
        setIsLoadingSettings(true);
        try {
            await chatService.updateConversationSettings(conversationId, {
                [key]: newValue,
            });
        } catch (error) {
            console.error('Failed to update settings:', error);
            // Revert on error
            setNotificationSettings((prev) => ({
                ...prev,
                [key]: !newValue,
            }));
        } finally {
            setIsLoadingSettings(false);
        }
    };

    const toggleSection = (section: 'members' | 'sharedMedia' | 'sharedDocuments' | 'links' | 'notifications') => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    // Search users for adding to group
    useEffect(() => {
        if (!showAddMemberModal) {
            setSearchQuery('');
            setSearchResults([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const results = await userService.searchUsers(searchQuery);
                const usersArray = Array.isArray(results) ? results : (results as { data?: User[] })?.data || [];
                
                // Filter out users who are already members
                const existingMemberIds = conversation?.members?.map((m) => m.userId) || [];
                const filteredUsers = usersArray.filter(
                    (user: User) => !existingMemberIds.includes(user.id) && user.id !== currentUser?.id
                );
                
                setSearchResults(filteredUsers);
            } catch (error) {
                console.error('Failed to search users:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery, showAddMemberModal, conversation?.members, currentUser?.id]);

    const handleAddMember = async (userId: string) => {
        if (!conversationId || !isGroup) return;

        setIsAddingMember(true);
        try {
            await chatService.addMember(conversationId, { userId });
            setShowAddMemberModal(false);
            setSearchQuery('');
            setSearchResults([]);
            // Refresh conversation data if needed
        } catch (error) {
            console.error('Failed to add member:', error);
            alert('Failed to add member to group');
        } finally {
            setIsAddingMember(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!conversationId || !isGroup) return;
        
        if (!confirm('Are you sure you want to remove this member?')) return;

        try {
            await chatService.removeMember(conversationId, userId);
            // Refresh conversation data if needed
        } catch (error) {
            console.error('Failed to remove member:', error);
            alert('Failed to remove member from group');
        }
    };

    const getFileIcon = (fileName?: string) => {
        if (!fileName) return '📄';
        const ext = fileName.split('.').pop()?.toLowerCase();
        
        // Microsoft Office
        if (ext === 'pdf') return '📕';
        if (['doc', 'docx'].includes(ext || '')) return '📘';
        if (['xls', 'xlsx', 'csv'].includes(ext || '')) return '📗';
        if (['ppt', 'pptx'].includes(ext || '')) return '📙';
        
        // Archives
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return '🗜️';
        
        // Code
        if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'swift'].includes(ext || '')) return '💻';
        
        // Media
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext || '')) return '🖼️';
        if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'].includes(ext || '')) return '🎬';
        if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext || '')) return '🎵';
        
        // Text
        if (['txt', 'md', 'log'].includes(ext || '')) return '📝';
        if (['json', 'xml', 'yaml', 'yml'].includes(ext || '')) return '📋';
        
        return '📄';
    };

    const formatFileDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <>
            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Panel */}
            <div 
                className={`bg-white border-l border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 border-l-0'
                }`}
            >

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Chat Info</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Close chat info"
                    >
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* User/Group Info Section */}
                    <div className="px-6 py-6 border-b border-gray-200">
                        <div className="flex flex-col items-center text-center">
                            {/* Avatar */}
                            <div className="relative mb-3">
                                {isGroup ? (
                                    conversation?.avatarUrl ? (
                                        <img
                                            src={conversation.avatarUrl}
                                            alt={conversation.name || 'Group'}
                                            className="w-20 h-20 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                    )
                                ) : otherUser ? (
                                    <>
                                        <img
                                            src={otherUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&size=80`}
                                            alt={otherUser.name}
                                            className="w-20 h-20 rounded-full object-cover"
                                        />
                                        {otherUser.isOnline && (
                                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                                        )}
                                    </>
                                ) : null}
                            </div>

                            {/* Name */}
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {isGroup ? (conversation?.name || 'Nhóm chat') : (otherUser?.name || 'User')}
                            </h3>

                            {/* Status */}
                            {isGroup ? (
                                <span className="text-sm text-gray-600 mb-4">
                                    {conversation?.members?.length || 0} thành viên
                                </span>
                            ) : otherUser ? (
                                <span className="text-sm text-green-600 font-medium mb-4">
                                    {otherUser.isOnline ? 'Active' : 'Offline'}
                                </span>
                            ) : null}

                            {/* Contact Info - Only for direct chats */}
                            {!isGroup && otherUser && (
                                <div className="w-full space-y-3">
                                    {otherUser.email && (
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                                            <span className="break-all">{otherUser.email}</span>
                                        </div>
                                    )}
                                    {otherUser.phone && (
                                        <div className="flex items-center gap-3 text-sm text-gray-600">
                                            <PhoneIcon className="w-5 h-5 text-gray-400" />
                                            <span>{otherUser.phone}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Members Section - Only for groups */}
                    {isGroup && conversation && (
                        <div className="px-6 py-4 border-b border-gray-200">
                            <button
                                onClick={() => toggleSection('members')}
                                className="flex items-center justify-between w-full text-left mb-2"
                            >
                                <h3 className="text-base font-semibold text-gray-900">
                                    Thành viên ({conversation.members?.length || 0})
                                </h3>
                                <ChevronRightIcon
                                    className={`w-5 h-5 text-gray-400 transition-transform ${
                                        expandedSections.members ? 'rotate-90' : ''
                                    }`}
                                />
                            </button>

                            {expandedSections.members && (
                                <div className="mt-4 space-y-2">
                                    {/* Member list */}
                                    {conversation.participants?.map((member) => {
                                        const memberData = conversation.members?.find(m => m.userId === member.id);
                                        const isAdmin = memberData?.role === 'admin';
                                        const canRemove = isCurrentUserAdmin && member.id !== currentUser?.id;
                                        
                                        return (
                                            <div key={member.id} className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2">
                                                <Avatar
                                                    src={member.avatarUrl}
                                                    alt={member.name}
                                                    name={member.name}
                                                    size="sm"
                                                    status={member.isOnline ? 'online' : undefined}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {member.name}
                                                        {member.id === currentUser?.id && (
                                                            <span className="text-gray-500"> (Bạn)</span>
                                                        )}
                                                    </p>
                                                    {isAdmin && (
                                                        <p className="text-xs text-blue-600">Quản trị viên</p>
                                                    )}
                                                </div>
                                                {canRemove && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        aria-label="Remove member"
                                                    >
                                                        <UserMinusIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                    
                                    {/* Add member button */}
                                    {isCurrentUserAdmin && (
                                        <button
                                            onClick={() => setShowAddMemberModal(true)}
                                            className="flex items-center gap-3 w-full py-2 px-2 hover:bg-gray-50 rounded-lg transition-colors text-blue-600"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <PlusIcon className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-medium">Thêm thành viên</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Shared Media Section */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <button
                            onClick={() => toggleSection('sharedMedia')}
                            className="flex items-center justify-between w-full text-left mb-2"
                        >
                            <h3 className="text-base font-semibold text-gray-900">Shared Media</h3>
                            <ChevronRightIcon
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                    expandedSections.sharedMedia ? 'rotate-90' : ''
                                }`}
                            />
                        </button>

                        {expandedSections.sharedMedia && (
                            <div className="mt-4">
                                {mediaMessages.length > 6 && (
                                    <div className="flex justify-end mb-2">
                                        <button
                                            onClick={() => setShowAllMedia(!showAllMedia)}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            {showAllMedia ? 'Show Less' : 'See All'}
                                        </button>
                                    </div>
                                )}

                                {mediaMessages.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {displayedMedia.map((media, index) => (
                                            <div
                                                key={media.id}
                                                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity cursor-pointer group"
                                                onClick={() => handleMediaClick(media)}
                                            >
                                                <img
                                                    src={media.thumbnailUrl || media.mediaUrl || media.fileUrl}
                                                    alt={`Shared media ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                                {media.type === 'video' && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none">
                                                        <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                                                            <PlayIcon className="w-5 h-5 text-gray-700 ml-0.5" />
                                                        </div>
                                                    </div>
                                                )}
                                                {!showAllMedia && index === 5 && mediaMessages.length > 6 && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
                                                        <span className="text-white font-semibold text-sm">
                                                            See All
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No shared media yet</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Shared Documents Section */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <button
                            onClick={() => toggleSection('sharedDocuments')}
                            className="flex items-center justify-between w-full text-left mb-2"
                        >
                            <h3 className="text-base font-semibold text-gray-900">Shared Documents</h3>
                            <ChevronRightIcon
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                    expandedSections.sharedDocuments ? 'rotate-90' : ''
                                }`}
                            />
                        </button>

                        {expandedSections.sharedDocuments && (
                            <div className="mt-4">
                                {documentMessages.length > 0 ? (
                                    <div className="space-y-3">
                                        {documentMessages.slice(0, 2).map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                            >
                                                <div className="text-3xl">{getFileIcon(doc.fileName)}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {doc.fileName || 'Unknown file'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatFileDate(doc.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No shared documents yet</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Links Section */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <button
                            onClick={() => toggleSection('links')}
                            className="flex items-center justify-between w-full text-left"
                        >
                            <h3 className="text-base font-semibold text-gray-900">Links</h3>
                            <ChevronRightIcon
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                    expandedSections.links ? 'rotate-90' : ''
                                }`}
                            />
                        </button>

                        {expandedSections.links && (
                            <div className="mt-4">
                                <p className="text-sm text-gray-500">No shared links yet</p>
                            </div>
                        )}
                    </div>

                    {/* Notifications Section */}
                    <div className="px-6 py-4">
                        <button
                            onClick={() => toggleSection('notifications')}
                            className="flex items-center justify-between w-full text-left mb-4"
                        >
                            <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
                            <ChevronDownIcon
                                className={`w-5 h-5 text-gray-400 transition-transform ${
                                    expandedSections.notifications ? '' : '-rotate-90'
                                }`}
                            />
                        </button>

                        {expandedSections.notifications && (
                            <div className="space-y-4">
                                {/* Mute Notifications */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Mute Notifications</span>
                                    <button
                                        onClick={() => toggleNotificationSetting('mute')}
                                        disabled={isLoadingSettings}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            notificationSettings.mute ? 'bg-blue-600' : 'bg-gray-200'
                                        } ${isLoadingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                notificationSettings.mute ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Sound */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Sound</span>
                                    <button
                                        onClick={() => toggleNotificationSetting('sound')}
                                        disabled={isLoadingSettings}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            notificationSettings.sound ? 'bg-blue-600' : 'bg-gray-200'
                                        } ${isLoadingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                notificationSettings.sound ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Pop-ups */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Pop-ups</span>
                                    <button
                                        onClick={() => toggleNotificationSetting('popups')}
                                        disabled={isLoadingSettings}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            notificationSettings.popups ? 'bg-blue-600' : 'bg-gray-200'
                                        } ${isLoadingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                notificationSettings.popups ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Hide */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Hide</span>
                                    <button
                                        onClick={() => toggleNotificationSetting('hide')}
                                        disabled={isLoadingSettings}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            notificationSettings.hide ? 'bg-blue-600' : 'bg-gray-200'
                                        } ${isLoadingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                notificationSettings.hide ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Media Modal */}
            {currentMedia && (
                <MediaModal
                    media={currentMedia}
                    isOpen={isMediaModalOpen}
                    onClose={closeModal}
                    onPrevious={goToPrevious}
                    onNext={goToNext}
                    onJumpTo={goToIndex}
                    hasPrevious={hasPrevious}
                    hasNext={hasNext}
                    gallery={mediaGallery}
                    currentIndex={currentIndex}
                />
            )}

            {/* Add Member Modal */}
            <Modal
                isOpen={showAddMemberModal}
                onClose={() => setShowAddMemberModal(false)}
                title="Thêm thành viên"
            >
                <div className="space-y-4">
                    {/* Search input */}
                    <div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm người dùng..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                    </div>

                    {/* Search results */}
                    <div className="max-h-96 overflow-y-auto">
                        {isSearching ? (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="space-y-2">
                                {searchResults.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <Avatar
                                            src={user.avatarUrl}
                                            alt={user.name}
                                            name={user.name}
                                            size="sm"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {user.name}
                                            </p>
                                            {user.email && (
                                                <p className="text-xs text-gray-500 truncate">
                                                    {user.email}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleAddMember(user.id)}
                                            disabled={isAddingMember}
                                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Thêm
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : searchQuery.trim().length >= 2 ? (
                            <p className="text-center text-gray-500 py-8">
                                Không tìm thấy người dùng
                            </p>
                        ) : (
                            <p className="text-center text-gray-500 py-8">
                                Nhập ít nhất 2 ký tự để tìm kiếm
                            </p>
                        )}
                    </div>
                </div>
            </Modal>
        </>
    );
}
