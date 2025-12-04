# API Gateway Service

API Gateway là điểm vào duy nhất của hệ thống, chịu trách nhiệm:
- Routing requests đến các microservices
- Authentication & Authorization
- Rate limiting
- Request/Response transformation
- WebSocket proxy

## 🏗️ Architecture

```
Client → Gateway → [Auth/User/Chat Services]
               ↓
         Realtime Service (WebSocket)
```

## 📦 Tech Stack

- NestJS
- Express
- http-proxy-middleware
- JWT validation
- Rate limiting

## 🔌 Endpoints

### Routes to Services

```
/api/auth/*      → auth-service:3001
/api/users/*     → user-service:3002
/api/chat/*      → chat-service:3003
/ws              → realtime-service:9000 (WebSocket)
```

## 🚀 Setup

```bash
npm install
npm run dev      # Development
npm run build    # Production build
npm start        # Production
```

## 🔐 Environment Variables

```env
PORT=8000
NODE_ENV=development

# Services URLs
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
CHAT_SERVICE_URL=http://chat-service:3003
REALTIME_SERVICE_URL=http://realtime-service:9000

# JWT
JWT_SECRET=your-super-secret-key

# Rate Limit
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

## 📝 Features

### ✅ Implemented
- Route proxying to microservices
- JWT authentication middleware
- Rate limiting
- CORS configuration
- Health check endpoint
- Error handling

### 🔜 Planned
- Request logging
- Metrics collection
- Circuit breaker
- API versioning
