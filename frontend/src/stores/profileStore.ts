import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { profileService } from '@/services/api/profileService';
import { getErrorMessage } from '@/utils/errors';
import { useAuthStore } from './authStore';
import type { 
  UpdateProfileDto, 
  ChangePasswordDto, 
  ProfileResponse,
} from '@/types/user.types';

interface ProfileState {
  // State
  profile: ProfileResponse | null;
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  successMessage: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileDto) => Promise<boolean>;
  changePassword: (data: ChangePasswordDto) => Promise<boolean>;
  uploadAvatar: (file: File) => Promise<boolean>;
  deleteAvatar: () => Promise<boolean>;
  setProfile: (profile: ProfileResponse) => void;
  clearError: () => void;
  clearSuccess: () => void;
  reset: () => void;
}

const initialState = {
  profile: null,
  isLoading: false,
  isUploading: false,
  error: null,
  successMessage: null,
};

export const useProfileStore = create<ProfileState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      /**
       * Fetch current user profile
       */
      fetchProfile: async () => {
        set({ isLoading: true, error: null });
        try {
          const profile = await profileService.getCurrentProfile();
          set({ profile, isLoading: false });
        } catch (error: unknown) {
          set({ 
            error: getErrorMessage(error, 'Failed to fetch profile'),
            isLoading: false,
          });
        }
      },

      /**
       * Update profile information
       */
      updateProfile: async (data: UpdateProfileDto) => {
        set({ isLoading: true, error: null, successMessage: null });
        try {
          const updatedProfile = await profileService.updateProfile(data);
          set({ 
            profile: updatedProfile,
            isLoading: false,
            successMessage: 'Profile updated successfully',
          });
          return true;
        } catch (error: unknown) {
          set({ 
            error: getErrorMessage(error, 'Failed to update profile'),
            isLoading: false,
          });
          return false;
        }
      },

      /**
       * Change user password
       */
      changePassword: async (data: ChangePasswordDto) => {
        set({ isLoading: true, error: null, successMessage: null });
        try {
          await profileService.changePassword(data);
          set({ 
            isLoading: false,
            successMessage: 'Password changed successfully',
          });
          return true;
        } catch (error: unknown) {
          set({ 
            error: getErrorMessage(error, 'Failed to change password'),
            isLoading: false,
          });
          return false;
        }
      },

      /**
       * Upload avatar image
       */
      uploadAvatar: async (file: File) => {
        set({ isUploading: true, error: null, successMessage: null });
        try {
          const { avatarUrl } = await profileService.uploadAvatar(file);
          
          // Fetch fresh profile data from server to ensure consistency
          const updatedProfile = await profileService.getCurrentProfile();
          
          set({ 
            profile: updatedProfile,
            isUploading: false,
            successMessage: 'Avatar uploaded successfully',
          });

          // Update authStore user with new avatar
          const authUser = useAuthStore.getState().user;
          if (authUser) {
            const updatedUser = { 
              ...authUser, 
              avatarUrl: updatedProfile.avatarUrl,
            };
            useAuthStore.getState().setUser(updatedUser);
            
            // Also update localStorage to persist across page reloads
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }

          return true;
        } catch (error: unknown) {
          set({ 
            error: getErrorMessage(error, 'Failed to upload avatar'),
            isUploading: false,
          });
          return false;
        }
      },

      /**
       * Delete current avatar
       */
      deleteAvatar: async () => {
        set({ isUploading: true, error: null, successMessage: null });
        try {
          await profileService.deleteAvatar();
          
          // Remove avatar from profile
          const currentProfile = get().profile;
          if (currentProfile) {
            set({ 
              profile: { ...currentProfile, avatarUrl: undefined },
              isUploading: false,
              successMessage: 'Avatar removed successfully',
            });
          }

          // Update authStore user to remove avatar
          const authUser = useAuthStore.getState().user;
          if (authUser) {
            const updatedUser = { ...authUser, avatarUrl: undefined };
            useAuthStore.getState().setUser(updatedUser);
            
            // Also update localStorage
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }

          return true;
        } catch (error: unknown) {
          set({ 
            error: getErrorMessage(error, 'Failed to delete avatar'),
            isUploading: false,
          });
          return false;
        }
      },

      /**
       * Set profile directly (for external updates)
       */
      setProfile: (profile: ProfileResponse) => {
        set({ profile });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Clear success message
       */
      clearSuccess: () => {
        set({ successMessage: null });
      },

      /**
       * Reset store to initial state
       */
      reset: () => {
        set(initialState);
      },
    }),
    { name: 'ProfileStore' }
  )
);
