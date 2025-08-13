import { create } from 'zustand';
import { localStorage } from '@/lib/localStorageUtils';

export type CoachMessageRole = 'system' | 'user' | 'assistant';

export interface CoachMessage {
  id: string;
  role: CoachMessageRole;
  content: string;
  createdAt: Date;
  date: string; // YYYY-MM-DD
  accountId: string;
}

interface CoachState {
  isOpen: boolean;
  messages: CoachMessage[];
  model: string; // OpenAI model id
  detailLevel: 'brief' | 'detailed';
  open: () => void;
  close: () => void;
  addMessage: (msg: Omit<CoachMessage, 'id' | 'createdAt'>) => CoachMessage;
  clearHistoryFor: (date: string, accountId: string) => void;
  getMessagesFor: (date: string, accountId: string) => CoachMessage[];
  saveToStorage: () => void;
  loadFromStorage: () => void;
  setModel: (model: string) => void;
  setDetailLevel: (level: 'brief' | 'detailed') => void;
}

const STORAGE_KEY = 'tradzen_coach_messages';
const SETTINGS_KEY = 'tradzen_coach_settings';

const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const useCoachStore = create<CoachState>((set, get) => ({
  isOpen: false,
  messages: [],
  model: 'gpt-4o',
  detailLevel: 'brief',

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  addMessage: (msg) => {
    const newMsg: CoachMessage = {
      ...msg,
      id: generateId(),
      createdAt: new Date(),
    };
    set((state) => ({ messages: [...state.messages, newMsg] }));
    get().saveToStorage();
    return newMsg;
  },

  clearHistoryFor: (date, accountId) => {
    set((state) => ({
      messages: state.messages.filter((m) => !(m.date === date && m.accountId === accountId)),
    }));
    get().saveToStorage();
  },

  getMessagesFor: (date, accountId) => {
    return get().messages
      .filter((m) => m.date === date && m.accountId === accountId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  },

  saveToStorage: () => {
    const { messages } = get();
    const serializable = messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));
    localStorage.setItem(STORAGE_KEY, serializable);
    const { model, detailLevel } = get();
    localStorage.setItem(SETTINGS_KEY, { model, detailLevel } as any);
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY, [] as any[]);
      const parsed: any[] = Array.isArray(stored) ? stored : [];
      const messages: CoachMessage[] = parsed.map((m) => ({
        ...m,
        createdAt: new Date(m.createdAt),
      }));
      const settings = localStorage.getItem(SETTINGS_KEY, null as any);
      set({ messages, ...(settings ? { model: settings.model || 'gpt-4o', detailLevel: settings.detailLevel || 'brief' } : {}) });
    } catch (e) {
      // ignore
      set({ messages: [] });
    }
  },

  setModel: (model) => { set({ model }); get().saveToStorage(); },
  setDetailLevel: (level) => { set({ detailLevel: level }); get().saveToStorage(); },
}));


