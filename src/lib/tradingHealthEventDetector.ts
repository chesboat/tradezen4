/**
 * Trading Health Event Detector
 * 
 * Apple-style: Intelligent event detection, not noisy notifications
 * 
 * Compares current vs. previous Trading Health metrics and automatically
 * logs meaningful changes to the Activity Log.
 */

import type { TradingHealthMetrics } from '@/lib/tradingHealth/types';
import { logTradingHealthActivity } from '@/lib/activityLogger';
import { localStorage as storage, STORAGE_KEYS } from '@/lib/localStorageUtils';

interface StoredHealthSnapshot {
  timestamp: string;
  metrics: {
    edge: { value: number; expectancy: number };
    consistency: { value: number; currentStreak: number };
    riskControl: { value: number; currentDrawdown: number };
    overall: number;
  };
  userId: string;
}

const HEALTH_SNAPSHOT_KEY = 'trading-health-snapshot';

/**
 * Get the last stored health snapshot
 */
const getLastSnapshot = (userId: string): StoredHealthSnapshot | null => {
  const snapshot = storage.getItem<StoredHealthSnapshot>(HEALTH_SNAPSHOT_KEY, null);
  if (!snapshot || snapshot.userId !== userId) return null;
  return snapshot;
};

/**
 * Store current health snapshot
 */
const storeSnapshot = (metrics: TradingHealthMetrics, userId: string) => {
  const snapshot: StoredHealthSnapshot = {
    timestamp: new Date().toISOString(),
    metrics: {
      edge: { 
        value: metrics.edge.value, 
        expectancy: metrics.edge.expectancy 
      },
      consistency: { 
        value: metrics.consistency.value, 
        currentStreak: metrics.consistency.currentStreak 
      },
      riskControl: { 
        value: metrics.riskControl.value, 
        currentDrawdown: metrics.riskControl.currentDrawdown 
      },
      overall: metrics.overall,
    },
    userId,
  };
  storage.setItem(HEALTH_SNAPSHOT_KEY, snapshot);
};

/**
 * Detect and log significant changes in Trading Health
 * 
 * Apple's philosophy: Only notify what matters, not every tiny change
 */
export const detectTradingHealthEvents = (
  currentMetrics: TradingHealthMetrics,
  userId: string
) => {
  const lastSnapshot = getLastSnapshot(userId);

  // First time or different user - store but don't log
  if (!lastSnapshot) {
    storeSnapshot(currentMetrics, userId);
    return;
  }

  const prev = lastSnapshot.metrics;
  const curr = {
    edge: currentMetrics.edge,
    consistency: currentMetrics.consistency,
    riskControl: currentMetrics.riskControl,
  };

  // 1. DETECT RING CHANGES (only if significant: 5+ points)
  // Edge Ring
  if (Math.abs(curr.edge.value - prev.edge.value) >= 5) {
    logTradingHealthActivity.ringChange({
      ringType: 'edge',
      oldValue: prev.edge.value,
      newValue: curr.edge.value,
      expectancy: curr.edge.expectancy,
    });
  }

  // Consistency Ring
  if (Math.abs(curr.consistency.value - prev.consistency.value) >= 5) {
    logTradingHealthActivity.ringChange({
      ringType: 'consistency',
      oldValue: prev.consistency.value,
      newValue: curr.consistency.value,
    });
  }

  // Risk Control Ring
  if (Math.abs(curr.riskControl.value - prev.riskControl.value) >= 5) {
    logTradingHealthActivity.ringChange({
      ringType: 'riskControl',
      oldValue: prev.riskControl.value,
      newValue: curr.riskControl.value,
    });
  }

  // 2. DETECT STREAK MILESTONES
  const streakMilestones = [3, 7, 14, 30, 60, 100];
  const prevStreak = prev.consistency.currentStreak;
  const currStreak = curr.consistency.currentStreak;

  if (currStreak > prevStreak) {
    // Check if we crossed a milestone
    const crossedMilestone = streakMilestones.find(
      m => prevStreak < m && currStreak >= m
    );

    if (crossedMilestone) {
      const nextMilestone = streakMilestones.find(m => m > crossedMilestone);
      logTradingHealthActivity.streakEvent({
        streakDays: crossedMilestone,
        isNewMilestone: true,
        nextMilestone,
      });

      // Also log as milestone for 7+ day streaks
      if (crossedMilestone >= 7) {
        logTradingHealthActivity.milestone({
          title: `${crossedMilestone}-Day Streak!`,
          description: `Your longest streak ${crossedMilestone === 7 ? 'yet' : 'continues'}. Keep it up!`,
          xpEarned: crossedMilestone * 10,
          streakDays: crossedMilestone,
        });
      }
    }
  }

  // 3. DETECT CRITICAL WARNINGS
  // Negative expectancy warning
  if (prev.edge.expectancy > 0 && curr.edge.expectancy <= 0) {
    logTradingHealthActivity.healthWarning({
      title: 'Expectancy Turned Negative',
      description: `Your edge dropped to $${curr.edge.expectancy.toFixed(2)} per trade. Time to analyze what changed.`,
      ringType: 'edge',
    });

    logTradingHealthActivity.healthSuggestion({
      suggestionType: 'stop_trading',
      title: 'Stop Trading & Analyze',
      description: 'Your expectancy went negative. Review your last 10 trades to identify what went wrong.',
    });
  }

  // High drawdown warning (20%+)
  if (prev.riskControl.currentDrawdown < 20 && curr.riskControl.currentDrawdown >= 20) {
    logTradingHealthActivity.healthWarning({
      title: 'High Drawdown Alert',
      description: `Current drawdown: ${curr.riskControl.currentDrawdown.toFixed(1)}%. Consider reducing position size.`,
      ringType: 'riskControl',
    });

    logTradingHealthActivity.healthSuggestion({
      suggestionType: 'reduce_risk',
      title: 'Reduce Position Size',
      description: 'Cut your position size by 50% until you recover 50% of the drawdown.',
    });
  }

  // Critical drawdown warning (30%+)
  if (prev.riskControl.currentDrawdown < 30 && curr.riskControl.currentDrawdown >= 30) {
    logTradingHealthActivity.healthWarning({
      title: '🚨 Critical Drawdown',
      description: `Drawdown: ${curr.riskControl.currentDrawdown.toFixed(1)}%. Stop trading immediately and reassess your strategy.`,
      ringType: 'riskControl',
    });
  }

  // 4. DETECT POSITIVE BREAKTHROUGHS
  // Edge exceeds goal (80)
  if (prev.edge.value < 80 && curr.edge.value >= 80) {
    logTradingHealthActivity.milestone({
      title: 'Edge Mastery Achieved',
      description: 'Your edge score hit 80/80. You have a consistently profitable system!',
      xpEarned: 200,
    });
  }

  // All rings closed (all at goal)
  if (
    curr.edge.value >= 80 &&
    curr.consistency.value >= 80 &&
    curr.riskControl.value >= 80 &&
    (prev.edge.value < 80 || prev.consistency.value < 80 || prev.riskControl.value < 80)
  ) {
    logTradingHealthActivity.milestone({
      title: 'All Rings Closed! 🎯',
      description: 'Perfect Trading Health. You\'re operating at peak performance.',
      xpEarned: 500,
    });
  }

  // Store updated snapshot
  storeSnapshot(currentMetrics, userId);
};

/**
 * Generate daily summary (call this once per day, ideally in the morning)
 */
export const generateDailySummary = (
  metrics: TradingHealthMetrics,
  userId: string
) => {
  const lastSnapshot = getLastSnapshot(userId);
  
  if (!lastSnapshot) return;

  const prev = lastSnapshot.metrics;
  
  const getTrend = (curr: number, prev: number): 'improving' | 'stable' | 'declining' => {
    const diff = curr - prev;
    if (Math.abs(diff) < 3) return 'stable';
    return diff > 0 ? 'improving' : 'declining';
  };

  logTradingHealthActivity.dailySummary({
    edge: {
      value: metrics.edge.value,
      trend: getTrend(metrics.edge.value, prev.edge.value),
    },
    consistency: {
      value: metrics.consistency.value,
      trend: getTrend(metrics.consistency.value, prev.consistency.value),
    },
    riskControl: {
      value: metrics.riskControl.value,
      trend: getTrend(metrics.riskControl.value, prev.riskControl.value),
    },
  });
};

/**
 * Check if we should generate a daily summary
 * (Only once per day, ideally in the morning)
 */
export const checkDailySummarySchedule = (
  metrics: TradingHealthMetrics,
  userId: string
) => {
  const DAILY_SUMMARY_KEY = 'last-daily-summary';
  const lastSummary = storage.getItem<string>(DAILY_SUMMARY_KEY, '');
  const today = new Date().toDateString();

  if (lastSummary !== today) {
    // It's a new day, generate summary
    generateDailySummary(metrics, userId);
    storage.setItem(DAILY_SUMMARY_KEY, today);
  }
};
