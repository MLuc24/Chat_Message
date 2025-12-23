// Group Call Handler for Multi-Party WebRTC Calls

import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

interface GroupCall {
  callId: string;
  conversationId: string;
  conversationName?: string;
  callType: 'voice' | 'video';
  initiatorId: string;
  initiatorName: string;
  participants: Set<string>;
  createdAt: Date;
}

interface GroupCallSignal {
  callId: string;
  fromUserId: string;
  toUserId: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

/**
 * Handler for group call signaling
 * Uses mesh topology - each participant connects to all others
 */
export class GroupCallHandler {
  // Active group calls: callId -> GroupCall
  private activeCalls = new Map<string, GroupCall>();

  constructor(
    private server: Server,
    private redis: RedisService,
  ) {}

  /**
   * Start a new group call
   */
  async handleStartGroupCall(
    client: AuthenticatedSocket,
    data: {
      conversationId: string;
      conversationName?: string;
      callType: 'voice' | 'video';
      participantIds: string[];
    },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { conversationId, conversationName, callType, participantIds } = data;
    
    // Generate unique call ID
    const callId = `gc_${conversationId}_${Date.now()}`;
    
    // Create group call record
    const groupCall: GroupCall = {
      callId,
      conversationId,
      conversationName,
      callType,
      initiatorId: client.userId,
      initiatorName: client.userEmail?.split('@')[0] || 'Unknown',
      participants: new Set([client.userId]),
      createdAt: new Date(),
    };
    
    this.activeCalls.set(callId, groupCall);

    // Store call in Redis for persistence
    await this.redis.getClient().setex(
      `group_call:${callId}`,
      3600, // 1 hour TTL
      JSON.stringify({
        ...groupCall,
        participants: [client.userId],
      }),
    );

    console.log(`📞 Group ${callType} call started: ${callId} by ${client.userId}`);

    // Notify all participants about incoming call
    const offlineUsers: string[] = [];
    
    for (const participantId of participantIds) {
      if (participantId === client.userId) continue;
      
      const socketId = await this.redis.getSocketId(participantId);
      
      if (socketId) {
        this.server.to(socketId).emit('group_call_incoming', {
          callId,
          conversationId,
          conversationName,
          callType,
          initiatorId: client.userId,
          initiatorName: groupCall.initiatorName,
          participants: participantIds,
          timestamp: new Date(),
        });
        console.log(`📞 Sent group call invite to ${participantId}`);
      } else {
        offlineUsers.push(participantId);
      }
    }

    // Notify initiator about call created
    client.emit('group_call_created', {
      callId,
      conversationId,
      conversationName,
      callType,
      participants: participantIds,
      offlineUsers,
    });
  }

  /**
   * Join an existing group call
   */
  async handleJoinGroupCall(
    client: AuthenticatedSocket,
    data: {
      callId: string;
    },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { callId } = data;
    const groupCall = this.activeCalls.get(callId);

    if (!groupCall) {
      client.emit('group_call_error', {
        callId,
        error: 'Call not found or ended',
      });
      return;
    }

    // Get current participants before adding new one
    const existingParticipants = Array.from(groupCall.participants);
    
    // Add participant
    groupCall.participants.add(client.userId);

    // Update Redis
    await this.updateCallInRedis(groupCall);

    const userName = client.userEmail?.split('@')[0] || 'Unknown';

    console.log(`✅ User ${client.userId} joined group call ${callId}`);

    // Notify existing participants that someone joined
    for (const participantId of existingParticipants) {
      const socketId = await this.redis.getSocketId(participantId);
      if (socketId) {
        this.server.to(socketId).emit('group_call_participant_joined', {
          callId,
          odId: client.userId,
          odName: userName,
          timestamp: new Date(),
        });
      }
    }

    // Send list of existing participants to the new joiner with their info
    const participantsWithInfo = await Promise.all(
      existingParticipants.map(async (participantId) => {
        // Try to get user info from socket
        const socketId = await this.redis.getSocketId(participantId);
        let participantName = 'Unknown';
        
        if (socketId) {
          // Find socket to get email
          const sockets = await this.server.fetchSockets();
          const participantSocket = sockets.find(s => s.id === socketId) as any;
          if (participantSocket?.userEmail) {
            participantName = participantSocket.userEmail.split('@')[0];
          }
        }
        
        return {
          odId: participantId,
          odName: participantName,
        };
      })
    );

    client.emit('group_call_joined', {
      callId,
      existingParticipants: participantsWithInfo,
      callType: groupCall.callType,
      conversationId: groupCall.conversationId,
    });
  }

  /**
   * Leave a group call
   */
  async handleLeaveGroupCall(
    client: AuthenticatedSocket,
    data: {
      callId: string;
      reason?: string;
    },
  ) {
    if (!client.userId) return;

    const { callId, reason } = data;
    const groupCall = this.activeCalls.get(callId);

    if (!groupCall) return;

    groupCall.participants.delete(client.userId);

    console.log(`🚪 User ${client.userId} left group call ${callId}`);

    // Notify remaining participants
    for (const participantId of groupCall.participants) {
      const socketId = await this.redis.getSocketId(participantId);
      if (socketId) {
        this.server.to(socketId).emit('group_call_participant_left', {
          callId,
          odId: client.userId,
          reason: reason || 'left',
          timestamp: new Date(),
        });
      }
    }

    // If no participants left, end the call
    if (groupCall.participants.size === 0) {
      await this.endGroupCall(callId);
    } else {
      await this.updateCallInRedis(groupCall);
    }
  }

  /**
   * Handle WebRTC signaling between participants
   */
  async handleGroupCallSignal(
    client: AuthenticatedSocket,
    data: GroupCallSignal,
  ) {
    if (!client.userId) return;

    const { callId, toUserId, type, data: signalData } = data;

    const targetSocketId = await this.redis.getSocketId(toUserId);
    
    if (targetSocketId) {
      this.server.to(targetSocketId).emit('group_call_signal', {
        callId,
        fromUserId: client.userId,
        type,
        data: signalData,
      });
    }
  }

  /**
   * Reject an incoming group call
   */
  async handleRejectGroupCall(
    client: AuthenticatedSocket,
    data: {
      callId: string;
      reason?: string;
    },
  ) {
    if (!client.userId) return;

    const { callId, reason } = data;
    const groupCall = this.activeCalls.get(callId);

    if (!groupCall) return;

    console.log(`❌ User ${client.userId} rejected group call ${callId}`);

    // Notify initiator that user rejected
    const initiatorSocketId = await this.redis.getSocketId(groupCall.initiatorId);
    if (initiatorSocketId) {
      this.server.to(initiatorSocketId).emit('group_call_rejected', {
        callId,
        rejectedBy: client.userId,
        reason: reason || 'declined',
        timestamp: new Date(),
      });
    }
  }

  /**
   * End a group call (by initiator or last participant)
   */
  async handleEndGroupCall(
    client: AuthenticatedSocket,
    data: {
      callId: string;
    },
  ) {
    if (!client.userId) return;

    const { callId } = data;
    const groupCall = this.activeCalls.get(callId);

    if (!groupCall) return;

    console.log(`🔴 Group call ${callId} ended by ${client.userId}`);

    // Notify all participants
    for (const participantId of groupCall.participants) {
      if (participantId === client.userId) continue;
      
      const socketId = await this.redis.getSocketId(participantId);
      if (socketId) {
        this.server.to(socketId).emit('group_call_ended', {
          callId,
          endedBy: client.userId,
          timestamp: new Date(),
        });
      }
    }

    await this.endGroupCall(callId);
  }

  /**
   * Handle track control (mute/camera toggle)
   */
  async handleGroupCallTrackControl(
    client: AuthenticatedSocket,
    data: {
      callId: string;
      trackType: 'video' | 'audio';
      enabled: boolean;
    },
  ) {
    if (!client.userId) return;

    const { callId, trackType, enabled } = data;
    const groupCall = this.activeCalls.get(callId);

    if (!groupCall) return;

    // Notify all other participants
    for (const participantId of groupCall.participants) {
      if (participantId === client.userId) continue;
      
      const socketId = await this.redis.getSocketId(participantId);
      if (socketId) {
        this.server.to(socketId).emit('group_call_track_control', {
          callId,
          odId: client.userId,
          trackType,
          enabled,
        });
      }
    }
  }

  /**
   * Handle screen share control
   */
  async handleGroupCallScreenShare(
    client: AuthenticatedSocket,
    data: {
      callId: string;
      isSharing: boolean;
    },
  ) {
    if (!client.userId) return;

    const { callId, isSharing } = data;
    const groupCall = this.activeCalls.get(callId);

    if (!groupCall) return;

    // Notify all other participants
    for (const participantId of groupCall.participants) {
      if (participantId === client.userId) continue;
      
      const socketId = await this.redis.getSocketId(participantId);
      if (socketId) {
        this.server.to(socketId).emit('group_call_screen_share', {
          callId,
          odId: client.userId,
          isSharing,
        });
      }
    }
  }

  /**
   * Cleanup when user disconnects
   */
  async handleUserDisconnect(userId: string) {
    for (const [callId, groupCall] of this.activeCalls) {
      if (groupCall.participants.has(userId)) {
        groupCall.participants.delete(userId);
        
        // Notify remaining participants
        for (const participantId of groupCall.participants) {
          const socketId = await this.redis.getSocketId(participantId);
          if (socketId) {
            this.server.to(socketId).emit('group_call_participant_left', {
              callId,
              odId: userId,
              reason: 'disconnected',
              timestamp: new Date(),
            });
          }
        }

        if (groupCall.participants.size === 0) {
          await this.endGroupCall(callId);
        } else {
          await this.updateCallInRedis(groupCall);
        }
      }
    }
  }

  // ==================== Private Helpers ====================

  private async updateCallInRedis(groupCall: GroupCall) {
    await this.redis.getClient().setex(
      `group_call:${groupCall.callId}`,
      3600,
      JSON.stringify({
        ...groupCall,
        participants: Array.from(groupCall.participants),
      }),
    );
  }

  private async endGroupCall(callId: string) {
    this.activeCalls.delete(callId);
    await this.redis.getClient().del(`group_call:${callId}`);
    console.log(`🔴 Group call ${callId} has ended`);
  }
}
