import { memo } from 'react';
import { Avatar } from '../../common/Avatar';
import { Button } from '../../common/Button';
import type { User } from '../../../types/user.types';

interface UserProfileProps {
    user: User;
    onEdit?: () => void;
    isOwnProfile?: boolean;
}

export const UserProfile = memo(function UserProfile({
    user,
    onEdit,
    isOwnProfile = false,
}: UserProfileProps) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
                <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    name={user.name}
                    size="xl"
                    status={user.isOnline ? 'online' : 'offline'}
                />
                <h2 className="text-2xl font-bold text-gray-900 mt-4">{user.name}</h2>
                <p className="text-gray-500 text-sm">
                    {user.isOnline ? 'Active now' : 'Offline'}
                </p>
            </div>

            {/* User Info */}
            <div className="space-y-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <p className="text-gray-900">{user.email}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Member since
                    </label>
                    <p className="text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                </div>
            </div>

            {/* Edit Button (only for own profile) */}
            {isOwnProfile && onEdit && (
                <Button onClick={onEdit} variant="primary" className="w-full">
                    Edit Profile
                </Button>
            )}
        </div>
    );
});
