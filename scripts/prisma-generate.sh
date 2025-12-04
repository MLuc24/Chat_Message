#!/bin/bash

# Generate Prisma clients for all services

echo "🔨 Generating Prisma clients..."

services=("auth-service" "user-service" "chat-service")

for service in "${services[@]}"; do
    echo ""
    echo "🔨 Generating Prisma client for $service..."
    cd $service
    npx prisma generate
    cd ..
done

echo ""
echo "✅ All Prisma clients generated!"
