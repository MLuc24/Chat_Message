// Custom Hook for Video Call with WebRTC

import { useState, useEffect, useCallback, useRef } from 'react';
import { socketManager } from '@/services/websocket/socketManager';
import type { User } from '@/types/user.types';
import type {
  VideoCallState,
  IncomingVideoCallData,
  VideoTrackControl,
  ScreenShareControl,
} from '@/types/call.types';
import {
  DEFAULT_VIDEO_CONSTRAINTS,
  SCREEN_SHARE_CONSTRAINTS,
} from '@/types/call.types';

// WebRTC Configuration
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function useVideoCall() {
  const [callState, setCallState] = useState<VideoCallState>({
    isActive: false,
    isIncoming: false,
    isOutgoing: false,
    isConnected: false,
    duration: 0,
    callType: 'video',
    isCameraOn: true,
    isMicOn: true,
    isScreenSharing: false,
    localVideoEnabled: true,
    remoteVideoEnabled: true,
  });

  // Refs for maintaining state across renders
  const callStateRef = useRef(callState);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const durationTimerRef = useRef<number | null>(null);
  const isAnsweringRef = useRef(false);

  // Keep callStateRef in sync
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // ==================== Initialize Media Stream ====================
  const initializeLocalStream = useCallback(
    async (constraints = DEFAULT_VIDEO_CONSTRAINTS) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        return stream;
      } catch (error) {
        console.error('Failed to get media stream:', error);
        throw new Error('Không thể truy cập camera/microphone');
      }
    },
    []
  );

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
    console.log('🔴 Ending video call');

    // Send end event to other user
    const currentState = callStateRef.current;
    if (currentState.isActive && currentState.targetUserId) {
      socketManager.emit('video_call_end', {
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

    // Stop screen sharing if active
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
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
      callType: 'video',
      isCameraOn: true,
      isMicOn: true,
      isScreenSharing: false,
      localVideoEnabled: true,
      remoteVideoEnabled: true,
    });
  }, []);

  // ==================== Create Peer Connection ====================
  const createPeerConnection = useCallback(() => {
    console.log('🔗 Creating peer connection');
    const pc = new RTCPeerConnection(RTC_CONFIG);

    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('📹 Received remote track:', event.track.kind);
      remoteStreamRef.current = event.streams[0];

      // Trigger re-render to update video elements
      setCallState((prev) => ({ ...prev }));
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const currentState = callStateRef.current;
        if (currentState.targetUserId) {
          socketManager.emit('video_call_ice_candidate', {
            targetUserId: currentState.targetUserId,
            candidate: event.candidate.toJSON(),
          });
        }
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('🔌 Connection state:', pc.connectionState);
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
        console.log('📞 Starting video call to:', targetUser.name);

        // Initialize media stream
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
          callType: 'video',
          isCameraOn: true,
          isMicOn: true,
          isScreenSharing: false,
          localVideoEnabled: true,
          remoteVideoEnabled: true,
        });

        // Create peer connection
        const pc = createPeerConnection();

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketManager.emit('video_call_offer', {
          targetUserId: targetUser.id,
          offer: pc.localDescription!.toJSON(),
          conversationId,
          hasVideo: true,
          hasAudio: true,
        });

        console.log('✅ Video call offer sent');
      } catch (error) {
        console.error('❌ Failed to start video call:', error);
        alert('Không thể bắt đầu cuộc gọi video: ' + (error as Error).message);
        endCall();
      }
    },
    [initializeLocalStream, createPeerConnection, endCall]
  );

  // ==================== Answer Incoming Call ====================
  const answerCall = useCallback(
    async (incomingData: IncomingVideoCallData) => {
      try {
        console.log('📞 Answering video call from:', incomingData.callerName);

        // Prevent duplicate answers
        if (isAnsweringRef.current || peerConnectionRef.current) {
          return;
        }

        isAnsweringRef.current = true;

        // Initialize media stream
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

        socketManager.emit('video_call_answer', {
          callerId: incomingData.callerId,
          answer: pc.localDescription!.toJSON(),
          hasVideo: true,
          hasAudio: true,
        });

        // Update state
        const newState: VideoCallState = {
          isActive: true,
          isIncoming: false,
          isOutgoing: false,
          isConnected: false,
          callerId: incomingData.callerId,
          targetUserId: incomingData.callerId,
          conversationId: incomingData.conversationId,
          duration: 0,
          callType: 'video',
          isCameraOn: true,
          isMicOn: true,
          isScreenSharing: false,
          localVideoEnabled: true,
          remoteVideoEnabled: true,
        };
        setCallState(newState);
        callStateRef.current = newState;

        console.log('✅ Video call answer sent');
      } catch (error) {
        console.error('❌ Failed to answer video call:', error);
        alert('Không thể trả lời cuộc gọi video');
        isAnsweringRef.current = false;
        endCall();
      }
    },
    [initializeLocalStream, createPeerConnection, endCall]
  );

  // ==================== Reject Call ====================
  const rejectCall = useCallback(
    (callerId: string, reason?: string) => {
      console.log('🚫 Rejecting video call');
      socketManager.emit('video_call_reject', {
        callerId,
        reason: reason || 'Call declined',
      });
      endCall();
    },
    [endCall]
  );

  // ==================== Toggle Camera ====================
  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;

    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCallState((prev) => ({
        ...prev,
        isCameraOn: videoTrack.enabled,
      }));

      // Notify other user
      if (callStateRef.current.targetUserId) {
        socketManager.emit('video_track_control', {
          targetUserId: callStateRef.current.targetUserId,
          trackType: 'video',
          enabled: videoTrack.enabled,
        });
      }
    }
  }, []);

  // ==================== Toggle Microphone ====================
  const toggleMicrophone = useCallback(() => {
    if (!localStreamRef.current) return;

    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setCallState((prev) => ({
        ...prev,
        isMicOn: audioTrack.enabled,
      }));

      // Notify other user
      if (callStateRef.current.targetUserId) {
        socketManager.emit('video_track_control', {
          targetUserId: callStateRef.current.targetUserId,
          trackType: 'audio',
          enabled: audioTrack.enabled,
        });
      }
    }
  }, []);

  // ==================== Toggle Screen Share ====================
  const toggleScreenShare = useCallback(async () => {
    if (!peerConnectionRef.current) return;

    try {
      const currentState = callStateRef.current;

      if (currentState.isScreenSharing) {
        // Stop screen sharing
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => track.stop());
          screenStreamRef.current = null;
        }

        // Switch back to camera
        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track?.kind === 'video');

          if (sender && videoTrack) {
            await sender.replaceTrack(videoTrack);
          }
        }

        setCallState((prev) => ({
          ...prev,
          isScreenSharing: false,
        }));

        // Notify other user
        if (currentState.targetUserId) {
          socketManager.emit('screen_share_control', {
            targetUserId: currentState.targetUserId,
            isSharing: false,
          });
        }
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia(
          SCREEN_SHARE_CONSTRAINTS
        );
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === 'video');

        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        // Handle screen share stop (when user clicks "Stop sharing" in browser UI)
        screenTrack.onended = () => {
          toggleScreenShare();
        };

        setCallState((prev) => ({
          ...prev,
          isScreenSharing: true,
        }));

        // Notify other user
        if (currentState.targetUserId) {
          socketManager.emit('screen_share_control', {
            targetUserId: currentState.targetUserId,
            isSharing: true,
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to toggle screen share:', error);
      alert('Không thể chia sẻ màn hình');
    }
  }, []);

  // ==================== Get Media Streams ====================
  const getLocalStream = useCallback(() => {
    return localStreamRef.current;
  }, []);

  const getRemoteStream = useCallback(() => {
    return remoteStreamRef.current;
  }, []);

  // ==================== Socket Event Handlers ====================
  useEffect(() => {
    // Incoming video call
    const handleIncomingVideoCall = (data: IncomingVideoCallData) => {
      console.log('📞 Incoming video call from:', data.callerName);

      // Prevent duplicate incoming calls
      if (callStateRef.current.isActive) {
        return;
      }

      setCallState({
        isActive: true,
        isIncoming: true,
        isOutgoing: false,
        isConnected: false,
        callerId: data.callerId,
        callerName: data.callerName,
        conversationId: data.conversationId,
        duration: 0,
        callType: 'video',
        isCameraOn: true,
        isMicOn: true,
        isScreenSharing: false,
        localVideoEnabled: true,
        remoteVideoEnabled: data.hasVideo,
      });

      // Store offer for later use
      (window as any).__incomingVideoCallData = data;
    };

    // Video call answer received
    const handleVideoCallAnswer = async (data: { answer: RTCSessionDescriptionInit }) => {
      console.log('✅ Video call answer received');

      if (!peerConnectionRef.current) {
        console.error('❌ No peer connection');
        return;
      }

      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      } catch (error) {
        console.error('❌ Failed to set remote description:', error);
        endCall();
      }
    };

    // ICE candidate received
    const handleVideoCallIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      if (!peerConnectionRef.current) {
        return;
      }

      try {
        await peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      } catch (error) {
        console.error('❌ Failed to add ICE candidate:', error);
      }
    };

    // Call ended
    const handleVideoCallEnd = () => {
      console.log('🔴 Video call ended by other user');
      endCall();
    };

    // Call rejected
    const handleVideoCallReject = (data: { reason: string }) => {
      console.log('🚫 Video call rejected:', data.reason);
      alert(`Cuộc gọi bị từ chối: ${data.reason}`);
      endCall();
    };

    // Video track control
    const handleVideoTrackControl = (data: VideoTrackControl) => {
      console.log('🎛️ Video track control:', data);
      setCallState((prev) => ({
        ...prev,
        remoteVideoEnabled: data.trackType === 'video' ? data.enabled : prev.remoteVideoEnabled,
      }));
    };

    // Screen share control
    const handleScreenShareControl = (data: ScreenShareControl) => {
      console.log('🖥️ Screen share control:', data);
      // Update UI to show screen sharing indicator
      setCallState((prev) => ({ ...prev }));
    };

    // Register event listeners
    socketManager.on('video_call_offer', handleIncomingVideoCall);
    socketManager.on('video_call_answer', handleVideoCallAnswer);
    socketManager.on('video_call_ice_candidate', handleVideoCallIceCandidate);
    socketManager.on('video_call_end', handleVideoCallEnd);
    socketManager.on('video_call_reject', handleVideoCallReject);
    socketManager.on('video_track_control', handleVideoTrackControl);
    socketManager.on('screen_share_control', handleScreenShareControl);

    // Cleanup
    return () => {
      socketManager.off('video_call_offer', handleIncomingVideoCall);
      socketManager.off('video_call_answer', handleVideoCallAnswer);
      socketManager.off('video_call_ice_candidate', handleVideoCallIceCandidate);
      socketManager.off('video_call_end', handleVideoCallEnd);
      socketManager.off('video_call_reject', handleVideoCallReject);
      socketManager.off('video_track_control', handleVideoTrackControl);
      socketManager.off('screen_share_control', handleScreenShareControl);
    };
  }, [endCall]);

  // ==================== Cleanup on Unmount ====================
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  // ==================== Return Hook Interface ====================
  return {
    // State
    callState,
    localStream: getLocalStream(),
    remoteStream: getRemoteStream(),

    // Call controls
    startCall,
    answerCall,
    rejectCall,
    endCall,

    // Media controls
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,

    // Utilities
    getLocalStream,
    getRemoteStream,
  };
}
