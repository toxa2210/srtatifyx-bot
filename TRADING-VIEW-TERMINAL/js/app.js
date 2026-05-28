/**
 * Main App - главное приложение Quantum Hedge Trading Terminal
 */

const App = {
    currentSymbol: 'BTCUSDT',
    currentInterval: '1h',
    currentSide: 'buy',
    tickerWS: null,
    balance: 10000,
    
    async init() {
        console.log('🚀 Quantum Hedge Trading Terminal v1.0.0');
        ChartManager.init('chartContainer');
        VoiceControl.init();
        await this.loadSymbols();
        await this.changeSymbol(this.currentSymbol);
        this.attachEvents();
        console.log('✅ Приложение запущено');
    },
    
    async loadSymbols() {
        const symbols = await BinanceAPI.getTopSymbols();
        const list = document.getElementById('symbolsList');
        list.innerHTML = '';
        symbols.forEach(s => {
            const item = document.createElement('div');
            item.className = 'symbol-item' + (s.symbol === this.currentSymbol ? ' active' : '');
            item.dataset.symbol = s.symbol;
            const changeClass = s.change >= 0 ? 'up' : 'down';
            const changeSign = s.change >= 0 ? '+' : '';
            item.innerHTML = `
                <div class="symbol-name">${s.symbol.replace('USDT', '/USDT')}</div>
                <div class="symbol-price">$${BinanceAPI.formatPrice(s.price)}</div>
                <div class="symbol-change ${changeClass}">${changeSign}${s.change.toFixed(2)}%</div>
            `;
            item.addEventListener('click', () => this.changeSymbol(s.symbol));
            list.appendChild(item);
        });
    },

    
    async changeSymbol(symbol) {
        this.currentSymbol = symbol;
        document.getElementById('currentSymbol').textContent = symbol.replace('USDT', '/USDT');
        document.querySelectorAll('.symbol-item').forEach(item => {
            item.classList.toggle('active', item.dataset.symbol === symbol);
        });
        await ChartManager.loadData(symbol, this.currentInterval);
        if (this.tickerWS) this.tickerWS.close();
        this.tickerWS = BinanceAPI.subscribeTicker(symbol, (data) => this.updateTicker(data));
        const baseAsset = symbol.replace('USDT', '');
        document.getElementById('executeTradeBtn').textContent = 
            (this.currentSide === 'buy' ? 'КУПИТЬ ' : 'ПРОДАТЬ ') + baseAsset;
    },
    
    async changeTimeframe(tf) {
        this.currentInterval = tf;
        document.querySelectorAll('.tf-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tf === tf);
        });
        await ChartManager.loadData(this.currentSymbol, tf);
    },
    
    updateTicker(data) {
        document.getElementById('currentPrice').textContent = '$' + BinanceAPI.formatPrice(data.price);
        const changeEl = document.getElementById('priceChange');
        const sign = data.change >= 0 ? '+' : '';
        changeEl.textContent = sign + data.change.toFixed(2) + '%';
        changeEl.className = 'change ' + (data.change >= 0 ? 'up' : 'down');
        document.getElementById('volume24h').textContent = '$' + BinanceAPI.formatNumber(data.volume);
        document.getElementById('high24h').textContent = '$' + BinanceAPI.formatPrice(data.high);
        document.getElementById('low24h').textContent = '$' + BinanceAPI.formatPrice(data.low);
        document.getElementById('lastUpdate').textContent = 'Обновлено: ' + new Date().toLocaleTimeString('ru-RU');
        if (!document.activeElement || document.activeElement.id !== 'tradePrice') {
            document.getElementById('tradePrice').value = BinanceAPI.formatPrice(data.price);
        }
    },
    
    addAIMessage(type, text) {
        const container = document.getElementById('aiMessages');
        const msg = document.createElement('div');
        msg.className = 'ai-message' + (type === 'user' ? ' user' : '');
        msg.innerHTML = type === 'user' ? `<strong>Вы:</strong> ${text}` : `<strong>AI:</strong> ${text}`;
        container.appendChild(msg);
        container.scrollTop = container.scrollHeight;
    },

    
    attachEvents() {
        // Поиск символов
        document.getElementById('symbolSearch').addEventListener('input', (e) => {
            const query = e.target.value.toUpperCase();
            document.querySelectorAll('.symbol-item').forEach(item => {
                item.style.display = item.dataset.symbol.includes(query) ? 'block' : 'none';
            });
        });
        
        // Таймфреймы
        document.querySelectorAll('.tf-btn').forEach(btn => {
            btn.addEventListener('click', () => this.changeTimeframe(btn.dataset.tf));
        });
        
        // AI Анализ
        document.getElementById('aiAnalyzeBtn').addEventListener('click', async () => {
            this.addAIMessage('user', '🤖 AI Анализ');
            const a = await AIAssistant.applyAnalysisToChart(this.currentSymbol);
            if (a) this.addAIMessage('ai', AIAssistant.formatAnalysis(a));
        });
        
        document.getElementById('drawTrendBtn').addEventListener('click', async () => {
            const a = await AIAssistant.analyzeMarket(this.currentSymbol);
            if (a) {
                ChartManager.drawHorizontalLine(a.ema20, '#FFB800', 'EMA 20');
                ChartManager.drawHorizontalLine(a.ema50, '#FF6B6B', 'EMA 50');
                this.addAIMessage('ai', '📈 Тренд линии добавлены');
            }
        });
        
        document.getElementById('drawSupportBtn').addEventListener('click', async () => {
            const a = await AIAssistant.analyzeMarket(this.currentSymbol);
            if (a) {
                ChartManager.drawSupport(a.support);
                ChartManager.drawResistance(a.resistance);
                this.addAIMessage('ai', `🎯 Поддержка: $${BinanceAPI.formatPrice(a.support)}, Сопротивление: $${BinanceAPI.formatPrice(a.resistance)}`);
            }
        });
        
        document.getElementById('clearBtn').addEventListener('click', () => {
            ChartManager.clearDrawings();
            this.addAIMessage('ai', '🗑️ График очищен');
        });
        
        // AI чат
        const sendMsg = async () => {
            const input = document.getElementById('aiInput');
            const text = input.value.trim();
            if (!text) return;
            input.value = '';
            this.addAIMessage('user', text);
            const response = await AIAssistant.processCommand(text);
            this.addAIMessage('ai', response);
        };
        document.getElementById('aiSendBtn').addEventListener('click', sendMsg);
        document.getElementById('aiInput').addEventListener('keypress', e => {
            if (e.key === 'Enter') sendMsg();
        });
        
        // Quick кнопки
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const cmdMap = { 'analyze': 'анализ', 'signals': 'сигнал', 'trend': 'тренд' };
                this.addAIMessage('user', btn.textContent);
                const response = await AIAssistant.processCommand(cmdMap[btn.dataset.cmd]);
                this.addAIMessage('ai', response);
            });
        });
        
        // Voice
        document.getElementById('voiceBtn').addEventListener('click', () => VoiceControl.start());
        document.getElementById('voiceCloseBtn').addEventListener('click', () => VoiceControl.stop());

        
        // Trade tabs
        document.querySelectorAll('.trade-tabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.trade-tabs .tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentSide = tab.dataset.side;
                const btn = document.getElementById('executeTradeBtn');
                const baseAsset = this.currentSymbol.replace('USDT', '');
                btn.textContent = (this.currentSide === 'buy' ? 'КУПИТЬ ' : 'ПРОДАТЬ ') + baseAsset;
                btn.className = 'btn-trade ' + this.currentSide;
            });
        });
        
        const calcTotal = () => {
            const price = parseFloat(document.getElementById('tradePrice').value) || 0;
            const amount = parseFloat(document.getElementById('tradeAmount').value) || 0;
            document.getElementById('tradeTotal').value = (price * amount).toFixed(2);
        };
        document.getElementById('tradePrice').addEventListener('input', calcTotal);
        document.getElementById('tradeAmount').addEventListener('input', calcTotal);
        
        document.querySelectorAll('.amount-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const pct = parseInt(btn.dataset.pct);
                const price = parseFloat(document.getElementById('tradePrice').value) || 0;
                if (price > 0) {
                    const amount = (this.balance * pct / 100) / price;
                    document.getElementById('tradeAmount').value = amount.toFixed(6);
                    calcTotal();
                }
            });
        });
        
        document.getElementById('executeTradeBtn').addEventListener('click', () => {
            const price = document.getElementById('tradePrice').value;
            const amount = document.getElementById('tradeAmount').value;
            if (!price || !amount) {
                alert('Заполните цену и количество!');
                return;
            }
            const action = this.currentSide === 'buy' ? 'КУПЛЕНО' : 'ПРОДАНО';
            this.addAIMessage('ai', `✅ ${action}: ${amount} ${this.currentSymbol.replace('USDT', '')} по $${price}<br><i>(Демо режим - подключите Binance API)</i>`);
        });
    }
};

// Запуск
document.addEventListener('DOMContentLoaded', () => App.init());
