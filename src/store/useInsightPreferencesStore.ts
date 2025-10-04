/**
 * Insight Preferences Store - Premium Feature
 * Stores user preferences for which insights to see and in what order
 * Apple-style: Simple, persistent, respects user choices
 */

import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { InsightType } from '@/lib/dailyInsightEngine';

export interface InsightPreference {
  type: InsightType;
  enabled: boolean;
  priority: number; // Lower number = higher priority
  label: string;
  description: string;
  icon: string;
}

interface InsightPreferencesState {
  preferences: InsightPreference[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadPreferences: () => Promise<void>;
  savePreferences: (preferences: InsightPreference[]) => Promise<void>;
  toggleInsight: (type: InsightType) => void;
  reorderPreferences: (newOrder: InsightPreference[]) => void;
  resetToDefaults: () => void;
}

// Default insight types and their metadata
const DEFAULT_PREFERENCES: InsightPreference[] = [
  {
    type: 'habit-correlation',
    enabled: true,
    priority: 1,
    label: 'Habit Correlations',
    description: 'Discover connections between habits and trading performance',
    icon: '💪',
  },
  {
    type: 'golden-hour',
    enabled: true,
    priority: 2,
    label: 'Golden Hour',
    description: 'Your most profitable trading time',
    icon: '⏰',
  },
  {
    type: 'revenge-trading',
    enabled: true,
    priority: 3,
    label: 'Revenge Trading',
    description: 'Alerts about emotional trading patterns',
    icon: '😤',
  },
  {
    type: 'win-streak',
    enabled: true,
    priority: 4,
    label: 'Win Streaks',
    description: 'Celebrate your winning trades',
    icon: '🔥',
  },
  {
    type: 'loss-pattern',
    enabled: true,
    priority: 5,
    label: 'Loss Patterns',
    description: 'Identify and break losing patterns',
    icon: '📉',
  },
  {
    type: 'overtrading',
    enabled: true,
    priority: 6,
    label: 'Overtrading',
    description: 'Warnings about excessive trading',
    icon: '🚨',
  },
  {
    type: 'time-of-day',
    enabled: true,
    priority: 7,
    label: 'Time of Day Patterns',
    description: 'When you trade best and worst',
    icon: '🕐',
  },
  {
    type: 'session-performance',
    enabled: true,
    priority: 8,
    label: 'Session Performance',
    description: 'Your best trading sessions',
    icon: '📊',
  },
];

export const useInsightPreferencesStore = create<InsightPreferencesState>((set, get) => ({
  preferences: DEFAULT_PREFERENCES,
  loading: false,
  error: null,
  
  loadPreferences: async () => {
    try {
      set({ loading: true, error: null });
      
      const { currentUser } = useAuth.getState?.() || {};
      if (!currentUser?.uid) {
        set({ preferences: DEFAULT_PREFERENCES, loading: false });
        return;
      }
      
      // Load from Firestore
      const docRef = doc(db, 'insightPreferences', currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const preferences = data.preferences || DEFAULT_PREFERENCES;
        
        // Merge with defaults in case new insight types were added
        const mergedPreferences = DEFAULT_PREFERENCES.map(defaultPref => {
          const savedPref = preferences.find((p: InsightPreference) => p.type === defaultPref.type);
          return savedPref || defaultPref;
        });
        
        // Sort by priority
        mergedPreferences.sort((a, b) => a.priority - b.priority);
        
        set({ preferences: mergedPreferences, loading: false });
      } else {
        set({ preferences: DEFAULT_PREFERENCES, loading: false });
      }
    } catch (error) {
      console.error('Failed to load insight preferences:', error);
      set({ error: 'Failed to load preferences', loading: false, preferences: DEFAULT_PREFERENCES });
    }
  },
  
  savePreferences: async (preferences: InsightPreference[]) => {
    try {
      const { currentUser } = useAuth.getState?.() || {};
      if (!currentUser?.uid) return;
      
      // Save to Firestore
      const docRef = doc(db, 'insightPreferences', currentUser.uid);
      await setDoc(docRef, {
        userId: currentUser.uid,
        preferences,
        updatedAt: new Date(),
      });
      
      set({ preferences });
      console.log('✅ Insight preferences saved');
    } catch (error) {
      console.error('Failed to save insight preferences:', error);
      set({ error: 'Failed to save preferences' });
    }
  },
  
  toggleInsight: (type: InsightType) => {
    const preferences = get().preferences.map(pref =>
      pref.type === type ? { ...pref, enabled: !pref.enabled } : pref
    );
    set({ preferences });
    get().savePreferences(preferences);
  },
  
  reorderPreferences: (newOrder: InsightPreference[]) => {
    // Update priorities based on new order
    const preferences = newOrder.map((pref, index) => ({
      ...pref,
      priority: index + 1,
    }));
    set({ preferences });
    get().savePreferences(preferences);
  },
  
  resetToDefaults: () => {
    set({ preferences: DEFAULT_PREFERENCES });
    get().savePreferences(DEFAULT_PREFERENCES);
  },
}));

