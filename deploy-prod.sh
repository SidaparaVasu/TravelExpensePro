#!/bin/bash

echo "====================================="
echo "Starting Production Environment"
echo "====================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env files exist (DO NOT auto-create in prod)
if [ ! -f backend/.env.prod ]; then
    echo "❌ backend/.env.prod not found."
    echo "   Please create it (you can start from backend/.env.dev.example but update all prod secrets)."
    exit 1
fi

if [ ! -f frontend/.env.prod ]; then
    echo "❌ frontend/.env.prod not found."
    echo "   Please create it (you can start from frontend/.env.dev.example but update all prod URLs/keys)."
    exit 1
fi

# Stop any running *production* containers
echo "🛑 Stopping existing production containers..."
docker-compose -f docker-compose.prod.yml down

# Build and start services
echo "🏗️  Building production Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
echo ""
echo "📊 Production Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "====================================="
echo "✅ Production Environment Started!"
echo "====================================="
echo ""
echo "🌐 Access your application (update with your real domain/IP):"
echo "   Frontend:  https://your-domain.com"
echo "   Backend:   https://your-domain.com/api"
echo "   Admin:     https://your-domain.com/admin"
echo ""
echo "📋 Useful commands (production):"
echo "   View logs:        docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services:    docker-compose -f docker-compose.prod.yml down"
echo "   Restart service:  docker-compose -f docker-compose.prod.yml restart <service-name>"
echo "   Shell access:     docker-compose -f docker-compose.prod.yml exec backend bash"
echo ""
