import { memo } from 'react';

interface AvatarProps {
    src?: string;
    alt: string;
    name?: string; // Fallback initials
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    status?: 'online' | 'offline' | 'busy' | 'away';
    className?: string;
}

const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
};

const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-yellow-500',
};

const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
};

function getInitials(name: string): string {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

export const Avatar = memo(function Avatar({
    src,
    alt,
    name,
    size = 'md',
    status,
    className = '',
}: AvatarProps) {
    const sizeClass = sizeClasses[size];
    const statusSize = statusSizes[size];

    return (
        <div className={`relative inline-block ${className}`}>
            <div
                className={`${sizeClass} rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center font-semibold text-white`}
            >
                {src ? (
                    <img
                        src={src}
                        alt={alt}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Fallback to initials if image fails to load
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                ) : name ? (
                    <span>{getInitials(name)}</span>
                ) : (
                    <svg
                        className="w-full h-full text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                )}
            </div>

            {status && (
                <span
                    className={`absolute bottom-0 right-0 ${statusSize} ${statusColors[status]} border-2 border-white rounded-full`}
                    aria-label={`Status: ${status}`}
                />
            )}
        </div>
    );
});
