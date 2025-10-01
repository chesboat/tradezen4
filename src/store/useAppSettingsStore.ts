import { create } from 'zustand';
import { localStorage, STORAGE_KEYS } from '@/lib/localStorageUtils';

export interface AppSettingsState {
  // Reflection completion gating
  reflection: {
    completionThreshold: number; // 0..100
    requireContentToComplete: boolean; // if false, allow completion regardless
  };

  // Classification settings
  classification: {
    breakevenBandR: number;
    breakevenBandUSD: number;
    ignoreFeesForClassification: boolean;
  };

  // Calendar display settings
  calendar: {
    showMoodRings: boolean; // Show mood-based border colors on day tiles
  };

  load: () => void;
  save: () => void;
  setReflectionSettings: (updates: Partial<AppSettingsState['reflection']>) => void;
  setClassificationSettings: (updates: Partial<AppSettingsState['classification']>) => void;
  setCalendarSettings: (updates: Partial<AppSettingsState['calendar']>) => void;
}

const DEFAULTS: AppSettingsState = {
  reflection: {
    completionThreshold: 70,
    requireContentToComplete: true,
  },
  classification: {
    breakevenBandR: 0.05,
    breakevenBandUSD: 10,
    ignoreFeesForClassification: true,
  },
  calendar: {
    showMoodRings: false, // Opt-in feature
  },
  load: () => {},
  save: () => {},
  setReflectionSettings: () => {},
  setClassificationSettings: () => {},
  setCalendarSettings: () => {},
};

export const useAppSettingsStore = create<AppSettingsState>((set, get) => ({
  ...DEFAULTS,

  load: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APP_SETTINGS, null as any);
      if (saved) set({ ...get(), ...saved });
    } catch {}
  },
  save: () => {
    try {
      const { reflection, classification, calendar } = get();
      localStorage.setItem(STORAGE_KEYS.APP_SETTINGS, { reflection, classification, calendar } as any);
    } catch {}
  },
  setReflectionSettings: (updates) => {
    set((state) => ({ reflection: { ...state.reflection, ...updates } }));
    get().save();
  },
  setClassificationSettings: (updates) => {
    set((state) => ({ classification: { ...state.classification, ...updates } }));
    get().save();
  },
  setCalendarSettings: (updates) => {
    set((state) => ({ calendar: { ...state.calendar, ...updates } }));
    get().save();
  },
}));

// Initialize from storage
useAppSettingsStore.getState().load();


