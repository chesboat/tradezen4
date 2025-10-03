/**
 * Daily Insight Engine
 * Apple-style: Simple, rule-based pattern detection
 * Analyzes trading behavior and surfaces ONE actionable insight per day
 */

import { Trade } from '@/types';

export interface DailyInsight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
  suggestion: string;
  icon: '🎯' | '⏰' | '🔥' | '⚡' | '📊' | '🎓' | '⚠️' | '💡';
  severity: 'success' | 'warning' | 'danger' | 'info';
  metric?: {
    label: string;
    value: string;
    comparison?: string;
  };
  actions?: {
    primary?: { label: string; action: string };
    secondary?: { label: string; action: string };
  };
  confidence: number; // 0-100, how confident we are in this insight
  impact: number; // 0-100, how impactful this insight is
}

type InsightType = 
  | 'overtrading'
  | 'time-of-day'
  | 'revenge-trading'
  | 'golden-hour'
  | 'session-performance'
  | 'rule-adherence'
  | 'win-streak'
  | 'loss-streak';

const INSIGHT_CACHE_KEY = 'tradzen_daily_insight';
const INSIGHT_DATE_KEY = 'tradzen_daily_insight_date';

/**
 * Get today's cached insight (one per day)
 */
export function getTodaysInsight(): DailyInsight | null {
  try {
    const today = new Date().toDateString();
    const cachedDate = localStorage.getItem(INSIGHT_DATE_KEY);
    
    if (cachedDate === today) {
      const cached = localStorage.getItem(INSIGHT_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Cache today's insight
 */
function cacheInsight(insight: DailyInsight) {
  try {
    const today = new Date().toDateString();
    localStorage.setItem(INSIGHT_DATE_KEY, today);
    localStorage.setItem(INSIGHT_CACHE_KEY, JSON.stringify(insight));
  } catch (error) {
    console.error('Failed to cache insight:', error);
  }
}

/**
 * Generate today's daily insight
 * Returns the most impactful, statistically significant insight
 */
export function generateDailyInsight(trades: Trade[], habits?: any[]): DailyInsight | null {
  // Check cache first
  const cached = getTodaysInsight();
  if (cached) {
    return cached;
  }

  // Need minimum data to generate insights
  if (trades.length < 10) {
    return null;
  }

  // Generate all possible insights
  const insights: DailyInsight[] = [
    detectOvertrading(trades),
    detectTimeOfDayPattern(trades),
    detectRevengTrading(trades),
    detectGoldenHour(trades),
    detectSessionPerformance(trades),
    detectWinStreak(trades),
    detectLossPattern(trades),
  ].filter(Boolean) as DailyInsight[];

  // Sort by impact and confidence
  insights.sort((a, b) => {
    const scoreA = a.impact * (a.confidence / 100);
    const scoreB = b.impact * (b.confidence / 100);
    return scoreB - scoreA;
  });

  // Return the best insight
  const bestInsight = insights[0] || null;
  
  if (bestInsight) {
    cacheInsight(bestInsight);
  }

  return bestInsight;
}

/**
 * Detect overtrading pattern
 */
function detectOvertrading(trades: Trade[]): DailyInsight | null {
  const last30Days = trades.filter(t => {
    const date = new Date(t.entryTime);
    const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  });

  if (last30Days.length < 20) return null;

  // Group by day
  const dayMap = new Map<string, Trade[]>();
  last30Days.forEach(t => {
    const dateStr = new Date(t.entryTime).toDateString();
    if (!dayMap.has(dateStr)) {
      dayMap.set(dateStr, []);
    }
    dayMap.get(dateStr)!.push(t);
  });

  // Calculate average trades per day
  const avgTradesPerDay = last30Days.length / dayMap.size;

  // Find days with excessive trading
  const overtradeDays = Array.from(dayMap.entries())
    .filter(([_, trades]) => trades.length > avgTradesPerDay * 1.5)
    .map(([date, trades]) => ({
      date,
      count: trades.length,
      pnl: trades.reduce((sum, t) => sum + (t.pnl || 0), 0),
      winRate: (trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100,
    }));

  if (overtradeDays.length < 3) return null;

  // Calculate performance difference
  const normalDays = Array.from(dayMap.entries())
    .filter(([_, trades]) => trades.length <= avgTradesPerDay)
    .map(([_, trades]) => trades.reduce((sum, t) => sum + (t.pnl || 0), 0));

  const avgOvertradePnL = overtradeDays.reduce((sum, d) => sum + d.pnl, 0) / overtradeDays.length;
  const avgNormalPnL = normalDays.reduce((sum, pnl) => sum + pnl, 0) / normalDays.length;

  if (avgOvertradePnL >= avgNormalPnL) return null; // Only show if overtrading hurts

  return {
    id: 'overtrading',
    type: 'overtrading',
    title: 'Overtrading Detected',
    message: `You've had ${overtradeDays.length} days with excessive trading this month. On these days, your average P&L was ${Math.abs(avgOvertradePnL).toFixed(0)}% worse.`,
    suggestion: 'Consider setting a daily trade limit. Quality over quantity.',
    icon: '⚠️',
    severity: 'warning',
    metric: {
      label: 'Overtrade Days',
      value: `${overtradeDays.length}`,
      comparison: `Avg: ${avgTradesPerDay.toFixed(1)} trades/day`,
    },
    actions: {
      primary: { label: 'View Days', action: 'view-overtrade-days' },
      secondary: { label: 'Set Limit', action: 'set-trade-limit' },
    },
    confidence: 85,
    impact: 90,
  };
}

/**
 * Detect time-of-day performance pattern
 */
function detectTimeOfDayPattern(trades: Trade[]): DailyInsight | null {
  const last60Days = trades.filter(t => {
    const daysAgo = (Date.now() - new Date(t.entryTime).getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 60;
  });

  if (last60Days.length < 30) return null;

  // Group by hour
  const hourMap = new Map<number, Trade[]>();
  last60Days.forEach(t => {
    const hour = new Date(t.entryTime).getHours();
    if (!hourMap.has(hour)) {
      hourMap.set(hour, []);
    }
    hourMap.get(hour)!.push(t);
  });

  // Find hours with significant data
  const hourStats = Array.from(hourMap.entries())
    .filter(([_, trades]) => trades.length >= 5) // Min 5 trades for significance
    .map(([hour, trades]) => ({
      hour,
      count: trades.length,
      winRate: (trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100,
      avgPnL: trades.reduce((sum, t) => sum + (t.pnl || 0), 0) / trades.length,
    }))
    .sort((a, b) => b.winRate - a.winRate);

  if (hourStats.length < 3) return null;

  const bestHour = hourStats[0];
  const worstHour = hourStats[hourStats.length - 1];
  const avgWinRate = hourStats.reduce((sum, h) => sum + h.winRate, 0) / hourStats.length;

  // Only show if there's a significant difference
  if (bestHour.winRate - worstHour.winRate < 20) return null;

  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12} ${period}`;
  };

  return {
    id: 'time-of-day',
    type: 'time-of-day',
    title: 'Your Golden Hour',
    message: `You trade best around ${formatHour(bestHour.hour)}. Your win rate during this hour is ${bestHour.winRate.toFixed(0)}% vs ${avgWinRate.toFixed(0)}% average.`,
    suggestion: `Focus your best setups during ${formatHour(bestHour.hour)}-${formatHour(bestHour.hour + 1)}.`,
    icon: '⏰',
    severity: 'success',
    metric: {
      label: 'Best Hour',
      value: formatHour(bestHour.hour),
      comparison: `${bestHour.winRate.toFixed(0)}% win rate`,
    },
    actions: {
      primary: { label: 'View Trades', action: 'view-time-analysis' },
      secondary: { label: 'Set Reminder', action: 'set-time-reminder' },
    },
    confidence: 80,
    impact: 75,
  };
}

/**
 * Detect revenge trading pattern
 */
function detectRevengTrading(trades: Trade[]): DailyInsight | null {
  const last30Days = trades.filter(t => {
    const daysAgo = (Date.now() - new Date(t.entryTime).getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  }).sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime());

  if (last30Days.length < 20) return null;

  // Find trades taken shortly after a loss
  const revengePattern: { trade: Trade; timeSinceLoss: number; outcome: number }[] = [];

  for (let i = 1; i < last30Days.length; i++) {
    const prevTrade = last30Days[i - 1];
    const currentTrade = last30Days[i];

    if ((prevTrade.pnl || 0) < 0) {
      const timeDiff = (new Date(currentTrade.entryTime).getTime() - new Date(prevTrade.entryTime).getTime()) / (1000 * 60);

      // If trade was taken within 30 minutes of a loss
      if (timeDiff <= 30) {
        revengePattern.push({
          trade: currentTrade,
          timeSinceLoss: timeDiff,
          outcome: currentTrade.pnl || 0,
        });
      }
    }
  }

  if (revengePattern.length < 5) return null;

  // Calculate win rate of revenge trades
  const revengeWinRate = (revengePattern.filter(r => r.outcome > 0).length / revengePattern.length) * 100;
  const normalWinRate = ((last30Days.filter(t => (t.pnl || 0) > 0).length / last30Days.length) * 100);

  // Only show if revenge trading is hurting
  if (revengeWinRate >= normalWinRate - 15) return null;

  return {
    id: 'revenge-trading',
    type: 'revenge-trading',
    title: 'Revenge Trading Alert',
    message: `You've taken ${revengePattern.length} trades within 30 minutes of a loss. These trades have a ${revengeWinRate.toFixed(0)}% win rate vs your ${normalWinRate.toFixed(0)}% average.`,
    suggestion: 'Wait at least 1 hour after a loss before your next trade.',
    icon: '🔥',
    severity: 'danger',
    metric: {
      label: 'Quick Trades After Loss',
      value: `${revengePattern.length}`,
      comparison: `${revengeWinRate.toFixed(0)}% win rate`,
    },
    actions: {
      primary: { label: 'View Trades', action: 'view-revenge-trades' },
      secondary: { label: 'Set Cooldown', action: 'set-cooldown-timer' },
    },
    confidence: 90,
    impact: 95,
  };
}

/**
 * Detect golden hour (already partially implemented above, this is a variation)
 */
function detectGoldenHour(trades: Trade[]): DailyInsight | null {
  // This can be a more specific version focusing on market open patterns
  return null; // Placeholder for now
}

/**
 * Detect first vs last trade session performance
 */
function detectSessionPerformance(trades: Trade[]): DailyInsight | null {
  const last30Days = trades.filter(t => {
    const daysAgo = (Date.now() - new Date(t.entryTime).getTime()) / (1000 * 60 * 60 * 24);
    return daysAgo <= 30;
  });

  if (last30Days.length < 20) return null;

  // Group by day
  const dayMap = new Map<string, Trade[]>();
  last30Days.forEach(t => {
    const dateStr = new Date(t.entryTime).toDateString();
    if (!dayMap.has(dateStr)) {
      dayMap.set(dateStr, []);
    }
    dayMap.get(dateStr)!.push(t);
  });

  // Analyze first vs last trade of each day (only days with 2+ trades)
  const firstTrades: number[] = [];
  const lastTrades: number[] = [];

  dayMap.forEach(dayTrades => {
    if (dayTrades.length >= 2) {
      const sorted = dayTrades.sort((a, b) => 
        new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime()
      );
      firstTrades.push(sorted[0].pnl || 0);
      lastTrades.push(sorted[sorted.length - 1].pnl || 0);
    }
  });

  if (firstTrades.length < 5) return null;

  const firstWinRate = (firstTrades.filter(pnl => pnl > 0).length / firstTrades.length) * 100;
  const lastWinRate = (lastTrades.filter(pnl => pnl > 0).length / lastTrades.length) * 100;

  // Only show if there's a significant difference (first is much better)
  if (firstWinRate - lastWinRate < 25) return null;

  return {
    id: 'session-performance',
    type: 'session-performance',
    title: 'Session Fatigue Detected',
    message: `Your first trade of the day has a ${firstWinRate.toFixed(0)}% win rate, but your last trade drops to ${lastWinRate.toFixed(0)}%.`,
    suggestion: 'Consider stopping after 2-3 trades to maintain peak performance.',
    icon: '⚡',
    severity: 'warning',
    metric: {
      label: 'Performance Drop',
      value: `${(firstWinRate - lastWinRate).toFixed(0)}%`,
      comparison: 'First vs Last',
    },
    actions: {
      primary: { label: 'View Analysis', action: 'view-session-analysis' },
      secondary: { label: 'Set Trade Limit', action: 'set-daily-limit' },
    },
    confidence: 75,
    impact: 80,
  };
}

/**
 * Detect win streak (positive reinforcement)
 */
function detectWinStreak(trades: Trade[]): DailyInsight | null {
  const recent = trades.slice(0, 10);
  if (recent.length < 5) return null;

  let streak = 0;
  for (const trade of recent) {
    if ((trade.pnl || 0) > 0) {
      streak++;
    } else {
      break;
    }
  }

  if (streak < 3) return null;

  return {
    id: 'win-streak',
    type: 'win-streak',
    title: `${streak}-Trade Win Streak!`,
    message: `You're on fire! Your last ${streak} trades were all winners. Keep following your process.`,
    suggestion: 'Don\'t get overconfident. Stick to your risk management rules.',
    icon: '🎯',
    severity: 'success',
    metric: {
      label: 'Current Streak',
      value: `${streak} wins`,
      comparison: 'Stay disciplined',
    },
    confidence: 100,
    impact: 60, // Lower impact since it's positive reinforcement
  };
}

/**
 * Detect loss pattern
 */
function detectLossPattern(trades: Trade[]): DailyInsight | null {
  const recent = trades.slice(0, 10);
  if (recent.length < 5) return null;

  const losses = recent.filter(t => (t.pnl || 0) < 0);
  
  if (losses.length >= 3 && recent.slice(0, 3).every(t => (t.pnl || 0) < 0)) {
    return {
      id: 'loss-streak',
      type: 'loss-streak',
      title: 'Take a Break',
      message: 'Your last 3 trades were losses. This is a good time to step away and reset.',
      suggestion: 'Review your trading plan, then come back fresh tomorrow.',
      icon: '🎓',
      severity: 'danger',
      metric: {
        label: 'Recent Losses',
        value: '3 in a row',
        comparison: 'Time to reset',
      },
      actions: {
        primary: { label: 'Review Trades', action: 'review-losses' },
        secondary: { label: 'Take Break', action: 'log-break' },
      },
      confidence: 100,
      impact: 100, // Highest impact - prevent further damage
    };
  }

  return null;
}

/**
 * Clear cached insight (for testing)
 */
export function clearInsightCache() {
  localStorage.removeItem(INSIGHT_CACHE_KEY);
  localStorage.removeItem(INSIGHT_DATE_KEY);
  console.log('✅ Insight cache cleared');
}

// Expose for console debugging
if (typeof window !== 'undefined') {
  (window as any).clearInsightCache = clearInsightCache;
  (window as any).generateDailyInsight = generateDailyInsight;
}

