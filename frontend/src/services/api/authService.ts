// Authentication API Service

import { http } from '../http';
import type { LoginCredentials, RegisterData, AuthResponse } from '@/types/user.types';
import { API_ENDPOINTS } from '@/utils/constants';

class AuthService {
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const { data } = await http.post<any>(API_ENDPOINTS.AUTH.LOGIN, credentials);
        // Handle both direct response and wrapped response
        return data.data || data;
    }

    async register(registerData: RegisterData): Promise<AuthResponse> {
        const { data } = await http.post<any>(API_ENDPOINTS.AUTH.REGISTER, registerData);
        // Handle both direct response and wrapped response
        return data.data || data;
    }

    async refreshToken(refreshToken: string): Promise<string> {
        const { data } = await http.post<{ tokens: { accessToken: string; refreshToken: string } }>(
            API_ENDPOINTS.AUTH.REFRESH,
            { refreshToken }
        );
        return data.tokens.accessToken;
    }

    logout(): void {
        // Clear local storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
    }
}

export const authService = new AuthService();
