/**
 * Trading Health Activity Logger
 * 
 * CLEANED UP: Removed auto-generated AI insights that were inaccurate/noisy.
 * Now only logs genuine user milestones and achievements.
 * 
 * Removed: ring_change, health_warning, health_suggestion, daily_summary
 * Kept: streak milestones, achievements
 */

import { useActivityLogStore } from '@/store/useActivityLogStore';
import type { ActivityPriority } from '@/types';

export const logTradingHealthActivity = {
  /**
   * Log ring score changes - DISABLED (too noisy, not accurate)
   * Kept for backwards compatibility but no-ops
   */
  ringChange: (_params: {
    ringType: 'edge' | 'consistency' | 'riskControl';
    oldValue: number;
    newValue: number;
    expectancy?: number;
  }) => {
    // Disabled - ring changes are auto-generated and cluttered the activity log
    // Users can see their current scores on the Health dashboard
    return;
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
   * Log rule violations - DISABLED (noisy auto-generated content)
   */
  ruleViolation: (_params: {
    ruleId: string;
    ruleName: string;
    details: string;
  }) => {
    // Disabled - rule violations are tracked elsewhere, don't need activity log spam
    return;
  },

  /**
   * Log health warnings - DISABLED (AI-generated, often inaccurate)
   */
  healthWarning: (_params: {
    title: string;
    description: string;
    ringType?: 'edge' | 'consistency' | 'riskControl';
  }) => {
    // Disabled - these auto-generated warnings cluttered the activity log
    // Critical info is shown directly on the Health dashboard
    return;
  },

  /**
   * Log "For You" suggestions - DISABLED (AI-generated, often not helpful)
   */
  healthSuggestion: (_params: {
    suggestionType: string;
    title: string;
    description: string;
  }) => {
    // Disabled - AI suggestions were inaccurate and unhelpful
    return;
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
   * Log daily summary - DISABLED (auto-generated, redundant with dashboard)
   */
  dailySummary: (_params: {
    edge: { value: number; trend: 'improving' | 'stable' | 'declining' };
    consistency: { value: number; trend: 'improving' | 'stable' | 'declining' };
    riskControl: { value: number; trend: 'improving' | 'stable' | 'declining' };
  }) => {
    // Disabled - daily summaries are redundant with the Health dashboard
    return;
  },
};
