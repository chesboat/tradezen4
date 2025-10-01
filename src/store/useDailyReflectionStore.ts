import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MoodType } from '@/types';
import { localStorage, STORAGE_KEYS, generateId } from '@/lib/localStorageUtils';
import { FirestoreService } from '@/lib/firestore';
import { getGroupIdsFromAnySelection } from '@/store/useAccountFilterStore';

interface MoodEntry {
  id: string;
  timestamp: Date;
  mood: MoodType;
  trigger?: string; // What triggered this mood (e.g., "trade-win", "trade-loss", "note")
  relatedId?: string; // ID of related trade or note
}

interface DailyReflectionData {
  id: string;
  date: string; // YYYY-MM-DD format
  reflection: string;
  reflectionRich?: any; // TipTap JSON
  keyFocus: string;
  isComplete: boolean;
  moodTimeline: MoodEntry[];
  streakCount: number;
  xpEarned: number;
  aiSummary?: string;
  goals?: string;
  lessons?: string;
  reflectionTags: string[];
  completedAt?: Date;
  // Dashboard 2.0 state
  planApplied?: boolean;
  planPinnedCount?: number;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DailyReflectionState {
  reflections: DailyReflectionData[];
  currentStreak: number;
  totalReflectionDays: number;
  
  // Global tag filter state
  selectedTagFilter: string | null;
  pinnedTags: string[];
  
  // Actions
  addReflection: (reflection: Omit<DailyReflectionData, 'id' | 'createdAt' | 'updatedAt'>) => DailyReflectionData;
  updateReflection: (id: string, updates: Partial<DailyReflectionData>) => void;
  deleteReflection: (id: string) => void;
  // Group-aware helpers
  upsertReflectionForSelection: (date: string, updates: Partial<DailyReflectionData>, selectedAccountId: string) => void;
  addMoodEntryForSelection: (date: string, mood: MoodType, trigger: string | undefined, relatedId: string | undefined, timestamp: Date | undefined, selectedAccountId: string) => void;
  
  // Mood timeline actions
  addMoodEntry: (date: string, mood: MoodType, trigger?: string, relatedId?: string, timestamp?: Date, accountId?: string) => void;
  getMoodTimeline: (date: string, accountId?: string) => MoodEntry[];
  cleanupDuplicateMoodEntries: (date: string, accountId?: string) => void;
  
  // Reflection queries
  getReflectionByDate: (date: string, accountId?: string) => DailyReflectionData | undefined;
  getReflectionsByAccount: (accountId: string) => DailyReflectionData[];
  getReflectionStreak: (accountId: string) => number;
  
  // Completion tracking
  markReflectionComplete: (id: string) => void;
  
  // Key focus management
  extractKeyFocus: (aiSummary: string) => string;
  getKeyFocusForDate: (date: string) => string | undefined;
  
  // Tag management
  addReflectionTag: (date: string, tag: string, accountId?: string) => void;
  removeReflectionTag: (date: string, tag: string, accountId?: string) => void;
  setReflectionTags: (date: string, tags: string[], accountId?: string) => void;
  getReflectionTags: (date: string, accountId?: string) => string[];
  getAllUsedTags: (accountId?: string) => string[];
  getAllTagsFromAllSources: (accountId?: string) => string[];
  
  // Global tag filter actions
  setSelectedTagFilter: (tag: string | null) => void;
  clearTagFilter: () => void;
  
  // Pinned tag actions
  togglePinnedTag: (tag: string) => void;
  getPinnedTags: () => string[];
  getTagFrequency: (tag: string, accountId?: string) => number;
  
  // Analytics
  getReflectionStats: () => {
    totalReflections: number;
    currentStreak: number;
    averageReflectionLength: number;
    mostCommonMood: MoodType;
    totalXPEarned: number;
  };
  
  // Utilities
  loadFromStorage: () => void;
  saveToStorage: () => void;
  subscribeRemote?: () => () => void;
  migrateLegacyLocalToFirestore?: () => Promise<void>;
}

export const useDailyReflectionStore = create<DailyReflectionState>()(
  devtools(
    (set, get) => ({
      // Cloud-first: use Firestore as source of truth
      _remoteService: new FirestoreService<any>('dailyReflections'),
      reflections: [],
      currentStreak: 0,
      totalReflectionDays: 0,
      selectedTagFilter: null,
      pinnedTags: [],

      addReflection: (reflectionData) => {
        const newReflection: DailyReflectionData = {
          ...reflectionData,
          reflectionTags: reflectionData.reflectionTags || [],
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          reflections: [newReflection, ...state.reflections],
          totalReflectionDays: state.totalReflectionDays + 1,
        }));
        // Remote upsert (fire-and-forget)
        try {
          const svc: FirestoreService<any> = (get() as any)._remoteService;
          const payload = {
            ...newReflection,
            createdAt: newReflection.createdAt.toISOString(),
            updatedAt: newReflection.updatedAt.toISOString(),
          } as any;
          svc.setWithId(newReflection.id, payload);
        } catch (e) {
          console.warn('[dailyReflections] remote create deferred:', e);
        }
        return newReflection;
      },

      updateReflection: (id, updates) => {
        set((state) => ({
          reflections: state.reflections.map((reflection) =>
            reflection.id === id
              ? { ...reflection, ...updates, updatedAt: new Date() }
              : reflection
          ),
        }));
        // Remote update
        try {
          const svc: FirestoreService<any> = (get() as any)._remoteService;
          const prepared: any = { ...updates };
          if (prepared.updatedAt instanceof Date) prepared.updatedAt = prepared.updatedAt.toISOString();
          if (prepared.createdAt instanceof Date) prepared.createdAt = prepared.createdAt.toISOString();
          svc.update(id, prepared);
        } catch (e) {
          console.warn('[dailyReflections] remote update deferred:', e);
        }
      },

      // Create or update the same reflection data across a selection (single or group)
      upsertReflectionForSelection: (date, updates, selectedAccountId) => {
        const normalizeKeyFocus = (val: any): string => {
          if (typeof val === 'string') return val;
          if (!val) return '';
          if (typeof (val as any).title === 'string') return (val as any).title as string;
          try { return JSON.stringify(val); } catch { return String(val); }
        };
        const groupIds = getGroupIdsFromAnySelection(selectedAccountId);
        const { reflections } = get();
        const now = new Date();
        const ensure = (accountId: string) => {
          let ref = reflections.find(r => r.date === date && r.accountId === accountId);
          if (!ref) {
            ref = get().addReflection({
              date,
              reflection: updates.reflection ?? '',
              reflectionRich: (updates as any).reflectionRich,
              keyFocus: normalizeKeyFocus(updates.keyFocus),
              isComplete: updates.isComplete ?? false,
              moodTimeline: updates.moodTimeline ?? [],
              streakCount: 0,
              xpEarned: 0,
              aiSummary: updates.aiSummary,
              goals: updates.goals,
              lessons: updates.lessons,
              reflectionTags: updates.reflectionTags ?? [],
              accountId,
            });
          } else {
            const nextUpdates = { ...updates } as any;
            if (Object.prototype.hasOwnProperty.call(nextUpdates, 'keyFocus')) {
              nextUpdates.keyFocus = normalizeKeyFocus(nextUpdates.keyFocus);
            }
            get().updateReflection(ref.id, { ...nextUpdates, updatedAt: now });
          }
        };
        groupIds.forEach(ensure);
      },

      deleteReflection: (id) => {
        set((state) => ({
          reflections: state.reflections.filter((reflection) => reflection.id !== id),
        }));
        try {
          const svc: FirestoreService<any> = (get() as any)._remoteService;
          svc.delete(id);
        } catch (e) {
          console.warn('[dailyReflections] remote delete deferred:', e);
        }
      },

      addMoodEntry: (date, mood, trigger, relatedId, timestamp, accountId) => {
        let reflection = get().getReflectionByDate(date, accountId);
        
        // Create a minimal reflection if none exists (for wellness activities)
        if (!reflection) {
          const useAccountId = accountId || 'default';
          reflection = get().addReflection({
            date,
            reflection: '',
            keyFocus: '',
            isComplete: false,
            moodTimeline: [],
            streakCount: 0,
            xpEarned: 0,
            reflectionTags: [],
            accountId: useAccountId,
          });
        }

        // Check if mood entry already exists for this related item
        if (relatedId) {
          const existingEntry = reflection.moodTimeline.find(
            entry => entry.relatedId === relatedId && entry.trigger === trigger
          );
          if (existingEntry) {
            // Update existing entry mood only, preserve original timestamp
            const updatedMoodTimeline = reflection.moodTimeline.map(entry =>
              entry.id === existingEntry.id
                ? { ...entry, mood }
                : entry
            );
            
            // Serialize dates for Firestore
            const serializedTimeline = updatedMoodTimeline.map(entry => ({
              ...entry,
              timestamp: entry.timestamp instanceof Date ? entry.timestamp.toISOString() : entry.timestamp
            }));
            
            get().updateReflection(reflection.id, { moodTimeline: serializedTimeline as any });
            return;
          }
        }

        const newMoodEntry: MoodEntry = {
          id: generateId(),
          timestamp: timestamp || new Date(),
          mood,
          trigger,
          relatedId,
        };

        const updatedMoodTimeline = [...reflection.moodTimeline, newMoodEntry];
        
        // Serialize dates for Firestore - convert Date objects to ISO strings
        const serializedTimeline = updatedMoodTimeline.map(entry => ({
          ...entry,
          timestamp: entry.timestamp instanceof Date ? entry.timestamp.toISOString() : entry.timestamp
        }));
        
        get().updateReflection(reflection.id, { moodTimeline: serializedTimeline as any });
      },

      // Add a mood entry to all accounts in the selection
      addMoodEntryForSelection: (date, mood, trigger, relatedId, timestamp, selectedAccountId) => {
        const ids = getGroupIdsFromAnySelection(selectedAccountId);
        ids.forEach((accountId) => get().addMoodEntry(date, mood, trigger, relatedId, timestamp, accountId));
      },

      getMoodTimeline: (date, accountId) => {
        const reflection = get().getReflectionByDate(date, accountId);
        return reflection?.moodTimeline || [];
      },

      cleanupDuplicateMoodEntries: (date, accountId) => {
        const reflection = get().getReflectionByDate(date, accountId);
        if (!reflection) return;

        // Remove duplicates based on relatedId + trigger combination
        const uniqueEntries: MoodEntry[] = [];
        const seen = new Set<string>();

        for (const entry of reflection.moodTimeline) {
          const key = `${entry.relatedId}-${entry.trigger}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueEntries.push(entry);
          }
        }

        if (uniqueEntries.length !== reflection.moodTimeline.length) {
          get().updateReflection(reflection.id, { moodTimeline: uniqueEntries });
        }
      },

      getReflectionByDate: (date, accountId) => {
        const { reflections } = get();
        return reflections.find((reflection) => 
          reflection.date === date && (!accountId || reflection.accountId === accountId)
        );
      },

      getReflectionsByAccount: (accountId) => {
        const { reflections } = get();
        return reflections.filter((reflection) => reflection.accountId === accountId);
      },

      getReflectionStreak: (accountId) => {
        const reflections = get().getReflectionsByAccount(accountId);
        if (reflections.length === 0) return 0;

        // Get trades for this account to identify trading days
        const { useTradeStore } = require('@/store/useTradeStore');
        const allTrades = useTradeStore.getState().trades.filter((t: any) => t.accountId === accountId);
        
        // Get weekly reviews for this account
        const { useWeeklyReviewStore } = require('@/store/useWeeklyReviewStore');
        const weeklyReviews = useWeeklyReviewStore.getState().reviews.filter(
          (r: any) => r.accountId === accountId && r.isComplete
        );
        
        // Helper: Get Monday of week for a date
        const getMondayOfWeek = (date: Date): string => {
          const d = new Date(date);
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          d.setDate(diff);
          return d.toISOString().split('T')[0];
        };
        
        // Helper: Check if date has a trade
        const hasTrade = (dateStr: string): boolean => {
          return allTrades.some((t: any) => {
            const tradeDate = new Date(t.entryTime).toISOString().split('T')[0];
            return tradeDate === dateStr;
          });
        };
        
        // Helper: Check if date has meaningful reflection
        const hasReflection = (dateStr: string): boolean => {
          const reflection = reflections.find(r => r.date === dateStr);
          return Boolean(reflection && (
            (reflection.reflection && reflection.reflection.trim().length > 0) ||
            (reflection.keyFocus && reflection.keyFocus.trim().length > 0) ||
            (reflection.goals && reflection.goals.trim().length > 0) ||
            (reflection.lessons && reflection.lessons.trim().length > 0)
          ));
        };
        
        // Helper: Check if week has completed weekly review
        const hasWeeklyReview = (weekStart: string): boolean => {
          return weeklyReviews.some((r: any) => r.weekOf === weekStart);
        };
        
        let streak = 0;
        const today = new Date();
        let currentDate = new Date(today);
        
        // Track weekly periods to give credit for weekly reviews
        let currentWeekStart = getMondayOfWeek(currentDate);
        let weekHasTrades = false;
        let weekHasReflection = false;
        
        // Walk backwards day by day
        for (let i = 0; i < 365; i++) { // Max 1 year lookback
          const dateStr = currentDate.toISOString().split('T')[0];
          const weekStart = getMondayOfWeek(currentDate);
          
          // If we've moved to a new week, check if previous week qualifies
          if (weekStart !== currentWeekStart && i > 0) {
            // Previous week validation
            if (weekHasTrades && !weekHasReflection) {
              // Traded but didn't reflect at all that week
              // Check if they at least did a weekly review
              if (!hasWeeklyReview(currentWeekStart)) {
                break; // Streak broken
              }
            } else if (!weekHasTrades && !weekHasReflection) {
              // No trades and no reflections - check for weekly review
              if (!hasWeeklyReview(currentWeekStart)) {
                break; // Streak broken (inactive week without review)
              }
            }
            // Reset for new week
            currentWeekStart = weekStart;
            weekHasTrades = false;
            weekHasReflection = false;
          }
          
          const tradedToday = hasTrade(dateStr);
          const reflectedToday = hasReflection(dateStr);
          
          if (tradedToday) {
            weekHasTrades = true;
            if (reflectedToday) {
              weekHasReflection = true;
              streak++;
            } else {
              // Traded but no reflection - streak in jeopardy
              // Will check at week end if weekly review saves it
            }
          } else if (reflectedToday) {
            // Reflection on non-trading day still counts
            weekHasReflection = true;
            streak++;
          }
          
          currentDate.setDate(currentDate.getDate() - 1);
        }

        return streak;
      },

      markReflectionComplete: (id) => {
        const reflection = get().reflections.find(r => r.id === id);
        if (!reflection) return;

        const xpEarned = 75; // Base XP for completing reflection (matches XpRewards.DAILY_REFLECTION)
        const streakBonus = reflection.streakCount * 10; // Streak bonus (matches XpRewards.REFLECTION_STREAK)
        const totalXP = xpEarned + streakBonus;

        get().updateReflection(id, {
          isComplete: true,
          completedAt: new Date(),
          xpEarned: totalXP,
        });

        // Update streak
        const newStreak = get().getReflectionStreak(reflection.accountId);
        set(() => ({
          currentStreak: newStreak,
        }));

        // Award XP through the prestige system
        import('@/lib/xp/XpService').then(({ awardXp }) => {
          awardXp.dailyReflection().catch((e) => {
            console.error('❌ Failed to award daily reflection XP:', e);
          });
        });
      },

      extractKeyFocus: (aiSummary) => {
        if (!aiSummary || typeof aiSummary !== 'string') return 'Focus on disciplined trading';
        // Clean leading artifacts
        let text = aiSummary.replace(/^['`’\-\s]*s\s+/i, '').trim();
        // Prefer a line starting with Focus/Goal/Priority
        const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
        const focusLine = lines.find(l => /^(focus|goal|priority|tomorrow)/i.test(l));
        if (focusLine) return focusLine.replace(/^(focus|goal|priority|tomorrow)[:\-\s]*/i, '').trim();
        // Otherwise use first complete sentence
        const sentenceMatch = text.match(/^[A-Z][^.!?]*[.!?]/);
        if (sentenceMatch) return sentenceMatch[0].trim();
        return 'Focus on disciplined trading';
      },

      getKeyFocusForDate: (date) => {
        const reflection = get().getReflectionByDate(date);
        return reflection?.keyFocus;
      },

      // Tag management methods
      addReflectionTag: (date, tag, accountId) => {
        const reflection = get().getReflectionByDate(date, accountId);
        if (!reflection) return;

        const trimmedTag = tag.trim();
        if (!trimmedTag) return;

        const currentTags = reflection.reflectionTags || [];
        if (currentTags.includes(trimmedTag)) return; // Don't add duplicates

        const updatedTags = [...currentTags, trimmedTag];
        get().updateReflection(reflection.id, { reflectionTags: updatedTags });
      },

      removeReflectionTag: (date, tag, accountId) => {
        const reflection = get().getReflectionByDate(date, accountId);
        if (!reflection) return;

        const currentTags = reflection.reflectionTags || [];
        const updatedTags = currentTags.filter(t => t !== tag);
        get().updateReflection(reflection.id, { reflectionTags: updatedTags });
      },

      setReflectionTags: (date, tags, accountId) => {
        const reflection = get().getReflectionByDate(date, accountId);
        if (!reflection) return;

        const trimmedTags = tags.map(tag => tag.trim()).filter(Boolean);
        const uniqueTags = [...new Set(trimmedTags)]; // Remove duplicates
        get().updateReflection(reflection.id, { reflectionTags: uniqueTags });
      },

      getReflectionTags: (date, accountId) => {
        const reflection = get().getReflectionByDate(date, accountId);
        return reflection?.reflectionTags || [];
      },

      getAllUsedTags: (accountId) => {
        const { reflections } = get();
        const filteredReflections = accountId 
          ? reflections.filter(r => r.accountId === accountId)
          : reflections;

        const allTags = filteredReflections
          .flatMap(r => r.reflectionTags || [])
          .filter(Boolean);

        return [...new Set(allTags)].sort(); // Remove duplicates and sort
      },

      getAllTagsFromAllSources: (accountId) => {
        // Get reflection tags
        const reflectionTags = get().getAllUsedTags(accountId);
        
        // Get quick note tags from the QuickNoteStore
        // We'll need to import this or access it differently
        // For now, let's return reflection tags and we'll enhance this in the component
        return reflectionTags;
      },

      setSelectedTagFilter: (tag) => {
        set({ selectedTagFilter: tag });
      },

      clearTagFilter: () => {
        set({ selectedTagFilter: null });
      },

      togglePinnedTag: (tag) => {
        const { pinnedTags } = get();
        const isPinned = pinnedTags.includes(tag);
        
        const updatedPinnedTags = isPinned
          ? pinnedTags.filter(t => t !== tag)
          : [...pinnedTags, tag];
        
        set({ pinnedTags: updatedPinnedTags });
        get().saveToStorage();
      },

      getPinnedTags: () => {
        return get().pinnedTags;
      },

      getTagFrequency: (tag, accountId) => {
        const { reflections } = get();
        const filteredReflections = accountId 
          ? reflections.filter(r => r.accountId === accountId)
          : reflections;

        // Count occurrences in reflections
        const reflectionCount = filteredReflections.filter(r => 
          r.reflectionTags?.includes(tag)
        ).length;

        // Count occurrences in quick notes (we'll need to access this from the component)
        // For now, just return reflection count
        return reflectionCount;
      },

      getReflectionStats: () => {
        const { reflections } = get();
        const completedReflections = reflections.filter(r => r.isComplete);
        
        const totalReflections = completedReflections.length;
        const averageReflectionLength = totalReflections > 0 
          ? completedReflections.reduce((sum, r) => sum + r.reflection.length, 0) / totalReflections
          : 0;
        
        // Calculate most common mood
        const moodCounts: Record<MoodType, number> = {
          excellent: 0,
          good: 0,
          neutral: 0,
          poor: 0,
          terrible: 0,
        };

        completedReflections.forEach(reflection => {
          reflection.moodTimeline.forEach(entry => {
            moodCounts[entry.mood]++;
          });
        });

        const mostCommonMood = Object.entries(moodCounts)
          .reduce((a, b) => a[1] > b[1] ? a : b)[0] as MoodType;

        const totalXPEarned = completedReflections.reduce((sum, r) => sum + r.xpEarned, 0);

        return {
          totalReflections,
          currentStreak: get().currentStreak,
          averageReflectionLength,
          mostCommonMood,
          totalXPEarned,
        };
      },

      // Disable localStorage persistence (cloud-first)
      loadFromStorage: () => {},
      saveToStorage: () => {},

      // Real-time subscription to Firestore
      subscribeRemote: () => {
        try {
          const svc: FirestoreService<any> = (get() as any)._remoteService;
          const unsub = svc.listenAll((docs: any[]) => {
            const parsed = docs.map((d) => ({
              ...d,
              createdAt: new Date(d.createdAt),
              updatedAt: new Date(d.updatedAt),
              completedAt: d.completedAt ? new Date(d.completedAt) : undefined,
              moodTimeline: (d.moodTimeline || []).map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp),
              })),
            })) as DailyReflectionData[];
            set({ reflections: parsed });
          });
          return unsub;
        } catch (e) {
          console.warn('[dailyReflections] subscribe failed:', e);
          return () => {};
        }
      },

      // One-time migration of legacy localStorage reflections to Firestore
      migrateLegacyLocalToFirestore: async () => {
        try {
          const migratedFlag = localStorage.getItem(`${STORAGE_KEYS.DAILY_REFLECTIONS}_migrated`, false as any);
          if (migratedFlag) return; // already migrated
          const legacy = localStorage.getItem(STORAGE_KEYS.DAILY_REFLECTIONS, [] as any[]);
          if (!legacy || legacy.length === 0) {
            localStorage.setItem(`${STORAGE_KEYS.DAILY_REFLECTIONS}_migrated`, true as any);
            return;
          }
          const svc: FirestoreService<any> = (get() as any)._remoteService;
          for (const r of legacy as any[]) {
            try {
              const payload = {
                ...r,
                createdAt: (r.createdAt && typeof r.createdAt === 'string') ? r.createdAt : new Date(r.createdAt).toISOString(),
                updatedAt: (r.updatedAt && typeof r.updatedAt === 'string') ? r.updatedAt : new Date(r.updatedAt).toISOString(),
                completedAt: r.completedAt ? (typeof r.completedAt === 'string' ? r.completedAt : new Date(r.completedAt).toISOString()) : undefined,
                moodTimeline: (r.moodTimeline || []).map((m: any) => ({
                  ...m,
                  timestamp: (m.timestamp && typeof m.timestamp === 'string') ? m.timestamp : new Date(m.timestamp).toISOString(),
                })),
              };
              await svc.setWithId(r.id, payload as any);
            } catch (e) {
              console.warn('[dailyReflections] migrate entry failed:', e);
            }
          }
          localStorage.setItem(`${STORAGE_KEYS.DAILY_REFLECTIONS}_migrated`, true as any);
        } catch (e) {
          console.warn('[dailyReflections] migration failed:', e);
        }
      },
    }),
    {
      name: 'daily-reflection-store',
    }
  )
);

// Load from storage on initial load
useDailyReflectionStore.getState().loadFromStorage(); 