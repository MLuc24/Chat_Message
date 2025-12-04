# 🚀 Messenger Clone - Microservice Architecture

> Hệ thống chat realtime với kiến trúc microservice, được xây dựng bằng NestJS, Docker, và WebSocket. Tối ưu cho quy mô lên đến 10,000+ concurrent users.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)

---

## 📖 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Services](#-services)
- [Development](#-development)
- [Documentation](#-documentation)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Frontend)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
        ┌───────▼───────┐        ┌────────▼─────────┐
        │   Gateway      │        │  Realtime Service│
        │   (Port 8000)  │        │   (Port 9000)    │
        └───────┬────────┘        └──────────────────┘
                │
    ┌───────────┼───────────┬───────────┐
    │           │           │           │
┌───▼───┐  ┌───▼───┐  ┌────▼────┐  ┌──▼───┐
│ Auth  │  │ User  │  │  Chat   │  │Redis │
│Service│  │Service│  │ Service │  └──────┘
└───┬───┘  └───┬───┘  └────┬────┘
    │          │           │
    └──────────┼───────────┘
               │
        ┌──────▼──────┐
        │  PostgreSQL │
        └─────────────┘
```

**Kiến trúc Microservices bao gồm:**
- **Gateway**: Reverse proxy, routing, rate limiting
- **Auth Service**: Xác thực JWT, quản lý token
- **User Service**: Quản lý user profiles, presence status
- **Chat Service**: Quản lý conversations, messages, file uploads
- **Realtime Service**: WebSocket server với Socket.IO

---

## 🛠️ Tech Stack

### Backend
- **Framework**: [NestJS](https://nestjs.com/) - Progressive Node.js framework
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **ORM**: [Prisma](https://www.prisma.io/) - Next-generation ORM

### Database & Cache
- **Primary Database**: [PostgreSQL 15](https://www.postgresql.org/) - Relational database
- **Cache Layer**: [Redis 7](https://redis.io/) - In-memory data store
- **Message Broker**: Redis Pub/Sub

### Storage & CDN
- **File Storage**: [Cloudflare R2](https://www.cloudflare.com/products/r2/) - S3-compatible object storage
- **CDN**: Cloudflare CDN for static assets

### DevOps
- **Containerization**: [Docker](https://www.docker.com/) & Docker Compose
- **Reverse Proxy**: Nginx (optional)
- **Process Manager**: PM2 for production

### Realtime Communication
- **WebSocket**: [Socket.IO](https://socket.io/) - Bidirectional event-based communication

---

## 📁 Project Structure

```
messenger-microservice/
├── services/                     # Microservices
│   ├── gateway/                 # API Gateway (Port 8000)
│   │   ├── src/
│   │   │   ├── guards/         # Authentication guards
│   │   │   ├── middleware/     # Rate limiting, logging
│   │   │   ├── proxy/          # Service proxy handlers
│   │   │   └── health/         # Health check endpoints
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── auth-service/            # Authentication Service (Port 3001)
│   │   ├── src/
│   │   │   ├── auth/           # Auth controllers & services
│   │   │   ├── prisma/         # Prisma client
│   │   │   └── dto/            # Data transfer objects
│   │   ├── prisma/
│   │   │   └── schema.prisma   # User credentials schema
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── user-service/            # User Management Service (Port 3002)
│   │   ├── src/
│   │   │   ├── user/           # User CRUD operations
│   │   │   ├── storage/        # R2 file upload
│   │   │   └── redis/          # Presence management
│   │   ├── prisma/
│   │   │   └── schema.prisma   # User profile schema
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── chat-service/            # Chat & Messaging Service (Port 3003)
│   │   ├── src/
│   │   │   ├── conversation/   # Conversation management
│   │   │   ├── message/        # Message CRUD
│   │   │   ├── storage/        # File attachments
│   │   │   └── redis/          # Message caching
│   │   ├── prisma/
│   │   │   └── schema.prisma   # Chat schema
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── realtime-service/        # WebSocket Service (Port 9000)
│       ├── src/
│       │   ├── socket/         # Socket.IO gateway
│       │   ├── redis/          # Pub/Sub adapter
│       │   └── health/         # Health checks
│       ├── Dockerfile
│       └── package.json
│
├── frontend/                     # React + TypeScript Frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/              # Application pages
│   │   ├── services/           # API clients
│   │   ├── stores/             # State management
│   │   └── hooks/              # Custom hooks
│   ├── public/
│   ├── vite.config.ts
│   └── package.json
│
├── infrastructure/               # Infrastructure configs
│   ├── init-databases.sh       # PostgreSQL init script
│   ├── nginx.conf              # Nginx reverse proxy config
│   └── SCRIPTS.md              # Infrastructure documentation
│
├── scripts/                      # Utility scripts
│   ├── install-all.sh          # Install all dependencies
│   ├── migrate-all.sh          # Run Prisma migrations
│   ├── prisma-generate.sh      # Generate Prisma clients
│   ├── start.bat               # Start all services (Windows)
│   ├── stop.bat                # Stop all services (Windows)
│   ├── logs.bat                # View container logs
│   ├── test-api.bat            # Test API endpoints
│   └── test-websocket.html     # WebSocket testing tool
│
├── docs/                         # Documentation
│   ├── API.md                  # API documentation
│   ├── DEPLOYMENT.md           # Deployment guide
│   ├── TESTING.md              # Testing guidelines
│   ├── POSTMAN.md              # Postman collection guide
│   ├── FRONTEND_GUIDELINES.md  # Frontend development guide
│   ├── ENV_CHECKLIST.md        # Environment setup checklist
│   ├── PROJECT_SUMMARY.md      # Project overview
│   └── messenger_full_microservice_detailed.md  # Complete architecture guide
│
├── docker-compose.yml            # Docker orchestration
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
```

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://www.docker.com/get-started) >= 20.x
- [Docker Compose](https://docs.docker.com/compose/) >= 2.x
- [Node.js](https://nodejs.org/) >= 18.x (for local development)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/messenger-microservice.git
   cd messenger-microservice
   ```

2. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services with Docker**
   ```bash
   docker-compose up --build
   ```

4. **Wait for services to be ready**
   ```bash
   # Check health status
   curl http://localhost:8000/health
   curl http://localhost:9000/health
   ```

### Access the Application

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8000
- **WebSocket**: ws://localhost:9000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## 🔧 Services

| Service           | Port | URL                          | Description                          |
|-------------------|------|------------------------------|--------------------------------------|
| **Gateway**       | 8000 | http://localhost:8000        | API Gateway, routing, rate limiting  |
| **Auth Service**  | 3001 | http://localhost:3001        | JWT authentication & authorization   |
| **User Service**  | 3002 | http://localhost:3002        | User profiles, presence management   |
| **Chat Service**  | 3003 | http://localhost:3003        | Conversations, messages, attachments |
| **Realtime**      | 9000 | ws://localhost:9000          | WebSocket server (Socket.IO)         |
| **PostgreSQL**    | 5432 | postgresql://localhost:5432  | Primary database                     |
| **Redis**         | 6379 | redis://localhost:6379       | Cache & message broker               |

### Health Check Endpoints

```bash
# Gateway health
curl http://localhost:8000/health

# Individual service health (through gateway)
curl http://localhost:8000/api/auth/health
curl http://localhost:8000/api/user/health
curl http://localhost:8000/api/chat/health

# Realtime service health
curl http://localhost:9000/health
```

---

## 💻 Development

### Local Development (Without Docker)

1. **Install dependencies for all services**
   ```bash
   # Linux/macOS
   ./scripts/install-all.sh
   
   # Windows
   cd services/auth-service && npm install
   cd ../user-service && npm install
   cd ../chat-service && npm install
   cd ../realtime-service && npm install
   cd ../gateway && npm install
   cd ../../frontend && npm install
   ```

2. **Setup databases**
   ```bash
   # Start PostgreSQL & Redis with Docker
   docker-compose up -d postgres redis
   
   # Run migrations
   ./scripts/migrate-all.sh
   ```

3. **Start services individually**
   ```bash
   # Terminal 1: Auth Service
   cd services/auth-service
   npm run start:dev
   
   # Terminal 2: User Service
   cd services/user-service
   npm run start:dev
   
   # Terminal 3: Chat Service
   cd services/chat-service
   npm run start:dev
   
   # Terminal 4: Realtime Service
   cd services/realtime-service
   npm run start:dev
   
   # Terminal 5: Gateway
   cd services/gateway
   npm run start:dev
   
   # Terminal 6: Frontend
   cd frontend
   npm run dev
   ```

### Running Tests

```bash
# Unit tests for a service
cd services/auth-service
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Database Migrations

```bash
# Generate Prisma client
./scripts/prisma-generate.sh

# Create a new migration
cd services/auth-service
npx prisma migrate dev --name migration_name

# Run all migrations
./scripts/migrate-all.sh
```

### Useful Scripts

```bash
# Start all services (Windows)
scripts/start.bat

# Stop all services (Windows)
scripts/stop.bat

# View logs from all containers
scripts/logs.bat

# Test API endpoints
scripts/test-api.bat
```

---

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- **[API Documentation](docs/API.md)** - Complete REST API reference
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Testing Guide](docs/TESTING.md)** - Testing strategies and examples
- **[Frontend Guidelines](docs/FRONTEND_GUIDELINES.md)** - React development standards
- **[Postman Collection](docs/POSTMAN.md)** - Import & use Postman collection
- **[Architecture Details](docs/messenger_full_microservice_detailed.md)** - Deep dive into system design

### API Examples

```bash
# Register a new user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","displayName":"John Doe"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get user profile
curl -X GET http://localhost:8000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send a message
curl -X POST http://localhost:8000/api/chat/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"conv_123","content":"Hello!","type":"text"}'
```

---

## 🔒 Security

### Implemented Security Measures

- ✅ **JWT Authentication** - Token-based auth with refresh tokens
- ✅ **Rate Limiting** - Prevent brute force attacks (100 req/min per IP)
- ✅ **CORS Protection** - Configurable CORS policies
- ✅ **Input Validation** - DTOs with class-validator
- ✅ **SQL Injection Prevention** - Prisma ORM parameterized queries
- ✅ **XSS Protection** - Sanitized inputs
- ✅ **HTTPS Only** - Force HTTPS in production
- ✅ **Environment Variables** - Secrets stored in .env files
- ✅ **Password Hashing** - bcrypt with 10 rounds

### Security Best Practices

```bash
# Change default secrets in .env
JWT_SECRET=your-super-secret-key-min-32-chars
POSTGRES_PASSWORD=strong-database-password

# Use HTTPS in production
CORS_ORIGIN=https://yourdomain.com

# Enable Nginx SSL termination (see infrastructure/nginx.conf)
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow [Airbnb TypeScript Style Guide](https://github.com/airbnb/javascript)
- Use ESLint and Prettier (configs included)
- Write meaningful commit messages
- Add tests for new features

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

- **Your Name** - *Initial work* - [GitHub Profile](https://github.com/your-username)

---

## 🙏 Acknowledgments

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Docker Documentation](https://docs.docker.com/)

---

## 📞 Support

If you have any questions or need help, please:

- Open an [issue](https://github.com/your-username/messenger-microservice/issues)
- Join our [Discord server](https://discord.gg/your-invite)
- Email: support@yourdomain.com

---

<div align="center">

**⭐ If you like this project, please give it a star! ⭐**

Made with ❤️ by [Your Name](https://github.com/your-username)

</div>
