import { memo } from 'react';
import type { Theme } from '@/types/theme.types';

interface ThemePreviewProps {
  theme: Theme;
}

/**
 * ThemePreview component  
 * Hiển thị preview thực tế của theme với chat bubbles
 */
export const ThemePreview = memo(function ThemePreview({ theme }: ThemePreviewProps) {
  const { colors, backgroundImage } = theme;
  
  return (
    <div 
      className="w-full h-64 rounded-xl p-4 flex flex-col justify-end gap-2.5 overflow-hidden relative shadow-inner"
      style={{ 
        background: colors.chatBackgroundGradient || colors.chatBackground || '#ffffff',
      }}
    >
      {/* Background image overlay */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              rgba(0,0,0,0.02) 10px,
              rgba(0,0,0,0.02) 20px
            )
          `,
        }}
      />
      
      {/* Sample messages */}
      <div className="relative z-10 flex flex-col gap-2.5">
        {/* Informational banner */}
        <div className="flex justify-center mb-1">
          <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-black/5 backdrop-blur-sm text-gray-700">
            Có rất nhiều chủ đề để bạn lựa chọn và những chủ đề này đều khác nhau đôi chút.
          </div>
        </div>
        
        {/* Other user message */}
        <div className="flex justify-start">
          <div 
            className="max-w-[75%] px-4 py-2.5 rounded-[18px] text-sm leading-relaxed shadow-sm"
            style={{
              background: colors.bubbleOtherGradient || colors.bubbleOther,
              color: colors.bubbleOtherText,
            }}
          >
            Tin nhân mà bạn gửi cho người khác sẽ có màu này.
          </div>
        </div>
        
        {/* Own message */}
        <div className="flex justify-end">
          <div 
            className="max-w-[70%] px-4 py-2.5 rounded-[18px] text-sm leading-relaxed shadow-md"
            style={{
              background: colors.bubbleOwnGradient || colors.bubbleOwn,
              color: colors.bubbleOwnText,
            }}
          >
            Tin nhắn của bạn bè sẽ tương tự như thế này.
          </div>
        </div>
        
        {/* Prompt text */}
        <div className="flex justify-center mt-2">
          <div 
            className="px-4 py-2 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm"
            style={{
              background: colors.bubbleOwnGradient || colors.bubbleOwn,
              color: colors.bubbleOwnText,
            }}
          >
            Nhấp vào Chọn để chọn chủ đề này.
          </div>
        </div>
      </div>
    </div>
  );
});
