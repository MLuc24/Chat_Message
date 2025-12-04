# 📡 API Documentation

Base URL: `http://localhost:8000/api`

## 🔐 Authentication

### Register

**POST** `/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": null,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login

**POST** `/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** Same as register

### Refresh Token

**POST** `/auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 👤 User Management

**All endpoints require authentication header:**
```
Authorization: Bearer <access-token>
```

### Get User Profile

**GET** `/users/profile/:userId`

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "bio": "Software developer",
  "avatarUrl": "https://...",
  "isOnline": true,
  "lastSeen": "2024-01-01T00:00:00Z",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Update Profile

**PUT** `/users/profile`

**Request:**
```json
{
  "name": "John Updated",
  "bio": "Updated bio"
}
```

### Upload Avatar

**POST** `/users/avatar`

**Request:** `multipart/form-data`
- `file`: Image file

**Response:**
```json
{
  "avatarUrl": "https://pub-xxx.r2.dev/avatars/uuid.jpg"
}
```

### Search Users

**GET** `/users/search?q=john`

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "avatarUrl": "https://..."
    }
  ]
}
```

---

## 💬 Conversations

### Get All Conversations

**GET** `/chat/conversations`

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "type": "direct",
      "name": null,
      "avatarUrl": null,
      "members": [
        {
          "userId": "uuid",
          "role": "admin"
        }
      ],
      "lastMessage": {
        "id": "uuid",
        "text": "Hello",
        "type": "text",
        "senderId": "uuid",
        "createdAt": "2024-01-01T00:00:00Z"
      },
      "unreadCount": 5,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Create Conversation

**POST** `/chat/conversations`

**Request (Direct):**
```json
{
  "type": "direct",
  "participantIds": ["user-id-1", "user-id-2"]
}
```

**Request (Group):**
```json
{
  "type": "group",
  "name": "My Group",
  "participantIds": ["user-id-1", "user-id-2", "user-id-3"]
}
```

### Get Conversation Details

**GET** `/chat/conversations/:id`

### Update Conversation

**PUT** `/chat/conversations/:id`

**Request:**
```json
{
  "name": "Updated Group Name",
  "avatarUrl": "https://..."
}
```

### Add Member to Group

**POST** `/chat/conversations/:id/members`

**Request:**
```json
{
  "userId": "user-id-to-add"
}
```

### Remove Member

**DELETE** `/chat/conversations/:id/members/:memberId`

---

## 📨 Messages

### Get Messages

**GET** `/chat/conversations/:conversationId/messages?limit=50&before=messageId`

**Query Parameters:**
- `limit`: Number of messages (default: 50)
- `before`: Message ID for pagination

**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "senderId": "uuid",
      "type": "text",
      "text": "Hello world",
      "fileUrl": null,
      "fileName": null,
      "isEdited": false,
      "isDeleted": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "statuses": [
        {
          "userId": "uuid",
          "status": "seen",
          "timestamp": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ],
  "hasMore": true
}
```

### Send Text Message

**POST** `/chat/conversations/:conversationId/messages`

**Request:**
```json
{
  "type": "text",
  "text": "Hello world"
}
```

### Send File Message

**POST** `/chat/conversations/:conversationId/messages/file`

**Request:** `multipart/form-data`
- `file`: File to upload

**Response:**
```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "senderId": "uuid",
  "type": "image",
  "fileUrl": "https://...",
  "fileName": "photo.jpg",
  "fileSize": 102400,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Edit Message

**PUT** `/chat/messages/:id`

**Request:**
```json
{
  "text": "Updated message text"
}
```

### Delete Message

**DELETE** `/chat/messages/:id`

### Mark as Delivered

**POST** `/chat/messages/:id/delivered`

### Mark as Seen

**POST** `/chat/messages/:id/seen`

---

## 🔌 WebSocket Events

Connect to: `ws://localhost:9000`

### Client → Server

**Authenticate:**
```javascript
socket.emit('authenticate', {
  token: 'your-jwt-access-token'
});
```

**Join Conversation:**
```javascript
socket.emit('join_conversation', {
  conversationId: 'uuid'
});
```

**Send Message:**
```javascript
socket.emit('send_message', {
  conversationId: 'uuid',
  type: 'text',
  text: 'Hello'
});
```

**Typing Indicators:**
```javascript
socket.emit('typing_start', { conversationId: 'uuid' });
socket.emit('typing_stop', { conversationId: 'uuid' });
```

**Message Status:**
```javascript
socket.emit('message_delivered', { 
  messageId: 'uuid',
  conversationId: 'uuid'
});

socket.emit('message_seen', { 
  messageId: 'uuid',
  conversationId: 'uuid'
});
```

### Server → Client

**Authenticated:**
```javascript
socket.on('authenticated', (data) => {
  console.log('Authenticated:', data);
});
```

**New Message:**
```javascript
socket.on('message_new', (message) => {
  console.log('New message:', message);
});
```

**Typing Update:**
```javascript
socket.on('typing_update', (data) => {
  console.log('User typing:', data);
});
```

**Message Status:**
```javascript
socket.on('message_status_update', (data) => {
  console.log('Status:', data);
});
```

**Presence Update:**
```javascript
socket.on('presence_update', (data) => {
  console.log('User presence:', data);
});
```

---

## 🔧 Error Responses

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Invalid token",
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Not a member of this conversation",
  "error": "Forbidden"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

**429 Too Many Requests:**
```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "error": "Too Many Requests"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```
