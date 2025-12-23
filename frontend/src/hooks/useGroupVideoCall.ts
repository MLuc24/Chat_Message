// Custom Hook for Group Video Call with WebRTC (Mesh Topology)

import { useState, useEffect, useCallback, useRef } from 'react';
import { socketManager } from '@/services/websocket/socketManager';
import { useAuthStore } from '@/stores/authStore';
import type {
  GroupCallState,
  GroupCallOfferData,
} from '@/types/call.types';
import { DEFAULT_VIDEO_CONSTRAINTS, SCREEN_SHARE_CONSTRAINTS } from '@/types/call.types';

// WebRTC Configuration
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

interface PeerConnection {
  odId: string;
  pc: RTCPeerConnection;
  stream?: MediaStream;
}

export function useGroupVideoCall() {
  const { user } = useAuthStore();
  const [callState, setCallState] = useState<GroupCallState>({
    isActive: false,
    isIncoming: false,
    isOutgoing: false,
    isConnected: false,
    callType: 'video',
    participants: [],
    duration: 0,
    isMuted: false,
    isCameraOn: true,
    isScreenSharing: false,
  });

  // Refs
  const callStateRef = useRef(callState);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const durationTimerRef = useRef<number | null>(null);
  const pendingOfferRef = useRef<GroupCallOfferData | null>(null);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // ==================== Initialize Media Stream ====================
  const initializeLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(DEFAULT_VIDEO_CONSTRAINTS);
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('Failed to get media stream:', error);
      throw new Error('Không thể truy cập camera/microphone');
    }
  }, []);

  // ==================== Duration Timer ====================
  const startDurationTimer = useCallback(() => {
    if (durationTimerRef.current) return;
    durationTimerRef.current = window.setInterval(() => {
      setCallState((prev) => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, []);

  // ==================== Cleanup ====================
  const cleanup = useCallback(() => {
    stopDurationTimer();

    peerConnectionsRef.current.forEach(({ pc }) => pc.close());
    peerConnectionsRef.current.clear();

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    pendingOfferRef.current = null;

    setCallState({
      isActive: false,
      isIncoming: false,
      isOutgoing: false,
      isConnected: false,
      callType: 'video',
      participants: [],
      duration: 0,
      isMuted: false,
      isCameraOn: true,
      isScreenSharing: false,
    });
  }, [stopDurationTimer]);

  // ==================== Create Peer Connection ====================
  const createPeerConnection = useCallback(
    (targetUserId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection(RTC_CONFIG);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        const conn = peerConnectionsRef.current.get(targetUserId);
        if (conn) conn.stream = stream;

        setCallState((prev) => ({
          ...prev,
          participants: prev.participants.map((p) =>
            p.odId === targetUserId ? { ...p, isConnected: true, stream } : p
          ),
        }));
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && callStateRef.current.callId) {
          socketManager.emit('group_call_signal', {
            callId: callStateRef.current.callId,
            fromUserId: user?.id,
            toUserId: targetUserId,
            type: 'ice-candidate',
            data: event.candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setCallState((prev) => {
            const connectedCount = prev.participants.filter((p) => p.isConnected).length;
            return {
              ...prev,
              isConnected: connectedCount > 0,
              participants: prev.participants.map((p) =>
                p.odId === targetUserId ? { ...p, isConnected: true } : p
              ),
            };
          });
          startDurationTimer();
        } else if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
          peerConnectionsRef.current.delete(targetUserId);
          setCallState((prev) => ({
            ...prev,
            participants: prev.participants.filter((p) => p.odId !== targetUserId),
          }));
        }
      };

      peerConnectionsRef.current.set(targetUserId, { odId: targetUserId, pc });
      return pc;
    },
    [user?.id, startDurationTimer]
  );

  // ==================== Start Group Video Call ====================
  const startCall = useCallback(
    async (conversationId: string, conversationName: string, participantIds: string[]) => {
      try {
        await initializeLocalStream();

        setCallState({
          isActive: true,
          isIncoming: false,
          isOutgoing: true,
          isConnected: false,
          callType: 'video',
          conversationId,
          conversationName,
          participants: participantIds
            .filter((id) => id !== user?.id)
            .map((id) => ({
              odId: id,
              odName: '',
              isConnected: false,
              isMuted: false,
              isCameraOn: true,
            })),
          duration: 0,
          isMuted: false,
          isCameraOn: true,
          isScreenSharing: false,
        });

        socketManager.emit('group_call_start', {
          conversationId,
          conversationName,
          callType: 'video',
          participantIds: participantIds.filter((id) => id !== user?.id),
        });
      } catch (error) {
        console.error('Failed to start group video call:', error);
        cleanup();
        throw error;
      }
    },
    [user?.id, initializeLocalStream, cleanup]
  );

  // ==================== Answer Group Call ====================
  const answerCall = useCallback(async () => {
    const offer = pendingOfferRef.current;
    if (!offer) return;

    try {
      await initializeLocalStream();

      setCallState((prev) => ({
        ...prev,
        isIncoming: false,
        isOutgoing: false,
        callId: offer.callId,
      }));

      socketManager.emit('group_call_join', { callId: offer.callId });
    } catch (error) {
      console.error('Failed to answer group video call:', error);
      cleanup();
    }
  }, [initializeLocalStream, cleanup]);

  // ==================== Reject / End / Leave ====================
  const rejectCall = useCallback(() => {
    const offer = pendingOfferRef.current;
    if (offer) {
      socketManager.emit('group_call_reject', { callId: offer.callId, reason: 'declined' });
    }
    cleanup();
  }, [cleanup]);

  const endCall = useCallback(() => {
    const { callId } = callStateRef.current;
    if (callId) {
      socketManager.emit('group_call_end', { callId });
    }
    cleanup();
  }, [cleanup]);

  const leaveCall = useCallback(() => {
    const { callId } = callStateRef.current;
    if (callId) {
      socketManager.emit('group_call_leave', { callId, reason: 'left' });
    }
    cleanup();
  }, [cleanup]);

  // ==================== Toggle Controls ====================
  const toggleMicrophone = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setCallState((prev) => ({ ...prev, isMuted: !audioTrack.enabled }));

      const { callId } = callStateRef.current;
      if (callId) {
        socketManager.emit('group_call_track_control', {
          callId,
          trackType: 'audio',
          enabled: audioTrack.enabled,
        });
      }
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCallState((prev) => ({ ...prev, isCameraOn: videoTrack.enabled }));

      const { callId } = callStateRef.current;
      if (callId) {
        socketManager.emit('group_call_track_control', {
          callId,
          trackType: 'video',
          enabled: videoTrack.enabled,
        });
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    const { callId, isScreenSharing } = callStateRef.current;
    if (!callId) return;

    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((t) => t.stop());
          screenStreamRef.current = null;
        }

        // Replace screen track with camera track
        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          peerConnectionsRef.current.forEach(({ pc }) => {
            const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
            if (sender && videoTrack) sender.replaceTrack(videoTrack);
          });
        }

        setCallState((prev) => ({ ...prev, isScreenSharing: false }));
        socketManager.emit('group_call_screen_share', { callId, isSharing: false });
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia(SCREEN_SHARE_CONSTRAINTS);
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        peerConnectionsRef.current.forEach(({ pc }) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        screenTrack.onended = () => toggleScreenShare();

        setCallState((prev) => ({ ...prev, isScreenSharing: true }));
        socketManager.emit('group_call_screen_share', { callId, isSharing: true });
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
    }
  }, []);

  // ==================== Get Streams ====================
  const getLocalStream = useCallback(() => localStreamRef.current, []);

  const getParticipantStreams = useCallback((): Map<string, MediaStream | undefined> => {
    const streams = new Map<string, MediaStream | undefined>();
    peerConnectionsRef.current.forEach((conn, odId) => {
      streams.set(odId, conn.stream);
    });
    return streams;
  }, []);

  // ==================== Socket Event Handlers ====================
  useEffect(() => {
    const handleIncomingCall = (data: GroupCallOfferData) => {
      if (data.callType !== 'video') return;
      if (callStateRef.current.isActive) return;
      pendingOfferRef.current = data;

      setCallState({
        isActive: true,
        isIncoming: true,
        isOutgoing: false,
        isConnected: false,
        callType: 'video',
        callId: data.callId,
        conversationId: data.conversationId,
        conversationName: data.conversationName,
        initiatorId: data.initiatorId,
        initiatorName: data.initiatorName,
        participants: [],
        duration: 0,
        isMuted: false,
        isCameraOn: true,
        isScreenSharing: false,
      });
    };

    const handleCallCreated = (data: { callId: string }) => {
      setCallState((prev) => ({ ...prev, callId: data.callId }));
    };

    const handleCallJoined = async (data: { 
      callId: string; 
      existingParticipants: Array<{ odId: string; odName: string }> | string[];
    }) => {
      setCallState((prev) => ({ ...prev, callId: data.callId, isConnected: true }));

      // Handle both old format (string[]) and new format (object[])
      const participants = Array.isArray(data.existingParticipants) 
        ? data.existingParticipants.map(p => 
            typeof p === 'string' 
              ? { odId: p, odName: 'Unknown', isConnected: false, isMuted: false, isCameraOn: true }
              : { odId: p.odId, odName: p.odName, isConnected: false, isMuted: false, isCameraOn: true }
          )
        : [];

      setCallState((prev) => ({
        ...prev,
        participants: [...prev.participants, ...participants],
      }));

      // Create offers to all existing participants
      const participantIds = participants.map(p => p.odId);
      for (const odId of participantIds) {
        const pc = createPeerConnection(odId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketManager.emit('group_call_signal', {
          callId: data.callId,
          fromUserId: user?.id,
          toUserId: odId,
          type: 'offer',
          data: offer,
        });
      }
    };

    const handleParticipantJoined = (data: { callId: string; odId: string; odName: string }) => {
      setCallState((prev) => ({
        ...prev,
        participants: [
          ...prev.participants.filter((p) => p.odId !== data.odId),
          { odId: data.odId, odName: data.odName, isConnected: false, isMuted: false, isCameraOn: true },
        ],
      }));
    };

    const handleParticipantLeft = (data: { odId: string }) => {
      const conn = peerConnectionsRef.current.get(data.odId);
      if (conn) {
        conn.pc.close();
        peerConnectionsRef.current.delete(data.odId);
      }
      setCallState((prev) => ({
        ...prev,
        participants: prev.participants.filter((p) => p.odId !== data.odId),
      }));
    };

    const handleSignal = async (data: {
      callId: string;
      fromUserId: string;
      type: 'offer' | 'answer' | 'ice-candidate';
      data: RTCSessionDescriptionInit | RTCIceCandidateInit;
    }) => {
      const { fromUserId, type, data: signalData } = data;

      try {
        if (type === 'offer') {
          const pc = createPeerConnection(fromUserId);
          if (pc.signalingState !== 'stable') {
            console.warn('Ignoring offer in non-stable state:', pc.signalingState);
            return;
          }
          await pc.setRemoteDescription(new RTCSessionDescription(signalData as RTCSessionDescriptionInit));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socketManager.emit('group_call_signal', {
            callId: data.callId,
            fromUserId: user?.id,
            toUserId: fromUserId,
            type: 'answer',
            data: answer,
          });
        } else if (type === 'answer') {
          const conn = peerConnectionsRef.current.get(fromUserId);
          if (conn) {
            if (conn.pc.signalingState !== 'have-local-offer') {
              console.warn('Ignoring answer in wrong state:', conn.pc.signalingState);
              return;
            }
            await conn.pc.setRemoteDescription(new RTCSessionDescription(signalData as RTCSessionDescriptionInit));
          }
        } else if (type === 'ice-candidate') {
          const conn = peerConnectionsRef.current.get(fromUserId);
          if (conn && signalData) {
            if (conn.pc.remoteDescription && conn.pc.remoteDescription.type) {
              await conn.pc.addIceCandidate(new RTCIceCandidate(signalData as RTCIceCandidateInit));
            }
          }
        }
      } catch (error) {
        // Silently ignore errors to avoid console spam
      }
    };

    const handleCallEnded = () => cleanup();

    const handleTrackControl = (data: { odId: string; trackType: string; enabled: boolean }) => {
      setCallState((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.odId === data.odId
            ? {
                ...p,
                isMuted: data.trackType === 'audio' ? !data.enabled : p.isMuted,
                isCameraOn: data.trackType === 'video' ? data.enabled : p.isCameraOn,
              }
            : p
        ),
      }));
    };

    const handleScreenShare = (data: { odId: string; isSharing: boolean }) => {
      setCallState((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.odId === data.odId ? { ...p, isScreenSharing: data.isSharing } : p
        ),
      }));
    };

    socketManager.on('group_call_incoming', handleIncomingCall);
    socketManager.on('group_call_created', handleCallCreated);
    socketManager.on('group_call_joined', handleCallJoined);
    socketManager.on('group_call_participant_joined', handleParticipantJoined);
    socketManager.on('group_call_participant_left', handleParticipantLeft);
    socketManager.on('group_call_signal', handleSignal);
    socketManager.on('group_call_ended', handleCallEnded);
    socketManager.on('group_call_track_control', handleTrackControl);
    socketManager.on('group_call_screen_share', handleScreenShare);

    return () => {
      socketManager.off('group_call_incoming', handleIncomingCall);
      socketManager.off('group_call_created', handleCallCreated);
      socketManager.off('group_call_joined', handleCallJoined);
      socketManager.off('group_call_participant_joined', handleParticipantJoined);
      socketManager.off('group_call_participant_left', handleParticipantLeft);
      socketManager.off('group_call_signal', handleSignal);
      socketManager.off('group_call_ended', handleCallEnded);
      socketManager.off('group_call_track_control', handleTrackControl);
      socketManager.off('group_call_screen_share', handleScreenShare);
    };
  }, [user?.id, createPeerConnection, cleanup]);

  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    callState,
    localStream: getLocalStream(),
    startCall,
    answerCall,
    rejectCall,
    endCall,
    leaveCall,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    getLocalStream,
    getParticipantStreams,
  };
}
