import { memo } from 'react';
import type { Theme } from '@/types/theme.types';

interface ThemePreviewProps {
  theme: Theme;
}

/**
 * ThemePreview component  
 * Beautiful, realistic preview with rich background patterns matching ChatBackground
 */
export const ThemePreview = memo(function ThemePreview({ theme }: ThemePreviewProps) {
  const { colors, backgroundImage } = theme;

  return (
    <div
      className="w-full rounded-2xl p-5 flex flex-col justify-end gap-3 overflow-hidden relative shadow-2xl transition-all duration-500 border border-gray-200/50"
      style={{
        background: backgroundImage
          ? `url(${backgroundImage})`
          : colors.chatBackgroundGradient || colors.chatBackground || '#ffffff',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '380px',
      }}
    >
      {/* Background Pattern Layer 1 - Dots */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${colors.bubbleOwn || '#000'} 1.5px, transparent 1.5px)`,
          backgroundSize: '20px 20px',
        }}
      />

      {/* Background Pattern Layer 2 - Grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(${colors.bubbleOwn || '#000'} 1px, transparent 1px),
            linear-gradient(90deg, ${colors.bubbleOwn || '#000'} 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Background Pattern Layer 3 - Diagonal */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            ${colors.bubbleOther || '#f0f0f0'} 0px,
            ${colors.bubbleOther || '#f0f0f0'} 1px,
            transparent 1px,
            transparent 10px
          )`,
        }}
      />

      {/* Background image overlay for better text readability */}
      {backgroundImage && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            background: `linear-gradient(
              135deg,
              ${colors.chatBackground || '#ffffff'}ee 0%,
              ${colors.chatBackground || '#ffffff'}dd 50%,
              ${colors.chatBackground || '#ffffff'}ee 100%
            )`,
          }}
        />
      )}

      {/* Animated gradient orbs for depth - Top Left (Contained) */}
      <div
        className="absolute top-0 left-0 w-40 h-40 rounded-full opacity-[0.1] blur-3xl transition-all duration-700 pointer-events-none"
        style={{
          background: colors.bubbleOwnGradient || colors.bubbleOwn,
          transform: 'translate(-25%, -25%)',
        }}
      />

      {/* Animated gradient orbs for depth - Bottom Right (Contained) */}
      <div
        className="absolute bottom-0 right-0 w-40 h-40 rounded-full opacity-[0.1] blur-3xl transition-all duration-700 pointer-events-none"
        style={{
          background: colors.bubbleOther,
          transform: 'translate(25%, 25%)',
        }}
      />

      {/* Middle gradient orb (Contained) */}
      <div
        className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full opacity-[0.05] blur-3xl pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${colors.bubbleOwn || '#0084ff'} 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Vignette Effect */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          background: `radial-gradient(
            ellipse at center,
            transparent 0%,
            transparent 40%,
            rgba(0, 0, 0, 0.12) 100%
          )`,
        }}
      />

      {/* Floating particles (Contained) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => {
          const size = Math.random() * 30 + 12;
          return (
            <div
              key={i}
              className="absolute rounded-full opacity-[0.03] animate-float"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${15 + Math.random() * 70}%`,
                top: `${15 + Math.random() * 70}%`,
                background: i % 2 === 0 ? colors.bubbleOwn : colors.bubbleOther,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${15 + Math.random() * 8}s`,
              }}
            />
          );
        })}
      </div>

      {/* Sample messages */}
      <div className="relative z-10 flex flex-col gap-3">
        {/* Informational banner */}
        <div className="flex justify-center mb-1 animate-in fade-in slide-in-from-top duration-500">
          <div
            className="px-4 py-2 rounded-full text-xs font-medium backdrop-blur-md border border-white/30 shadow-lg"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.08)',
              color: 'rgba(0, 0, 0, 0.75)',
            }}
          >
            🎨 Live Theme Preview
          </div>
        </div>

        {/* Other user message */}
        <div className="flex justify-start animate-in fade-in slide-in-from-left duration-500 delay-100">
          <div
            className="max-w-[80%] px-5 py-3 rounded-[20px] text-sm leading-relaxed shadow-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl backdrop-blur-sm"
            style={{
              background: colors.bubbleOtherGradient || colors.bubbleOther,
              color: colors.bubbleOtherText,
              borderBottomLeftRadius: '6px',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.08)',
            }}
          >
            Hey! This theme looks really beautiful! 😊
          </div>
        </div>

        {/* Own message 1 */}
        <div className="flex justify-end animate-in fade-in slide-in-from-right duration-500 delay-200">
          <div
            className="max-w-[75%] px-5 py-3 rounded-[20px] text-sm leading-relaxed shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl backdrop-blur-sm"
            style={{
              background: colors.bubbleOwnGradient || colors.bubbleOwn,
              color: colors.bubbleOwnText,
              borderBottomRightRadius: '6px',
              boxShadow: '0 3px 16px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            I know right! The colors are perfect 🎉
          </div>
        </div>

        {/* Own message 2 (grouped) */}
        <div className="flex justify-end animate-in fade-in slide-in-from-right duration-500 delay-300">
          <div
            className="max-w-[70%] px-5 py-3 rounded-[20px] text-sm leading-relaxed shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl backdrop-blur-sm"
            style={{
              background: colors.bubbleOwnGradient || colors.bubbleOwn,
              color: colors.bubbleOwnText,
              borderBottomRightRadius: '6px',
              boxShadow: '0 3px 16px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            The patterns look amazing! ✨
          </div>
        </div>

        {/* Prompt button */}
        <div className="flex justify-center mt-2 animate-in fade-in zoom-in duration-500 delay-400">
          <button
            className="px-6 py-3 rounded-full text-xs font-bold shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 hover:shadow-2xl border-2 border-white/40"
            style={{
              background: colors.bubbleOwnGradient || colors.bubbleOwn,
              color: colors.bubbleOwnText,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            ✨ Apply This Theme
          </button>
        </div>
      </div>

      {/* Theme name watermark */}
      <div className="absolute top-4 right-4 z-20">
        <div
          className="px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-lg border-2 border-white/30 shadow-xl transition-all duration-300 hover:scale-105"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'rgba(0, 0, 0, 0.7)',
          }}
        >
          {theme.name}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
          }
          25% {
            transform: translateY(-12px) translateX(6px) scale(1.05);
          }
          50% {
            transform: translateY(-6px) translateX(-6px) scale(0.95);
          }
          75% {
            transform: translateY(-15px) translateX(3px) scale(1.02);
          }
        }
        
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
});
