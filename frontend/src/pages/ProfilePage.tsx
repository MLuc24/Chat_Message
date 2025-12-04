import { memo, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { UserProfile } from '../components/features/user/UserProfile';
import { UserProfileEdit } from '../components/features/user/UserProfileEdit';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/common/Spinner';

export const ProfilePage = memo(function ProfilePage() {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = async (data: { name: string; avatar?: string }) => {
        // TODO: Implement profile update API call
        console.log('Saving profile:', data);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsEditing(false);
    };

    if (!user) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-full">
                    <Spinner size="lg" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto py-8 px-4">
                {isEditing ? (
                    <UserProfileEdit
                        user={user}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}
                    />
                ) : (
                    <UserProfile
                        user={user}
                        onEdit={() => setIsEditing(true)}
                        isOwnProfile
                    />
                )}
            </div>
        </MainLayout>
    );
});
