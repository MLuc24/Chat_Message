// Voice Recorder Component - Record and send voice messages

import { memo, useEffect } from 'react';
import { useVoiceRecorder } from '../../../hooks/useVoiceRecorder';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder = memo(function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    error,
  } = useVoiceRecorder();

  // Static waveform heights for visual effect
  const waveformHeights = [45, 72, 38, 85, 60, 92, 55, 68, 40, 80, 65, 50, 75, 88, 42, 70, 58, 82, 48, 90];

  // Auto-start recording when component mounts
  useEffect(() => {
    startRecording();
  }, [startRecording]);

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, duration);
      cancelRecording();
    } else {
      stopRecording();
    }
  };

  const handleCancel = () => {
    cancelRecording();
    onCancel();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-t border-red-200">
        <span className="text-red-600 text-sm">{error}</span>
        <button
          onClick={handleCancel}
          className="ml-auto text-red-600 hover:text-red-700 font-medium text-sm"
        >
          Đóng
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-t border-blue-200">
      {/* Cancel button */}
      <button
        onClick={handleCancel}
        className="text-gray-600 hover:text-gray-800 transition-colors"
        title="Hủy"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      </button>

      {/* Recording indicator */}
      <div className="flex items-center gap-2">
        {isRecording && !isPaused && (
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        )}
        {isPaused && (
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
        )}
        {audioBlob && !isRecording && (
          <div className="w-3 h-3 bg-green-500 rounded-full" />
        )}
      </div>

      {/* Waveform visualization (simplified) */}
      <div className="flex items-center gap-1 h-8">
        {waveformHeights.map((height, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all ${
              isRecording && !isPaused 
                ? 'bg-blue-500 animate-pulse' 
                : 'bg-gray-400'
            }`}
            style={{
              height: `${height}%`,
              animationDelay: `${i * 0.05}s`,
            }}
          />
        ))}
      </div>

      {/* Duration */}
      <span className="text-lg font-mono font-medium text-gray-700">
        {formatDuration(duration)}
      </span>

      {/* Pause/Resume button */}
      {isRecording && !audioBlob && (
        <button
          onClick={isPaused ? resumeRecording : pauseRecording}
          className="text-blue-600 hover:text-blue-700 transition-colors"
          title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
        >
          {isPaused ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          )}
        </button>
      )}

      {/* Stop/Send button */}
      <button
        onClick={handleSend}
        className="ml-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-colors"
        title={audioBlob ? 'Gửi' : 'Dừng ghi âm'}
      >
        {audioBlob ? (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        )}
      </button>
    </div>
  );
});
