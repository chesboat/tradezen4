import { useUserProfileStore } from '@/store/useUserProfileStore';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, onSnapshot, serverTimestamp, increment, getDoc } from 'firebase/firestore';

/**
 * XP Service - Facade for all XP operations
 * This provides a clean interface for the rest of the app to use
 */
export class XpService {
  /**
   * Add XP to the current user
   * This is the main method other parts of the app should use
   */
  static async addXp(delta: number, meta?: any): Promise<void> {
    const { profile } = useUserProfileStore.getState();
    if (!profile || !Number.isFinite(delta) || delta <= 0) return;
    const xpDocRef = doc(db, 'userProfiles', profile.id, 'xp', 'status');
    const now = new Date();

    // Ensure doc exists
    const snap = await getDoc(xpDocRef);
    if (!snap.exists()) {
      await setDoc(xpDocRef, {
        total: 0,
        seasonXp: 0,
        level: 1,
        prestige: 0,
        updatedAt: serverTimestamp(),
      });
    }

    // Atomic increments in Firestore
    await updateDoc(xpDocRef, {
      total: increment(delta),
      seasonXp: increment(delta),
      updatedAt: serverTimestamp(),
      lastMeta: meta || null,
    });
  }

  static subscribe(onChange: (xp: { total: number; seasonXp: number; level: number; prestige: number }) => void) {
    const { profile } = useUserProfileStore.getState();
    if (!profile) return () => {};
    const xpDocRef = doc(db, 'userProfiles', profile.id, 'xp', 'status');
    return onSnapshot(xpDocRef, (snap) => {
      const data = snap.data() as any;
      if (!data) return;
      onChange({
        total: Number(data.total || 0),
        seasonXp: Number(data.seasonXp || 0),
        level: Number(data.level || 1),
        prestige: Number(data.prestige || 0),
      });
    });
  }

  /**
   * Prestige the current user
   */
  static async prestige(): Promise<void> {
    const { prestige } = useUserProfileStore.getState();
    await prestige();
  }

  /**
   * Get current XP status
   */
  static getXpStatus() {
    const { profile } = useUserProfileStore.getState();
    
    if (!profile?.xp) {
      return {
        level: 1,
        prestige: 0,
        canPrestige: false,
        seasonXp: 0,
        totalXp: 0,
        progressPct: 0
      };
    }

    return {
      level: profile.xp.level,
      prestige: profile.xp.prestige,
      canPrestige: profile.xp.canPrestige,
      seasonXp: profile.xp.seasonXp,
      totalXp: profile.xp.total,
      progressPct: 0 // Will be calculated by math functions
    };
  }

  /**
   * Check if user just leveled up (for showing toast)
   */
  static checkForLevelUp(): { leveledUp: boolean; newLevel?: number } {
    const { profile } = useUserProfileStore.getState();
    
    if (!profile?.xp?.lastLevelUpAt) {
      return { leveledUp: false };
    }

    // Check if level up happened in the last 5 seconds
    const timeSinceLastLevelUp = Date.now() - profile.xp.lastLevelUpAt.getTime();
    const recentLevelUp = timeSinceLastLevelUp < 5000;

    return {
      leveledUp: recentLevelUp,
      newLevel: recentLevelUp ? profile.xp.level : undefined
    };
  }
}

// Convenience functions for common XP awards
export const XpRewards = {
  // Trading (Primary Activity)
  TRADE_WIN: 35,           // +10 - reward successful trades more
  TRADE_LOSS: 10,          // +5 - reward discipline even in losses  
  TRADE_SCRATCH: 15,       // NEW - breakeven trades show discipline
  BIG_WIN: 75,             // NEW - exceptional performance (>2R or >$500)
  
  // Reflection & Growth (High Value)
  DAILY_REFLECTION: 75,    // +25 - encourage daily reflection
  WEEKLY_REVIEW: 150,      // NEW - deeper analysis
  LESSON_LEARNED: 40,      // NEW - tagged insights
  
  // Habits & Consistency (Steady Progress)  
  HABIT_COMPLETE: 20,      // +5 - standardized and increased
  HABIT_STREAK_BONUS: 5,   // NEW - per consecutive day
  PERFECT_HABIT_DAY: 100,  // NEW - all habits completed
  
  // Quests & Milestones (Major Rewards)
  QUEST_COMPLETE: 150,     // +50 - bigger reward for completion
  MILESTONE_ACHIEVEMENT: 200, // NEW - major milestones
  
  // Content & Learning (Encourage Documentation)
  JOURNAL_ENTRY: 25,       // NEW - encourage journaling
  DETAILED_NOTE: 15,       // NEW - note-taking
  WELLNESS_ACTIVITY: 30,   // NEW - self-care
  
  // Productivity
  TODO_COMPLETE: 15,       // NEW - task completion
  
  // Streak Bonuses (Compound Growth)
  TRADING_STREAK: 15,      // +5 per consecutive trading day
  REFLECTION_STREAK: 10,   // per consecutive reflection day
  WEEKLY_CONSISTENCY: 200, // NEW - 5+ trading days in week
  
  // Legacy/Misc
  STREAK_BONUS: 10,        // Keep for backward compatibility
  FIRST_TRADE_DAY: 30
} as const;

// Helper to award XP for common activities
export const awardXp = {
  // Trading
  tradeWin: (pnl?: number) => XpService.addXp(XpRewards.TRADE_WIN, { source: 'trade', result: 'win', pnl }),
  tradeLoss: (pnl?: number) => XpService.addXp(XpRewards.TRADE_LOSS, { source: 'trade', result: 'loss', pnl }),
  tradeScratch: (pnl?: number) => XpService.addXp(XpRewards.TRADE_SCRATCH, { source: 'trade', result: 'scratch', pnl }),
  bigWin: (pnl: number) => XpService.addXp(XpRewards.BIG_WIN, { source: 'trade', result: 'big_win', pnl }),
  
  // Reflection & Growth
  dailyReflection: () => XpService.addXp(XpRewards.DAILY_REFLECTION, { source: 'reflection' }),
  weeklyReview: () => XpService.addXp(XpRewards.WEEKLY_REVIEW, { source: 'reflection', type: 'weekly' }),
  lessonLearned: (lesson: string) => XpService.addXp(XpRewards.LESSON_LEARNED, { source: 'reflection', lesson }),
  
  // Habits & Consistency
  habitComplete: (habitId: string, streakDays?: number) => {
    const baseXp = XpRewards.HABIT_COMPLETE;
    const streakBonus = streakDays ? XpRewards.HABIT_STREAK_BONUS * Math.min(streakDays, 30) : 0;
    return XpService.addXp(baseXp + streakBonus, { source: 'habit', habitId, streakDays });
  },
  perfectHabitDay: (habitCount: number) => XpService.addXp(XpRewards.PERFECT_HABIT_DAY, { source: 'habit', type: 'perfect_day', habitCount }),
  
  // Quests & Milestones
  questComplete: (questId: string) => XpService.addXp(XpRewards.QUEST_COMPLETE, { source: 'quest', questId }),
  milestone: (type: string, data?: any) => XpService.addXp(XpRewards.MILESTONE_ACHIEVEMENT, { source: 'milestone', type, data }),
  
  // Content & Learning
  journalEntry: (entryId: string) => XpService.addXp(XpRewards.JOURNAL_ENTRY, { source: 'journal', entryId }),
  detailedNote: (noteId: string) => XpService.addXp(XpRewards.DETAILED_NOTE, { source: 'note', noteId }),
  wellnessActivity: (type: string) => XpService.addXp(XpRewards.WELLNESS_ACTIVITY, { source: 'wellness', type }),
  
  // Productivity
  todoComplete: (taskId: string) => XpService.addXp(XpRewards.TODO_COMPLETE, { source: 'todo', taskId }),
  
  // Streaks
  tradingStreak: (days: number) => XpService.addXp(XpRewards.TRADING_STREAK * days, { source: 'streak', type: 'trading', days }),
  reflectionStreak: (days: number) => XpService.addXp(XpRewards.REFLECTION_STREAK * days, { source: 'streak', type: 'reflection', days }),
  weeklyConsistency: (tradingDays: number) => XpService.addXp(XpRewards.WEEKLY_CONSISTENCY, { source: 'streak', type: 'weekly_consistency', tradingDays }),
  
  // Legacy
  streakBonus: (days: number) => XpService.addXp(XpRewards.STREAK_BONUS * days, { source: 'streak', days }),
  firstTradeDay: () => XpService.addXp(XpRewards.FIRST_TRADE_DAY, { source: 'milestone', type: 'first_trade_day' })
};
