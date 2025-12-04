// Header Component - Top navigation bar

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common/Button';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/utils/constants';

export function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN);
    };

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-primary-600">MessApp</h1>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-700">
                        {user?.name || user?.email}
                    </span>
                    <Button variant="ghost" onClick={handleLogout}>
                        Logout
                    </Button>
                </div>
            </div>
        </header>
    );
}
