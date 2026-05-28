/**
 * Trading Service - Главный модуль торгового сервиса
 * 
 * Обрабатывает:
 * - Исполнение торговых ордеров
 * - Управление позициями
 * - Запуск/остановку торговых ботов
 * - Отправку уведомлений в Telegram
 */

import express, { Request, Response } from 'express';
import axios from 'axios';
import { GridBot, GridBotConfig } from './bots/grid-bot';
import { DCABot, DCABotConfig } from './bots/dca-bot';
import { BinanceConnector } from './exchanges/binance-connector';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;
const TELEGRAM_BOT_URL = process.env.TELEGRAM_BOT_URL || 'http://telegram-bot:3003';

// Реестр активных ботов
const activeBots = new Map<string, GridBot | DCABot>();

/**
 * Отправить уведомление в Telegram
 */
async function notifyTelegram(type: string, data: any): Promise<void> {
  try {
    await axios.post(`${TELEGRAM_BOT_URL}/api/v1/notify`, { type, data });
  } catch (error) {
    console.error('❌ Ошибка отправки уведомления в Telegram:', error);
  }
}

// Health check - проверка работоспособности
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'trading-service' });
});

// Корневой endpoint - информация о сервисе
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Quantum Hedge Trading Service',
    version: '0.1.0',
    status: 'operational',
    endpoints: [
      'POST /api/v1/bots/grid/create     - Создать Grid бота',
      'POST /api/v1/bots/dca/create      - Создать DCA бота',
      'POST /api/v1/bots/:botId/start    - Запустить бота',
      'POST /api/v1/bots/:botId/stop     - Остановить бота',
      'GET  /api/v1/bots/:botId/stats    - Статистика бота',
      'GET  /api/v1/bots                 - Список всех ботов',
    ],
  });
});

/**
 * Создать Grid бота
 * Стратегия: покупает дёшево, продаёт дорого в диапазоне
 */
app.post('/api/v1/bots/grid/create', async (req: Request, res: Response) => {
  try {
    const config: GridBotConfig = req.body;
    const botId = `grid_${Date.now()}`;
    const bot = new GridBot(config);
    activeBots.set(botId, bot);
    
    res.json({
      success: true,
      botId,
      config,
      message: 'Grid бот создан. Используйте /start для запуска торговли.',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Создать DCA бота
 * Стратегия: усреднение цены через регулярные покупки
 */
app.post('/api/v1/bots/dca/create', async (req: Request, res: Response) => {
  try {
    const config: DCABotConfig = req.body;
    const botId = `dca_${Date.now()}`;
    const bot = new DCABot(config);
    activeBots.set(botId, bot);
    
    res.json({
      success: true,
      botId,
      config,
      message: 'DCA бот создан. Используйте /start для запуска торговли.',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Запустить бота
 */
app.post('/api/v1/bots/:botId/start', async (req: Request, res: Response) => {
  const bot = activeBots.get(req.params.botId);
  if (!bot) {
    return res.status(404).json({ error: 'Бот не найден' });
  }
  
  try {
    await bot.start();
    
    // Отправить уведомление в Telegram
    const stats = bot.getStats();
    await notifyTelegram('BOT_STARTED', {
      botName: req.params.botId,
      symbol: stats.symbol,
      type: req.params.botId.startsWith('grid') ? 'Grid Bot' : 'DCA Bot',
      investment: 1000, // TODO: получить из конфига
    });
    
    res.json({ success: true, message: 'Бот запущен' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Остановить бота
 */
app.post('/api/v1/bots/:botId/stop', async (req: Request, res: Response) => {
  const bot = activeBots.get(req.params.botId);
  if (!bot) {
    return res.status(404).json({ error: 'Бот не найден' });
  }
  
  try {
    await bot.stop();
    const stats = bot.getStats();
    
    // Отправить уведомление в Telegram
    await notifyTelegram('BOT_STOPPED', {
      botName: req.params.botId,
      symbol: stats.symbol,
      totalProfit: stats.totalProfit || 0,
      totalProfitPercent: 0, // TODO: вычислить
      totalTrades: stats.totalTrades || 0,
    });
    
    res.json({ success: true, message: 'Бот остановлен' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Получить статистику бота
 */
app.get('/api/v1/bots/:botId/stats', (req: Request, res: Response) => {
  const bot = activeBots.get(req.params.botId);
  if (!bot) {
    return res.status(404).json({ error: 'Бот не найден' });
  }
  
  res.json(bot.getStats());
});

/**
 * Получить список всех ботов
 */
app.get('/api/v1/bots', (_req: Request, res: Response) => {
  const bots = Array.from(activeBots.entries()).map(([id, bot]) => ({
    botId: id,
    type: id.startsWith('grid') ? 'GRID' : 'DCA',
    stats: bot.getStats(),
  }));
  
  res.json({ bots, total: bots.length });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Trading Service запущен на порту ${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/v1`);
  console.log(`📡 Telegram Bot URL: ${TELEGRAM_BOT_URL}`);
});

export default app;
