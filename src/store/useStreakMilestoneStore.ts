import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { MilestoneCelebration } from '@/lib/streakMilestones';
import { checkForNewMilestone, markMilestoneCelebrated } from '@/lib/streakMilestones';
import { logJournalStreakMilestone } from '@/lib/journalActivityLogger';

interface StreakMilestoneState {
  currentMilestone: MilestoneCelebration | null;
  
  /**
   * Check if a new milestone should be celebrated based on current streak
   * If yes, show the celebration automatically
   */
  checkAndCelebrate: (currentStreak: number) => void;
  
  /**
   * Dismiss the current celebration
   */
  dismiss: () => void;
}

export const useStreakMilestoneStore = create<StreakMilestoneState>()(
  devtools(
    (set, get) => ({
      currentMilestone: null,

      checkAndCelebrate: (currentStreak: number) => {
        const milestone = checkForNewMilestone(currentStreak);
        
        if (milestone) {
          console.log(`🎉 Celebrating streak milestone: ${milestone.title} (${milestone.streak} days)`);
          
          // Show celebration
          set({ currentMilestone: milestone });
          
          // Log to Activity Log (Apple-style intelligent tracking)
          logJournalStreakMilestone(milestone.streak);
          
          // Mark as celebrated so it doesn't show again
          markMilestoneCelebrated(milestone.streak);
        }
      },

      dismiss: () => {
        set({ currentMilestone: null });
      },
    }),
    { name: 'streak-milestone-store' }
  )
);

