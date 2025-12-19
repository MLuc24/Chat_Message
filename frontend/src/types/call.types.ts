// ==================== Call Types ====================

/**
 * Call type enum
 */
export type CallType = 'voice' | 'video';

/**
 * Base call state interface
 */
interface BaseCallState {
  isActive: boolean;
  isIncoming: boolean;
  isOutgoing: boolean;
  isConnected: boolean;
  callerId?: string;
  callerName?: string;
  targetUserId?: string;
  targetUserName?: string;
  conversationId?: string;
  startTime?: Date;
  duration: number;
  callType: CallType;
}

// ==================== Voice Call Types ====================

export interface VoiceCallState extends BaseCallState {
  callType: 'voice';
}

export interface VoiceCallOffer {
  targetUserId: string;
  offer: RTCSessionDescriptionInit;
  conversationId: string;
}

export interface VoiceCallAnswer {
  callerId: string;
  answer: RTCSessionDescriptionInit;
}

export interface VoiceCallIceCandidate {
  targetUserId: string;
  candidate: RTCIceCandidateInit;
}

export interface IncomingCallData {
  callerId: string;
  callerEmail: string;
  offer: RTCSessionDescriptionInit;
  conversationId: string;
  timestamp: Date;
  callType?: CallType;
}

export interface CallEndedData {
  endedBy: string;
  duration?: number;
  timestamp: Date;
}

export interface CallRejectedData {
  rejectedBy: string;
  reason: string;
  timestamp: Date;
}

// ==================== Video Call Types ====================

/**
 * Video call state with camera/screen controls
 */
export interface VideoCallState extends BaseCallState {
  callType: 'video';
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  localVideoEnabled: boolean;
  remoteVideoEnabled: boolean;
}

/**
 * Video call offer with video constraints
 */
export interface VideoCallOffer {
  targetUserId: string;
  offer: RTCSessionDescriptionInit;
  conversationId: string;
  hasVideo: boolean;
  hasAudio: boolean;
}

/**
 * Video call answer
 */
export interface VideoCallAnswer {
  callerId: string;
  answer: RTCSessionDescriptionInit;
  hasVideo: boolean;
  hasAudio: boolean;
}

/**
 * Video call ICE candidate
 */
export interface VideoCallIceCandidate {
  targetUserId: string;
  candidate: RTCIceCandidateInit;
}

/**
 * Incoming video call data
 */
export interface IncomingVideoCallData {
  callerId: string;
  callerEmail: string;
  callerName: string;
  offer: RTCSessionDescriptionInit;
  conversationId: string;
  hasVideo: boolean;
  hasAudio: boolean;
  timestamp: Date;
}

/**
 * Video track control events
 */
export interface VideoTrackControl {
  userId: string;
  trackType: 'video' | 'audio';
  enabled: boolean;
}

/**
 * Screen sharing events
 */
export interface ScreenShareControl {
  userId: string;
  isSharing: boolean;
}

// ==================== Media Constraints ====================

/**
 * Video call media constraints
 */
export interface VideoCallConstraints {
  audio: boolean | MediaTrackConstraints;
  video: boolean | MediaTrackConstraints;
}

/**
 * Default video constraints
 */
export const DEFAULT_VIDEO_CONSTRAINTS: VideoCallConstraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    facingMode: 'user',
  },
};

/**
 * Screen share constraints
 */
export const SCREEN_SHARE_CONSTRAINTS: DisplayMediaStreamOptions = {
  video: {
    displaySurface: 'monitor',
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
  } as MediaTrackConstraints,
  audio: false,
};
