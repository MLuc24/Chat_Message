// Custom Hook for Voice Call with WebRTC

import { useState, useEffect, useCallback, useRef } from 'react';
import { socketManager } from '@/services/websocket/socketManager';
import type { User } from '@/types/user.types';
import type {
  VoiceCallState,
  IncomingCallData,
  CallRejectedData,
} from '@/types/call.types';

// WebRTC Configuration
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useVoiceCall() {
  const [callState, setCallState] = useState<VoiceCallState>({
    isActive: false,
    isIncoming: false,
    isOutgoing: false,
    isConnected: false,
    duration: 0,
    callType: 'voice',
  });

  // Keep callStateRef in sync
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<number | null>(null);
  const callStateRef = useRef(callState);
  const isAnsweringRef = useRef(false);

  // ==================== Initialize Audio Stream ====================
  const initializeLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Failed to get audio stream:', error);
      throw new Error('Không thể truy cập microphone');
    }
  }, []);

  // ==================== Duration Timer ====================
  const startDurationTimer = useCallback(() => {
    durationTimerRef.current = window.setInterval(() => {
      setCallState((prev) => ({
        ...prev,
        duration: prev.duration + 1,
      }));
    }, 1000);
  }, []);

  // ==================== End Call ====================
  const endCall = useCallback(() => {

    // Send end event to other user
    const currentState = callStateRef.current;
    if (currentState.isActive && currentState.targetUserId) {
      socketManager.emit('voice_call_end', {
        targetUserId: currentState.targetUserId,
        duration: currentState.duration,
      });
    }

    // Stop duration timer
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    // Reset flags
    isAnsweringRef.current = false;

    // Reset state
    setCallState({
      isActive: false,
      isIncoming: false,
      isOutgoing: false,
      isConnected: false,
      duration: 0,
      callType: 'voice',
    });
  }, []);

  // ==================== Create Peer Connection ====================
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(RTC_CONFIG);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      
      // Play remote audio
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.play().catch((err) => console.error('Error playing audio:', err));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const currentState = callStateRef.current;
        if (currentState.targetUserId) {
          socketManager.emit('voice_call_ice_candidate', {
            targetUserId: currentState.targetUserId,
            candidate: event.candidate.toJSON(),
          });
        }
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState((prev) => ({ ...prev, isConnected: true }));
        startDurationTimer();
      } else if (
        pc.connectionState === 'failed' ||
        pc.connectionState === 'disconnected' ||
        pc.connectionState === 'closed'
      ) {
        endCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [startDurationTimer, endCall]);

  // ==================== Start Outgoing Call ====================
  const startCall = useCallback(
    async (targetUser: User, conversationId: string) => {
      try {

        // Initialize audio stream
        await initializeLocalStream();

        // Update state
        setCallState({
          isActive: true,
          isIncoming: false,
          isOutgoing: true,
          isConnected: false,
          targetUserId: targetUser.id,
          targetUserName: targetUser.name,
          conversationId,
          duration: 0,
          callType: 'voice',
        });

        // Create peer connection
        const pc = createPeerConnection();

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketManager.emit('voice_call_offer', {
          targetUserId: targetUser.id,
          offer: pc.localDescription!.toJSON(),
          conversationId,
        });

      } catch (error) {
        console.error('❌ Failed to start call:', error);
        alert('Không thể bắt đầu cuộc gọi: ' + (error as Error).message);
        endCall();
      }
    },
    [initializeLocalStream, createPeerConnection, endCall]
  );

  // ==================== Answer Incoming Call ====================
  const answerCall = useCallback(
    async (incomingData: IncomingCallData) => {
      try {
          // Prevent duplicate answers
        if (isAnsweringRef.current || peerConnectionRef.current) {
          return;
        }

        isAnsweringRef.current = true;

        // Initialize audio stream
        await initializeLocalStream();

        // Create peer connection
        const pc = createPeerConnection();

        // Set remote description (offer)
        await pc.setRemoteDescription(
          new RTCSessionDescription(incomingData.offer)
        );

        // Create and send answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketManager.emit('voice_call_answer', {
          callerId: incomingData.callerId,
          answer: pc.localDescription!.toJSON(),
        });

        // Update state to show we're no longer incoming, but connecting
        // Also set targetUserId so ICE candidates can be sent
        const newState: VoiceCallState = {
          isActive: true,
          isIncoming: false,
          isOutgoing: false,
          isConnected: false,
          callerId: incomingData.callerId,
          targetUserId: incomingData.callerId,
          conversationId: incomingData.conversationId,
          duration: 0,
          callType: 'voice',
        };
        setCallState(newState);
        callStateRef.current = newState;

      } catch (error) {
        console.error('❌ Failed to answer call:', error);
        alert('Không thể trả lời cuộc gọi');
        isAnsweringRef.current = false;
        endCall();
      }
    },
    [initializeLocalStream, createPeerConnection, endCall]
  );

  // ==================== Reject Call ====================
  const rejectCall = useCallback((callerId: string, reason?: string) => {
    socketManager.emit('voice_call_reject', {
      callerId,
      reason: reason || 'Call declined',
    });

    endCall();
  }, [endCall]);

  // ==================== Socket Event Handlers ====================
  useEffect(() => {
    // Store for incoming call data
    interface WindowWithCallData extends Window {
      __incomingCallData?: IncomingCallData;
    }

    // Incoming call
    const handleIncomingCall = (data: IncomingCallData) => {
      // Prevent duplicate incoming calls
      const currentState = callStateRef.current;
      if (currentState.isActive) {
        return;
      }
      
      setCallState({
        isActive: true,
        isIncoming: true,
        isOutgoing: false,
        isConnected: false,
        callerId: data.callerId,
        callerName: data.callerEmail,
        conversationId: data.conversationId,
        duration: 0,
        callType: 'voice',
      });

      // Store offer for later use when user answers
      (window as WindowWithCallData).__incomingCallData = data;
    };

    // Call answered
    const handleCallAnswered = async (data: {
      answer: RTCSessionDescriptionInit;
      answeredBy: string;
    }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
        } catch (error) {
          console.error('❌ Failed to set remote description:', error);
        }
      }
    };

    // ICE candidate received
    const handleIceCandidate = async (data: {
      candidate: RTCIceCandidateInit;
      fromUserId: string;
    }) => {
      if (peerConnectionRef.current && data.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (error) {
          console.error('❌ Failed to add ICE candidate:', error);
        }
      }
    };

    // Call rejected
    const handleCallRejected = (data: CallRejectedData) => {
      alert(`Cuộc gọi bị từ chối: ${data.reason}`);
      endCall();
    };

    // Call ended
    const handleCallEnded = () => {
      endCall();
    };

    // Call failed
    const handleCallFailed = (data: { reason: string }) => {
      console.error('📞 Call failed:', data.reason);
      alert(`Cuộc gọi thất bại: ${data.reason}`);
      endCall();
    };

    // Register socket listeners
    socketManager.on('voice_call_incoming', handleIncomingCall);
    socketManager.on('voice_call_answered', handleCallAnswered);
    socketManager.on('voice_call_ice_candidate', handleIceCandidate);
    socketManager.on('voice_call_rejected', handleCallRejected);
    socketManager.on('voice_call_ended', handleCallEnded);
    socketManager.on('voice_call_failed', handleCallFailed);

    // Cleanup
    return () => {
      socketManager.off('voice_call_incoming', handleIncomingCall);
      socketManager.off('voice_call_answered', handleCallAnswered);
      socketManager.off('voice_call_ice_candidate', handleIceCandidate);
      socketManager.off('voice_call_rejected', handleCallRejected);
      socketManager.off('voice_call_ended', handleCallEnded);
      socketManager.off('voice_call_failed', handleCallFailed);
    };
  }, [endCall]);

  // ==================== Cleanup on Unmount ====================
  useEffect(() => {
    return () => {
      endCall();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wrapper functions with useCallback
  const handleAnswerCall = useCallback(() => {
    interface WindowWithCallData extends Window {
      __incomingCallData?: IncomingCallData;
    }
    const incomingData = (window as WindowWithCallData).__incomingCallData;
    if (incomingData) {
      answerCall(incomingData);
    }
  }, [answerCall]);

  const handleRejectCall = useCallback(() => {
    const currentState = callStateRef.current;
    if (currentState.callerId) {
      rejectCall(currentState.callerId);
    }
  }, [rejectCall]);

  return {
    callState,
    startCall,
    answerCall: handleAnswerCall,
    rejectCall: handleRejectCall,
    endCall,
  };
}
