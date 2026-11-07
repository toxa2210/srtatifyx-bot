//+------------------------------------------------------------------+
//|                                                 RSI_ZigZag_EA.mq5 |
//|                    RSI Bands Breakout — Mean Reversion Scalper    |
//|                    Золото M1 | RSI + Bollinger Bands              |
//+------------------------------------------------------------------+
#property copyright "RSI + Bollinger Bands EA"
#property version   "2.00"
#property strict

#include <Trade\Trade.mqh>

// ── Управление лотом ────────────────────────────────────────────────
input double LotDivider        = 2000.0;   // Баланс / LotDivider = лот (100$→0.05)
input bool   UseFixedLot       = false;    // Фиксированный лот?
input double FixedLotSize      = 0.01;     // Размер фикс. лота

// ── Bollinger Bands ─────────────────────────────────────────────────
input int    BB_Period         = 20;       // Период BB (средняя линия)
input double BB_Deviation      = 2.0;      // Стандартное отклонение BB

// ── RSI ─────────────────────────────────────────────────────────────
input int    RSI_Period        = 7;        // Период RSI (быстрый для M1)
input double RSI_OversoldLevel  = 30.0;    // BUY: RSI ниже этого уровня
input double RSI_OverboughtLevel= 70.0;    // SELL: RSI выше этого уровня

// ── SL ──────────────────────────────────────────────────────────────
input int    SLOffset          = 50;       // Доп. отступ SL от экстремума (пунктов)

// ── Трейлинг ────────────────────────────────────────────────────────
input bool   UseTrailing            = true;    // Использовать трейлинг
input double BreakevenTriggerPips   = 80.0;    // Прибыль для безубытка (пипсы)
input double TrailingStepPips       = 50.0;    // Шаг трейлинга (пипсы)
input bool   UseTP                  = false;   // Фикс. TP (false = до средней линии BB)
input double TakeProfitPips         = 300.0;   // Фикс. TP (пипсов) если UseTP=true

// ── Общие ───────────────────────────────────────────────────────────
input int    MaxOpenTrades     = 1;        // Максимум открытых сделок
input int    MagicNumber       = 889001;   // Магический номер
input bool   EnableDetailedLog = true;     // Подробное логирование

// ── Глобальные переменные ────────────────────────────────────────────
CTrade trade;
int    bbHandle   = INVALID_HANDLE;
int    rsiHandle  = INVALID_HANDLE;

double bbUpper[];   // Верхняя линия BB
double bbMiddle[];  // Средняя линия BB (MA20) — цель TP
double bbLower[];   // Нижняя линия BB
double rsiBuffer[];

// Состояние «ждём возврата» (пробой уже зафиксирован)
bool   waitingBuyReturn  = false;  // Цена пробила нижнюю BB вниз, ждём возврата
bool   waitingSellReturn = false;  // Цена пробила верхнюю BB вверх, ждём возврата
double signalCandleLow   = 0;      // Low сигнальной свечи BUY (для SL)
double signalCandleHigh  = 0;      // High сигнальной свечи SELL (для SL)

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   // Bollinger Bands: буфер 0=Upper, 1=Middle, 2=Lower
   bbHandle  = iBands(_Symbol, PERIOD_CURRENT, BB_Period, 0, BB_Deviation, PRICE_CLOSE);
   rsiHandle = iRSI(_Symbol,   PERIOD_CURRENT, RSI_Period, PRICE_CLOSE);

   if(bbHandle == INVALID_HANDLE || rsiHandle == INVALID_HANDLE)
   {
      Print("❌ Ошибка создания индикаторов BB/RSI!");
      return(INIT_FAILED);
   }

   trade.SetExpertMagicNumber(MagicNumber);
   trade.SetDeviationInPoints(10);
   trade.SetTypeFilling(ORDER_FILLING_IOC);

   ArraySetAsSeries(bbUpper,  true);
   ArraySetAsSeries(bbMiddle, true);
   ArraySetAsSeries(bbLower,  true);
   ArraySetAsSeries(rsiBuffer, true);

   Print("✅ RSI Bands Breakout EA запущен на ", _Symbol,
         " | BB(", BB_Period, ",", BB_Deviation, ") | RSI(", RSI_Period, ")");
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   if(bbHandle  != INVALID_HANDLE) IndicatorRelease(bbHandle);
   if(rsiHandle != INVALID_HANDLE) IndicatorRelease(rsiHandle);
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // ── 1. Читаем индикаторы (3 последних закрытых бара + текущий)
   if(CopyBuffer(bbHandle,  1, 0, 4, bbUpper)  < 4) return; // буфер 1 = Upper
   if(CopyBuffer(bbHandle,  0, 0, 4, bbMiddle) < 4) return; // буфер 0 = Middle
   if(CopyBuffer(bbHandle,  2, 0, 4, bbLower)  < 4) return; // буфер 2 = Lower
   if(CopyBuffer(rsiHandle, 0, 0, 4, rsiBuffer)< 4) return;

   // ── 2. Управляем трейлингом открытых позиций на каждом тике
   if(UseTrailing)
      ManageTrailing();

   // ── 3. Работаем только на новом баре (сигналы по закрытым барам)
   static datetime lastBar = 0;
   datetime curBar = iTime(_Symbol, PERIOD_CURRENT, 0);
   if(curBar == lastBar) return;
   lastBar = curBar;

   // ── 4. Диагностика
   static int barCount = 0;
   barCount++;
   if(EnableDetailedLog && barCount % 20 == 0)
   {
      Print("═══ BB Bands Breakout (бар ", barCount, ") ═══");
      Print("RSI[1]=", DoubleToString(rsiBuffer[1], 2),
            " | BB Upper[1]=", DoubleToString(bbUpper[1],  _Digits),
            " | BB Mid[1]=",   DoubleToString(bbMiddle[1], _Digits),
            " | BB Lower[1]=", DoubleToString(bbLower[1],  _Digits));
      Print("Ожидание BUY-возврата: ",  (waitingBuyReturn  ? "ДА" : "нет"),
            " | SELL-возврата: ",        (waitingSellReturn ? "ДА" : "нет"));
      Print("Открытых позиций: ", CountOpenPositions(), " / ", MaxOpenTrades);
      Print("═══════════════════════════════");
   }

   // ── 5. Данные завершённого бара [1]
   double close1  = iClose(_Symbol, PERIOD_CURRENT, 1);
   double low1    = iLow  (_Symbol, PERIOD_CURRENT, 1);
   double high1   = iHigh (_Symbol, PERIOD_CURRENT, 1);
   double close2  = iClose(_Symbol, PERIOD_CURRENT, 2);

   double rsi1    = rsiBuffer[1];   // RSI закрытого бара
   double bbL1    = bbLower[1];     // Нижняя BB закрытого бара
   double bbU1    = bbUpper[1];     // Верхняя BB закрытого бара
   double bbMid1  = bbMiddle[1];    // Средняя BB закрытого бара

   // ── 6. Фиксация пробоя нижней линии BB (сигнальная свеча)
   //   close[1] < bbLower[1]  И  rsi[1] < RSI_OversoldLevel
   if(close1 < bbL1 && rsi1 < RSI_OversoldLevel && !waitingBuyReturn && !waitingSellReturn)
   {
      waitingBuyReturn = true;
      signalCandleLow  = low1;
      if(EnableDetailedLog)
         Print("⚡ BUY сигнал зафиксирован: close[", close1, "] < BB Lower[", bbL1,
               "] | RSI=", DoubleToString(rsi1, 2), " | SL-Low=", signalCandleLow);
   }

   // ── 7. Фиксация пробоя верхней линии BB (сигнальная свеча)
   //   close[1] > bbUpper[1]  И  rsi[1] > RSI_OverboughtLevel
   if(close1 > bbU1 && rsi1 > RSI_OverboughtLevel && !waitingSellReturn && !waitingBuyReturn)
   {
      waitingSellReturn = true;
      signalCandleHigh  = high1;
      if(EnableDetailedLog)
         Print("⚡ SELL сигнал зафиксирован: close[", close1, "] > BB Upper[", bbU1,
               "] | RSI=", DoubleToString(rsi1, 2), " | SL-High=", signalCandleHigh);
   }

   // ── 8. Сброс ожидания, если цена ушла в другую сторону
   if(waitingBuyReturn  && close1 > bbU1) { waitingBuyReturn  = false; Print("↩ BUY ожидание сброшено"); }
   if(waitingSellReturn && close1 < bbL1) { waitingSellReturn = false; Print("↩ SELL ожидание сброшено"); }

   // ── 9. Лимит открытых позиций
   if(CountOpenPositions() >= MaxOpenTrades) return;

   double ask   = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid   = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);

   // ── 10. BUY: возврат — close[1] снова выше нижней BB
   if(waitingBuyReturn && close1 > bbL1)
   {
      double sl = NormalizeDouble(signalCandleLow - SLOffset * point * 10, _Digits);
      // TP = средняя линия BB (математически вероятный возврат к MA)
      double tp = UseTP
                  ? NormalizeDouble(ask + TakeProfitPips * point * 10, _Digits)
                  : NormalizeDouble(bbMiddle[0], _Digits); // текущая средняя BB

      double lot = CalculateLotSize();

      if(EnableDetailedLog)
         Print("[BUY ВХОД] Возврат в канал | Цена=", ask,
               " | SL=", sl, " | TP=", tp,
               " | BB Mid=", DoubleToString(bbMiddle[0], _Digits),
               " | RSI=", DoubleToString(rsiBuffer[0], 2));

      if(trade.Buy(lot, _Symbol, ask, sl, tp, "RSI+BB BUY"))
      {
         Print("✅ BUY открыт: Лот=", lot,
               " | Вход=", ask, " | SL=", sl, " | TP=", tp);
         waitingBuyReturn = false;
      }
      else
         Print("✗ BUY ошибка: ", GetLastError());
   }

   // ── 11. SELL: возврат — close[1] снова ниже верхней BB
   if(waitingSellReturn && close1 < bbU1)
   {
      double sl = NormalizeDouble(signalCandleHigh + SLOffset * point * 10, _Digits);
      double tp = UseTP
                  ? NormalizeDouble(bid - TakeProfitPips * point * 10, _Digits)
                  : NormalizeDouble(bbMiddle[0], _Digits); // текущая средняя BB

      double lot = CalculateLotSize();

      if(EnableDetailedLog)
         Print("[SELL ВХОД] Возврат в канал | Цена=", bid,
               " | SL=", sl, " | TP=", tp,
               " | BB Mid=", DoubleToString(bbMiddle[0], _Digits),
               " | RSI=", DoubleToString(rsiBuffer[0], 2));

      if(trade.Sell(lot, _Symbol, bid, sl, tp, "RSI+BB SELL"))
      {
         Print("✅ SELL открыт: Лот=", lot,
               " | Вход=", bid, " | SL=", sl, " | TP=", tp);
         waitingSellReturn = false;
      }
      else
         Print("✗ SELL ошибка: ", GetLastError());
   }
}

// DetectZigZagDirection() удалена — логика пробоя BB перенесена напрямую в OnTick()

//+------------------------------------------------------------------+
//| Подсчёт открытых позиций                                         |
//+------------------------------------------------------------------+
int CountOpenPositions()
{
   int count = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(PositionSelectByTicket(ticket))
      {
         if(PositionGetString(POSITION_SYMBOL) == _Symbol && 
            PositionGetInteger(POSITION_MAGIC) == MagicNumber)
         {
            count++;
         }
      }
   }
   return count;
}

//+------------------------------------------------------------------+
//| Закрытие всех позиций                                            |
//+------------------------------------------------------------------+
void CloseAllPositions()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(PositionSelectByTicket(ticket))
      {
         if(PositionGetString(POSITION_SYMBOL) == _Symbol && 
            PositionGetInteger(POSITION_MAGIC) == MagicNumber)
         {
            long posType = PositionGetInteger(POSITION_TYPE);
            string typeStr = (posType == POSITION_TYPE_BUY) ? "BUY" : "SELL";
            
            if(trade.PositionClose(ticket))
            {
               Print("✓ Закрыта позиция ", typeStr, " по сигналу | Тикет: ", ticket);
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Расчёт размера лота от баланса                                   |
//+------------------------------------------------------------------+
double CalculateLotSize()
{
   if(UseFixedLot)
      return FixedLotSize;

   double balance = AccountInfoDouble(ACCOUNT_BALANCE);

   // Формула: Баланс / LotDivider  → 100$ / 2000 = 0.05 лота
   double lotSize = balance / LotDivider;

   double minLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double lotStep = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);

   lotSize = MathFloor(lotSize / lotStep) * lotStep;
   if(lotSize < minLot) lotSize = minLot;
   if(lotSize > maxLot) lotSize = maxLot;

   return NormalizeDouble(lotSize, 2);
}

//+------------------------------------------------------------------+
//| Управление трейлингом (безубыток + шаг каждые 1$)                |
//+------------------------------------------------------------------+
void ManageTrailing()
{
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(!PositionSelectByTicket(ticket)) continue;
      
      if(PositionGetString(POSITION_SYMBOL) != _Symbol || 
         PositionGetInteger(POSITION_MAGIC) != MagicNumber)
         continue;
      
      long posType = PositionGetInteger(POSITION_TYPE);
      double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
      double currentSL = PositionGetDouble(POSITION_SL);
      double currentTP = PositionGetDouble(POSITION_TP);
      
      double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
      double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      
      // Рассчитываем текущую прибыль в пипсах
      double profitPips = 0;
      
      if(posType == POSITION_TYPE_BUY)
      {
         profitPips = (bid - openPrice) / (point * 10);
         
         // Если прибыль >= 200 пипсов (2$), начинаем трейлинг
         if(profitPips >= BreakevenTriggerPips)
         {
            // Вычисляем, сколько полных "долларов" прибыли (каждые 100 пипсов)
            int dollarSteps = (int)MathFloor(profitPips / TrailingStepPips);
            
            // SL должен быть на (dollarSteps - 1) * 100 пипсов выше входа
            // Пример: profitPips=250 → dollarSteps=2 → SL на +100 пипсов от входа (2001.00)
            double newSL = openPrice + (dollarSteps - 1) * TrailingStepPips * point * 10;
            
            // Если есть TP, двигаем его вместе с SL (сохраняем дистанцию)
            double newTP = currentTP;
            if(UseTP && currentTP > 0)
            {
               // Вычисляем текущую дистанцию между TP и SL
               double tpSlDistance = currentTP - currentSL;
               // Устанавливаем новый TP на ту же дистанцию от нового SL
               newTP = newSL + tpSlDistance;
            }
            
            // Двигаем SL только если новый выше текущего
            if(newSL > currentSL)
            {
               if(trade.PositionModify(ticket, newSL, newTP))
               {
                  if(UseTP && newTP != currentTP)
                     Print("✓ BUY #", ticket, ": Трейлинг SL+TP | Прибыль: ", DoubleToString(profitPips, 1), 
                           " пипсов (", DoubleToString(profitPips/100, 2), "$) | Новый SL: ", newSL, " | Новый TP: ", newTP,
                           " (+", (dollarSteps-1), "00 пипсов от входа)");
                  else
                     Print("✓ BUY #", ticket, ": Трейлинг | Прибыль: ", DoubleToString(profitPips, 1), 
                           " пипсов (", DoubleToString(profitPips/100, 2), "$) | Новый SL: ", newSL, 
                           " (+", (dollarSteps-1), "00 пипсов от входа)");
               }
            }
         }
      }
      else if(posType == POSITION_TYPE_SELL)
      {
         profitPips = (openPrice - ask) / (point * 10);
         
         // Если прибыль >= 200 пипсов (2$), начинаем трейлинг
         if(profitPips >= BreakevenTriggerPips)
         {
            // Вычисляем, сколько полных "долларов" прибыли (каждые 100 пипсов)
            int dollarSteps = (int)MathFloor(profitPips / TrailingStepPips);
            
            // SL должен быть на (dollarSteps - 1) * 100 пипсов ниже входа
            // Пример: profitPips=250 → dollarSteps=2 → SL на -100 пипсов от входа
            double newSL = openPrice - (dollarSteps - 1) * TrailingStepPips * point * 10;
            
            // Если есть TP, двигаем его вместе с SL (сохраняем дистанцию)
            double newTP = currentTP;
            if(UseTP && currentTP > 0)
            {
               // Вычисляем текущую дистанцию между SL и TP
               double slTpDistance = currentSL - currentTP;
               // Устанавливаем новый TP на ту же дистанцию от нового SL
               newTP = newSL - slTpDistance;
            }
            
            // Двигаем SL только если новый ниже текущего (или SL не установлен)
            if(currentSL == 0 || newSL < currentSL)
            {
               if(trade.PositionModify(ticket, newSL, newTP))
               {
                  if(UseTP && newTP != currentTP)
                     Print("✓ SELL #", ticket, ": Трейлинг SL+TP | Прибыль: ", DoubleToString(profitPips, 1), 
                           " пипсов (", DoubleToString(profitPips/100, 2), "$) | Новый SL: ", newSL, " | Новый TP: ", newTP,
                           " (-", (dollarSteps-1), "00 пипсов от входа)");
                  else
                     Print("✓ SELL #", ticket, ": Трейлинг | Прибыль: ", DoubleToString(profitPips, 1), 
                           " пипсов (", DoubleToString(profitPips/100, 2), "$) | Новый SL: ", newSL, 
                           " (-", (dollarSteps-1), "00 пипсов от входа)");
               }
            }
         }
      }
   }
}
//+------------------------------------------------------------------+