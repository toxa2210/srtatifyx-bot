#!/bin/bash

# Quick start script for Quantum Hedge development

set -e

echo "🚀 Quantum Hedge - Quick Start Script"
echo "======================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

echo "✅ Docker is running"
echo ""

# Start Docker Compose
echo "🐳 Starting Docker services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready (30 seconds)..."
sleep 30

# Initialize databases
echo ""
echo "📦 Initializing databases..."
./scripts/init-databases.sh

# Install dependencies
echo ""
echo "📚 Installing dependencies..."
npm install

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 Available services:"
echo "  - PostgreSQL:      localhost:5432"
echo "  - TimescaleDB:     localhost:5433"
echo "  - Redis:           localhost:6379"
echo "  - Kafka:           localhost:9092"
echo "  - Elasticsearch:   localhost:9200"
echo "  - Prometheus:      http://localhost:9090"
echo "  - Grafana:         http://localhost:3001 (admin/admin)"
echo ""
echo "🚀 To start development:"
echo "  npm run dev"
echo ""
