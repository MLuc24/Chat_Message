import { useProfileStore } from '@/stores/profileStore';
import { useCallback, useEffect } from 'react';
import type { UpdateProfileDto, ChangePasswordDto } from '@/types/user.types';

/**
 * Custom hook for profile management
 * Provides convenient access to profile store with memoized callbacks
 */
export function useProfile() {
  const {
    profile,
    isLoading,
    isUploading,
    error,
    successMessage,
    fetchProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAvatar,
    clearError,
    clearSuccess,
  } = useProfileStore();

  /**
   * Memoized update profile handler
   */
  const handleUpdateProfile = useCallback(
    async (data: UpdateProfileDto) => {
      return await updateProfile(data);
    },
    [updateProfile]
  );

  /**
   * Memoized change password handler
   */
  const handleChangePassword = useCallback(
    async (data: ChangePasswordDto) => {
      return await changePassword(data);
    },
    [changePassword]
  );

  /**
   * Memoized upload avatar handler with file validation
   */
  const handleUploadAvatar = useCallback(
    async (file: File) => {
      // Client-side validation
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit');
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed');
      }

      return await uploadAvatar(file);
    },
    [uploadAvatar]
  );

  /**
   * Memoized delete avatar handler
   */
  const handleDeleteAvatar = useCallback(async () => {
    return await deleteAvatar();
  }, [deleteAvatar]);

  /**
   * Fetch profile on mount
   */
  useEffect(() => {
    if (!profile) {
      fetchProfile();
    }
  }, [profile, fetchProfile]);

  return {
    // State
    profile,
    isLoading,
    isUploading,
    error,
    successMessage,

    // Actions
    refreshProfile: fetchProfile,
    updateProfile: handleUpdateProfile,
    changePassword: handleChangePassword,
    uploadAvatar: handleUploadAvatar,
    deleteAvatar: handleDeleteAvatar,
    clearError,
    clearSuccess,
  };
}
