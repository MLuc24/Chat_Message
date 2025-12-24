// MessageReactions Component - Display reactions on a message

import { memo, useMemo } from 'react';
import type { MessageReaction } from '../../../types/chat.types';
import { useAuthStore } from '../../../stores/authStore';

interface MessageReactionsProps {
    reactions: MessageReaction[];
    onReactionClick?: (emoji: string) => void;
    isOwn?: boolean;
}

interface ReactionGroup {
    emoji: string;
    count: number;
    users: string[];
    hasReacted: boolean;
}

export const MessageReactions = memo(function MessageReactions({
    reactions,
    onReactionClick,
    isOwn = false
}: MessageReactionsProps) {
    const currentUserId = useAuthStore((state) => state.user?.id);

    // Group reactions by emoji
    const groupedReactions = useMemo(() => {
        const groups = new Map<string, ReactionGroup>();

        reactions.forEach((reaction) => {
            const existing = groups.get(reaction.emoji);
            if (existing) {
                existing.count++;
                existing.users.push(reaction.userId);
                if (reaction.userId === currentUserId) {
                    existing.hasReacted = true;
                }
            } else {
                groups.set(reaction.emoji, {
                    emoji: reaction.emoji,
                    count: 1,
                    users: [reaction.userId],
                    hasReacted: reaction.userId === currentUserId
                });
            }
        });

        return Array.from(groups.values());
    }, [reactions, currentUserId]);

    if (groupedReactions.length === 0) {
        return null;
    }

    return (
        <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {groupedReactions.map((group) => (
                <button
                    key={group.emoji}
                    onClick={() => onReactionClick?.(group.emoji)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all transform hover:scale-110 active:scale-100 ${
                        group.hasReacted
                            ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    title={`${group.count} ${group.count === 1 ? 'person' : 'people'} reacted`}
                >
                    <span className="text-base leading-none">{group.emoji}</span>
                    {group.count > 1 && (
                        <span className="font-semibold">{group.count}</span>
                    )}
                </button>
            ))}
        </div>
    );
});
