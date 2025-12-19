import { http } from '../http';
import type { 
  UpdateProfileDto, 
  ChangePasswordDto, 
  ProfileResponse,
  AvatarUploadResponse,
} from '@/types/user.types';

/**
 * Profile Service
 * Handles all profile-related API calls
 */
class ProfileService {
  private readonly basePath = '/users';

  /**
   * Get current user profile
   */
  async getCurrentProfile(): Promise<ProfileResponse> {
    const { data } = await http.get(`${this.basePath}/profile/me`);
    return data;
  }

  /**
   * Update user profile (name, bio, email)
   */
  async updateProfile(updateDto: UpdateProfileDto): Promise<ProfileResponse> {
    const { data } = await http.put(`${this.basePath}/profile/edit`, updateDto);
    return data;
  }

  /**
   * Change user password
   */
  async changePassword(changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const { data } = await http.put(`${this.basePath}/profile/password`, changePasswordDto);
    return data;
  }

  /**
   * Upload user avatar (multipart/form-data)
   */
  async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await http.post(`${this.basePath}/profile/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  }

  /**
   * Delete user avatar
   */
  async deleteAvatar(): Promise<{ message: string }> {
    const { data } = await http.delete(`${this.basePath}/profile/avatar`);
    return data;
  }
}

export const profileService = new ProfileService();
