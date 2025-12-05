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
    initAuth: () => void;
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

                        // Connect WebSocket
                        socketManager.connect(response.tokens.accessToken);
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

                        // Connect WebSocket
                        socketManager.connect(response.tokens.accessToken);
                    } catch (error: any) {
                        const errorMessage = error.response?.data?.message || 'Registration failed';
                        set({ error: errorMessage, isLoading: false });
                        throw error;
                    }
                },

                // Logout action
                logout: () => {
                    authService.logout();
                    socketManager.disconnect();
                    set({
                        user: null,
                        token: null,
                        refreshToken: null,
                        error: null,
                    });
                },

                // Set user
                setUser: (user) => set({ user }),

                // Clear error
                clearError: () => set({ error: null }),

                // Initialize auth from localStorage
                initAuth: () => {
                    const token = localStorage.getItem('auth_token');
                    const refreshToken = localStorage.getItem('refresh_token');
                    const userStr = localStorage.getItem('user');

                    if (token && userStr) {
                        try {
                            const user = JSON.parse(userStr);
                            set({ user, token, refreshToken });

                            // Reconnect WebSocket
                            socketManager.connect(token);
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
