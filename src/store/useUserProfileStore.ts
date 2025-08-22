import { create } from 'zustand';
import { useActivityLogStore } from './useActivityLogStore';
import { useQuestStore } from './useQuestStore';
import { localStorage, STORAGE_KEYS } from '@/lib/localStorageUtils';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  displayName: string;
  email?: string;
  totalXP: number;
  level: number;
  xpToNextLevel: number;
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
  calculateTotalXP: () => number;
  calculateLevel: (xp: number) => { level: number; xpToNextLevel: number };
  refreshStats: () => void;
  saveToStorage: () => void;
  loadFromStorage: (userId: string) => UserProfile | null;
  syncToFirestore: () => Promise<void>;
  loadFromFirestore: (userId: string) => Promise<UserProfile | null>;
}

// XP required for each level (exponential growth)
const XP_PER_LEVEL = [
  0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 
  3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450,
  11500, 12600, 13750, 14950, 16200, 17500, 18850, 20250, 21700, 23200,
  // Continue pattern for higher levels
];

// Generate XP requirements for levels beyond predefined array
const getXPForLevel = (level: number): number => {
  if (level < XP_PER_LEVEL.length) {
    return XP_PER_LEVEL[level];
  }
  // Formula for higher levels: base + (level * increment)
  const baseXP = XP_PER_LEVEL[XP_PER_LEVEL.length - 1];
  const additionalLevels = level - (XP_PER_LEVEL.length - 1);
  return baseXP + (additionalLevels * 1000);
};

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
        // Create new profile
        profile = {
          id: userId,
          displayName: email?.split('@')[0] || 'Trader',
          email,
          totalXP: 0,
          level: 1,
          xpToNextLevel: 100,
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
      
      // Sync to Firestore
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

  calculateTotalXP: () => {
    // Get XP from all activities
    const activities = useActivityLogStore.getState().activities;
    const totalActivityXP = activities.reduce((sum, activity) => sum + (activity.xpEarned || 0), 0);
    
    // Get XP from completed quests
    const quests = useQuestStore.getState().quests;
    const completedQuestXP = quests
      .filter(quest => quest.status === 'completed')
      .reduce((sum, quest) => sum + quest.xpReward, 0);
    
    return totalActivityXP + completedQuestXP;
  },

  calculateLevel: (xp) => {
    let level = 1;
    let xpRequired = 0;
    
    // Find the highest level the user has reached
    while (xp >= getXPForLevel(level)) {
      level++;
    }
    
    // Calculate XP needed for next level
    const currentLevelXP = level > 1 ? getXPForLevel(level - 1) : 0;
    const nextLevelXP = getXPForLevel(level);
    const xpToNextLevel = nextLevelXP - xp;
    
    return { level: level, xpToNextLevel };
  },

  refreshStats: () => {
    const { profile } = get();
    if (!profile) return;

    // Calculate total XP
    const totalXP = get().calculateTotalXP();
    
    // Calculate level
    const { level, xpToNextLevel } = get().calculateLevel(totalXP);
    
    // Get activities for stats
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

    const updatedProfile: UserProfile = {
      ...profile,
      totalXP,
      level,
      xpToNextLevel,
      stats: {
        totalTrades: trades.length,
        totalQuests: quests.length,
        totalWellnessActivities: wellnessActivities.length,
        totalReflections: reflections.length,
        currentStreak,
        longestStreak: Math.max(profile.stats.longestStreak, currentStreak),
      },
    };

    set({ profile: updatedProfile });
    get().saveToStorage();
  },

  saveToStorage: () => {
    const { profile } = get();
    if (profile) {
      localStorage.setItem(`${STORAGE_KEYS.USER_PROFILE}_${profile.id}`, profile);
    }
  },

  loadFromStorage: (userId) => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEYS.USER_PROFILE}_${userId}`, null as UserProfile | null);
      if (stored) {
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
      const profileDoc = doc(db, 'userProfiles', profile.id);
      await setDoc(profileDoc, {
        ...profile,
        joinedAt: profile.joinedAt instanceof Date ? profile.joinedAt.toISOString() : profile.joinedAt,
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
        const profile: UserProfile = {
          ...data,
          joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
        } as UserProfile;
        
        set({ profile });
        return profile;
      }
    } catch (error) {
      console.error('Failed to load profile from Firestore:', error);
    }
    return null;
  },
}));

// Helper function to get user's display name
export const getUserDisplayName = (): string => {
  const profile = useUserProfileStore.getState().profile;
  return profile?.displayName || 'Trader';
};

// Helper function to get formatted level display
export const getFormattedLevel = (): string => {
  const profile = useUserProfileStore.getState().profile;
  if (!profile) return 'Level 1 • 0 XP';
  
  return `Level ${profile.level} • ${profile.totalXP.toLocaleString()} XP`;
};

// Helper function to get XP progress percentage
export const getXPProgressPercentage = (): number => {
  const profile = useUserProfileStore.getState().profile;
  if (!profile) return 0;
  
  const currentLevelXP = profile.level > 1 ? getXPForLevel(profile.level - 1) : 0;
  const nextLevelXP = getXPForLevel(profile.level);
  const progressXP = profile.totalXP - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;
  
  return Math.min((progressXP / requiredXP) * 100, 100);
};
