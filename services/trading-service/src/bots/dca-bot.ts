/**
 * DCA (Dollar Cost Averaging) Bot
 * Buys at regular intervals or on price drops to average entry price
 */

export interface DCABotConfig {
  symbol: string;
  totalInvestment: number;
  orderAmount: number;
  intervalType: 'TIME' | 'PRICE' | 'SMART';
  intervalValue: number; // Hours (TIME) or % drop (PRICE)
  safetyOrders: number;
  safetyOrderDeviation: number;
  takeProfit: number;
  stopLoss?: number;
  trailingTakeProfit?: boolean;
}

export interface DCAOrder {
  orderNumber: number;
  price: number;
  amount: number;
  quantity: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
  filledAt?: Date;
}

export class DCABot {
  private config: DCABotConfig;
  private orders: DCAOrder[] = [];
  private isRunning: boolean = false;
  private avgEntryPrice: number = 0;
  private totalQuantity: number = 0;
  private totalInvested: number = 0;
  private currentDeviation: number = 0;

  constructor(config: DCABotConfig) {
    this.config = config;
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Bot is already running');
    }

    this.isRunning = true;
    console.log(`🤖 DCA Bot started for ${this.config.symbol}`);
    console.log(`💰 Total investment: $${this.config.totalInvestment}`);
    console.log(`📊 Order amount: $${this.config.orderAmount}`);
    console.log(`🛡️ Safety orders: ${this.config.safetyOrders}`);
    console.log(`🎯 Take profit: ${this.config.takeProfit}%`);

    // Place initial buy order
    await this.placeInitialOrder();
  }

  /**
   * Place the initial buy order at market price
   */
  private async placeInitialOrder(): Promise<void> {
    // TODO: Get current price from Binance
    const currentPrice = 0; // Placeholder
    const quantity = this.config.orderAmount / currentPrice;

    const order: DCAOrder = {
      orderNumber: 1,
      price: currentPrice,
      amount: this.config.orderAmount,
      quantity: quantity,
      status: 'PENDING',
    };

    this.orders.push(order);
    console.log(`📈 Initial order placed at $${currentPrice}`);
  }

  /**
   * Handle order filled event
   */
  async onOrderFilled(orderNumber: number, fillPrice: number, fillQuantity: number): Promise<void> {
    const order = this.orders.find(o => o.orderNumber === orderNumber);
    if (!order) return;

    order.status = 'FILLED';
    order.filledAt = new Date();

    // Update average entry price
    this.totalQuantity += fillQuantity;
    this.totalInvested += fillPrice * fillQuantity;
    this.avgEntryPrice = this.totalInvested / this.totalQuantity;

    console.log(`✅ Order #${orderNumber} filled at $${fillPrice}`);
    console.log(`📊 Avg entry: $${this.avgEntryPrice.toFixed(2)}`);
    console.log(`📦 Total quantity: ${this.totalQuantity.toFixed(8)}`);

    // Check if we should place safety order or take profit
    await this.checkConditions();
  }

  /**
   * Check market conditions and place orders accordingly
   */
  private async checkConditions(): Promise<void> {
    // TODO: Get current price from Binance
    const currentPrice = 0;

    // Calculate deviation from avg entry
    this.currentDeviation = ((currentPrice - this.avgEntryPrice) / this.avgEntryPrice) * 100;

    // Check take profit
    if (this.currentDeviation >= this.config.takeProfit) {
      await this.executeTakeProfit(currentPrice);
      return;
    }

    // Check stop loss
    if (this.config.stopLoss && this.currentDeviation <= -this.config.stopLoss) {
      await this.executeStopLoss(currentPrice);
      return;
    }

    // Check if we should place safety order
    const filledOrders = this.orders.filter(o => o.status === 'FILLED').length;
    if (filledOrders <= this.config.safetyOrders) {
      const expectedDeviation = -this.config.safetyOrderDeviation * filledOrders;
      if (this.currentDeviation <= expectedDeviation) {
        await this.placeSafetyOrder(currentPrice, filledOrders + 1);
      }
    }
  }

  /**
   * Place safety order on price drop
   */
  private async placeSafetyOrder(price: number, orderNumber: number): Promise<void> {
    const quantity = this.config.orderAmount / price;

    const order: DCAOrder = {
      orderNumber,
      price,
      amount: this.config.orderAmount,
      quantity,
      status: 'PENDING',
    };

    this.orders.push(order);
    console.log(`🛡️ Safety order #${orderNumber} placed at $${price}`);
  }

  /**
   * Execute take profit (sell all)
   */
  private async executeTakeProfit(currentPrice: number): Promise<void> {
    const profit = (currentPrice - this.avgEntryPrice) * this.totalQuantity;
    const profitPercent = ((currentPrice - this.avgEntryPrice) / this.avgEntryPrice) * 100;

    console.log(`🎯 Take profit triggered!`);
    console.log(`💰 Profit: $${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)`);

    // TODO: Sell all via Binance API
    await this.stop();
  }

  /**
   * Execute stop loss (sell all at loss)
   */
  private async executeStopLoss(currentPrice: number): Promise<void> {
    const loss = (currentPrice - this.avgEntryPrice) * this.totalQuantity;
    const lossPercent = ((currentPrice - this.avgEntryPrice) / this.avgEntryPrice) * 100;

    console.log(`🛑 Stop loss triggered!`);
    console.log(`📉 Loss: $${loss.toFixed(2)} (${lossPercent.toFixed(2)}%)`);

    // TODO: Sell all via Binance API
    await this.stop();
  }

  /**
   * Stop the bot
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log(`🛑 DCA Bot stopped for ${this.config.symbol}`);
  }

  /**
   * Get bot statistics
   */
  getStats() {
    return {
      symbol: this.config.symbol,
      isRunning: this.isRunning,
      avgEntryPrice: this.avgEntryPrice,
      totalQuantity: this.totalQuantity,
      totalInvested: this.totalInvested,
      currentDeviation: this.currentDeviation,
      ordersFilled: this.orders.filter(o => o.status === 'FILLED').length,
      ordersTotal: this.orders.length,
    };
  }
}
