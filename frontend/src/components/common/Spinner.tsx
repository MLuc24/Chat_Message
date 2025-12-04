import { memo } from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    overlay?: boolean;
}

const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
};

export const Spinner = memo(function Spinner({
    size = 'md',
    className = '',
    overlay = false,
}: SpinnerProps) {
    const spinner = (
        <div
            className={`${sizeClasses[size]} border-blue-200 border-t-blue-600 rounded-full animate-spin ${className}`}
            role="status"
            aria-label="Loading"
        >
            <span className="sr-only">Loading...</span>
        </div>
    );

    if (overlay) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 shadow-xl">
                    {spinner}
                </div>
            </div>
        );
    }

    return spinner;
});
