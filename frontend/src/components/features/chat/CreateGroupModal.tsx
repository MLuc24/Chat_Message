import { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from '../../common/Modal';
import { Spinner } from '../../common/Spinner';
import { Avatar } from '../../common/Avatar';
import { userService } from '@/services/api/userService';
import { chatService } from '@/services/api/chatService';
import type { User } from '@/types/user.types';
import { useAuthStore } from '@/stores/authStore';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGroupCreated: (conversationId: string) => void;
}

export function CreateGroupModal({ isOpen, onClose, onGroupCreated }: CreateGroupModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [groupName, setGroupName] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [step, setStep] = useState<'select' | 'name'>('select');
    const currentUser = useAuthStore((state) => state.user);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);

    // Focus input based on step
    useEffect(() => {
        if (!isOpen) return;
        
        const timer = setTimeout(() => {
            if (step === 'select' && searchInputRef.current) {
                searchInputRef.current.focus();
            } else if (step === 'name' && nameInputRef.current) {
                nameInputRef.current.focus();
            }
        }, 100);
        
        return () => clearTimeout(timer);
    }, [isOpen, step]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setSearchResults([]);
            setSelectedUsers([]);
            setGroupName('');
            setStep('select');
        }
    }, [isOpen]);

    // Search users
    useEffect(() => {
        if (!isOpen || step !== 'select') return;

        const delayDebounce = setTimeout(async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const results = await userService.searchUsers(searchQuery);
                const usersArray = Array.isArray(results) ? results : (results as { data?: User[] })?.data || [];
                // Filter out current user and already selected users
                const filteredUsers = usersArray.filter(
                    (user: User) =>
                        user.id !== currentUser?.id &&
                        !selectedUsers.some((selected) => selected.id === user.id)
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
    }, [searchQuery, isOpen, currentUser?.id, selectedUsers, step]);

    const handleSelectUser = useCallback((user: User) => {
        setSelectedUsers((prev) => [...prev, user]);
        setSearchQuery('');
        setSearchResults([]);
    }, []);

    const handleRemoveUser = useCallback((userId: string) => {
        setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
    }, []);

    const handleContinue = useCallback(() => {
        if (selectedUsers.length < 2) {
            alert('Vui lòng chọn ít nhất 2 người để tạo nhóm');
            return;
        }
        setStep('name');
    }, [selectedUsers.length]);

    const handleBack = useCallback(() => {
        setStep('select');
    }, []);

    const handleCreateGroup = useCallback(async () => {
        if (!currentUser?.id || !groupName.trim()) {
            alert('Vui lòng nhập tên nhóm');
            return;
        }

        setIsCreating(true);
        try {
            const participantIds = [currentUser.id, ...selectedUsers.map((u) => u.id)];
            const conversation = await chatService.createConversation({
                type: 'group',
                participantIds,
                name: groupName.trim(),
            });
            onGroupCreated(conversation.id);
            onClose();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            console.error('Failed to create group:', error);
            alert(`Không thể tạo nhóm: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsCreating(false);
        }
    }, [currentUser?.id, groupName, selectedUsers, onGroupCreated, onClose]);

    const handleClose = useCallback(() => {
        if (!isCreating) {
            onClose();
        }
    }, [isCreating, onClose]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={step === 'select' ? 'Tạo nhóm chat mới' : 'Đặt tên nhóm'}
            size="md"
            closeOnBackdrop={!isCreating}
        >
            {step === 'select' ? (
                <div className="px-6 py-4">
                    {/* Selected Users */}
                    {selectedUsers.length > 0 && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Đã chọn ({selectedUsers.length})
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {selectedUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                                    >
                                        <Avatar
                                            src={user.avatarUrl}
                                            alt={user.name}
                                            size="xs"
                                        />
                                        <span>{user.name}</span>
                                        <button
                                            onClick={() => handleRemoveUser(user.id)}
                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                            disabled={isCreating}
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Search Input */}
                    <div className="mb-4">
                        <label htmlFor="search-users-group" className="block text-sm font-medium text-gray-700 mb-2">
                            Thêm thành viên:
                        </label>
                        <input
                            ref={searchInputRef}
                            id="search-users-group"
                            type="text"
                            placeholder="Nhập tên hoặc email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isCreating}
                        />
                    </div>

                    {/* Search Results */}
                    <div className="max-h-60 overflow-y-auto mb-4">
                        {isSearching && (
                            <div className="flex items-center justify-center py-4">
                                <Spinner size="md" />
                            </div>
                        )}

                        {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                                Không tìm thấy người dùng
                            </div>
                        )}

                        {!isSearching && searchResults.length > 0 && (
                            <ul className="divide-y divide-gray-200">
                                {searchResults.map((user) => (
                                    <li key={user.id}>
                                        <button
                                            onClick={() => handleSelectUser(user)}
                                            disabled={isCreating}
                                            className="w-full flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                                        >
                                            <Avatar
                                                src={user.avatarUrl}
                                                alt={user.name}
                                                size="sm"
                                                status={user.isOnline ? 'online' : 'offline'}
                                            />
                                            <div className="flex-1 text-left">
                                                <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Continue Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={handleContinue}
                            disabled={selectedUsers.length < 2 || isCreating}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Tiếp tục ({selectedUsers.length}/2+)
                        </button>
                    </div>
                </div>
            ) : (
                <div className="px-6 py-4">
                    {/* Group Preview */}
                    <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
                        <div className="flex -space-x-2">
                            {selectedUsers.slice(0, 3).map((user) => (
                                <Avatar
                                    key={user.id}
                                    src={user.avatarUrl}
                                    alt={user.name}
                                    size="sm"
                                    className="ring-2 ring-white"
                                />
                            ))}
                            {selectedUsers.length > 3 && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 ring-2 ring-white">
                                    +{selectedUsers.length - 3}
                                </div>
                            )}
                        </div>
                        <span className="text-sm text-gray-600">
                            {selectedUsers.length + 1} thành viên
                        </span>
                    </div>

                    {/* Group Name Input */}
                    <div className="mb-6">
                        <label htmlFor="group-name" className="block text-sm font-medium text-gray-700 mb-2">
                            Tên nhóm
                        </label>
                        <input
                            ref={nameInputRef}
                            id="group-name"
                            type="text"
                            placeholder="Nhập tên nhóm..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isCreating}
                            maxLength={50}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            {groupName.length}/50 ký tự
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between">
                        <button
                            onClick={handleBack}
                            disabled={isCreating}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Quay lại
                        </button>
                        <button
                            onClick={handleCreateGroup}
                            disabled={!groupName.trim() || isCreating}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isCreating && <Spinner size="sm" />}
                            Tạo nhóm
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
