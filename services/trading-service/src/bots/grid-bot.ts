/**
 * Grid Trading Bot - Сеточный торговый бот
 * 
 * Стратегия: покупает дешевле, продаёт дороже в заданном ценовом диапазоне
 * Лучше всего работает в боковом тренде (рендж рынок)
 */

export interface GridBotConfig {
  symbol: string;          // Торговая пара (например, BTCUSDT)
  lowerPrice: number;      // Нижняя граница диапазона
  upperPrice: number;      // Верхняя граница диапазона
  gridCount: number;       // Количество уровней сетки (10-200)
  investment: number;      // Инвестиции (общий капитал)
  mode: 'NEUTRAL' | 'LONG' | 'SHORT';  // Режим: нейтральный/лонг/шорт
  stopLoss?: number;       // Stop-loss цена (опционально)
  takeProfit?: number;     // Take-profit цена (опционально)
}

export interface GridLevel {
  price: number;                                          // Цена уровня
  quantity: number;                                       // Количество для торговли
  side: 'BUY' | 'SELL';                                  // Тип ордера
  status: 'OPEN' | 'FILLED' | 'CANCELLED';               // Статус ордера
  orderId?: string;                                       // ID ордера на бирже
}

export class GridBot {
  private config: GridBotConfig;
  private gridLevels: GridLevel[] = [];
  private isRunning: boolean = false;
  private totalProfit: number = 0;        // Общая прибыль
  private totalTrades: number = 0;         // Общее количество сделок

  constructor(config: GridBotConfig) {
    this.config = config;
    this.calculateGridLevels();
  }

  /**
   * Рассчитать уровни сетки на основе конфигурации
   * Делит ценовой диапазон на равные интервалы
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
   * Запустить бота
   * Расставляет ордера на покупку ниже текущей цены
   * И ордера на продажу выше текущей цены
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Бот уже запущен');
    }

    this.isRunning = true;
    console.log(`🤖 Grid Bot запущен для ${this.config.symbol}`);
    console.log(`📊 Диапазон: $${this.config.lowerPrice} - $${this.config.upperPrice}`);
    console.log(`📐 Количество уровней: ${this.config.gridCount}`);
    console.log(`💰 Инвестиции: $${this.config.investment}`);

    // TODO: Интеграция с Binance API для реальных ордеров
  }

  /**
   * Остановить бота и отменить все открытые ордера
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    console.log(`🛑 Grid Bot остановлен для ${this.config.symbol}`);
    
    // TODO: Отменить все открытые ордера через Binance API
  }

  /**
   * Обработка события заполнения ордера
   * Когда ордер на покупку выполнен - ставим ордер на продажу выше
   * Когда ордер на продажу выполнен - ставим ордер на покупку ниже
   */
  async onOrderFilled(orderId: string, fillPrice: number, fillQuantity: number): Promise<void> {
    const level = this.gridLevels.find(l => l.orderId === orderId);
    if (!level) return;

    level.status = 'FILLED';
    this.totalTrades++;

    if (level.side === 'BUY') {
      // Покупка выполнена - ставим продажу на одну сетку выше
      const sellPrice = level.price * 1.01; // 1% прибыли с каждой сетки
      console.log(`📈 Покупка по $${fillPrice}, ставим продажу на $${sellPrice}`);
      // TODO: Поставить ордер на продажу через Binance API
    } else {
      // Продажа выполнена - ставим покупку на одну сетку ниже
      const buyPrice = level.price * 0.99;
      console.log(`📉 Продажа по $${fillPrice}, ставим покупку на $${buyPrice}`);
      // TODO: Поставить ордер на покупку через Binance API
      
      // Считаем прибыль
      this.totalProfit += (fillPrice - level.price) * fillQuantity;
    }
  }

  /**
   * Получить статистику бота
   */
  getStats() {
    return {
      symbol: this.config.symbol,
      isRunning: this.isRunning,
      totalProfit: this.totalProfit,        // Общая прибыль
      totalTrades: this.totalTrades,         // Всего сделок
      activeGrids: this.gridLevels.filter(l => l.status === 'OPEN').length,    // Активных уровней
      filledGrids: this.gridLevels.filter(l => l.status === 'FILLED').length,  // Заполненных уровней
    };
  }
}
