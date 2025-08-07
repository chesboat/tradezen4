import { create } from 'zustand';
import { ActivityLogEntry } from '@/types';
import { ActivityLogState } from '@/types/stores';
import { FirestoreService } from '@/lib/firestore';

const activityLogService = new FirestoreService<ActivityLogEntry>('activityLog');

export const useActivityLogStore = create<ActivityLogState>((set, get) => ({
  isExpanded: false,
  activities: [],

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
        id: Date.now().toString(),
        createdAt: now,
        updatedAt: now,
      };

      const currentActivities = get().activities;
      set({ activities: [newActivity, ...currentActivities.slice(0, 99)] }); // Keep only 100 most recent
      
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
  }
}));