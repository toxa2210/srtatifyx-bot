/**
 * Chart Module - управление графиком TradingView Lightweight Charts
 */

const ChartManager = {
    chart: null,
    candleSeries: null,
    volumeSeries: null,
    drawings: [], // массив всех нарисованных линий
    currentSymbol: 'BTCUSDT',
    currentInterval: '1h',
    ws: null,
    
    /**
     * Инициализация графика
     */
    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Создаём график
        this.chart = LightweightCharts.createChart(container, {
            width: container.clientWidth,
            height: container.clientHeight,
            layout: {
                background: { color: '#0A0E27' },
                textColor: '#D1D4DC',
            },
            grid: {
                vertLines: { color: '#1E222D' },
                horzLines: { color: '#1E222D' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: '#2A2E39',
            },
            timeScale: {
                borderColor: '#2A2E39',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        
        // Свечи (candlesticks)
        this.candleSeries = this.chart.addCandlestickSeries({
            upColor: '#26A69A',
            downColor: '#EF5350',
            borderUpColor: '#26A69A',
            borderDownColor: '#EF5350',
            wickUpColor: '#26A69A',
            wickDownColor: '#EF5350',
        });
        
        // Объём (volume) внизу
        this.volumeSeries = this.chart.addHistogramSeries({
            color: '#26A69A',
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
        });
        
        this.chart.priceScale('volume').applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
        });
        
        // Resize handler
        window.addEventListener('resize', () => {
            this.chart.applyOptions({
                width: container.clientWidth,
                height: container.clientHeight,
            });
        });
        
        console.log('✅ График инициализирован');
    },
    
    /**
     * Загрузить данные графика
     */
    async loadData(symbol, interval) {
        this.currentSymbol = symbol;
        this.currentInterval = interval;
        
        // Закрыть предыдущий WebSocket
        if (this.ws) {
            this.ws.close();
        }
        
        // Очистить нарисованные линии
        this.clearDrawings();
        
        // Получить исторические данные
        const candles = await BinanceAPI.getKlines(symbol, interval, 500);
        
        if (candles.length === 0) {
            console.error('❌ Нет данных для графика');
            return;
        }
        
        // Установить свечи
        this.candleSeries.setData(candles);
        
        // Установить объём
        const volumeData = candles.map(c => ({
            time: c.time,
            value: c.volume,
            color: c.close >= c.open ? 'rgba(38, 166, 154, 0.3)' : 'rgba(239, 83, 80, 0.3)'
        }));
        this.volumeSeries.setData(volumeData);
        
        // Подписаться на real-time обновления
        this.ws = BinanceAPI.subscribeKlines(symbol, interval, (kline) => {
            this.candleSeries.update(kline);
            this.volumeSeries.update({
                time: kline.time,
                value: kline.volume,
                color: kline.close >= kline.open ? 'rgba(38, 166, 154, 0.3)' : 'rgba(239, 83, 80, 0.3)'
            });
        });
        
        console.log(`✅ Загружен ${symbol} ${interval} (${candles.length} свечей)`);
    },

    
    /**
     * Нарисовать горизонтальную линию (поддержка/сопротивление)
     */
    drawHorizontalLine(price, color = '#FFB800', title = 'Линия') {
        const line = this.candleSeries.createPriceLine({
            price: price,
            color: color,
            lineWidth: 2,
            lineStyle: LightweightCharts.LineStyle.Dashed,
            axisLabelVisible: true,
            title: title,
        });
        
        this.drawings.push({ type: 'priceLine', line });
        return line;
    },
    
    /**
     * Нарисовать линию поддержки
     */
    drawSupport(price) {
        return this.drawHorizontalLine(price, '#26A69A', '🟢 Поддержка');
    },
    
    /**
     * Нарисовать линию сопротивления
     */
    drawResistance(price) {
        return this.drawHorizontalLine(price, '#EF5350', '🔴 Сопротивление');
    },
    
    /**
     * Нарисовать stop-loss
     */
    drawStopLoss(price) {
        return this.drawHorizontalLine(price, '#FF6B6B', '🛑 Stop-Loss');
    },
    
    /**
     * Нарисовать take-profit
     */
    drawTakeProfit(price, level = 1) {
        return this.drawHorizontalLine(price, '#4DD0BD', `🎯 TP${level}`);
    },
    
    /**
     * Нарисовать точку входа
     */
    drawEntry(price) {
        return this.drawHorizontalLine(price, '#2962FF', '📍 Entry');
    },
    
    /**
     * Добавить маркер сигнала на свечу (BUY/SELL)
     */
    addMarker(time, position, color, shape, text) {
        const markers = this.candleSeries.markers() || [];
        markers.push({
            time: time,
            position: position, // 'aboveBar' | 'belowBar'
            color: color,
            shape: shape,       // 'arrowUp' | 'arrowDown' | 'circle'
            text: text
        });
        this.candleSeries.setMarkers(markers);
    },

    
    /**
     * Добавить BUY сигнал
     */
    addBuySignal(time, text = 'BUY') {
        this.addMarker(time, 'belowBar', '#26A69A', 'arrowUp', text);
    },
    
    /**
     * Добавить SELL сигнал
     */
    addSellSignal(time, text = 'SELL') {
        this.addMarker(time, 'aboveBar', '#EF5350', 'arrowDown', text);
    },
    
    /**
     * Очистить все нарисованные линии
     */
    clearDrawings() {
        this.drawings.forEach(d => {
            try {
                if (d.type === 'priceLine') {
                    this.candleSeries.removePriceLine(d.line);
                }
            } catch(e) {}
        });
        this.drawings = [];
        this.candleSeries.setMarkers([]);
    },
    
    /**
     * Получить последнюю цену
     */
    getLastPrice() {
        const data = this.candleSeries.data();
        return data.length > 0 ? data[data.length - 1].close : 0;
    },
    
    /**
     * Получить последние свечи
     */
    getRecentCandles(count = 50) {
        const data = this.candleSeries.data ? [] : [];
        // В Lightweight Charts нельзя напрямую получить data, поэтому храним отдельно
        return this._lastData ? this._lastData.slice(-count) : [];
    }
};
