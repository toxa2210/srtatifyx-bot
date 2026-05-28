.PHONY: help install start stop restart logs clean build test migrate seed

# ============================================
# QUANTUM HEDGE - Команды управления проектом
# ============================================

help: ## Показать справку
	@echo '╔══════════════════════════════════════════════════╗'
	@echo '║       QUANTUM HEDGE - Управление проектом        ║'
	@echo '╚══════════════════════════════════════════════════╝'
	@echo ''
	@echo 'Использование: make [команда]'
	@echo ''
	@echo 'Доступные команды:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Установить все зависимости
	@echo "📚 Установка зависимостей..."
	@npm install
	@cd services/user-service && npm install
	@cd services/trading-service && npm install
	@cd services/telegram-bot && npm install
	@echo "✅ Зависимости установлены"

start: ## Запустить все Docker сервисы
	@echo "🐳 Запуск Docker сервисов..."
	@docker-compose up -d
	@echo "✅ Сервисы запущены"
	@echo ""
	@echo "📊 Доступные сервисы:"
	@echo "  🌐 Web App:        http://localhost:3000"
	@echo "  👤 User API:       http://localhost:3001"
	@echo "  💹 Trading API:    http://localhost:3002"
	@echo "  📡 Telegram Bot:   http://localhost:3003"
	@echo "  🤖 AI API:         http://localhost:8000"
	@echo "  📊 Grafana:        http://localhost:3001 (admin/admin)"
	@echo "  📈 Prometheus:     http://localhost:9090"

stop: ## Остановить все Docker сервисы
	@echo "🛑 Остановка Docker сервисов..."
	@docker-compose down

restart: ## Перезапустить все Docker сервисы
	@make stop
	@make start

logs: ## Показать логи Docker
	@docker-compose logs -f

clean: ## Очистить Docker volumes и build артефакты
	@echo "🧹 Очистка..."
	@docker-compose down -v
	@rm -rf node_modules
	@rm -rf services/*/node_modules
	@rm -rf services/*/dist
	@echo "✅ Очистка завершена"

build: ## Собрать все сервисы
	@echo "🔨 Сборка сервисов..."
	@npm run build

dev: ## Запустить dev-сервера
	@echo "🚀 Запуск dev-серверов..."
	@npm run dev

test: ## Запустить тесты
	@echo "🧪 Запуск тестов..."
	@npm run test

migrate: ## Применить миграции БД
	@echo "📦 Применение миграций..."
	@cd services/user-service && npx prisma migrate dev
	@cd services/trading-service && npx prisma migrate dev

migrate-deploy: ## Применить миграции в продакшене
	@echo "📦 Применение миграций в продакшен..."
	@cd services/user-service && npx prisma migrate deploy
	@cd services/trading-service && npx prisma migrate deploy

seed: ## Заполнить БД тестовыми данными
	@echo "🌱 Заполнение тестовыми данными..."
	@cd services/user-service && npx prisma db seed

init: ## Инициализация проекта (первая установка)
	@echo "🚀 Инициализация Quantum Hedge..."
	@make install
	@make start
	@sleep 30
	@./scripts/init-databases.sh
	@echo "🎉 Инициализация завершена!"

quick-start: ## Быстрый старт (всё одной командой)
	@./scripts/quick-start.sh

status: ## Показать статус сервисов
	@echo "📊 Статус сервисов:"
	@docker-compose ps

db-shell: ## Открыть PostgreSQL консоль
	@docker exec -it quantum-postgres psql -U quantum -d quantum_hedge

redis-cli: ## Открыть Redis CLI
	@docker exec -it quantum-redis redis-cli -a quantum_redis_password

kafka-topics: ## Показать топики Kafka
	@docker exec quantum-kafka kafka-topics --list --bootstrap-server localhost:9092

telegram-test: ## Тест Telegram бота
	@echo "📡 Тест отправки сообщения в Telegram..."
	@curl -X POST http://localhost:3003/api/v1/notify \
		-H "Content-Type: application/json" \
		-d '{"type":"BOT_STARTED","data":{"botName":"Test Bot","symbol":"BTCUSDT","type":"Grid Bot","investment":1000}}'

build-prod: ## Собрать production Docker образы
	@echo "🏗️ Сборка production образов..."
	@docker-compose -f docker-compose.prod.yml build

prod-up: ## Запустить production
	@echo "🚀 Запуск production..."
	@docker-compose -f docker-compose.prod.yml up -d

prod-down: ## Остановить production
	@docker-compose -f docker-compose.prod.yml down
