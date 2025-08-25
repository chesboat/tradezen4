import { create } from 'zustand';
import { RichNote } from '@/types';
import { FirestoreService } from '@/lib/firestore';
import { where, orderBy } from 'firebase/firestore';
import { generateId } from '@/lib/localStorageUtils';
import { useActivityLogStore } from './useActivityLogStore';
import { awardXp } from '@/lib/xp/XpService';

interface RichNotesState {
  notes: RichNote[];
  isLoading: boolean;
  searchQuery: string;
  selectedCategory: string | null;
  selectedFolder: string | null;
  showFavoritesOnly: boolean;
  
  // Actions
  loadNotes: (accountId: string) => Promise<void>;
  createNote: (noteData: Omit<RichNote, 'id' | 'createdAt' | 'updatedAt' | 'wordCount' | 'readingTime'>) => Promise<RichNote>;
  updateNote: (id: string, updates: Partial<RichNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  updateLastViewed: (id: string) => Promise<void>;
  linkNotes: (noteId: string, linkedNoteId: string) => Promise<void>;
  unlinkNotes: (noteId: string, linkedNoteId: string) => Promise<void>;
  
  // Filtering
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setSelectedFolder: (folder: string | null) => void;
  setShowFavoritesOnly: (show: boolean) => void;
  
  // Folder Management
  renameFolder: (oldName: string, newName: string) => Promise<void>;
  deleteFolder: (folderName: string) => Promise<void>;
  
  // Computed
  getFilteredNotes: () => RichNote[];
  getFolders: () => string[];
  getCategories: () => string[];
  getNoteById: (id: string) => RichNote | undefined;
  getLinkedNotes: (noteId: string) => RichNote[];
}

// Helper function to calculate reading time (average 200 words per minute)
const calculateReadingTime = (wordCount: number): number => {
  return Math.max(1, Math.ceil(wordCount / 200));
};

// Helper function to count words in HTML content
const countWords = (html: string): number => {
  // Strip HTML tags and count words
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text ? text.split(' ').length : 0;
};

const service = new FirestoreService<RichNote>('richNotes');

export const useRichNotesStore = create<RichNotesState>((set, get) => ({
  notes: [],
  isLoading: false,
  searchQuery: '',
  selectedCategory: null,
  selectedFolder: null,
  showFavoritesOnly: false,

  loadNotes: async (accountId: string) => {
    set({ isLoading: true });
    try {
      const notes = await service.query([
        where('accountId', '==', accountId),
        orderBy('updatedAt', 'desc'),
      ]);
      set({ notes, isLoading: false });
    } catch (error) {
      console.error('Failed to load rich notes:', error);
      set({ isLoading: false });
    }
  },

  createNote: async (noteData) => {
    const wordCount = countWords(noteData.content);
    const readingTime = calculateReadingTime(wordCount);
    
    const note: RichNote = {
      ...noteData,
      id: generateId(),
      wordCount,
      readingTime,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await service.setWithId(note.id, note);
      set(state => ({ notes: [note, ...state.notes] }));
      
      // Award XP and add activity log entry
      await awardXp.richNoteCreate(note.id, note.wordCount);
      
      const { addActivity } = useActivityLogStore.getState();
      addActivity({
        type: 'rich_note',
        description: `Created rich note: ${note.title}`,
        metadata: { 
          noteId: note.id, 
          category: note.category,
          wordCount: note.wordCount 
        },
        accountId: note.accountId,
        xpEarned: 15,
      });

      return note;
    } catch (error) {
      console.error('Failed to create rich note:', error);
      throw error;
    }
  },

  updateNote: async (id, updates) => {
    const existingNote = get().notes.find(n => n.id === id);
    if (!existingNote) return;

    // Recalculate word count and reading time if content changed
    let wordCount = existingNote.wordCount;
    let readingTime = existingNote.readingTime;
    
    if (updates.content && updates.content !== existingNote.content) {
      wordCount = countWords(updates.content);
      readingTime = calculateReadingTime(wordCount);
    }

    const updatedNote = {
      ...existingNote,
      ...updates,
      wordCount,
      readingTime,
      updatedAt: new Date().toISOString(),
    };

    try {
      await service.update(id, {
        ...updates,
        wordCount,
        readingTime,
        updatedAt: updatedNote.updatedAt,
      });
      
      set(state => ({
        notes: state.notes.map(note => 
          note.id === id ? updatedNote : note
        )
      }));

      // Award XP and add activity log entry for significant updates
      if (updates.content || updates.title) {
        await awardXp.richNoteUpdate(id, updatedNote.wordCount);
        
        const { addActivity } = useActivityLogStore.getState();
        addActivity({
          type: 'rich_note',
          description: `Updated rich note: ${updatedNote.title}`,
          metadata: { 
            noteId: id, 
            category: updatedNote.category,
            wordCount: updatedNote.wordCount 
          },
          accountId: updatedNote.accountId,
          xpEarned: 5,
        });
      }
    } catch (error) {
      console.error('Failed to update rich note:', error);
      throw error;
    }
  },

  deleteNote: async (id) => {
    const note = get().notes.find(n => n.id === id);
    if (!note) return;

    try {
      await service.delete(id);
      set(state => ({
        notes: state.notes.filter(n => n.id !== id)
      }));

      // Add activity log entry
      const { addActivity } = useActivityLogStore.getState();
      addActivity({
        type: 'rich_note',
        description: `Deleted rich note: ${note.title}`,
        metadata: { 
          noteId: id, 
          category: note.category 
        },
        accountId: note.accountId,
      });
    } catch (error) {
      console.error('Failed to delete rich note:', error);
      throw error;
    }
  },

  toggleFavorite: async (id) => {
    const note = get().notes.find(n => n.id === id);
    if (!note) return;

    const isFavorite = !note.isFavorite;
    await get().updateNote(id, { isFavorite });

    if (isFavorite) {
      // Award XP for favoriting
      await awardXp.richNoteFavorite(id);
      
      const { addActivity } = useActivityLogStore.getState();
      addActivity({
        type: 'rich_note',
        description: `Favorited note: ${note.title}`,
        metadata: { noteId: id },
        accountId: note.accountId,
        xpEarned: 2,
      });
    }
  },

  updateLastViewed: async (id) => {
    const note = get().notes.find(n => n.id === id);
    if (!note) return;

    // Only update if it's been more than 5 minutes since last view
    const lastViewed = note.lastViewedAt ? new Date(note.lastViewedAt) : new Date(0);
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    if (lastViewed < fiveMinutesAgo) {
      await get().updateNote(id, { lastViewedAt: now.toISOString() });
    }
  },

  linkNotes: async (noteId, linkedNoteId) => {
    const note = get().notes.find(n => n.id === noteId);
    if (!note) return;

    const linkedNotes = [...(note.linkedNotes || [])];
    if (!linkedNotes.includes(linkedNoteId)) {
      linkedNotes.push(linkedNoteId);
      await get().updateNote(noteId, { linkedNotes });
      
      // Award XP for linking notes
      await awardXp.richNoteLink(noteId, linkedNoteId);
      
      const { addActivity } = useActivityLogStore.getState();
      addActivity({
        type: 'rich_note',
        description: `Linked notes together`,
        metadata: { noteId, linkedNoteId },
        accountId: note.accountId,
        xpEarned: 3,
      });
    }
  },

  unlinkNotes: async (noteId, linkedNoteId) => {
    const note = get().notes.find(n => n.id === noteId);
    if (!note) return;

    const linkedNotes = (note.linkedNotes || []).filter(id => id !== linkedNoteId);
    await get().updateNote(noteId, { linkedNotes });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSelectedFolder: (folder) => set({ selectedFolder: folder }),
  setShowFavoritesOnly: (show) => set({ showFavoritesOnly: show }),

  renameFolder: async (oldName: string, newName: string) => {
    const { notes } = get();
    const notesToUpdate = notes.filter(note => note.folder === oldName);
    
    if (notesToUpdate.length === 0) return;
    
    try {
      // Update all notes in the folder
      await Promise.all(
        notesToUpdate.map(note => 
          service.update(note.id, { folder: newName })
        )
      );
      
      // Update local state
      set(state => ({
        notes: state.notes.map(note => 
          note.folder === oldName 
            ? { ...note, folder: newName }
            : note
        ),
        selectedFolder: state.selectedFolder === oldName ? newName : state.selectedFolder
      }));
      
      const { addActivity } = useActivityLogStore.getState();
      addActivity({
        type: 'rich_note',
        description: `Renamed folder "${oldName}" to "${newName}"`,
        metadata: { 
          oldFolderName: oldName, 
          newFolderName: newName,
          notesCount: notesToUpdate.length 
        },
        accountId: notesToUpdate[0].accountId,
      });
    } catch (error) {
      console.error('Failed to rename folder:', error);
      throw error;
    }
  },

  deleteFolder: async (folderName: string) => {
    const { notes } = get();
    const notesToUpdate = notes.filter(note => note.folder === folderName);
    
    if (notesToUpdate.length === 0) return;
    
    try {
      // Remove folder from all notes (set to undefined)
      await Promise.all(
        notesToUpdate.map(note => 
          service.update(note.id, { folder: undefined })
        )
      );
      
      // Update local state
      set(state => ({
        notes: state.notes.map(note => 
          note.folder === folderName 
            ? { ...note, folder: undefined }
            : note
        ),
        selectedFolder: state.selectedFolder === folderName ? null : state.selectedFolder
      }));
      
      const { addActivity } = useActivityLogStore.getState();
      addActivity({
        type: 'rich_note',
        description: `Deleted folder "${folderName}" (${notesToUpdate.length} notes moved to root)`,
        metadata: { 
          folderName,
          notesCount: notesToUpdate.length 
        },
        accountId: notesToUpdate[0].accountId,
      });
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  },

  getFilteredNotes: () => {
    const { notes, searchQuery, selectedCategory, selectedFolder, showFavoritesOnly } = get();
    
    return notes.filter(note => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(query);
        const matchesContent = note.content.toLowerCase().includes(query);
        const matchesTags = note.tags.some(tag => tag.toLowerCase().includes(query));
        
        if (!matchesTitle && !matchesContent && !matchesTags) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory && note.category !== selectedCategory) {
        return false;
      }

      // Folder filter
      if (selectedFolder && note.folder !== selectedFolder) {
        return false;
      }

      // Favorites filter
      if (showFavoritesOnly && !note.isFavorite) {
        return false;
      }

      return true;
    });
  },

  getFolders: () => {
    const { notes } = get();
    const folders = new Set<string>();
    notes.forEach(note => {
      if (note.folder) folders.add(note.folder);
    });
    return Array.from(folders).sort();
  },

  getCategories: () => {
    const { notes } = get();
    const categories = new Set<string>();
    notes.forEach(note => {
      categories.add(note.category);
    });
    return Array.from(categories).sort();
  },

  getNoteById: (id) => {
    return get().notes.find(note => note.id === id);
  },

  getLinkedNotes: (noteId) => {
    const { notes } = get();
    const note = notes.find(n => n.id === noteId);
    if (!note || !note.linkedNotes) return [];
    
    return note.linkedNotes
      .map(id => notes.find(n => n.id === id))
      .filter(Boolean) as RichNote[];
  },
}));
