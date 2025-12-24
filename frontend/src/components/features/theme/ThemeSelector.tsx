import { useState, memo, useCallback, useMemo } from 'react';
import { X, Search, Sparkles } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { ThemePreview } from './ThemePreview';
import type { Theme } from '@/types/theme.types';

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

// Theme categories for better organization
const THEME_CATEGORIES = {
  professional: { name: 'Professional', icon: '💼', color: 'blue' },
  vibrant: { name: 'Vibrant', icon: '🌈', color: 'purple' },
  nature: { name: 'Nature', icon: '🌿', color: 'green' },
  artistic: { name: 'Artistic', icon: '🎨', color: 'pink' },
  all: { name: 'All Themes', icon: '✨', color: 'gray' },
} as const;

type CategoryKey = keyof typeof THEME_CATEGORIES;

// Helper function to categorize themes
const categorizeTheme = (themeId: string): CategoryKey => {
  const categoryMap: Record<string, CategoryKey> = {
    'default': 'professional',
    'relax': 'professional',
    'superhero': 'vibrant',
    'karol-g': 'vibrant',
    'kpop': 'vibrant',
    'hello-2026': 'vibrant',
    'summer': 'nature',
    'wicked': 'nature',
    'shape-friends': 'nature',
    'heart-drive': 'artistic',
    'autumn': 'artistic',
    'avatar': 'artistic',
    'the-cool-crew': 'nature',
  };
  return categoryMap[themeId] || 'all';
};

/**
 * ThemeSelector Modal Component
 * Modern, beautiful modal for selecting chat themes
 */
export const ThemeSelector = memo(function ThemeSelector({ isOpen, onClose }: ThemeSelectorProps) {
  const { currentTheme, availableThemes, saveTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<Theme>(currentTheme);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [isApplying, setIsApplying] = useState(false);

  const handleSelectTheme = useCallback((theme: Theme) => {
    setSelectedTheme(theme);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (selectedTheme) {
      setIsApplying(true);
      try {
        await saveTheme(selectedTheme.id);
        setTimeout(() => {
          setIsApplying(false);
          onClose();
        }, 300); // Small delay for visual feedback
      } catch (error) {
        setIsApplying(false);
        console.error('Failed to save theme:', error);
      }
    }
  }, [selectedTheme, saveTheme, onClose]);

  const handleCancel = useCallback(() => {
    setSelectedTheme(currentTheme);
    setSearchQuery('');
    setSelectedCategory('all');
    onClose();
  }, [currentTheme, onClose]);

  // Filter themes based on search and category
  const filteredThemes = useMemo(() => {
    return availableThemes.filter(theme => {
      const matchesSearch =
        theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (theme.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesCategory =
        selectedCategory === 'all' ||
        categorizeTheme(theme.id) === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [availableThemes, searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={handleCancel}
    >
      <div
        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex overflow-hidden border border-white/20"
        style={{
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side - Theme List */}
        <div className="w-2/5 border-r border-gray-200/50 flex flex-col bg-gradient-to-br from-gray-50/80 to-white/80">
          {/* Header */}
          <div className="px-5 py-5 border-b border-gray-200/50">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Choose Your Theme
              </h3>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2 mt-3">
              {(Object.keys(THEME_CATEGORIES) as CategoryKey[]).map((cat) => {
                const category = THEME_CATEGORIES[cat];
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium transition-all transform hover:scale-105
                      ${isActive
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-white/80 text-gray-600 hover:bg-white border border-gray-200'
                      }
                    `}
                  >
                    <span className="mr-1">{category.icon}</span>
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            <div className="space-y-2">
              {filteredThemes.map((theme) => {
                const isSelected = selectedTheme.id === theme.id;
                const isCurrentTheme = currentTheme.id === theme.id;

                return (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all transform hover:scale-[1.02]
                      ${isSelected
                        ? 'bg-gradient-to-r from-purple-50 to-blue-50 shadow-lg shadow-purple-500/20 scale-[1.02]'
                        : 'bg-white/60 hover:bg-white/80 hover:shadow-md'
                      }
                    `}
                  >
                    {/* Theme circle icon */}
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-full flex-shrink-0 shadow-md border-3 border-white ring-2 ring-gray-200/50 transition-transform hover:scale-110"
                        style={{
                          background: theme.pattern?.value || theme.colors.bubbleOwnGradient || theme.colors.bubbleOwn,
                        }}
                      />
                      {isCurrentTheme && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Theme info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className={`
                        font-semibold text-sm truncate transition-colors
                        ${isSelected ? 'text-purple-700' : 'text-gray-900'}
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
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg animate-in zoom-in duration-200">
                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {filteredThemes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-600">No themes found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search or category</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Preview */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-white/80 to-gray-50/80">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200/50 flex items-center justify-between bg-white/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Live Preview
            </h2>
            <button
              onClick={handleCancel}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors group"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500 group-hover:text-gray-700 group-hover:rotate-90 transition-all" />
            </button>
          </div>

          {/* Preview Section */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <ThemePreview theme={selectedTheme} />

            {/* Theme details */}
            <div className="mt-6 px-1">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {selectedTheme.name}
                  </h3>
                  {selectedTheme.description && (
                    <p className="text-sm text-gray-600">
                      {selectedTheme.description}
                    </p>
                  )}
                </div>
                {currentTheme.id === selectedTheme.id && (
                  <span className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Active
                  </span>
                )}
              </div>

              {/* Theme Color Palette */}
              <div className="mt-4 p-4 bg-white/80 rounded-xl border border-gray-200/50">
                <p className="text-xs font-semibold text-gray-600 mb-3">Color Palette</p>
                <div className="flex gap-2">
                  <div
                    className="w-12 h-12 rounded-lg shadow-sm border-2 border-white ring-1 ring-gray-200/50"
                    style={{ background: selectedTheme.colors.bubbleOwnGradient || selectedTheme.colors.bubbleOwn }}
                    title="Your messages"
                  />
                  <div
                    className="w-12 h-12 rounded-lg shadow-sm border-2 border-white ring-1 ring-gray-200/50"
                    style={{ background: selectedTheme.colors.bubbleOther }}
                    title="Their messages"
                  />
                  <div
                    className="w-12 h-12 rounded-lg shadow-sm border-2 border-white ring-1 ring-gray-200/50"
                    style={{ background: selectedTheme.colors.chatBackgroundGradient || selectedTheme.colors.chatBackground }}
                    title="Chat background"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isApplying}
              className="flex-1 px-5 py-3 text-gray-700 bg-white hover:bg-gray-50 rounded-xl font-semibold transition-all border border-gray-200 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isApplying || currentTheme.id === selectedTheme.id}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {isApplying ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Applying...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Apply Theme
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.4);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.6);
        }
      `}</style>
    </div>
  );
});
