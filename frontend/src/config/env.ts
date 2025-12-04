// Environment configuration with type safety
export const config = {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
    wsUrl: import.meta.env.VITE_WS_URL || 'http://localhost:9000',
} as const;
