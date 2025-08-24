import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FirestoreService } from '@/lib/firestore';
import { useActivityLogStore } from './useActivityLogStore';
import type { TallyRule, TallyLog, TallyStreak } from '@/types';

interface RuleTallyState {
  rules: TallyRule[];
  logs: TallyLog[];
  streaks: Map<string, TallyStreak>;
  isLoading: boolean;
  
  // Rule management
  addRule: (rule: Omit<TallyRule, 'id' | 'createdAt'>) => Promise<TallyRule>;
  updateRule: (id: string, updates: Partial<TallyRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  getRulesByAccount: (accountId: string) => TallyRule[];
  
  // Tally logging
  addTally: (ruleId: string, accountId: string) => Promise<void>;
  getTallyLog: (date: string, accountId: string) => TallyLog[];
  getTallyCountForRule: (ruleId: string, date: string) => number;
  
  // Streak calculation
  calculateStreak: (ruleId: string) => TallyStreak;
  getStreakForRule: (ruleId: string) => TallyStreak | null;
  
  // Data fetching
  loadRules: (accountId?: string) => Promise<void>;
  loadLogs: (accountId?: string, startDate?: string, endDate?: string) => Promise<void>;
  
  // Initialization
  initializeStore: () => Promise<void>;
  
  // Utility
  getWeeklyTallies: (ruleId: string, startDate: string) => { date: string; count: number }[];
  getMonthlyTallies: (ruleId: string, year: number, month: number) => { date: string; count: number }[];
}

const rulesService = new FirestoreService<TallyRule>('tallyRules');
const logsService = new FirestoreService<TallyLog>('tallyLogs');

export const useRuleTallyStore = create<RuleTallyState>()(
  devtools(
    (set, get) => ({
      rules: [],
      logs: [],
      streaks: new Map(),
      isLoading: false,

      addRule: async (ruleData) => {
        const rule: TallyRule = {
          ...ruleData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
        };

        try {
          const createdRule = await rulesService.create(rule);
          set((state) => ({
            rules: [...state.rules, createdRule],
          }));

          // Log habit creation activity
          const { addActivity } = useActivityLogStore.getState();
          addActivity({
            type: 'habit',
            title: 'New Habit Created',
            description: `Created "${rule.label}" habit (${rule.category})`,
            xpEarned: 10,
            relatedId: rule.id,
            accountId: rule.accountId,
          });

          // Award small XP for creating a habit (keep consistent with activity display)
          try {
            const { XpService } = await import('@/lib/xp/XpService');
            await XpService.addXp(10, { source: 'habit', type: 'create_habit', habitId: rule.id });
          } catch {}

          return createdRule;
        } catch (error) {
          console.error('Failed to create tally rule:', error);
          throw error;
        }
      },

      updateRule: async (id, updates) => {
        try {
          const rule = get().rules.find(r => r.id === id);
          await rulesService.update(id, updates);
          set((state) => ({
            rules: state.rules.map((rule) =>
              rule.id === id ? { ...rule, ...updates } : rule
            ),
          }));

          // Log habit update activity
          if (rule) {
            const { addActivity } = useActivityLogStore.getState();
            addActivity({
              type: 'habit',
              title: 'Habit Updated',
              description: `Updated "${updates.label || rule.label}" habit`,
              xpEarned: 5,
              relatedId: id,
              accountId: rule.accountId,
            });

            // Award small XP for habit update to match activity display
            try {
              const { XpService } = await import('@/lib/xp/XpService');
              await XpService.addXp(5, { source: 'habit', type: 'update_habit', habitId: id });
            } catch {}
          }
        } catch (error) {
          console.error('Failed to update tally rule:', error);
          throw error;
        }
      },

      deleteRule: async (id) => {
        try {
          const rule = get().rules.find(r => r.id === id);
          await rulesService.delete(id);
          set((state) => ({
            rules: state.rules.filter((rule) => rule.id !== id),
            logs: state.logs.filter((log) => log.ruleId !== id),
          }));

          // Log habit deletion activity
          if (rule) {
            const { addActivity } = useActivityLogStore.getState();
            addActivity({
              type: 'habit',
              title: 'Habit Deleted',
              description: `Deleted "${rule.label}" habit`,
              relatedId: id,
              accountId: rule.accountId,
            });
          }
        } catch (error) {
          console.error('Failed to delete tally rule:', error);
          throw error;
        }
      },

      getRulesByAccount: (accountId) => {
        const { rules } = get();
        return rules.filter((rule) => rule.accountId === accountId && rule.isActive);
      },

      addTally: async (ruleId, accountId) => {
        const today = new Date().toISOString().split('T')[0];
        const { logs } = get();
        
        // Find existing log for today
        const existingLog = logs.find(
          (log) => log.ruleId === ruleId && log.date === today && log.accountId === accountId
        );

        try {
          if (existingLog) {
            // Update existing log
            const updatedLog = {
              ...existingLog,
              tallyCount: existingLog.tallyCount + 1,
              // xpEarned will be recomputed below after streak calc
              xpEarned: existingLog.xpEarned,
              updatedAt: new Date(),
            };
            
            await logsService.update(existingLog.id, updatedLog);
            
            set((state) => ({
              logs: state.logs.map((log) =>
                log.id === existingLog.id ? updatedLog : log
              ),
            }));
          } else {
            // Create new log
            const newLog: TallyLog = {
              id: crypto.randomUUID(),
              date: today,
              ruleId,
              tallyCount: 1,
              xpEarned: 0,
              accountId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            const createdLog = await logsService.create(newLog);
            
            set((state) => ({
              logs: [...state.logs, createdLog],
            }));
          }

          // Log XP activity with enhanced messaging
          const rule = get().rules.find(r => r.id === ruleId);
          if (rule) {
            const { addActivity } = useActivityLogStore.getState();
            const currentTallyCount = existingLog ? existingLog.tallyCount + 1 : 1;
            
            // Calculate streak for enhanced messaging
            const streak = get().calculateStreak(ruleId);

            // Compute XP using centralized rewards (base + streak bonus)
            const { XpRewards, awardXp } = await import('@/lib/xp/XpService');
            const baseXp = XpRewards.HABIT_COMPLETE;
            const streakBonus = XpRewards.HABIT_STREAK_BONUS * Math.min(streak.currentStreak, 30);
            const totalXp = baseXp + streakBonus;
            console.log('🏁 Habit XP compute:', { ruleId, baseXp, streakBonus, totalXp, streak: streak.currentStreak, tallyCount: currentTallyCount });

            // Update today's log xpEarned to reflect computed value
            set((state) => ({
              logs: state.logs.map((log) =>
                log.ruleId === ruleId && log.date === today && log.accountId === accountId
                  ? { ...log, xpEarned: totalXp, updatedAt: new Date() }
                  : log
              ),
            }));
            
            let title = 'Habit Completed! 🎯';
            let description = `${rule.emoji} ${rule.label}`;
            
            // Add streak information for extra dopamine
            if (streak.currentStreak > 1) {
              const streakText = getStreakText(rule.category);
              title = `${streak.currentStreak} ${streakText} streak! 🔥`;
              description = `${rule.emoji} ${rule.label} - ${streak.currentStreak} ${streakText}s in a row!`;
            }
            
            // Add milestone celebrations
            if (currentTallyCount % 10 === 0) {
              title = `${currentTallyCount} tallies milestone! 🏆`;
              description = `${rule.emoji} ${rule.label} - Hit ${currentTallyCount} tallies today!`;
            } else if (currentTallyCount % 5 === 0) {
              title = `${currentTallyCount} tallies today! ⭐`;
              description = `${rule.emoji} ${rule.label} - ${currentTallyCount} times today!`;
            }

            addActivity({
              type: 'habit',
              title,
              description,
              xpEarned: totalXp,
              relatedId: ruleId,
              accountId,
            });

            // Award XP through new prestige system
            try {
              console.log('🎯 Calling awardXp.habitComplete...', { ruleId, streakDays: streak.currentStreak });
              await awardXp.habitComplete(ruleId, streak.currentStreak);
              console.log('✅ Habit XP awarded');
            } catch (e) {
              console.error('❌ Habit XP award failed:', e);
            }
          }

          // Helper function for streak text (inline since it's not available in store)
          function getStreakText(category: string): string {
            switch (category) {
              case 'trading': return 'market day';
              case 'weekdays': return 'weekday';
              case 'daily': return 'day';
              case 'custom': return 'day';
              default: return 'day';
            }
          }

          // Update streak
          const streak = get().calculateStreak(ruleId);
          set((state) => ({
            streaks: new Map(state.streaks).set(ruleId, streak),
          }));

        } catch (error) {
          console.error('Failed to add tally:', error);
          throw error;
        }
      },

      getTallyLog: (date, accountId) => {
        const { logs } = get();
        return logs.filter((log) => log.date === date && log.accountId === accountId);
      },

      getTallyCountForRule: (ruleId, date) => {
        const { logs } = get();
        const log = logs.find((l) => l.ruleId === ruleId && l.date === date);
        return log?.tallyCount || 0;
      },

      calculateStreak: (ruleId) => {
        const { logs, rules } = get();
        const rule = rules.find(r => r.id === ruleId);
        const ruleLogs = logs
          .filter((log) => log.ruleId === ruleId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (ruleLogs.length === 0) {
          return {
            ruleId,
            currentStreak: 0,
            longestStreak: 0,
            lastTallyDate: null,
          };
        }

        // Helper function to check if a date is a valid day for this habit
        const isValidDay = (date: Date): boolean => {
          if (!rule?.schedule?.days) return true; // Default to all days if no schedule
          const dayOfWeek = date.getDay();
          return rule.schedule.days.includes(dayOfWeek);
        };

        // Helper function to get the previous valid day
        const getPreviousValidDay = (date: Date): Date => {
          const prevDate = new Date(date);
          do {
            prevDate.setDate(prevDate.getDate() - 1);
          } while (!isValidDay(prevDate));
          return prevDate;
        };

        const today = new Date();
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        // Calculate current streak
        const todayStr = today.toISOString().split('T')[0];
        
        // Check if today is a valid day for this habit
        const todayIsValid = isValidDay(today);
        
        // Start streak calculation
        if (ruleLogs[0].date === todayStr && todayIsValid) {
          // User has logged today and today is a valid day
          currentStreak = 1;
          let checkDate = getPreviousValidDay(today);
          
          for (let i = 1; i < ruleLogs.length; i++) {
            const checkDateStr = checkDate.toISOString().split('T')[0];
            
            if (ruleLogs[i].date === checkDateStr) {
              currentStreak++;
              checkDate = getPreviousValidDay(checkDate);
            } else {
              // Check if there are any missed valid days between logs
              const logDate = new Date(ruleLogs[i].date);
              if (logDate < checkDate) {
                // There's a gap, streak is broken
                break;
              }
            }
          }
        } else if (!todayIsValid) {
          // Today is not a valid day (e.g., weekend for trading habits)
          // Check the most recent valid day
          let mostRecentValidDay = getPreviousValidDay(today);
          const mostRecentValidDayStr = mostRecentValidDay.toISOString().split('T')[0];
          
          if (ruleLogs[0].date === mostRecentValidDayStr) {
            currentStreak = 1;
            let checkDate = getPreviousValidDay(mostRecentValidDay);
            
            for (let i = 1; i < ruleLogs.length; i++) {
              const checkDateStr = checkDate.toISOString().split('T')[0];
              
              if (ruleLogs[i].date === checkDateStr) {
                currentStreak++;
                checkDate = getPreviousValidDay(checkDate);
              } else {
                const logDate = new Date(ruleLogs[i].date);
                if (logDate < checkDate) {
                  break;
                }
              }
            }
          }
        }
        
        // Calculate longest streak (considering only valid days)
        tempStreak = 1;
        for (let i = 1; i < ruleLogs.length; i++) {
          const currentLogDate = new Date(ruleLogs[i - 1].date);
          const nextLogDate = new Date(ruleLogs[i].date);
          
          // Find the expected previous valid day from current log
          const expectedPrevDay = getPreviousValidDay(currentLogDate);
          const expectedPrevDayStr = expectedPrevDay.toISOString().split('T')[0];
          
          if (ruleLogs[i].date === expectedPrevDayStr) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        return {
          ruleId,
          currentStreak,
          longestStreak,
          lastTallyDate: ruleLogs[0]?.date || null,
        };
      },

      getStreakForRule: (ruleId) => {
        const { streaks } = get();
        return streaks.get(ruleId) || null;
      },

      loadRules: async (accountId) => {
        set({ isLoading: true });
        try {
          console.log('Loading tally rules...', { accountId });
          const rules = await rulesService.getAll();
          console.log('Loaded rules from Firebase:', rules.length, 'rules');
          
          const filteredRules = accountId 
            ? rules.filter(rule => rule.accountId === accountId)
            : rules;
          
          console.log('Filtered rules:', filteredRules.length, 'rules for account:', accountId);
          set({ rules: filteredRules });
        } catch (error) {
          console.error('Failed to load tally rules:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      loadLogs: async (accountId, startDate, endDate) => {
        set({ isLoading: true });
        try {
          const logs = await logsService.getAll();
          let filteredLogs = logs;
          
          if (accountId) {
            filteredLogs = filteredLogs.filter(log => log.accountId === accountId);
          }
          
          if (startDate) {
            filteredLogs = filteredLogs.filter(log => log.date >= startDate);
          }
          
          if (endDate) {
            filteredLogs = filteredLogs.filter(log => log.date <= endDate);
          }
          
          set({ logs: filteredLogs });

          // Calculate streaks for all rules
          const { rules } = get();
          const newStreaks = new Map();
          rules.forEach(rule => {
            const streak = get().calculateStreak(rule.id);
            newStreaks.set(rule.id, streak);
          });
          set({ streaks: newStreaks });

        } catch (error) {
          console.error('Failed to load tally logs:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      getWeeklyTallies: (ruleId, startDate) => {
        const { logs } = get();
        const start = new Date(startDate);
        const weekData: { date: string; count: number }[] = [];
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          
          const log = logs.find(l => l.ruleId === ruleId && l.date === dateStr);
          weekData.push({
            date: dateStr,
            count: log?.tallyCount || 0,
          });
        }
        
        return weekData;
      },

      getMonthlyTallies: (ruleId, year, month) => {
        const { logs } = get();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthData: { date: string; count: number }[] = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          const dateStr = date.toISOString().split('T')[0];
          
          const log = logs.find(l => l.ruleId === ruleId && l.date === dateStr);
          monthData.push({
            date: dateStr,
            count: log?.tallyCount || 0,
          });
        }
        
        return monthData;
      },

      // Initialize store by loading all rules and recent logs
      initializeStore: async () => {
        try {
          set({ isLoading: true });
          
          // Load all rules (no account filter for initialization)
          await get().loadRules();
          
          // Load recent logs (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const startDate = thirtyDaysAgo.toISOString().split('T')[0];
          
          await get().loadLogs(undefined, startDate);
          
          console.log('Rule tally store initialized successfully');
        } catch (error) {
          console.error('Failed to initialize rule tally store:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'rule-tally-store',
    }
  )
);

// Initialize rule tally store when auth state changes
export const initializeRuleTallyStore = async () => {
  return useRuleTallyStore.getState().initializeStore();
};
