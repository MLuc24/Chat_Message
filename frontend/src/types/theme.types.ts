/**
 * Theme type definitions - Comprehensive Chat Theme
 */

export interface Theme {
  id: string;
  name: string;
  description?: string;
  colors: ChatThemeColors;
  pattern?: {
    type: 'gradient' | 'solid' | 'image' | 'pattern';
    value: string;
  };
  backgroundImage?: string;
}

export interface ChatThemeColors {
  // Chat bubble colors - own messages
  bubbleOwn: string;
  bubbleOwnText: string;
  bubbleOwnGradient?: string;
  
  // Chat bubble colors - other messages  
  bubbleOther: string;
  bubbleOtherText: string;
  bubbleOtherGradient?: string;
  
  // Chat background
  chatBackground?: string;
  chatBackgroundGradient?: string;
  
  // UI Elements - Icons and buttons
  iconPrimary?: string;        // Primary icons (send, call, video)
  iconSecondary?: string;      // Secondary icons (emoji, attach, etc)
  iconHover?: string;          // Icon hover state
  buttonBackground?: string;   // Button background
  buttonText?: string;         // Button text color
  inputBackground?: string;    // Input field background
  inputBorder?: string;        // Input field border
  headerBackground?: string;   // Chat header background
  headerText?: string;         // Chat header text
}

export interface ThemePreference {
  userId: string;
  themeId: string;
  appliedAt: Date;
}

export type ThemeMode = 'light' | 'dark' | 'auto';
