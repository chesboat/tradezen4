/**
 * Test utility for milestone celebrations
 * Use this in the browser console for testing
 */

import { useStreakMilestoneStore } from '@/store/useStreakMilestoneStore';
import { resetMilestoneCelebrations } from '@/lib/streakMilestones';

/**
 * Trigger a celebration for a specific streak day
 * Usage in console: testMilestone(7) or testMilestone(14) etc.
 */
export function testMilestone(streakDay: number) {
  console.log(`🧪 Testing milestone celebration for Day ${streakDay}`);
  useStreakMilestoneStore.getState().checkAndCelebrate(streakDay);
}

/**
 * Reset all milestone celebrations (allows them to be shown again)
 * Useful for testing the same milestone multiple times
 */
export function resetMilestones() {
  resetMilestoneCelebrations();
  console.log('✅ All milestone celebrations reset - you can test them again!');
}

/**
 * Test all milestones in sequence (7, 14, 30, 60)
 * with delays between each
 */
export async function testAllMilestones() {
  const milestones = [7, 14, 30, 60];
  
  console.log('🎬 Testing all milestones with 6-second delays...');
  
  for (const day of milestones) {
    console.log(`\n🧪 Testing Day ${day} milestone...`);
    resetMilestones();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Short delay for reset
    testMilestone(day);
    
    if (day !== milestones[milestones.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 6000)); // Wait for celebration to finish
    }
  }
  
  console.log('\n✅ All milestones tested!');
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).testMilestone = testMilestone;
  (window as any).resetMilestones = resetMilestones;
  (window as any).testAllMilestones = testAllMilestones;
  
  console.log(`
🔥 Milestone Test Utilities Available:
- testMilestone(day) - Test a specific day (e.g., testMilestone(7))
- resetMilestones() - Reset all celebrated milestones
- testAllMilestones() - Test all milestones in sequence

Example: testMilestone(30) to see the gold flame celebration!
  `);
}

