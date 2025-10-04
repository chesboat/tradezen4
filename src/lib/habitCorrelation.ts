/**
 * Habit-Trading Correlation Engine
 * Apple-style: Invisible intelligence that discovers surprising connections
 * Works with ANY habit the user creates - from "gym" to "wore lucky socks"
 */

import { Trade } from '@/types';

interface HabitDay {
  date: string; // YYYY-MM-DD
  ruleId: string;
  completed: boolean;
}

interface TradeMetrics {
  trades: Trade[];
  count: number;
  winRate: number;
  avgPnL: number;
  totalPnL: number;
  overtrades: number; // Days with >avg trades
  largestWin: number;
  largestLoss: number;
}

export interface HabitCorrelation {
  habitLabel: string;
  habitEmoji: string;
  habitId: string;
  
  // Performance comparison
  withHabit: TradeMetrics;
  withoutHabit: TradeMetrics;
  
  // Key improvements
  winRateImprovement: number; // percentage points
  avgPnLImprovement: number; // dollar amount
  overtradeReduction: number; // percentage
  
  // Statistical confidence
  confidence: number; // 0-100
  sampleSize: number; // days with habit completed
  
  // Human-readable insights
  primaryInsight: string; // "You trade 23% better"
  secondaryInsights: string[]; // Additional observations
}

/**
 * Calculate metrics for a set of trades
 */
function calculateMetrics(trades: Trade[]): TradeMetrics {
  if (trades.length === 0) {
    return {
      trades: [],
      count: 0,
      winRate: 0,
      avgPnL: 0,
      totalPnL: 0,
      overtrades: 0,
      largestWin: 0,
      largestLoss: 0,
    };
  }

  const wins = trades.filter(t => (t.pnl || 0) > 0);
  const losses = trades.filter(t => (t.pnl || 0) < 0);
  const winRate = (wins.length / trades.length) * 100;
  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const avgPnL = totalPnL / trades.length;

  // Calculate overtrade days (days with >6 trades)
  const dayMap = new Map<string, number>();
  trades.forEach(t => {
    const date = new Date(t.entryTime).toDateString();
    dayMap.set(date, (dayMap.get(date) || 0) + 1);
  });
  const overtrades = Array.from(dayMap.values()).filter(count => count > 6).length;

  const largestWin = wins.length > 0 
    ? Math.max(...wins.map(t => t.pnl || 0))
    : 0;
  const largestLoss = losses.length > 0
    ? Math.min(...losses.map(t => t.pnl || 0))
    : 0;

  return {
    trades,
    count: trades.length,
    winRate,
    avgPnL,
    totalPnL,
    overtrades,
    largestWin,
    largestLoss,
  };
}

/**
 * Calculate statistical confidence
 * Based on sample size and effect size
 */
function calculateConfidence(
  withHabitCount: number,
  withoutHabitCount: number,
  effectSize: number
): number {
  // Simple confidence based on sample size and effect size
  const minSampleSize = Math.min(withHabitCount, withoutHabitCount);
  
  // Sample size score (0-50)
  let sampleScore = 0;
  if (minSampleSize >= 30) sampleScore = 50;
  else if (minSampleSize >= 20) sampleScore = 40;
  else if (minSampleSize >= 15) sampleScore = 35;
  else if (minSampleSize >= 10) sampleScore = 30;
  else sampleScore = minSampleSize * 2; // 10 points per sample below 10
  
  // Effect size score (0-50)
  const effectScore = Math.min(50, Math.abs(effectSize) / 2);
  
  return Math.round(sampleScore + effectScore);
}

/**
 * Analyze correlation between a specific habit and trading performance
 */
export function analyzeHabitCorrelation(
  habitId: string,
  habitLabel: string,
  habitEmoji: string,
  habitDays: HabitDay[],
  allTrades: Trade[]
): HabitCorrelation | null {
  // Minimum data requirements
  const completedDays = habitDays.filter(d => d.completed);
  if (completedDays.length < 10) return null; // Need at least 10 habit days
  if (allTrades.length < 30) return null; // Need decent trade history

  // Group trades by whether habit was completed that day
  const tradesWithHabit: Trade[] = [];
  const tradesWithoutHabit: Trade[] = [];

  allTrades.forEach(trade => {
    const tradeDate = new Date(trade.entryTime).toISOString().split('T')[0];
    const habitDay = habitDays.find(h => h.date === tradeDate);
    
    if (habitDay?.completed) {
      tradesWithHabit.push(trade);
    } else {
      tradesWithoutHabit.push(trade);
    }
  });

  // Need trades in both groups
  if (tradesWithHabit.length < 5 || tradesWithoutHabit.length < 5) return null;

  // Calculate metrics
  const withMetrics = calculateMetrics(tradesWithHabit);
  const withoutMetrics = calculateMetrics(tradesWithoutHabit);

  // Calculate improvements
  const winRateImprovement = withMetrics.winRate - withoutMetrics.winRate;
  const avgPnLImprovement = withMetrics.avgPnL - withoutMetrics.avgPnL;
  
  // Calculate overtrade reduction rate
  const withOvertradeDays = completedDays.length;
  const withoutOvertradeDays = habitDays.length - completedDays.length;
  const overtradeRateWith = withOvertradeDays > 0 
    ? (withMetrics.overtrades / withOvertradeDays) * 100
    : 0;
  const overtradeRateWithout = withoutOvertradeDays > 0
    ? (withoutMetrics.overtrades / withoutOvertradeDays) * 100
    : 0;
  const overtradeReduction = overtradeRateWithout - overtradeRateWith;

  // Only show positive correlations (minimum 10% win rate improvement OR $50 avg P&L improvement)
  if (winRateImprovement < 10 && avgPnLImprovement < 50) return null;

  // Calculate confidence
  const effectSize = Math.max(
    Math.abs(winRateImprovement),
    Math.abs(avgPnLImprovement) / 10 // Normalize P&L to similar scale
  );
  const confidence = calculateConfidence(
    completedDays.length,
    habitDays.length - completedDays.length,
    effectSize
  );

  // Minimum confidence threshold
  if (confidence < 70) return null;

  // Generate insights
  const primaryInsight = generatePrimaryInsight(
    habitLabel,
    winRateImprovement,
    avgPnLImprovement,
    withMetrics,
    withoutMetrics
  );

  const secondaryInsights = generateSecondaryInsights(
    withMetrics,
    withoutMetrics,
    overtradeReduction
  );

  return {
    habitLabel,
    habitEmoji,
    habitId,
    withHabit: withMetrics,
    withoutHabit: withoutMetrics,
    winRateImprovement,
    avgPnLImprovement,
    overtradeReduction,
    confidence,
    sampleSize: completedDays.length,
    primaryInsight,
    secondaryInsights,
  };
}

/**
 * Generate primary insight message (Apple-style: simple, impactful)
 */
function generatePrimaryInsight(
  habitLabel: string,
  winRateImprovement: number,
  avgPnLImprovement: number,
  withMetrics: TradeMetrics,
  withoutMetrics: TradeMetrics
): string {
  // Focus on the most impressive metric
  if (winRateImprovement >= 15) {
    return `On days you complete "${habitLabel}", your win rate is ${Math.abs(winRateImprovement).toFixed(0)}% higher`;
  }
  
  if (avgPnLImprovement >= 100) {
    const sign = avgPnLImprovement > 0 ? '+' : '';
    return `On days you complete "${habitLabel}", you average ${sign}$${Math.abs(avgPnLImprovement).toFixed(0)} more per trade`;
  }
  
  if (winRateImprovement >= 10) {
    return `You trade ${Math.abs(winRateImprovement).toFixed(0)}% better on "${habitLabel}" days`;
  }
  
  return `Your trading improves on days you complete "${habitLabel}"`;
}

/**
 * Generate secondary insights (additional observations)
 */
function generateSecondaryInsights(
  withMetrics: TradeMetrics,
  withoutMetrics: TradeMetrics,
  overtradeReduction: number
): string[] {
  const insights: string[] = [];

  // Win rate comparison
  if (Math.abs(withMetrics.winRate - withoutMetrics.winRate) >= 10) {
    insights.push(
      `${withMetrics.winRate.toFixed(0)}% win rate vs ${withoutMetrics.winRate.toFixed(0)}% normally`
    );
  }

  // Avg P&L comparison
  if (Math.abs(withMetrics.avgPnL - withoutMetrics.avgPnL) >= 50) {
    const withSign = withMetrics.avgPnL >= 0 ? '+' : '';
    const withoutSign = withoutMetrics.avgPnL >= 0 ? '+' : '';
    insights.push(
      `${withSign}$${withMetrics.avgPnL.toFixed(0)} avg P&L vs ${withoutSign}$${withoutMetrics.avgPnL.toFixed(0)}`
    );
  }

  // Overtrade reduction
  if (overtradeReduction > 20) {
    insights.push(
      `${Math.abs(overtradeReduction).toFixed(0)}% less overtrading`
    );
  }

  // Never overtrade
  if (withMetrics.overtrades === 0 && withoutMetrics.overtrades > 0) {
    insights.push('You never overtrade on these days');
  }

  return insights;
}

/**
 * Find ALL habit-trading correlations, sorted by impact
 */
export function findAllHabitCorrelations(
  habits: Array<{ id: string; label: string; emoji: string }>,
  habitDays: HabitDay[],
  trades: Trade[]
): HabitCorrelation[] {
  const correlations: HabitCorrelation[] = [];

  for (const habit of habits) {
    const habitSpecificDays = habitDays.filter(d => d.ruleId === habit.id);
    const correlation = analyzeHabitCorrelation(
      habit.id,
      habit.label,
      habit.emoji,
      habitSpecificDays,
      trades
    );

    if (correlation) {
      correlations.push(correlation);
    }
  }

  // Sort by combined impact score (win rate + normalized P&L + confidence)
  correlations.sort((a, b) => {
    const scoreA = a.winRateImprovement + (a.avgPnLImprovement / 10) + (a.confidence / 10);
    const scoreB = b.winRateImprovement + (b.avgPnLImprovement / 10) + (b.confidence / 10);
    return scoreB - scoreA;
  });

  return correlations;
}

/**
 * Find the top 3 habit-trading correlations (Premium feature)
 */
export function findTopHabitCorrelations(
  habits: Array<{ id: string; label: string; emoji: string }>,
  habitDays: HabitDay[],
  trades: Trade[],
  limit: number = 3
): HabitCorrelation[] {
  const allCorrelations = findAllHabitCorrelations(habits, habitDays, trades);
  return allCorrelations.slice(0, limit);
}

/**
 * Find the strongest habit-trading correlation across all habits
 */
export function findStrongestHabitCorrelation(
  habits: Array<{ id: string; label: string; emoji: string }>,
  habitDays: HabitDay[],
  trades: Trade[]
): HabitCorrelation | null {
  const allCorrelations = findAllHabitCorrelations(habits, habitDays, trades);
  return allCorrelations.length > 0 ? allCorrelations[0] : null;
}

