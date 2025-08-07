import { create } from 'zustand';
import { SidebarState } from '@/types';
import { localStorage, STORAGE_KEYS } from '@/lib/localStorageUtils';

/**
 * Zustand store for sidebar state management
 */
export const useSidebarStore = create<SidebarState>((set, get) => ({
  // Initialize with persisted state
  isExpanded: localStorage.getItem(STORAGE_KEYS.SIDEBAR_EXPANDED, true),

  // Toggle sidebar expanded/collapsed state
  toggleSidebar: () => {
    const newState = !get().isExpanded;
    set({ isExpanded: newState });
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_EXPANDED, newState);
  },

  // Set sidebar expanded state directly
  setSidebarExpanded: (expanded: boolean) => {
    set({ isExpanded: expanded });
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_EXPANDED, expanded);
  },
}));

// Selector hooks for performance optimization
export const useSidebarExpanded = () => useSidebarStore((state) => state.isExpanded);
export const useSidebarActions = () => useSidebarStore((state) => ({
  toggleSidebar: state.toggleSidebar,
  setSidebarExpanded: state.setSidebarExpanded,
})); 