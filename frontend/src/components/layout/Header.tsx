// Header Component - Top navigation bar

import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';
import { Avatar } from '@/components/common/Avatar';

export function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN);
    };

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between">
                {/* Logo with icon - clickable to go home */}
                <button
                    onClick={() => navigate(ROUTES.CHAT)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    title="Go to chat"
                >
                    <img 
                        src="/logo chat message.png" 
                        alt="MessApp Logo" 
                        className="w-9 h-9 rounded-lg object-cover"
                    />
                    <h1 className="text-lg font-bold text-slate-800">MessApp</h1>
                </button>

                {/* User profile */}
                <div className="flex items-center gap-3">
                    {/* Profile clickable section */}
                    <button
                        onClick={() => navigate(ROUTES.PROFILE)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        title="View profile"
                    >
                        <span className="text-sm font-medium text-gray-700">
                            {user?.name || user?.email}
                        </span>
                        <Avatar
                            src={user?.avatarUrl || user?.avatar}
                            alt={user?.name || 'User'}
                            name={user?.name || user?.email || 'User'}
                            size="sm"
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
