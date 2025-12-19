// User API Service

import { http } from '../http';
import type { User } from '@/types/user.types';
import { API_ENDPOINTS } from '@/utils/constants';

class UserService {
    async getProfile(userId: string): Promise<User> {
        const { data } = await http.get<User>(API_ENDPOINTS.USERS.PROFILE(userId));
        return data;
    }

    async updateProfile(updates: Partial<User>): Promise<User> {
        const { data } = await http.patch<User>(API_ENDPOINTS.USERS.UPDATE_PROFILE, updates);
        return data;
    }

    async searchUsers(query: string): Promise<User[]> {
        const { data } = await http.get<{ users: User[] }>(`${API_ENDPOINTS.USERS.SEARCH}?q=${query}`);
        // Backend returns { users: [...] }
        return data.users || [];
    }

    async getUsersByIds(userIds: string[]): Promise<User[]> {
        if (userIds.length === 0) return [];
        
        const { data } = await http.post<User[]>('/users/batch', { userIds });
        return data;
    }
}

export const userService = new UserService();
