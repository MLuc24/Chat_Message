import { memo, useState, useEffect } from 'react';
import { UserListItem } from './UserListItem';
import { Input } from '../../common/Input';
import { EmptyState } from '../../common/EmptyState';
import { Spinner } from '../../common/Spinner';
import type { User } from '../../../types/user.types';

interface UserSearchProps {
    onSelectUser: (user: User) => void;
    searchUsers: (query: string) => Promise<User[]>;
}

export const UserSearch = memo(function UserSearch({
    onSelectUser,
    searchUsers,
}: UserSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const users = await searchUsers(query.trim());
                setResults(users);
                setHasSearched(true);
            } catch (error) {
                console.error('Search failed:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300); // Debounce 300ms

        return () => clearTimeout(timer);
    }, [query, searchUsers]);

    return (
        <div className="bg-white rounded-lg shadow-md max-w-2xl mx-auto">
            {/* Search Input */}
            <div className="p-4 border-b border-gray-200">
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <Input
                        type="search"
                        placeholder="Search users by name or email..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Spinner size="md" />
                    </div>
                ) : hasSearched && results.length === 0 ? (
                    <EmptyState
                        icon={
                            <svg
                                className="w-16 h-16"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                        }
                        title="No users found"
                        description="Try a different search term"
                    />
                ) : !hasSearched ? (
                    <EmptyState
                        icon={
                            <svg
                                className="w-16 h-16"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        }
                        title="Search for users"
                        description="Start typing to find people to chat with"
                    />
                ) : (
                    <div className="divide-y divide-gray-200">
                        {results.map((user) => (
                            <UserListItem
                                key={user.id}
                                user={user}
                                actionLabel="Start Chat"
                                onAction={() => onSelectUser(user)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});
