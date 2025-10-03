/**
 * Apple-style streak progression system
 * Progressive visual feedback for journaling streaks
 */

export interface StreakStyling {
  className: string;
  glowClass: string | null;
  animationType: 'none' | 'pulse-soft' | 'pulse-strong' | 'shimmer';
  tooltip: string;
  badge: string | null;
  milestone: 'starter' | 'building' | 'week' | 'fortnight' | 'legendary';
}

export function getStreakStyling(streak: number, dayPosition?: number): StreakStyling {
  // dayPosition: how many days ago this flame is (0 = today, 1 = yesterday, etc.)
  const isToday = dayPosition === 0;
  
  // 30+ days: Legendary (Gold with shimmer)
  if (streak >= 30) {
    return {
      className: "text-yellow-500",
      glowClass: "drop-shadow-[0_0_10px_rgba(234,179,8,0.9)]",
      animationType: 'shimmer',
      tooltip: isToday 
        ? `✨ ${streak} day LEGENDARY streak! You're unstoppable!`
        : dayPosition !== undefined
        ? `Day ${streak - dayPosition} of your legendary streak`
        : `✨ ${streak} day LEGENDARY streak!`,
      badge: '🏆 Legendary',
      milestone: 'legendary'
    };
  }
  
  // 14-29 days: Fortnight Fire (Deep orange with strong pulse)
  if (streak >= 14) {
    return {
      className: "text-orange-600",
      glowClass: "drop-shadow-[0_0_8px_rgba(234,88,12,0.8)]",
      animationType: 'pulse-strong',
      tooltip: isToday
        ? `🔥🔥 ${streak} day streak! You're on fire!`
        : dayPosition !== undefined
        ? `Day ${streak - dayPosition} of your streak`
        : `🔥🔥 ${streak} day streak!`,
      badge: '⚡ Fortnight Fire',
      milestone: 'fortnight'
    };
  }
  
  // 7-13 days: Week Warrior (Orange with soft pulse + stronger glow)
  if (streak >= 7) {
    return {
      className: "text-orange-500",
      glowClass: "drop-shadow-[0_0_6px_rgba(249,115,22,0.7)]",
      animationType: 'pulse-soft',
      tooltip: isToday
        ? `🔥 ${streak} day streak! Keep it going!`
        : dayPosition !== undefined
        ? `Day ${streak - dayPosition} of your streak`
        : `🔥 ${streak} day streak!`,
      badge: '💪 Week Warrior',
      milestone: 'week'
    };
  }
  
  // 3-6 days: Building Momentum (Brighter orange, visible glow)
  if (streak >= 3) {
    return {
      className: "text-orange-500",
      glowClass: "drop-shadow-[0_0_4px_rgba(249,115,22,0.6)]",
      animationType: 'none',
      tooltip: isToday
        ? `🔥 ${streak} day streak - Momentum building!`
        : dayPosition !== undefined
        ? `Day ${streak - dayPosition} - Building momentum`
        : `🔥 ${streak} days`,
      badge: null,
      milestone: 'building'
    };
  }
  
  // 1-2 days: Warm-up (Lighter orange, no glow)
  if (streak >= 1) {
    return {
      className: "text-orange-400",
      glowClass: null,
      animationType: 'none',
      tooltip: isToday
        ? (streak === 1 ? '✅ Day 1! Start your streak!' : `🔥 Day ${streak} - Keep going!`)
        : dayPosition !== undefined
        ? (dayPosition === streak - 1 ? 'Started your streak!' : `Day ${streak - dayPosition}`)
        : `Day ${streak}`,
      badge: null,
      milestone: 'starter'
    };
  }
  
  // No streak
  return {
    className: "text-gray-400",
    glowClass: null,
    animationType: 'none',
    tooltip: 'Start your reflection streak today!',
    badge: null,
    milestone: 'starter'
  };
}

/**
 * Get animation properties for Framer Motion based on streak tier
 */
export function getStreakAnimation(animationType: StreakStyling['animationType']) {
  switch (animationType) {
    case 'pulse-soft':
      return {
        animate: { scale: [1, 1.05, 1] },
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      };
    
    case 'pulse-strong':
      return {
        animate: { 
          scale: [1, 1.1, 1],
          opacity: [1, 0.8, 1]
        },
        transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      };
    
    case 'shimmer':
      return {
        animate: { 
          scale: [1, 1.08, 1],
          filter: [
            'hue-rotate(0deg) brightness(1)',
            'hue-rotate(10deg) brightness(1.1)',
            'hue-rotate(0deg) brightness(1)'
          ]
        },
        transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
      };
    
    case 'none':
    default:
      return null;
  }
}

