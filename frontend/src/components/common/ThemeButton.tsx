import { useState, memo } from 'react';
import { Sparkles } from 'lucide-react';
import { ThemeSelector } from '../features/theme/ThemeSelector';
import { useTheme } from '@/hooks/useTheme';

/**
 * ThemeButton Component
 * Beautiful button to open theme selector modal with current theme preview
 */
export const ThemeButton = memo(function ThemeButton() {
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const { currentTheme } = useTheme();

  return (
    <>
      <button
        onClick={() => setIsThemeSelectorOpen(true)}
        className="relative group w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg overflow-hidden"
        style={{
          background: currentTheme.colors.bubbleOwnGradient || currentTheme.colors.bubbleOwn,
        }}
        title={`Đổi chủ đề (${currentTheme.name})`}
        aria-label="Đổi chủ đề"
      >
        {/* Animated gradient overlay */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(45deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
          }}
        />

        {/* Icon */}
        <Sparkles
          className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12"
          style={{ color: currentTheme.colors.bubbleOwnText }}
        />

        {/* Ripple effect on hover */}
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: currentTheme.colors.bubbleOwnGradient || currentTheme.colors.bubbleOwn,
              opacity: 0.3,
            }}
          />
        </div>
      </button>

      <ThemeSelector
        isOpen={isThemeSelectorOpen}
        onClose={() => setIsThemeSelectorOpen(false)}
      />
    </>
  );
});
