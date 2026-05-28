"""
Signal Generator Agent
Generates trading signals with entry/exit points
"""
import ccxt
import pandas as pd
import uuid
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class SignalGenerator:
    def __init__(self):
        self.exchange = ccxt.binance()
        logger.info("Signal Generator initialized")
    
    async def generate(self, symbol: str, timeframe: str = "4h"):
        """
        Generate trading signal with entry/exit points
        
        Combines price prediction and sentiment analysis
        """
        try:
            # Fetch market data
            ohlcv = self.exchange.fetch_ohlcv(symbol, timeframe, limit=50)
            df = pd.DataFrame(
                ohlcv,
                columns=['timestamp', 'open', 'high', 'low', 'close', 'volume']
            )
            
            # Calculate indicators
            df['rsi'] = self._calculate_rsi(df['close'], 14)
            df['sma_20'] = df['close'].rolling(window=20).mean()
            df['sma_50'] = df['close'].rolling(window=50).mean()
            
            current_price = df['close'].iloc[-1]
            rsi = df['rsi'].iloc[-1]
            sma_20 = df['sma_20'].iloc[-1]
            sma_50 = df['sma_50'].iloc[-1]
            
            # Generate signal logic
            action = "HOLD"
            confidence = 0.5
            reasoning = []
            
            if sma_20 > sma_50 and rsi < 70:
                action = "BUY"
                confidence = 0.75
                reasoning.append("Bullish trend: SMA 20 > SMA 50")
                reasoning.append(f"RSI not overbought: {rsi:.1f}")
            elif sma_20 < sma_50 and rsi > 30:
                action = "SELL"
                confidence = 0.70
                reasoning.append("Bearish trend: SMA 20 < SMA 50")
                reasoning.append(f"RSI not oversold: {rsi:.1f}")
            else:
                reasoning.append("No clear trend")
                reasoning.append("Waiting for better setup")
            
            # Calculate entry, stop-loss, take-profit
            if action == "BUY":
                entry_price = current_price
                stop_loss = entry_price * 0.97  # 3% stop loss
                take_profit = [
                    entry_price * 1.05,  # 5% TP1
                    entry_price * 1.10,  # 10% TP2
                    entry_price * 1.15,  # 15% TP3
                ]
            elif action == "SELL":
                entry_price = current_price
                stop_loss = entry_price * 1.03  # 3% stop loss
                take_profit = [
                    entry_price * 0.95,  # 5% TP1
                    entry_price * 0.90,  # 10% TP2
                    entry_price * 0.85,  # 15% TP3
                ]
            else:
                entry_price = current_price
                stop_loss = current_price * 0.95
                take_profit = [current_price]
            
            return {
                "signal_id": str(uuid.uuid4()),
                "symbol": symbol,
                "action": action,
                "confidence": round(confidence, 2),
                "entry_price": round(entry_price, 2),
                "stop_loss": round(stop_loss, 2),
                "take_profit": [round(tp, 2) for tp in take_profit],
                "reasoning": reasoning
            }
            
        except Exception as e:
            logger.error(f"Signal generation error for {symbol}: {e}")
            raise
    
    def _calculate_rsi(self, prices, period=14):
        """Calculate Relative Strength Index"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
