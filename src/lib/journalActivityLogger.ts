/**
 * Journal-Wide Activity Logger
 * 
 * Apple-style: Celebrate meaningful achievements across all journal systems
 * 
 * Automatically logs milestones for:
 * - Journal entry streaks (flame system)
 * - XP level ups
 * - Trade milestones
 * - P&L achievements
 * - Weekly reviews
 * - Rich note collections
 * - Quest completions
 * - Prestige
 */

import { logTradingHealthActivity } from '@/lib/activityLogger';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { localStorage as storage, STORAGE_KEYS } from '@/lib/localStorageUtils';
import type { ActivityPriority } from '@/types';

interface JournalSnapshot {
  timestamp: string;
  userId: string;
  data: {
    journalStreak: number;
    xpLevel: number;
    totalTrades: number;
    lifetimeXp: number;
    richNoteCount: number;
    weeklyReviewsCompleted: number;
  };
}

const JOURNAL_SNAPSHOT_KEY = 'journal-activity-snapshot';

const getLastJournalSnapshot = (userId: string): JournalSnapshot | null => {
  const snapshot = storage.getItem<JournalSnapshot | null>(JOURNAL_SNAPSHOT_KEY, null);
  if (!snapshot || snapshot.userId !== userId) return null;
  return snapshot;
};

const storeJournalSnapshot = (data: JournalSnapshot['data'], userId: string) => {
  const snapshot: JournalSnapshot = {
    timestamp: new Date().toISOString(),
    userId,
    data,
  };
  storage.setItem(JOURNAL_SNAPSHOT_KEY, snapshot);
};

/**
 * Log Journal Entry Streak Milestones (Flame System)
 * Mirrors the calendar flame colors: 7d, 14d, 30d, 60d
 */
export const logJournalStreakMilestone = (streakDays: number) => {
  let title = '';
  let description = '';
  let xpBonus = 0;
  let emoji = '🔥';

  if (streakDays === 7) {
    emoji = '🔥';
    title = '7-Day Journal Streak!';
    description = 'Week Warrior - Your flame burns bright orange!';
    xpBonus = 50;
  } else if (streakDays === 14) {
    emoji = '🔥🔥';
    title = '14-Day Journal Streak!';
    description = 'Fortnight Fire - Your flame glows red-hot!';
    xpBonus = 100;
  } else if (streakDays === 30) {
    emoji = '✨';
    title = '30-Day Journal Streak!';
    description = 'LEGENDARY - Your flame shines golden!';
    xpBonus = 200;
  } else if (streakDays === 60) {
    emoji = '💎';
    title = '60-Day Journal Streak!';
    description = 'ULTRA LEGENDARY - Blue flame achieved! Top 1% of traders.';
    xpBonus = 500;
  } else if (streakDays === 100) {
    emoji = '👑';
    title = '100-Day Journal Streak!';
    description = 'IMMORTAL - This level of discipline is unmatched.';
    xpBonus = 1000;
  } else {
    return; // Only log major milestones
  }

  useActivityLogStore.getState().addActivity({
    type: 'milestone',
    title: `${emoji} ${title}`,
    description,
    priority: 'high',
    xpEarned: xpBonus,
    metadata: {
      streakDays,
      isNewMilestone: true,
      deepLink: '/journal',
    },
  });
};

/**
 * Log XP Level Up
 */
export const logLevelUp = (newLevel: number, totalXp: number) => {
  let emoji = '⚡';
  let priority: ActivityPriority = 'high';
  let description = `Reached level ${newLevel}! Total XP: ${totalXp.toLocaleString()}`;

  // Special milestones
  if (newLevel === 5) {
    emoji = '🌟';
    description = 'Level 5! You\'re building momentum.';
  } else if (newLevel === 10) {
    emoji = '💪';
    description = 'Level 10! Double digits - you\'re committed.';
  } else if (newLevel === 15) {
    emoji = '🔥';
    description = 'Level 15! Halfway to mastery.';
  } else if (newLevel === 20) {
    emoji = '⚡';
    description = 'Level 20! Elite trader territory.';
  } else if (newLevel === 25) {
    emoji = '💎';
    description = 'Level 25! Almost legendary status.';
  } else if (newLevel === 30) {
    emoji = '👑';
    priority = 'high';
    description = 'Level 30 - MAX LEVEL! Time to prestige?';
  }

  useActivityLogStore.getState().addActivity({
    type: 'xp',
    title: `${emoji} Level ${newLevel} Reached!`,
    description,
    priority,
    metadata: {
      deepLink: '/dashboard',
    },
  });
};

/**
 * Log Prestige Achievement
 */
export const logPrestige = (prestigeLevel: number) => {
  useActivityLogStore.getState().addActivity({
    type: 'milestone',
    title: `👑 Prestige ${prestigeLevel}!`,
    description: `You've reached level 30 and prestiged! Starting fresh with prestige badge ${prestigeLevel}.`,
    priority: 'high',
    xpEarned: 1000,
    metadata: {
      isNewMilestone: true,
      deepLink: '/dashboard',
    },
  });
};

/**
 * Log Trade Count Milestones
 */
export const logTradeMilestone = (totalTrades: number) => {
  const milestones = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
  
  if (!milestones.includes(totalTrades)) return;

  let description = '';
  let xpBonus = 0;

  if (totalTrades === 50) {
    description = 'First 50 trades! You\'re learning the process.';
    xpBonus = 50;
  } else if (totalTrades === 100) {
    description = '100 trades milestone! Your data is becoming meaningful.';
    xpBonus = 100;
  } else if (totalTrades === 250) {
    description = '250 trades! You have a solid sample size.';
    xpBonus = 200;
  } else if (totalTrades === 500) {
    description = '500 trades! Your edge is statistically significant.';
    xpBonus = 500;
  } else if (totalTrades === 1000) {
    description = '1,000 trades! Professional-level experience.';
    xpBonus = 1000;
  } else if (totalTrades === 2500) {
    description = '2,500 trades! Veteran status achieved.';
    xpBonus = 2500;
  } else if (totalTrades === 5000) {
    description = '5,000 trades! Elite execution.';
    xpBonus = 5000;
  } else if (totalTrades === 10000) {
    description = '10,000 trades! Trading mastery.';
    xpBonus = 10000;
  }

  useActivityLogStore.getState().addActivity({
    type: 'milestone',
    title: `🎯 ${totalTrades.toLocaleString()} Trades!`,
    description,
    priority: totalTrades >= 1000 ? 'high' : 'medium',
    xpEarned: xpBonus,
    metadata: {
      isNewMilestone: true,
      deepLink: '/journal',
    },
  });
};

/**
 * Log Weekly Review Completion
 */
export const logWeeklyReviewCompleted = () => {
  useActivityLogStore.getState().addActivity({
    type: 'weekly_review',
    title: '📊 Weekly Review Completed',
    description: 'You analyzed your week and extracted key learnings.',
    priority: 'medium',
    xpEarned: 150, // XpRewards.WEEKLY_REVIEW
    metadata: {
      deepLink: '/journal',
    },
  });
};

/**
 * Log Rich Note Milestones
 */
export const logRichNoteMilestone = (totalNotes: number) => {
  const milestones = [10, 25, 50, 100, 250, 500];
  
  if (!milestones.includes(totalNotes)) return;

  let description = '';
  let xpBonus = totalNotes * 2;

  if (totalNotes === 10) {
    description = 'Building your trading knowledge base!';
  } else if (totalNotes === 25) {
    description = 'Your playbook is taking shape.';
  } else if (totalNotes === 50) {
    description = 'Comprehensive trading documentation.';
  } else if (totalNotes === 100) {
    description = 'Professional-level research and notes.';
  } else if (totalNotes === 250) {
    description = 'Trading encyclopedia! Exceptional documentation.';
  } else if (totalNotes === 500) {
    description = 'Legendary knowledge base. You\'re building a trading library.';
  }

  useActivityLogStore.getState().addActivity({
    type: 'rich_note',
    title: `📚 ${totalNotes} Notes Created!`,
    description,
    priority: 'medium',
    xpEarned: xpBonus,
    metadata: {
      isNewMilestone: true,
      deepLink: '/notes',
    },
  });
};

/**
 * Detect and log journal-wide milestones
 */
export const detectJournalMilestones = (params: {
  userId: string;
  journalStreak: number;
  xpLevel: number;
  totalTrades: number;
  lifetimeXp: number;
  richNoteCount: number;
  weeklyReviewsCompleted?: number;
}) => {
  const lastSnapshot = getLastJournalSnapshot(params.userId);

  // First time - just store snapshot
  if (!lastSnapshot) {
    storeJournalSnapshot({
      journalStreak: params.journalStreak,
      xpLevel: params.xpLevel,
      totalTrades: params.totalTrades,
      lifetimeXp: params.lifetimeXp,
      richNoteCount: params.richNoteCount,
      weeklyReviewsCompleted: params.weeklyReviewsCompleted || 0,
    }, params.userId);
    return;
  }

  const prev = lastSnapshot.data;

  // Journal Streak Milestones
  if (params.journalStreak > prev.journalStreak) {
    const milestones = [7, 14, 30, 60, 100];
    const crossedMilestone = milestones.find(
      m => prev.journalStreak < m && params.journalStreak >= m
    );
    if (crossedMilestone) {
      logJournalStreakMilestone(crossedMilestone);
    }
  }

  // Level Up
  if (params.xpLevel > prev.xpLevel) {
    for (let level = prev.xpLevel + 1; level <= params.xpLevel; level++) {
      logLevelUp(level, params.lifetimeXp);
    }
  }

  // Trade Count Milestones
  if (params.totalTrades > prev.totalTrades) {
    const milestones = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
    const crossedMilestone = milestones.find(
      m => prev.totalTrades < m && params.totalTrades >= m
    );
    if (crossedMilestone) {
      logTradeMilestone(crossedMilestone);
    }
  }

  // Rich Note Milestones
  if (params.richNoteCount > prev.richNoteCount) {
    const milestones = [10, 25, 50, 100, 250, 500];
    const crossedMilestone = milestones.find(
      m => prev.richNoteCount < m && params.richNoteCount >= m
    );
    if (crossedMilestone) {
      logRichNoteMilestone(crossedMilestone);
    }
  }

  // Store updated snapshot
  storeJournalSnapshot({
    journalStreak: params.journalStreak,
    xpLevel: params.xpLevel,
    totalTrades: params.totalTrades,
    lifetimeXp: params.lifetimeXp,
    richNoteCount: params.richNoteCount,
    weeklyReviewsCompleted: params.weeklyReviewsCompleted || 0,
  }, params.userId);
};
