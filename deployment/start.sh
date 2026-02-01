#!/bin/bash

echo "🚀 Starting Litex Local Development Environment..."
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker nicht gefunden. Bitte installieren: https://docs.docker.com/get-docker/"
    exit 1
fi

# Get local IP
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ipconfig getifaddr en0 2>/dev/null || echo "localhost")

echo "📦 Starting services..."
docker compose -f docker-compose.local.yml up -d --build

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

echo ""
echo "✅ Litex ist gestartet!"
echo ""
echo "📍 URLs (lokal):"
echo "   App:          http://localhost:3000"
echo "   MinIO Console: http://localhost:9001"
echo "   PostgreSQL:   localhost:5432"
echo ""
echo "📍 URLs (Netzwerk - für andere Geräte):"
echo "   App:          http://${LOCAL_IP}:3000"
echo "   MinIO Console: http://${LOCAL_IP}:9001"
echo ""
echo "🔑 MinIO Login: minioadmin / minioadmin123"
echo "🔑 PostgreSQL:  litex / litex_secret_2026"
echo ""
echo "📝 Logs ansehen:  docker compose -f docker-compose.local.yml logs -f"
echo "🛑 Stoppen:       docker compose -f docker-compose.local.yml down"
