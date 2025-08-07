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

  addActivity: async (activity) => {
    try {
      const now = new Date().toISOString();
      const newActivity = await activityLogService.create({
        ...activity,
        createdAt: now,
        updatedAt: now,
      });

      const formattedActivity = {
        ...newActivity,
        createdAt: new Date(newActivity.createdAt),
        updatedAt: new Date(newActivity.updatedAt),
      };

      const currentActivities = get().activities;
      set({ activities: [formattedActivity, ...currentActivities.slice(0, 99)] }); // Keep only 100 most recent
    } catch (error) {
      console.error('Failed to add activity:', error);
    }
  },

  clearActivities: () => {
    set({ activities: [] });
  }
}));