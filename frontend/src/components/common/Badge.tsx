import { memo, type ReactNode } from 'react';

interface BadgeProps {
    children?: ReactNode;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    size?: 'sm' | 'md';
    dot?: boolean;
    className?: string;
}

const variantClasses = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200',
};

const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
};

const dotVariantClasses = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    neutral: 'bg-gray-500',
};

export const Badge = memo(function Badge({
    children,
    variant = 'neutral',
    size = 'md',
    dot = false,
    className = '',
}: BadgeProps) {
    if (dot) {
        return (
            <span
                className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${dotVariantClasses[variant]} ${className}`}
                aria-label={variant}
            />
        );
    }

    return (
        <span
            className={`inline-flex items-center justify-center font-medium rounded-full border ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        >
            {children}
        </span>
    );
});
