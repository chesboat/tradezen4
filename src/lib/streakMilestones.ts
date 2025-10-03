/**
 * Streak Milestone Celebrations
 * Apple-style: Celebrate achievements without over-explaining
 */

const MILESTONE_KEY = 'tradzen_streak_milestones_celebrated';

export interface MilestoneCelebration {
  streak: number;
  title: string;
  message: string;
  emoji: string;
  color: string;
  glowColor: string;
}

export const MILESTONES: MilestoneCelebration[] = [
  {
    streak: 7,
    title: 'Week Warrior!',
    message: 'Your flame is pulsing with energy',
    emoji: '🔥',
    color: 'from-orange-600 to-orange-500',
    glowColor: 'rgba(234,88,12,0.7)',
  },
  {
    streak: 14,
    title: 'Burning Hot!',
    message: 'Red flame unlocked',
    emoji: '❤️',
    color: 'from-red-500 to-orange-600',
    glowColor: 'rgba(239,68,68,0.8)',
  },
  {
    streak: 30,
    title: 'LEGENDARY',
    message: 'Golden flame achieved!',
    emoji: '💛',
    color: 'from-yellow-400 to-yellow-500',
    glowColor: 'rgba(250,204,21,0.9)',
  },
  {
    streak: 60,
    title: 'ULTRA RARE',
    message: 'Blue flame - the hottest possible!',
    emoji: '💎',
    color: 'from-cyan-400 to-blue-500',
    glowColor: 'rgba(34,211,238,1)',
  },
];

interface CelebratedMilestones {
  [key: number]: boolean; // streak number -> celebrated
}

/**
 * Get all milestones that have already been celebrated
 */
export function getCelebratedMilestones(): CelebratedMilestones {
  try {
    const stored = localStorage.getItem(MILESTONE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Mark a milestone as celebrated
 */
export function markMilestoneCelebrated(streak: number): void {
  try {
    const celebrated = getCelebratedMilestones();
    celebrated[streak] = true;
    localStorage.setItem(MILESTONE_KEY, JSON.stringify(celebrated));
  } catch (error) {
    console.error('Failed to save milestone celebration:', error);
  }
}

/**
 * Check if a milestone should be celebrated
 * Returns the milestone if it's new, null otherwise
 */
export function checkForNewMilestone(currentStreak: number): MilestoneCelebration | null {
  const celebrated = getCelebratedMilestones();
  
  // Find the highest milestone that applies to current streak
  const applicableMilestone = MILESTONES
    .filter(m => m.streak <= currentStreak)
    .sort((a, b) => b.streak - a.streak)[0];
  
  // If we found a milestone and it hasn't been celebrated yet
  if (applicableMilestone && !celebrated[applicableMilestone.streak]) {
    return applicableMilestone;
  }
  
  return null;
}

/**
 * Reset all milestone celebrations (for testing/debugging)
 */
export function resetMilestoneCelebrations(): void {
  try {
    localStorage.removeItem(MILESTONE_KEY);
    console.log('✅ Milestone celebrations reset');
  } catch (error) {
    console.error('Failed to reset milestone celebrations:', error);
  }
}

