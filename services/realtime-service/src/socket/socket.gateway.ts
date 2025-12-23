import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { DirectCallHandler } from './direct-call.handler';
import { GroupCallHandler } from './group-call.handler';
import * as jwt from 'jsonwebtoken';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private authenticatedSockets = new Map<string, AuthenticatedSocket>();
  private directCallHandler: DirectCallHandler;
  private groupCallHandler: GroupCallHandler;

  constructor(private readonly redis: RedisService) {
    // Register message handler for Redis pub/sub
    this.redis.setMessageHandler((conversationId, message, memberIds) => {
      this.broadcastMessageToParticipants(conversationId, message, memberIds);
    });

    // Register group event handler for Redis pub/sub
    this.redis.setGroupEventHandler((event) => {
      this.broadcastGroupEventToParticipants(event);
    });
  }

  afterInit() {
    // Initialize call handlers after server is ready
    this.directCallHandler = new DirectCallHandler(this.server, this.redis);
    this.groupCallHandler = new GroupCallHandler(this.server, this.redis);
  }

  async handleConnection(client: AuthenticatedSocket) {
    console.log(`Client connecting: ${client.id}`);
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.id}`);

    if (client.userId) {
      // Handle group call cleanup
      if (this.groupCallHandler) {
        await this.groupCallHandler.handleUserDisconnect(client.userId);
      }

      // Leave all rooms
      const rooms = Array.from(client.rooms);
      rooms.forEach((room) => {
        if (room !== client.id) {
          client.leave(room);
        }
      });

      // Remove from authenticated sockets
      this.authenticatedSockets.delete(client.id);

      // Set user offline in Redis
      await this.redis.setUserOffline(client.userId);
      await this.redis.removeSocketId(client.userId);

      // Broadcast presence update
      this.server.emit('presence_update', {
        userId: client.userId,
        status: 'offline',
        timestamp: new Date(),
      });
    }
  }

  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { token: string },
  ) {
    try {
      const { token } = data;

      if (!token) {
        client.emit('unauthorized', { message: 'No token provided' });
        return;
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      const decoded = jwt.verify(token, jwtSecret) as any;

      // Attach user info to socket
      client.userId = decoded.sub; // JWT uses 'sub' for user ID
      client.userEmail = decoded.email;

      // Store in authenticated sockets
      this.authenticatedSockets.set(client.id, client);

      // Set user online in Redis
      await this.redis.setUserOnline(client.userId);
      await this.redis.setSocketId(client.userId, client.id);

      // Notify client
      client.emit('authenticated', {
        userId: client.userId,
        email: client.userEmail,
      });

      // Broadcast presence
      this.server.emit('presence_update', {
        userId: client.userId,
        status: 'online',
        timestamp: new Date(),
      });

      console.log(`✅ User authenticated: ${client.userId}`);
    } catch (error) {
      console.error('Authentication error:', error.message);
      client.emit('unauthorized', { message: 'Invalid token' });
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { conversationId } = data;
    
    // Check if already in room to prevent duplicate joins
    const rooms = Array.from(client.rooms);
    if (rooms.includes(conversationId)) {
      console.log(`User ${client.userId} already in conversation ${conversationId}`);
      return;
    }

    await client.join(conversationId);
    console.log(`User ${client.userId} joined conversation ${conversationId}`);
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { conversationId } = data;
    await client.leave(conversationId);

    console.log(`User ${client.userId} left conversation ${conversationId}`);
  }

  @SubscribeMessage('typing_start')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.userId) return;

    const { conversationId } = data;

    // Broadcast to others in the conversation
    client.to(conversationId).emit('typing_update', {
      conversationId,
      userId: client.userId,
      isTyping: true,
    });

    // Set typing indicator in Redis with TTL
    await this.redis
      .getClient()
      .setex(`typing:${conversationId}:${client.userId}`, 5, '1');
  }

  @SubscribeMessage('typing_stop')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.userId) return;

    const { conversationId } = data;

    client.to(conversationId).emit('typing_update', {
      conversationId,
      userId: client.userId,
      isTyping: false,
    });

    // Remove typing indicator
    await this.redis.getClient().del(`typing:${conversationId}:${client.userId}`);
  }

  @SubscribeMessage('message_delivered')
  async handleMessageDelivered(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; conversationId: string },
  ) {
    if (!client.userId) return;

    const { messageId, conversationId } = data;

    // Broadcast to conversation
    this.server.to(conversationId).emit('message_status_update', {
      messageId,
      userId: client.userId,
      status: 'delivered',
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('message_seen')
  async handleMessageSeen(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string; conversationId: string },
  ) {
    if (!client.userId) return;

    const { messageId, conversationId } = data;

    // Broadcast to conversation
    this.server.to(conversationId).emit('message_status_update', {
      messageId,
      userId: client.userId,
      status: 'seen',
      timestamp: new Date(),
    });
  }

  // ==================== Voice Call Signaling ====================

  @SubscribeMessage('voice_call_offer')
  async handleVoiceCallOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      targetUserId: string;
      offer: RTCSessionDescriptionInit;
      conversationId: string;
    },
  ) {
    await this.directCallHandler.handleVoiceCallOffer(client, data);
  }

  @SubscribeMessage('voice_call_answer')
  async handleVoiceCallAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      callerId: string;
      answer: RTCSessionDescriptionInit;
    },
  ) {
    await this.directCallHandler.handleVoiceCallAnswer(client, data);
  }

  @SubscribeMessage('voice_call_ice_candidate')
  async handleVoiceCallIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      targetUserId: string;
      candidate: RTCIceCandidateInit;
    },
  ) {
    await this.directCallHandler.handleVoiceCallIceCandidate(client, data);
  }

  @SubscribeMessage('voice_call_reject')
  async handleVoiceCallReject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callerId: string; reason?: string },
  ) {
    await this.directCallHandler.handleVoiceCallReject(client, data);
  }

  @SubscribeMessage('voice_call_end')
  async handleVoiceCallEnd(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { targetUserId: string; duration?: number },
  ) {
    await this.directCallHandler.handleVoiceCallEnd(client, data);
  }

  // ==================== Video Call Signaling ====================

  @SubscribeMessage('video_call_offer')
  async handleVideoCallOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      targetUserId: string;
      offer: RTCSessionDescriptionInit;
      conversationId: string;
      hasVideo: boolean;
      hasAudio: boolean;
    },
  ) {
    await this.directCallHandler.handleVideoCallOffer(client, data);
  }

  @SubscribeMessage('video_call_answer')
  async handleVideoCallAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      callerId: string;
      answer: RTCSessionDescriptionInit;
      hasVideo: boolean;
      hasAudio: boolean;
    },
  ) {
    await this.directCallHandler.handleVideoCallAnswer(client, data);
  }

  @SubscribeMessage('video_call_ice_candidate')
  async handleVideoCallIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      targetUserId: string;
      candidate: RTCIceCandidateInit;
    },
  ) {
    await this.directCallHandler.handleVideoCallIceCandidate(client, data);
  }

  @SubscribeMessage('video_call_reject')
  async handleVideoCallReject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callerId: string; reason?: string },
  ) {
    await this.directCallHandler.handleVideoCallReject(client, data);
  }

  @SubscribeMessage('video_call_end')
  async handleVideoCallEnd(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { targetUserId: string; duration?: number },
  ) {
    await this.directCallHandler.handleVideoCallEnd(client, data);
  }

  @SubscribeMessage('video_track_control')
  async handleVideoTrackControl(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      targetUserId: string;
      trackType: 'video' | 'audio';
      enabled: boolean;
    },
  ) {
    await this.directCallHandler.handleVideoTrackControl(client, data);
  }

  @SubscribeMessage('screen_share_control')
  async handleScreenShareControl(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      targetUserId: string;
      isSharing: boolean;
    },
  ) {
    await this.directCallHandler.handleScreenShareControl(client, data);
  }

  // ==================== Group Call Signaling ====================

  @SubscribeMessage('group_call_start')
  async handleGroupCallStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      conversationId: string;
      conversationName?: string;
      callType: 'voice' | 'video';
      participantIds: string[];
    },
  ) {
    await this.groupCallHandler.handleStartGroupCall(client, data);
  }

  @SubscribeMessage('group_call_join')
  async handleGroupCallJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string },
  ) {
    await this.groupCallHandler.handleJoinGroupCall(client, data);
  }

  @SubscribeMessage('group_call_leave')
  async handleGroupCallLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; reason?: string },
  ) {
    await this.groupCallHandler.handleLeaveGroupCall(client, data);
  }

  @SubscribeMessage('group_call_signal')
  async handleGroupCallSignal(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      callId: string;
      fromUserId: string;
      toUserId: string;
      type: 'offer' | 'answer' | 'ice-candidate';
      data: RTCSessionDescriptionInit | RTCIceCandidateInit;
    },
  ) {
    await this.groupCallHandler.handleGroupCallSignal(client, data);
  }

  @SubscribeMessage('group_call_reject')
  async handleGroupCallReject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; reason?: string },
  ) {
    await this.groupCallHandler.handleRejectGroupCall(client, data);
  }

  @SubscribeMessage('group_call_end')
  async handleGroupCallEnd(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string },
  ) {
    await this.groupCallHandler.handleEndGroupCall(client, data);
  }

  @SubscribeMessage('group_call_track_control')
  async handleGroupCallTrackControl(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      callId: string;
      trackType: 'video' | 'audio';
      enabled: boolean;
    },
  ) {
    await this.groupCallHandler.handleGroupCallTrackControl(client, data);
  }

  @SubscribeMessage('group_call_screen_share')
  async handleGroupCallScreenShare(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { callId: string; isSharing: boolean },
  ) {
    await this.groupCallHandler.handleGroupCallScreenShare(client, data);
  }

  // Method to send message to all participants regardless of which conversation they're viewing
  async broadcastMessageToParticipants(conversationId: string, message: any, memberIds: string[]) {
    console.log(`📨 Broadcasting message to ${memberIds.length} participants in conversation ${conversationId}`);
    
    for (const userId of memberIds) {
      // Get user's socket ID from Redis
      const socketId = await this.redis.getSocketId(userId);
      
      if (socketId) {
        // Send message directly to user's socket
        this.server.to(socketId).emit('message_new', message);
        console.log(`✅ Sent message to user ${userId} (socket: ${socketId})`);
      } else {
        console.log(`⚠️ User ${userId} is offline, message will be fetched on reconnect`);
      }
    }
  }

  // Method to broadcast group events (member_added, member_removed, group_updated) to all participants
  async broadcastGroupEventToParticipants(event: {
    type: 'member_added' | 'member_removed' | 'group_updated';
    conversationId: string;
    data: any;
    memberIds: string[];
  }) {
    const { type, conversationId, data, memberIds } = event;
    console.log(`👥 Broadcasting group event '${type}' to ${memberIds.length} participants in conversation ${conversationId}`);
    
    for (const userId of memberIds) {
      const socketId = await this.redis.getSocketId(userId);
      
      if (socketId) {
        // Emit the specific event type
        this.server.to(socketId).emit(type, {
          conversationId,
          ...data,
        });
        console.log(`✅ Sent ${type} event to user ${userId} (socket: ${socketId})`);
      } else {
        console.log(`⚠️ User ${userId} is offline, will see changes on reconnect`);
      }
    }
  }

  // Legacy method for room-based broadcasting (kept for typing indicators)
  async broadcastMessage(conversationId: string, message: any) {
    this.server.to(conversationId).emit('message_new', message);
  }

  // Get online users count
  async getOnlineUsersCount(): Promise<number> {
    return this.authenticatedSockets.size;
  }
}
