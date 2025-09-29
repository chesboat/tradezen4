import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FirestoreService } from '@/lib/firestore';
import { formatLocalDate, parseLocalDateString } from '@/lib/utils';
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
        // Compare using local-midnight dates to avoid timezone-related off-by-one
        if (parseLocalDateString(targetDate) > parseLocalDateString(today)) {
          throw new Error('Cannot add tally for a future date');
        }

        // Guard: respect habit schedule (if provided)
        if (rule.schedule?.days && rule.schedule.days.length > 0) {
          const dayOfWeek = parseLocalDateString(targetDate).getDay();
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
        const today = new Date();

        // Build a set of YYYY-MM-DD dates for this rule (timezone-agnostic)
        const dateSet = new Set(
          logs
            .filter(l => l.ruleId === ruleId)
            .map(l => typeof l.date === 'string' ? l.date : formatLocalDate(new Date(l.date as any)))
        );

        if (dateSet.size === 0) {
          return { ruleId, currentStreak: 0, longestStreak: 0, lastTallyDate: null };
        }

        const isValidDay = (d: Date): boolean => {
          const days = rule?.schedule?.days;
          if (!days || days.length === 0) return true;
          return days.includes(d.getDay());
        };
        const prevValid = (d: Date): Date => {
          const x = new Date(d);
          do { x.setDate(x.getDate() - 1); } while (!isValidDay(x));
          return x;
        };

        // Find anchor: latest valid day with a tally, on or before today
        let anchor: Date | null = null;
        let probe = new Date(today);
        for (let i = 0; i < 90; i++) { // 90-day lookback window
          if (isValidDay(probe) && dateSet.has(formatLocalDate(probe))) { anchor = new Date(probe); break; }
          probe = prevValid(probe);
        }

        const latest = Array.from(dateSet).sort((a,b)=>b.localeCompare(a))[0] || null;
        if (!anchor) {
          return { ruleId, currentStreak: 0, longestStreak: 0, lastTallyDate: latest };
        }

        // Current streak: walk backwards through valid days while present in set
        let currentStreak = 1;
        let walk = prevValid(anchor);
        while (dateSet.has(formatLocalDate(walk))) {
          currentStreak++;
          walk = prevValid(walk);
        }

        // Longest streak: approximate by scanning each logged day as a potential anchor
        const sorted = Array.from(dateSet).sort((a,b)=>b.localeCompare(a));
        let longestStreak = 0;
        for (const ds of sorted) {
          let s = 1;
          let d = new Date(ds + 'T00:00:00');
          let p = prevValid(d);
          while (dateSet.has(formatLocalDate(p))) {
            s++;
            p = prevValid(p);
          }
          if (s > longestStreak) longestStreak = s;
        }

        return { ruleId, currentStreak, longestStreak, lastTallyDate: latest };
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
