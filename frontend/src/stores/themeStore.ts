import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Theme } from '@/types/theme.types';
import { getDefaultTheme, getThemeById } from '@/utils/themeConstants';

interface ThemeState {
  // State
  currentTheme: Theme;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setTheme: (themeId: string) => void;
  applyTheme: (theme: Theme) => void;
  resetTheme: () => void;
  clearError: () => void;
}

/**
 * Apply theme colors to CSS variables - Comprehensive theme application
 * Theme áp dụng toàn diện cho chat window
 */
const applyThemeToDocument = (theme: Theme): void => {
  const root = document.documentElement;
  const { colors } = theme;
  
  // Apply chat bubble theme colors as CSS variables
  root.style.setProperty('--chat-bubble-own', colors.bubbleOwn);
  root.style.setProperty('--chat-bubble-own-text', colors.bubbleOwnText);
  root.style.setProperty('--chat-bubble-own-gradient', colors.bubbleOwnGradient || colors.bubbleOwn);
  
  root.style.setProperty('--chat-bubble-other', colors.bubbleOther);
  root.style.setProperty('--chat-bubble-other-text', colors.bubbleOtherText);
  root.style.setProperty('--chat-bubble-other-gradient', colors.bubbleOtherGradient || colors.bubbleOther);
  
  root.style.setProperty('--chat-background', colors.chatBackground || '#ffffff');
  root.style.setProperty('--chat-background-gradient', colors.chatBackgroundGradient || colors.chatBackground || '#ffffff');
  
  // Apply UI element colors
  root.style.setProperty('--chat-icon-primary', colors.iconPrimary || colors.bubbleOwn);
  root.style.setProperty('--chat-icon-secondary', colors.iconSecondary || '#65676b');
  root.style.setProperty('--chat-icon-hover', colors.iconHover || colors.bubbleOwn);
  root.style.setProperty('--chat-button-bg', colors.buttonBackground || colors.bubbleOwn);
  root.style.setProperty('--chat-button-text', colors.buttonText || '#ffffff');
  root.style.setProperty('--chat-input-bg', colors.inputBackground || '#f0f2f5');
  root.style.setProperty('--chat-input-border', colors.inputBorder || '#e4e6eb');
  root.style.setProperty('--chat-header-bg', colors.headerBackground || '#ffffff');
  root.style.setProperty('--chat-header-text', colors.headerText || '#050505');
  
  // Store theme pattern info
  if (theme.pattern) {
    root.style.setProperty('--chat-theme-pattern', theme.pattern.value);
  }
  
  if (theme.backgroundImage) {
    root.style.setProperty('--chat-background-image', `url(${theme.backgroundImage})`);
  }
};

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        currentTheme: getDefaultTheme(),
        isLoading: false,
        error: null,
        
        // Set theme by ID
        setTheme: (themeId: string) => {
          const theme = getThemeById(themeId);
          
          if (!theme) {
            set({ error: `Theme "${themeId}" not found` });
            return;
          }
          
          set({ currentTheme: theme, error: null });
          applyThemeToDocument(theme);
        },
        
        // Apply theme object directly
        applyTheme: (theme: Theme) => {
          set({ currentTheme: theme, error: null });
          applyThemeToDocument(theme);
        },
        
        // Reset to default theme
        resetTheme: () => {
          const defaultTheme = getDefaultTheme();
          set({ currentTheme: defaultTheme, error: null });
          applyThemeToDocument(defaultTheme);
        },
        
        // Clear error
        clearError: () => set({ error: null }),
      }),
      {
        name: 'theme-storage',
        partialize: (state) => ({
          currentTheme: state.currentTheme,
        }),
        onRehydrateStorage: () => (state) => {
          // Apply theme on app load
          if (state?.currentTheme) {
            applyThemeToDocument(state.currentTheme);
          }
        },
      },
    ),
    { name: 'ThemeStore' },
  ),
);
