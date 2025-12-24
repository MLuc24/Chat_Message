import { useCallback } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { themeService } from '@/services/api/themeService';
import { useAuthStore } from '@/stores/authStore';
import type { Theme } from '@/types/theme.types';
import { PREDEFINED_THEMES } from '@/utils/themeConstants';

/**
 * Custom hook for theme management
 * 
 * @example
 * const { currentTheme, availableThemes, changeTheme, saveTheme } = useTheme();
 */
export function useTheme() {
  const { currentTheme, isLoading, error, setTheme, applyTheme, resetTheme, clearError } = useThemeStore();
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = !!token;
  
  /**
   * Get all available themes
   */
  const availableThemes = PREDEFINED_THEMES;
  
  /**
   * Change theme (only applies locally, doesn't save to server)
   */
  const changeTheme = useCallback((themeId: string) => {
    setTheme(themeId);
  }, [setTheme]);
  
  /**
   * Change and save theme preference to server
   */
  const saveTheme = useCallback(async (themeId: string) => {
    if (!isAuthenticated) {
      // If not authenticated, only apply locally
      setTheme(themeId);
      return;
    }
    
    try {
      // Apply theme immediately for better UX
      setTheme(themeId);
      
      // Save to server
      await themeService.saveThemePreference({ themeId });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
      // Theme is already applied, just log the error
    }
  }, [isAuthenticated, setTheme]);
  
  /**
   * Load user's saved theme preference from server
   */
  const loadUserTheme = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const preference = await themeService.getUserThemePreference();
      
      if (preference?.themeId) {
        setTheme(preference.themeId);
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  }, [isAuthenticated, setTheme]);
  
  /**
   * Reset to default theme
   */
  const resetToDefault = useCallback(async () => {
    resetTheme();
    
    if (isAuthenticated) {
      try {
        await themeService.deleteThemePreference();
      } catch (error) {
        console.error('Failed to delete theme preference:', error);
      }
    }
  }, [isAuthenticated, resetTheme]);
  
  /**
   * Preview a theme temporarily (without saving)
   */
  const previewTheme = useCallback((theme: Theme) => {
    applyTheme(theme);
  }, [applyTheme]);
  
  return {
    // State
    currentTheme,
    availableThemes,
    isLoading,
    error,
    
    // Actions
    changeTheme,
    saveTheme,
    resetToDefault,
    previewTheme,
    loadUserTheme,
    clearError,
  };
}
