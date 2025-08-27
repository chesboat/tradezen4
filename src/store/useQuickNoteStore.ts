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

  // Resolve any legacy Firebase Storage URLs in note content that use
  // the JSON API query form `/o?name=...` into signed download URLs.
  // Handles multiple occurrences per note.
  _resolveLegacyStorageLinks: async (content: string): Promise<string> => {
    if (typeof content !== 'string' || content.indexOf('/o?name=') === -1) return content;
    const legacyRegexGlobal = /https?:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\?name=([^\s)]+)/ig;
    const storage = getStorage(app as any);
    let newContent = content;
    const matches = [...content.matchAll(legacyRegexGlobal)];
    for (const match of matches) {
      const full = match[0];
      const encodedPath = match[1];
      try {
        const storagePath = decodeURIComponent(encodedPath);
        const storageRef = ref(storage, storagePath);
        const dl = await getDownloadURL(storageRef);
        newContent = newContent.split(full).join(dl);
      } catch (_e) {
        // Ignore failures and leave the original URL
      }
    }
    return newContent;
  },

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

      // Background migration: replace legacy Firebase Storage URLs in note content
      // that use the JSON API form `/o?name=...` with signed download URLs.
      // This prevents CORS preflight 404s and standardizes links.
      const legacyRegex = /https?:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\?name=([^\s)]+)/i;
      const legacyRegexGlobal = /https?:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\?name=([^\s)]+)/ig;
      const storage = getStorage(app as any);
      (async () => {
        for (const n of formattedNotes) {
          if (typeof (n as any).content !== 'string') continue;
          const contentStr: string = (n as any).content;
          if (!legacyRegex.test(contentStr)) continue;
          let newContent = contentStr;
          const matches = [...contentStr.matchAll(legacyRegexGlobal)];
          for (const match of matches) {
            const full = match[0];
            const encodedPath = match[1];
            try {
              const storagePath = decodeURIComponent(encodedPath);
              const storageRef = ref(storage, storagePath);
              const dl = await getDownloadURL(storageRef);
              newContent = newContent.split(full).join(dl);
            } catch (_e) {
              // ignore this occurrence
            }
          }
          if (newContent !== contentStr) {
            await quickNoteService.update((n as any).id, { content: newContent, updatedAt: new Date().toISOString() } as any);
            // Update local state copy so UI reflects immediately
            set((prev) => ({
              notes: prev.notes.map((note) => note.id === (n as any).id ? { ...note, content: newContent, updatedAt: new Date() } : note)
            }));
          }
        }
      })();
    } catch (error) {
      console.error('Failed to initialize notes:', error);
      set({ notes: [], allTags: [] });
    }
  },

  addNote: async (note) => {
    try {
      const now = new Date().toISOString();
      // Sanitize content: resolve any legacy Storage links before saving
      const resolvedContent = await (get() as any)._resolveLegacyStorageLinks((note as any).content);
      const newNote = await quickNoteService.create({
        ...note,
        content: resolvedContent,
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
    // Temporarily use Cloudinary to bypass CORS issues
    console.log('🔧 uploadImage: Using Cloudinary to bypass CORS issues');
    
    // Use a demo Cloudinary account for now
    const cloudName = 'demo'; // Cloudinary's demo account
    const uploadPreset = 'ml_default'; // Default unsigned preset
    
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', uploadPreset);
    form.append('folder', 'tradezen4_quickNotes');
    
    try {
      const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: form
      });
      
      if (!resp.ok) {
        const txt = await resp.text();
        console.error('🚨 Cloudinary upload failed:', resp.status, txt);
        throw new Error(`Cloudinary upload failed: ${resp.status} ${txt}`);
      }
      
      const json = await resp.json();
      if (!json.secure_url) throw new Error('Cloudinary response missing secure_url');
      
      console.log('🔧 uploadImage: Cloudinary upload successful', { 
        originalSize: file.size, 
        cloudinaryUrl: json.secure_url 
      });
      
      return json.secure_url as string;
    } catch (error) {
      console.error('🚨 Cloudinary upload error:', error);
      throw error;
    }
    
    // Keep Firebase Storage code as fallback (commented out due to CORS)
    /*
    const provider = (import.meta as any).env.VITE_UPLOAD_PROVIDER as string | undefined;
    if (provider === 'cloudinary') {
      // Cloudinary unsigned upload
      const cloudName = (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
      const uploadPreset = (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
      if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET');
      }
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', uploadPreset);
      form.append('folder', 'quickNotes');
      const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: form
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Cloudinary upload failed: ${resp.status} ${txt}`);
      }
      const json = await resp.json();
      if (!json.secure_url) throw new Error('Cloudinary response missing secure_url');
      return json.secure_url as string;
    }
    */

    // Firebase Storage code removed - using Cloudinary instead
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
      const updateDataContent = typeof (updates as any).content === 'string'
        ? await (get() as any)._resolveLegacyStorageLinks((updates as any).content)
        : undefined;
      const updateData = {
        ...updates,
        ...(updateDataContent !== undefined ? { content: updateDataContent } : {}),
        updatedAt: new Date().toISOString(),
      };
      await quickNoteService.update(id, updateData);
      
      const currentNotes = get().notes;
      const updatedNotes = currentNotes.map(note => 
        note.id === id 
          ? { ...note, ...updateData, updatedAt: new Date() }
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