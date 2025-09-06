import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FirestoreService } from '@/lib/firestore';
import { formatLocalDate } from '@/lib/utils';
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
  addTally: (ruleId: string, accountId: string, dateOverride?: string) => Promise<void>;
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

      addTally: async (ruleId, accountId, dateOverride) => {
        const today = formatLocalDate(new Date());
        const targetDate = dateOverride || today;
        const { logs } = get();
        
        // Validate rule exists
        const rule = get().rules.find(r => r.id === ruleId);
        if (!rule) {
          throw new Error('Habit rule not found');
        }

        // Guard: future dates not allowed
        if (new Date(targetDate) > new Date(today)) {
          throw new Error('Cannot add tally for a future date');
        }

        // Guard: respect habit schedule (if provided)
        if (rule.schedule?.days && rule.schedule.days.length > 0) {
          const dayOfWeek = new Date(targetDate).getDay();
          if (!rule.schedule.days.includes(dayOfWeek)) {
            throw new Error('Selected date is not in habit schedule');
          }
        }

        // Find existing log for target date
        const existingLog = logs.find(
          (log) => log.ruleId === ruleId && log.date === targetDate && log.accountId === accountId
        );

        try {
          console.log('🔍 AddTally: Before update', {
            targetDate,
            ruleId,
            existingLog: existingLog ? { id: existingLog.id, date: existingLog.date, count: existingLog.tallyCount } : null,
            currentLogsCount: logs.length
          });

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
            
            console.log('🔍 AddTally: Updated existing log', { updatedLog });
          } else {
            // Create new log
            const newLog: TallyLog = {
              id: crypto.randomUUID(),
              date: targetDate,
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
            
            console.log('🔍 AddTally: Created new log', { createdLog });
          }
          
          // Check logs after update
          const { logs: updatedLogs } = get();
          console.log('🔍 AddTally: After update', {
            logsCount: updatedLogs.length,
            todayLog: updatedLogs.find(l => l.date === targetDate && l.ruleId === ruleId),
            allDatesForRule: updatedLogs.filter(l => l.ruleId === ruleId).map(l => l.date)
          });

          // Log XP activity with enhanced messaging
          if (rule) {
            const { addActivity } = useActivityLogStore.getState();
            const currentTallyCount = existingLog ? existingLog.tallyCount + 1 : 1;

            // Calculate streak AFTER logs are updated
            const streak = get().calculateStreak(ruleId);
            
            // Compute XP using centralized rewards (base + streak bonus)
            const { XpRewards, awardXp, XpService } = await import('@/lib/xp/XpService');
            const baseXp = XpRewards.HABIT_COMPLETE;
            const isRetro = targetDate < today;
            const streakBonus = isRetro ? 0 : XpRewards.HABIT_STREAK_BONUS * Math.min(streak.currentStreak, 30);
            const totalXp = baseXp + streakBonus;
            console.log('🏁 Habit XP compute:', { ruleId, baseXp, streakBonus, totalXp, streak: streak.currentStreak, tallyCount: currentTallyCount, targetDate, isRetro });

            // Update today's log xpEarned to reflect computed value
            set((state) => ({
              logs: state.logs.map((log) =>
                log.ruleId === ruleId && log.date === targetDate && log.accountId === accountId
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
              if (isRetro) {
                // For retro tallies, award base XP (no streak bonus) with metadata
                await XpService.addXp(baseXp, { source: 'habit', type: 'retro', habitId: ruleId, date: targetDate });
                console.log('✅ Retro Habit XP awarded (base only)');
              } else {
                console.log('🎯 Calling awardXp.habitComplete...', { ruleId, streakDays: streak.currentStreak });
                await awardXp.habitComplete(ruleId, streak.currentStreak);
                console.log('✅ Habit XP awarded');
              }
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

          // Update streak in the streaks map (use the already calculated streak from above)
          if (rule) {
            // The streak was already calculated above after logs were updated
            const finalStreak = get().calculateStreak(ruleId);
            set((state) => ({
              streaks: new Map(state.streaks).set(ruleId, finalStreak),
            }));
          }

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
        let ruleLogs = logs
          .filter((log) => log.ruleId === ruleId)
          .sort((a, b) => {
            // Ensure proper date parsing for sorting
            const dateA = new Date(a.date + 'T00:00:00').getTime();
            const dateB = new Date(b.date + 'T00:00:00').getTime();
            return dateB - dateA; // Newest first
          });

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
        // Normalize all rule log dates to local YYYY-MM-DD for consistent comparisons
        for (let i = 0; i < ruleLogs.length; i++) {
          // Ensure dates are in YYYY-MM-DD (some historical entries may hold Date strings)
          const d = new Date(ruleLogs[i].date);
          ruleLogs[i] = { ...ruleLogs[i], date: formatLocalDate(d) } as typeof ruleLogs[number];
        }
        
        console.log('🔍 Sorted ruleLogs:', {
          ruleId,
          timestamp: new Date().toISOString(),
          sortedDates: ruleLogs.map(l => l.date),
          firstDate: ruleLogs[0]?.date,
          expectedToday: formatLocalDate(today),
          totalLogsInStore: logs.length
        });
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        // Calculate current streak (use local date to avoid UTC off-by-one)
        const todayStr = formatLocalDate(today);
        
        // Check if today is a valid day for this habit
        const todayIsValid = isValidDay(today);
        
        // Start streak calculation - count consecutive days from most recent log
        // A streak continues as long as there are no missed valid days
        currentStreak = 1; // Start with the most recent log
        let checkDate = getPreviousValidDay(new Date(ruleLogs[0].date));
        
        for (let i = 1; i < ruleLogs.length; i++) {
          const checkDateStr = formatLocalDate(checkDate);
          
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
        
        // If today is a valid day and we haven't logged today yet, 
        // check if the streak is still active (no missed days)
        if (todayIsValid && ruleLogs[0].date !== todayStr) {
          // Check if we missed any valid days between the last log and today
          const lastLogDate = new Date(ruleLogs[0].date);
          const daysSinceLastLog = Math.floor((today.getTime() - lastLogDate.getTime()) / (24 * 60 * 60 * 1000));
          
          // Count how many valid days we should have had since the last log
          let missedValidDays = 0;
          for (let d = 1; d <= daysSinceLastLog; d++) {
            const checkDay = new Date(lastLogDate);
            checkDay.setDate(lastLogDate.getDate() + d);
            if (isValidDay(checkDay)) {
              missedValidDays++;
            }
          }
          
          console.log('🔍 Streak gap check:', {
            lastLogDate: ruleLogs[0].date,
            todayStr,
            daysSinceLastLog,
            missedValidDays,
            currentStreakBefore: currentStreak,
            willResetStreak: missedValidDays > 1
          });
          
          // If we missed more than 1 valid day (today doesn't count as missed yet), streak is broken
          if (missedValidDays > 1) {
            currentStreak = 0;
          }
        }
        
        // Calculate longest streak (considering only valid days)
        tempStreak = 1;
        for (let i = 1; i < ruleLogs.length; i++) {
          const currentLogDate = new Date(ruleLogs[i - 1].date);
          const nextLogDate = new Date(ruleLogs[i].date);
          
          // Find the expected previous valid day from current log
          const expectedPrevDay = getPreviousValidDay(currentLogDate);
          const expectedPrevDayStr = formatLocalDate(expectedPrevDay);
          
          if (ruleLogs[i].date === expectedPrevDayStr) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        const result = {
          ruleId,
          currentStreak,
          longestStreak,
          lastTallyDate: ruleLogs[0]?.date || null,
        };
        
        // Debug logging for streak calculation
        console.log('Streak calculation result:', {
          ruleId,
          ruleName: rule?.label || 'Unknown',
          currentStreak,
          longestStreak,
          lastTallyDate: result.lastTallyDate,
          totalLogs: ruleLogs.length,
          todayStr,
          todayIsValid,
          firstLogDate: ruleLogs[0]?.date,
          allLogDates: ruleLogs.map(log => log.date),
          hasLogForToday: ruleLogs.some(log => log.date === todayStr)
        });
        
        return result;
      },

      getStreakForRule: (ruleId) => {
        // Always calculate fresh instead of using cached streaks to avoid stale data
        return get().calculateStreak(ruleId);
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
        console.log('🔍 LoadLogs: CALLED', { accountId, startDate, endDate, stackTrace: new Error().stack });
        set({ isLoading: true });
        try {
          const logs = await logsService.getAll();
          console.log('🔍 LoadLogs: Raw logs from Firestore:', logs.length, logs.map(l => ({ id: l.id, date: l.date, ruleId: l.ruleId })));
          let filteredLogs = logs;
          
          if (accountId) {
            console.log('🔍 LoadLogs: Before accountId filter', {
              accountId,
              totalLogs: filteredLogs.length,
              hitMacrosLogs: filteredLogs.filter(l => l.ruleId === 'ekWS96zlKqFcdBr2YJu8').map(l => ({ date: l.date, accountId: l.accountId, matchesFilter: l.accountId === accountId }))
            });
            filteredLogs = filteredLogs.filter(log => log.accountId === accountId);
            console.log('🔍 LoadLogs: After accountId filter', {
              filteredCount: filteredLogs.length,
              hitMacrosLogs: filteredLogs.filter(l => l.ruleId === 'ekWS96zlKqFcdBr2YJu8').map(l => ({ date: l.date, accountId: l.accountId }))
            });
          }
          
          if (startDate) {
            console.log('🔍 LoadLogs: Before startDate filter', {
              startDate,
              totalLogs: filteredLogs.length,
              hitMacrosLogs: filteredLogs.filter(l => l.ruleId === 'ekWS96zlKqFcdBr2YJu8').map(l => ({ date: l.date, comparison: l.date >= startDate }))
            });
            filteredLogs = filteredLogs.filter(log => log.date >= startDate);
            console.log('🔍 LoadLogs: After startDate filter', {
              filteredCount: filteredLogs.length,
              hitMacrosLogs: filteredLogs.filter(l => l.ruleId === 'ekWS96zlKqFcdBr2YJu8').map(l => l.date)
            });
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
          const dateStr = formatLocalDate(date);
          
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
          const dateStr = formatLocalDate(date);
          
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
          const startDate = formatLocalDate(thirtyDaysAgo);
          
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
