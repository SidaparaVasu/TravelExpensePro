#!/bin/bash

echo "====================================="
echo "Starting Development Environment"
echo "====================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env files exist
if [ ! -f backend/.env.dev ]; then
    echo "⚠️  backend/.env.dev not found. Creating from template..."
    cp backend/.env.dev.example backend/.env.dev
fi

if [ ! -f frontend/.env.dev ]; then
    echo "⚠️  frontend/.env.dev not found. Creating from template..."
    cp frontend/.env.dev.example frontend/.env.dev
fi

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start services
echo "🏗️  Building Docker images..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "====================================="
echo "✅ Development Environment Started!"
echo "====================================="
echo ""
echo "🌐 Access your application:"
echo "   Frontend:  http://localhost"
echo "   Backend:   http://localhost/api"
echo "   Admin:     http://localhost/admin"
echo "   Flower:    http://localhost:5555"
echo ""
echo "📝 Default superuser credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "📋 Useful commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Stop services:    docker-compose down"
echo "   Restart service:  docker-compose restart <service-name>"
echo "   Shell access:     docker-compose exec backend bash"
echo ""