# 🚀 QUANTUM HEDGE - Быстрый старт

## ⚡ Запуск проекта за 5 минут

### 📋 Что нужно перед стартом

1. ✅ **Docker Desktop** — [скачать](https://www.docker.com/products/docker-desktop)
2. ✅ **Git** — [скачать](https://git-scm.com)
3. ✅ **Аккаунт Binance** — [зарегистрироваться](https://www.binance.com)
4. ✅ **Telegram аккаунт**
5. ✅ **Минимум 4GB RAM** на компьютере
6. ✅ **10GB свободного места** на диске

---

## 🎯 Шаг 1: Скачать проект

```bash
git clone https://github.com/toxa2210/srtatifyx-bot.git
cd srtatifyx-bot
```

---

## 🔑 Шаг 2: Получить API ключи

### Binance API (для торговли)

**ВАЖНО:** Сначала используйте Testnet (без реальных денег)!

**Testnet (рекомендуется для начала):**
1. Зайти на https://testnet.binance.vision
2. Войти через GitHub
3. Generate HMAC_SHA256 Key
4. Сохранить API Key и Secret Key

**Production (когда готовы к реальной торговле):**
1. Зайти на https://www.binance.com
2. Профиль → API Management → Create API
3. **Настройки безопасности:**
   - ✅ Enable Reading
   - ✅ Enable Spot & Margin Trading
   - ❌ ВЫКЛЮЧИТЬ Enable Withdrawals
   - ✅ Restrict access to trusted IPs
4. Сохранить ключи

### Telegram Bot (для уведомлений)

**Создание бота:**
1. Открыть Telegram, найти **@BotFather**
2. Отправить команду `/newbot`
3. Придумать имя (например: "Мой Trading Bot")
4. Придумать username (например: "my_trading_bot_2024")
5. Получить токен

**Ваш текущий токен:**
```
8510965559:AAEFF0Jo6mrory_PZse2zenFWMRclEuRaVg
```

⚠️ **Совет:** После публикации в чате обязательно создайте новый!

**Получение Chat ID:**
1. Найти своего бота в Telegram
2. Нажать "Start"
3. Запустить QUANTUM HEDGE (см. ниже)
4. Бот пришлёт ваш Chat ID в первом сообщении

---

## ⚙️ Шаг 3: Настроить переменные окружения

```bash
# Скопировать шаблон
cp .env.example .env

# Открыть в редакторе (например, VS Code)
code .env
```

**Минимально необходимые переменные:**

```env
# Binance API
BINANCE_API_KEY=ваш-binance-api-key
BINANCE_API_SECRET=ваш-binance-api-secret
BINANCE_TESTNET=true

# Telegram
TELEGRAM_BOT_TOKEN=8510965559:AAEFF0Jo6mrory_PZse2zenFWMRclEuRaVg
TELEGRAM_CHAT_ID=ваш-chat-id

# Безопасность (сгенерировать!)
JWT_SECRET=сгенерируйте-32-символа
ENCRYPTION_KEY=сгенерируйте-32-символа
```

**Сгенерировать секреты:**
```bash
# В терминале
openssl rand -hex 32
```

---

## 🚀 Шаг 4: Запустить проект

### Вариант 1: Простой (одна команда)

```bash
make quick-start
```

Эта команда:
- ✅ Запустит все Docker контейнеры
- ✅ Инициализирует базы данных
- ✅ Применит миграции
- ✅ Создаст тестовые данные
- ✅ Покажет URL всех сервисов

### Вариант 2: Пошаговый

```bash
# 1. Запустить инфраструктуру
docker-compose up -d

# 2. Подождать 30 секунд
sleep 30

# 3. Инициализировать БД
./scripts/init-databases.sh

# 4. Установить зависимости
npm install

# 5. Запустить сервисы
npm run dev
```

---

## 🌐 Шаг 5: Проверить работу

После запуска откройте в браузере:

| Сервис | URL | Что это |
|--------|-----|---------|
| 🌐 **Web App** | http://localhost:3000 | Главное приложение |
| 👤 **User API** | http://localhost:3001 | Аутентификация |
| 💹 **Trading API** | http://localhost:3002 | Торговля |
| 🤖 **AI API** | http://localhost:8000 | AI агенты |
| 📡 **Telegram Bot** | http://localhost:3003 | Уведомления |
| 📊 **Grafana** | http://localhost:3001 | admin/admin |
| 📈 **Prometheus** | http://localhost:9090 | Метрики |

---

## 📱 Шаг 6: Настроить Telegram уведомления

### 1. Активировать бота

1. Открыть Telegram
2. Найти своего бота (по username который создали)
3. Нажать **"START"** или отправить `/start`
4. Бот пришлёт приветствие и ваш Chat ID
5. Скопировать Chat ID
6. Вставить в `.env` файл: `TELEGRAM_CHAT_ID=ваш-chat-id`

### 2. Перезапустить бота

```bash
make restart
```

### 3. Проверить уведомления

В Telegram отправьте боту:
- `/stats` — статистика
- `/balance` — баланс
- `/bots` — список ботов
- `/help` — все команды

---

## 🤖 Шаг 7: Создать первого бота

### Через API (curl)

**Создать Grid Bot для BTC:**

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

**Запустить бота:**

```bash
# Замените BOT_ID на ID из ответа выше
curl -X POST http://localhost:3002/api/v1/bots/BOT_ID/start
```

**Проверить статистику:**

```bash
curl http://localhost:3002/api/v1/bots/BOT_ID/stats
```

### Через веб-интерфейс (когда будет готов)

1. Открыть http://localhost:3000/bots
2. Нажать "Create Bot"
3. Выбрать тип: Grid Bot
4. Настроить параметры
5. Нажать "Start"

---

## 🎓 Шаг 8: Учиться на тестовой сети

**ОЧЕНЬ ВАЖНО:** Не торгуйте сразу на реальные деньги!

**План обучения (4 недели):**

**Неделя 1: Знакомство**
- Запустить Grid Bot на Testnet
- Изучить как работает
- Посмотреть статистику в Telegram
- НЕ менять параметры

**Неделя 2: Эксперименты**
- Попробовать DCA Bot
- Изменить параметры (диапазон, размер)
- Сравнить результаты
- Записать что работает лучше

**Неделя 3: AI сигналы**
- Подключить AI agents
- Получать сигналы в Telegram
- Проверить точность
- Не торговать по слабым сигналам (<70%)

**Неделя 4: Подготовка к реальной торговле**
- Настроить риск-менеджмент
- Установить stop-loss на ВСЕ сделки
- Подготовить капитал ($100-500)
- Получить production API ключи

---

## 💰 Шаг 9: Переход на реальную торговлю

### Чек-лист перед запуском с реальными деньгами:

- [ ] Месяц на Testnet с положительным результатом
- [ ] Понимаю как работает Grid Bot
- [ ] Понимаю как работает DCA Bot
- [ ] Настроены все stop-loss
- [ ] Получены production API ключи Binance
- [ ] Изменён `BINANCE_TESTNET=false` в `.env`
- [ ] Стартовый капитал $100-500 (НЕ БОЛЬШЕ!)
- [ ] Готов к возможной потере 30-50% капитала
- [ ] Включён 2FA в Telegram
- [ ] Включён 2FA на Binance
- [ ] API ключи без права вывода

### Запуск с реальными деньгами:

```bash
# 1. Изменить в .env
BINANCE_TESTNET=false

# 2. Перезапустить
make restart

# 3. Проверить баланс
# В Telegram: /balance

# 4. Создать малого бота ($100)
# Начните с малого!
```

---

## 🛠️ Полезные команды

```bash
make help           # Справка по всем командам
make start          # Запустить
make stop           # Остановить
make restart        # Перезапустить
make logs           # Посмотреть логи
make status         # Статус сервисов
make clean          # Очистить всё (удалит данные!)

# Базы данных
make db-shell       # PostgreSQL консоль
make redis-cli      # Redis консоль
make migrate        # Применить миграции
make seed           # Добавить тестовые данные

# Разработка
make build          # Собрать проект
make test           # Запустить тесты
make dev            # Dev сервер
```

---

## 🐛 Решение проблем

### Docker не запускается

```bash
# Проверить статус
docker ps

# Посмотреть логи
docker-compose logs

# Перезапустить
make restart
```

### База данных не работает

```bash
# Проверить готовность PostgreSQL
docker exec quantum-postgres pg_isready -U quantum

# Полный сброс (ОСТОРОЖНО! Удалит данные)
docker-compose down -v
docker-compose up -d
./scripts/init-databases.sh
```

### Telegram бот не отвечает

```bash
# Проверить запущен ли
docker ps | grep telegram

# Посмотреть логи
docker logs quantum-telegram-bot

# Проверить токен в .env
cat .env | grep TELEGRAM
```

### Порты заняты

```bash
# Найти что занимает порт
lsof -i :3000

# Остановить процесс
kill -9 <PID>

# Или изменить порт в docker-compose.yml
```

### Ошибки Binance API

```bash
# Проверить ключи
cat .env | grep BINANCE

# Проверить IP whitelist на Binance
# Должен совпадать с вашим публичным IP
curl ifconfig.me
```

---

## 📚 Что читать дальше

1. **[README.md](README.md)** — полная документация
2. **[BOT_INSTRUCTIONS.md](BOT_INSTRUCTIONS.md)** — инструкция по ботам
3. **[docs/03-TRADING-SYSTEM.md](docs/03-TRADING-SYSTEM.md)** — торговая система
4. **[docs/02-AI-AGENTS-ECOSYSTEM.md](docs/02-AI-AGENTS-ECOSYSTEM.md)** — AI агенты

---

## ⚠️ Важные предупреждения

1. 🚫 **НЕ давайте API ключи никому**
2. 🚫 **НЕ включайте Withdrawals** в API
3. 🚫 **НЕ торгуйте без stop-loss**
4. 🚫 **НЕ инвестируйте больше чем готовы потерять**
5. 🚫 **НЕ используйте плечо** для начала
6. ✅ **Используйте Testnet** для обучения
7. ✅ **Включите 2FA** везде
8. ✅ **Делайте бэкапы** настроек
9. ✅ **Мониторьте** логи и Telegram
10. ✅ **Учитесь** на каждой сделке

---

## 🆘 Нужна помощь?

- 📧 **Email:** support@quantumhedge.ai
- 💬 **Telegram:** @quantumhedge_support
- 🐛 **GitHub:** [Issues](https://github.com/toxa2210/srtatifyx-bot/issues)

---

**Готово! Удачной торговли! 🚀💰**
