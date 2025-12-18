// User-related types matching backend API contracts

export interface User {
    id: string;
    email: string;
    name: string;
    bio?: string;
    avatarUrl?: string; // Cloudinary URL
    avatarPublicId?: string; // Cloudinary public ID for deletion
    avatar?: string; // Legacy field for backward compatibility
    isOnline?: boolean;
    lastSeen?: Date | string | null;
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
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}
