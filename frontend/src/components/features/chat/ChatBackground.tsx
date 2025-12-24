// ChatBackground Component - Themed background for chat window
// Handles gradient, solid colors, and background images based on theme

import { memo } from 'react';
import { useThemeStore } from '@/stores/themeStore';

interface ChatBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const ChatBackground = memo(function ChatBackground({ 
  children, 
  className = '' 
}: ChatBackgroundProps) {
  const { currentTheme } = useThemeStore();
  const { colors, backgroundImage } = currentTheme;

  // Determine background style based on theme
  const getBackgroundStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};

    // Priority 1: Background image (if exists)
    if (backgroundImage) {
      style.backgroundImage = `url(${backgroundImage})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
      style.backgroundRepeat = 'no-repeat';
      style.backgroundAttachment = 'fixed';
      
      // Add overlay for better text readability
      return {
        position: 'relative',
        ...style,
      };
    }

    // Priority 2: Gradient background
    if (colors.chatBackgroundGradient) {
      style.background = colors.chatBackgroundGradient;
      return style;
    }

    // Priority 3: Solid color background
    if (colors.chatBackground) {
      style.backgroundColor = colors.chatBackground;
      return style;
    }

    // Fallback: Default white background
    style.backgroundColor = '#ffffff';
    return style;
  };

  const backgroundStyle = getBackgroundStyle();
  const hasBackgroundImage = !!backgroundImage;

  return (
    <div 
      className={`relative ${className}`}
      style={backgroundStyle}
    >
      {/* Overlay for background images to improve readability */}
      {hasBackgroundImage && (
        <div 
          className="absolute inset-0 bg-white/70 backdrop-blur-[2px]"
          style={{ zIndex: 0 }}
        />
      )}
      
      {/* Content */}
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
});
