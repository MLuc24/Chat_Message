import { useState, memo } from 'react';
import { SwatchIcon } from '@heroicons/react/24/outline';
import { ThemeSelector } from '../features/theme/ThemeSelector';

/**
 * ThemeButton Component
 * Button để mở theme selector modal
 * Style matches ChatCustomizeSection icons
 */
export const ThemeButton = memo(function ThemeButton() {
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsThemeSelectorOpen(true)}
        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        title="Đổi chủ đề"
        aria-label="Đổi chủ đề"
      >
        <SwatchIcon className="w-5 h-5 text-gray-600" />
      </button>

      <ThemeSelector 
        isOpen={isThemeSelectorOpen}
        onClose={() => setIsThemeSelectorOpen(false)}
      />
    </>
  );
});
