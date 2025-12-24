import { useState, useEffect, useCallback } from 'react';
import { chatService } from '@/services/api/chatService';

export function useNicknames(conversationId: string) {
    const [nicknames, setNicknames] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const loadNicknames = useCallback(async () => {
        if (!conversationId) return;
        
        setIsLoading(true);
        try {
            const data = await chatService.getNicknames(conversationId);
            setNicknames(data);
        } catch (error) {
            console.error('Failed to load nicknames:', error);
        } finally {
            setIsLoading(false);
        }
    }, [conversationId]);

    useEffect(() => {
        loadNicknames();
    }, [loadNicknames]);

    const getDisplayName = useCallback((userId: string, realName: string) => {
        return nicknames[userId] || realName;
    }, [nicknames]);

    return {
        nicknames,
        isLoading,
        getDisplayName,
        reload: loadNicknames,
    };
}
