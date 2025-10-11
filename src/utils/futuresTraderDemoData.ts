/**
 * Aspiring Futures Trader Demo Data Generator
 * Creates realistic multi-year trading history for NQ, ES, YM
 * 55% win rate, 1.5 profit factor, realistic ups and downs
 */

import { Trade, TradeDirection, TradeResult, MoodType } from '@/types';
import { generateId } from '@/lib/localStorageUtils';

// Futures contract specs
const FUTURES_CONTRACTS = {
  NQ: {
    name: 'E-mini NASDAQ-100',
    tickSize: 0.25,
    tickValue: 5, // $5 per tick
    avgVolatility: 40, // points per move
    tradingHours: { start: 9, end: 16 },
  },
  ES: {
    name: 'E-mini S&P 500',
    tickSize: 0.25,
    tickValue: 12.50,
    avgVolatility: 15,
    tradingHours: { start: 9, end: 16 },
  },
  YM: {
    name: 'E-mini Dow',
    tickSize: 1,
    tickValue: 5,
    avgVolatility: 80,
    tradingHours: { start: 9, end: 16 },
  },
};

// Realistic setup categories for futures trading
const SETUPS = [
  'opening-range-breakout',
  'vwap-bounce',
  'previous-day-high-break',
  'trend-continuation',
  'reversal-pattern',
  'support-resistance',
  'momentum-scalp',
  'news-driven',
  'session-high-low',
  'order-flow',
];

// Realistic tags
const TAGS = [
  ['scalp', 'quick'],
  ['swing', 'multi-day'],
  ['momentum', 'trend'],
  ['reversal', 'counter-trend'],
  ['breakout', 'volume'],
  ['rangebound', 'support-resistance'],
  ['news', 'volatility'],
  ['opening-range', 'first-hour'],
  ['vwap', 'institutional'],
  ['order-flow', 'tape-reading'],
];

// Realistic notes for winning trades
const WIN_NOTES = [
  'Clean breakout with strong volume. Took partial at R1, let runner go to R2.5.',
  'VWAP bounce worked perfectly. Price respected the level, easy trade.',
  'Opening range breakout after consolidation. Momentum players stepped in.',
  'Trended all day after breaking previous high. Held through minor pullbacks.',
  'News catalyst drove clean momentum. Rode the wave, exited before retracement.',
  'Support held beautifully. Took position, scaled out as it moved.',
  'Order flow showed strong buying. Got in early, exited at resistance.',
  'Session high break with volume confirmation. Quick scalp, took profits fast.',
  'Previous day\'s level acted as support. Textbook setup, executed well.',
  'Momentum continuation after pullback. Let it run, trailed stop.',
  'VWAP reclaim after flush. Strong bounce, good risk/reward.',
  'Opening drive had momentum. Got in on the first pullback.',
  'Trend was clear all morning. Added to position on dips.',
  'Reversal pattern at key level. Quick move, took profits into strength.',
  'Clean breakout, no hesitation. Followed the plan perfectly.',
];

// Realistic notes for losing trades
const LOSS_NOTES = [
  'Stopped out at planned level. No follow-through after entry.',
  'Faked the breakout, reversed immediately. Good cut, moved on.',
  'Chop got me. Should have waited for cleaner setup.',
  'Too early on the entry. Needed more confirmation.',
  'Missed the level by a tick, got stopped out. Bad execution.',
  'News moved against me. Quick stop, preserved capital.',
  'Reversal came faster than expected. Honored my stop.',
  'Range-bound day, shouldn\'t have forced it. Small loss.',
  'Got shaken out before the real move. Stop was too tight.',
  'Wrong read on order flow. Cut it quickly.',
  'Pullback went deeper than expected. Stop hit, moved on.',
  'Breakout failed. Happens. On to the next one.',
  'Position was too large for the setup. Took proper loss.',
  'Market conditions changed mid-trade. Exited appropriately.',
  'Setup invalidated, cut it fast. No regrets.',
];

interface TradeTemplate {
  symbol: string;
  direction: TradeDirection;
  contracts: number;
  points: number; // profit/loss in points
  result: TradeResult;
  mood: MoodType;
  tags: string[];
  setup?: string;
  daysAgo: number;
}

/**
 * Generate realistic futures trade templates
 * 55% win rate, 1.5 profit factor, realistic position sizing and P&L
 */
function generateTradeTemplates(totalTrades: number = 2000): TradeTemplate[] {
  const trades: TradeTemplate[] = [];
  const winRate = 0.55; // More realistic for aspiring trader
  const wins = Math.floor(totalTrades * winRate);
  
  // Distribute symbols (NQ is most popular)
  const symbolDistribution = {
    NQ: 0.50, // 50% NQ trades
    ES: 0.35, // 35% ES trades
    YM: 0.15, // 15% YM trades
  };

  for (let i = 0; i < totalTrades; i++) {
    const isWin = i < wins;
    const daysAgo = Math.floor(i / 3); // ~3 trades per day on average
    
    // Select symbol based on distribution
    let symbol: 'NQ' | 'ES' | 'YM';
    const rand = Math.random();
    if (rand < symbolDistribution.NQ) symbol = 'NQ';
    else if (rand < symbolDistribution.NQ + symbolDistribution.ES) symbol = 'ES';
    else symbol = 'YM';

    const contract = FUTURES_CONTRACTS[symbol];
    
    // Position sizing: 1-4 contracts (professional size)
    const contracts = Math.floor(Math.random() * 3) + 1;
    
    // Direction: 55% long bias (slight bullish edge)
    const direction: TradeDirection = Math.random() < 0.55 ? 'long' : 'short';
    
    if (isWin) {
      // Winning trade: 1.2:1 to 2.5:1 R:R typically (smaller wins)
      const rMultiple = 1.2 + Math.random() * 1.3; // 1.2 to 2.5
      const riskPoints = 4 + Math.random() * 8; // risk 4-12 points typically
      const points = riskPoints * rMultiple;
      
      trades.push({
        symbol,
        direction,
        contracts,
        points,
        result: 'win',
        mood: Math.random() > 0.3 ? 'excellent' : 'good',
        tags: TAGS[Math.floor(Math.random() * TAGS.length)],
        setup: SETUPS[Math.floor(Math.random() * SETUPS.length)],
        daysAgo,
      });
    } else {
      // Losing trade: controlled losses, typically 1R
      const riskPoints = 4 + Math.random() * 8; // risk 4-12 points
      const points = -(riskPoints * (0.8 + Math.random() * 0.4)); // lose 0.8-1.2R
      
      trades.push({
        symbol,
        direction,
        contracts,
        points,
        result: 'loss',
        mood: Math.random() > 0.5 ? 'neutral' : 'poor',
        tags: TAGS[Math.floor(Math.random() * TAGS.length)],
        setup: SETUPS[Math.floor(Math.random() * SETUPS.length)],
        daysAgo,
      });
    }
  }

  // Shuffle to mix wins and losses realistically (streaks happen)
  return shuffleWithStreaks(trades);
}

/**
 * Shuffle trades but maintain realistic win/loss streaks
 * More losing days, some bad weeks, realistic struggle
 */
function shuffleWithStreaks(trades: TradeTemplate[]): TradeTemplate[] {
  const result: TradeTemplate[] = [];
  const wins = trades.filter(t => t.result === 'win');
  const losses = trades.filter(t => t.result === 'loss');
  
  let winIdx = 0;
  let lossIdx = 0;
  
  while (winIdx < wins.length || lossIdx < losses.length) {
    // 55% chance of win (more losses)
    if (Math.random() < 0.55 && winIdx < wins.length) {
      result.push(wins[winIdx++]);
      
      // Occasional win streak (2-4 wins)
      if (Math.random() < 0.25) {
        const streakLength = Math.min(Math.floor(Math.random() * 3) + 2, wins.length - winIdx);
        for (let i = 0; i < streakLength && winIdx < wins.length; i++) {
          result.push(wins[winIdx++]);
        }
      }
    } else if (lossIdx < losses.length) {
      result.push(losses[lossIdx++]);
      
      // More frequent loss streaks (2-4 losses) - rough patches
      if (Math.random() < 0.35) {
        const streakLength = Math.min(Math.floor(Math.random() * 3) + 2, losses.length - lossIdx);
        for (let i = 0; i < streakLength && lossIdx < losses.length; i++) {
          result.push(losses[lossIdx++]);
        }
      }
    }
  }
  
  return result;
}

/**
 * Convert template to full Trade object
 */
function templateToTrade(template: TradeTemplate, accountId: string, startDate: Date): Trade {
  const contract = FUTURES_CONTRACTS[template.symbol as keyof typeof FUTURES_CONTRACTS];
  
  // Entry time: weighted toward market hours
  const entryDate = new Date(startDate);
  entryDate.setDate(entryDate.getDate() - template.daysAgo);
  
  // Skip weekends (futures traders don't trade Sat/Sun)
  while (entryDate.getDay() === 0 || entryDate.getDay() === 6) {
    entryDate.setDate(entryDate.getDate() - 1);
  }
  
  // Trading hours: 9:30 AM - 4:00 PM ET (most activity)
  const hour = contract.tradingHours.start + Math.floor(Math.random() * (contract.tradingHours.end - contract.tradingHours.start));
  const minute = Math.floor(Math.random() * 60);
  entryDate.setHours(hour, minute, 0, 0);
  
  // Hold time: 5 min to 3 hours (scalp to swing)
  const holdMinutes = 5 + Math.floor(Math.random() * 175);
  const exitDate = new Date(entryDate);
  exitDate.setMinutes(exitDate.getMinutes() + holdMinutes);
  
  // Calculate prices and P&L
  const basePrice = template.symbol === 'NQ' ? 15000 : template.symbol === 'ES' ? 4500 : 35000;
  const priceVariation = basePrice * 0.02 * Math.random(); // +/- 2%
  const entryPrice = basePrice + (Math.random() > 0.5 ? priceVariation : -priceVariation);
  
  const pointMove = template.points;
  const exitPrice = template.direction === 'long' 
    ? entryPrice + pointMove 
    : entryPrice - pointMove;
  
  // P&L calculation
  const pnl = Math.abs(pointMove) * contract.tickValue * template.contracts * (template.result === 'win' ? 1 : -1);
  
  // Risk amount (typically risking $100-400 per contract)
  const riskPerContract = 100 + Math.random() * 300;
  const riskAmount = riskPerContract * template.contracts;
  
  // R:R ratio
  const rr = template.result === 'win' 
    ? 1.5 + Math.random() * 1.5 
    : 0.8 + Math.random() * 0.4;
  
  // Notes
  const notes = template.result === 'win'
    ? WIN_NOTES[Math.floor(Math.random() * WIN_NOTES.length)]
    : LOSS_NOTES[Math.floor(Math.random() * LOSS_NOTES.length)];
  
  // Add setup to notes if present
  const fullNotes = template.setup ? `Setup: ${template.setup}\n\n${notes}` : notes;
  
  return {
    id: generateId(),
    symbol: template.symbol,
    direction: template.direction,
    entryPrice,
    exitPrice,
    quantity: template.contracts,
    entryTime: entryDate.toISOString(),
    exitTime: exitDate.toISOString(),
    pnl,
    result: template.result,
    riskAmount,
    riskRewardRatio: rr,
    mood: template.mood,
    tags: template.tags,
    notes: fullNotes,
    accountId,
    accountBalance: 100000, // $100k prop account (common size)
    createdAt: entryDate.toISOString(),
    updatedAt: exitDate.toISOString(),
  };
}

/**
 * Generate full dataset for professional futures trader
 */
export function generateProfessionalFuturesTraderData(
  accountId: string,
  options: {
    totalTrades?: number;
    yearsOfHistory?: number;
  } = {}
): Trade[] {
  const { totalTrades = 2000, yearsOfHistory = 2 } = options;
  
  console.log(`🎯 Generating ${totalTrades} trades for aspiring futures trader...`);
  console.log(`📊 Win Rate: 55% (realistic)`);
  console.log(`💰 Profit Factor: ~1.5 (profitable but not perfect)`);
  console.log(`📈 Contracts: NQ (50%), ES (35%), YM (15%)`);
  console.log(`📅 History: ${yearsOfHistory} years`);
  
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - yearsOfHistory);
  
  const templates = generateTradeTemplates(totalTrades);
  const trades = templates.map(t => templateToTrade(t, accountId, new Date()));
  
  // Calculate summary stats
  const wins = trades.filter(t => t.result === 'win').length;
  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const avgWin = trades.filter(t => t.result === 'win').reduce((sum, t) => sum + (t.pnl || 0), 0) / wins;
  const avgLoss = Math.abs(trades.filter(t => t.result === 'loss').reduce((sum, t) => sum + (t.pnl || 0), 0) / (totalTrades - wins));
  
  const profitFactor = (avgWin * wins / (avgLoss * (totalTrades - wins)));
  
  console.log(`✅ Generated ${trades.length} trades`);
  console.log(`💰 Total P&L: $${totalPnL.toFixed(2)}`);
  console.log(`📊 Actual Win Rate: ${((wins / totalTrades) * 100).toFixed(1)}%`);
  console.log(`💵 Avg Win: $${avgWin.toFixed(2)}`);
  console.log(`💸 Avg Loss: $${avgLoss.toFixed(2)}`);
  console.log(`📈 Profit Factor: ${profitFactor.toFixed(2)}`);
  
  if (profitFactor < 1.3 || profitFactor > 1.8) {
    console.log(`⚠️ Note: Profit factor is ${profitFactor.toFixed(2)} - target is ~1.5 for realism`);
  }
  
  return trades;
}

/**
 * Load demo data into store
 */
export async function loadProfessionalFuturesTraderDemo(accountId: string) {
  const { useTradeStore } = await import('@/store/useTradeStore');
  const { trades: existingTrades } = useTradeStore.getState();
  
  // Check if already loaded
  if (existingTrades.length > 100) {
    console.log('⚠️ Demo data already loaded. Clear trades first if you want to reload.');
    return;
  }
  
  console.log('🚀 Loading professional futures trader demo data...');
  
  const demoTrades = generateProfessionalFuturesTraderData(accountId, {
    totalTrades: 2000, // ~3 years of trading (250 trading days/year * 3 trades/day)
    yearsOfHistory: 3,
  });
  
  // Add trades one by one using the proper addTrade method
  const { addTrade } = useTradeStore.getState();
  
  console.log('📝 Adding trades to store (this may take a moment)...');
  
  // Add in batches to avoid overwhelming the store
  let addedCount = 0;
  for (const trade of demoTrades) {
    try {
      // Remove id, createdAt, updatedAt as addTrade will generate these
      const { id, createdAt, updatedAt, ...tradeData } = trade;
      await addTrade(tradeData);
      addedCount++;
      
      // Log progress every 100 trades
      if (addedCount % 100 === 0) {
        console.log(`📊 Progress: ${addedCount}/${demoTrades.length} trades added...`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to add trade:`, error);
    }
  }
  
  console.log('✅ Demo data loaded! Refresh your views to see the data.');
  
  return addedCount;
}

