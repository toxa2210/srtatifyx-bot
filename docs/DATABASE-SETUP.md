# Database Setup Guide — Quantum Hedge

Complete guide for setting up and managing databases for Quantum Hedge platform.

---

## 📊 Database Architecture

### Primary Databases

**1. PostgreSQL (Port 5432)**
- **Purpose:** Main application database
- **Services:** User Service, Trading Service
- **Tables:** Users, ApiKeys, Sessions, Orders, Positions, Bots
- **Size:** ~10GB (production estimate)

**2. TimescaleDB (Port 5433)**
- **Purpose:** Time-series data
- **Data:** Market data (OHLCV), Funding rates, Open interest
- **Retention:** 30 days hot, 365 days cold
- **Size:** ~50GB per year

**3. Redis (Port 6379)**
- **Purpose:** Cache and session storage
- **Data:** Hot cache, user sessions, rate limiting
- **TTL:** 5 seconds - 7 days depending on data type
- **Size:** ~2GB

**4. Elasticsearch (Port 9200)**
- **Purpose:** Log storage and search
- **Data:** Application logs, audit logs
- **Retention:** 30 days
- **Size:** ~20GB

---

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Start everything at once
make quick-start

# Or step by step
make install      # Install dependencies
make start        # Start Docker services
make migrate      # Run migrations
make seed         # Add test data
```

### Option 2: Manual Setup

**Step 1: Start Docker Compose**
```bash
docker-compose up -d
```

**Step 2: Wait for services to be ready**
```bash
# Check PostgreSQL
docker exec quantum-postgres pg_isready -U quantum

# Check Redis
docker exec quantum-redis redis-cli -a quantum_redis_password ping
```

**Step 3: Initialize databases**
```bash
./scripts/init-databases.sh
```

---

## 📦 Database Migrations

### User Service Migrations

```bash
cd services/user-service

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate dev

# Deploy to production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Trading Service Migrations

```bash
cd services/trading-service

# Same commands as User Service
npx prisma migrate dev --name migration_name
npx prisma migrate dev
npx prisma migrate deploy
npx prisma generate
```

---

## 🌱 Seeding Data

### Test Users

```bash
cd services/user-service
npm run seed
```

**Created users:**
- `admin@quantumhedge.ai` (ENTERPRISE tier) - Password: `Admin123!`
- `vip@example.com` (VIP tier) - Password: `Vip123!`
- `premium@example.com` (PREMIUM tier) - Password: `Premium123!`
- `free@example.com` (FREE tier) - Password: `Free123!`

---

## 🗃️ Database Schemas

### PostgreSQL - Main Database

**Tables:**
- `users` - User accounts and profiles
- `api_keys` - Encrypted exchange API keys
- `sessions` - Active user sessions
- `audit_logs` - Security audit trail
- `orders` - Trading orders
- `positions` - Open/closed positions
- `bots` - Trading bot configurations

### TimescaleDB - Time-Series Data

**Hypertables:**
- `market_data` - OHLCV candles (1m, 5m, 15m, 1h, 4h, 1d)
- `funding_rates` - Futures funding rates
- `open_interest` - Futures open interest data

**Indexes:**
- Primary: `(time DESC)`
- Secondary: `(symbol, time DESC)`

---

## 🔧 Database Management

### PostgreSQL Shell

```bash
# Connect to main database
make db-shell

# Or directly
docker exec -it quantum-postgres psql -U quantum -d quantum_hedge
```

**Common commands:**
```sql
-- List tables
\dt

-- Describe table
\d users

-- Show table size
SELECT pg_size_pretty(pg_total_relation_size('users'));

-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Kill all connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'quantum_hedge' AND pid <> pg_backend_pid();
```

### Redis CLI

```bash
# Connect to Redis
make redis-cli

# Or directly
docker exec -it quantum-redis redis-cli -a quantum_redis_password
```

**Common commands:**
```bash
# Get all keys
KEYS *

# Check key TTL
TTL key_name

# Get key value
GET key_name

# Delete key
DEL key_name

# Flush all data (DANGER!)
FLUSHALL
```

### TimescaleDB

```bash
# Connect to TimescaleDB
docker exec -it quantum-timescale psql -U quantum -d quantum_timeseries
```

**Common commands:**
```sql
-- Show hypertables
SELECT * FROM timescaledb_information.hypertables;

-- Show chunks
SELECT * FROM timescaledb_information.chunks;

-- Compress old data
SELECT compress_chunk(i) 
FROM show_chunks('market_data', older_than => INTERVAL '7 days') i;

-- Drop old data
SELECT drop_chunks('market_data', older_than => INTERVAL '30 days');
```

---

## 📈 Performance Tuning

### PostgreSQL Configuration

**Recommended settings for development:**
```sql
-- Connection pooling
max_connections = 100

-- Memory
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB

-- Query planner
random_page_cost = 1.1
effective_io_concurrency = 200
```

**For production, adjust based on server specs.**

### Indexing Strategy

```sql
-- User Service
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action, created_at);

-- Trading Service
CREATE INDEX idx_orders_user_symbol ON orders(user_id, symbol, created_at DESC);
CREATE INDEX idx_positions_user_status ON positions(user_id, status);
CREATE INDEX idx_bots_user_status ON bots(user_id, status);
```

---

## 🔒 Security

### Database Passwords

**Never commit production passwords!**

Development passwords are in `.env.example`. For production:

```bash
# Generate secure passwords
openssl rand -base64 32

# Store in secrets manager
# AWS Secrets Manager, HashiCorp Vault, etc.
```

### API Key Encryption

User API keys are encrypted using AES-256-GCM:
- Master key stored in AWS KMS
- User-specific encryption keys derived
- Never log or display plaintext keys

### Backup Strategy

```bash
# PostgreSQL backup
docker exec quantum-postgres pg_dump -U quantum quantum_hedge > backup.sql

# Restore
docker exec -i quantum-postgres psql -U quantum quantum_hedge < backup.sql

# Automated backups (production)
# Use AWS RDS automated backups or custom scripts
```

---

## 🐛 Troubleshooting

### Database won't start

```bash
# Check logs
docker-compose logs postgres
docker-compose logs timescaledb

# Remove volumes and restart (DANGER: data loss!)
docker-compose down -v
docker-compose up -d
```

### Migration fails

```bash
# Check current migration status
cd services/user-service
npx prisma migrate status

# Reset database (development only!)
npx prisma migrate reset

# Force deploy
npx prisma migrate deploy --skip-generate
```

### Connection issues

```bash
# Test connection
psql "postgresql://quantum:quantum_dev_password@localhost:5432/quantum_hedge"

# Check if port is open
nc -zv localhost 5432

# Check Docker network
docker network inspect quantum-network
```

---

## 📊 Monitoring

### Database Metrics

**Check from Prometheus:**
- Connection count
- Query execution time
- Cache hit ratio
- Disk usage

**Access Grafana:**
- URL: http://localhost:3001
- Username: `admin`
- Password: `admin`

### Slow Query Log

```sql
-- Enable slow query log (PostgreSQL)
ALTER DATABASE quantum_hedge SET log_min_duration_statement = 100;

-- View slow queries
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 📝 Environment Variables

```bash
# PostgreSQL
DATABASE_URL=postgresql://quantum:quantum_dev_password@localhost:5432/quantum_hedge

# TimescaleDB
TIMESCALE_URL=postgresql://quantum:quantum_dev_password@localhost:5433/quantum_timeseries

# Redis
REDIS_URL=redis://:quantum_redis_password@localhost:6379

# Kafka
KAFKA_BROKERS=localhost:9092

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200
```

---

## ✅ Checklist

- [ ] Docker Compose started
- [ ] All services healthy
- [ ] Migrations applied
- [ ] Test data seeded
- [ ] Grafana accessible
- [ ] Prometheus collecting metrics
- [ ] Backups configured (production)

---

**For production deployment, see:** `docs/PRODUCTION-DEPLOYMENT.md`
