// ChatBackground Component - Enhanced themed background for chat window
// Rich patterns, textures, and visual effects based on theme

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
      className={`relative overflow-hidden transition-all duration-500 ${className}`}
      style={backgroundStyle}
    >
      {/* Decorative Pattern Layer 1 - Dots Pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          zIndex: 0,
          backgroundImage: `radial-gradient(circle, ${colors.bubbleOwn || '#000'} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Decorative Pattern Layer 2 - Subtle Grid */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          zIndex: 0,
          backgroundImage: `
            linear-gradient(${colors.bubbleOwn || '#000'} 1px, transparent 1px),
            linear-gradient(90deg, ${colors.bubbleOwn || '#000'} 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Decorative Pattern Layer 3 - Diagonal Lines */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          zIndex: 0,
          backgroundImage: `repeating-linear-gradient(
            45deg,
            ${colors.bubbleOther || '#f0f0f0'} 0px,
            ${colors.bubbleOther || '#f0f0f0'} 1px,
            transparent 1px,
            transparent 12px
          )`,
        }}
      />

      {/* Gradient Orbs for Depth - Top Left (Contained) */}
      <div
        className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-[0.06] blur-3xl pointer-events-none transition-all duration-700"
        style={{
          zIndex: 0,
          background: colors.bubbleOwnGradient || colors.bubbleOwn,
          transform: 'translate(-30%, -30%)',
        }}
      />

      {/* Gradient Orbs for Depth - Bottom Right (Contained) */}
      <div
        className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-[0.06] blur-3xl pointer-events-none transition-all duration-700"
        style={{
          zIndex: 0,
          background: colors.bubbleOther,
          transform: 'translate(30%, 30%)',
        }}
      />

      {/* Gradient Orbs for Depth - Middle (Contained) */}
      <div
        className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full opacity-[0.03] blur-3xl pointer-events-none transition-all duration-700"
        style={{
          zIndex: 0,
          background: `radial-gradient(circle, ${colors.bubbleOwn || '#0084ff'} 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Overlay for background images to improve readability */}
      {hasBackgroundImage && (
        <>
          {/* Semi-transparent overlay */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-500"
            style={{
              zIndex: 1,
              background: `linear-gradient(
                135deg,
                ${colors.chatBackground || '#ffffff'}ee 0%,
                ${colors.chatBackground || '#ffffff'}dd 50%,
                ${colors.chatBackground || '#ffffff'}ee 100%
              )`,
            }}
          />

          {/* Subtle blur for better text contrast */}
          <div
            className="absolute inset-0 backdrop-blur-[1px] pointer-events-none"
            style={{ zIndex: 1 }}
          />
        </>
      )}

      {/* Vignette Effect - Darkens edges slightly */}
      <div
        className="absolute inset-0 opacity-[0.12] pointer-events-none transition-opacity duration-500"
        style={{
          zIndex: 2,
          background: `radial-gradient(
            ellipse at center,
            transparent 0%,
            transparent 50%,
            rgba(0, 0, 0, 0.08) 100%
          )`,
        }}
      />

      {/* Content */}
      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>

      {/* Optional: Animated Floating Particles (very subtle, contained) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        {[...Array(6)].map((_, i) => {
          const size = Math.random() * 40 + 15;
          return (
            <div
              key={i}
              className="absolute rounded-full opacity-[0.025] animate-float"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                background: i % 2 === 0 ? colors.bubbleOwn : colors.bubbleOther,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${20 + Math.random() * 10}s`,
              }}
            />
          );
        })}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
          }
          25% {
            transform: translateY(-15px) translateX(8px) scale(1.05);
          }
          50% {
            transform: translateY(-8px) translateX(-8px) scale(0.95);
          }
          75% {
            transform: translateY(-20px) translateX(4px) scale(1.02);
          }
        }
        
        .animate-float {
          animation: float linear infinite;
        }
      `}</style>
    </div>
  );
});
