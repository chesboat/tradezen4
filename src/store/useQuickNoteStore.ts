import { create } from 'zustand';
import { QuickNote, QuickNoteState, MoodType } from '@/types';
import { localStorage, STORAGE_KEYS, generateId } from '@/lib/localStorageUtils';

/**
 * Extended QuickNote state with additional functionality
 */
interface QuickNoteStoreState extends QuickNoteState {
  // Tag management
  allTags: string[];
  suggestedTags: string[];
  tagUsageCount: Record<string, number>;
  
  // Draft management
  draftNote: Partial<QuickNote> | null;
  
  // UI state
  isModalOpen: boolean;
  editingNoteId: string | null;
  
  // Tag operations
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  getSuggestedTags: () => string[];
  getTagsByUsage: () => string[];
  cleanupUnusedTags: () => void;
  getTagStats: () => Record<string, { count: number; lastUsed: Date | null }>;
  
  // Draft operations
  saveDraft: (draft: Partial<QuickNote>) => void;
  loadDraft: () => Partial<QuickNote> | null;
  clearDraft: () => void;
  
  // Modal operations
  openModal: (editingNoteId?: string) => void;
  closeModal: () => void;
  
  // Enhanced query operations
  getNotesByDateRange: (startDate: Date, endDate: Date) => QuickNote[];
  getNotesForDate: (date: Date) => QuickNote[];
  searchNotes: (query: string) => QuickNote[];
  
  // Inline note operations
  addInlineNote: (content: string, accountId: string, dateObj?: Date) => QuickNote;
  
  // Analytics
  getNotesStats: () => {
    totalNotes: number;
    notesToday: number;
    mostUsedTags: string[];
    avgNotesPerDay: number;
  };
}

/**
 * Zustand store for Quick Notes management
 */
export const useQuickNoteStore = create<QuickNoteStoreState>((set, get) => {
  // Helper function to convert note objects with string dates back to Date objects
  const convertNoteDates = (note: any): QuickNote => ({
    ...note,
    createdAt: typeof note.createdAt === 'string' ? new Date(note.createdAt) : note.createdAt,
    updatedAt: typeof note.updatedAt === 'string' ? new Date(note.updatedAt) : note.updatedAt,
  });

  // Load notes from localStorage and convert dates
  const loadNotesFromStorage = (): QuickNote[] => {
    const storedNotes = localStorage.getItem(STORAGE_KEYS.QUICK_NOTES, []);
    return storedNotes.map(convertNoteDates);
  };

  return {
    // Initialize with persisted state (with proper date conversion)
    notes: loadNotesFromStorage(),
    allTags: localStorage.getItem(`${STORAGE_KEYS.QUICK_NOTES}_tags`, []),
    suggestedTags: [
      'setup', 'entry', 'exit', 'mistake', 'lesson', 'emotion', 'analysis',
      'pattern', 'news', 'scalp', 'swing', 'day-trade', 'FOMO', 'discipline'
    ],
    tagUsageCount: localStorage.getItem(`${STORAGE_KEYS.QUICK_NOTES}_tag_usage`, {}),
    draftNote: null,
    isModalOpen: false,
    editingNoteId: null,

    // Add new note
    addNote: (note: Omit<QuickNote, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newNote: QuickNote = {
        ...note,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const currentNotes = get().notes;
      const updatedNotes = [newNote, ...currentNotes];

      // Update tag usage count
      const tagUsageCount = { ...get().tagUsageCount };
      note.tags.forEach(tag => {
        tagUsageCount[tag] = (tagUsageCount[tag] || 0) + 1;
      });

      // Update all tags list
      const allTags = Array.from(new Set([...get().allTags, ...note.tags]));

      set({ 
        notes: updatedNotes,
        allTags,
        tagUsageCount 
      });

      // Persist to localStorage
      localStorage.setItem(STORAGE_KEYS.QUICK_NOTES, updatedNotes);
      localStorage.setItem(`${STORAGE_KEYS.QUICK_NOTES}_tags`, allTags);
      localStorage.setItem(`${STORAGE_KEYS.QUICK_NOTES}_tag_usage`, tagUsageCount);

      return newNote;
    },

    // Update existing note
    updateNote: (id: string, updates: Partial<QuickNote>) => {
      const currentNotes = get().notes;
      const existingNote = currentNotes.find(note => note.id === id);
      
      if (!existingNote) return;

      const updatedNotes = currentNotes.map(note => 
        note.id === id 
          ? { ...note, ...updates, updatedAt: new Date() }
          : note
      );

      // Update tag usage if tags changed
      if (updates.tags) {
        const tagUsageCount = { ...get().tagUsageCount };
        
        // Decrease count for old tags
        existingNote.tags.forEach(tag => {
          tagUsageCount[tag] = Math.max(0, (tagUsageCount[tag] || 0) - 1);
        });
        
        // Increase count for new tags
        updates.tags.forEach(tag => {
          tagUsageCount[tag] = (tagUsageCount[tag] || 0) + 1;
        });
        
        // Update all tags list
        const allTags = Array.from(new Set([...get().allTags, ...updates.tags]));

        set({ 
          notes: updatedNotes,
          allTags,
          tagUsageCount 
        });

        localStorage.setItem(`${STORAGE_KEYS.QUICK_NOTES}_tags`, allTags);
        localStorage.setItem(`${STORAGE_KEYS.QUICK_NOTES}_tag_usage`, tagUsageCount);
      } else {
        set({ notes: updatedNotes });
      }

      localStorage.setItem(STORAGE_KEYS.QUICK_NOTES, updatedNotes);
    },

    // Delete note
    deleteNote: (id: string) => {
      const currentNotes = get().notes;
      const noteToDelete = currentNotes.find(note => note.id === id);
      
      if (!noteToDelete) return;

      const updatedNotes = currentNotes.filter(note => note.id !== id);

      // Update tag usage count
      const tagUsageCount = { ...get().tagUsageCount };
      noteToDelete.tags.forEach(tag => {
        tagUsageCount[tag] = Math.max(0, (tagUsageCount[tag] || 0) - 1);
      });

      set({ 
        notes: updatedNotes,
        tagUsageCount 
      });

      localStorage.setItem(STORAGE_KEYS.QUICK_NOTES, updatedNotes);
      localStorage.setItem(`${STORAGE_KEYS.QUICK_NOTES}_tag_usage`, tagUsageCount);
    },

    // Get notes by account
    getNotesByAccount: (accountId: string) => {
      return get().notes.filter(note => note.accountId === accountId);
    },

    // Get notes by tag
    getNotesByTag: (tag: string) => {
      return get().notes.filter(note => note.tags.includes(tag));
    },

    // Get notes by date range
    getNotesByDateRange: (startDate: Date, endDate: Date) => {
      return get().notes.filter(note => {
        const noteDate = new Date(note.createdAt);
        return noteDate >= startDate && noteDate <= endDate;
      });
    },

    // Get notes for specific date
    getNotesForDate: (date: Date) => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      return get().getNotesByDateRange(dayStart, dayEnd);
    },

    // Search notes
    searchNotes: (query: string) => {
      const searchTerm = query.toLowerCase();
      return get().notes.filter(note => 
        note.content.toLowerCase().includes(searchTerm) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    },

    // Tag management
    addTag: (tag: string) => {
      const cleanTag = tag.trim().toLowerCase();
      if (!cleanTag) return;

      const allTags = get().allTags;
      if (!allTags.includes(cleanTag)) {
        const updatedTags = [...allTags, cleanTag];
        set({ allTags: updatedTags });
        localStorage.setItem(`${STORAGE_KEYS.QUICK_NOTES}_tags`, updatedTags);
      }
    },

    removeTag: (tag: string) => {
      const allTags = get().allTags.filter(t => t !== tag);
      set({ allTags });
      localStorage.setItem(`${STORAGE_KEYS.QUICK_NOTES}_tags`, allTags);
    },

    getSuggestedTags: () => {
      const { suggestedTags, allTags } = get();
      const recentTags = get().getTagsByUsage().slice(0, 5);
      return Array.from(new Set([...recentTags, ...suggestedTags, ...allTags]));
    },

    getTagsByUsage: () => {
      const { tagUsageCount } = get();
      return Object.entries(tagUsageCount)
        .sort(([, a], [, b]) => b - a)
        .map(([tag]) => tag);
    },

    cleanupUnusedTags: () => {
      const { notes, allTags } = get();
      const usedTags = new Set<string>();
      
      notes.forEach(note => {
        note.tags.forEach(tag => usedTags.add(tag));
      });
      
      const cleanedTags = allTags.filter(tag => usedTags.has(tag));
      const cleanedUsageCount: Record<string, number> = {};
      
      Object.entries(get().tagUsageCount).forEach(([tag, count]) => {
        if (usedTags.has(tag)) {
          cleanedUsageCount[tag] = count;
        }
      });
      
      set({ 
        allTags: cleanedTags,
        tagUsageCount: cleanedUsageCount 
      });
      
      localStorage.setItem(`${STORAGE_KEYS.QUICK_NOTES}_tags`, cleanedTags);
      localStorage.setItem(`${STORAGE_KEYS.QUICK_NOTES}_tag_usage`, cleanedUsageCount);
    },

    getTagStats: () => {
      const { notes, allTags } = get();
      const stats: Record<string, { count: number; lastUsed: Date | null }> = {};
      
      // Initialize all tags
      allTags.forEach(tag => {
        stats[tag] = { count: 0, lastUsed: null };
      });
      
      // Count usage
      notes.forEach(note => {
        note.tags.forEach(tag => {
          if (stats[tag]) {
            stats[tag].count++;
            if (!stats[tag].lastUsed || note.createdAt > stats[tag].lastUsed!) {
              stats[tag].lastUsed = note.createdAt;
            }
          }
        });
      });
      
      return stats;
    },

    // Draft management
    saveDraft: (draft: Partial<QuickNote>) => {
      set({ draftNote: draft });
      localStorage.setItem(`${STORAGE_KEYS.QUICK_NOTES}_draft`, draft);
    },

    loadDraft: () => {
      const draft = localStorage.getItem(`${STORAGE_KEYS.QUICK_NOTES}_draft`, null);
      set({ draftNote: draft });
      return draft;
    },

    clearDraft: () => {
      set({ draftNote: null });
      localStorage.removeItem(`${STORAGE_KEYS.QUICK_NOTES}_draft`);
    },

    // Modal operations
    openModal: (editingNoteId?: string) => {
      set({ 
        isModalOpen: true, 
        editingNoteId: editingNoteId || null 
      });
    },

    closeModal: () => {
      set({ 
        isModalOpen: false, 
        editingNoteId: null 
      });
    },

    // Analytics
    getNotesStats: () => {
      const { notes, tagUsageCount } = get();
      const today = new Date();
      const notesToday = get().getNotesForDate(today).length;
      
      // Calculate average notes per day over last 30 days
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentNotes = get().getNotesByDateRange(thirtyDaysAgo, today);
      const avgNotesPerDay = recentNotes.length / 30;
      
      // Get most used tags
      const mostUsedTags = Object.entries(tagUsageCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);

      return {
        totalNotes: notes.length,
        notesToday,
        mostUsedTags,
        avgNotesPerDay: Math.round(avgNotesPerDay * 10) / 10,
      };
    },

    // Inline note with hashtag parsing
    addInlineNote: (content: string, accountId: string, dateObj?: Date) => {
      // Parse hashtags from content
      const hashtagRegex = /#([a-zA-Z0-9_-]+)/g;
      const hashtags: string[] = [];
      let match;
      
      while ((match = hashtagRegex.exec(content)) !== null) {
        const tag = match[1].toLowerCase();
        if (!hashtags.includes(tag)) {
          hashtags.push(tag);
        }
      }
      
      // Clean content by removing hashtags
      const cleanContent = content.replace(hashtagRegex, '').replace(/\s+/g, ' ').trim();
      
      // Calculate the creation date
      let createdAt: Date;
      if (dateObj) {
        // For a specific date, add some random time within that day
        const dayStart = new Date(dateObj);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dateObj);
        dayEnd.setHours(23, 59, 59, 999);
        const randomTime = dayStart.getTime() + Math.random() * (dayEnd.getTime() - dayStart.getTime());
        createdAt = new Date(randomTime);
      } else {
        createdAt = new Date();
      }
      
      // Create the complete note directly
      const newNote: QuickNote = {
        id: generateId(),
        content: cleanContent,
        accountId,
        tags: hashtags,
        createdAt,
        updatedAt: new Date(),
      };

      const currentNotes = get().notes;
      const updatedNotes = [newNote, ...currentNotes];

      // Update tag usage count
      const tagUsageCount = { ...get().tagUsageCount };
      hashtags.forEach(tag => {
        tagUsageCount[tag] = (tagUsageCount[tag] || 0) + 1;
      });

      // Update all tags list
      const allTags = Array.from(new Set([...get().allTags, ...hashtags]));

      set({ 
        notes: updatedNotes,
        allTags,
        tagUsageCount 
      });

      // Persist to localStorage
      localStorage.setItem(STORAGE_KEYS.QUICK_NOTES, updatedNotes);
      localStorage.setItem(`${STORAGE_KEYS.QUICK_NOTES}_tags`, allTags);
      localStorage.setItem(`${STORAGE_KEYS.QUICK_NOTES}_tag_usage`, tagUsageCount);

      return newNote;
    },
  };
});

// Selector hooks for performance optimization
export const useQuickNotes = () => useQuickNoteStore((state) => state.notes);
export const useQuickNoteActions = () => useQuickNoteStore((state) => ({
  addNote: state.addNote,
  updateNote: state.updateNote,
  deleteNote: state.deleteNote,
  openModal: state.openModal,
  closeModal: state.closeModal,
}));

export const useQuickNoteModal = () => useQuickNoteStore((state) => ({
  isModalOpen: state.isModalOpen,
  editingNoteId: state.editingNoteId,
  draftNote: state.draftNote,
  openModal: state.openModal,
  closeModal: state.closeModal,
  saveDraft: state.saveDraft,
  loadDraft: state.loadDraft,
  clearDraft: state.clearDraft,
}));

export const useQuickNoteTags = () => useQuickNoteStore((state) => ({
  allTags: state.allTags,
  suggestedTags: state.getSuggestedTags(),
  tagsByUsage: state.getTagsByUsage(),
  addTag: state.addTag,
  removeTag: state.removeTag,
})); 