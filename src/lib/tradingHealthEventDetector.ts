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
import { calculateStatisticalConfidence, MIN_TRADES_FOR } from './tradingHealth/statisticalConfidence';

interface StoredHealthSnapshot {
  timestamp: string;
  metrics: {
    edge: { 
      value: number; 
      expectancy: number;
      wins: number;
      losses: number;
    };
    consistency: { 
      value: number; 
      currentStreak: number;
    };
    riskControl: { 
      value: number; 
      currentDrawdown: number;
    };
  };
  userId: string;
}

const HEALTH_SNAPSHOT_KEY = 'trading-health-snapshot';
const LOGGED_EVENTS_KEY = 'trading-health-logged-events';

/**
 * Get the last stored health snapshot
 */
const getLastSnapshot = (userId: string): StoredHealthSnapshot | null => {
  const snapshot = storage.getItem<StoredHealthSnapshot | null>(HEALTH_SNAPSHOT_KEY, null);
  if (!snapshot || snapshot.userId !== userId) return null;
  return snapshot;
};

/**
 * Check if an event has already been logged (deduplication)
 */
const hasEventBeenLogged = (eventHash: string, userId: string): boolean => {
  const loggedEvents = storage.getItem<{[key: string]: string[]}>( LOGGED_EVENTS_KEY, {});
  const userEvents = loggedEvents[userId] || [];
  return userEvents.includes(eventHash);
};

/**
 * Mark an event as logged
 */
const markEventAsLogged = (eventHash: string, userId: string) => {
  const loggedEvents = storage.getItem<{[key: string]: string[]}>( LOGGED_EVENTS_KEY, {});
  const userEvents = loggedEvents[userId] || [];
  
  // Keep only last 100 events per user to avoid bloat
  const updatedEvents = [...userEvents, eventHash].slice(-100);
  loggedEvents[userId] = updatedEvents;
  
  storage.setItem(LOGGED_EVENTS_KEY, loggedEvents);
};

/**
 * Generate a unique hash for an event
 */
const generateEventHash = (type: string, data: any): string => {
  return `${type}-${JSON.stringify(data)}`;
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
        expectancy: metrics.edge.expectancy,
        wins: metrics.edge.wins,
        losses: metrics.edge.losses,
      },
      consistency: { 
        value: metrics.consistency.value, 
        currentStreak: metrics.consistency.currentStreak 
      },
      riskControl: { 
        value: metrics.riskControl.value, 
        currentDrawdown: metrics.riskControl.currentDrawdown 
      },
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
    const eventHash = generateEventHash('edge-change', {
      old: prev.edge.value,
      new: curr.edge.value,
    });
    
    if (!hasEventBeenLogged(eventHash, userId)) {
      console.log('[Trading Health Events] Edge ring changed:', {
        oldValue: prev.edge.value,
        newValue: curr.edge.value,
        change: curr.edge.value - prev.edge.value,
        oldExpectancy: prev.edge.expectancy,
        newExpectancy: curr.edge.expectancy,
        oldWins: prev.edge.wins,
        newWins: curr.edge.wins,
        oldLosses: prev.edge.losses,
        newLosses: curr.edge.losses,
      });
      
      logTradingHealthActivity.ringChange({
        ringType: 'edge',
        oldValue: prev.edge.value,
        newValue: curr.edge.value,
        expectancy: curr.edge.expectancy,
      });
      
      markEventAsLogged(eventHash, userId);
    }
  }

  // Consistency Ring
  if (Math.abs(curr.consistency.value - prev.consistency.value) >= 5) {
    const eventHash = generateEventHash('consistency-change', {
      old: prev.consistency.value,
      new: curr.consistency.value,
    });
    
    if (!hasEventBeenLogged(eventHash, userId)) {
      logTradingHealthActivity.ringChange({
        ringType: 'consistency',
        oldValue: prev.consistency.value,
        newValue: curr.consistency.value,
      });
      
      markEventAsLogged(eventHash, userId);
    }
  }

  // Risk Control Ring
  if (Math.abs(curr.riskControl.value - prev.riskControl.value) >= 5) {
    const eventHash = generateEventHash('risk-change', {
      old: prev.riskControl.value,
      new: curr.riskControl.value,
    });
    
    if (!hasEventBeenLogged(eventHash, userId)) {
      logTradingHealthActivity.ringChange({
        ringType: 'riskControl',
        oldValue: prev.riskControl.value,
        newValue: curr.riskControl.value,
      });
      
      markEventAsLogged(eventHash, userId);
    }
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
  // Calculate total trades in current window (approximate based on wins + losses)
  const totalTrades = curr.edge.wins + curr.edge.losses;
  const confidence = calculateStatisticalConfidence(totalTrades);
  
  // Only award achievements if user has minimum trades (Apple: honest, not misleading)
  if (confidence.canShowAchievements) {
    // Edge exceeds goal (80)
    if (prev.edge.value < 80 && curr.edge.value >= 80) {
      logTradingHealthActivity.milestone({
        title: 'Edge Mastery Achieved',
        description: `Your edge score hit 80/80 with ${totalTrades} trades. You have a consistently profitable system!`,
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
        description: `Perfect Trading Health with ${totalTrades} trades. You're operating at peak performance.`,
        xpEarned: 500,
      });
    }
  } else {
    // Log progress instead of achievement
    if (prev.edge.value < 80 && curr.edge.value >= 80) {
      console.log(`[Trading Health] Edge hit 80, but need ${MIN_TRADES_FOR.ACHIEVEMENTS - totalTrades} more trades for statistical significance (${totalTrades}/${MIN_TRADES_FOR.ACHIEVEMENTS})`);
    }
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
