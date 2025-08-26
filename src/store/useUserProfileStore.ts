import { create } from 'zustand';
import { useActivityLogStore } from './useActivityLogStore';
import { useQuestStore } from './useQuestStore';
import { localStorage, STORAGE_KEYS } from '@/lib/localStorageUtils';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { levelFromTotalXp, canPrestige, xpToNextLevel, getLevelProgress } from '@/lib/xp/math';

export interface XpHistoryEntry {
  type: 'gain' | 'levelup' | 'prestige';
  delta?: number;
  at: Date;
  meta?: any;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email?: string;
  xp: {
    total: number;        // Lifetime XP (never resets)
    seasonXp: number;     // Current season XP (resets on prestige)
    level: number;        // Current display level (1-30)
    prestige: number;     // Prestige count (0+)
    canPrestige: boolean; // Can user prestige now?
    lastLevelUpAt?: Date; // For debouncing level up effects
    lastPrestigedAt?: Date; // When user last prestiged
    history: XpHistoryEntry[]; // Recent XP history (max 200 entries)
  };
  joinedAt: Date;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    autoBackup: boolean;
  };
  stats: {
    totalTrades: number;
    totalQuests: number;
    totalWellnessActivities: number;
    totalReflections: number;
    currentStreak: number;
    longestStreak: number;
  };
}

interface UserProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  
  // Actions
  initializeProfile: (userId: string, email?: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateDisplayName: (name: string) => void;
  addXP: (delta: number, meta?: any) => Promise<void>;
  prestige: () => Promise<void>;
  refreshStats: () => void;
  saveToStorage: () => void;
  loadFromStorage: (userId: string) => UserProfile | null;
  syncToFirestore: () => Promise<void>;
  loadFromFirestore: (userId: string) => Promise<UserProfile | null>;
  
  // Legacy methods for backward compatibility
  calculateTotalXP: () => number;
  calculateLevel: (xp: number) => { level: number; xpToNextLevel: number };
}

// Helper function to trim XP history to max 200 entries
function trimXpHistory(history: XpHistoryEntry[]): XpHistoryEntry[] {
  return history.slice(-200);
}

export const useUserProfileStore = create<UserProfileState>((set, get) => ({
  profile: null,
  isLoading: false,

  initializeProfile: async (userId, email) => {
    set({ isLoading: true });
    
    try {
      // Try to load from Firestore first
      let profile = await get().loadFromFirestore(userId);
      
      // If not in Firestore, try localStorage
      if (!profile) {
        profile = get().loadFromStorage(userId);
      }
      
      if (!profile) {
        // Create new profile with prestige system
        profile = {
          id: userId,
          displayName: email?.split('@')[0] || 'Trader',
          email,
          xp: {
            total: 0,
            seasonXp: 0,
            level: 1,
            prestige: 0,
            canPrestige: false,
            history: []
          },
          joinedAt: new Date(),
          preferences: {
            theme: 'system',
            notifications: true,
            autoBackup: true,
          },
          stats: {
            totalTrades: 0,
            totalQuests: 0,
            totalWellnessActivities: 0,
            totalReflections: 0,
            currentStreak: 0,
            longestStreak: 0,
          },
        };
      }
      
      set({ profile, isLoading: false });
      get().saveToStorage();
      
      // Ensure xp/status doc exists and attach realtime subscription
      try {
        const { XpService } = await import('@/lib/xp/XpService');
        const unsub = XpService.subscribe(({ total, seasonXp, level, prestige }) => {
          const current = get().profile;
          if (!current) return;
          const updated: UserProfile = {
            ...current,
            xp: {
              ...current.xp,
              total,
              seasonXp,
              // Derive level locally until server-side is added
              level: levelFromTotalXp(seasonXp).level,
              prestige,
              canPrestige: canPrestige(seasonXp),
            },
          };
          set({ profile: updated });
          get().saveToStorage();
        });
        // Optionally store unsub if needed later
        (window as any).__xpUnsub = unsub;
      } catch (e) {
        console.warn('XP subscribe failed (will still use local xp):', e);
      }

      // Sync to Firestore (profile fields)
      await get().syncToFirestore();
      
      // Refresh stats and XP
      get().refreshStats();
    } catch (error) {
      console.error('Failed to initialize profile:', error);
      set({ isLoading: false });
    }
  },

  updateProfile: (updates) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null,
    }));
    get().saveToStorage();
    // Sync to Firestore in background
    get().syncToFirestore().catch(console.error);
  },

  updateDisplayName: (name) => {
    get().updateProfile({ displayName: name });
  },

  addXP: async (delta: number, meta?: any) => {
    const { profile } = get();
    if (!profile || !Number.isFinite(delta) || delta <= 0) return;

    const oldLevel = profile.xp.level;
    const newSeasonXp = Math.max(0, profile.xp.seasonXp + delta);
    const newTotalXp = Math.max(0, profile.xp.total + delta);
    
    // Calculate new level from season XP
    const { level: newLevel } = levelFromTotalXp(newSeasonXp);
    const leveledUp = newLevel > oldLevel;
    
    // Create history entries
    const now = new Date();
    const newHistory = [...profile.xp.history];
    
    // Add gain entry
    newHistory.push({
      type: 'gain',
      delta,
      at: now,
      meta
    });
    
    // Add level up entry if applicable
    if (leveledUp) {
      newHistory.push({
        type: 'levelup',
        at: now,
        meta: { fromLevel: oldLevel, toLevel: newLevel }
      });
    }
    
    // Update profile
    const updatedProfile: UserProfile = {
      ...profile,
      xp: {
        ...profile.xp,
        total: newTotalXp,
        seasonXp: newSeasonXp,
        level: newLevel,
        canPrestige: canPrestige(newSeasonXp),
        lastLevelUpAt: leveledUp ? now : profile.xp.lastLevelUpAt,
        history: trimXpHistory(newHistory)
      }
    };
    
    set({ profile: updatedProfile });
    
    // Debug logging
    console.log('🎯 XP Updated:', {
      delta,
      oldXp: profile.xp.seasonXp,
      newXp: newSeasonXp,
      oldLevel: oldLevel,
      newLevel: newLevel,
      progressPct: getLevelProgress(newSeasonXp)
    });
    
    get().saveToStorage();
    
    // Sync to Firestore in background
    try {
      await get().syncToFirestore();
    } catch (error) {
      console.error('Failed to sync XP to Firestore:', error);
    }
  },

  prestige: async () => {
    const { profile } = get();
    if (!profile || !profile.xp.canPrestige) {
      throw new Error('Cannot prestige: not eligible');
    }

    const now = new Date();
    const newPrestige = profile.xp.prestige + 1;
    
    // Create prestige history entry
    const newHistory = [...profile.xp.history];
    newHistory.push({
      type: 'prestige',
      at: now,
      meta: { 
        fromLevel: profile.xp.level, 
        prestige: newPrestige,
        seasonXpReset: profile.xp.seasonXp
      }
    });
    
    // Reset season XP and level, increment prestige
    const updatedProfile: UserProfile = {
      ...profile,
      xp: {
        ...profile.xp,
        seasonXp: 0,
        level: 1,
        prestige: newPrestige,
        canPrestige: false,
        lastPrestigedAt: now,
        history: trimXpHistory(newHistory)
      }
    };
    
    set({ profile: updatedProfile });
    get().saveToStorage();
    
    // Sync to Firestore
    try {
      await get().syncToFirestore();
    } catch (error) {
      console.error('Failed to sync prestige to Firestore:', error);
      throw error;
    }
  },

  // Legacy methods for backward compatibility
  calculateTotalXP: () => {
    const { profile } = get();
    return profile?.xp.total || 0;
  },

  calculateLevel: (xp) => {
    const { level } = levelFromTotalXp(xp);
    const xpToNext = xpToNextLevel(xp);
    return { level, xpToNextLevel: xpToNext };
  },

  refreshStats: () => {
    const { profile } = get();
    if (!profile) return;

    // Get activities for stats only; do NOT touch xp/level fields here
    const activities = useActivityLogStore.getState().activities;
    const trades = activities.filter(a => a.type === 'trade');
    const quests = useQuestStore.getState().quests.filter(q => q.status === 'completed');
    const wellnessActivities = activities.filter(a => a.type === 'wellness');
    const reflections = activities.filter(a => a.type === 'reflection');
    
    // Calculate streaks (simplified - could be more sophisticated)
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    const todayActivities = activities.filter(a => 
      new Date(a.createdAt).toDateString() === today
    );
    const yesterdayActivities = activities.filter(a => 
      new Date(a.createdAt).toDateString() === yesterday
    );
    
    let currentStreak = 0;
    if (todayActivities.length > 0) {
      currentStreak = 1;
      if (yesterdayActivities.length > 0) {
        // Could implement more sophisticated streak calculation here
        currentStreak = Math.min(profile.stats.currentStreak + 1, 365);
      }
    }

    set({
      profile: {
        ...profile,
        stats: {
          totalTrades: trades.length,
          totalQuests: quests.length,
          totalWellnessActivities: wellnessActivities.length,
          totalReflections: reflections.length,
          currentStreak,
          longestStreak: Math.max(profile.stats.longestStreak, currentStreak),
        },
      },
    });
    get().saveToStorage();
    // Sync derived stats only; xp fields remain untouched
    get().syncToFirestore().catch(() => {});
  },

  saveToStorage: () => {
    const { profile } = get();
    if (profile) {
      console.log('💾 saveToStorage XP snapshot:', {
        seasonXp: profile.xp?.seasonXp,
        totalXp: profile.xp?.total,
        level: profile.xp?.level,
        prestige: profile.xp?.prestige,
      });
      localStorage.setItem(`${STORAGE_KEYS.USER_PROFILE}_${profile.id}`, profile);
    }
  },

  loadFromStorage: (userId) => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.USER_PROFILE}_${userId}`, null as UserProfile | null);
      if (stored) {
        console.log('📥 loadFromStorage XP snapshot:', {
          seasonXp: stored.xp?.seasonXp,
          totalXp: stored.xp?.total,
          level: stored.xp?.level,
          prestige: stored.xp?.prestige,
        });
        const profile: UserProfile = {
          ...stored,
          joinedAt: stored.joinedAt instanceof Date ? stored.joinedAt : new Date(stored.joinedAt || new Date()),
        };
        set({ profile });
        return profile;
      }
    } catch (error) {
      console.error('Failed to load user profile from storage:', error);
    }
    return null;
  },

  syncToFirestore: async () => {
    const { profile } = get();
    if (!profile) return;

    try {
      console.log('🔐 syncToFirestore writing XP:', {
        seasonXp: profile.xp?.seasonXp,
        totalXp: profile.xp?.total,
        level: profile.xp?.level,
        prestige: profile.xp?.prestige,
      });
      const profileDoc = doc(db, 'userProfiles', profile.id);
      // Avoid writing legacy fields; write xp in xp/status listener path instead
      await setDoc(profileDoc, {
        id: profile.id,
        displayName: profile.displayName,
        email: profile.email,
        joinedAt: profile.joinedAt instanceof Date ? profile.joinedAt.toISOString() : profile.joinedAt,
        preferences: profile.preferences,
        stats: profile.stats,
        // updatedAt last to avoid duplicate keys
        updatedAt: serverTimestamp(),
      }, { merge: true });
      console.log('Profile synced to Firestore');
    } catch (error) {
      console.error('Failed to sync profile to Firestore:', error);
    }
  },

  loadFromFirestore: async (userId) => {
    try {
      const profileDoc = doc(db, 'userProfiles', userId);
      const docSnap = await getDoc(profileDoc);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('🧲 loadFromFirestore read XP:', {
          seasonXp: (data as any)?.xp?.seasonXp,
          totalXp: (data as any)?.xp?.total,
          level: (data as any)?.xp?.level,
          prestige: (data as any)?.xp?.prestige,
        });
        
        // Ensure XP object is properly initialized
        const rawXp = (data as any)?.xp || {};
        const seasonXp = rawXp.seasonXp || 0;
        const totalXp = rawXp.total || 0;
        const prestige = rawXp.prestige || 0;
        const level = rawXp.level || levelFromTotalXp(seasonXp).level;
        
        const profile: UserProfile = {
          ...data,
          joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
          xp: {
            total: totalXp,
            seasonXp: seasonXp,
            level: level,
            prestige: prestige,
            canPrestige: canPrestige(seasonXp),
            history: rawXp.history || [],
            lastLevelUpAt: rawXp.lastLevelUpAt ? new Date(rawXp.lastLevelUpAt) : undefined,
            lastPrestigedAt: rawXp.lastPrestigedAt ? new Date(rawXp.lastPrestigedAt) : undefined,
          }
        } as UserProfile;
        
        set({ profile });
        return profile;
      }
    } catch (error) {
      console.error('Failed to load profile from Firestore:', error);
    }
    return null;
  },

  // Legacy addXP removed to avoid shadowing new prestige XP method
}));

// Helper function to get user's display name
export const getUserDisplayName = (): string => {
  const profile = useUserProfileStore.getState().profile;
  return profile?.displayName || 'Trader';
};

// Helper function to get formatted level display
export const getFormattedLevel = (): string => {
  const profile = useUserProfileStore.getState().profile;
  if (!profile?.xp) return 'Level 1 • 0 XP';
  
  return `Level ${profile.xp.level} • ${profile.xp.seasonXp.toLocaleString()} Season XP`;
};

// Helper function to get XP progress percentage
export const getXPProgressPercentage = (): number => {
  const profile = useUserProfileStore.getState().profile;
  if (!profile?.xp) return 0;
  
  const { progressPct } = levelFromTotalXp(profile.xp.seasonXp);
  return progressPct;
};
