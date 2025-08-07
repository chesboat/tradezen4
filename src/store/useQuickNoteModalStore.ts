import { create } from 'zustand';
import { QuickNote } from '@/types';

interface QuickNoteModalState {
  isOpen: boolean;
  editingNoteId?: string;
  draftNote?: Partial<QuickNote>;
  openModal: () => void;
  closeModal: () => void;
  setEditingNote: (noteId?: string) => void;
  saveDraft: (draft: Partial<QuickNote>) => void;
  loadDraft: () => Partial<QuickNote> | undefined;
  clearDraft: () => void;
}

export const useQuickNoteModalStore = create<QuickNoteModalState>((set, get) => ({
  isOpen: false,
  editingNoteId: undefined,
  draftNote: undefined,

  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false, editingNoteId: undefined }),
  setEditingNote: (noteId) => set({ editingNoteId: noteId }),
  
  saveDraft: (draft) => set({ draftNote: draft }),
  loadDraft: () => get().draftNote,
  clearDraft: () => set({ draftNote: undefined })
}));