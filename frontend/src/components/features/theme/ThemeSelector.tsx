import { useState, memo, useCallback } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { ThemePreview } from './ThemePreview';
import type { Theme } from '@/types/theme.types';

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ThemeSelector Modal Component
 * Modal để chọn theme cho chat bubbles, thiết kế giống ảnh mẫu
 */
export const ThemeSelector = memo(function ThemeSelector({ isOpen, onClose }: ThemeSelectorProps) {
  const { currentTheme, availableThemes, saveTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<Theme>(currentTheme);
  
  const handleSelectTheme = useCallback((theme: Theme) => {
    setSelectedTheme(theme);
  }, []);
  
  const handleConfirm = useCallback(async () => {
    if (selectedTheme) {
      await saveTheme(selectedTheme.id);
      onClose();
    }
  }, [selectedTheme, saveTheme, onClose]);
  
  const handleCancel = useCallback(() => {
    setSelectedTheme(currentTheme);
    onClose();
  }, [currentTheme, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex overflow-hidden">
        {/* Left Side - Theme List */}
        <div className="w-2/5 border-r border-gray-200 flex flex-col">
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Chủ đề</h3>
          </div>
          
          {/* Theme List */}
          <div className="flex-1 overflow-y-auto">
            {availableThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSelectTheme(theme)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 transition-all
                  hover:bg-gray-50 border-b border-gray-100 last:border-b-0
                  ${selectedTheme.id === theme.id 
                    ? 'bg-blue-50' 
                    : 'bg-white'
                  }
                `}
              >
                {/* Theme circle icon */}
                <div 
                  className="w-11 h-11 rounded-full flex-shrink-0 shadow-sm border-2 border-white ring-1 ring-gray-200"
                  style={{ 
                    background: theme.pattern?.value || theme.colors.bubbleOwnGradient || theme.colors.bubbleOwn,
                  }}
                />
                
                {/* Theme info */}
                <div className="flex-1 text-left min-w-0">
                  <div className={`
                    font-medium text-sm truncate
                    ${selectedTheme.id === theme.id ? 'text-blue-700' : 'text-gray-900'}
                  `}>
                    {theme.name}
                  </div>
                  {theme.description && (
                    <div className="text-xs text-gray-500 truncate mt-0.5">
                      {theme.description}
                    </div>
                  )}
                </div>
                
                {/* Selected indicator */}
                {selectedTheme.id === theme.id && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Right Side - Preview */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <h2 className="text-base font-semibold text-gray-900">
              Xem trước và chọn chủ đề
            </h2>
            <button
              onClick={handleCancel}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Preview Section */}
          <div className="flex-1 p-5 overflow-y-auto">
            <ThemePreview theme={selectedTheme} />
            
            {/* Theme details */}
            <div className="mt-4 px-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {selectedTheme.name}
              </h3>
              {selectedTheme.description && (
                <p className="text-sm text-gray-600">
                  {selectedTheme.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Footer Actions */}
          <div className="px-5 py-4 border-t border-gray-200 bg-white flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-sm shadow-sm"
            >
              Chọn
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
