/**
 * Telegram Bot Service - Сервис уведомлений
 * 
 * Отправляет уведомления о торговых операциях, сигналах AI,
 * статусе ботов и общей статистике в Telegram
 */

import express, { Request, Response } from 'express';
import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';

dotenv.config();

// Конфигурация
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const PORT = process.env.PORT || 3003;

if (!BOT_TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN не задан в .env!');
  process.exit(1);
}

// Инициализация Telegram бота
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Хранилище подписчиков (в продакшене - база данных)
const subscribers = new Set<number>();

// Инициализация Express для приёма уведомлений
const app = express();
app.use(express.json());

console.log('🤖 Telegram бот запущен!');

// ============================================
// КОМАНДЫ TELEGRAM БОТА
// ============================================

// Команда /start - приветствие и регистрация
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  subscribers.add(chatId);
  
  const welcomeMessage = `
🚀 *Добро пожаловать в Quantum Hedge!*

Я бот для уведомлений о вашей торговле.

📊 *Что я умею:*
• Отправлять уведомления о сделках
• Показывать сигналы от AI
• Отчёты о прибыли
• Статус торговых ботов

📋 *Доступные команды:*
/start - Запустить бота
/stats - Текущая статистика
/balance - Показать баланс
/bots - Список активных ботов
/positions - Открытые позиции
/profit - Прибыль за период
/signals - Последние AI сигналы
/help - Помощь

💡 *Ваш Chat ID:* \`${chatId}\`

Сохраните его в файл .env как TELEGRAM_CHAT_ID
  `;
  
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Команда /help - справка
bot.onText(/\/help/, (msg) => {
  const helpMessage = `
📚 *Справка по командам:*

🚀 */start* - Запуск бота и регистрация
📊 */stats* - Полная статистика торговли
💰 */balance* - Текущий баланс
🤖 */bots* - Список активных ботов
📈 */positions* - Открытые позиции
💵 */profit* - Прибыль за период
🔔 */signals* - Последние AI сигналы
❓ */help* - Эта справка

🛡️ *Безопасность:*
• Никому не показывайте ваш Chat ID
• Бот не запрашивает пароли или приватные ключи
• Все данные шифруются
  `;
  
  bot.sendMessage(msg.chat.id, helpMessage, { parse_mode: 'Markdown' });
});

// Команда /stats - статистика
bot.onText(/\/stats/, async (msg) => {
  // TODO: получить реальную статистику из API
  const stats = `
📊 *Статистика торговли*

💰 *Общий баланс:* $5,125.50
📈 *Прибыль сегодня:* +$125.50 (+2.51%)
📊 *Прибыль за неделю:* +$487.30 (+10.5%)
💵 *Прибыль за месяц:* +$1,234.80 (+24.7%)

🤖 *Активных ботов:* 3
✅ *Win rate:* 73%
📦 *Всего сделок:* 156
  `;
  
  bot.sendMessage(msg.chat.id, stats, { parse_mode: 'Markdown' });
});

// Команда /balance - баланс
bot.onText(/\/balance/, async (msg) => {
  // TODO: получить реальный баланс из Binance API
  const balance = `
💰 *Текущий баланс*

USDT: $3,500.00
BTC: 0.025 (~$1,687.50)
ETH: 0.5 (~$1,825.00)
SOL: 10 (~$1,450.00)

*Итого:* $8,462.50
  `;
  
  bot.sendMessage(msg.chat.id, balance, { parse_mode: 'Markdown' });
});

// Команда /bots - список ботов
bot.onText(/\/bots/, async (msg) => {
  const botsList = `
🤖 *Активные торговые боты*

1️⃣ *Grid Bot - BTC/USDT*
   • Статус: 🟢 Работает
   • Прибыль: +$245.50 (+4.9%)
   • Сделок: 47

2️⃣ *DCA Bot - ETH/USDT*
   • Статус: 🟢 Работает
   • Прибыль: +$180.20 (+3.6%)
   • Циклов: 2

3️⃣ *AI Signal Bot - SOL/USDT*
   • Статус: 🟡 Ожидание
   • Прибыль: +$87.30 (+8.7%)
   • Сделок: 12
  `;
  
  bot.sendMessage(msg.chat.id, botsList, { parse_mode: 'Markdown' });
});

// Команда /positions - открытые позиции
bot.onText(/\/positions/, async (msg) => {
  const positions = `
📈 *Открытые позиции*

1️⃣ *BTC/USDT* (LONG)
   💵 Вход: $67,500
   📊 Текущая: $68,200 (+1.04%)
   💰 P&L: +$70.00
   🛑 SL: $65,475
   🎯 TP: $70,875

2️⃣ *ETH/USDT* (LONG)
   💵 Вход: $3,650
   📊 Текущая: $3,720 (+1.92%)
   💰 P&L: +$35.00
   🛑 SL: $3,520
   🎯 TP: $4,100
  `;
  
  bot.sendMessage(msg.chat.id, positions, { parse_mode: 'Markdown' });
});

// Команда /profit - прибыль
bot.onText(/\/profit/, async (msg) => {
  const profit = `
💵 *Отчёт о прибыли*

📅 *Сегодня:* +$125.50 (+2.51%)
   • Сделок: 12 (10 win / 2 loss)
   • Win rate: 83.3%

📆 *На этой неделе:* +$487.30 (+10.5%)
   • Сделок: 67 (48 win / 19 loss)
   • Win rate: 71.6%

📅 *В этом месяце:* +$1,234.80 (+24.7%)
   • Сделок: 234 (167 win / 67 loss)
   • Win rate: 71.4%

🏆 *Лучшая сделка:* BTC/USDT +$87.50 (+5.2%)
😔 *Худшая сделка:* SOL/USDT -$23.40 (-3.1%)
  `;
  
  bot.sendMessage(msg.chat.id, profit, { parse_mode: 'Markdown' });
});

// Команда /signals - AI сигналы
bot.onText(/\/signals/, async (msg) => {
  const signals = `
🔔 *Последние AI сигналы*

1️⃣ *BTC/USDT* - 🟢 BUY (85% confidence)
   💵 Вход: $67,500
   🛑 SL: $65,475
   🎯 TP: $70,875
   📝 Бычий тренд + накопление китов

2️⃣ *ETH/USDT* - 🟢 BUY (78% confidence)
   💵 Вход: $3,650
   🛑 SL: $3,520
   🎯 TP: $3,950
   📝 Восходящий треугольник

3️⃣ *SOL/USDT* - 🔴 SELL (72% confidence)
   💵 Вход: $148
   🛑 SL: $152
   🎯 TP: $142
   📝 Перекупленность RSI > 75
  `;
  
  bot.sendMessage(msg.chat.id, signals, { parse_mode: 'Markdown' });
});

// ============================================
// API ДЛЯ ПРИЁМА УВЕДОМЛЕНИЙ
// ============================================

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    service: 'telegram-bot',
    subscribers: subscribers.size 
  });
});

// Отправить уведомление всем подписчикам
app.post('/api/v1/notify', async (req: Request, res: Response) => {
  const { type, data } = req.body;
  
  if (!type || !data) {
    return res.status(400).json({ error: 'Не указан type или data' });
  }
  
  const message = formatNotification(type, data);
  
  let sent = 0;
  let failed = 0;
  
  for (const chatId of subscribers) {
    try {
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      sent++;
    } catch (error) {
      console.error(`❌ Ошибка отправки в чат ${chatId}:`, error);
      failed++;
    }
  }
  
  res.json({ success: true, sent, failed, subscribers: subscribers.size });
});

// Отправить уведомление конкретному пользователю
app.post('/api/v1/notify/:chatId', async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const { type, data } = req.body;
  
  const message = formatNotification(type, data);
  
  try {
    await bot.sendMessage(parseInt(chatId), message, { parse_mode: 'Markdown' });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ФОРМАТИРОВАНИЕ УВЕДОМЛЕНИЙ
// ============================================

function formatNotification(type: string, data: any): string {
  switch (type) {
    case 'TRADE_OPENED':
      return `
📈 *Новая позиция открыта!*

🤖 Бот: ${data.botName}
💱 Пара: ${data.symbol}
📊 Тип: ${data.side === 'BUY' ? '🟢 BUY' : '🔴 SELL'}
💵 Цена: $${data.price}
📦 Количество: ${data.quantity}
💰 Сумма: $${data.amount}

🛑 Stop-loss: $${data.stopLoss || 'не задан'}
🎯 Take-profit: $${data.takeProfit || 'не задан'}
      `;
    
    case 'TRADE_CLOSED':
      const profitEmoji = data.profit >= 0 ? '✅' : '❌';
      const profitSign = data.profit >= 0 ? '+' : '';
      return `
${profitEmoji} *Сделка закрыта ${data.profit >= 0 ? 'с прибылью' : 'с убытком'}!*

🤖 Бот: ${data.botName}
💱 Пара: ${data.symbol}
💵 Вход: $${data.entryPrice}
💵 Выход: $${data.exitPrice}
📊 Прибыль: ${profitSign}$${data.profit.toFixed(2)} (${profitSign}${data.profitPercent.toFixed(2)}%)
⏱ Длительность: ${data.duration}
      `;
    
    case 'AI_SIGNAL':
      return `
🔔 *Новый сигнал от AI!*

💱 Пара: ${data.symbol}
🎯 Действие: ${data.action === 'BUY' ? '🟢 BUY' : data.action === 'SELL' ? '🔴 SELL' : '🟡 HOLD'}
📊 Уверенность: ${(data.confidence * 100).toFixed(0)}%

💵 Вход: $${data.entryPrice}
🛑 Stop-loss: $${data.stopLoss}
🎯 Take-profit: ${data.takeProfit?.map((tp: number, i: number) => `\n  TP${i+1}: $${tp}`).join('')}

📝 *Обоснование:*
${data.reasoning?.map((r: string) => `• ${r}`).join('\n')}
      `;
    
    case 'STOP_LOSS_HIT':
      return `
🚨 *Сработал Stop-Loss!*

🤖 Бот: ${data.botName}
💱 Пара: ${data.symbol}
💵 Вход: $${data.entryPrice}
💵 Выход: $${data.exitPrice}
📉 Убыток: -$${Math.abs(data.loss).toFixed(2)} (-${Math.abs(data.lossPercent).toFixed(2)}%)

⚠️ Бот защитил ваш капитал от больших потерь
      `;
    
    case 'TAKE_PROFIT_HIT':
      return `
🎯 *Сработал Take-Profit!*

🤖 Бот: ${data.botName}
💱 Пара: ${data.symbol}
💵 Вход: $${data.entryPrice}
💵 Выход: $${data.exitPrice}
📈 Прибыль: +$${data.profit.toFixed(2)} (+${data.profitPercent.toFixed(2)}%)

🎉 Поздравляем с прибыльной сделкой!
      `;
    
    case 'DAILY_REPORT':
      return `
📊 *Дневной отчёт - ${new Date().toLocaleDateString('ru-RU')}*

💰 Прибыль за день: ${data.dailyProfit >= 0 ? '+' : ''}$${data.dailyProfit.toFixed(2)} (${data.dailyProfit >= 0 ? '+' : ''}${data.dailyProfitPercent.toFixed(2)}%)
📈 Закрытых сделок: ${data.totalTrades} (${data.wins} win / ${data.losses} loss)
🎯 Win rate: ${data.winRate.toFixed(1)}%

🤖 *По ботам:*
${data.bots?.map((b: any) => `• ${b.name}: ${b.profit >= 0 ? '+' : ''}$${b.profit.toFixed(2)}`).join('\n')}

💼 Общий баланс: $${data.totalBalance.toFixed(2)}
      `;
    
    case 'BOT_STARTED':
      return `
🚀 *Бот запущен!*

🤖 Имя: ${data.botName}
💱 Пара: ${data.symbol}
📊 Тип: ${data.type}
💰 Капитал: $${data.investment}
      `;
    
    case 'BOT_STOPPED':
      return `
🛑 *Бот остановлен*

🤖 Имя: ${data.botName}
💱 Пара: ${data.symbol}
📊 Итог: ${data.totalProfit >= 0 ? '+' : ''}$${data.totalProfit.toFixed(2)} (${data.totalProfit >= 0 ? '+' : ''}${data.totalProfitPercent.toFixed(2)}%)
📦 Всего сделок: ${data.totalTrades}
      `;
    
    case 'ERROR':
      return `
⚠️ *Ошибка в системе!*

🔴 Тип: ${data.errorType}
📝 Описание: ${data.message}
🤖 Бот: ${data.botName || 'N/A'}
⏰ Время: ${new Date().toLocaleString('ru-RU')}

Проверьте логи и при необходимости перезапустите бота.
      `;
    
    default:
      return `📢 *Уведомление*\n\n${JSON.stringify(data, null, 2)}`;
  }
}

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Telegram Bot Service запущен на порту ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}`);
  console.log(`🤖 Bot Token: ${BOT_TOKEN.substring(0, 10)}...`);
});

// Обработка ошибок
process.on('uncaughtException', (error) => {
  console.error('❌ Необработанная ошибка:', error);
});

bot.on('polling_error', (error) => {
  console.error('❌ Ошибка Telegram polling:', error);
});

export { bot, app };
