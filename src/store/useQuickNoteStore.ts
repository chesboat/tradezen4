import { create } from 'zustand';
import { QuickNote, MoodType } from '@/types';
import { FirestoreService } from '@/lib/firestore';

const quickNoteService = new FirestoreService<QuickNote>('quickNotes');

interface QuickNoteState {
  notes: QuickNote[];
  addNote: (note: Omit<QuickNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<QuickNote>;
  updateNote: (id: string, updates: Partial<QuickNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getNotesByAccount: (accountId: string) => QuickNote[];
  getNotesByTag: (tag: string) => QuickNote[];
  initializeNotes: () => Promise<void>;
}

export const useQuickNoteStore = create<QuickNoteState>((set, get) => ({
  notes: [],

  initializeNotes: async () => {
    try {
      const notes = await quickNoteService.getAll();
      const formattedNotes = notes.map(note => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      }));
      set({ notes: formattedNotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) });
    } catch (error) {
      console.error('Failed to initialize notes:', error);
      set({ notes: [] });
    }
  },

  addNote: async (note) => {
    try {
      const now = new Date().toISOString();
      const newNote = await quickNoteService.create({
        ...note,
        createdAt: now,
        updatedAt: now,
      });

      const formattedNote = {
        ...newNote,
        createdAt: new Date(newNote.createdAt),
        updatedAt: new Date(newNote.updatedAt),
      };

      const currentNotes = get().notes;
      set({ notes: [formattedNote, ...currentNotes] });
      return formattedNote;
    } catch (error) {
      console.error('Failed to add note:', error);
      throw error;
    }
  },

  updateNote: async (id, updates) => {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await quickNoteService.update(id, updateData);
      
      const currentNotes = get().notes;
      const updatedNotes = currentNotes.map(note => 
        note.id === id 
          ? { ...note, ...updates, updatedAt: new Date() }
          : note
      );
      set({ notes: updatedNotes });
    } catch (error) {
      console.error('Failed to update note:', error);
      throw error;
    }
  },

  deleteNote: async (id) => {
    try {
      await quickNoteService.delete(id);
      const currentNotes = get().notes;
      const updatedNotes = currentNotes.filter(note => note.id !== id);
      set({ notes: updatedNotes });
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  },

  getNotesByAccount: (accountId) => {
    return get().notes.filter(note => note.accountId === accountId);
  },

  getNotesByTag: (tag) => {
    return get().notes.filter(note => note.tags.includes(tag));
  },
}));

// Initialize notes when auth state changes
export const initializeQuickNoteStore = async () => {
  await useQuickNoteStore.getState().initializeNotes();
};

// Selector hooks for performance optimization
export const useNotes = () => useQuickNoteStore((state) => state.notes);
export const useNoteActions = () => useQuickNoteStore((state) => ({
  addNote: state.addNote,
  updateNote: state.updateNote,
  deleteNote: state.deleteNote,
}));