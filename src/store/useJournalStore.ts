import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { JournalEntry, MoodType } from '@/types';
import { generateId } from '@/lib/localStorageUtils';

interface JournalState {
  entries: JournalEntry[];
  
  // Actions
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => JournalEntry;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntryByDate: (date: string, accountId?: string) => JournalEntry | undefined;
  getEntriesByAccount: (accountId: string) => JournalEntry[];
  
  // Utilities
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

export const useJournalStore = create<JournalState>()(
  devtools(
    (set, get) => ({
      entries: [],

      addEntry: (entryData) => {
        const newEntry: JournalEntry = {
          ...entryData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          entries: [newEntry, ...state.entries],
        }));

        get().saveToStorage();
        return newEntry;
      },

      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id
              ? { ...entry, ...updates, updatedAt: new Date() }
              : entry
          ),
        }));
        get().saveToStorage();
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }));
        get().saveToStorage();
      },

      getEntryByDate: (date, accountId) => {
        const { entries } = get();
        return entries.find((entry) => 
          entry.date === date && (!accountId || entry.accountId === accountId)
        );
      },

      getEntriesByAccount: (accountId) => {
        const { entries } = get();
        return entries.filter((entry) => entry.accountId === accountId);
      },

      loadFromStorage: () => {
        try {
          const stored = localStorage.getItem('tradzen-journal-entries');
          if (stored) {
            const parsedEntries = JSON.parse(stored);
            // Convert date strings back to Date objects
            const entries = parsedEntries.map((entry: any) => ({
              ...entry,
              createdAt: new Date(entry.createdAt),
              updatedAt: new Date(entry.updatedAt),
            }));
            set({ entries });
          }
        } catch (error) {
          console.error('Failed to load journal entries from storage:', error);
        }
      },

      saveToStorage: () => {
        try {
          const { entries } = get();
          localStorage.setItem('tradzen-journal-entries', JSON.stringify(entries));
        } catch (error) {
          console.error('Failed to save journal entries to storage:', error);
        }
      },
    }),
    {
      name: 'journal-store',
    }
  )
);

// Load from storage on initial load
useJournalStore.getState().loadFromStorage(); 