import { create } from 'zustand';
import { QuickNote } from '@/types';
import { QuickNoteState } from '@/types/stores';
import { FirestoreService } from '@/lib/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import app from '@/lib/firebase';
import { useQuickNoteModalStore } from './useQuickNoteModalStore';

const quickNoteService = new FirestoreService<QuickNote>('quickNotes');

export const useQuickNoteStore = create<QuickNoteState>((set, get) => ({
  notes: [],
  allTags: [],

  initializeNotes: async () => {
    try {
      const notes = await quickNoteService.getAll();
      const formattedNotes = notes.map(note => ({
        ...note,
        tags: Array.isArray((note as any).tags) ? (note as any).tags : [],
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      }));
      
      // Extract all unique tags
      const tags = [...new Set(formattedNotes.flatMap(note => note.tags))];
      
      set({ 
        notes: formattedNotes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
        allTags: tags
      });
    } catch (error) {
      console.error('Failed to initialize notes:', error);
      set({ notes: [], allTags: [] });
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
        tags: Array.isArray((newNote as any).tags) ? (newNote as any).tags : [],
        createdAt: new Date(newNote.createdAt),
        updatedAt: new Date(newNote.updatedAt),
      };

      const currentNotes = get().notes;
      const newTags = [...new Set([...get().allTags, ...((note as any).tags || [])])];
      
      set({ 
        notes: [formattedNote, ...currentNotes],
        allTags: newTags
      });
      return formattedNote;
    } catch (error) {
      console.error('Failed to add note:', error);
      throw error;
    }
  },

  // Upload an image Blob/File and return a URL
  uploadImage: async (file: Blob | File): Promise<string> => {
    const projectId = (import.meta as any).env.VITE_FIREBASE_PROJECT_ID as string | undefined;
    const storageBucket = (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined;
    const bucketUrl = storageBucket && storageBucket.includes('firebasestorage.app') && projectId
      ? `gs://${projectId}.appspot.com`
      : undefined;
    const storage = bucketUrl ? getStorage(app as any, bucketUrl) : getStorage(app as any);
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const path = `quickNotes/${id}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  },

  addInlineNote: async (content, accountId) => {
    return get().addNote({
      content,
      tags: [],
      accountId
    });
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

      // Update tags if needed
      const allTags = [...new Set(updatedNotes.flatMap(note => (note.tags || [])))] ;
      
      set({ notes: updatedNotes, allTags });
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
      
      // Update tags
      const allTags = [...new Set(updatedNotes.flatMap(note => (note.tags || [])))] ;
      
      set({ notes: updatedNotes, allTags });
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  },

  getNotesByAccount: (accountId) => {
    return get().notes.filter(note => note.accountId === accountId);
  },

  getNotesByTag: (tag) => {
    return get().notes.filter(note => (note.tags || []).includes(tag));
  },

  getNotesForDate: (date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return get().notes.filter(note => {
      const noteDate = new Date(note.createdAt);
      return noteDate >= startOfDay && noteDate <= endOfDay;
    });
  },

  removeTag: (tagToRemove) => {
    const currentNotes = get().notes;
    const updatedNotes = currentNotes.map(note => ({
      ...note,
      tags: (note.tags || []).filter(tag => tag !== tagToRemove)
    }));
    
    // Update all tags
    const allTags = [...new Set(updatedNotes.flatMap(note => (note.tags || [])))] ;
    
    set({ notes: updatedNotes, allTags });
  }
}));

// Initialize notes when auth state changes
export const initializeQuickNoteStore = async () => {
  await useQuickNoteStore.getState().initializeNotes();
};

// Selector hooks for performance optimization
export const useNotes = () => useQuickNoteStore((state) => state.notes);
export const useQuickNoteTags = () => useQuickNoteStore((state) => ({
  allTags: state.allTags,
  removeTag: state.removeTag,
  suggestedTags: state.allTags.slice(0, 10), // Top 10 most used tags
  addTag: (tag: string) => {
    // This would be implemented to add a new tag to the system
    console.log('Add tag:', tag);
  },
  tagsByUsage: state.allTags, // For now, just return all tags
  tagUsageCount: state.allTags.reduce((acc, tag) => ({ ...acc, [tag]: 1 }), {} as Record<string, number>)
}));

export const useQuickNoteModal = () => {
  const store = useQuickNoteModalStore();
  return {
    isOpen: store.isOpen,
    openModal: store.openModal,
    closeModal: store.closeModal,
    isModalOpen: store.isOpen,
    editingNoteId: store.editingNoteId,
    draftNote: store.draftNote,
    saveDraft: store.saveDraft,
    loadDraft: store.loadDraft,
    clearDraft: store.clearDraft,
    setEditingNote: store.setEditingNote
  };
};