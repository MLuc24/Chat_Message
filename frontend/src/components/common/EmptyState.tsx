import { memo, type ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export const EmptyState = memo(function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    className = '',
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
            {icon && (
                <div className="mb-4 text-gray-400">
                    {icon}
                </div>
            )}

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {title}
            </h3>

            {description && (
                <p className="text-sm text-gray-500 mb-6 max-w-md">
                    {description}
                </p>
            )}

            {actionLabel && onAction && (
                <Button onClick={onAction} variant="primary">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
});
