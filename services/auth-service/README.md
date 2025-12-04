# Auth Service

Service chịu trách nhiệm xác thực và phân quyền người dùng.

## 🎯 Chức năng

- ✅ User registration
- ✅ User login  
- ✅ JWT token generation (access + refresh)
- ✅ Token refresh
- ✅ Password hashing (bcrypt)
- ✅ Device management
- ✅ Logout

## 🏗️ Architecture

```
Controller → Service → Repository (Prisma) → PostgreSQL
```

## 📦 Tech Stack

- NestJS
- Prisma ORM
- PostgreSQL
- bcrypt
- jsonwebtoken

## 🔌 API Endpoints

### POST `/register`
Đăng ký tài khoản mới

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
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### POST `/login`
Đăng nhập

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### POST `/refresh`
Refresh access token

**Request:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### POST `/logout`
Đăng xuất (revoke refresh token)

**Headers:**
```
Authorization: Bearer <access-token>
```

## 🔐 Environment Variables

```env
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/auth_db
JWT_SECRET=your-super-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
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
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  name          String
  avatarUrl     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```
