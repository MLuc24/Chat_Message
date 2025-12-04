# Chat Service

Service quản lý conversations và messages.

## 🎯 Chức năng

- ✅ Tạo conversation (1-1, group)
- ✅ Lấy danh sách conversation
- ✅ Gửi message (text, file, image, video)
- ✅ Lấy lịch sử message
- ✅ Mark as delivered/seen
- ✅ Edit message
- ✅ Delete message
- ✅ Group management (add/remove members)
- ✅ Typing indicators

## 🏗️ Architecture

```
Controller → Service → Repository (Prisma) → PostgreSQL
                    ↓
                  Redis (pub/sub events)
```

## 📦 Tech Stack

- NestJS
- Prisma ORM
- PostgreSQL
- Redis (pub/sub)
- Cloudflare R2 (file storage)

## 🔌 API Endpoints

### GET `/conversations`
Lấy danh sách conversation

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "type": "direct",
      "participants": [...],
      "lastMessage": {...},
      "unreadCount": 5
    }
  ]
}
```

### POST `/conversations`
Tạo conversation mới

**Request:**
```json
{
  "type": "direct",
  "participantIds": ["userId1", "userId2"]
}
```

### GET `/conversations/:id/messages`
Lấy messages

**Query:** `?limit=50&before=messageId`

### POST `/conversations/:id/messages`
Gửi message

**Request:**
```json
{
  "type": "text",
  "text": "Hello world"
}
```

### PUT `/messages/:id`
Sửa message

### DELETE `/messages/:id`
Xóa message

### POST `/messages/:id/seen`
Đánh dấu đã xem

## 🔐 Environment Variables

```env
PORT=3003
DATABASE_URL=postgresql://user:pass@localhost:5432/chat_db
REDIS_URL=redis://localhost:6379
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=messenger-files
R2_PUBLIC_URL=https://...
```

## 📊 Database Schema

```prisma
model Conversation {
  id        String   @id @default(uuid())
  type      String   // direct, group
  name      String?
  createdBy String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  members  ConversationMember[]
  messages Message[]
}

model ConversationMember {
  id             String   @id @default(uuid())
  conversationId String
  userId         String
  role           String   @default("member")
  joinedAt       DateTime @default(now())
  
  conversation Conversation @relation(...)
}

model Message {
  id             String   @id @default(uuid())
  conversationId String
  senderId       String
  type           String   // text, image, video, file
  text           String?
  fileUrl        String?
  fileName       String?
  isEdited       Boolean  @default(false)
  isDeleted      Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  conversation Conversation @relation(...)
  statuses     MessageStatus[]
}

model MessageStatus {
  id        String   @id @default(uuid())
  messageId String
  userId    String
  status    String   // sent, delivered, seen
  timestamp DateTime @default(now())
  
  message Message @relation(...)
}
```
