// User-related types matching backend API contracts

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}
