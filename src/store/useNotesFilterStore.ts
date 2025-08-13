import { create } from 'zustand';

export interface NotesSavedFilter {
  id: string;
  name: string;
  query: string;
  tag?: string | null;
  startDate?: string;
  endDate?: string;
  createdAt: string; // ISO
}

interface NotesFilterState {
  saved: NotesSavedFilter[];
  addFilter: (filter: Omit<NotesSavedFilter, 'id' | 'createdAt'>) => NotesSavedFilter;
  removeFilter: (id: string) => void;
  getById: (id: string) => NotesSavedFilter | undefined;
  renameFilter: (id: string, name: string) => void;
}

const STORAGE_KEY = 'tradzen_notes_filters_v1';

function loadSaved(): NotesSavedFilter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as NotesSavedFilter[];
    return [];
  } catch (e) {
    console.warn('Failed to load notes filters from storage', e);
    return [];
  }
}

function persist(saved: NotesSavedFilter[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch (e) {
    console.warn('Failed to persist notes filters', e);
  }
}

export const useNotesFilterStore = create<NotesFilterState>((set, get) => ({
  saved: loadSaved(),

  addFilter: (data) => {
    const next: NotesSavedFilter = {
      id: Math.random().toString(36).slice(2),
      name: data.name,
      query: data.query || '',
      tag: data.tag || null,
      startDate: data.startDate,
      endDate: data.endDate,
      createdAt: new Date().toISOString(),
    };
    const saved = [next, ...get().saved];
    set({ saved });
    persist(saved);
    return next;
  },

  removeFilter: (id) => {
    const saved = get().saved.filter(f => f.id !== id);
    set({ saved });
    persist(saved);
  },

  getById: (id) => get().saved.find(f => f.id === id),

  renameFilter: (id, name) => {
    const saved = get().saved.map(f => f.id === id ? { ...f, name } : f);
    set({ saved });
    persist(saved);
  },
}));


