# 📘 **MESSENGER CLONE — FULL MICROservice ARCHITECTURE (<10k Users, Docker Deploy)**
**Tài liệu triển khai dự án – Hướng dẫn đầy đủ, CỰC KỲ CHI TIẾT**

---

# 🧱 MỤC LỤC

1. Overview  
2. Mục tiêu kiến trúc  
3. Kiến trúc tổng thể  
4. Microservice chi tiết  
5. Database design  
6. Redis design  
7. Socket Realtime design  
8. API Specification (chi tiết)  
9. Dockerfile cho từng service  
10. Docker Compose full  
11. Hướng dẫn chạy local  
12. Hướng dẫn deploy (VPS + Railway + Vercel)  
13. WebRTC design  
14. Load balancing & Scaling  
15. Logging + Monitoring  
16. Bảo mật hệ thống  
17. Checklist triển khai  
18. Checklist chuẩn bị production  
19. Hướng mở rộng  
20. Phụ lục  

---

# 1. 🏗️ OVERVIEW

Dự án Messenger Clone với kiến trúc Microservice tối giản, mạnh mẽ, hướng tối ưu cho quy mô <10.000 người dùng.

### Tính năng chính
- Nhắn tin realtime (Socket.IO)  
- Chat 1–1, chat nhóm  
- Gửi file, ảnh, video, audio  
- Trạng thái online/offline  
- Seen / Delivered  
- WebRTC call  
- Triển khai Docker  

---

# 2. 🎯 MỤC TIÊU KIẾN TRÚC

| Mục tiêu | Giải pháp |
|---------|-----------|
| Realtime mạnh | Socket.IO + Redis adapter |
| Dễ scale | 5 microservices độc lập |
| Dễ deploy | Docker Compose |
| Đơn giản nhưng chuẩn | Không cần Kafka |
| Clean Architecture | NestJS |

---

# 3. 🧩 KIẾN TRÚC TỔNG THỂ

**5 microservices:**
- API Gateway  
- Auth Service  
- User Service  
- Chat Service  
- Realtime Service  

**Tài nguyên:**
- PostgreSQL  
- Redis  
- Cloudflare R2 (file)  
- Nginx  

---

# 4. 🧩 MICROservice CHI TIẾT

## 4.1 API GATEWAY
- Route request đến service tương ứng  
- Reverse proxy WebSocket  
- Validate token  
- Rate limit  

## 4.2 AUTH SERVICE
- Register / Login  
- JWT access & refresh  
- Device manager  
- Password hashing  

## 4.3 USER SERVICE
- Profile  
- Avatar  
- Online tracking (Redis)  

## 4.4 CHAT SERVICE
- Conversation CRUD  
- Message CRUD  
- Delivered / Seen  
- Group manager  

## 4.5 REALTIME SERVICE
- Socket.IO server  
- Redis adapter  
- Typing, delivered, seen  

---

# 5. 🗄️ DATABASE DESIGN

## ERD
```
users ───< conversation_members >─── conversations ───< messages ─── message_status
```

## BẢNG

### users
```
id UUID PK
email TEXT
password_hash TEXT
name TEXT
avatar_url TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### conversations
```
id UUID PK
type TEXT
created_by UUID
created_at TIMESTAMP
updated_at TIMESTAMP
```

### messages
```
id UUID PK
conversation_id UUID FK
sender_id UUID FK
type TEXT
text TEXT
file_url TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
is_edited BOOLEAN
is_deleted BOOLEAN
```

---

# 6. 🔥 REDIS DESIGN

### Keys
```
user:online:{userId}
user:lastSeen:{userId}
socket:{userId}
typing:{conversationId}:{userId}
```

### Pub/Sub
```
event:message
event:typing
event:presence
```

---

# 7. 🔌 SOCKET.IO EVENTS

### Client → Server
```
join
send_message
typing_start
typing_stop
read_message
```

### Server → Client
```
message_new
message_delivered
message_seen
typing_update
presence_update
```

---

# 8. 📡 API SPEC (FULL CHI TIẾT)

## 🚪 AUTH
### POST /auth/register
Request:
```
{
  "email": "a@gmail.com",
  "password": "123456",
  "name": "User"
}
```

Response:
```
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

---

# 9. 📦 DOCKERFILE CHO SERVICE

```dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

CMD ["node", "dist/main.js"]
```

---

# 10. 🐳 DOCKER COMPOSE FULL

```yaml
version: '3.9'
services:
  gateway:
    build: ./gateway
    ports:
      - "8000:8000"

  auth-service:
    build: ./auth-service
    environment:
      DATABASE_URL: postgres://postgres:pass@db:5432/auth

  user-service:
    build: ./user-service
    environment:
      DATABASE_URL: postgres://postgres:pass@db:5432/user
      REDIS_URL: redis://redis:6379

  chat-service:
    build: ./chat-service
    environment:
      DATABASE_URL: postgres://postgres:pass@db:5432/chat
      REDIS_URL: redis://redis:6379

  realtime-service:
    build: ./realtime-service
    ports:
      - "9000:9000"
    environment:
      REDIS_URL: redis://redis:6379

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: pass
    ports: ["5432:5432"]

  redis:
    image: redis:7
    ports: ["6379:6379"]

volumes:
  pgdata:
```

---

# 11. 🧪 CHẠY LOCAL

```
docker compose up --build
```

---

# 12. 🚀 DEPLOY

## FE (Vercel)
.env
```
VITE_API=http://domain/api
VITE_WS=http://domain/ws
```

## BE (VPS)
```
docker compose up -d
```

---

# 13. 📞 WEBRTC FLOW

```
Caller → Offer → Socket → Callee
Callee → Answer → Socket → Caller
Exchange ICE candidates
Stream audio/video
```

---

# 14. 📈 SCALING

| Service | Scale |
|---------|--------|
| Realtime | 2 instance |
| Chat | 2 instance |
| Redis | standalone |
| PostgreSQL | standalone |

---

# 15. 📊 LOGGING

- Winston  
- PM2  
- Grafana + Prometheus  

---

# 16. 🔒 BẢO MẬT

- HTTPS  
- JWT rotation  
- Helmet middleware  
- CORS strict  
- Validate input  

---

# 17. 🧠 CHECKLIST TRƯỚC KHI CODE
✔ Tạo monorepo  
✔ Tạo 5 service  
✔ Tạo Dockerfile  
✔ Tạo Compose  
✔ Tạo schema DB  
✔ Tạo Redis  
✔ Tạo socket gateway  

---

# 18. 📌 PRE-PRODUCTION CHECKLIST
✔ HTTPS  
✔ Rate limit  
✔ Backup DB  
✔ Logging  
✔ Monitoring  
✔ Healthcheck  

---

# 19. 🚀 EXPAND FEATURES
- AI chatbot  
- AI content moderation  
- Status (story)  
- E2EE encryption  

---

# 20. 📚 PHỤ LỤC

**Libraries:**
- NestJS  
- Prisma  
- Socket.IO  
- Axios  
- Cloudflare R2 SDK  

---

