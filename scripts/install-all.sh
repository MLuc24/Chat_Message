#!/bin/bash

# Install dependencies for all services

echo "📦 Installing dependencies for all services..."

services=("gateway" "auth-service" "user-service" "chat-service" "realtime-service")

for service in "${services[@]}"; do
    echo ""
    echo "📦 Installing $service..."
    cd $service
    npm install
    cd ..
done

echo ""
echo "✅ All dependencies installed!"
