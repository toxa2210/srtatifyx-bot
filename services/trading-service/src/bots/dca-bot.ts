/**
 * DCA (Dollar Cost Averaging) Bot - Бот усреднения цены
 * 
 * Стратегия: покупает на регулярной основе или на падениях,
 * чтобы усреднить цену входа в позицию
 * Лучше всего работает в падающем рынке с восстановлением
 */

export interface DCABotConfig {
  symbol: string;                                         // Торговая пара
  totalInvestment: number;                                // Общая сумма инвестиций
  orderAmount: number;                                    // Сумма каждой покупки
  intervalType: 'TIME' | 'PRICE' | 'SMART';              // Тип интервала
  intervalValue: number;                                  // Значение (часы или %)
  safetyOrders: number;                                   // Кол-во страховочных ордеров
  safetyOrderDeviation: number;                          // Отклонение для страховки (%)
  takeProfit: number;                                     // Целевая прибыль (%)
  stopLoss?: number;                                      // Stop-loss (%)
  trailingTakeProfit?: boolean;                          // Скользящий take-profit
}

export interface DCAOrder {
  orderNumber: number;                                    // Номер ордера
  price: number;                                          // Цена покупки
  amount: number;                                         // Сумма
  quantity: number;                                       // Количество монет
  status: 'PENDING' | 'FILLED' | 'CANCELLED';            // Статус
  filledAt?: Date;                                        // Время заполнения
}

export class DCABot {
  private config: DCABotConfig;
  private orders: DCAOrder[] = [];
  private isRunning: boolean = false;
  private avgEntryPrice: number = 0;          // Средняя цена входа
  private totalQuantity: number = 0;           // Общее количество
  private totalInvested: number = 0;           // Всего инвестировано
  private currentDeviation: number = 0;        // Текущее отклонение

  constructor(config: DCABotConfig) {
    this.config = config;
  }

  /**
   * Запустить бота
   * Делает первую покупку по рыночной цене
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Бот уже запущен');
    }

    this.isRunning = true;
    console.log(`🤖 DCA Bot запущен для ${this.config.symbol}`);
    console.log(`💰 Общие инвестиции: $${this.config.totalInvestment}`);
    console.log(`📊 Сумма ордера: $${this.config.orderAmount}`);
    console.log(`🛡️ Страховочные ордера: ${this.config.safetyOrders}`);
    console.log(`🎯 Take profit: ${this.config.takeProfit}%`);

    // Первая покупка
    await this.placeInitialOrder();
  }

  /**
   * Разместить первоначальный ордер на покупку по рыночной цене
   */
  private async placeInitialOrder(): Promise<void> {
    // TODO: Получить текущую цену с Binance
    const currentPrice = 0;
    const quantity = this.config.orderAmount / currentPrice;

    const order: DCAOrder = {
      orderNumber: 1,
      price: currentPrice,
      amount: this.config.orderAmount,
      quantity: quantity,
      status: 'PENDING',
    };

    this.orders.push(order);
    console.log(`📈 Первоначальный ордер размещён по $${currentPrice}`);
  }

  /**
   * Обработка события заполнения ордера
   * Обновляет среднюю цену входа и проверяет условия
   */
  async onOrderFilled(orderNumber: number, fillPrice: number, fillQuantity: number): Promise<void> {
    const order = this.orders.find(o => o.orderNumber === orderNumber);
    if (!order) return;

    order.status = 'FILLED';
    order.filledAt = new Date();

    // Обновить среднюю цену входа
    this.totalQuantity += fillQuantity;
    this.totalInvested += fillPrice * fillQuantity;
    this.avgEntryPrice = this.totalInvested / this.totalQuantity;

    console.log(`✅ Ордер #${orderNumber} заполнен по $${fillPrice}`);
    console.log(`📊 Средняя цена: $${this.avgEntryPrice.toFixed(2)}`);
    console.log(`📦 Общее кол-во: ${this.totalQuantity.toFixed(8)}`);

    // Проверить условия для следующего ордера или закрытия
    await this.checkConditions();
  }

  /**
   * Проверить рыночные условия и разместить соответствующие ордера
   */
  private async checkConditions(): Promise<void> {
    // TODO: Получить текущую цену с Binance
    const currentPrice = 0;

    // Рассчитать отклонение от средней цены входа
    this.currentDeviation = ((currentPrice - this.avgEntryPrice) / this.avgEntryPrice) * 100;

    // Проверить take profit (целевая прибыль)
    if (this.currentDeviation >= this.config.takeProfit) {
      await this.executeTakeProfit(currentPrice);
      return;
    }

    // Проверить stop loss (защита от убытков)
    if (this.config.stopLoss && this.currentDeviation <= -this.config.stopLoss) {
      await this.executeStopLoss(currentPrice);
      return;
    }

    // Проверить нужен ли страховочный ордер
    const filledOrders = this.orders.filter(o => o.status === 'FILLED').length;
    if (filledOrders <= this.config.safetyOrders) {
      const expectedDeviation = -this.config.safetyOrderDeviation * filledOrders;
      if (this.currentDeviation <= expectedDeviation) {
        await this.placeSafetyOrder(currentPrice, filledOrders + 1);
      }
    }
  }

  /**
   * Разместить страховочный ордер при падении цены
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
    console.log(`🛡️ Страховочный ордер #${orderNumber} размещён по $${price}`);
  }

  /**
   * Выполнить take profit (продать всё с прибылью)
   */
  private async executeTakeProfit(currentPrice: number): Promise<void> {
    const profit = (currentPrice - this.avgEntryPrice) * this.totalQuantity;
    const profitPercent = ((currentPrice - this.avgEntryPrice) / this.avgEntryPrice) * 100;

    console.log(`🎯 Take profit сработал!`);
    console.log(`💰 Прибыль: $${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)`);

    // TODO: Продать всё через Binance API
    await this.stop();
  }

  /**
   * Выполнить stop loss (продать всё с убытком для защиты)
   */
  private async executeStopLoss(currentPrice: number): Promise<void> {
    const loss = (currentPrice - this.avgEntryPrice) * this.totalQuantity;
    const lossPercent = ((currentPrice - this.avgEntryPrice) / this.avgEntryPrice) * 100;

    console.log(`🛑 Stop loss сработал!`);
    console.log(`📉 Убыток: $${loss.toFixed(2)} (${lossPercent.toFixed(2)}%)`);

    // TODO: Продать всё через Binance API
    await this.stop();
  }

  /**
   * Остановить бота
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log(`🛑 DCA Bot остановлен для ${this.config.symbol}`);
  }

  /**
   * Получить статистику бота
   */
  getStats() {
    return {
      symbol: this.config.symbol,
      isRunning: this.isRunning,
      avgEntryPrice: this.avgEntryPrice,                  // Средняя цена входа
      totalQuantity: this.totalQuantity,                   // Общее количество
      totalInvested: this.totalInvested,                   // Всего инвестировано
      currentDeviation: this.currentDeviation,             // Текущее отклонение
      ordersFilled: this.orders.filter(o => o.status === 'FILLED').length,    // Заполненные ордера
      ordersTotal: this.orders.length,                                          // Всего ордеров
    };
  }
}
