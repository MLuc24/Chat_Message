// Sidebar Component - Sidebar for conversations

import type { ReactNode } from 'react';

interface SidebarProps {
    children: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
    return (
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
        </aside>
    );
}
