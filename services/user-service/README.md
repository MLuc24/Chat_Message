# User Service

Service quản lý thông tin người dùng và trạng thái online/offline.

## 🎯 Chức năng

- ✅ Get user profile
- ✅ Update user profile
- ✅ Upload avatar (Cloudflare R2)
- ✅ Search users
- ✅ Online/Offline tracking (Redis)
- ✅ Last seen timestamp
- ✅ Get user list

## 🏗️ Architecture

```
Controller → Service → Repository (Prisma) → PostgreSQL
                    ↓
                  Redis (presence)
```

## 📦 Tech Stack

- NestJS
- Prisma ORM
- PostgreSQL
- Redis (online tracking)
- Cloudflare R2 (file storage)

## 🔌 API Endpoints

### GET `/profile/:userId`
Lấy thông tin người dùng

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "avatarUrl": "https://...",
  "isOnline": true,
  "lastSeen": "2024-01-01T00:00:00Z"
}
```

### PUT `/profile`
Cập nhật profile

**Headers:**
```
Authorization: Bearer <token>
x-user-id: <userId>
```

**Request:**
```json
{
  "name": "New Name",
  "bio": "My bio"
}
```

### POST `/avatar`
Upload avatar

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request:**
```
file: <binary>
```

**Response:**
```json
{
  "avatarUrl": "https://r2.../avatar.jpg"
}
```

### GET `/search?q=john`
Tìm kiếm người dùng

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

### POST `/presence/online`
Đánh dấu online

### POST `/presence/offline`
Đánh dấu offline

## 🔐 Environment Variables

```env
PORT=3002
DATABASE_URL=postgresql://user:pass@localhost:5432/user_db
REDIS_URL=redis://localhost:6379

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret
R2_BUCKET_NAME=messenger-files
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

## 🚀 Setup

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

## 📊 Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  bio       String?
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 🔴 Redis Keys

```
user:online:{userId}      → SET with TTL 5 minutes
user:lastSeen:{userId}    → Timestamp
```
