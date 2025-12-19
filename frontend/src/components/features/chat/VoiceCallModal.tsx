// Voice Call Modal Component

import { useEffect, useState } from 'react';
import type { User } from '@/types/user.types';

interface VoiceCallModalProps {
  isOpen: boolean;
  isIncoming: boolean;
  isConnected: boolean;
  otherUser?: User;
  duration: number;
  onAnswer?: () => void;
  onReject?: () => void;
  onEnd?: () => void;
}

export function VoiceCallModal({
  isOpen,
  isIncoming,
  isConnected,
  otherUser,
  duration,
  onAnswer,
  onReject,
  onEnd,
}: VoiceCallModalProps) {
  const [isMuted, setIsMuted] = useState(false);

  // Format duration (seconds to MM:SS)
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl shadow-2xl p-8 w-96 max-w-[90vw]">
        
        {/* Avatar & Status */}
        <div className="flex flex-col items-center">
          {/* User Avatar */}
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-4 ring-white/30">
              {otherUser?.avatarUrl ? (
                <img
                  src={otherUser.avatarUrl}
                  alt={otherUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-5xl font-bold text-white">
                  {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>
            
            {/* Animated ring for active call */}
            {isConnected && (
              <div className="absolute inset-0 rounded-full border-4 border-white/50 animate-ping"></div>
            )}
          </div>

          {/* User Name */}
          <h2 className="text-2xl font-semibold text-white mb-1">
            {otherUser?.name || 'Unknown User'}
          </h2>

          {/* Call Status */}
          <p className="text-white/80 text-sm mb-6">
            {isIncoming && !isConnected && 'Cuộc gọi đến...'}
            {!isIncoming && !isConnected && 'Đang kết nối...'}
            {isConnected && formatDuration(duration)}
          </p>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center gap-4">
          {/* Mute Button (only when connected) */}
          {isConnected && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isMuted
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
              title={isMuted ? 'Bật mic' : 'Tắt mic'}
            >
              {isMuted ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                  />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              )}
            </button>
          )}

          {/* Answer Button (for incoming calls) */}
          {isIncoming && !isConnected && onAnswer && (
            <button
              onClick={onAnswer}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
              title="Trả lời"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </button>
          )}

          {/* End/Reject Button */}
          <button
            onClick={isConnected || !isIncoming ? onEnd : onReject}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
            title={isConnected ? 'Kết thúc' : 'Từ chối'}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
              />
            </svg>
          </button>
        </div>

        {/* Additional Info */}
        {isConnected && (
          <div className="mt-6 text-center">
            <p className="text-white/60 text-xs">
              {isMuted ? '🔇 Mic đã tắt' : '🎤 Mic đang bật'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
