/**
 * Trading Health Activity Logger
 * 
 * Apple-style: Intelligent, contextual, actionable
 * 
 * Automatically logs meaningful Trading Health events to the Activity Log
 * with proper priority, metadata, and deep links.
 */

import { useActivityLogStore } from '@/store/useActivityLogStore';
import type { ActivityPriority } from '@/types';

export const logTradingHealthActivity = {
  /**
   * Log ring score changes (Edge, Consistency, Risk Control)
   */
  ringChange: (params: {
    ringType: 'edge' | 'consistency' | 'riskControl';
    oldValue: number;
    newValue: number;
    expectancy?: number;
  }) => {
    const { ringType, oldValue, newValue, expectancy } = params;
    const change = newValue - oldValue;
    const trend = change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable';
    
    // Determine priority based on severity
    let priority: ActivityPriority = 'medium';
    if (Math.abs(change) >= 15) priority = 'high';
    if (trend === 'declining' && newValue < 50) priority = 'critical';

    const ringEmoji = {
      edge: '💰',
      consistency: '🎯',
      riskControl: '⚠️',
    };

    const ringName = {
      edge: 'Edge',
      consistency: 'Consistency',
      riskControl: 'Risk Control',
    };

    let description = `${oldValue} → ${newValue} (${change > 0 ? '+' : ''}${change})`;
    if (ringType === 'edge' && expectancy !== undefined) {
      description += `. Your expectancy ${expectancy > 0 ? 'improved to' : 'dropped to'} $${expectancy.toFixed(2)} per trade`;
    }

    useActivityLogStore.getState().addActivity({
      type: 'ring_change',
      title: `${ringEmoji[ringType]} ${ringName[ringType]} ${trend === 'improving' ? 'Improved' : trend === 'declining' ? 'Declining' : 'Updated'}`,
      description,
      priority,
      metadata: {
        ringType,
        oldValue,
        newValue,
        trend,
        deepLink: '/health',
      },
    });
  },

  /**
   * Log streak events (started, continued, milestones)
   */
  streakEvent: (params: {
    streakDays: number;
    isNewMilestone: boolean;
    nextMilestone?: number;
  }) => {
    const { streakDays, isNewMilestone, nextMilestone } = params;

    let title = '';
    let description = '';
    let xpEarned = 0;

    if (streakDays === 3) {
      title = '🔥 3-Day Streak Started!';
      description = "You're following 80%+ of your rules. Next milestone: 7 days 🏆";
      xpEarned = 30;
    } else if (streakDays === 7) {
      title = '🔥 7-Day Streak!';
      description = 'One week of discipline. Keep it going!';
      xpEarned = 70;
    } else if (streakDays === 14) {
      title = '🔥 14-Day Streak!';
      description = 'Two weeks strong. This is becoming a habit.';
      xpEarned = 140;
    } else if (streakDays === 30) {
      title = '🔥 30-Day Streak!';
      description = 'One month of consistent excellence. Exceptional!';
      xpEarned = 300;
    } else if (streakDays === 60) {
      title = '🔥 60-Day Streak!';
      description = 'Two months of discipline. You\'re in the top 1%.';
      xpEarned = 600;
    } else if (streakDays === 100) {
      title = '🔥 100-Day Streak! 🏆';
      description = 'Legendary. Few traders ever reach this level.';
      xpEarned = 1000;
    } else {
      title = `🔥 ${streakDays}-Day Streak!`;
      description = nextMilestone ? `Next milestone: ${nextMilestone} days` : 'Keep the momentum going!';
      xpEarned = streakDays * 10;
    }

    useActivityLogStore.getState().addActivity({
      type: 'streak_event',
      title,
      description,
      priority: 'high',
      xpEarned,
      metadata: {
        streakDays,
        isNewMilestone,
        deepLink: '/health',
      },
    });
  },

  /**
   * Log rule violations
   */
  ruleViolation: (params: {
    ruleId: string;
    ruleName: string;
    details: string;
  }) => {
    const { ruleId, ruleName, details } = params;

    useActivityLogStore.getState().addActivity({
      type: 'rule_violation',
      title: `⚠️ Broke ${ruleName}`,
      description: details,
      priority: 'medium',
      metadata: {
        ruleId,
        ruleName,
        deepLink: '/health',
      },
    });
  },

  /**
   * Log health warnings (critical issues)
   */
  healthWarning: (params: {
    title: string;
    description: string;
    ringType?: 'edge' | 'consistency' | 'riskControl';
  }) => {
    const { title, description, ringType } = params;

    useActivityLogStore.getState().addActivity({
      type: 'health_warning',
      title: `🚨 ${title}`,
      description,
      priority: 'critical',
      metadata: {
        ringType,
        deepLink: '/health',
      },
    });
  },

  /**
   * Log "For You" suggestions
   */
  healthSuggestion: (params: {
    suggestionType: string;
    title: string;
    description: string;
  }) => {
    const { suggestionType, title, description } = params;

    useActivityLogStore.getState().addActivity({
      type: 'health_suggestion',
      title: `💡 ${title}`,
      description,
      priority: 'high',
      metadata: {
        suggestionType,
        actionable: true,
        deepLink: '/health',
      },
    });
  },

  /**
   * Log milestones (achievements)
   */
  milestone: (params: {
    title: string;
    description: string;
    xpEarned?: number;
    streakDays?: number;
  }) => {
    const { title, description, xpEarned, streakDays } = params;

    useActivityLogStore.getState().addActivity({
      type: 'milestone',
      title: `🏆 ${title}`,
      description,
      priority: 'high',
      xpEarned,
      metadata: {
        streakDays,
        isNewMilestone: true,
        deepLink: '/health',
      },
    });
  },

  /**
   * Log daily summary (morning recap)
   */
  dailySummary: (params: {
    edge: { value: number; trend: 'improving' | 'stable' | 'declining' };
    consistency: { value: number; trend: 'improving' | 'stable' | 'declining' };
    riskControl: { value: number; trend: 'improving' | 'stable' | 'declining' };
  }) => {
    const { edge, consistency, riskControl } = params;

    const trendIcon = (trend: string) => {
      switch (trend) {
        case 'improving': return '↗';
        case 'declining': return '↘';
        default: return '→';
      }
    };

    const description = `Edge: ${edge.value}/80 (${trendIcon(edge.trend)}) • Consistency: ${consistency.value}/80 (${trendIcon(consistency.trend)}) • Risk: ${riskControl.value}/80 (${trendIcon(riskControl.trend)})`;

    useActivityLogStore.getState().addActivity({
      type: 'daily_summary',
      title: "📊 Yesterday's Trading Health",
      description,
      priority: 'high',
      metadata: {
        deepLink: '/health',
      },
    });
  },
};
