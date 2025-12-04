# Development Scripts

Các script hữu ích cho development.

## Install Dependencies

```bash
# Install tất cả services
./scripts/install-all.sh
```

## Database Management

```bash
# Generate Prisma clients
./scripts/prisma-generate.sh

# Run migrations
./scripts/migrate-all.sh

# Reset databases
./scripts/reset-db.sh
```

## Docker Commands

```bash
# Build all services
docker-compose build

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart chat-service
```

## Testing

```bash
# Run tests for all services
./scripts/test-all.sh

# Test specific service
cd auth-service && npm test
```
