/**
 * Trading Health Metrics Engine
 * Calculate 30-day rolling window metrics for all three rings
 */

import type { Trade } from '@/types';
import type { TradingHealthMetrics, TimeWindow, RingMetric } from './types';
import { summarizeWinLoss, classifyTradeResult } from '@/lib/utils';
import { calculateRuleAdherence, calculateConsistencyScore, calculateConsistencyStreak } from './ruleEngine';

/**
 * Filter trades by time window
 */
export function filterTradesByWindow(
  trades: Trade[],
  window: TimeWindow
): Trade[] {
  const now = new Date();
  const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
  const days = daysMap[window];
  
  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return trades.filter(trade => {
    // Support multiple timestamp field names
    const tradeDate = trade.timestamp || trade.entryTime || trade.createdAt;
    if (!tradeDate) return false;
    return new Date(tradeDate) >= cutoffDate;
  });
}

/**
 * Calculate previous window trades for trend comparison
 */
function getPreviousWindowTrades(
  trades: Trade[],
  window: TimeWindow
): Trade[] {
  const now = new Date();
  const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
  const days = daysMap[window];
  
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - days);
  
  const previousWindowStart = new Date(windowStart);
  previousWindowStart.setDate(previousWindowStart.getDate() - days);

  return trades.filter(trade => {
    // Support multiple timestamp field names
    const timestamp = trade.timestamp || trade.entryTime || trade.createdAt;
    if (!timestamp) return false;
    const tradeDate = new Date(timestamp);
    return tradeDate >= previousWindowStart && tradeDate < windowStart;
  });
}

/**
 * Determine status based on value
 */
function getStatus(value: number): 'excellent' | 'good' | 'needs-work' | 'critical' {
  if (value >= 80) return 'excellent';
  if (value >= 60) return 'good';
  if (value >= 40) return 'needs-work';
  return 'critical';
}

/**
 * Determine trend
 */
function getTrend(current: number, previous: number): 'improving' | 'stable' | 'declining' {
  const diff = current - previous;
  if (diff > 5) return 'improving';
  if (diff < -5) return 'declining';
  return 'stable';
}

/**
 * Calculate Edge Ring (based on Expectancy)
 */
function calculateEdgeRing(
  currentTrades: Trade[],
  previousTrades: Trade[]
): TradingHealthMetrics['edge'] {
  if (currentTrades.length === 0) {
    return {
      value: 0,
      goal: 80,
      status: 'critical',
      trend: 'stable',
      weekOverWeekChange: 0,
      expectancy: 0,
      winRate: 0,
      profitFactor: 0,
      wins: 0,
      losses: 0,
      totalWinningPnl: 0,
      totalLosingPnl: 0,
    };
  }

  // Calculate current metrics
  const { wins, losses, winRate } = summarizeWinLoss(currentTrades);
  
  const winningTrades = currentTrades.filter(t => classifyTradeResult(t) === 'win');
  const losingTrades = currentTrades.filter(t => classifyTradeResult(t) === 'loss');
  
  const totalWinningPnl = winningTrades.reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0);
  const totalLosingPnl = losingTrades.reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0);
  
  const avgWin = winningTrades.length > 0 ? totalWinningPnl / winningTrades.length : 0;
  const avgLoss = losingTrades.length > 0 ? totalLosingPnl / losingTrades.length : 0;
  
  const expectancy = (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss;
  
  const profitFactor = losingTrades.length > 0 ? (totalWinningPnl / totalLosingPnl) : 0;

  // Score: Normalize expectancy to 0-100 scale
  // Positive expectancy is good, higher is better
  // Score based on: expectancy > $50 = excellent, > $20 = good, > $0 = needs work
  let score = 0;
  if (expectancy > 50) score = 90;
  else if (expectancy > 20) score = 75;
  else if (expectancy > 10) score = 60;
  else if (expectancy > 0) score = 45;
  else if (expectancy > -10) score = 30;
  else score = 15;

  // Calculate previous window for trend
  let previousScore = 0;
  if (previousTrades.length > 0) {
    const prevWinningTrades = previousTrades.filter(t => classifyTradeResult(t) === 'win');
    const prevLosingTrades = previousTrades.filter(t => classifyTradeResult(t) === 'loss');
    const { winRate: prevWinRate } = summarizeWinLoss(previousTrades);
    
    const prevAvgWin = prevWinningTrades.length > 0
      ? prevWinningTrades.reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) / prevWinningTrades.length
      : 0;
    
    const prevAvgLoss = prevLosingTrades.length > 0
      ? prevLosingTrades.reduce((sum, t) => sum + Math.abs(t.pnl || 0), 0) / prevLosingTrades.length
      : 0;
    
    const prevExpectancy = (prevWinRate / 100) * prevAvgWin - (1 - prevWinRate / 100) * prevAvgLoss;
    
    if (prevExpectancy > 50) previousScore = 90;
    else if (prevExpectancy > 20) previousScore = 75;
    else if (prevExpectancy > 10) previousScore = 60;
    else if (prevExpectancy > 0) previousScore = 45;
    else if (prevExpectancy > -10) previousScore = 30;
    else previousScore = 15;
  }

  return {
    value: score,
    goal: 80,
    status: getStatus(score),
    trend: getTrend(score, previousScore),
    weekOverWeekChange: previousScore > 0 ? ((score - previousScore) / previousScore) * 100 : 0,
    expectancy,
    winRate,
    profitFactor,
    wins,
    losses,
    totalWinningPnl,
    totalLosingPnl,
  };
}

/**
 * Calculate Consistency Ring (based on Rule Adherence)
 */
function calculateConsistencyRing(
  currentTrades: Trade[],
  previousTrades: Trade[]
): TradingHealthMetrics['consistency'] {
  const currentScore = calculateConsistencyScore(currentTrades);
  const previousScore = calculateConsistencyScore(previousTrades);
  const ruleBreakdown = calculateRuleAdherence(currentTrades);
  const streaks = calculateConsistencyStreak(currentTrades);

  return {
    value: currentScore,
    goal: 80,
    status: getStatus(currentScore),
    trend: getTrend(currentScore, previousScore),
    weekOverWeekChange: previousScore > 0 ? ((currentScore - previousScore) / previousScore) * 100 : 0,
    rulesFollowed: ruleBreakdown.filter(r => r.passed).length,
    totalRules: ruleBreakdown.length,
    ruleBreakdown,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
  };
}

/**
 * Calculate Risk Control Ring (based on 30-day drawdown)
 */
function calculateRiskControlRing(
  currentTrades: Trade[],
  previousTrades: Trade[],
  accountBalance?: number
): TradingHealthMetrics['riskControl'] {
  if (currentTrades.length === 0) {
    return {
      value: 80, // No trades = no drawdown = perfect score (capped at goal)
      goal: 80,
      status: 'excellent',
      trend: 'stable',
      weekOverWeekChange: 0,
      currentDrawdown: 0,
      peakEquity: 0,
      avgRisk: 0,
      maxConsecutiveLosses: 0,
    };
  }

  // Calculate running equity curve for current window
  const sortedTrades = [...currentTrades].sort((a, b) => {
    const aTime = a.timestamp || a.entryTime || a.createdAt;
    const bTime = b.timestamp || b.entryTime || b.createdAt;
    return new Date(aTime).getTime() - new Date(bTime).getTime();
  });

  // Calculate equity curve from account balance + P&L
  // Start from account balance (if provided) and build P&L curve from there
  let equity = accountBalance || sortedTrades[0].accountBalance || 0;
  let peakEquity = equity;
  let maxDrawdown = 0;
  
  console.log('[Risk Control] Equity Curve Starting Balance:', equity);
  
  // Build equity curve by adding P&L to starting balance
  sortedTrades.forEach((trade, idx) => {
    equity += (trade.pnl || 0);
    if (equity > peakEquity) {
      peakEquity = equity;
    }
    // Only calculate drawdown if we have positive equity
    if (peakEquity > 0) {
      const drawdown = ((peakEquity - equity) / peakEquity) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    // Log first few trades for debugging
    if (idx < 3) {
      console.log(`[Risk Control] Trade ${idx + 1}: PNL ${trade.pnl}, Equity ${equity.toFixed(2)}, Peak ${peakEquity.toFixed(2)}`);
    }
  });

  const currentDrawdown = peakEquity > 0 ? ((peakEquity - equity) / peakEquity) * 100 : 0;
  
  console.log('[Risk Control] Final Equity Curve:', {
    startingBalance: accountBalance || 0,
    peakEquity: peakEquity.toFixed(2),
    currentEquity: equity.toFixed(2),
    maxDrawdown: maxDrawdown.toFixed(2) + '%',
    currentDrawdown: currentDrawdown.toFixed(2) + '%',
  });

  // Calculate avg risk per trade
  const tradesWithRisk = currentTrades.filter(t => t.riskAmount && t.riskAmount > 0);
  let avgRisk = 0;
  
  if (tradesWithRisk.length > 0) {
    // Calculate average risk amount
    const avgRiskAmount = tradesWithRisk.reduce((sum, t) => sum + t.riskAmount!, 0) / tradesWithRisk.length;
    
    // Debug logging
    console.log('[Risk Control] Avg Risk Calculation:', {
      tradesWithRisk: tradesWithRisk.length,
      avgRiskAmount,
      accountBalance,
      peakEquity,
      sampleRiskAmounts: tradesWithRisk.slice(0, 5).map(t => t.riskAmount),
    });
    
    // Priority 1: Use provided account balance (most accurate for prop firms)
    if (accountBalance && accountBalance > 0) {
      avgRisk = (avgRiskAmount / accountBalance) * 100;
      console.log('[Risk Control] Using account balance:', avgRisk.toFixed(2) + '%');
    }
    // Priority 2: Use trade-level accountBalance if tracked
    else {
      const tradesWithBalance = tradesWithRisk.filter(t => t.accountBalance && t.accountBalance > 0);
      if (tradesWithBalance.length > 0) {
        avgRisk = tradesWithBalance.reduce((sum, t) => 
          sum + ((t.riskAmount! / t.accountBalance!) * 100), 0
        ) / tradesWithBalance.length;
        console.log('[Risk Control] Using trade-level balance:', avgRisk.toFixed(2) + '%');
      }
      // Priority 3: Fallback to peak equity
      else if (peakEquity > 0) {
        avgRisk = (avgRiskAmount / peakEquity) * 100;
        console.log('[Risk Control] Using peak equity fallback:', avgRisk.toFixed(2) + '%');
      }
    }
  }

  // Max consecutive losses
  let maxConsecutiveLosses = 0;
  let currentLossStreak = 0;
  let losingStreakTrades: Trade[] = [];
  let longestLosingStreakTrades: Trade[] = [];
  
  sortedTrades.forEach(trade => {
    if (classifyTradeResult(trade) === 'loss') {
      currentLossStreak++;
      losingStreakTrades.push(trade);
      if (currentLossStreak > maxConsecutiveLosses) {
        maxConsecutiveLosses = currentLossStreak;
        longestLosingStreakTrades = [...losingStreakTrades];
      }
    } else {
      currentLossStreak = 0;
      losingStreakTrades = [];
    }
  });

  // Debug logging for losing streak
  if (maxConsecutiveLosses > 5) {
    console.log(`[Risk Control] Max consecutive losses: ${maxConsecutiveLosses}`);
    console.log('[Risk Control] Losing streak trades:', longestLosingStreakTrades.map(t => ({
      id: t.id,
      symbol: t.symbol,
      pnl: t.pnl,
      result: t.result,
      time: t.timestamp || t.entryTime || t.createdAt,
    })));
  }

  // Score: Lower drawdown = higher score
  // < 5% = excellent (80 - perfect score)
  // < 10% = good (70-79)
  // < 15% = needs work (50-69)
  // < 20% = critical (30-49)
  // >= 20% = danger (0-29)
  let score = 0;
  if (maxDrawdown < 5) score = 80; // Capped at goal
  else if (maxDrawdown < 10) score = 75;
  else if (maxDrawdown < 15) score = 60;
  else if (maxDrawdown < 20) score = 40;
  else if (maxDrawdown < 30) score = 25;
  else score = 10;

  // Calculate previous window for trend
  let previousScore = 100;
  if (previousTrades.length > 0) {
    const prevSortedTrades = [...previousTrades].sort((a, b) => {
      const aTime = a.timestamp || a.entryTime || a.createdAt;
      const bTime = b.timestamp || b.entryTime || b.createdAt;
      return new Date(aTime).getTime() - new Date(bTime).getTime();
    });
    // Use same starting balance for previous window
    let prevEquity = accountBalance || prevSortedTrades[0].accountBalance || 0;
    let prevPeakEquity = prevEquity;
    let prevMaxDrawdown = 0;

    prevSortedTrades.forEach(trade => {
      prevEquity += (trade.pnl || 0);
      if (prevEquity > prevPeakEquity) {
        prevPeakEquity = prevEquity;
      }
      // Only calculate drawdown if we have positive equity
      if (prevPeakEquity > 0) {
        const dd = ((prevPeakEquity - prevEquity) / prevPeakEquity) * 100;
        prevMaxDrawdown = Math.max(prevMaxDrawdown, dd);
      }
    });

    if (prevMaxDrawdown < 5) previousScore = 80; // Capped at goal
    else if (prevMaxDrawdown < 10) previousScore = 75;
    else if (prevMaxDrawdown < 15) previousScore = 60;
    else if (prevMaxDrawdown < 20) previousScore = 40;
    else if (prevMaxDrawdown < 30) previousScore = 25;
    else previousScore = 10;
  }

  return {
    value: score,
    goal: 80,
    status: getStatus(score),
    trend: getTrend(score, previousScore),
    weekOverWeekChange: previousScore > 0 ? ((score - previousScore) / previousScore) * 100 : 0,
    currentDrawdown,
    peakEquity,
    avgRisk,
    maxConsecutiveLosses,
  };
}

/**
 * Calculate all Trading Health metrics
 */
export function calculateTradingHealth(
  allTrades: Trade[],
  window: TimeWindow = '30d',
  accountBalance?: number
): TradingHealthMetrics {
  const currentTrades = filterTradesByWindow(allTrades, window);
  const previousTrades = getPreviousWindowTrades(allTrades, window);

  const edge = calculateEdgeRing(currentTrades, previousTrades);
  const consistency = calculateConsistencyRing(currentTrades, previousTrades);
  const riskControl = calculateRiskControlRing(currentTrades, previousTrades, accountBalance);

  return {
    edge,
    consistency,
    riskControl,
  };
}
