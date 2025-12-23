// ChatInfoPanel - Right side panel showing chat info, media, and settings

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from '../../../types/user.types';
import type { Message } from '../../../types/chat.types';
import { chatService } from '../../../services/api/chatService';
import { MediaModal } from '../../common/MediaModal';
import { useMediaModal } from '../../../hooks/useMediaModal';
import {
    XMarkIcon,
    EnvelopeIcon,
    PhoneIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    PlayIcon,
} from '@heroicons/react/24/outline';

interface ChatInfoPanelProps {
    isOpen: boolean;
    onClose: () => void;
    otherUser: User;
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
        links: false,
        notifications: true,
    });
    const [isLoadingSettings, setIsLoadingSettings] = useState(false);

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

    const toggleSection = (section: 'links' | 'notifications') => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
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
                    {/* User Info Section */}
                    <div className="px-6 py-6 border-b border-gray-200">
                        <div className="flex flex-col items-center text-center">
                            {/* Avatar */}
                            <div className="relative mb-3">
                                <img
                                    src={otherUser.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&size=80`}
                                    alt={otherUser.name}
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                                {otherUser.isOnline && (
                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                                )}
                            </div>

                            {/* Name */}
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {otherUser.name}
                            </h3>

                            {/* Status */}
                            <span className="text-sm text-green-600 font-medium mb-4">
                                {otherUser.isOnline ? 'Active' : 'Offline'}
                            </span>

                            {/* Contact Info */}
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
                        </div>
                    </div>

                    {/* Shared Media Section */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-gray-900">Shared Media</h3>
                            {mediaMessages.length > 6 && (
                                <button
                                    onClick={() => setShowAllMedia(!showAllMedia)}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    {showAllMedia ? 'Show Less' : 'See All'}
                                </button>
                            )}
                        </div>

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
                                        {/* See All overlay for last item */}
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

                    {/* Shared Documents Section */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-semibold text-gray-900">Shared Documents</h3>
                            {documentMessages.length > 2 && (
                                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                    See All
                                </button>
                            )}
                        </div>

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
        </>
    );
}
