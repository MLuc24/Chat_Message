// useDefaultEmoji - Hook to manage default emoji for conversations
import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/api/chatService';

interface UseDefaultEmojiReturn {
    defaultEmoji: string;
    isLoading: boolean;
    updateDefaultEmoji: (emoji: string) => Promise<void>;
    reloadDefaultEmoji: () => Promise<void>;
}

export function useDefaultEmoji(conversationId: string): UseDefaultEmojiReturn {
    const [defaultEmoji, setDefaultEmoji] = useState<string>('👍');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Load default emoji from settings
    const loadDefaultEmoji = useCallback(async () => {
        if (!conversationId) return;

        setIsLoading(true);
        try {
            const settings = await chatService.getConversationSettings(conversationId);
            setDefaultEmoji(settings.defaultEmoji || '👍');
        } catch (error) {
            console.error('Failed to load default emoji:', error);
            // Keep default value on error
        } finally {
            setIsLoading(false);
        }
    }, [conversationId]);

    useEffect(() => {
        loadDefaultEmoji();
        
        // Listen for emoji updates from other components
        const handleEmojiUpdate = (event: CustomEvent) => {
            if (event.detail.conversationId === conversationId) {
                setDefaultEmoji(event.detail.emoji);
            }
        };
        
        window.addEventListener('defaultEmojiUpdated', handleEmojiUpdate as EventListener);
        
        return () => {
            window.removeEventListener('defaultEmojiUpdated', handleEmojiUpdate as EventListener);
        };
    }, [loadDefaultEmoji, conversationId]);

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
            
            // Broadcast emoji update event for realtime sync
            window.dispatchEvent(new CustomEvent('defaultEmojiUpdated', {
                detail: { conversationId, emoji }
            }));
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
        reloadDefaultEmoji: loadDefaultEmoji,
    };
}
