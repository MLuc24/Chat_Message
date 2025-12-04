import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/common/EmptyState';

export const NotFoundPage = memo(function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <EmptyState
                icon={
                    <div className="text-9xl font-bold text-gray-300">404</div>
                }
                title="Page Not Found"
                description="The page you're looking for doesn't exist or has been moved."
                actionLabel="Go to Home"
                onAction={() => navigate('/chat')}
            />
        </div>
    );
});
