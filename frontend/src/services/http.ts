// Axios HTTP client with interceptors

import axios, { AxiosError } from 'axios';
import { config } from '@/config/env';

// Create axios instance
export const http = axios.create({
    baseURL: config.apiUrl,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Add auth token
http.interceptors.request.use(
    (config) => {
        // Get token from localStorage (will be managed by authStore later)
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: Handle errors
http.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && originalRequest) {
            // Try to refresh token
            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                const response = await axios.post(
                    `${config.apiUrl}/auth/refresh`,
                    { refreshToken }
                );

                const newToken = response.data.tokens?.accessToken || response.data.accessToken;
                localStorage.setItem('auth_token', newToken);

                // Retry original request with new token
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return http.request(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);
