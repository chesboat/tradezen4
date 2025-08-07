import { Trade, TradeDirection, TradeResult, MoodType } from '@/types';
import { generateId } from '@/lib/localStorageUtils';

interface DemoTradeTemplate {
  symbol: string;
  direction: TradeDirection;
  riskAmount: number;
  riskRewardRatio: number;
  result: TradeResult;
  mood: MoodType;
  notes?: string;
  tags?: string[];
  daysAgo: number;
  entryPrice: number;
  quantity: number;
}

const demoTrades: DemoTradeTemplate[] = [
  // Recent profitable streak
  {
    symbol: 'AAPL',
    direction: 'long',
    riskAmount: 200,
    riskRewardRatio: 2.5,
    result: 'win',
    mood: 'excellent',
    notes: 'Perfect breakout above resistance. Clean setup with high volume.',
    tags: ['breakout', 'tech', 'momentum'],
    daysAgo: 1,
    entryPrice: 185.50,
    quantity: 100,
  },
  {
    symbol: 'TSLA',
    direction: 'long',
    riskAmount: 300,
    riskRewardRatio: 1.8,
    result: 'win',
    mood: 'good',
    notes: 'Good follow-through after earnings. Took partial profits.',
    tags: ['earnings', 'ev', 'partial'],
    daysAgo: 2,
    entryPrice: 240.75,
    quantity: 75,
  },
  {
    symbol: 'SPY',
    direction: 'long',
    riskAmount: 150,
    riskRewardRatio: 1.5,
    result: 'win',
    mood: 'neutral',
    notes: 'Market bounce off support. Conservative position size.',
    tags: ['support', 'etf', 'conservative'],
    daysAgo: 3,
    entryPrice: 445.20,
    quantity: 200,
  },
  
  // Mixed results week
  {
    symbol: 'NVDA',
    direction: 'long',
    riskAmount: 400,
    riskRewardRatio: 3.0,
    result: 'loss',
    mood: 'poor',
    notes: 'Failed breakout. Should have waited for better confirmation.',
    tags: ['failed-breakout', 'ai', 'lesson'],
    daysAgo: 5,
    entryPrice: 875.00,
    quantity: 50,
  },
  {
    symbol: 'QQQ',
    direction: 'short',
    riskAmount: 250,
    riskRewardRatio: 2.0,
    result: 'win',
    mood: 'good',
    notes: 'Nice rejection at resistance. Perfect short setup.',
    tags: ['rejection', 'resistance', 'short'],
    daysAgo: 6,
    entryPrice: 385.50,
    quantity: 150,
  },
  {
    symbol: 'MSFT',
    direction: 'long',
    riskAmount: 175,
    riskRewardRatio: 1.2,
    result: 'breakeven',
    mood: 'neutral',
    notes: 'Sideways action. Got out at breakeven.',
    tags: ['sideways', 'breakeven', 'tech'],
    daysAgo: 7,
    entryPrice: 380.25,
    quantity: 80,
  },

  // Earlier profitable period
  {
    symbol: 'AMZN',
    direction: 'long',
    riskAmount: 350,
    riskRewardRatio: 2.2,
    result: 'win',
    mood: 'excellent',
    notes: 'Great cloud earnings beat. Held for full target.',
    tags: ['earnings', 'cloud', 'full-target'],
    daysAgo: 10,
    entryPrice: 145.80,
    quantity: 120,
  },
  {
    symbol: 'GOOGL',
    direction: 'long',
    riskAmount: 280,
    riskRewardRatio: 1.9,
    result: 'win',
    mood: 'good',
    notes: 'AI news catalyst. Quick scalp trade.',
    tags: ['ai', 'catalyst', 'scalp'],
    daysAgo: 12,
    entryPrice: 138.45,
    quantity: 90,
  },
  {
    symbol: 'META',
    direction: 'short',
    riskAmount: 225,
    riskRewardRatio: 2.8,
    result: 'loss',
    mood: 'poor',
    notes: 'Unexpected reversal on regulatory news. Cut losses quickly.',
    tags: ['reversal', 'news', 'cut-losses'],
    daysAgo: 14,
    entryPrice: 325.60,
    quantity: 70,
  },

  // Swing trades from 3 weeks ago
  {
    symbol: 'IWM',
    direction: 'long',
    riskAmount: 180,
    riskRewardRatio: 2.5,
    result: 'win',
    mood: 'good',
    notes: 'Small caps breaking out. Held for 3 days.',
    tags: ['small-caps', 'breakout', 'swing'],
    daysAgo: 18,
    entryPrice: 198.30,
    quantity: 110,
  },
  {
    symbol: 'DIA',
    direction: 'short',
    riskAmount: 200,
    riskRewardRatio: 1.8,
    result: 'win',
    mood: 'neutral',
    notes: 'Dow weakness trade. Nice follow-through.',
    tags: ['dow', 'weakness', 'follow-through'],
    daysAgo: 20,
    entryPrice: 348.75,
    quantity: 95,
  },
  {
    symbol: 'AAPL',
    direction: 'long',
    riskAmount: 300,
    riskRewardRatio: 1.5,
    result: 'loss',
    mood: 'terrible',
    notes: 'FOMO trade after missing the initial move. Bad entry.',
    tags: ['fomo', 'bad-entry', 'lesson'],
    daysAgo: 22,
    entryPrice: 182.90,
    quantity: 85,
  },

  // Month ago mixed bag
  {
    symbol: 'XLK',
    direction: 'long',
    riskAmount: 160,
    riskRewardRatio: 2.0,
    result: 'win',
    mood: 'good',
    notes: 'Tech sector rotation play. Solid execution.',
    tags: ['sector', 'rotation', 'solid'],
    daysAgo: 25,
    entryPrice: 175.40,
    quantity: 60,
  },
  {
    symbol: 'COIN',
    direction: 'short',
    riskAmount: 400,
    riskRewardRatio: 3.5,
    result: 'win',
    mood: 'excellent',
    notes: 'Bitcoin weakness affecting crypto stocks. Perfect timing.',
    tags: ['crypto', 'bitcoin', 'correlation'],
    daysAgo: 28,
    entryPrice: 95.20,
    quantity: 40,
  },
  {
    symbol: 'ROKU',
    direction: 'long',
    riskAmount: 250,
    riskRewardRatio: 2.1,
    result: 'loss',
    mood: 'poor',
    notes: 'Streaming stocks got hit by subscriber fears.',
    tags: ['streaming', 'subscribers', 'sector-wide'],
    daysAgo: 30,
    entryPrice: 68.50,
    quantity: 50,
  },

  // Older trades for historical data
  {
    symbol: 'NFLX',
    direction: 'long',
    riskAmount: 320,
    riskRewardRatio: 1.7,
    result: 'win',
    mood: 'good',
    notes: 'Content announcement bounce. Quick day trade.',
    tags: ['content', 'bounce', 'day-trade'],
    daysAgo: 35,
    entryPrice: 425.80,
    quantity: 35,
  },
  {
    symbol: 'AMD',
    direction: 'long',
    riskAmount: 275,
    riskRewardRatio: 2.3,
    result: 'win',
    mood: 'excellent',
    notes: 'Semiconductor strength. Rode the trend perfectly.',
    tags: ['semiconductor', 'trend', 'perfect'],
    daysAgo: 40,
    entryPrice: 105.60,
    quantity: 80,
  },
  {
    symbol: 'TLT',
    direction: 'short',
    riskAmount: 190,
    riskRewardRatio: 1.9,
    result: 'loss',
    mood: 'neutral',
    notes: 'Bond yields didn\'t move as expected. Risk management worked.',
    tags: ['bonds', 'yields', 'risk-management'],
    daysAgo: 45,
    entryPrice: 92.40,
    quantity: 65,
  },

  // Cryptocurrency plays
  {
    symbol: 'MSTR',
    direction: 'long',
    riskAmount: 450,
    riskRewardRatio: 2.8,
    result: 'win',
    mood: 'excellent',
    notes: 'Bitcoin proxy play worked perfectly. Huge volatility.',
    tags: ['bitcoin', 'proxy', 'volatility'],
    daysAgo: 50,
    entryPrice: 145.30,
    quantity: 25,
  },
  {
    symbol: 'MARA',
    direction: 'short',
    riskAmount: 350,
    riskRewardRatio: 2.0,
    result: 'breakeven',
    mood: 'neutral',
    notes: 'Crypto miner trade. Choppy action, got out flat.',
    tags: ['crypto', 'miner', 'choppy'],
    daysAgo: 55,
    entryPrice: 18.75,
    quantity: 100,
  },
];

export const generateDemoTrades = (accountId: string): Trade[] => {
  const now = new Date();
  
  return demoTrades.map((template) => {
    // Calculate entry and exit times
    const entryTime = new Date(now);
    entryTime.setDate(entryTime.getDate() - template.daysAgo);
    entryTime.setHours(9 + Math.floor(Math.random() * 7), Math.floor(Math.random() * 60), 0, 0);
    
    const exitTime = new Date(entryTime);
    exitTime.setMinutes(exitTime.getMinutes() + (15 + Math.floor(Math.random() * 240))); // 15min to 4h hold
    
    // Calculate P&L based on result and risk/reward
    let pnl = 0;
    let exitPrice = template.entryPrice;
    
    switch (template.result) {
      case 'win':
        pnl = template.riskAmount * template.riskRewardRatio;
        const winPriceMove = (pnl / template.quantity);
        exitPrice = template.direction === 'long' 
          ? template.entryPrice + winPriceMove 
          : template.entryPrice - winPriceMove;
        break;
      case 'loss':
        pnl = -template.riskAmount;
        const lossPriceMove = (template.riskAmount / template.quantity);
        exitPrice = template.direction === 'long'
          ? template.entryPrice - lossPriceMove
          : template.entryPrice + lossPriceMove;
        break;
      case 'breakeven':
        pnl = Math.random() * 20 - 10; // Small random P&L around breakeven
        exitPrice = template.entryPrice + (pnl / template.quantity);
        break;
    }

    return {
      id: generateId(),
      symbol: template.symbol,
      direction: template.direction,
      entryPrice: template.entryPrice,
      exitPrice: exitPrice,
      quantity: template.quantity,
      riskAmount: template.riskAmount,
      riskRewardRatio: template.riskRewardRatio,
      result: template.result,
      pnl: Math.round(pnl * 100) / 100, // Round to 2 decimal places
      entryTime,
      exitTime,
      mood: template.mood,
      tags: template.tags || [],
      notes: template.notes,
      attachedQuickNotes: [],
      accountId,
      createdAt: entryTime,
      updatedAt: exitTime,
    };
  });
};

export const addDemoTradesToAccount = async (accountId: string) => {
  const { useTradeStore } = await import('@/store/useTradeStore');
  const { useActivityLogStore } = await import('@/store/useActivityLogStore');
  
  const { addTrade } = useTradeStore.getState();
  const { addActivity } = useActivityLogStore.getState();
  
  const demoTrades = generateDemoTrades(accountId);
  
  // Add trades one by one to populate activity log
  demoTrades.forEach((trade, index) => {
    setTimeout(() => {
      const addedTrade = addTrade({
        symbol: trade.symbol,
        direction: trade.direction,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        quantity: trade.quantity,
        riskAmount: trade.riskAmount,
        riskRewardRatio: trade.riskRewardRatio,
        result: trade.result,
        pnl: trade.pnl,
        entryTime: trade.entryTime,
        exitTime: trade.exitTime,
        mood: trade.mood,
        tags: trade.tags,
        notes: trade.notes,
        attachedQuickNotes: trade.attachedQuickNotes,
        accountId: trade.accountId,
      });

      // Add to activity log
      addActivity({
        type: 'trade',
        title: `${trade.symbol} ${trade.direction.toUpperCase()} - ${(trade.result || 'unknown').toUpperCase()}`,
        description: `${trade.result === 'win' ? 'Won' : trade.result === 'loss' ? 'Lost' : 'Broke even on'} $${Math.abs(trade.pnl || 0).toFixed(2)}`,
        xpEarned: trade.result === 'win' ? 25 : trade.result === 'loss' ? 5 : 10,
        relatedId: addedTrade.id,
        accountId: trade.accountId,
      });
    }, index * 50); // Small delay to avoid overwhelming the UI
  });

  return demoTrades.length;
}; 