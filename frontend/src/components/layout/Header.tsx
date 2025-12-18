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
                {/* Logo with icon */}
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 bg-slate-700 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                        </svg>
                    </div>
                    <h1 className="text-lg font-bold text-slate-800">MessApp</h1>
                </div>

                {/* User profile */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                        {user?.name || user?.email}
                    </span>
                    <Avatar
                        src={user?.avatar}
                        alt={user?.name || 'User'}
                        name={user?.name || user?.email || 'User'}
                        size="sm"
                    />
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
