import { create } from 'zustand';

interface HabitItem {
  id: string;
  text: string;
  checked: boolean;
}

interface CoachHabitState {
  habits: HabitItem[];
  toggle: (id: string) => void;
  resetForToday: () => void;
  load: () => void;
  save: () => void;
}

const STORAGE_KEY = 'tradzen_coach_habits_v1';

const defaultHabits = (): HabitItem[] => [
  { id: 'premarket', text: 'Pre‑market plan reviewed', checked: false },
  { id: 'riskset', text: 'Risk set and max trades confirmed', checked: false },
  { id: 'postreview', text: 'Post‑session review written', checked: false },
];

export const useCoachHabitStore = create<CoachHabitState>((set, get) => ({
  habits: defaultHabits(),

  toggle: (id) => {
    set((state) => ({
      habits: state.habits.map(h => h.id === id ? { ...h, checked: !h.checked } : h)
    }));
    get().save();
  },

  resetForToday: () => {
    set({ habits: defaultHabits() });
    get().save();
  },

  load: () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) set({ habits: parsed });
      }
    } catch {}
  },

  save: () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(get().habits));
    } catch {}
  },
}));

// Initialize on import
useCoachHabitStore.getState().load();


