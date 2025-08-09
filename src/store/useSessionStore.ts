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
  startSession: (date: string) => void;
  endSession: () => { completed: number; total: number };
  toggleItem: (id: string) => void;
  resetChecklist: (date: string) => void;
  getRfDraft: (date: string) => { good: string; bad: string; focus: string } | undefined;
  setRfDraft: (date: string, draft: { good: string; bad: string; focus: string }) => void;
  clearRfDraft: (date: string) => void;
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

  load: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY, null as any);
      if (saved) {
        set({
          activeDate: saved.activeDate || null,
          isActive: !!saved.isActive,
          checklist: Array.isArray(saved.checklist) && saved.checklist.length > 0 ? saved.checklist : defaultChecklist(),
          rfDrafts: saved.rfDrafts || {},
        });
      }
    } catch (e) {
      // ignore
    }
  },

  save: () => {
    try {
      const { activeDate, isActive, checklist, rfDrafts } = get();
      localStorage.setItem(STORAGE_KEY, { activeDate, isActive, checklist, rfDrafts });
    } catch (e) {
      // ignore
    }
  },
}));

// Initialize from storage immediately
useSessionStore.getState().load();


