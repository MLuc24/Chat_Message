import { Server } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { AuthenticatedSocket } from './socket.gateway';

/**
 * Handler for 1:1 (direct) voice and video call signaling
 * Supports WebRTC peer-to-peer connections between two users
 */
export class DirectCallHandler {
  private server: Server;
  private redis: RedisService;

  constructor(server: Server, redis: RedisService) {
    this.server = server;
    this.redis = redis;
  }

  // ==================== Voice Call ====================

  async handleVoiceCallOffer(
    client: AuthenticatedSocket,
    data: {
      targetUserId: string;
      offer: RTCSessionDescriptionInit;
      conversationId: string;
    },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { targetUserId, offer, conversationId } = data;

    // Get target user's socket ID from Redis
    const targetSocketId = await this.redis.getSocketId(targetUserId);

    if (!targetSocketId) {
      client.emit('voice_call_failed', {
        reason: 'User is offline',
        targetUserId,
      });
      return;
    }

    // Forward offer to target user
    this.server.to(targetSocketId).emit('voice_call_incoming', {
      callerId: client.userId,
      callerEmail: client.userEmail,
      offer,
      conversationId,
      timestamp: new Date(),
    });
  }

  async handleVoiceCallAnswer(
    client: AuthenticatedSocket,
    data: {
      callerId: string;
      answer: RTCSessionDescriptionInit;
    },
  ) {
    if (!client.userId) return;

    const { callerId, answer } = data;

    // Get caller's socket ID
    const callerSocketId = await this.redis.getSocketId(callerId);

    if (!callerSocketId) {
      client.emit('voice_call_failed', { reason: 'Caller disconnected' });
      return;
    }

    // Forward answer to caller
    this.server.to(callerSocketId).emit('voice_call_answered', {
      answer,
      answeredBy: client.userId,
      timestamp: new Date(),
    });

    console.log(`✅ Voice call answered by ${client.userId} to ${callerId}`);
  }

  async handleVoiceCallIceCandidate(
    client: AuthenticatedSocket,
    data: {
      targetUserId: string;
      candidate: RTCIceCandidateInit;
    },
  ) {
    if (!client.userId) return;

    const { targetUserId, candidate } = data;

    // Get target user's socket ID
    const targetSocketId = await this.redis.getSocketId(targetUserId);

    if (targetSocketId) {
      this.server.to(targetSocketId).emit('voice_call_ice_candidate', {
        candidate,
        fromUserId: client.userId,
      });
    }
  }

  async handleVoiceCallReject(
    client: AuthenticatedSocket,
    data: { callerId: string; reason?: string },
  ) {
    if (!client.userId) return;

    const { callerId, reason } = data;

    // Get caller's socket ID
    const callerSocketId = await this.redis.getSocketId(callerId);

    if (callerSocketId) {
      this.server.to(callerSocketId).emit('voice_call_rejected', {
        rejectedBy: client.userId,
        reason: reason || 'Call declined',
        timestamp: new Date(),
      });
    }

    console.log(`❌ Voice call rejected by ${client.userId}`);
  }

  async handleVoiceCallEnd(
    client: AuthenticatedSocket,
    data: { targetUserId: string; duration?: number },
  ) {
    if (!client.userId) return;

    const { targetUserId, duration } = data;

    // Get target user's socket ID
    const targetSocketId = await this.redis.getSocketId(targetUserId);

    if (targetSocketId) {
      this.server.to(targetSocketId).emit('voice_call_ended', {
        endedBy: client.userId,
        duration,
        timestamp: new Date(),
      });
    }

    console.log(`📞 Voice call ended by ${client.userId}, duration: ${duration}s`);
  }

  // ==================== Video Call ====================

  async handleVideoCallOffer(
    client: AuthenticatedSocket,
    data: {
      targetUserId: string;
      offer: RTCSessionDescriptionInit;
      conversationId: string;
      hasVideo: boolean;
      hasAudio: boolean;
    },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { targetUserId, offer, conversationId, hasVideo, hasAudio } = data;

    // Get target user's socket ID from Redis
    const targetSocketId = await this.redis.getSocketId(targetUserId);

    if (!targetSocketId) {
      client.emit('video_call_failed', {
        reason: 'User is offline',
        targetUserId,
      });
      return;
    }

    // Get caller's name from authenticated socket
    const callerName = client.userEmail?.split('@')[0] || 'Unknown';

    // Forward offer to target user
    this.server.to(targetSocketId).emit('video_call_offer', {
      callerId: client.userId,
      callerEmail: client.userEmail,
      callerName,
      offer,
      conversationId,
      hasVideo,
      hasAudio,
      timestamp: new Date(),
    });

    console.log(`📹 Video call offer from ${client.userId} to ${targetUserId}`);
  }

  async handleVideoCallAnswer(
    client: AuthenticatedSocket,
    data: {
      callerId: string;
      answer: RTCSessionDescriptionInit;
      hasVideo: boolean;
      hasAudio: boolean;
    },
  ) {
    if (!client.userId) return;

    const { callerId, answer, hasVideo, hasAudio } = data;

    // Get caller's socket ID
    const callerSocketId = await this.redis.getSocketId(callerId);

    if (!callerSocketId) {
      client.emit('video_call_failed', { reason: 'Caller disconnected' });
      return;
    }

    // Forward answer to caller
    this.server.to(callerSocketId).emit('video_call_answer', {
      answer,
      answeredBy: client.userId,
      hasVideo,
      hasAudio,
      timestamp: new Date(),
    });

    console.log(`✅ Video call answered by ${client.userId} to ${callerId}`);
  }

  async handleVideoCallIceCandidate(
    client: AuthenticatedSocket,
    data: {
      targetUserId: string;
      candidate: RTCIceCandidateInit;
    },
  ) {
    if (!client.userId) return;

    const { targetUserId, candidate } = data;

    // Get target user's socket ID
    const targetSocketId = await this.redis.getSocketId(targetUserId);

    if (targetSocketId) {
      this.server.to(targetSocketId).emit('video_call_ice_candidate', {
        candidate,
        fromUserId: client.userId,
      });
    }
  }

  async handleVideoCallReject(
    client: AuthenticatedSocket,
    data: { callerId: string; reason?: string },
  ) {
    if (!client.userId) return;

    const { callerId, reason } = data;

    // Get caller's socket ID
    const callerSocketId = await this.redis.getSocketId(callerId);

    if (callerSocketId) {
      this.server.to(callerSocketId).emit('video_call_reject', {
        rejectedBy: client.userId,
        reason: reason || 'Call declined',
        timestamp: new Date(),
      });
    }

    console.log(`❌ Video call rejected by ${client.userId}`);
  }

  async handleVideoCallEnd(
    client: AuthenticatedSocket,
    data: { targetUserId: string; duration?: number },
  ) {
    if (!client.userId) return;

    const { targetUserId, duration } = data;

    // Get target user's socket ID
    const targetSocketId = await this.redis.getSocketId(targetUserId);

    if (targetSocketId) {
      this.server.to(targetSocketId).emit('video_call_end', {
        endedBy: client.userId,
        duration,
        timestamp: new Date(),
      });
    }

    console.log(`📹 Video call ended by ${client.userId}, duration: ${duration}s`);
  }

  async handleVideoTrackControl(
    client: AuthenticatedSocket,
    data: {
      targetUserId: string;
      trackType: 'video' | 'audio';
      enabled: boolean;
    },
  ) {
    if (!client.userId) return;

    const { targetUserId, trackType, enabled } = data;

    // Get target user's socket ID
    const targetSocketId = await this.redis.getSocketId(targetUserId);

    if (targetSocketId) {
      this.server.to(targetSocketId).emit('video_track_control', {
        userId: client.userId,
        trackType,
        enabled,
      });
    }

    console.log(
      `🎛️ Video track control: ${client.userId} ${trackType} ${enabled ? 'enabled' : 'disabled'}`,
    );
  }

  async handleScreenShareControl(
    client: AuthenticatedSocket,
    data: {
      targetUserId: string;
      isSharing: boolean;
    },
  ) {
    if (!client.userId) return;

    const { targetUserId, isSharing } = data;

    // Get target user's socket ID
    const targetSocketId = await this.redis.getSocketId(targetUserId);

    if (targetSocketId) {
      this.server.to(targetSocketId).emit('screen_share_control', {
        userId: client.userId,
        isSharing,
      });
    }

    console.log(
      `🖥️ Screen share: ${client.userId} ${isSharing ? 'started' : 'stopped'}`,
    );
  }
}
