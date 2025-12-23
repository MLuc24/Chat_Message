// Custom Hook for Group Voice Call with WebRTC (Mesh Topology)

import { useState, useEffect, useCallback, useRef } from 'react';
import { socketManager } from '@/services/websocket/socketManager';
import { useAuthStore } from '@/stores/authStore';
import type {
  GroupCallState,
  GroupCallOfferData,
} from '@/types/call.types';

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

export function useGroupVoiceCall() {
  const { user } = useAuthStore();
  const [callState, setCallState] = useState<GroupCallState>({
    isActive: false,
    isIncoming: false,
    isOutgoing: false,
    isConnected: false,
    callType: 'voice',
    participants: [],
    duration: 0,
    isMuted: false,
    isCameraOn: false,
    isScreenSharing: false,
  });

  // Refs
  const callStateRef = useRef(callState);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());
  const durationTimerRef = useRef<number | null>(null);
  const pendingOfferRef = useRef<GroupCallOfferData | null>(null);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

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
    
    // Close all peer connections
    peerConnectionsRef.current.forEach(({ pc }) => pc.close());
    peerConnectionsRef.current.clear();
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    
    pendingOfferRef.current = null;
    
    setCallState({
      isActive: false,
      isIncoming: false,
      isOutgoing: false,
      isConnected: false,
      callType: 'voice',
      participants: [],
      duration: 0,
      isMuted: false,
      isCameraOn: false,
      isScreenSharing: false,
    });
  }, [stopDurationTimer]);

  // ==================== Create Peer Connection ====================
  const createPeerConnection = useCallback((targetUserId: string): RTCPeerConnection => {
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

      // Play audio
      const audio = new Audio();
      audio.srcObject = stream;
      audio.play().catch(console.error);

      // Update participant
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
  }, [user?.id, startDurationTimer]);

  // ==================== Start Group Call ====================
  const startCall = useCallback(
    async (conversationId: string, conversationName: string, participantIds: string[]) => {
      try {
        await initializeLocalStream();

        setCallState({
          isActive: true,
          isIncoming: false,
          isOutgoing: true,
          isConnected: false,
          callType: 'voice',
          conversationId,
          conversationName,
          participants: participantIds
            .filter((id) => id !== user?.id)
            .map((id) => ({
              odId: id,
              odName: '',
              isConnected: false,
              isMuted: false,
            })),
          duration: 0,
          isMuted: false,
          isCameraOn: false,
          isScreenSharing: false,
        });

        socketManager.emit('group_call_start', {
          conversationId,
          conversationName,
          callType: 'voice',
          participantIds: participantIds.filter((id) => id !== user?.id),
        });
      } catch (error) {
        console.error('Failed to start group voice call:', error);
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
      console.error('Failed to answer group call:', error);
      cleanup();
    }
  }, [initializeLocalStream, cleanup]);

  // ==================== Reject Group Call ====================
  const rejectCall = useCallback(() => {
    const offer = pendingOfferRef.current;
    if (offer) {
      socketManager.emit('group_call_reject', {
        callId: offer.callId,
        reason: 'declined',
      });
    }
    cleanup();
  }, [cleanup]);

  // ==================== End Group Call ====================
  const endCall = useCallback(() => {
    const { callId } = callStateRef.current;
    if (callId) {
      socketManager.emit('group_call_end', { callId });
    }
    cleanup();
  }, [cleanup]);

  // ==================== Leave Group Call ====================
  const leaveCall = useCallback(() => {
    const { callId } = callStateRef.current;
    if (callId) {
      socketManager.emit('group_call_leave', { callId, reason: 'left' });
    }
    cleanup();
  }, [cleanup]);

  // ==================== Toggle Mute ====================
  const toggleMute = useCallback(() => {
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

  // ==================== Socket Event Handlers ====================
  useEffect(() => {
    const handleIncomingCall = (data: GroupCallOfferData) => {
      if (callStateRef.current.isActive) return;
      pendingOfferRef.current = data;

      setCallState({
        isActive: true,
        isIncoming: true,
        isOutgoing: false,
        isConnected: false,
        callType: 'voice',
        callId: data.callId,
        conversationId: data.conversationId,
        conversationName: data.conversationName,
        initiatorId: data.initiatorId,
        initiatorName: data.initiatorName,
        participants: [],
        duration: 0,
        isMuted: false,
        isCameraOn: false,
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
              ? { odId: p, odName: 'Unknown', isConnected: false, isMuted: false }
              : { odId: p.odId, odName: p.odName, isConnected: false, isMuted: false }
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
          { odId: data.odId, odName: data.odName, isConnected: false, isMuted: false },
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

    const handleCallEnded = () => {
      cleanup();
    };

    const handleTrackControl = (data: { odId: string; trackType: string; enabled: boolean }) => {
      if (data.trackType === 'audio') {
        setCallState((prev) => ({
          ...prev,
          participants: prev.participants.map((p) =>
            p.odId === data.odId ? { ...p, isMuted: !data.enabled } : p
          ),
        }));
      }
    };

    // Register listeners
    socketManager.on('group_call_incoming', handleIncomingCall);
    socketManager.on('group_call_created', handleCallCreated);
    socketManager.on('group_call_joined', handleCallJoined);
    socketManager.on('group_call_participant_joined', handleParticipantJoined);
    socketManager.on('group_call_participant_left', handleParticipantLeft);
    socketManager.on('group_call_signal', handleSignal);
    socketManager.on('group_call_ended', handleCallEnded);
    socketManager.on('group_call_track_control', handleTrackControl);

    return () => {
      socketManager.off('group_call_incoming', handleIncomingCall);
      socketManager.off('group_call_created', handleCallCreated);
      socketManager.off('group_call_joined', handleCallJoined);
      socketManager.off('group_call_participant_joined', handleParticipantJoined);
      socketManager.off('group_call_participant_left', handleParticipantLeft);
      socketManager.off('group_call_signal', handleSignal);
      socketManager.off('group_call_ended', handleCallEnded);
      socketManager.off('group_call_track_control', handleTrackControl);
    };
  }, [user?.id, createPeerConnection, cleanup]);

  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    callState,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    leaveCall,
    toggleMute,
  };
}
