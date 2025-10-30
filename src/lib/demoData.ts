/**
 * Demo Data for Marketing Dashboard Preview
 * Apple-quality demo data that tells a story of a successful trader
 */

import type { TradingHealthMetrics } from './tradingHealth/types';

// ============================================
// TRADING HEALTH RINGS DEMO DATA
// ============================================

export const DEMO_HEALTH_METRICS: TradingHealthMetrics = {
  edge: {
    value: 75,
    goal: 80,
    percentage: 93.75,
    trend: 'up' as const,
    status: 'good' as const,
    description: 'Your trading edge is strong',
  },
  consistency: {
    value: 68,
    goal: 80,
    percentage: 85,
    trend: 'up' as const,
    status: 'good' as const,
    description: 'Consistent execution',
  },
  riskControl: {
    value: 52,
    goal: 80,
    percentage: 65,
    trend: 'neutral' as const,
    status: 'warning' as const,
    description: 'Risk elevated - review position sizing',
  },
  overallScore: 65,
  timeWindow: 'today' as const,
  lastUpdated: new Date().toISOString(),
};

// ============================================
// ANALYTICS DASHBOARD DEMO DATA
// ============================================

export const DEMO_ANALYTICS = {
  totalPnL: 24450.75,
  winRate: 68,
  avgRR: 1.8,
  tradeCount: 142,
  vsLastMonth: 15.2,
  
  // Equity curve data (30 days)
  equityCurve: [
    { date: '2025-10-01', value: 10000, trades: 5 },
    { date: '2025-10-03', value: 11200, trades: 8 },
    { date: '2025-10-06', value: 12800, trades: 12 },
    { date: '2025-10-08', value: 13500, trades: 15 },
    { date: '2025-10-10', value: 15200, trades: 19 },
    { date: '2025-10-13', value: 14800, trades: 24 }, // Small drawdown
    { date: '2025-10-15', value: 16500, trades: 29 },
    { date: '2025-10-17', value: 18200, trades: 35 },
    { date: '2025-10-20', value: 19800, trades: 42 },
    { date: '2025-10-22', value: 21200, trades: 48 },
    { date: '2025-10-24', value: 22800, trades: 54 },
    { date: '2025-10-27', value: 23900, trades: 60 },
    { date: '2025-10-28', value: 24450.75, trades: 65 },
  ],
  
  // Additional metrics
  avgWin: 420,
  avgLoss: 180,
  avgHoldTime: '2.5h',
  biggestWin: 1250,
  biggestLoss: -450,
  longestWinStreak: 8,
};

// ============================================
// CALENDAR & STREAK DEMO DATA
// ============================================

export const DEMO_CALENDAR = {
  month: 'October',
  year: 2025,
  currentStreak: 12,
  bestStreak: 28,
  completionRate: 82, // 23 out of 28 days
  daysThisMonth: 23,
  
  // Calendar days (October 2025)
  days: [
    // Week 1 (Sept 28 - Oct 4)
    { date: '2025-09-28', status: null, isCurrentMonth: false },
    { date: '2025-09-29', status: null, isCurrentMonth: false },
    { date: '2025-09-30', status: null, isCurrentMonth: false },
    { date: '2025-10-01', status: 'complete', trades: 5, pnl: 450 }, // 🟢
    { date: '2025-10-02', status: 'complete', trades: 4, pnl: 320 }, // 🟢
    { date: '2025-10-03', status: 'none', trades: 0, pnl: 0 }, // ⚫ Weekend
    { date: '2025-10-04', status: 'none', trades: 0, pnl: 0 }, // ⚫ Weekend
    
    // Week 2 (Oct 5-11)
    { date: '2025-10-05', status: 'complete', trades: 6, pnl: 580 }, // 🟢
    { date: '2025-10-06', status: 'partial', trades: 3, pnl: 120 }, // 🟡
    { date: '2025-10-07', status: 'complete', trades: 5, pnl: 410 }, // 🟢
    { date: '2025-10-08', status: 'complete', trades: 4, pnl: 380 }, // 🟢
    { date: '2025-10-09', status: 'complete', trades: 7, pnl: 620 }, // 🟢
    { date: '2025-10-10', status: 'none', trades: 0, pnl: 0 }, // ⚫ Weekend
    { date: '2025-10-11', status: 'none', trades: 0, pnl: 0 }, // ⚫ Weekend
    
    // Week 3 (Oct 12-18)
    { date: '2025-10-12', status: 'complete', trades: 5, pnl: 490 }, // 🟢
    { date: '2025-10-13', status: 'complete', trades: 4, pnl: 360 }, // 🟢
    { date: '2025-10-14', status: 'complete', trades: 6, pnl: 540 }, // 🟢
    { date: '2025-10-15', status: 'partial', trades: 2, pnl: 90 }, // 🟡
    { date: '2025-10-16', status: 'complete', trades: 5, pnl: 450 }, // 🟢
    { date: '2025-10-17', status: 'none', trades: 0, pnl: 0 }, // ⚫ Weekend
    { date: '2025-10-18', status: 'none', trades: 0, pnl: 0 }, // ⚫ Weekend
    
    // Week 4 (Oct 19-25)
    { date: '2025-10-19', status: 'complete', trades: 6, pnl: 580 }, // 🟢
    { date: '2025-10-20', status: 'complete', trades: 5, pnl: 470 }, // 🟢
    { date: '2025-10-21', status: 'complete', trades: 4, pnl: 390 }, // 🟢
    { date: '2025-10-22', status: 'complete', trades: 5, pnl: 510 }, // 🟢
    { date: '2025-10-23', status: 'today', trades: 3, pnl: 280 }, // 🔵 Today (in progress)
    { date: '2025-10-24', status: 'future', trades: 0, pnl: 0 }, // ⚪
    { date: '2025-10-25', status: 'future', trades: 0, pnl: 0 }, // ⚪
    
    // Week 5 (Oct 26-31)
    { date: '2025-10-26', status: 'future', trades: 0, pnl: 0 }, // ⚪
    { date: '2025-10-27', status: 'future', trades: 0, pnl: 0 }, // ⚪
    { date: '2025-10-28', status: 'future', trades: 0, pnl: 0 }, // ⚪
    { date: '2025-10-29', status: 'future', trades: 0, pnl: 0 }, // ⚪
    { date: '2025-10-30', status: 'future', trades: 0, pnl: 0 }, // ⚪
    { date: '2025-10-31', status: 'future', trades: 0, pnl: 0 }, // ⚪
    { date: '2025-11-01', status: null, isCurrentMonth: false },
  ],
};

// ============================================
// AI INSIGHTS DEMO DATA (PREMIUM)
// ============================================

export const DEMO_AI_INSIGHTS = [
  {
    id: 'pattern-1',
    type: 'pattern' as const,
    icon: '📊',
    title: 'Pattern Detected',
    description: 'You have a 78% win rate on Tuesday mornings (9:30-11:00 ET) when trading momentum setups on SPY.',
    recommendation: 'Consider increasing position size by 25% on this specific setup. Your avg R:R is 2.1:1 in this window.',
    confidence: 'high' as const,
    isPremium: true,
    impact: '+$340/week potential',
  },
  {
    id: 'habit-1',
    type: 'habit' as const,
    icon: '🎯',
    title: 'Habit Correlation',
    description: 'Days when you log a pre-market plan correlate with +$240 higher average P&L (68% vs 52% win rate).',
    recommendation: 'Set a daily reminder for 9:00 AM to log your trading plan before market open.',
    confidence: 'high' as const,
    isPremium: true,
    impact: '+$1,200/month potential',
  },
  {
    id: 'risk-1',
    type: 'risk' as const,
    icon: '⚠️',
    title: 'Risk Alert',
    description: 'Your position sizing has increased 32% over the last 5 days. This correlates with a drop in win rate from 68% to 54%.',
    recommendation: 'Return to your baseline position size and rebuild confidence before scaling up again.',
    confidence: 'high' as const,
    isPremium: true,
    impact: 'Protect $800/week',
  },
];

// ============================================
// TODAY'S CHECKLIST DEMO DATA
// ============================================

export const DEMO_CHECKLIST = [
  { id: 1, label: 'Journal logged today', checked: true, icon: '📝' },
  { id: 2, label: 'Trading plan followed', checked: true, icon: '📋' },
  { id: 3, label: 'Edge documented', checked: true, icon: '💡' },
  { id: 4, label: 'Position size elevated', checked: false, warning: true, icon: '⚠️' },
];

// ============================================
// KPI CARDS DEMO DATA
// ============================================

export const DEMO_KPI_CARDS = [
  {
    label: 'Total P&L',
    value: '$24,450.75',
    subValue: '30 days',
    trend: 'up' as const,
    trendValue: '+15.2%',
    icon: 'trending-up',
  },
  {
    label: 'Win Rate',
    value: '68%',
    subValue: '96 wins / 46 losses',
    trend: 'up' as const,
    trendValue: '+4%',
    icon: 'target',
  },
  {
    label: 'Avg R:R',
    value: '1.8:1',
    subValue: 'Risk/Reward',
    trend: 'neutral' as const,
    icon: 'scale',
  },
  {
    label: 'Trades',
    value: '142',
    subValue: '4.7 per day',
    trend: 'up' as const,
    trendValue: '+12',
    icon: 'activity',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get emoji for calendar day status
 */
export function getCalendarEmoji(status: string | null): string {
  switch (status) {
    case 'complete':
      return '🟢'; // All 3 rings closed
    case 'partial':
      return '🟡'; // 1-2 rings closed
    case 'none':
      return '⚫'; // No data logged
    case 'today':
      return '🔵'; // Today (in progress)
    case 'future':
      return '⚪'; // Future day
    default:
      return '';
  }
}

/**
 * Get color class for calendar day status
 */
export function getCalendarColor(status: string | null): string {
  switch (status) {
    case 'complete':
      return 'text-green-500';
    case 'partial':
      return 'text-yellow-500';
    case 'none':
      return 'text-muted-foreground/30';
    case 'today':
      return 'text-blue-500';
    case 'future':
      return 'text-muted-foreground/10';
    default:
      return 'text-muted-foreground';
  }
}

/**
 * Format currency for display
 */
export function formatDemoCurrency(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format percentage for display
 */
export function formatDemoPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

