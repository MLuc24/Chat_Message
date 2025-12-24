// useDefaultEmoji - Hook to manage default emoji for conversations
import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/api/chatService';

interface UseDefaultEmojiReturn {
    defaultEmoji: string;
    isLoading: boolean;
    updateDefaultEmoji: (emoji: string) => Promise<void>;
}

export function useDefaultEmoji(conversationId: string): UseDefaultEmojiReturn {
    const [defaultEmoji, setDefaultEmoji] = useState<string>('👍');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Load default emoji from settings
    useEffect(() => {
        let isMounted = true;

        const loadDefaultEmoji = async () => {
            if (!conversationId) return;

            setIsLoading(true);
            try {
                const settings = await chatService.getConversationSettings(conversationId);
                if (isMounted) {
                    setDefaultEmoji(settings.defaultEmoji || '👍');
                }
            } catch (error) {
                console.error('Failed to load default emoji:', error);
                // Keep default value on error
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadDefaultEmoji();

        return () => {
            isMounted = false;
        };
    }, [conversationId]);

    // Update default emoji
    const updateDefaultEmoji = useCallback(async (emoji: string) => {
        if (!conversationId) {
            throw new Error('No conversation ID');
        }

        setIsLoading(true);
        try {
            await chatService.updateConversationSettings(conversationId, {
                defaultEmoji: emoji,
            });
            setDefaultEmoji(emoji);
        } catch (error) {
            console.error('Failed to update default emoji:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [conversationId]);

    return {
        defaultEmoji,
        isLoading,
        updateDefaultEmoji,
    };
}
