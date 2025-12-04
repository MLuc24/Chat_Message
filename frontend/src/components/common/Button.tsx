// Button Component - Reusable button with variants

import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    children: ReactNode;
    isLoading?: boolean;
}

export function Button({
    variant = 'primary',
    children,
    isLoading,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
        secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
        danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
    };

    return (
        <button
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading...
                </div>
            ) : (
                children
            )}
        </button>
    );
}
