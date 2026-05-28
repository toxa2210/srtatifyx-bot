# 🚀 QUANTUM HEDGE - Quick Start Guide

## ⚡ Запуск проекта за 5 минут

### Способ 1: Автоматический (рекомендуется)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/toxa2210/srtatifyx-bot.git
cd srtatifyx-bot

# 2. Запустить всё одной командой
make quick-start
```

### Способ 2: Через Docker Compose

```bash
# Запустить все сервисы
docker-compose up -d

# Подождать 30 секунд для готовности
sleep 30

# Инициализировать базы данных
./scripts/init-databases.sh
```

### Способ 3: Production deployment

```bash
# Production сборка
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🌐 Доступные сервисы

После запуска откройте в браузере:

| Сервис | URL | Описание |
|--------|-----|----------|
| 🌐 **Web App** | http://localhost:3000 | Главное приложение |
| 👤 **User API** | http://localhost:3001/api/v1 | Аутентификация |
| 💹 **Trading API** | http://localhost:3002/api/v1 | Торговые боты |
| 🤖 **AI API** | http://localhost:8000 | AI агенты |
| 📊 **Grafana** | http://localhost:3001 | admin/admin |
| 📈 **Prometheus** | http://localhost:9090 | Метрики |

---

## 🎯 Первые шаги

### 1. Зарегистрировать пользователя

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "username": "yourname",
    "password": "YourPass123!"
  }'
```

### 2. Получить AI прогноз цены BTC

```bash
curl -X POST http://localhost:8000/api/v1/predict/price \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTC/USDT",
    "timeframe": "1h"
  }'
```

### 3. Создать Grid бота

```bash
curl -X POST http://localhost:3002/api/v1/bots/grid/create \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSDT",
    "lowerPrice": 60000,
    "upperPrice": 70000,
    "gridCount": 50,
    "investment": 1000,
    "mode": "NEUTRAL"
  }'
```

### 4. Запустить бота

```bash
curl -X POST http://localhost:3002/api/v1/bots/{BOT_ID}/start
```

---

## 🔑 Тестовые пользователи

После выполнения `make seed`:

```
admin@quantumhedge.ai     / Admin123!     (ENTERPRISE)
vip@example.com          / Vip123!       (VIP)
premium@example.com      / Premium123!   (PREMIUM)
free@example.com         / Free123!      (FREE)
```

---

## 🛠️ Полезные команды

```bash
make help           # Справка по командам
make start          # Запустить
make stop           # Остановить
make restart        # Перезапустить
make logs           # Посмотреть логи
make status         # Статус сервисов
make clean          # Очистить всё
make db-shell       # PostgreSQL консоль
make redis-cli      # Redis консоль
```

---

## 🐛 Решение проблем

### Docker не запускается

```bash
# Проверить статус
docker ps

# Перезапустить
make restart
```

### База данных не работает

```bash
# Проверить готовность PostgreSQL
docker exec quantum-postgres pg_isready -U quantum

# Полный сброс (ОСТОРОЖНО! Удалит все данные)
docker-compose down -v
docker-compose up -d
./scripts/init-databases.sh
```

### Порты заняты

```bash
# Найти что занимает порт
lsof -i :3000

# Или изменить порты в docker-compose.yml
```

---

## 📚 Дополнительная документация

- [README.md](README.md) - Полная документация
- [docs/01-SYSTEM-ARCHITECTURE.md](docs/01-SYSTEM-ARCHITECTURE.md) - Архитектура
- [docs/03-TRADING-SYSTEM.md](docs/03-TRADING-SYSTEM.md) - Торговая система
- [docs/DATABASE-SETUP.md](docs/DATABASE-SETUP.md) - Настройка БД

---

**Готово! Удачной разработки! 🚀**
