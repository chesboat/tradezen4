import { create } from 'zustand';
import { ActivityLogState, ActivityLogEntry } from '@/types';
import { localStorage, STORAGE_KEYS, generateId } from '@/lib/localStorageUtils';

/**
 * Zustand store for activity log state management
 */
export const useActivityLogStore = create<ActivityLogState>((set, get) => ({
  // Initialize with persisted state
  isExpanded: localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG_EXPANDED, true),
  activities: localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG, []),

  // Toggle activity log expanded/collapsed state
  toggleActivityLog: () => {
    const newState = !get().isExpanded;
    set({ isExpanded: newState });
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG_EXPANDED, newState);
  },

  // Set activity log expanded state directly
  setActivityLogExpanded: (expanded: boolean) => {
    set({ isExpanded: expanded });
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG_EXPANDED, expanded);
  },

  // Add new activity to the log
  addActivity: (activity: Omit<ActivityLogEntry, 'id' | 'createdAt'>) => {
    const newActivity: ActivityLogEntry = {
      ...activity,
      id: generateId(),
      createdAt: new Date(),
    };

    const currentActivities = get().activities;
    const updatedActivities = [newActivity, ...currentActivities].slice(0, 100); // Keep last 100 activities

    set({ activities: updatedActivities });
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, updatedActivities);
  },

  // Clear all activities
  clearActivities: () => {
    set({ activities: [] });
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, []);
  },
}));

// Selector hooks for performance optimization
export const useActivityLogExpanded = () => useActivityLogStore((state) => state.isExpanded);
export const useActivities = () => useActivityLogStore((state) => state.activities);
export const useActivityLogActions = () => useActivityLogStore((state) => ({
  toggleActivityLog: state.toggleActivityLog,
  setActivityLogExpanded: state.setActivityLogExpanded,
  addActivity: state.addActivity,
  clearActivities: state.clearActivities,
}));

// Recent activities selector (last 10)
export const useRecentActivities = () => useActivityLogStore((state) => 
  state.activities.slice(0, 10)
);

// Activities by type selector
export const useActivitiesByType = (type: string) => useActivityLogStore((state) => 
  state.activities.filter(activity => activity.type === type)
); 