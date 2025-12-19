// Header Component - Top navigation bar

import { useAuth } from '@/hooks/useAuth';
import { useProfileStore } from '@/stores/profileStore';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import { Avatar } from '@/components/common/Avatar';

export function Header() {
    const { user, logout } = useAuth();
    const { profile } = useProfileStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN);
    };

    // Use profile avatar if available (most up-to-date), fallback to user avatar
    const avatarUrl = profile?.avatarUrl || user?.avatarUrl;
    const displayName = profile?.name || user?.name || user?.email;

    return (
        <header className="bg-white border-b border-gray-200 px-6">
            <div className="flex items-center justify-between h-20">
                {/* Logo - clickable to go home */}
                <button
                    onClick={() => navigate(ROUTES.CHAT)}
                    className="hover:opacity-80 transition-opacity h-full flex items-center"
                    title="Go to chat"
                >
                    <img 
                        src="/logo chat message.png" 
                        alt="Logo" 
                        className="h-full w-auto object-contain"
                    />
                </button>

                {/* User profile */}
                <div className="flex items-center gap-3">
                    {/* Profile clickable section */}
                    <button
                        onClick={() => navigate(ROUTES.PROFILE)}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        title="View profile"
                    >
                        <span className="text-sm font-medium text-gray-700">
                            {displayName}
                        </span>
                        <Avatar
                            src={avatarUrl}
                            alt={displayName || 'User'}
                            name={displayName || 'User'}
                            size="md"
                        />
                    </button>

                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}
