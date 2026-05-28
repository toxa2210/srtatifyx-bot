"""
AI Engine Service - Main Entry Point
Provides AI agents for trading intelligence
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging

from agents.price_prediction import PricePredictionAgent
from agents.news_sentiment import NewsSentimentAgent
from agents.signal_generator import SignalGenerator

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Quantum Hedge AI Engine",
    description="AI agents for crypto trading intelligence",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI agents
price_agent = PricePredictionAgent()
sentiment_agent = NewsSentimentAgent()
signal_agent = SignalGenerator()

# Pydantic models
class PricePredictionRequest(BaseModel):
    symbol: str
    timeframe: str = "1h"

class PricePredictionResponse(BaseModel):
    symbol: str
    predictions: dict
    confidence: float
    timestamp: str

class SentimentRequest(BaseModel):
    symbol: Optional[str] = None
    limit: int = 10

class SentimentResponse(BaseModel):
    symbol: Optional[str]
    sentiment_score: float
    label: str
    articles_analyzed: int

class SignalRequest(BaseModel):
    symbol: str
    timeframe: str = "4h"

class SignalResponse(BaseModel):
    signal_id: str
    symbol: str
    action: str  # BUY, SELL, HOLD
    confidence: float
    entry_price: float
    stop_loss: float
    take_profit: List[float]
    reasoning: List[str]

# Routes
@app.get("/")
async def root():
    return {
        "service": "Quantum Hedge AI Engine",
        "version": "0.1.0",
        "status": "operational",
        "agents": ["price_prediction", "news_sentiment", "signal_generator"]
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/v1/predict/price", response_model=PricePredictionResponse)
async def predict_price(request: PricePredictionRequest):
    """
    Predict future price for given symbol
    """
    try:
        logger.info(f"Price prediction requested: {request.symbol} ({request.timeframe})")
        prediction = await price_agent.predict(request.symbol, request.timeframe)
        return prediction
    except Exception as e:
        logger.error(f"Price prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/analyze/sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest):
    """
    Analyze news sentiment for crypto market or specific symbol
    """
    try:
        logger.info(f"Sentiment analysis requested: {request.symbol or 'general'}")
        sentiment = await sentiment_agent.analyze(request.symbol, request.limit)
        return sentiment
    except Exception as e:
        logger.error(f"Sentiment analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/generate/signal", response_model=SignalResponse)
async def generate_signal(request: SignalRequest):
    """
    Generate trading signal with entry/exit points
    """
    try:
        logger.info(f"Signal generation requested: {request.symbol} ({request.timeframe})")
        signal = await signal_agent.generate(request.symbol, request.timeframe)
        return signal
    except Exception as e:
        logger.error(f"Signal generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
