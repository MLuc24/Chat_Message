import { memo, useState, useRef, useEffect, type ReactNode } from 'react';

interface DropdownProps {
    trigger: ReactNode;
    children: ReactNode;
    align?: 'left' | 'right';
    className?: string;
}

export const Dropdown = memo(function Dropdown({
    trigger,
    children,
    align = 'right',
    className = '',
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);

            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('keydown', handleEscape);
            };
        }
    }, [isOpen]);

    const alignmentClass = align === 'left' ? 'left-0' : 'right-0';

    return (
        <div ref={dropdownRef} className={`relative inline-block ${className}`}>
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>

            {isOpen && (
                <div
                    className={`absolute ${alignmentClass} mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-scale-in origin-top-${align}`}
                    role="menu"
                    aria-orientation="vertical"
                >
                    {children}
                </div>
            )}
        </div>
    );
});

interface DropdownItemProps {
    icon?: ReactNode;
    children: ReactNode;
    onClick?: () => void;
    variant?: 'default' | 'danger';
    className?: string;
}

export const DropdownItem = memo(function DropdownItem({
    icon,
    children,
    onClick,
    variant = 'default',
    className = '',
}: DropdownItemProps) {
    const variantClasses = {
        default: 'text-gray-700 hover:bg-gray-100',
        danger: 'text-red-600 hover:bg-red-50',
    };

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${variantClasses[variant]} ${className}`}
            role="menuitem"
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            <span>{children}</span>
        </button>
    );
});

export const DropdownDivider = memo(function DropdownDivider() {
    return <div className="my-1 border-t border-gray-200" role="separator" />;
});
