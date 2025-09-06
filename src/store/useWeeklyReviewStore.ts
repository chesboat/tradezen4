import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { WeeklyReview } from '@/types';
import { generateId } from '@/lib/localStorageUtils';
import { FirestoreService } from '@/lib/firestore';

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
  
  // Storage
  saveToStorage: () => void;
  loadFromStorage: () => void;
  syncToFirestore: () => Promise<void>;
  loadFromFirestore: () => Promise<void>;
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

      addReview: (reviewData) => {
        const newReview: WeeklyReview = {
          ...reviewData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          reviews: [newReview, ...state.reviews],
        }));

        get().saveToStorage();
        
        // Sync to Firestore asynchronously
        weeklyReviewService.create(newReview).catch(error => {
          console.error('Failed to sync weekly review to Firestore:', error);
        });
        
        return newReview;
      },

      updateReview: (id, updates) => {
        const updatedReview = { ...updates, updatedAt: new Date() };
        
        set((state) => ({
          reviews: state.reviews.map((review) =>
            review.id === id
              ? { ...review, ...updatedReview }
              : review
          ),
        }));
        
        get().saveToStorage();
        
        // Sync to Firestore asynchronously
        weeklyReviewService.update(id, updatedReview).catch(error => {
          console.error('Failed to sync weekly review update to Firestore:', error);
        });
      },

      deleteReview: (id) => {
        set((state) => ({
          reviews: state.reviews.filter((review) => review.id !== id),
        }));
        
        get().saveToStorage();
        
        // Sync to Firestore asynchronously
        weeklyReviewService.delete(id).catch(error => {
          console.error('Failed to delete weekly review from Firestore:', error);
        });
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

      markReviewComplete: (id) => {
        const review = get().reviews.find(r => r.id === id);
        if (!review) return;

        const xpEarned = 150; // Base XP for completing weekly review

        get().updateReview(id, {
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

      saveToStorage: () => {
        try {
          const { reviews } = get();
          localStorage.setItem('weeklyReviews', JSON.stringify(reviews));
        } catch (error) {
          console.error('Failed to save weekly reviews to localStorage:', error);
        }
      },

      loadFromStorage: () => {
        try {
          const stored = localStorage.getItem('weeklyReviews');
          if (stored) {
            let reviews = JSON.parse(stored);
            
            // Migration: Fix weekOf dates that were created with the old buggy getMondayOfWeek
            reviews = reviews.map((review: any) => {
              if (review.weekOf === '2025-08-19') {
                console.log('Migrating review from 2025-08-19 to 2025-08-18');
                return { ...review, weekOf: '2025-08-18' };
              }
              return review;
            });
            
            set({ reviews });
            
            // Save migrated data back to localStorage
            localStorage.setItem('weeklyReviews', JSON.stringify(reviews));
          }
        } catch (error) {
          console.error('Failed to load weekly reviews from localStorage:', error);
        }
      },

      syncToFirestore: async () => {
        try {
          const { reviews } = get();
          
          // Sync all reviews to Firestore
          for (const review of reviews) {
            try {
              await weeklyReviewService.setWithId(review.id, review);
            } catch (error) {
              console.error(`Failed to sync review ${review.id} to Firestore:`, error);
            }
          }
          
          console.log('Weekly reviews synced to Firestore');
        } catch (error) {
          console.error('Failed to sync weekly reviews to Firestore:', error);
        }
      },

      loadFromFirestore: async () => {
        try {
          set({ isLoading: true });
          
          const firestoreReviews = await weeklyReviewService.getAll();
          
          // Merge with local reviews, preferring Firestore data for conflicts
          const localReviews = get().reviews;
          const reviewsById = new Map<string, WeeklyReview>();
          
          // Add local reviews first
          localReviews.forEach(review => reviewsById.set(review.id, review));
          
          // Override with Firestore reviews (they take precedence)
          firestoreReviews.forEach(review => {
            // Convert Firestore timestamps back to Date objects
            const processedReview = {
              ...review,
              createdAt: review.createdAt instanceof Date ? review.createdAt : new Date(review.createdAt),
              updatedAt: review.updatedAt instanceof Date ? review.updatedAt : new Date(review.updatedAt),
              completedAt: review.completedAt ? (review.completedAt instanceof Date ? review.completedAt : new Date(review.completedAt)) : undefined,
            };
            reviewsById.set(review.id, processedReview);
          });
          
          const mergedReviews = Array.from(reviewsById.values())
            .sort((a, b) => new Date(b.weekOf).getTime() - new Date(a.weekOf).getTime());
          
          set({ reviews: mergedReviews, isLoading: false });
          get().saveToStorage();
          
          console.log('Weekly reviews loaded from Firestore');
        } catch (error) {
          console.error('Failed to load weekly reviews from Firestore:', error);
          set({ isLoading: false });
        }
      },
    }),
    { name: 'weekly-review-store' }
  )
);

// Initialize store on load
if (typeof window !== 'undefined') {
  useWeeklyReviewStore.getState().loadFromStorage();
}
