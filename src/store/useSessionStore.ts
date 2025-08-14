import { create } from 'zustand';
import { localStorage, generateId } from '@/lib/localStorageUtils';

interface SessionChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface SessionState {
  activeDate: string | null;
  isActive: boolean;
  checklist: SessionChecklistItem[];
  rfDrafts: Record<string, { good: string; bad: string; focus: string }>;
  // Rules and lockout
  rules: {
    maxTrades: number | null;
    cutoffTimeMinutes: number | null; // minutes since midnight, e.g., 11:30 = 690
    autoLockoutEnabled: boolean;
  };
  lockoutUntil: number | null; // epoch ms
  lockoutSnoozeUntil: number | null; // epoch ms to suppress auto-lockout
  startSession: (date: string) => void;
  endSession: () => { completed: number; total: number };
  toggleItem: (id: string) => void;
  resetChecklist: (date: string) => void;
  getRfDraft: (date: string) => { good: string; bad: string; focus: string } | undefined;
  setRfDraft: (date: string, draft: { good: string; bad: string; focus: string }) => void;
  clearRfDraft: (date: string) => void;
  // Rules & lockout actions
  setRules: (updates: Partial<SessionState['rules']>) => void;
  startLockout: (minutes: number) => void;
  cancelLockout: () => void;
  isLockedOut: () => boolean;
  setLockoutSnooze: (minutes: number) => void;
  clearLockoutSnooze: () => void;
  isAutoLockoutSnoozed: () => boolean;
  load: () => void;
  save: () => void;
}

const STORAGE_KEY = 'tradzen_session_v1';

const defaultChecklist = (): SessionChecklistItem[] => [
  { id: generateId(), text: 'Review pre‑market plan', checked: false },
  { id: generateId(), text: 'Define A+ setup and risk', checked: false },
  { id: generateId(), text: 'Commit to max trades / lockout', checked: false },
];

export const useSessionStore = create<SessionState>((set, get) => ({
  activeDate: null,
  isActive: false,
  checklist: defaultChecklist(),
  rfDrafts: {},
  rules: {
    maxTrades: 5,
    cutoffTimeMinutes: 690, // 11:30
    autoLockoutEnabled: true,
  },
  lockoutUntil: null,
  lockoutSnoozeUntil: null,

  startSession: (date) => {
    set({ activeDate: date, isActive: true });
    get().save();
  },

  endSession: () => {
    const { checklist } = get();
    const summary = { completed: checklist.filter(i => i.checked).length, total: checklist.length };
    set({ isActive: false });
    get().save();
    return summary;
  },

  toggleItem: (id) => {
    const items = get().checklist.map(i => (i.id === id ? { ...i, checked: !i.checked } : i));
    set({ checklist: items });
    get().save();
  },

  resetChecklist: (_date) => {
    set({ checklist: defaultChecklist() });
    get().save();
  },

  getRfDraft: (date) => get().rfDrafts[date],
  setRfDraft: (date, draft) => {
    const next = { ...get().rfDrafts, [date]: draft };
    set({ rfDrafts: next });
    get().save();
  },
  clearRfDraft: (date) => {
    const next = { ...get().rfDrafts };
    delete next[date];
    set({ rfDrafts: next });
    get().save();
  },

  setRules: (updates) => {
    set((state) => ({ rules: { ...state.rules, ...updates } }));
    get().save();
  },
  startLockout: (minutes) => {
    const until = Date.now() + minutes * 60 * 1000;
    set({ lockoutUntil: until });
    get().save();
  },
  cancelLockout: () => {
    set({ lockoutUntil: null });
    get().save();
  },
  isLockedOut: () => {
    const until = get().lockoutUntil;
    return until !== null && Date.now() < until;
  },
  setLockoutSnooze: (minutes) => {
    const until = Date.now() + minutes * 60 * 1000;
    set({ lockoutSnoozeUntil: until });
    get().save();
  },
  clearLockoutSnooze: () => {
    set({ lockoutSnoozeUntil: null });
    get().save();
  },
  isAutoLockoutSnoozed: () => {
    const until = get().lockoutSnoozeUntil;
    return until !== null && Date.now() < until;
  },

  load: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY, null as any);
      if (saved) {
        set({
          activeDate: saved.activeDate || null,
          isActive: !!saved.isActive,
          checklist: Array.isArray(saved.checklist) && saved.checklist.length > 0 ? saved.checklist : defaultChecklist(),
          rfDrafts: saved.rfDrafts || {},
          rules: saved.rules || { maxTrades: 5, cutoffTimeMinutes: 690, autoLockoutEnabled: true },
          lockoutUntil: typeof saved.lockoutUntil === 'number' ? saved.lockoutUntil : null,
          lockoutSnoozeUntil: typeof saved.lockoutSnoozeUntil === 'number' ? saved.lockoutSnoozeUntil : null,
        });
      }
    } catch (e) {
      // ignore
    }
  },

  save: () => {
    try {
      const { activeDate, isActive, checklist, rfDrafts, rules, lockoutUntil, lockoutSnoozeUntil } = get();
      localStorage.setItem(STORAGE_KEY, { activeDate, isActive, checklist, rfDrafts, rules, lockoutUntil, lockoutSnoozeUntil });
    } catch (e) {
      // ignore
    }
  },
}));

// Initialize from storage immediately
useSessionStore.getState().load();


