import { useCallback } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { themeService } from '@/services/api/themeService';
import { chatService } from '@/services/api/chatService';
import { useAuthStore } from '@/stores/authStore';
import type { Theme } from '@/types/theme.types';
import { PREDEFINED_THEMES } from '@/utils/themeConstants';

/**
 * Custom hook for theme management
 * 
 * @example
 * const { currentTheme, availableThemes, changeTheme, saveTheme, saveConversationTheme } = useTheme();
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
   * Change and save theme preference to server (user-level)
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
      // Theme is already applied, just log the error
    }
  }, [isAuthenticated, setTheme]);
  
  /**
   * Save theme for a specific conversation (conversation-level)
   */
  const saveConversationTheme = useCallback(async (conversationId: string, themeId: string) => {
    if (!isAuthenticated) {
      setTheme(themeId);
      return;
    }
    
    try {
      // Apply theme immediately for better UX
      setTheme(themeId);
      
      // Save to conversation
      await chatService.updateConversation(conversationId, { themeId });
    } catch (error) {
      throw error;
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
      // Silently fail
    }
  }, [isAuthenticated, setTheme]);
  
  /**
   * Load theme for a specific conversation
   */
  const loadConversationTheme = useCallback((themeId?: string) => {
    if (themeId) {
      setTheme(themeId);
    }
  }, [setTheme]);
  
  /**
   * Reset to default theme
   */
  const resetToDefault = useCallback(async () => {
    resetTheme();
    
    if (isAuthenticated) {
      try {
        await themeService.deleteThemePreference();
      } catch (error) {
        // Silently fail
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
    saveConversationTheme,
    loadConversationTheme,
    resetToDefault,
    previewTheme,
    loadUserTheme,
    clearError,
  };
}
