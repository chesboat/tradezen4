import { MAX_LEVEL, BASE_XP, INCREMENT_XP } from './constants';

/**
 * Calculate XP required to level up from a specific level
 * Level 1 → 2 requires 200 XP, Level 2 → 3 requires 300 XP, etc.
 */
export function xpForLevelUp(level: number): number {
  if (level < 1) return BASE_XP;
  return BASE_XP + INCREMENT_XP * (level - 1);
}

/**
 * Calculate cumulative XP required to reach a specific level
 * Level 1 = 0 XP, Level 2 = 200 XP, Level 3 = 500 XP, etc.
 */
export function cumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  
  let totalXp = 0;
  for (let i = 1; i < level; i++) {
    totalXp += xpForLevelUp(i);
  }
  return totalXp;
}

/**
 * Calculate level and progress from total season XP
 */
export function levelFromTotalXp(totalXp: number): {
  level: number;
  intoLevelXp: number;
  levelXpNeeded: number;
  progressPct: number;
} {
  if (totalXp < 0) totalXp = 0;
  
  let level = 1;
  let cumulativeXp = 0;
  
  // Find the highest level reached
  while (level <= MAX_LEVEL) {
    const xpNeededForNext = xpForLevelUp(level);
    if (cumulativeXp + xpNeededForNext > totalXp) {
      break;
    }
    cumulativeXp += xpNeededForNext;
    level++;
  }
  
  // If we've exceeded max level, cap at max level
  if (level > MAX_LEVEL) {
    level = MAX_LEVEL;
    const maxLevelXp = cumulativeXpForLevel(MAX_LEVEL);
    return {
      level: MAX_LEVEL,
      intoLevelXp: totalXp - maxLevelXp,
      levelXpNeeded: 0, // No more levels available
      progressPct: 100
    };
  }
  
  // Calculate progress within current level
  const intoLevelXp = totalXp - cumulativeXp;
  const levelXpNeeded = xpForLevelUp(level);
  const progressPct = levelXpNeeded > 0 ? (intoLevelXp / levelXpNeeded) * 100 : 0;
  
  return {
    level,
    intoLevelXp,
    levelXpNeeded,
    progressPct: Math.min(progressPct, 100)
  };
}

/**
 * Check if user can prestige (reached max level)
 */
export function canPrestige(seasonXp: number): boolean {
  const { level } = levelFromTotalXp(seasonXp);
  return level >= MAX_LEVEL;
}

/**
 * Calculate XP needed to reach next level
 */
export function xpToNextLevel(seasonXp: number): number {
  const { level, intoLevelXp, levelXpNeeded } = levelFromTotalXp(seasonXp);
  
  if (level >= MAX_LEVEL) {
    return 0; // Already at max level
  }
  
  return levelXpNeeded - intoLevelXp;
}

/**
 * Get level progress as a percentage (0-100)
 */
export function getLevelProgress(seasonXp: number): number {
  const { progressPct } = levelFromTotalXp(seasonXp);
  return progressPct;
}
