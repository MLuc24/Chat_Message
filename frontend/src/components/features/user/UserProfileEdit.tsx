import { memo, useState } from 'react';
import { Avatar } from '../../common/Avatar';
import { Input } from '../../common/Input';
import { Button } from '../../common/Button';
import type { User } from '../../../types/user.types';

interface UserProfileEditProps {
    user: User;
    onSave: (data: { name: string; avatar?: string }) => Promise<void>;
    onCancel: () => void;
}

export const UserProfileEdit = memo(function UserProfileEdit({
    user,
    onSave,
    onCancel,
}: UserProfileEditProps) {
    const [name, setName] = useState(user.name);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Name is required');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await onSave({ name: name.trim() });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>

            <form onSubmit={handleSubmit}>
                {/* Avatar Preview */}
                <div className="flex flex-col items-center mb-6">
                    <Avatar
                        src={user.avatar}
                        alt={name}
                        name={name}
                        size="xl"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                        Avatar upload coming soon
                    </p>
                </div>

                {/* Name Input */}
                <div className="mb-4">
                    <Input
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        required
                        error={error}
                    />
                </div>

                {/* Email (Read-only) */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <p className="text-gray-500 text-sm">{user.email}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isLoading}
                        className="flex-1"
                    >
                        Save Changes
                    </Button>
                </div>
            </form>
        </div>
    );
});
