/**
 * Grid Trading Bot
 * Buys low and sells high within a price range
 */

export interface GridBotConfig {
  symbol: string;
  lowerPrice: number;
  upperPrice: number;
  gridCount: number;
  investment: number;
  mode: 'NEUTRAL' | 'LONG' | 'SHORT';
  stopLoss?: number;
  takeProfit?: number;
}

export interface GridLevel {
  price: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  status: 'OPEN' | 'FILLED' | 'CANCELLED';
  orderId?: string;
}

export class GridBot {
  private config: GridBotConfig;
  private gridLevels: GridLevel[] = [];
  private isRunning: boolean = false;
  private totalProfit: number = 0;
  private totalTrades: number = 0;

  constructor(config: GridBotConfig) {
    this.config = config;
    this.calculateGridLevels();
  }

  /**
   * Calculate grid price levels based on configuration
   */
  private calculateGridLevels(): void {
    const { lowerPrice, upperPrice, gridCount, investment } = this.config;
    const priceStep = (upperPrice - lowerPrice) / gridCount;
    const investmentPerGrid = investment / gridCount;

    this.gridLevels = [];

    for (let i = 0; i <= gridCount; i++) {
      const price = lowerPrice + priceStep * i;
      const quantity = investmentPerGrid / price;

      this.gridLevels.push({
        price,
        quantity,
        side: 'BUY',
        status: 'OPEN',
      });
    }
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Bot is already running');
    }

    this.isRunning = true;
    console.log(`🤖 Grid Bot started for ${this.config.symbol}`);
    console.log(`📊 Range: $${this.config.lowerPrice} - $${this.config.upperPrice}`);
    console.log(`📐 Grid count: ${this.config.gridCount}`);
    console.log(`💰 Investment: $${this.config.investment}`);

    // Place initial buy orders below current price
    // Place initial sell orders above current price
    // TODO: Integrate with Binance API
  }

  /**
   * Stop the bot
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log(`🛑 Grid Bot stopped for ${this.config.symbol}`);
    
    // Cancel all open orders
    // TODO: Cancel orders via Binance API
  }

  /**
   * Handle filled order event
   */
  async onOrderFilled(orderId: string, fillPrice: number, fillQuantity: number): Promise<void> {
    const level = this.gridLevels.find(l => l.orderId === orderId);
    if (!level) return;

    level.status = 'FILLED';
    this.totalTrades++;

    if (level.side === 'BUY') {
      // Place sell order one grid above
      const sellPrice = level.price * 1.01; // 1% profit per grid
      // TODO: Place sell order via Binance API
      console.log(`📈 Buy filled at $${fillPrice}, placing sell at $${sellPrice}`);
    } else {
      // Place buy order one grid below
      const buyPrice = level.price * 0.99;
      // TODO: Place buy order via Binance API
      console.log(`📉 Sell filled at $${fillPrice}, placing buy at $${buyPrice}`);
      
      // Calculate profit
      this.totalProfit += (fillPrice - level.price) * fillQuantity;
    }
  }

  /**
   * Get bot statistics
   */
  getStats() {
    return {
      symbol: this.config.symbol,
      isRunning: this.isRunning,
      totalProfit: this.totalProfit,
      totalTrades: this.totalTrades,
      activeGrids: this.gridLevels.filter(l => l.status === 'OPEN').length,
      filledGrids: this.gridLevels.filter(l => l.status === 'FILLED').length,
    };
  }
}
