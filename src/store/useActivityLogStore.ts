import { create } from 'zustand';
import { ActivityLogEntry } from '@/types';
import { ActivityLogState } from '@/types/stores';
import { FirestoreService } from '@/lib/firestore';
import { localStorage, STORAGE_KEYS } from '@/lib/localStorageUtils';

const activityLogService = new FirestoreService<ActivityLogEntry>('activityLog');

export const useActivityLogStore = create<ActivityLogState>((set, get) => ({
  isExpanded: false,
  activities: localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG, [] as ActivityLogEntry[]),

  toggleActivityLog: () => {
    set((state) => ({ isExpanded: !state.isExpanded }));
  },

  setActivityLogExpanded: (expanded) => {
    set({ isExpanded: expanded });
  },

  addActivity: (activity) => {
    try {
      const now = new Date();
      const newActivity = {
        ...activity,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };

      const currentActivities = get().activities;
      const updated = [newActivity, ...currentActivities.slice(0, 99)];
      set({ activities: updated }); // Keep only 100 most recent
      // Persist
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, updated);
      
      // Trigger user profile stats refresh after adding activity
      // Import dynamically to avoid circular dependencies
      import('./useUserProfileStore').then(({ useUserProfileStore }) => {
        useUserProfileStore.getState().refreshStats();
      });
    } catch (error) {
      console.error('Failed to add activity:', error);
    }
  },

  clearActivities: () => {
    set({ activities: [] });
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, [] as ActivityLogEntry[]);
  }
}));