// Authentication Store - Zustand

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService } from '@/services/api/authService';
import { socketManager } from '@/services/websocket/socketManager';
import type { User, LoginCredentials, RegisterData } from '@/types/user.types';

interface AuthState {
    // State
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    setUser: (user: User) => void;
    clearError: () => void;
    initAuth: () => Promise<void>;
    refreshUserProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                user: null,
                token: null,
                refreshToken: null,
                isLoading: false,
                error: null,

                // Login action
                login: async (credentials) => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await authService.login(credentials);

                        // Save to localStorage
                        localStorage.setItem('auth_token', response.tokens.accessToken);
                        localStorage.setItem('refresh_token', response.tokens.refreshToken);

                        set({
                            user: response.user,
                            token: response.tokens.accessToken,
                            refreshToken: response.tokens.refreshToken,
                            isLoading: false,
                        });

                        // WebSocket will be connected by useWebSocket hook
                    } catch (error: any) {
                        const errorMessage = error.response?.data?.message || 'Login failed';
                        set({ error: errorMessage, isLoading: false });
                        throw error;
                    }
                },

                // Register action
                register: async (data) => {
                    set({ isLoading: true, error: null });
                    try {
                        const response = await authService.register(data);

                        // Save to localStorage
                        localStorage.setItem('auth_token', response.tokens.accessToken);
                        localStorage.setItem('refresh_token', response.tokens.refreshToken);

                        set({
                            user: response.user,
                            token: response.tokens.accessToken,
                            refreshToken: response.tokens.refreshToken,
                            isLoading: false,
                        });

                        // WebSocket will be connected by useWebSocket hook
                    } catch (error: any) {
                        const errorMessage = error.response?.data?.message || 'Registration failed';
                        set({ error: errorMessage, isLoading: false });
                        throw error;
                    }
                },

                // Logout action
                logout: () => {
                    // Prevent multiple logout calls
                    const currentToken = get().token;
                    if (!currentToken) {
                        console.warn('[authStore] Already logged out');
                        return;
                    }

                    console.log('[authStore] Logging out...');
                    
                    authService.logout();
                    socketManager.disconnect();
                    
                    // Clear all auth data
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');
                    
                    set({
                        user: null,
                        token: null,
                        refreshToken: null,
                        error: null,
                    });

                    // Navigate to login without reload
                    if (window.location.pathname !== '/login') {
                        window.history.pushState({}, '', '/login');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                },

                // Set user
                setUser: (user) => set({ user }),

                // Clear error
                clearError: () => set({ error: null }),

                // Refresh user profile from server
                refreshUserProfile: async () => {
                    const currentUser = get().user;
                    if (!currentUser?.id) return;

                    try {
                        const { userService } = await import('@/services/api/userService');
                        const updatedUser = await userService.getProfile(currentUser.id);
                        set({ user: updatedUser });
                        localStorage.setItem('user', JSON.stringify(updatedUser));
                    } catch (error) {
                        console.error('Failed to refresh user profile:', error);
                    }
                },

                // Initialize auth from localStorage
                initAuth: async () => {
                    const token = localStorage.getItem('auth_token');
                    const refreshToken = localStorage.getItem('refresh_token');
                    const userStr = localStorage.getItem('user');

                    if (token && userStr) {
                        try {
                            const user = JSON.parse(userStr);
                            set({ user, token, refreshToken });

                            // Fetch fresh user data from server to get latest avatarUrl
                            get().refreshUserProfile();

                            // WebSocket will be connected by useWebSocket hook
                        } catch (error) {
                            console.error('Failed to initialize auth:', error);
                            get().logout();
                        }
                    }
                },
            }),
            {
                name: 'auth-storage',
                partialize: (state) => ({
                    user: state.user,
                    token: state.token,
                    refreshToken: state.refreshToken,
                }),
            }
        )
    )
);
