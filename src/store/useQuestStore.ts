import { create } from 'zustand';
import { Quest, Trade, QuickNote, MoodType } from '@/types';
import { QuestState } from '@/types/stores';
import { localStorage, STORAGE_KEYS, generateId } from '@/lib/localStorageUtils';
import { generateQuestSuggestions } from '@/lib/ai/generateQuestSuggestions';

/**
 * Helper function to deserialize quests with proper date objects
 */
const deserializeQuests = (quests: any[]): Quest[] => {
  return quests.map(quest => ({
    ...quest,
    createdAt: new Date(quest.createdAt),
    updatedAt: new Date(quest.updatedAt),
    dueDate: quest.dueDate ? new Date(quest.dueDate) : undefined,
    completedAt: quest.completedAt ? new Date(quest.completedAt) : undefined,
  }));
};

/**
 * Zustand store for quest state management
 */
export const useQuestStore = create<QuestState>((set, get) => ({
  // Initialize with persisted state and proper date deserialization
  quests: deserializeQuests(localStorage.getItem(STORAGE_KEYS.QUESTS, [])),
  pinnedQuests: localStorage.getItem(STORAGE_KEYS.PINNED_QUESTS, []),

  // Add new quest
  addQuest: async (quest: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Ensure sane defaults
    const safeMaxProgress = Math.max(1, Number.isFinite((quest as any).maxProgress) ? (quest as any).maxProgress : 1);
    const newQuest: Quest = {
      ...quest,
      maxProgress: safeMaxProgress,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const currentQuests = get().quests;
    const updatedQuests = [...currentQuests, newQuest];

    set({ quests: updatedQuests });
    localStorage.setItem(STORAGE_KEYS.QUESTS, updatedQuests);
    
    return newQuest; // Return the quest for pinning
  },

  // Update existing quest
  updateQuest: async (id: string, updates: Partial<Quest>) => {
    const currentQuests = get().quests;
    const updatedQuests = currentQuests.map(quest => 
      quest.id === id 
        ? { ...quest, ...updates, updatedAt: new Date() }
        : quest
    );

    set({ quests: updatedQuests });
    localStorage.setItem(STORAGE_KEYS.QUESTS, updatedQuests);
  },

  // Complete quest
  completeQuest: async (id: string) => {
    const currentQuests = get().quests;
    const currentPinnedQuests = get().pinnedQuests;
    
    const updatedQuests = currentQuests.map(quest => 
      quest.id === id 
        ? { 
            ...quest, 
            status: 'completed' as const,
            progress: quest.maxProgress,
            completedAt: new Date(),
            updatedAt: new Date(),
          }
        : quest
    );

    // Auto-unpin completed quests
    const updatedPinnedQuests = currentPinnedQuests.filter(pinnedId => pinnedId !== id);

    set({ quests: updatedQuests, pinnedQuests: updatedPinnedQuests });
    localStorage.setItem(STORAGE_KEYS.QUESTS, updatedQuests);
    localStorage.setItem(STORAGE_KEYS.PINNED_QUESTS, updatedPinnedQuests);
  },

  // Cancel quest (user-initiated)
  cancelQuest: async (id: string) => {
    const currentQuests = get().quests;
    const updatedQuests = currentQuests.map(quest => 
      quest.id === id 
        ? { 
            ...quest, 
            status: 'cancelled' as const,
            updatedAt: new Date(),
          }
        : quest
    );

    set({ quests: updatedQuests });
    localStorage.setItem(STORAGE_KEYS.QUESTS, updatedQuests);
  },

  // Mark quest as failed (system or user-initiated)
  failQuest: async (id: string) => {
    const currentQuests = get().quests;
    const updatedQuests = currentQuests.map(quest => 
      quest.id === id 
        ? { 
            ...quest, 
            status: 'failed' as const,
            updatedAt: new Date(),
          }
        : quest
    );

    set({ quests: updatedQuests });
    localStorage.setItem(STORAGE_KEYS.QUESTS, updatedQuests);
  },

  // Cleanup old overdue quests
  cleanupOldQuests: (olderThanDays: number = 7) => {
    const currentQuests = get().quests;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let cleanedCount = 0;
    const updatedQuests = currentQuests.map(quest => {
      const isOverdue = quest.dueDate && new Date(quest.dueDate) < new Date();
      const isOld = new Date(quest.createdAt) < cutoffDate;
      const shouldCleanup = isOverdue && isOld && quest.status !== 'completed' && quest.status !== 'cancelled' && quest.status !== 'failed';
      
      if (shouldCleanup) {
        cleanedCount++;
        return {
          ...quest,
          status: 'failed' as const,
          updatedAt: new Date(),
        };
      }
      return quest;
    });

    if (cleanedCount > 0) {
      set({ quests: updatedQuests });
      localStorage.setItem(STORAGE_KEYS.QUESTS, updatedQuests);
    }
    
    return cleanedCount;
  },

  // Update quest progress (for automatic tracking)
  updateQuestProgress: (id: string, progressIncrement: number = 1) => {
    const currentQuests = get().quests;
    const currentPinnedQuests = get().pinnedQuests;
    let updatedPinnedQuests = currentPinnedQuests;
    
    const updatedQuests = currentQuests.map(quest => {
      if (quest.id === id && quest.status !== 'completed') {
        const newProgress = Math.min(quest.progress + progressIncrement, quest.maxProgress);
        const willReachMax = newProgress >= quest.maxProgress;
        
        // Auto-unpin completed quests
        if (willReachMax && currentPinnedQuests.includes(id)) {
          updatedPinnedQuests = currentPinnedQuests.filter(pinnedId => pinnedId !== id);
        }
        
        // Only auto-mark completed for achievement-type quests. For daily/weekly/monthly,
        // leave status as pending to allow manual completion UX.
        const shouldAutoComplete = willReachMax && quest.type === 'achievement';

        return {
          ...quest,
          progress: newProgress,
          status: shouldAutoComplete ? 'completed' as const : quest.status,
          completedAt: shouldAutoComplete ? new Date() : quest.completedAt,
          updatedAt: new Date(),
        };
      }
      return quest;
    });

    set({ quests: updatedQuests, pinnedQuests: updatedPinnedQuests });
    localStorage.setItem(STORAGE_KEYS.QUESTS, updatedQuests);
    localStorage.setItem(STORAGE_KEYS.PINNED_QUESTS, updatedPinnedQuests);
  },

  // Check and update Daily Focus quest progress based on activities
  checkDailyFocusProgress: (accountId: string) => {
    const currentQuests = get().quests;
    const today = new Date().toDateString();
    
    // Find today's Daily Focus quests for this account
    const dailyFocusQuests = currentQuests.filter(quest => 
      quest.title === 'Daily Focus' &&
      quest.accountId === accountId &&
      quest.status !== 'completed' &&
      (typeof quest.createdAt === 'string' ? new Date(quest.createdAt) : quest.createdAt).toDateString() === today
    );

    return dailyFocusQuests; // Return quests that can be updated
  },

  // Track consecutive trading days for consistency quests
  updateConsistencyProgress: (accountId: string, trades: Trade[]) => {
    const currentQuests = get().quests;
    const consistencyQuests = currentQuests.filter(quest => 
      (quest.title === 'Consistency Builder' || quest.description.toLowerCase().includes('consecutive')) &&
      quest.accountId === accountId &&
      quest.status !== 'completed' &&
      quest.status !== 'cancelled' &&
      quest.status !== 'failed'
    );

    consistencyQuests.forEach(quest => {
      // Calculate consecutive trading days
      const tradingDays = new Set<string>();
      trades.forEach(trade => {
        const tradeDate = new Date(trade.entryTime).toDateString();
        tradingDays.add(tradeDate);
      });

      const sortedDays = Array.from(tradingDays).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      let consecutiveDays = 0;
      let currentStreak = 1;

      for (let i = 1; i < sortedDays.length; i++) {
        const prevDate = new Date(sortedDays[i - 1] as string);
        const currDate = new Date(sortedDays[i] as string);
        const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

        if (dayDiff === 1) {
          currentStreak++;
          consecutiveDays = Math.max(consecutiveDays, currentStreak);
        } else {
          currentStreak = 1;
        }
      }

      consecutiveDays = Math.max(consecutiveDays, currentStreak);

      // Update quest progress
      if (consecutiveDays > quest.progress) {
        get().updateQuest(quest.id, { progress: Math.min(consecutiveDays, quest.maxProgress) });
      }
    });
  },

  // Pin quest
  pinQuest: (id: string) => {
    const currentPinned = get().pinnedQuests;
    if (!currentPinned.includes(id)) {
      const updatedPinned = [...currentPinned, id];
      set({ pinnedQuests: updatedPinned });
      localStorage.setItem(STORAGE_KEYS.PINNED_QUESTS, updatedPinned);
    }
  },

  // Unpin quest
  unpinQuest: (id: string) => {
    const currentPinned = get().pinnedQuests;
    const updatedPinned = currentPinned.filter(questId => questId !== id);
    set({ pinnedQuests: updatedPinned });
    localStorage.setItem(STORAGE_KEYS.PINNED_QUESTS, updatedPinned);
  },

  // Clean up pinned quests that are completed/cancelled/failed
  cleanupPinnedQuests: () => {
    const currentQuests = get().quests;
    const currentPinned = get().pinnedQuests;
    
    // First, normalize any quests with invalid maxProgress/progress
    const normalizedQuests = currentQuests.map(quest => {
      const safeMax = Math.max(1, Number.isFinite((quest as any).maxProgress) ? (quest as any).maxProgress : 1);
      const safeProgress = Math.min(quest.progress, safeMax);
      if (safeMax !== quest.maxProgress || safeProgress !== quest.progress) {
        return {
          ...quest,
          maxProgress: safeMax,
          progress: safeProgress,
          updatedAt: new Date(),
        };
      }
      return quest;
    });
    if (normalizedQuests.some((q, i) => q !== currentQuests[i])) {
      set({ quests: normalizedQuests });
      localStorage.setItem(STORAGE_KEYS.QUESTS, normalizedQuests);
    }
    
    // First, auto-complete any quests that have full progress but aren't marked complete
    const updatedQuests = (normalizedQuests.length ? normalizedQuests : currentQuests).map(quest => {
      if (quest.progress >= quest.maxProgress && quest.status !== 'completed' && quest.status !== 'cancelled' && quest.status !== 'failed') {
        console.log(`🎯 Auto-completing fully progressed quest: ${quest.title}`);
        return {
          ...quest,
          status: 'completed' as const,
          completedAt: new Date(),
          updatedAt: new Date(),
        };
      }
      return quest;
    });
    
    // Update quests if any were auto-completed
    if (updatedQuests.some((q, i) => q !== currentQuests[i])) {
      set({ quests: updatedQuests });
      localStorage.setItem(STORAGE_KEYS.QUESTS, updatedQuests);
    }
    
    // Filter out pinned quest IDs that correspond to completed/cancelled/failed/fully-progressed quests
    const activePinnedQuests = currentPinned.filter(pinnedId => {
      const quest = updatedQuests.find(q => q.id === pinnedId);
      if (!quest) return false; // Quest no longer exists
      if (quest.status === 'completed' || quest.status === 'cancelled' || quest.status === 'failed') return false;
      if (quest.progress >= quest.maxProgress) return false; // Quest is fully progressed
      return true;
    });
    
    if (activePinnedQuests.length !== currentPinned.length) {
      console.log(`🧹 Cleaned up ${currentPinned.length - activePinnedQuests.length} completed/inactive pinned quests`);
      set({ pinnedQuests: activePinnedQuests });
      localStorage.setItem(STORAGE_KEYS.PINNED_QUESTS, activePinnedQuests);
    }
  },

  // Generate daily quests (now with AI support)
  generateDailyQuests: async (trades: Trade[] = [], notes: QuickNote[] = [], currentMood: MoodType = 'neutral', forceRegenerate: boolean = false) => {
    const currentQuests = get().quests;
    const today = new Date();
    const todayDateString = today.toDateString();
    
    // Check if daily quests already exist for today
    const todayQuests = currentQuests.filter(quest => 
      quest.type === 'daily' && 
      (typeof quest.createdAt === 'string' ? new Date(quest.createdAt) : quest.createdAt).toDateString() === todayDateString
    );
    
    if (todayQuests.length === 0 || forceRegenerate) {
      if (forceRegenerate && todayQuests.length > 0) {
        // Cancel existing daily quests for today
        todayQuests.forEach(quest => {
          get().cancelQuest(quest.id);
        });
      }
      try {
        // Calculate performance metrics
        const recentTrades = trades.slice(-10);
        const winRate = recentTrades.length > 0 
          ? (recentTrades.filter(t => t.result === 'win').length / recentTrades.length) * 100 
          : 0;
        const totalPnL = recentTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const avgRiskAmount = recentTrades.length > 0
          ? recentTrades.reduce((sum, t) => sum + t.riskAmount, 0) / recentTrades.length
          : 100;
        
        const completedQuests = currentQuests
          .filter(q => q.status === 'completed')
          .map(q => q.title);

        // Generate AI-powered quest suggestions
        const questSuggestions = await generateQuestSuggestions({
          recentTrades,
          recentNotes: notes.slice(-5),
          currentMood,
          completedQuests,
          winRate,
          totalPnL,
          avgRiskAmount
        });

        // Add each generated quest
        questSuggestions.forEach(questData => {
          get().addQuest(questData);
        });
        
      } catch (error) {
        console.error('❌ Failed to generate AI quests, using fallback:', error);
        
        // Fallback to static quests if AI generation fails
        const fallbackQuests: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>[] = [
          {
            title: 'Risk Master',
            description: 'Keep all trades under 2% account risk',
            type: 'daily',
            status: 'pending',
            progress: 0,
            maxProgress: 1,
            xpReward: 50,
            dueDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            accountId: 'all',
          },
          {
            title: 'Patience Pays',
            description: 'Wait for 3 A+ setups before entering any trades',
            type: 'daily',
            status: 'pending',
            progress: 0,
            maxProgress: 3,
            xpReward: 75,
            dueDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            accountId: 'all',
          },
          {
            title: 'Journal Keeper',
            description: 'Add a quick note after each trade',
            type: 'daily',
            status: 'pending',
            progress: 0,
            maxProgress: 1,
            xpReward: 25,
            dueDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            accountId: 'all',
          },
        ];

        fallbackQuests.forEach(quest => {
          get().addQuest(quest);
        });
      }
    }
  },
}));

// Selector hooks for performance optimization
export const useQuests = () => useQuestStore((state) => state.quests);
export const usePinnedQuests = () => useQuestStore((state) => {
  const pinnedIds = state.pinnedQuests;
  return state.quests.filter(quest => 
    pinnedIds.includes(quest.id) && 
    quest.status !== 'completed' && 
    quest.status !== 'cancelled' && 
    quest.status !== 'failed'
  );
});

export const useQuestsByStatus = (status: 'pending' | 'in_progress' | 'completed' | 'failed') => 
  useQuestStore((state) => state.quests.filter(quest => quest.status === status));

export const useQuestsByType = (type: 'daily' | 'weekly' | 'monthly' | 'achievement') => 
  useQuestStore((state) => state.quests.filter(quest => quest.type === type));

export const useActiveQuests = () => useQuestStore((state) => 
  state.quests.filter(quest => quest.status === 'pending' || quest.status === 'in_progress')
);

export const useQuestActions = () => useQuestStore((state) => ({
  addQuest: state.addQuest,
  updateQuest: state.updateQuest,
  completeQuest: state.completeQuest,
  pinQuest: state.pinQuest,
  unpinQuest: state.unpinQuest,
  generateDailyQuests: state.generateDailyQuests,
}));

// Initialize with some default quests if none exist
export const initializeDefaultQuests = () => {
  const store = useQuestStore.getState();
  
  if (store.quests.length === 0) {
    // Add some default achievement quests
    const defaultQuests: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        title: 'First Steps',
        description: 'Log your first trade',
        type: 'achievement',
        status: 'pending',
        progress: 0,
        maxProgress: 1,
        xpReward: 100,
        accountId: 'all',
      },
      {
        title: 'Consistency Builder',
        description: 'Trade for 5 consecutive days',
        type: 'achievement',
        status: 'pending',
        progress: 0,
        maxProgress: 5,
        xpReward: 250,
        accountId: 'all',
      },
      {
        title: 'Risk Manager',
        description: 'Complete 10 trades without exceeding 2% risk',
        type: 'achievement',
        status: 'pending',
        progress: 0,
        maxProgress: 10,
        xpReward: 500,
        accountId: 'all',
      },
    ];

    // Add each quest
    defaultQuests.forEach(quest => {
      store.addQuest(quest);
    });

    // Generate daily quests
    store.generateDailyQuests();
  }
}; 