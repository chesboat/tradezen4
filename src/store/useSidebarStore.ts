import { create } from 'zustand';
import { SidebarState } from '@/types/stores';
import { localStorage, STORAGE_KEYS } from '@/lib/localStorageUtils';

export const useSidebarStore = create<SidebarState>((set, get) => ({
  isExpanded: localStorage.getItem(STORAGE_KEYS.SIDEBAR_EXPANDED, true),

  toggleSidebar: () => {
    const newExpanded = !get().isExpanded;
    set({ isExpanded: newExpanded });
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_EXPANDED, newExpanded);
  },

  setSidebarExpanded: (expanded) => {
    set({ isExpanded: expanded });
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_EXPANDED, expanded);
  }
}));