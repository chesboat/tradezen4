import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MoodType } from '@/types';
import { localStorage, STORAGE_KEYS, generateId } from '@/lib/localStorageUtils';
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
  getMoodTimeline: (date: string) => MoodEntry[];
  cleanupDuplicateMoodEntries: (date: string) => void;
  
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
}

export const useDailyReflectionStore = create<DailyReflectionState>()(
  devtools(
    (set, get) => ({
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

        get().saveToStorage();
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
        get().saveToStorage();
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
        get().saveToStorage();
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
            get().updateReflection(reflection.id, { moodTimeline: updatedMoodTimeline });
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
        get().updateReflection(reflection.id, { moodTimeline: updatedMoodTimeline });
      },

      // Add a mood entry to all accounts in the selection
      addMoodEntryForSelection: (date, mood, trigger, relatedId, timestamp, selectedAccountId) => {
        const ids = getGroupIdsFromAnySelection(selectedAccountId);
        ids.forEach((accountId) => get().addMoodEntry(date, mood, trigger, relatedId, timestamp, accountId));
      },

      getMoodTimeline: (date) => {
        const reflection = get().getReflectionByDate(date);
        return reflection?.moodTimeline || [];
      },

      cleanupDuplicateMoodEntries: (date) => {
        const reflection = get().getReflectionByDate(date);
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

        const sortedReflections = reflections
          .filter(r => r.isComplete)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < sortedReflections.length; i++) {
          const reflectionDate = new Date(sortedReflections[i].date);
          const expectedDate = new Date(today);
          expectedDate.setDate(today.getDate() - i);
          
          if (reflectionDate.toDateString() === expectedDate.toDateString()) {
            streak++;
          } else {
            break;
          }
        }

        return streak;
      },

      markReflectionComplete: (id) => {
        const reflection = get().reflections.find(r => r.id === id);
        if (!reflection) return;

        const xpEarned = 50; // Base XP for completing reflection
        const streakBonus = reflection.streakCount * 5; // Bonus XP for streaks
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
      },

      extractKeyFocus: (aiSummary) => {
        // Simple regex to extract key focus from AI summary
        const focusRegex = /(?:focus|key|priority|important|tomorrow).*?([A-Z][^.!?]*[.!?])/i;
        const match = aiSummary.match(focusRegex);
        
        if (match) {
          return match[1].trim();
        }
        
        // Fallback: take first sentence if no focus found
        const sentences = aiSummary.split(/[.!?]+/);
        return sentences[0]?.trim() + '.' || 'Focus on disciplined trading';
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

      loadFromStorage: () => {
        try {
          const stored = localStorage.getItem(STORAGE_KEYS.DAILY_REFLECTIONS, []);
          if (stored.length > 0) {
            const parsedReflections = stored.map((reflection: any) => ({
              ...reflection,
              keyFocus: typeof reflection.keyFocus === 'string' 
                ? reflection.keyFocus 
                : (reflection.keyFocus && typeof reflection.keyFocus.title === 'string' 
                    ? reflection.keyFocus.title 
                    : (reflection.keyFocus ? JSON.stringify(reflection.keyFocus) : '')),
              reflectionTags: reflection.reflectionTags || [], // Backward compatibility
              createdAt: new Date(reflection.createdAt),
              updatedAt: new Date(reflection.updatedAt),
              completedAt: reflection.completedAt ? new Date(reflection.completedAt) : undefined,
              moodTimeline: reflection.moodTimeline.map((entry: any) => ({
                ...entry,
                timestamp: new Date(entry.timestamp),
              })),
            }));
            set({ reflections: parsedReflections });
          }

          // Load pinned tags
          const storedPinnedTags = localStorage.getItem(`${STORAGE_KEYS.DAILY_REFLECTIONS}_pinned_tags`, []);
          if (storedPinnedTags.length > 0) {
            set({ pinnedTags: storedPinnedTags });
          }
        } catch (error) {
          console.error('Failed to load daily reflections from storage:', error);
        }
      },

      saveToStorage: () => {
        try {
          const { reflections, pinnedTags } = get();
          localStorage.setItem(STORAGE_KEYS.DAILY_REFLECTIONS, reflections);
          localStorage.setItem(`${STORAGE_KEYS.DAILY_REFLECTIONS}_pinned_tags`, pinnedTags);
        } catch (error) {
          console.error('Failed to save daily reflections to storage:', error);
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