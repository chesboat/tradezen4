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
  addTally: (ruleId: string, accountId: string, xpAmount?: number) => Promise<void>;
  getTallyLog: (date: string, accountId: string) => TallyLog[];
  getTallyCountForRule: (ruleId: string, date: string) => number;
  
  // Streak calculation
  calculateStreak: (ruleId: string) => TallyStreak;
  getStreakForRule: (ruleId: string) => TallyStreak | null;
  
  // Data fetching
  loadRules: (accountId?: string) => Promise<void>;
  loadLogs: (accountId?: string, startDate?: string, endDate?: string) => Promise<void>;
  
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
          return createdRule;
        } catch (error) {
          console.error('Failed to create tally rule:', error);
          throw error;
        }
      },

      updateRule: async (id, updates) => {
        try {
          await rulesService.update(id, updates);
          set((state) => ({
            rules: state.rules.map((rule) =>
              rule.id === id ? { ...rule, ...updates } : rule
            ),
          }));
        } catch (error) {
          console.error('Failed to update tally rule:', error);
          throw error;
        }
      },

      deleteRule: async (id) => {
        try {
          await rulesService.delete(id);
          set((state) => ({
            rules: state.rules.filter((rule) => rule.id !== id),
            logs: state.logs.filter((log) => log.ruleId !== id),
          }));
        } catch (error) {
          console.error('Failed to delete tally rule:', error);
          throw error;
        }
      },

      getRulesByAccount: (accountId) => {
        const { rules } = get();
        return rules.filter((rule) => rule.accountId === accountId && rule.isActive);
      },

      addTally: async (ruleId, accountId, xpAmount = 5) => {
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
              xpEarned: existingLog.xpEarned + xpAmount,
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
              xpEarned: xpAmount,
              accountId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            const createdLog = await logsService.create(newLog);
            
            set((state) => ({
              logs: [...state.logs, createdLog],
            }));
          }

          // Log XP activity
          const rule = get().rules.find(r => r.id === ruleId);
          if (rule) {
            const { addActivity } = useActivityLogStore.getState();
            addActivity({
              type: 'habit',
              title: 'Rule Followed',
              description: `Followed rule: ${rule.label}`,
              xpEarned: xpAmount,
              relatedId: ruleId,
              accountId,
            });
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
        const { logs } = get();
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

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        
        // Calculate current streak
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (ruleLogs[0].date === todayStr) {
          currentStreak = 1;
          tempStreak = 1;
          
          // Check consecutive days backwards
          for (let i = 1; i < ruleLogs.length; i++) {
            const currentDate = new Date(ruleLogs[i-1].date);
            const prevDate = new Date(ruleLogs[i].date);
            const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (dayDiff === 1) {
              currentStreak++;
              tempStreak++;
            } else {
              break;
            }
          }
        } else if (ruleLogs[0].date === yesterdayStr) {
          // Streak broken today, but count yesterday
          currentStreak = 0;
        }

        // Calculate longest streak
        tempStreak = 1;
        for (let i = 1; i < ruleLogs.length; i++) {
          const currentDate = new Date(ruleLogs[i-1].date);
          const prevDate = new Date(ruleLogs[i].date);
          const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dayDiff === 1) {
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
          const rules = await rulesService.getAll();
          const filteredRules = accountId 
            ? rules.filter(rule => rule.accountId === accountId)
            : rules;
          
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
    }),
    {
      name: 'rule-tally-store',
    }
  )
);
