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

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let hasLoggedOut = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const handleLogout = () => {
    if (hasLoggedOut) {
        return; // Already logged out, prevent multiple logout attempts
    }
    hasLoggedOut = true;

    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth-storage');

    // Use history navigation instead of window.location to prevent reload loop
    if (window.location.pathname !== '/login') {
        console.error('Session expired, redirecting to login...');
        // Dispatch custom event for auth store to handle
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    // Reset flag after a delay
    setTimeout(() => {
        hasLoggedOut = false;
    }, 2000);
};

// Response interceptor: Handle errors
http.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            // Mark this request as retried to prevent infinite loops
            originalRequest._retry = true;

            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return http.request(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            isRefreshing = true;

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

                // Update default header
                http.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                // Process queued requests
                processQueue(null, newToken);
                isRefreshing = false;

                // Retry original request with new token
                return http.request(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear tokens and logout
                processQueue(refreshError, null);
                isRefreshing = false;

                handleLogout();

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);
