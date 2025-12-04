// MainLayout Component - Main layout wrapper

import type { ReactNode } from 'react';
import { Header } from './Header';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="h-screen flex flex-col">
            <Header />
            <main className="flex-1 overflow-hidden">{children}</main>
        </div>
    );
}
