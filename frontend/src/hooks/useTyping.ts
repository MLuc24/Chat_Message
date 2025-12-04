import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

interface TypingUser {
    userId: string;
    userName: string;
    conversationId: string;
}

interface UseTypingReturn {
    typingUsers: Map<string, TypingUser>;
    isUserTyping: (userId: string, conversationId: string) => boolean;
    startTyping: (conversationId: string) => void;
    stopTyping: (conversationId: string) => void;
}

const TYPING_TIMEOUT = 3000; // Stop typing indicator after 3 seconds of inactivity

export function useTyping(): UseTypingReturn {
    const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser>>(new Map());
    const { on, off, emit, isConnected } = useWebSocket();
    const typingTimerRef = useRef<number | null>(null);
    const isTypingRef = useRef(false);

    useEffect(() => {
        if (!isConnected) return;

        // Listen for typing events from other users
        const handleUserTyping = (data: TypingUser) => {
            setTypingUsers((prev) => {
                const newMap = new Map(prev);
                const key = `${data.userId}-${data.conversationId}`;
                newMap.set(key, data);

                // Auto-remove after timeout
                window.setTimeout(() => {
                    setTypingUsers((current) => {
                        const updatedMap = new Map(current);
                        updatedMap.delete(key);
                        return updatedMap;
                    });
                }, TYPING_TIMEOUT);

                return newMap;
            });
        };

        const handleUserStoppedTyping = (data: { userId: string; conversationId: string }) => {
            setTypingUsers((prev) => {
                const newMap = new Map(prev);
                const key = `${data.userId}-${data.conversationId}`;
                newMap.delete(key);
                return newMap;
            });
        };

        // Register event listeners
        on('user:typing', handleUserTyping);
        on('user:stopped_typing', handleUserStoppedTyping);

        // Cleanup
        return () => {
            off('user:typing', handleUserTyping);
            off('user:stopped_typing', handleUserStoppedTyping);

            if (typingTimerRef.current) {
                clearTimeout(typingTimerRef.current);
            }
        };
    }, [on, off, isConnected]);

    const startTyping = useCallback(
        (conversationId: string) => {
            if (!isConnected) return;

            // Only emit if not already typing
            if (!isTypingRef.current) {
                emit('typing', { conversationId });
                isTypingRef.current = true;
            }

            // Clear existing timer
            if (typingTimerRef.current) {
                clearTimeout(typingTimerRef.current);
            }

            // Set new timer to stop typing
            typingTimerRef.current = window.setTimeout(() => {
                stopTyping(conversationId);
            }, TYPING_TIMEOUT);
        },
        [emit, isConnected]
    );

    const stopTyping = useCallback(
        (conversationId: string) => {
            if (!isConnected) return;

            emit('stopped_typing', { conversationId });
            isTypingRef.current = false;

            if (typingTimerRef.current) {
                clearTimeout(typingTimerRef.current);
                typingTimerRef.current = null;
            }
        },
        [emit, isConnected]
    );

    const isUserTyping = useCallback(
        (userId: string, conversationId: string): boolean => {
            const key = `${userId}-${conversationId}`;
            return typingUsers.has(key);
        },
        [typingUsers]
    );

    return {
        typingUsers,
        isUserTyping,
        startTyping,
        stopTyping,
    };
}
