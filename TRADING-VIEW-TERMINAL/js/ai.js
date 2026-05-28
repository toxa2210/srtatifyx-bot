/**
 * AI Module - AI анализатор и ассистент
 * Анализирует рынок, рисует уровни на графике
 */

const AIAssistant = {
    /**
     * Полный AI анализ рынка
     */
    async analyzeMarket(symbol) {
        symbol = symbol || ChartManager.currentSymbol;
        const candles = await BinanceAPI.getKlines(symbol, ChartManager.currentInterval, 100);
        if (candles.length === 0) return null;
        
        const closes = candles.map(c => c.close);
        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const volumes = candles.map(c => c.volume);
        
        const currentPrice = closes[closes.length - 1];
        const support = this.findSupport(lows);
        const resistance = this.findResistance(highs);
        const ema20 = this.calculateEMA(closes, 20);
        const ema50 = this.calculateEMA(closes, 50);
        const trend = ema20 > ema50 ? 'UP' : 'DOWN';
        const rsi = this.calculateRSI(closes, 14);
        const atr = this.calculateATR(candles, 14);
        const avgVolume = volumes.slice(-20).reduce((a,b) => a+b, 0) / 20;
        const volumeRatio = volumes[volumes.length - 1] / avgVolume;
        
        const signal = this.generateSignal({currentPrice, support, resistance, trend, rsi, volumeRatio});
        const confidence = this.calculateConfidence(rsi, volumeRatio, trend, currentPrice, support, resistance);
        
        return {symbol, currentPrice, support, resistance, trend, rsi, atr, volumeRatio, signal, ema20, ema50, confidence};
    },

    
    findSupport(lows) {
        const recent = lows.slice(-50);
        const sorted = [...recent].sort((a, b) => a - b);
        return sorted.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    },
    
    findResistance(highs) {
        const recent = highs.slice(-50);
        const sorted = [...recent].sort((a, b) => b - a);
        return sorted.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
    },
    
    calculateEMA(prices, period) {
        const k = 2 / (period + 1);
        let ema = prices[0];
        for (let i = 1; i < prices.length; i++) {
            ema = prices[i] * k + ema * (1 - k);
        }
        return ema;
    },
    
    calculateRSI(prices, period) {
        period = period || 14;
        if (prices.length < period + 1) return 50;
        let gains = 0, losses = 0;
        for (let i = prices.length - period; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        const avgGain = gains / period;
        const avgLoss = losses / period;
        if (avgLoss === 0) return 100;
        return 100 - (100 / (1 + (avgGain / avgLoss)));
    },
    
    calculateATR(candles, period) {
        period = period || 14;
        const trs = [];
        for (let i = 1; i < candles.length; i++) {
            const high = candles[i].high;
            const low = candles[i].low;
            const prevClose = candles[i-1].close;
            trs.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
        }
        const recent = trs.slice(-period);
        return recent.reduce((a,b) => a+b, 0) / recent.length;
    },

    
    /**
     * Генерация торгового сигнала
     */
    generateSignal(data) {
        const {currentPrice, support, resistance, trend, rsi, volumeRatio} = data;
        const distToSupport = ((currentPrice - support) / currentPrice) * 100;
        const distToResistance = ((resistance - currentPrice) / currentPrice) * 100;
        
        let action = 'HOLD';
        let reasoning = [];
        
        if (rsi < 30 && trend === 'UP' && distToSupport < 2) {
            action = 'BUY';
            reasoning.push('🟢 RSI перепродан (< 30)');
            reasoning.push('🟢 Восходящий тренд (EMA20 > EMA50)');
            reasoning.push('🟢 Цена близко к поддержке');
        } else if (rsi > 70 && trend === 'DOWN' && distToResistance < 2) {
            action = 'SELL';
            reasoning.push('🔴 RSI перекуплен (> 70)');
            reasoning.push('🔴 Нисходящий тренд');
            reasoning.push('🔴 Цена близко к сопротивлению');
        } else if (trend === 'UP' && distToSupport < 1) {
            action = 'BUY';
            reasoning.push('🟢 Бычий тренд');
            reasoning.push('🟢 Отскок от поддержки');
        } else if (trend === 'DOWN' && distToResistance < 1) {
            action = 'SELL';
            reasoning.push('🔴 Медвежий тренд');
            reasoning.push('🔴 Отбой от сопротивления');
        } else {
            reasoning.push('⏸️ Нет чёткого сигнала');
            reasoning.push(`RSI: ${rsi.toFixed(1)}`);
            reasoning.push(`Тренд: ${trend === 'UP' ? '📈 Вверх' : '📉 Вниз'}`);
        }
        
        if (volumeRatio > 2) reasoning.push('⚡ Высокий объём (>2x)');
        
        return {action, reasoning};
    },
    
    /**
     * Расчёт уверенности сигнала (0-1)
     */
    calculateConfidence(rsi, volumeRatio, trend, price, support, resistance) {
        let conf = 0.5;
        if (rsi < 30 || rsi > 70) conf += 0.15;
        if (volumeRatio > 1.5) conf += 0.10;
        const range = resistance - support;
        const position = (price - support) / range;
        if (position < 0.2 || position > 0.8) conf += 0.15;
        return Math.min(0.95, conf);
    },

    
    /**
     * Применить анализ - нарисовать на графике
     */
    async applyAnalysisToChart(symbol) {
        const analysis = await this.analyzeMarket(symbol);
        if (!analysis) return null;
        
        ChartManager.clearDrawings();
        ChartManager.drawSupport(analysis.support);
        ChartManager.drawResistance(analysis.resistance);
        
        if (analysis.signal.action === 'BUY') {
            const sl = analysis.currentPrice * 0.97;
            const tp1 = analysis.currentPrice * 1.03;
            const tp2 = analysis.currentPrice * 1.06;
            const tp3 = analysis.currentPrice * 1.10;
            ChartManager.drawEntry(analysis.currentPrice);
            ChartManager.drawStopLoss(sl);
            ChartManager.drawTakeProfit(tp1, 1);
            ChartManager.drawTakeProfit(tp2, 2);
            ChartManager.drawTakeProfit(tp3, 3);
        } else if (analysis.signal.action === 'SELL') {
            const sl = analysis.currentPrice * 1.03;
            const tp1 = analysis.currentPrice * 0.97;
            const tp2 = analysis.currentPrice * 0.94;
            const tp3 = analysis.currentPrice * 0.90;
            ChartManager.drawEntry(analysis.currentPrice);
            ChartManager.drawStopLoss(sl);
            ChartManager.drawTakeProfit(tp1, 1);
            ChartManager.drawTakeProfit(tp2, 2);
            ChartManager.drawTakeProfit(tp3, 3);
        }
        return analysis;
    },
    
    /**
     * Форматировать анализ в читаемый текст
     */
    formatAnalysis(a) {
        const trendEmoji = a.trend === 'UP' ? '📈' : '📉';
        const signalEmoji = a.signal.action === 'BUY' ? '🟢' : a.signal.action === 'SELL' ? '🔴' : '🟡';
        return `
<strong>📊 AI Анализ ${a.symbol}</strong>

💰 <b>Цена:</b> $${BinanceAPI.formatPrice(a.currentPrice)}
🟢 <b>Поддержка:</b> $${BinanceAPI.formatPrice(a.support)}
🔴 <b>Сопротивление:</b> $${BinanceAPI.formatPrice(a.resistance)}
${trendEmoji} <b>Тренд:</b> ${a.trend === 'UP' ? 'Восходящий' : 'Нисходящий'}
📊 <b>RSI:</b> ${a.rsi.toFixed(1)}
⚡ <b>Объём:</b> ${a.volumeRatio.toFixed(2)}x от среднего

${signalEmoji} <b>Сигнал: ${a.signal.action}</b>
Уверенность: ${(a.confidence * 100).toFixed(0)}%

<b>Обоснование:</b>
${a.signal.reasoning.map(r => '• ' + r).join('<br>')}
        `.trim();
    },

    
    /**
     * Обработка текстовых команд от пользователя
     */
    async processCommand(command) {
        command = command.toLowerCase().trim();
        
        // Открыть символ
        const symbolMatch = command.match(/(?:открой|покажи|показать)\s+([a-z]+)(?:\s|usdt|$)/i);
        if (symbolMatch) {
            let sym = symbolMatch[1].toUpperCase();
            if (!sym.endsWith('USDT')) sym += 'USDT';
            await App.changeSymbol(sym);
            return `✅ Открыт ${sym}`;
        }
        
        // Сменить таймфрейм
        const tfMatch = command.match(/(?:на|таймфрейм)\s*(\d+)\s*(?:минут|мин|m|часа|час|h|день|d|days?)/i);
        if (tfMatch) {
            let tf = tfMatch[1];
            if (command.includes('минут') || command.includes('мин') || command.includes('m')) tf += 'm';
            else if (command.includes('час') || command.includes('h')) tf += 'h';
            else if (command.includes('день') || command.includes('d')) tf = '1d';
            App.changeTimeframe(tf);
            return `✅ Таймфрейм: ${tf}`;
        }
        
        // AI Анализ
        if (command.match(/анализ|проанализируй|что скажеш|анализируй/)) {
            const a = await this.applyAnalysisToChart(ChartManager.currentSymbol);
            if (a) return this.formatAnalysis(a);
            return '❌ Не удалось проанализировать';
        }
        
        // Сигналы
        if (command.match(/сигнал|signal|точк[аи] входа/)) {
            const a = await this.analyzeMarket(ChartManager.currentSymbol);
            if (!a) return '❌ Нет данных';
            return `🔔 Сигнал: <b>${a.signal.action}</b><br>Уверенность: ${(a.confidence*100).toFixed(0)}%<br>${a.signal.reasoning.join('<br>')}`;
        }
        
        // Тренд
        if (command.match(/тренд|trend|куда (идет|пойдет|двигается)/)) {
            const a = await this.analyzeMarket(ChartManager.currentSymbol);
            if (!a) return '❌ Нет данных';
            const tr = a.trend === 'UP' ? '📈 Восходящий (бычий)' : '📉 Нисходящий (медвежий)';
            return `<b>Тренд ${a.symbol}:</b> ${tr}<br>RSI: ${a.rsi.toFixed(1)}<br>EMA20: ${BinanceAPI.formatPrice(a.ema20)}<br>EMA50: ${BinanceAPI.formatPrice(a.ema50)}`;
        }
        
        // Поддержка/сопротивление
        if (command.match(/поддержк|сопротивлен|support|resistance|уровн/)) {
            const a = await this.analyzeMarket(ChartManager.currentSymbol);
            if (!a) return '❌ Нет данных';
            ChartManager.clearDrawings();
            ChartManager.drawSupport(a.support);
            ChartManager.drawResistance(a.resistance);
            return `🎯 Уровни нарисованы:<br>🟢 Поддержка: $${BinanceAPI.formatPrice(a.support)}<br>🔴 Сопротивление: $${BinanceAPI.formatPrice(a.resistance)}`;
        }
        
        // Очистить
        if (command.match(/очист|удали|clear/)) {
            ChartManager.clearDrawings();
            return '🗑️ График очищен';
        }
        
        // По умолчанию
        return `🤖 Я понимаю команды:<br>• "Открой BTC" - сменить пару<br>• "Анализ" - AI анализ<br>• "Сигнал" - торговый сигнал<br>• "Тренд" - текущий тренд<br>• "Уровни" - поддержка/сопротивление<br>• "Очисти" - убрать линии`;
    }
};
