import { memo } from 'react';
import { Avatar } from '../../common/Avatar';
import { Button } from '../../common/Button';
import type { User } from '../../../types/user.types';

interface UserListItemProps {
    user: User;
    actionLabel?: string;
    onAction?: (userId: string) => void;
    showStatus?: boolean;
}

export const UserListItem = memo(function UserListItem({
    user,
    actionLabel = 'Message',
    onAction,
    showStatus = true,
}: UserListItemProps) {
    return (
        <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Avatar */}
                <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    name={user.name}
                    size="md"
                    status={showStatus && user.isOnline ? 'online' : undefined}
                />

                {/* User Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                        {user.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                        {user.email}
                    </p>
                </div>
            </div>

            {/* Action Button */}
            {onAction && (
                <Button
                    variant="primary"
                    onClick={() => onAction(user.id)}
                >
                    {actionLabel}
                </Button>
            )}
        </div>
    );
});
