import { XpRewards } from './XpService';

/**
 * XP Display Utilities
 * 
 * Centralized functions for displaying XP values in the UI.
 * This ensures all displayed XP values match what's actually awarded.
 * 
 * IMPORTANT: Always use these utilities instead of hardcoding XP values!
 * When XP rewards are adjusted in XpService, UI updates automatically.
 */

/**
 * Format XP for display with sign (e.g., "+75 XP")
 */
export function formatXpDisplay(xp: number): string {
  return `+${xp} XP`;
}

/**
 * Format XP range for display (e.g., "20-170 XP")
 */
export function formatXpRange(min: number, max: number): string {
  return `${min}-${max} XP`;
}

/**
 * Get XP display for habit completion
 * Includes base XP + potential streak bonus
 */
export function getHabitXpDisplay(streakDays?: number): {
  base: number;
  total: number;
  display: string;
  rangeDisplay: string;
} {
  const base = XpRewards.HABIT_COMPLETE;
  const streakBonus = streakDays 
    ? XpRewards.HABIT_STREAK_BONUS * Math.min(streakDays, 30)
    : 0;
  const total = base + streakBonus;
  const maxBonus = XpRewards.HABIT_STREAK_BONUS * 30;
  
  return {
    base,
    total,
    display: formatXpDisplay(total),
    rangeDisplay: formatXpRange(base, base + maxBonus)
  };
}

/**
 * Get XP display for reflection completion
 * Includes base XP + quality bonus
 */
export function getReflectionXpDisplay(completionScore?: number): {
  base: number;
  bonus: number;
  total: number;
  display: string;
} {
  const base = XpRewards.DAILY_REFLECTION;
  const bonus = completionScore 
    ? (completionScore >= 90 ? 25 : completionScore >= 80 ? 15 : 10)
    : 10; // Default to minimum if no score
  const total = base + bonus;
  
  return {
    base,
    bonus,
    total,
    display: formatXpDisplay(total)
  };
}

/**
 * Get XP display for quest rewards
 * Quests can have custom XP, but this provides the default
 */
export function getQuestXpDisplay(customXp?: number): {
  xp: number;
  display: string;
} {
  const xp = customXp ?? XpRewards.QUEST_COMPLETE;
  return {
    xp,
    display: formatXpDisplay(xp)
  };
}

/**
 * Get XP display for trade by result
 */
export function getTradeXpDisplay(result: 'win' | 'loss' | 'breakeven' | 'big_win'): {
  xp: number;
  display: string;
} {
  let xp: number;
  switch (result) {
    case 'big_win':
      xp = XpRewards.BIG_WIN;
      break;
    case 'win':
      xp = XpRewards.TRADE_WIN;
      break;
    case 'loss':
      xp = XpRewards.TRADE_LOSS;
      break;
    case 'breakeven':
      xp = XpRewards.TRADE_SCRATCH;
      break;
  }
  
  return {
    xp,
    display: formatXpDisplay(xp)
  };
}

/**
 * Get XP display for weekly review
 */
export function getWeeklyReviewXpDisplay(): {
  xp: number;
  display: string;
} {
  return {
    xp: XpRewards.WEEKLY_REVIEW,
    display: formatXpDisplay(XpRewards.WEEKLY_REVIEW)
  };
}

/**
 * Get XP display for wellness activities
 */
export function getWellnessXpDisplay(): {
  xp: number;
  display: string;
} {
  return {
    xp: XpRewards.WELLNESS_ACTIVITY,
    display: formatXpDisplay(XpRewards.WELLNESS_ACTIVITY)
  };
}

/**
 * Get XP display for todo completion
 */
export function getTodoXpDisplay(): {
  xp: number;
  display: string;
} {
  return {
    xp: XpRewards.TODO_COMPLETE,
    display: formatXpDisplay(XpRewards.TODO_COMPLETE)
  };
}

/**
 * Get XP display for rich notes
 */
export function getRichNoteXpDisplay(action: 'create' | 'update' | 'favorite' | 'link' | 'organize'): {
  xp: number;
  display: string;
} {
  let xp: number;
  switch (action) {
    case 'create':
      xp = XpRewards.RICH_NOTE_CREATE;
      break;
    case 'update':
      xp = XpRewards.RICH_NOTE_UPDATE;
      break;
    case 'favorite':
      xp = XpRewards.RICH_NOTE_FAVORITE;
      break;
    case 'link':
      xp = XpRewards.RICH_NOTE_LINK;
      break;
    case 'organize':
      xp = XpRewards.RICH_NOTE_ORGANIZE;
      break;
  }
  
  return {
    xp,
    display: formatXpDisplay(xp)
  };
}

/**
 * Get XP display for journal entry
 */
export function getJournalEntryXpDisplay(): {
  xp: number;
  display: string;
} {
  return {
    xp: XpRewards.JOURNAL_ENTRY,
    display: formatXpDisplay(XpRewards.JOURNAL_ENTRY)
  };
}

/**
 * Get all XP rewards for documentation/display
 * Useful for XP system modals and help screens
 */
export function getAllXpRewards() {
  return {
    // Trading
    tradeWin: XpRewards.TRADE_WIN,
    tradeLoss: XpRewards.TRADE_LOSS,
    tradeScratch: XpRewards.TRADE_SCRATCH,
    bigWin: XpRewards.BIG_WIN,
    
    // Reflection & Growth
    dailyReflection: XpRewards.DAILY_REFLECTION,
    weeklyReview: XpRewards.WEEKLY_REVIEW,
    lessonLearned: XpRewards.LESSON_LEARNED,
    
    // Habits & Consistency
    habitComplete: XpRewards.HABIT_COMPLETE,
    habitStreakBonus: XpRewards.HABIT_STREAK_BONUS,
    perfectHabitDay: XpRewards.PERFECT_HABIT_DAY,
    
    // Quests & Milestones
    questComplete: XpRewards.QUEST_COMPLETE,
    milestone: XpRewards.MILESTONE_ACHIEVEMENT,
    
    // Content & Learning
    journalEntry: XpRewards.JOURNAL_ENTRY,
    detailedNote: XpRewards.DETAILED_NOTE,
    wellnessActivity: XpRewards.WELLNESS_ACTIVITY,
    
    // Productivity
    todoComplete: XpRewards.TODO_COMPLETE,
    
    // Rich Notes
    richNoteCreate: XpRewards.RICH_NOTE_CREATE,
    richNoteUpdate: XpRewards.RICH_NOTE_UPDATE,
    richNoteFavorite: XpRewards.RICH_NOTE_FAVORITE,
    richNoteLink: XpRewards.RICH_NOTE_LINK,
    richNoteOrganize: XpRewards.RICH_NOTE_ORGANIZE,
    
    // Streaks
    tradingStreak: XpRewards.TRADING_STREAK,
    reflectionStreak: XpRewards.REFLECTION_STREAK,
    weeklyConsistency: XpRewards.WEEKLY_CONSISTENCY,
  };
}

