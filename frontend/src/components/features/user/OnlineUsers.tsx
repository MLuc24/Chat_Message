import { memo } from 'react';
import { Avatar } from '../../common/Avatar';
import type { User } from '../../../types/user.types';

interface OnlineUsersProps {
    users: User[];
    onUserClick?: (user: User) => void;
}

export const OnlineUsers = memo(function OnlineUsers({
    users,
    onUserClick,
}: OnlineUsersProps) {
    if (users.length === 0) {
        return null;
    }

    return (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
                Online Now ({users.length})
            </h3>

            <div className="flex gap-3 overflow-x-auto pb-2">
                {users.map((user) => (
                    <button
                        key={user.id}
                        onClick={() => onUserClick?.(user)}
                        className="flex-shrink-0 group relative"
                        title={user.name}
                    >
                        <Avatar
                            src={user.avatar}
                            alt={user.name}
                            name={user.name}
                            size="md"
                            status="online"
                        />

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            {user.name}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
});
