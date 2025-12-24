import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useNicknameStore } from '@/stores/nicknameStore';

interface NicknameContextType {
    nicknames: Record<string, string>;
    getDisplayName: (userId: string, realName: string) => string;
    reload: () => Promise<void>;
}

const NicknameContext = createContext<NicknameContextType | undefined>(undefined);

export function NicknameProvider({ 
    conversationId, 
    children 
}: { 
    conversationId: string; 
    children: ReactNode;
}) {
    const { nicknamesByConversation, loadNicknames, getDisplayName: getDisplayNameFromStore } = useNicknameStore();

    // Pre-load nicknames when conversation changes
    useEffect(() => {
        if (conversationId) {
            loadNicknames(conversationId);
        }
    }, [conversationId, loadNicknames]);

    const nicknames = nicknamesByConversation[conversationId] || {};

    const getDisplayName = (userId: string, realName: string) => {
        return getDisplayNameFromStore(conversationId, userId, realName);
    };

    const reload = async () => {
        await loadNicknames(conversationId);
    };

    return (
        <NicknameContext.Provider value={{ nicknames, getDisplayName, reload }}>
            {children}
        </NicknameContext.Provider>
    );
}

export function useNicknameContext() {
    const context = useContext(NicknameContext);
    if (!context) {
        throw new Error('useNicknameContext must be used within NicknameProvider');
    }
    return context;
}
