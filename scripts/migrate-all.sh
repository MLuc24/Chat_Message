#!/bin/bash

# Run migrations for all services

echo "🚀 Running migrations..."

services=("auth-service" "user-service" "chat-service")

for service in "${services[@]}"; do
    echo ""
    echo "🚀 Running migrations for $service..."
    cd $service
    npx prisma migrate deploy
    cd ..
done

echo ""
echo "✅ All migrations completed!"
