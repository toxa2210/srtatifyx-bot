#!/bin/bash

# Script to initialize all databases for Quantum Hedge
# Run this after starting Docker Compose

set -e

echo "🚀 Initializing Quantum Hedge Databases..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until docker exec quantum-postgres pg_isready -U quantum > /dev/null 2>&1; do
  sleep 1
done
echo "✅ PostgreSQL is ready"

# Wait for TimescaleDB to be ready
echo "⏳ Waiting for TimescaleDB..."
until docker exec quantum-timescale pg_isready -U quantum > /dev/null 2>&1; do
  sleep 1
done
echo "✅ TimescaleDB is ready"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis..."
until docker exec quantum-redis redis-cli -a quantum_redis_password ping > /dev/null 2>&1; do
  sleep 1
done
echo "✅ Redis is ready"

# Run Prisma migrations for User Service
echo "📦 Running User Service migrations..."
cd services/user-service
npx prisma migrate dev --name init --skip-generate
npx prisma generate
cd ../..
echo "✅ User Service database initialized"

# Run Prisma migrations for Trading Service
echo "📦 Running Trading Service migrations..."
cd services/trading-service
npx prisma migrate dev --name init --skip-generate
npx prisma generate
cd ../..
echo "✅ Trading Service database initialized"

# Initialize TimescaleDB hypertables
echo "📊 Creating TimescaleDB hypertables..."
docker exec quantum-timescale psql -U quantum -d quantum_timeseries -c "
  CREATE EXTENSION IF NOT EXISTS timescaledb;
  
  -- Market data (OHLCV)
  CREATE TABLE IF NOT EXISTS market_data (
    time TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    timeframe VARCHAR(5) NOT NULL,
    open DECIMAL(20, 8),
    high DECIMAL(20, 8),
    low DECIMAL(20, 8),
    close DECIMAL(20, 8),
    volume DECIMAL(20, 8),
    quote_volume DECIMAL(20, 8),
    trades_count INT
  );
  
  SELECT create_hypertable('market_data', 'time', if_not_exists => TRUE);
  CREATE INDEX IF NOT EXISTS idx_market_data_symbol_time ON market_data (symbol, time DESC);
  
  -- Funding rates
  CREATE TABLE IF NOT EXISTS funding_rates (
    time TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    funding_rate DECIMAL(10, 8),
    mark_price DECIMAL(20, 8)
  );
  
  SELECT create_hypertable('funding_rates', 'time', if_not_exists => TRUE);
  CREATE INDEX IF NOT EXISTS idx_funding_rates_symbol_time ON funding_rates (symbol, time DESC);
  
  -- Open interest
  CREATE TABLE IF NOT EXISTS open_interest (
    time TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    open_interest DECIMAL(20, 8),
    open_interest_value DECIMAL(20, 8)
  );
  
  SELECT create_hypertable('open_interest', 'time', if_not_exists => TRUE);
  CREATE INDEX IF NOT EXISTS idx_open_interest_symbol_time ON open_interest (symbol, time DESC);
"
echo "✅ TimescaleDB hypertables created"

# Create Kafka topics
echo "📨 Creating Kafka topics..."
docker exec quantum-kafka kafka-topics --create --if-not-exists --topic market.ticker --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
docker exec quantum-kafka kafka-topics --create --if-not-exists --topic market.orderbook --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
docker exec quantum-kafka kafka-topics --create --if-not-exists --topic market.trades --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
docker exec quantum-kafka kafka-topics --create --if-not-exists --topic user.orders --bootstrap-server localhost:9092 --partitions 5 --replication-factor 1
docker exec quantum-kafka kafka-topics --create --if-not-exists --topic ai.signals --bootstrap-server localhost:9092 --partitions 3 --replication-factor 1
echo "✅ Kafka topics created"

echo ""
echo "🎉 All databases initialized successfully!"
echo ""
echo "📝 Next steps:"
echo "  1. Start services: npm run dev"
echo "  2. Access Grafana: http://localhost:3001 (admin/admin)"
echo "  3. Access Prometheus: http://localhost:9090"
echo ""
