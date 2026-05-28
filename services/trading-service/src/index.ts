/**
 * Trading Service - Main Entry Point
 * Handles order execution, position management, and trading bots
 */

import express, { Request, Response } from 'express';
import { GridBot, GridBotConfig } from './bots/grid-bot';
import { DCABot, DCABotConfig } from './bots/dca-bot';
import { BinanceConnector } from './exchanges/binance-connector';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;

// Active bots registry
const activeBots = new Map<string, GridBot | DCABot>();

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'trading-service' });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Quantum Hedge Trading Service',
    version: '0.1.0',
    status: 'operational',
    endpoints: [
      'POST /api/v1/bots/grid/create',
      'POST /api/v1/bots/dca/create',
      'POST /api/v1/bots/:botId/start',
      'POST /api/v1/bots/:botId/stop',
      'GET  /api/v1/bots/:botId/stats',
      'GET  /api/v1/bots',
    ],
  });
});

// Create Grid Bot
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
      message: 'Grid bot created. Use /start to begin trading.',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Create DCA Bot
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
      message: 'DCA bot created. Use /start to begin trading.',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Start bot
app.post('/api/v1/bots/:botId/start', async (req: Request, res: Response) => {
  const bot = activeBots.get(req.params.botId);
  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }
  
  try {
    await bot.start();
    res.json({ success: true, message: 'Bot started' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Stop bot
app.post('/api/v1/bots/:botId/stop', async (req: Request, res: Response) => {
  const bot = activeBots.get(req.params.botId);
  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }
  
  try {
    await bot.stop();
    res.json({ success: true, message: 'Bot stopped' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get bot stats
app.get('/api/v1/bots/:botId/stats', (req: Request, res: Response) => {
  const bot = activeBots.get(req.params.botId);
  if (!bot) {
    return res.status(404).json({ error: 'Bot not found' });
  }
  
  res.json(bot.getStats());
});

// List all bots
app.get('/api/v1/bots', (_req: Request, res: Response) => {
  const bots = Array.from(activeBots.entries()).map(([id, bot]) => ({
    botId: id,
    type: id.startsWith('grid') ? 'GRID' : 'DCA',
    stats: bot.getStats(),
  }));
  
  res.json({ bots, total: bots.length });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Trading Service running on port ${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/v1`);
});

export default app;
