// Video Call Modal Component

import { useEffect, useRef } from 'react';
import type { User } from '@/types/user.types';
import type { VideoCallState } from '@/types/call.types';

interface VideoCallModalProps {
  isOpen: boolean;
  callState: VideoCallState;
  otherUser?: User;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onAnswer?: () => void;
  onReject?: () => void;
  onEnd?: () => void;
  onToggleCamera?: () => void;
  onToggleMicrophone?: () => void;
  onToggleScreenShare?: () => void;
}

export function VideoCallModal({
  isOpen,
  callState,
  otherUser,
  localStream,
  remoteStream,
  onAnswer,
  onReject,
  onEnd,
  onToggleCamera,
  onToggleMicrophone,
  onToggleScreenShare,
}: VideoCallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Format duration (seconds to MM:SS)
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Setup local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.muted = true; // Always mute local video to prevent echo
    }
  }, [localStream]);

  // Setup remote video stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

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

  const { isIncoming, isConnected, isCameraOn, isMicOn, isScreenSharing, duration } = callState;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      {/* Remote Video (Full Screen) */}
      <div className="relative w-full h-full">
        {remoteStream && isConnected ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          // Placeholder when no remote video
          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-4 ring-white/30 mb-4">
              {otherUser?.avatarUrl ? (
                <img
                  src={otherUser.avatarUrl}
                  alt={otherUser.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-6xl font-bold text-white">
                  {otherUser?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>
            <h2 className="text-3xl font-semibold text-white mb-2">
              {otherUser?.name || 'Unknown User'}
            </h2>
            <p className="text-white/80 text-lg">
              {isIncoming && !isConnected && 'Cuộc gọi video đến...'}
              {!isIncoming && !isConnected && 'Đang kết nối...'}
            </p>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        {localStream && (
          <div className="absolute top-4 right-4 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-white/30">
            {isCameraOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  <line x1="1" y1="1" x2="23" y2="23" strokeWidth={2} />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Top Bar - User Info & Duration */}
        {isConnected && (
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md rounded-lg px-4 py-2 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-white font-medium">{formatDuration(duration)}</span>
          </div>
        )}

        {/* Screen Sharing Indicator */}
        {isScreenSharing && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 backdrop-blur-md rounded-lg px-4 py-2">
            <span className="text-white font-medium">🖥️ Đang chia sẻ màn hình</span>
          </div>
        )}

        {/* Bottom Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
          {/* Camera Toggle (only when connected) */}
          {isConnected && onToggleCamera && (
            <button
              onClick={onToggleCamera}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isCameraOn
                  ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
              title={isCameraOn ? 'Tắt camera' : 'Bật camera'}
            >
              {isCameraOn ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  <line x1="1" y1="1" x2="23" y2="23" strokeWidth={2} />
                </svg>
              )}
            </button>
          )}

          {/* Microphone Toggle (only when connected) */}
          {isConnected && onToggleMicrophone && (
            <button
              onClick={onToggleMicrophone}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isMicOn
                  ? 'bg-white/20 hover:bg-white/30 backdrop-blur-md'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
              title={isMicOn ? 'Tắt mic' : 'Bật mic'}
            >
              {isMicOn ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}

          {/* End/Reject Button */}
          <button
            onClick={isIncoming && !isConnected ? onReject : onEnd}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
            title={isIncoming && !isConnected ? 'Từ chối' : 'Kết thúc'}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>

          {/* Screen Share Toggle (only when connected) */}
          {isConnected && onToggleScreenShare && (
            <button
              onClick={onToggleScreenShare}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isScreenSharing
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-white/20 hover:bg-white/30 backdrop-blur-md'
              }`}
              title={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
