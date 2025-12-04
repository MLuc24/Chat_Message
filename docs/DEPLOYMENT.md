# 🚀 Deployment Guide

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- PostgreSQL 15+ (optional, can use Docker)
- Redis 7+ (optional, can use Docker)

### Quick Start

1. **Clone repository**
```bash
git clone <your-repo>
cd messenger-microservice
```

2. **Setup environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start all services**
```bash
docker-compose up --build
```

4. **Access services**
- API Gateway: http://localhost:8000
- WebSocket: http://localhost:9000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Development Mode

Run services individually:

```bash
# Terminal 1 - Auth Service
cd auth-service
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Terminal 2 - User Service
cd user-service
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Terminal 3 - Chat Service
cd chat-service
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Terminal 4 - Realtime Service
cd realtime-service
npm install
npm run dev

# Terminal 5 - Gateway
cd gateway
npm install
npm run dev
```

---

## Production Deployment

### Option 1: VPS Deployment (Docker)

**Requirements:**
- Ubuntu 22.04+ VPS
- 2GB RAM minimum
- Docker & Docker Compose installed

**Steps:**

1. **SSH into VPS**
```bash
ssh user@your-vps-ip
```

2. **Install Docker**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

3. **Clone & Configure**
```bash
git clone <your-repo>
cd messenger-microservice
cp .env.example .env
nano .env  # Edit configuration
```

4. **Start services**
```bash
docker-compose up -d
```

5. **Check logs**
```bash
docker-compose logs -f
```

6. **Setup Nginx (Optional)**
```bash
sudo apt install nginx
sudo cp infrastructure/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Railway Deployment

**Deploy each service separately:**

1. **Auth Service**
```bash
railway login
cd auth-service
railway init
railway add
railway up
```

2. **Add PostgreSQL**
```bash
railway add postgres
```

3. **Configure environment**
```bash
railway variables set JWT_SECRET=your-secret
railway variables set DATABASE_URL=<postgres-url>
```

4. **Repeat for each service**

### Option 3: Render/Heroku

Similar to Railway, deploy each service as separate app.

---

## Database Migrations

### Run migrations in production

```bash
# Auth Service
docker exec messenger-auth-service npx prisma migrate deploy

# User Service
docker exec messenger-user-service npx prisma migrate deploy

# Chat Service
docker exec messenger-chat-service npx prisma migrate deploy
```

---

## Scaling

### Horizontal Scaling

**Scale specific services:**
```bash
docker-compose up -d --scale chat-service=3
docker-compose up -d --scale realtime-service=2
```

**Load Balancer (Nginx):**
```nginx
upstream chat_service {
    server chat-service-1:3003;
    server chat-service-2:3003;
    server chat-service-3:3003;
}
```

### Redis Cluster (High Availability)

For production with >10k users, use Redis Cluster or Sentinel.

---

## Monitoring

### Health Checks

```bash
# Check all services
curl http://localhost:8000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:9000/health
```

### Docker Stats

```bash
docker stats
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f chat-service
```

---

## Backup & Restore

### PostgreSQL Backup

```bash
docker exec messenger-postgres pg_dumpall -U postgres > backup.sql
```

### Restore

```bash
cat backup.sql | docker exec -i messenger-postgres psql -U postgres
```

### Redis Backup

```bash
docker exec messenger-redis redis-cli SAVE
docker cp messenger-redis:/data/dump.rdb ./redis-backup.rdb
```

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Certbot)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Update Nginx config for HTTPS

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    # ... rest of config
}
```

---

## Troubleshooting

### Service won't start

```bash
# Check logs
docker-compose logs <service-name>

# Rebuild
docker-compose up --build --force-recreate <service-name>
```

### Database connection issues

```bash
# Check PostgreSQL
docker exec messenger-postgres psql -U postgres -c "\l"

# Check connectivity
docker exec messenger-auth-service ping postgres
```

### Redis connection issues

```bash
# Check Redis
docker exec messenger-redis redis-cli ping

# Check connections
docker exec messenger-realtime-service ping redis
```

---

## Performance Optimization

1. **Enable Redis persistence**
2. **Use connection pooling**
3. **Add database indexes**
4. **Enable gzip compression**
5. **Use CDN for static files**
6. **Implement caching strategies**

---

## Security Checklist

- [ ] Change default passwords
- [ ] Use strong JWT secret
- [ ] Enable HTTPS only
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Regular security updates
- [ ] Database backups
- [ ] Firewall configuration
- [ ] Use environment variables
- [ ] Don't expose internal ports
