.PHONY: help install start stop restart logs clean build test migrate seed

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	@echo "📚 Installing dependencies..."
	@npm install
	@cd services/user-service && npm install
	@cd services/trading-service && npm install

start: ## Start all Docker services
	@echo "🐳 Starting Docker services..."
	@docker-compose up -d
	@echo "✅ Services started"
	@echo "📊 Grafana: http://localhost:3001"
	@echo "📈 Prometheus: http://localhost:9090"

stop: ## Stop all Docker services
	@echo "🛑 Stopping Docker services..."
	@docker-compose down

restart: ## Restart all Docker services
	@make stop
	@make start

logs: ## Show Docker logs
	@docker-compose logs -f

clean: ## Clean up Docker volumes and build artifacts
	@echo "🧹 Cleaning up..."
	@docker-compose down -v
	@rm -rf node_modules
	@rm -rf services/*/node_modules
	@rm -rf services/*/dist
	@echo "✅ Cleanup complete"

build: ## Build all services
	@echo "🔨 Building services..."
	@npm run build

dev: ## Start development servers
	@echo "🚀 Starting development servers..."
	@npm run dev

test: ## Run tests
	@echo "🧪 Running tests..."
	@npm run test

migrate: ## Run database migrations
	@echo "📦 Running migrations..."
	@cd services/user-service && npx prisma migrate dev
	@cd services/trading-service && npx prisma migrate dev

migrate-deploy: ## Deploy migrations to production
	@echo "📦 Deploying migrations..."
	@cd services/user-service && npx prisma migrate deploy
	@cd services/trading-service && npx prisma migrate deploy

seed: ## Seed database with test data
	@echo "🌱 Seeding database..."
	@cd services/user-service && npx prisma db seed

init: ## Initialize project (first time setup)
	@echo "🚀 Initializing Quantum Hedge..."
	@make install
	@make start
	@sleep 30
	@./scripts/init-databases.sh
	@echo "🎉 Initialization complete!"

quick-start: ## Quick start (all-in-one)
	@./scripts/quick-start.sh

status: ## Show status of all services
	@echo "📊 Service Status:"
	@docker-compose ps

db-shell: ## Connect to PostgreSQL shell
	@docker exec -it quantum-postgres psql -U quantum -d quantum_hedge

redis-cli: ## Connect to Redis CLI
	@docker exec -it quantum-redis redis-cli -a quantum_redis_password

kafka-topics: ## List Kafka topics
	@docker exec quantum-kafka kafka-topics --list --bootstrap-server localhost:9092
