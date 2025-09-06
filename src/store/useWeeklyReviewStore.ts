import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { WeeklyReview } from '@/types';
import { generateId } from '@/lib/localStorageUtils';
import { FirestoreService } from '@/lib/firestore';
import { onSnapshot, query, orderBy, collection } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

interface WeeklyReviewState {
  reviews: WeeklyReview[];
  isLoading: boolean;

  // Actions
  addReview: (reviewData: Omit<WeeklyReview, 'id' | 'createdAt' | 'updatedAt'>) => WeeklyReview;
  updateReview: (id: string, updates: Partial<WeeklyReview>) => void;
  deleteReview: (id: string) => void;
  getReviewByWeek: (weekOf: string, accountId: string) => WeeklyReview | undefined;
  getReviewsByAccount: (accountId: string) => WeeklyReview[];
  markReviewComplete: (id: string) => void;
  getWeeklyReviewStreak: (accountId: string) => number;
  
  // Utility functions
  getMondayOfWeek: (date: Date) => string;
  isWeekReviewAvailable: (weekOf: string, accountId: string) => boolean;
  getCurrentWeekReview: (accountId: string) => WeeklyReview | undefined;
  
  // Initialization
  initializeWeeklyReviews: (userIdOverride?: string) => Promise<void>;
}

// Helper function to get Monday of a given week
const getMondayOfWeek = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  // For Sunday (0), we want the next Monday (+1), not the previous Monday (-6)
  const diff = d.getDate() - day + (day === 0 ? 1 : 1); 
  d.setDate(diff);
  return d.toISOString().split('T')[0];
};

// Helper function to check if a week review should be available
// Window: From Friday 4:00 PM local time through Sunday 11:59:59 PM local time
const isWeekReviewAvailable = (weekOf: string): boolean => {
  const monday = new Date(weekOf);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4); // Friday

  const now = new Date();

  const windowStart = new Date(friday);
  windowStart.setHours(16, 0, 0, 0); // 4:00 PM local

  const sundayEnd = new Date(monday);
  sundayEnd.setDate(monday.getDate() + 6); // Sunday
  sundayEnd.setHours(23, 59, 59, 999);

  return now >= windowStart && now <= sundayEnd;
};

const weeklyReviewService = new FirestoreService<WeeklyReview>('weeklyReviews');

export const useWeeklyReviewStore = create<WeeklyReviewState>()(
  devtools(
    (set, get) => ({
      reviews: [],
      isLoading: false,

      // Initialize with real-time Firebase subscription
      initializeWeeklyReviews: async (userIdOverride?: string) => {
        try {
          set({ isLoading: true });
          
          // Clean up existing subscription
          try {
            const existingUnsub = (window as any).__weeklyReviewsUnsub;
            if (typeof existingUnsub === 'function') existingUnsub();
          } catch {}
          
          const userId = userIdOverride || auth.currentUser?.uid;
          if (userId) {
            const colRef = collection(db as any, `users/${userId}/weeklyReviews`);
            const q = query(colRef, orderBy('weekOf', 'desc'));
            const unsub = onSnapshot(q, (snap) => {
              const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as WeeklyReview[];
              const formatted = docs.map(review => ({
                ...review,
                createdAt: review.createdAt instanceof Date ? review.createdAt : new Date(review.createdAt),
                updatedAt: review.updatedAt instanceof Date ? review.updatedAt : new Date(review.updatedAt),
                completedAt: review.completedAt ? (review.completedAt instanceof Date ? review.completedAt : new Date(review.completedAt)) : undefined,
              }));
              
              set({ reviews: formatted, isLoading: false });
              console.log('Weekly reviews loaded from Firebase:', formatted.length);
            }, (error) => {
              console.error('Weekly reviews snapshot error:', error);
              set({ isLoading: false });
            });
            (window as any).__weeklyReviewsUnsub = unsub;
          }
        } catch (error) {
          console.error('Failed to initialize weekly reviews:', error);
          set({ isLoading: false });
        }
      },

      addReview: async (reviewData) => {
        try {
          const newReview = await weeklyReviewService.create({
            ...reviewData,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          // The real-time subscription will update the state automatically
          return newReview;
        } catch (error) {
          console.error('Failed to add weekly review:', error);
          throw error;
        }
      },

      updateReview: async (id, updates) => {
        try {
          await weeklyReviewService.update(id, {
            ...updates,
            updatedAt: new Date(),
          });
          // The real-time subscription will update the state automatically
        } catch (error) {
          console.error('Failed to update weekly review:', error);
          throw error;
        }
      },

      deleteReview: async (id) => {
        try {
          await weeklyReviewService.delete(id);
          // The real-time subscription will update the state automatically
        } catch (error) {
          console.error('Failed to delete weekly review:', error);
          throw error;
        }
      },

      getReviewByWeek: (weekOf, accountId) => {
        const { reviews } = get();
        return reviews.find(
          (review) => review.weekOf === weekOf && review.accountId === accountId
        );
      },

      getReviewsByAccount: (accountId) => {
        const { reviews } = get();
        return reviews
          .filter((review) => review.accountId === accountId)
          .sort((a, b) => new Date(b.weekOf).getTime() - new Date(a.weekOf).getTime());
      },

      markReviewComplete: async (id) => {
        const review = get().reviews.find(r => r.id === id);
        if (!review) return;

        const xpEarned = 150; // Base XP for completing weekly review

        try {
          await get().updateReview(id, {
            isComplete: true,
            completedAt: new Date(),
            xpEarned,
          });

          // Award XP through the prestige system
          import('@/lib/xp/XpService').then(({ awardXp }) => {
            awardXp.weeklyReview().catch(console.error);
          });

          // Add activity log entry for completion
          import('./useActivityLogStore').then(({ useActivityLogStore }) => {
            useActivityLogStore.getState().addActivity({
              type: 'weekly_review',
              title: 'Weekly Review Completed',
              description: `Completed weekly review for ${new Date(review.weekOf).toLocaleDateString()}`,
              xpEarned,
              relatedId: id,
              accountId: review.accountId,
            });
          });
        } catch (error) {
          console.error('Failed to mark review complete:', error);
        }
      },

      getWeeklyReviewStreak: (accountId) => {
        const reviews = get().getReviewsByAccount(accountId);
        const completedReviews = reviews.filter(r => r.isComplete);
        
        if (completedReviews.length === 0) return 0;

        let streak = 0;
        const currentWeek = getMondayOfWeek(new Date());
        
        // Start from current week and work backwards
        let checkWeek = currentWeek;
        
        for (let i = 0; i < completedReviews.length; i++) {
          const weekReview = completedReviews.find(r => r.weekOf === checkWeek);
          
          if (weekReview && weekReview.isComplete) {
            streak++;
            // Move to previous week
            const prevWeek = new Date(checkWeek);
            prevWeek.setDate(prevWeek.getDate() - 7);
            checkWeek = prevWeek.toISOString().split('T')[0];
          } else {
            break;
          }
        }

        return streak;
      },

      getMondayOfWeek,

      isWeekReviewAvailable: (weekOf, accountId) => {
        // Check if review is available and not already completed
        const existingReview = get().getReviewByWeek(weekOf, accountId);
        if (existingReview?.isComplete) return false;
        
        return isWeekReviewAvailable(weekOf);
      },

      getCurrentWeekReview: (accountId) => {
        const currentWeekMonday = getMondayOfWeek(new Date());
        return get().getReviewByWeek(currentWeekMonday, accountId);
      },

      getMondayOfWeek,

      isWeekReviewAvailable: (weekOf, accountId) => {
        // Check if review is available and not already completed
        const existingReview = get().getReviewByWeek(weekOf, accountId);
        if (existingReview?.isComplete) return false;
        
        return isWeekReviewAvailable(weekOf);
      },

      getCurrentWeekReview: (accountId) => {
        const currentWeekMonday = getMondayOfWeek(new Date());
        return get().getReviewByWeek(currentWeekMonday, accountId);
      },
    }),
    { name: 'weekly-review-store' }
  )
);

// Export initialization function for use in App.tsx
export const initializeWeeklyReviewStore = async () => {
  const { initializeWeeklyReviews } = useWeeklyReviewStore.getState();
  await initializeWeeklyReviews();
};
