// Group Voice Call Modal Component

import { useEffect } from 'react';
import type { GroupCallState, GroupCallParticipant } from '@/types/call.types';

interface GroupVoiceCallModalProps {
  isOpen: boolean;
  callState: GroupCallState;
  onAnswer?: () => void;
  onReject?: () => void;
  onEnd?: () => void;
  onLeave?: () => void;
  onToggleMute?: () => void;
}

export function GroupVoiceCallModal({
  isOpen,
  callState,
  onAnswer,
  onReject,
  onEnd,
  onLeave,
  onToggleMute,
}: GroupVoiceCallModalProps) {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const { isIncoming, isConnected, participants, duration, isMuted, conversationName, initiatorName } = callState;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-3xl shadow-2xl p-8 w-[500px] max-w-[95vw]">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-1">
            {conversationName || 'Cuộc gọi nhóm'}
          </h2>
          <p className="text-white/80 text-sm">
            {isIncoming && !isConnected && `${initiatorName || 'Ai đó'} đang gọi...`}
            {!isIncoming && !isConnected && 'Đang kết nối...'}
            {isConnected && formatDuration(duration)}
          </p>
        </div>

        {/* Participants Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8 max-h-[300px] overflow-y-auto">
          {participants.map((participant) => (
            <ParticipantAvatar key={participant.odId} participant={participant} />
          ))}
          {participants.length === 0 && !isIncoming && (
            <div className="col-span-3 text-center text-white/60 py-8">
              Đang chờ người tham gia...
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {/* Mute Button */}
          {isConnected && (
            <button
              onClick={onToggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
              }`}
              title={isMuted ? 'Bật mic' : 'Tắt mic'}
            >
              <MicIcon isMuted={isMuted} />
            </button>
          )}

          {/* Answer Button */}
          {isIncoming && !isConnected && onAnswer && (
            <button
              onClick={onAnswer}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
              title="Trả lời"
            >
              <PhoneIcon />
            </button>
          )}

          {/* End/Reject/Leave Button */}
          <button
            onClick={isIncoming && !isConnected ? onReject : isConnected ? onLeave : onEnd}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
            title={isIncoming && !isConnected ? 'Từ chối' : 'Kết thúc'}
          >
            <EndCallIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Sub-components ====================

function ParticipantAvatar({ participant }: { participant: GroupCallParticipant }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
            participant.isConnected ? 'bg-white/30 ring-2 ring-green-400' : 'bg-white/20'
          }`}
        >
          {participant.avatarUrl ? (
            <img
              src={participant.avatarUrl}
              alt={participant.odName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            participant.odName?.charAt(0).toUpperCase() || '?'
          )}
        </div>
        {/* Connection indicator */}
        <div
          className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-green-700 ${
            participant.isConnected ? 'bg-green-400' : 'bg-gray-400'
          }`}
        />
        {/* Muted indicator */}
        {participant.isMuted && (
          <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>
      <span className="text-white text-xs mt-2 truncate max-w-[80px]">
        {participant.odName || 'Unknown'}
      </span>
    </div>
  );
}

function MicIcon({ isMuted }: { isMuted: boolean }) {
  if (isMuted) {
    return (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
      </svg>
    );
  }
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function EndCallIcon() {
  return (
    <svg className="w-8 h-8 text-white transform rotate-135" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}
