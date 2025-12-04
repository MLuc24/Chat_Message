# Realtime Service

Socket.IO server cho realtime communication.

## 🎯 Chức năng

- ✅ WebSocket connections
- ✅ Real-time message delivery
- ✅ Typing indicators
- ✅ Presence tracking (online/offline)
- ✅ Read receipts (delivered/seen)
- ✅ Redis adapter cho scaling
- ✅ JWT authentication
- ✅ Room-based messaging

## 🏗️ Architecture

```
Client (Socket.IO) ↔ Realtime Service ↔ Redis (Pub/Sub + Adapter)
                           ↓
                    User Service (presence)
```

## 📦 Tech Stack

- NestJS
- Socket.IO
- Redis (adapter + pub/sub)
- JWT authentication
- ioredis

## 🔌 Socket Events

### Client → Server

**`authenticate`**
```json
{
  "token": "jwt-access-token"
}
```

**`join_conversation`**
```json
{
  "conversationId": "uuid"
}
```

**`send_message`**
```json
{
  "conversationId": "uuid",
  "type": "text",
  "text": "Hello"
}
```

**`typing_start`**
```json
{
  "conversationId": "uuid"
}
```

**`typing_stop`**
```json
{
  "conversationId": "uuid"
}
```

**`mark_delivered`**
```json
{
  "messageId": "uuid"
}
```

**`mark_seen`**
```json
{
  "messageId": "uuid"
}
```

### Server → Client

**`message_new`**
```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "senderId": "uuid",
  "type": "text",
  "text": "Hello",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**`typing_update`**
```json
{
  "conversationId": "uuid",
  "userId": "uuid",
  "isTyping": true
}
```

**`message_delivered`**
```json
{
  "messageId": "uuid",
  "userId": "uuid"
}
```

**`message_seen`**
```json
{
  "messageId": "uuid",
  "userId": "uuid"
}
```

**`presence_update`**
```json
{
  "userId": "uuid",
  "status": "online"
}
```

## 🔐 Environment Variables

```env
PORT=9000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
USER_SERVICE_URL=http://user-service:3002
```

## 🚀 Setup

```bash
npm install
npm run dev
```

## 🔒 Authentication

Clients phải authenticate với JWT token trước khi sử dụng các events khác.

```javascript
socket.emit('authenticate', { token: 'jwt-access-token' });

socket.on('authenticated', () => {
  console.log('Connected and authenticated');
});

socket.on('unauthorized', (error) => {
  console.error('Auth failed:', error);
});
```

## 📡 Scaling

Service sử dụng Redis adapter cho horizontal scaling:
- Nhiều instance có thể chạy song song
- Redis pub/sub đồng bộ events giữa các instance
- Sticky session KHÔNG cần thiết
