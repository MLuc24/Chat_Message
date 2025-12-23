// Group Video Call Modal Component

import { useEffect, useRef } from 'react';
import type { GroupCallState, GroupCallParticipant } from '@/types/call.types';

interface GroupVideoCallModalProps {
  isOpen: boolean;
  callState: GroupCallState;
  localStream: MediaStream | null;
  getParticipantStreams: () => Map<string, MediaStream | undefined>;
  onAnswer?: () => void;
  onReject?: () => void;
  onEnd?: () => void;
  onLeave?: () => void;
  onToggleMicrophone?: () => void;
  onToggleCamera?: () => void;
  onToggleScreenShare?: () => void;
}

export function GroupVideoCallModal({
  isOpen,
  callState,
  localStream,
  getParticipantStreams,
  onAnswer,
  onReject,
  onEnd,
  onLeave,
  onToggleMicrophone,
  onToggleCamera,
  onToggleScreenShare,
}: GroupVideoCallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.muted = true;
    }
  }, [localStream]);

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

  const { isIncoming, isConnected, participants, duration, isMuted, isCameraOn, isScreenSharing, conversationName, initiatorName } = callState;
  const participantStreams = getParticipantStreams();

  // Calculate grid layout based on participant count
  const getGridClass = (count: number): string => {
    if (count <= 1) return 'grid-cols-1';
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">{conversationName || 'Cuộc gọi nhóm'}</h2>
            <p className="text-white/70 text-sm">
              {isIncoming && !isConnected && `${initiatorName || 'Ai đó'} đang gọi...`}
              {!isIncoming && !isConnected && 'Đang kết nối...'}
              {isConnected && `${formatDuration(duration)} • ${participants.filter(p => p.isConnected).length + 1} người`}
            </p>
          </div>
          {isScreenSharing && (
            <div className="bg-blue-500 px-3 py-1 rounded-full text-white text-sm">
              🖥️ Đang chia sẻ màn hình
            </div>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 p-4 pt-20 pb-24 overflow-auto">
        {!isConnected && isIncoming ? (
          <IncomingCallOverlay initiatorName={initiatorName} conversationName={conversationName} />
        ) : (
          <div className={`grid ${getGridClass(participants.length + 1)} gap-3 h-full`}>
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-xl overflow-hidden min-h-[200px]">
              {isCameraOn && localStream ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-3xl font-bold text-white">
                    Bạn
                  </div>
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm flex items-center gap-2">
                <span>Bạn</span>
                {isMuted && <MutedIcon />}
              </div>
            </div>

            {/* Remote Participants */}
            {participants.map((participant) => (
              <ParticipantVideo
                key={participant.odId}
                participant={participant}
                stream={participantStreams.get(participant.odId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex justify-center gap-4">
          {isConnected && (
            <>
              {/* Microphone */}
              <ControlButton
                onClick={onToggleMicrophone}
                isActive={!isMuted}
                title={isMuted ? 'Bật mic' : 'Tắt mic'}
              >
                <MicrophoneIcon isMuted={isMuted} />
              </ControlButton>

              {/* Camera */}
              <ControlButton
                onClick={onToggleCamera}
                isActive={isCameraOn}
                title={isCameraOn ? 'Tắt camera' : 'Bật camera'}
              >
                <CameraIcon isOff={!isCameraOn} />
              </ControlButton>

              {/* Screen Share */}
              <ControlButton
                onClick={onToggleScreenShare}
                isActive={isScreenSharing}
                title={isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
              >
                <ScreenShareIcon isActive={isScreenSharing} />
              </ControlButton>
            </>
          )}

          {/* Answer (incoming) */}
          {isIncoming && !isConnected && onAnswer && (
            <button
              onClick={onAnswer}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 flex items-center justify-center transition-all hover:scale-110 shadow-lg"
              title="Trả lời"
            >
              <PhoneIcon />
            </button>
          )}

          {/* End/Reject/Leave */}
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

function ParticipantVideo({
  participant,
  stream,
}: {
  participant: GroupCallParticipant;
  stream?: MediaStream;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-gray-800 rounded-xl overflow-hidden min-h-[200px]">
      {stream && participant.isCameraOn !== false ? (
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-700">
          <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-3xl font-bold text-white">
            {participant.avatarUrl ? (
              <img src={participant.avatarUrl} alt={participant.odName} className="w-full h-full rounded-full object-cover" />
            ) : (
              participant.odName?.charAt(0).toUpperCase() || '?'
            )}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm flex items-center gap-2">
        <span>{participant.odName || 'Unknown'}</span>
        {participant.isMuted && <MutedIcon />}
        {participant.isScreenSharing && <span>🖥️</span>}
      </div>
      {!participant.isConnected && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span className="text-white text-sm">Đang kết nối...</span>
        </div>
      )}
    </div>
  );
}

function IncomingCallOverlay({ initiatorName, conversationName }: { initiatorName?: string; conversationName?: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-6 ring-4 ring-blue-500 animate-pulse">
        <span className="text-5xl font-bold text-white">{conversationName?.charAt(0).toUpperCase() || '?'}</span>
      </div>
      <h3 className="text-2xl font-semibold text-white mb-2">{conversationName || 'Cuộc gọi nhóm'}</h3>
      <p className="text-white/70">{initiatorName || 'Ai đó'} đang gọi video...</p>
    </div>
  );
}

function ControlButton({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick?: () => void;
  isActive: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
        isActive ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500 hover:bg-red-600'
      }`}
      title={title}
    >
      {children}
    </button>
  );
}

// ==================== Icons ====================

function MutedIcon() {
  return (
    <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

function MicrophoneIcon({ isMuted }: { isMuted: boolean }) {
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

function CameraIcon({ isOff }: { isOff: boolean }) {
  if (isOff) {
    return (
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth={2} />
      </svg>
    );
  }
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function ScreenShareIcon({ isActive }: { isActive: boolean }) {
  return (
    <svg className={`w-6 h-6 ${isActive ? 'text-blue-400' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
