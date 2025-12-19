import { useState, useEffect, useCallback } from 'react';
import { Avatar } from '../../common/Avatar';
import { Spinner } from '../../common/Spinner';
import { Modal } from '../../common/Modal';
import { userService } from '@/services/api/userService';
import { chatService } from '@/services/api/chatService';
import type { User } from '@/types/user.types';
import type { Conversation, ConversationMember } from '@/types/chat.types';
import { useAuthStore } from '@/stores/authStore';

interface GroupMemberListProps {
    conversation: Conversation;
    isOpen: boolean;
    onClose: () => void;
    onMemberAdded?: () => void;
    onMemberRemoved?: () => void;
}

interface MemberWithUser extends ConversationMember {
    user?: User;
}

export function GroupMemberList({
    conversation,
    isOpen,
    onClose,
    onMemberAdded,
    onMemberRemoved,
}: GroupMemberListProps) {
    const [members, setMembers] = useState<MemberWithUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [removingUserId, setRemovingUserId] = useState<string | null>(null);
    
    const currentUser = useAuthStore((state) => state.user);
    
    // Check if current user is admin
    const isCurrentUserAdmin = conversation.members.some(
        (m) => m.userId === currentUser?.id && m.role === 'admin'
    );

    // Load member details
    useEffect(() => {
        if (!isOpen) return;

        const loadMembers = async () => {
            setIsLoading(true);
            try {
                // Use participants if available, otherwise fetch from members
                if (conversation.participants && conversation.participants.length > 0) {
                    const membersWithUsers = conversation.members.map((member) => ({
                        ...member,
                        user: conversation.participants?.find((p) => p.id === member.userId),
                    }));
                    setMembers(membersWithUsers);
                } else {
                    // Fetch user details for each member
                    const memberIds = conversation.members.map((m) => m.userId);
                    const users = await userService.getUsersByIds(memberIds);
                    
                    const membersWithUsers = conversation.members.map((member) => ({
                        ...member,
                        user: users.find((u: User) => u.id === member.userId),
                    }));
                    setMembers(membersWithUsers);
                }
            } catch (error) {
                console.error('Failed to load member details:', error);
                // Still show members without user details
                setMembers(conversation.members.map((m) => ({ ...m })));
            } finally {
                setIsLoading(false);
            }
        };

        loadMembers();
    }, [isOpen, conversation.members, conversation.participants]);

    // Search users for adding
    useEffect(() => {
        if (!showAddMember) return;

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
                const existingMemberIds = conversation.members.map((m) => m.userId);
                const filteredUsers = usersArray.filter(
                    (user: User) => !existingMemberIds.includes(user.id)
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
    }, [searchQuery, showAddMember, conversation.members]);

    const handleAddMember = useCallback(async (userId: string) => {
        setIsAddingMember(true);
        try {
            await chatService.addMember(conversation.id, { userId });
            setSearchQuery('');
            setSearchResults([]);
            setShowAddMember(false);
            onMemberAdded?.();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            console.error('Failed to add member:', error);
            alert(`Không thể thêm thành viên: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsAddingMember(false);
        }
    }, [conversation.id, onMemberAdded]);

    const handleRemoveMember = useCallback(async (userId: string) => {
        if (!confirm('Bạn có chắc muốn xóa thành viên này khỏi nhóm?')) return;
        
        setRemovingUserId(userId);
        try {
            await chatService.removeMember(conversation.id, userId);
            onMemberRemoved?.();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            console.error('Failed to remove member:', error);
            alert(`Không thể xóa thành viên: ${err.response?.data?.message || err.message}`);
        } finally {
            setRemovingUserId(null);
        }
    }, [conversation.id, onMemberRemoved]);

    const handleLeaveGroup = useCallback(async () => {
        if (!confirm('Bạn có chắc muốn rời khỏi nhóm này?')) return;
        
        if (!currentUser?.id) return;
        
        setRemovingUserId(currentUser.id);
        try {
            await chatService.removeMember(conversation.id, currentUser.id);
            onClose();
            onMemberRemoved?.();
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            console.error('Failed to leave group:', error);
            alert(`Không thể rời nhóm: ${err.response?.data?.message || err.message}`);
        } finally {
            setRemovingUserId(null);
        }
    }, [conversation.id, currentUser?.id, onClose, onMemberRemoved]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Thành viên nhóm (${members.length})`}
            size="md"
        >
            <div className="px-6 py-4">
                {/* Add Member Button (admin only) */}
                {isCurrentUserAdmin && !showAddMember && (
                    <button
                        onClick={() => setShowAddMember(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-4 border-2 border-dashed border-gray-300 rounded-lg text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Thêm thành viên
                    </button>
                )}

                {/* Add Member Search */}
                {showAddMember && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="text"
                                placeholder="Tìm người dùng..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                autoFocus
                            />
                            <button
                                onClick={() => {
                                    setShowAddMember(false);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className="p-2 text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Search Results */}
                        {isSearching && (
                            <div className="flex justify-center py-2">
                                <Spinner size="sm" />
                            </div>
                        )}

                        {!isSearching && searchResults.length > 0 && (
                            <ul className="max-h-40 overflow-y-auto divide-y divide-gray-200">
                                {searchResults.map((user) => (
                                    <li key={user.id}>
                                        <button
                                            onClick={() => handleAddMember(user.id)}
                                            disabled={isAddingMember}
                                            className="w-full flex items-center gap-2 px-2 py-2 hover:bg-white rounded transition-colors"
                                        >
                                            <Avatar src={user.avatarUrl} alt={user.name} size="sm" />
                                            <div className="flex-1 text-left">
                                                <p className="text-sm font-medium">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                            {isAddingMember ? (
                                                <Spinner size="sm" />
                                            ) : (
                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
                            <p className="text-center text-sm text-gray-500 py-2">
                                Không tìm thấy người dùng
                            </p>
                        )}
                    </div>
                )}

                {/* Member List */}
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Spinner size="lg" />
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                        {members.map((member) => {
                            const isCurrentUser = member.userId === currentUser?.id;
                            const canRemove = isCurrentUserAdmin && !isCurrentUser;
                            const isCreator = member.userId === conversation.createdBy;

                            return (
                                <li
                                    key={member.userId}
                                    className="flex items-center gap-3 py-3"
                                >
                                    <Avatar
                                        src={member.user?.avatarUrl}
                                        alt={member.user?.name || 'User'}
                                        size="md"
                                        status={member.user?.isOnline ? 'online' : undefined}
                                    />
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-900 truncate">
                                                {member.user?.name || 'Unknown User'}
                                                {isCurrentUser && (
                                                    <span className="text-gray-500 font-normal"> (Bạn)</span>
                                                )}
                                            </p>
                                            {member.role === 'admin' && (
                                                <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                                    Admin
                                                </span>
                                            )}
                                            {isCreator && (
                                                <span className="px-1.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                                                    Người tạo
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">
                                            {member.user?.email || ''}
                                        </p>
                                    </div>

                                    {/* Remove button */}
                                    {canRemove && (
                                        <button
                                            onClick={() => handleRemoveMember(member.userId)}
                                            disabled={removingUserId === member.userId}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                                            title="Xóa khỏi nhóm"
                                        >
                                            {removingUserId === member.userId ? (
                                                <Spinner size="sm" />
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}

                {/* Leave Group Button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                        onClick={handleLeaveGroup}
                        disabled={removingUserId === currentUser?.id}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {removingUserId === currentUser?.id ? (
                            <Spinner size="sm" />
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        )}
                        Rời khỏi nhóm
                    </button>
                </div>
            </div>
        </Modal>
    );
}
