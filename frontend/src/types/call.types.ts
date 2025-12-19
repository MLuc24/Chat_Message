// Voice Call Types

export interface VoiceCallState {
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
