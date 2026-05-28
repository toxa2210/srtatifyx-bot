/**
 * Binance API Module - модуль для работы с Binance API
 * Использует публичные endpoints (без авторизации)
 */

const BinanceAPI = {
    // Базовые URL
    REST_URL: 'https://api.binance.com/api/v3',
    WS_URL: 'wss://stream.binance.com:9443/ws',
    
    /**
     * Получить исторические свечи (klines)
     */
    async getKlines(symbol, interval = '1h', limit = 500) {
        try {
            const url = `${this.REST_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
            const response = await fetch(url);
            const data = await response.json();
            
            // Преобразуем в формат для Lightweight Charts
            return data.map(k => ({
                time: k[0] / 1000, // Unix timestamp в секундах
                open: parseFloat(k[1]),
                high: parseFloat(k[2]),
                low: parseFloat(k[3]),
                close: parseFloat(k[4]),
                volume: parseFloat(k[5])
            }));
        } catch (error) {
            console.error('❌ Ошибка получения klines:', error);
            return [];
        }
    },

    
    /**
     * Получить тикер 24h
     */
    async getTicker24h(symbol) {
        try {
            const response = await fetch(`${this.REST_URL}/ticker/24hr?symbol=${symbol}`);
            return await response.json();
        } catch (error) {
            console.error('❌ Ошибка получения тикера:', error);
            return null;
        }
    },
    
    /**
     * Получить топ-20 символов по объёму
     */
    async getTopSymbols() {
        try {
            const response = await fetch(`${this.REST_URL}/ticker/24hr`);
            const data = await response.json();
            
            // Фильтруем USDT пары и сортируем по объёму
            return data
                .filter(t => t.symbol.endsWith('USDT') && !t.symbol.includes('UP') && !t.symbol.includes('DOWN'))
                .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
                .slice(0, 20)
                .map(t => ({
                    symbol: t.symbol,
                    price: parseFloat(t.lastPrice),
                    change: parseFloat(t.priceChangePercent),
                    volume: parseFloat(t.quoteVolume)
                }));
        } catch (error) {
            console.error('❌ Ошибка получения символов:', error);
            return [];
        }
    },
    
    /**
     * Подписаться на real-time обновления свечей через WebSocket
     */
    subscribeKlines(symbol, interval, callback) {
        const stream = `${symbol.toLowerCase()}@kline_${interval}`;
        const ws = new WebSocket(`${this.WS_URL}/${stream}`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const k = data.k;
            
            callback({
                time: k.t / 1000,
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
                volume: parseFloat(k.v),
                isClosed: k.x // true если свеча закрыта
            });
        };
        
        ws.onerror = (error) => {
            console.error('❌ WebSocket ошибка:', error);
        };
        
        return ws;
    },

    
    /**
     * Подписаться на тикер (для real-time цены)
     */
    subscribeTicker(symbol, callback) {
        const stream = `${symbol.toLowerCase()}@ticker`;
        const ws = new WebSocket(`${this.WS_URL}/${stream}`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            callback({
                price: parseFloat(data.c),       // Текущая цена
                change: parseFloat(data.P),       // % изменения за 24h
                volume: parseFloat(data.q),       // Объём в USDT
                high: parseFloat(data.h),         // Максимум 24h
                low: parseFloat(data.l)           // Минимум 24h
            });
        };
        
        return ws;
    },
    
    /**
     * Получить текущую цену
     */
    async getPrice(symbol) {
        try {
            const response = await fetch(`${this.REST_URL}/ticker/price?symbol=${symbol}`);
            const data = await response.json();
            return parseFloat(data.price);
        } catch (error) {
            console.error('❌ Ошибка получения цены:', error);
            return 0;
        }
    },
    
    /**
     * Форматировать число с разделителями
     */
    formatNumber(num, decimals = 2) {
        if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
        return num.toFixed(decimals);
    },
    
    /**
     * Форматировать цену
     */
    formatPrice(price) {
        if (price >= 1000) return price.toFixed(2);
        if (price >= 1) return price.toFixed(4);
        return price.toFixed(6);
    }
};
