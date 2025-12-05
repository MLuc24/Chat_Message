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
import * as jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
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

  constructor(private readonly redis: RedisService) {}

  async handleConnection(client: AuthenticatedSocket) {
    console.log(`Client connecting: ${client.id}`);
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.id}`);

    if (client.userId) {
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

  // Method to send message from external services
  async broadcastMessage(conversationId: string, message: any) {
    this.server.to(conversationId).emit('message_new', message);
  }

  // Get online users count
  async getOnlineUsersCount(): Promise<number> {
    return this.authenticatedSockets.size;
  }
}
