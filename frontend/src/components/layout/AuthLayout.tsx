import { memo, type ReactNode } from 'react';

interface AuthLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
}

export const AuthLayout = memo(function AuthLayout({
    children,
    title,
    subtitle,
}: AuthLayoutProps) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                        <svg
                            className="w-8 h-8 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {title || 'Chat App'}
                    </h1>

                    {subtitle && (
                        <p className="text-gray-600">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Auth Card */}
                <div className="bg-white rounded-lg shadow-xl p-8">
                    {children}
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-600 mt-8">
                    &copy; 2024 Chat App. All rights reserved.
                </p>
            </div>
        </div>
    );
});
