// useAuth Hook - Convenience wrapper for auth store

import { useAuthStore } from '@/stores/authStore';
import { useCallback } from 'react';
import type { LoginCredentials, RegisterData } from '@/types/user.types';

export function useAuth() {
    const { user, token, isLoading, error, login, register, logout, clearError } = useAuthStore();

    const isAuthenticated = !!token;

    const handleLogin = useCallback(
        async (credentials: LoginCredentials) => {
            try {
                await login(credentials);
                return true;
            } catch (error) {
                return false;
            }
        },
        [login]
    );

    const handleRegister = useCallback(
        async (data: RegisterData) => {
            try {
                await register(data);
                return true;
            } catch (error) {
                return false;
            }
        },
        [register]
    );

    return {
        user,
        isAuthenticated,
        isLoading,
        error,
        login: handleLogin,
        register: handleRegister,
        logout,
        clearError,
    };
}
