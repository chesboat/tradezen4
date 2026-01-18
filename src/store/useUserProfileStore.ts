import { create } from 'zustand';
import { useActivityLogStore } from './useActivityLogStore';
import { useQuestStore } from './useQuestStore';
import { localStorage, STORAGE_KEYS } from '@/lib/localStorageUtils';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
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
  // Subscription fields (updated by Stripe webhook)
  subscriptionTier?: 'trial' | 'basic' | 'premium'; // Current subscription tier
  subscriptionStatus?: 'trialing' | 'active' | 'canceled' | 'past_due' | 'expired'; // Subscription status
  stripeCustomerId?: string; // Stripe customer ID
  stripeSubscriptionId?: string; // Stripe subscription ID
  stripePriceId?: string; // Current Stripe price ID
  trialEndsAt?: Date; // When trial ends (for 7-day countdown)
  trialStartedAt?: Date; // When trial started
  currentPeriodEnd?: Date; // When current billing period ends
  canceledAt?: Date; // When subscription was canceled
  lastPaymentDate?: Date; // Last successful payment date
  hasSeenWelcome?: boolean; // Has user seen the welcome screen (Apple-style onboarding)
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
    accentColor?: 'blue' | 'indigo' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'mono';
    styleTheme?: 'default' | 'botanical';
    customColors?: {
      background: string | null;
      accent: string | null;
    };
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
      // Clean up any existing subscriptions before re-initializing
      try {
        const existingProfileUnsub = (window as any).__profileUnsub;
        if (typeof existingProfileUnsub === 'function') {
          existingProfileUnsub();
        }
        (window as any).__profileUnsub = undefined;
      } catch {}
      try {
        const existingXpUnsub = (window as any).__xpUnsub;
        if (typeof existingXpUnsub === 'function') {
          existingXpUnsub();
        }
        (window as any).__xpUnsub = undefined;
      } catch {}

      // 1) Do not fabricate profile; rely on Firestore as SSOT. Use cache only for quick UI display.
      const cachedProfile = get().loadFromStorage(userId);
      if (cachedProfile) set({ profile: cachedProfile });

      // 2) Attach realtime subscription to the canonical profile doc
      // NOTE: Do NOT read XP from this doc - XP is handled by separate subscription to xp/status
      try {
        const profileDocRef = doc(db, 'userProfiles', userId);
        const unsubProfile = onSnapshot(profileDocRef, (snap) => {
          const data = snap.data();
          if (!data) return;
          
          const current = get().profile;
          
          // Preserve existing XP from state - do NOT overwrite with profile doc's stale xp field
          // XP is managed exclusively by the xp/status subscription below
          const safeStats = (data as any).stats ?? {
            totalTrades: 0,
            totalQuests: 0,
            totalWellnessActivities: 0,
            totalReflections: 0,
            currentStreak: 0,
            longestStreak: 0,
          };

          const nextProfile: UserProfile = {
            id: userId, // ensure id is always present for downstream writes
            ...(data as any),
            stats: safeStats,
            joinedAt: (data as any).joinedAt ? new Date((data as any).joinedAt) : new Date(),
            xp: current?.xp || {
              total: 0,
              seasonXp: 0,
              level: 1,
              prestige: 0,
              canPrestige: false,
              history: [],
            },
          } as UserProfile;
          
          set({ profile: nextProfile });
          get().saveToStorage();
          
          console.log('📡 Profile subscription update (XP preserved from state):', {
            displayName: nextProfile.displayName,
            stats: nextProfile.stats,
            preservedXp: nextProfile.xp.seasonXp
          });
        });
        (window as any).__profileUnsub = unsubProfile;
      } catch (e) {
        console.warn('Profile subscribe failed; will rely on one-time fetch and cache:', e);
      }

      // 3) Try authoritative fetch from Firestore
      let profile: UserProfile | null = null;
      try {
        profile = await get().loadFromFirestore(userId);
      } catch (e) {
        // Network/permission error – avoid creating defaults; keep cache and subscription
        console.warn('Transient error loading profile from Firestore; using cache until realtime updates arrive.', e);
      }

      // 4) If the profile doc does not exist, create it once in Firestore, not locally
      if (!profile && !cachedProfile) {
        const profileDoc = doc(db, 'userProfiles', userId);
        const base = {
          id: userId,
          displayName: email?.split('@')[0] || 'Trader',
          email,
          joinedAt: new Date().toISOString(),
          preferences: { theme: 'system', notifications: true, autoBackup: true },
          stats: { totalTrades: 0, totalQuests: 0, totalWellnessActivities: 0, totalReflections: 0, currentStreak: 0, longestStreak: 0 },
          updatedAt: serverTimestamp(),
        } as any;
        await setDoc(profileDoc, base, { merge: true });
      }
      
      // 5) Ensure XP realtime subscription is active
      try {
        const { XpService } = await import('@/lib/xp/XpService');
        console.log('🔗 Setting up XP subscription...');
        const unsub = XpService.subscribe(({ total, seasonXp, level, prestige }) => {
          const current = get().profile;
          if (!current) {
            console.warn('⚠️ XP update received but no profile loaded');
            return;
          }
          
          // Trust Firestore's level value (it's calculated by XpService.addXp now)
          // But recalculate locally as backup in case Firestore is stale
          const calculatedLevel = levelFromTotalXp(seasonXp).level;
          const finalLevel = level || calculatedLevel; // Prefer Firestore value
          
          console.log('📊 XP update received:', { 
            total, 
            seasonXp, 
            firestoreLevel: level,
            calculatedLevel,
            finalLevel,
            prestige 
          });
          
          const updated: UserProfile = {
            ...current,
            xp: {
              ...current.xp,
              total,
              seasonXp,
              level: finalLevel,
              prestige,
              canPrestige: canPrestige(seasonXp),
            },
          };
          set({ profile: updated });
          get().saveToStorage();
        });
        (window as any).__xpUnsub = unsub;
        console.log('✅ XP subscription active');
      } catch (e) {
        console.error('❌ XP subscribe failed - XP updates will not sync:', e);
        // This is critical - if subscription fails, user won't see XP updates
        // Consider showing a notification to the user
      }

      // 6) Sync lightweight profile fields to Firestore (merge)
      await get().syncToFirestore();

      // 7) Derive and persist stats
      get().refreshStats();
    } catch (error) {
      console.error('Failed to initialize profile:', error);
    } finally {
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
    
    const baseStats = profile.stats || {
      totalTrades: 0,
      totalQuests: 0,
      totalWellnessActivities: 0,
      totalReflections: 0,
      currentStreak: 0,
      longestStreak: 0,
    };

    let currentStreak = 0;
    if (todayActivities.length > 0) {
      currentStreak = 1;
      if (yesterdayActivities.length > 0) {
        // Could implement more sophisticated streak calculation here
          currentStreak = Math.min(baseStats.currentStreak + 1, 365);
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
          longestStreak: Math.max(baseStats.longestStreak, currentStreak),
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
    
    // 🚨 CRITICAL: Guard against missing profile.id
    const uid = profile.id;
    if (!uid || typeof uid !== 'string') {
      console.debug('syncToFirestore skipped: missing profile.id');
      return;
    }

    try {
      console.log('🔐 syncToFirestore writing XP:', {
        seasonXp: profile.xp?.seasonXp,
        totalXp: profile.xp?.total,
        level: profile.xp?.level,
        prestige: profile.xp?.prestige,
      });
      
      const profileDoc = doc(db, 'userProfiles', uid);
      
      // 🚨 CRITICAL: Sanitize ALL data before writing to Firestore
      // Firestore will throw "r.indexOf" error if ANY field is undefined
      const dataToWrite: any = {
        id: profile.id,
        displayName: profile.displayName || '',
        email: profile.email || '',
        stats: profile.stats || {
          totalTrades: 0,
          totalQuests: 0,
          totalWellnessActivities: 0,
          totalReflections: 0,
          currentStreak: 0,
          longestStreak: 0,
        },
        updatedAt: serverTimestamp(),
      };
      
      // Only add optional fields if they're valid (not undefined, not null)
      if (profile.joinedAt) {
        dataToWrite.joinedAt = profile.joinedAt instanceof Date 
          ? profile.joinedAt.toISOString() 
          : profile.joinedAt;
      }
      
      if (profile.preferences && typeof profile.preferences === 'object') {
        // Deep-sanitize preferences - strip undefineds and coerce types
        const prefs: any = {
          theme: profile.preferences.theme || 'system',
          notifications: Boolean(profile.preferences.notifications),
          autoBackup: Boolean(profile.preferences.autoBackup),
        };
        if (profile.preferences.accentColor) {
          prefs.accentColor = profile.preferences.accentColor;
        }
        if (profile.preferences.styleTheme) {
          prefs.styleTheme = profile.preferences.styleTheme;
        }
        if (profile.preferences.customColors) {
          prefs.customColors = profile.preferences.customColors;
        }
        dataToWrite.preferences = prefs;
      }
      
      // Add subscription fields only if they exist
      if (profile.subscriptionTier) {
        dataToWrite.subscriptionTier = profile.subscriptionTier;
      }
      
      if (profile.subscriptionStatus) {
        dataToWrite.subscriptionStatus = profile.subscriptionStatus;
      }
      
      if (profile.stripeCustomerId) {
        dataToWrite.stripeCustomerId = profile.stripeCustomerId;
      }
      
      if (profile.stripeSubscriptionId) {
        dataToWrite.stripeSubscriptionId = profile.stripeSubscriptionId;
      }
      
      if (profile.stripePriceId) {
        dataToWrite.stripePriceId = profile.stripePriceId;
      }
      
      if (profile.trialEndsAt) {
        dataToWrite.trialEndsAt = profile.trialEndsAt;
      }
      
      if (profile.trialStartedAt) {
        dataToWrite.trialStartedAt = profile.trialStartedAt;
      }
      
      if (profile.currentPeriodEnd) {
        dataToWrite.currentPeriodEnd = profile.currentPeriodEnd;
      }
      
      if (profile.canceledAt) {
        dataToWrite.canceledAt = profile.canceledAt;
      }
      
      if (profile.lastPaymentDate) {
        dataToWrite.lastPaymentDate = profile.lastPaymentDate;
      }
      
      // Avoid writing legacy xp fields; write xp in xp/status listener path instead
      await setDoc(profileDoc, dataToWrite, { merge: true });
      console.log('Profile synced to Firestore');
    } catch (error) {
      console.error('Failed to sync profile to Firestore:', error);
    }
  },

  loadFromFirestore: async (userId) => {
    const profileDoc = doc(db, 'userProfiles', userId);
    const docSnap = await getDoc(profileDoc);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // NOTE: Do NOT read XP from parent document - it's stale!
      // XP is loaded exclusively by the xp/status subscription
      // Use cached XP or default values that will be overwritten by subscription
      const current = get().profile;
      const cachedXp = current?.xp || {
        total: 0,
        seasonXp: 0,
        level: 1,
        prestige: 0,
        canPrestige: false,
        history: [],
      };
      
      console.log('🧲 loadFromFirestore (XP will be loaded by subscription):', {
        usingCachedXp: !!current?.xp,
        cachedSeasonXp: cachedXp.seasonXp,
      });
      
      const safeStats = (data as any).stats ?? {
        totalTrades: 0,
        totalQuests: 0,
        totalWellnessActivities: 0,
        totalReflections: 0,
        currentStreak: 0,
        longestStreak: 0,
      };

      const profile: UserProfile = {
        ...data,
        stats: safeStats,
        joinedAt: (data as any).joinedAt ? new Date((data as any).joinedAt) : new Date(),
        xp: cachedXp  // Use cached or default, will be updated by XP subscription
      } as UserProfile;
      
      set({ profile });
      return profile;
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
