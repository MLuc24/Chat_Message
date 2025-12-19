import { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { Spinner } from '../../common/Spinner';
import { Avatar } from '../../common/Avatar';
import { userService } from '@/services/api/userService';
import { chatService } from '@/services/api/chatService';
import type { User } from '@/types/user.types';
import { useAuthStore } from '@/stores/authStore';

interface NewChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConversationCreated: (conversationId: string) => void;
}

export function NewChatModal({ isOpen, onClose, onConversationCreated }: NewChatModalProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const currentUser = useAuthStore((state) => state.user);

    // Search users
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setUsers([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            if (searchQuery.trim().length < 2) {
                setUsers([]);
                return;
            }

            setIsLoading(true);
            try {
                const results = await userService.searchUsers(searchQuery);
                // Ensure results is an array (handle both direct array and nested data structure)
                const usersArray = Array.isArray(results) ? results : (results as any)?.data || [];
                // Filter out current user from results
                const filteredUsers = usersArray.filter((user: User) => user.id !== currentUser?.id);
                setUsers(filteredUsers);
            } catch (error) {
                console.error('Failed to search users:', error);
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery, isOpen, currentUser?.id]);

    const handleCreateConversation = async (userId: string) => {
        if (!currentUser?.id) {
            alert('Không thể xác định người dùng hiện tại');
            return;
        }

        setIsCreating(true);
        try {
            const conversation = await chatService.createConversation({
                type: 'direct',
                participantIds: [currentUser.id, userId],
            });
            onConversationCreated(conversation.id);
            onClose();
        } catch (error: any) {
            console.error('❌ Failed to create conversation:', error);
            console.error('❌ Error response:', error.response?.data);
            alert(`Không thể tạo đoạn chat: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        if (!isCreating) {
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Tin nhắn mới"
            size="md"
            closeOnBackdrop={!isCreating}
        >
            <div className="px-6 py-4">
                {/* Search Input */}
                <div className="mb-4">
                    <label htmlFor="search-users" className="block text-sm font-medium text-gray-700 mb-2">
                        Đến:
                    </label>
                    <div className="relative">
                        <input
                            id="search-users"
                            type="text"
                            placeholder="Nhập tên hoặc email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isCreating}
                            autoFocus
                        />
                    </div>
                </div>

                {/* User List */}
                <div className="max-h-96 overflow-y-auto">
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <Spinner size="md" />
                        </div>
                    )}

                    {!isLoading && searchQuery.trim().length < 2 && (
                        <div className="text-center py-8 text-gray-500">
                            <svg
                                className="w-12 h-12 mx-auto mb-2 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                            <p className="text-sm">Nhập tên hoặc email để tìm người dùng</p>
                        </div>
                    )}

                    {!isLoading && searchQuery.trim().length >= 2 && users.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <svg
                                className="w-12 h-12 mx-auto mb-2 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <p className="text-sm">Không tìm thấy người dùng</p>
                        </div>
                    )}

                    {!isLoading && users.length > 0 && (
                        <ul className="divide-y divide-gray-200">
                            {users.map((user) => (
                                <li key={user.id}>
                                    <button
                                        onClick={() => handleCreateConversation(user.id)}
                                        disabled={isCreating}
                                        className="w-full flex items-center gap-3 px-2 py-3 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Avatar
                                            src={user.avatarUrl}
                                            alt={user.name}
                                            size="md"
                                            status={user.isOnline ? 'online' : 'offline'}
                                        />
                                        <div className="flex-1 text-left">
                                            <p className="font-medium text-gray-900">{user.name}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                        {isCreating && (
                                            <Spinner size="sm" />
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </Modal>
    );
}
