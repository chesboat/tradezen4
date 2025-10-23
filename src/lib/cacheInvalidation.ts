/**
 * Cache Invalidation System
 * 
 * Apple's Philosophy: "Data should always reflect reality, immediately."
 * 
 * This system ensures that after any major action (add trade, create account, etc.),
 * all dependent stores are refreshed to show current data.
 */

import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { useRuleTallyStore } from '@/store/useRuleTallyStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { useHabitExperimentStore } from '@/store/useHabitExperimentStore';
import { useSessionStore } from '@/store/useSessionStore';
import { useTodoStore } from '@/store/useTodoStore';
import { useQuestStore } from '@/store/useQuestStore';

export type InvalidationScope = 
  | 'trade'           // Trade added/updated/deleted
  | 'account'         // Account created/updated/deleted
  | 'reflection'      // Daily reflection added/updated
  | 'habit'           // Habit logged
  | 'note'            // Note created/updated
  | 'rule'            // Rule tally logged
  | 'session'         // Trading session logged
  | 'todo'            // Todo created/completed
  | 'quest'           // Quest progress updated
  | 'all';            // Nuclear option - refresh everything

/**
 * Invalidate caches based on the scope of the action
 */
export async function invalidateCache(scope: InvalidationScope): Promise<void> {
  console.log(`🔄 [Cache Invalidation] Starting for scope: ${scope}`);
  
  const startTime = performance.now();
  const promises: Promise<any>[] = [];

  try {
    // Always refresh user profile stats (XP, level, etc.)
    const refreshStats = useUserProfileStore.getState().refreshStats;
    if (refreshStats) {
      promises.push(Promise.resolve(refreshStats()));
    }

    switch (scope) {
      case 'trade':
        // Trade affects: trades, activity log, user profile
        const initTrades = useTradeStore.getState().initializeTrades;
        if (initTrades) {
          promises.push(initTrades());
        }
        
        // Re-initialize activity log subscription
        const userId = useUserProfileStore.getState().profile?.id;
        const initActivityLog = useActivityLogStore.getState().initializeActivityLog;
        if (userId && initActivityLog) {
          promises.push(Promise.resolve(initActivityLog(userId)));
        }
        break;

      case 'account':
        // Account affects: accounts, trades (filter), all account-specific data
                const initTradesForAccount = useTradeStore.getState().initializeTrades;
                if (initTradesForAccount) {
                  promises.push(initTradesForAccount());
                }
        
        // Reload rule data for new account
        const accountId = useAccountFilterStore.getState().selectedAccountId;
        const loadRules = useRuleTallyStore.getState().loadRules;
        const loadLogs = useRuleTallyStore.getState().loadLogs;
        if (accountId && loadRules) {
          promises.push(loadRules(accountId));
        }
        if (accountId && loadLogs) {
          promises.push(loadLogs(accountId));
        }

                // Also re-run account initialization to ensure a single source of truth
                try {
                  const { initializeDefaultAccounts } = await import('@/store/useAccountFilterStore');
                  promises.push(Promise.resolve(initializeDefaultAccounts()));
                } catch {}
        break;

      case 'reflection':
      case 'habit':
      case 'note':
      case 'rule':
      case 'session':
      case 'todo':
      case 'quest':
        // These all affect activity log
        const userIdForActivity = useUserProfileStore.getState().profile?.id;
        const initActivityLogForAction = useActivityLogStore.getState().initializeActivityLog;
        if (userIdForActivity && initActivityLogForAction) {
          promises.push(Promise.resolve(initActivityLogForAction(userIdForActivity)));
        }
        break;

      case 'all':
        // Nuclear option - refresh everything
        const initAllTrades = useTradeStore.getState().initializeTrades;
        if (initAllTrades) {
          promises.push(initAllTrades());
        }
        
        const userIdForAll = useUserProfileStore.getState().profile?.id;
        const initAllActivityLog = useActivityLogStore.getState().initializeActivityLog;
        if (userIdForAll && initAllActivityLog) {
          promises.push(Promise.resolve(initAllActivityLog(userIdForAll)));
        }
        
        const accountIdForAll = useAccountFilterStore.getState().selectedAccountId;
        const loadAllRules = useRuleTallyStore.getState().loadRules;
        const loadAllLogs = useRuleTallyStore.getState().loadLogs;
        if (accountIdForAll && loadAllRules) {
          promises.push(loadAllRules(accountIdForAll));
        }
        if (accountIdForAll && loadAllLogs) {
          promises.push(loadAllLogs(accountIdForAll));
        }
        break;
    }

    // Wait for all invalidations to complete
    await Promise.allSettled(promises);

    const duration = performance.now() - startTime;
    console.log(`✅ [Cache Invalidation] Completed for ${scope} in ${duration.toFixed(2)}ms`);
    
  } catch (error) {
    console.error(`❌ [Cache Invalidation] Failed for ${scope}:`, error);
    // Don't throw - cache invalidation failures shouldn't break the app
  }
}

/**
 * Debounced cache invalidation for rapid-fire actions
 */
const invalidationTimers = new Map<InvalidationScope, NodeJS.Timeout>();

export function invalidateCacheDebounced(scope: InvalidationScope, delayMs: number = 300): void {
  // Clear existing timer for this scope
  const existingTimer = invalidationTimers.get(scope);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Set new timer
  const timer = setTimeout(() => {
    invalidateCache(scope);
    invalidationTimers.delete(scope);
  }, delayMs);

  invalidationTimers.set(scope, timer);
}

/**
 * Force immediate cache invalidation (bypasses debouncing)
 */
export function invalidateCacheImmediate(scope: InvalidationScope): Promise<void> {
  // Clear any pending debounced invalidation
  const existingTimer = invalidationTimers.get(scope);
  if (existingTimer) {
    clearTimeout(existingTimer);
    invalidationTimers.delete(scope);
  }

  return invalidateCache(scope);
}

