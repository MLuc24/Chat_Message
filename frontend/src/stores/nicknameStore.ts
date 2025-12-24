import { create } from 'zustand';
import { chatService } from '@/services/api/chatService';

interface NicknameState {
    // Map: conversationId -> { targetUserId: nickname }
    nicknamesByConversation: Record<string, Record<string, string>>;
    loadingConversations: Set<string>;
    
    // Actions
    loadNicknames: (conversationId: string) => Promise<void>;
    setNickname: (conversationId: string, targetUserId: string, nickname: string) => Promise<void>;
    deleteNickname: (conversationId: string, targetUserId: string) => Promise<void>;
    getDisplayName: (conversationId: string, userId: string, realName: string) => string;
    clearCache: () => void;
}

export const useNicknameStore = create<NicknameState>((set, get) => ({
    nicknamesByConversation: {},
    loadingConversations: new Set(),

    loadNicknames: async (conversationId: string) => {
        const state = get();
        
        // Skip if already loaded or loading
        if (state.nicknamesByConversation[conversationId] || state.loadingConversations.has(conversationId)) {
            return;
        }

        // Mark as loading
        set((state) => ({
            loadingConversations: new Set(state.loadingConversations).add(conversationId),
        }));

        try {
            const nicknames = await chatService.getNicknames(conversationId);
            
            set((state) => {
                const newLoading = new Set(state.loadingConversations);
                newLoading.delete(conversationId);
                
                return {
                    nicknamesByConversation: {
                        ...state.nicknamesByConversation,
                        [conversationId]: nicknames,
                    },
                    loadingConversations: newLoading,
                };
            });
        } catch (error) {
            console.error('Failed to load nicknames:', error);
            
            // Remove from loading even on error
            set((state) => {
                const newLoading = new Set(state.loadingConversations);
                newLoading.delete(conversationId);
                return { loadingConversations: newLoading };
            });
        }
    },

    setNickname: async (conversationId: string, targetUserId: string, nickname: string) => {
        try {
            if (nickname.trim()) {
                await chatService.setNickname(conversationId, targetUserId, nickname);
            } else {
                await chatService.deleteNickname(conversationId, targetUserId);
            }

            // Update local cache
            set((state) => {
                const conversationNicknames = state.nicknamesByConversation[conversationId] || {};
                const updated = { ...conversationNicknames };
                
                if (nickname.trim()) {
                    updated[targetUserId] = nickname.trim();
                } else {
                    delete updated[targetUserId];
                }

                return {
                    nicknamesByConversation: {
                        ...state.nicknamesByConversation,
                        [conversationId]: updated,
                    },
                };
            });
        } catch (error) {
            console.error('Failed to set nickname:', error);
            throw error;
        }
    },

    deleteNickname: async (conversationId: string, targetUserId: string) => {
        try {
            await chatService.deleteNickname(conversationId, targetUserId);

            // Update local cache
            set((state) => {
                const conversationNicknames = state.nicknamesByConversation[conversationId] || {};
                const updated = { ...conversationNicknames };
                delete updated[targetUserId];

                return {
                    nicknamesByConversation: {
                        ...state.nicknamesByConversation,
                        [conversationId]: updated,
                    },
                };
            });
        } catch (error) {
            console.error('Failed to delete nickname:', error);
            throw error;
        }
    },

    getDisplayName: (conversationId: string, userId: string, realName: string) => {
        const state = get();
        const conversationNicknames = state.nicknamesByConversation[conversationId];
        
        if (!conversationNicknames) {
            return realName;
        }

        return conversationNicknames[userId] || realName;
    },

    clearCache: () => {
        set({ nicknamesByConversation: {}, loadingConversations: new Set() });
    },
}));
