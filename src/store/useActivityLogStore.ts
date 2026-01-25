import { create } from 'zustand';
import { ActivityLogEntry } from '@/types';
import { ActivityLogState } from '@/types/stores';
import { FirestoreService } from '@/lib/firestore';
import { onSnapshot, query, orderBy, limit, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const activityLogService = new FirestoreService<ActivityLogEntry>('activityLog');

let unsubscribe: (() => void) | null = null;

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
      const now = new Date();
      const newActivity = {
        ...activity,
        createdAt: now,
        updatedAt: now,
      };

      // Save to Firestore (real-time subscription will update state)
      await activityLogService.create(newActivity);
      
      // Trigger user profile stats refresh after adding activity
      import('./useUserProfileStore').then(({ useUserProfileStore }) => {
        useUserProfileStore.getState().refreshStats();
      });
    } catch (error) {
      console.error('Failed to add activity:', error);
      throw error;
    }
  },

  clearActivities: async () => {
    try {
      const activities = get().activities;
      // Delete all activities from Firestore
      await Promise.all(activities.map(a => activityLogService.delete(a.id)));
      set({ activities: [] });
    } catch (error) {
      console.error('Failed to clear activities:', error);
      throw error;
    }
  },

  // Initialize Firestore subscription
  initializeActivityLog: (userId: string) => {
    // Cleanup existing subscription
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    console.log('[Activity Log] Initializing for user:', userId);

    try {
      // Query activities for this user, ordered by creation date (newest first)
      // Limit to 200 most recent activities to keep performance good
      const colRef = collection(db as any, `users/${userId}/activityLog`);
      const q = query(colRef, orderBy('createdAt', 'desc'), limit(200));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const activities: ActivityLogEntry[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              type: data.type,
              title: data.title,
              description: data.description,
              xpEarned: data.xpEarned,
              relatedId: data.relatedId,
              accountId: data.accountId,
              priority: data.priority,
              metadata: data.metadata,
              // Handle Firestore Timestamps, ISO strings, or Date objects
              createdAt: data.createdAt?.toDate?.() 
                || (typeof data.createdAt === 'string' ? new Date(data.createdAt) : null)
                || data.createdAt
                || new Date(),
              updatedAt: data.updatedAt?.toDate?.() 
                || (typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : null)
                || data.updatedAt
                || new Date(),
            } as ActivityLogEntry;
          });

          console.log(`[Activity Log] Loaded ${activities.length} activities from Firestore`);
          set({ activities });
        },
        (error) => {
          console.error('[Activity Log] Subscription error:', error);
        }
      );
    } catch (error) {
      console.error('[Activity Log] Failed to initialize:', error);
    }
  },

  // Cleanup subscription
  cleanup: () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    set({ activities: [], isExpanded: false });
  },
}));