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

export function getStreakStyling(streak: number): StreakStyling {
  // 30+ days: Legendary (Gold gradient with shimmer)
  if (streak >= 30) {
    return {
      className: "text-yellow-500",
      glowClass: "drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]",
      animationType: 'shimmer',
      tooltip: `✨ ${streak} day LEGENDARY streak! You're unstoppable!`,
      badge: '🏆 Legendary',
      milestone: 'legendary'
    };
  }
  
  // 14-29 days: Fortnight Fire (Intense orange with strong pulse)
  if (streak >= 14) {
    return {
      className: "text-orange-600",
      glowClass: "drop-shadow-[0_0_6px_rgba(234,88,12,0.7)]",
      animationType: 'pulse-strong',
      tooltip: `🔥🔥 ${streak} day streak! You're on fire!`,
      badge: '⚡ Fortnight Fire',
      milestone: 'fortnight'
    };
  }
  
  // 7-13 days: Week Warrior (Orange with soft pulse)
  if (streak >= 7) {
    return {
      className: "text-orange-500",
      glowClass: "drop-shadow-[0_0_4px_rgba(249,115,22,0.6)]",
      animationType: 'pulse-soft',
      tooltip: `🔥 ${streak} day streak! Keep it going!`,
      badge: '💪 Week Warrior',
      milestone: 'week'
    };
  }
  
  // 3-6 days: Building Momentum (Brighter, subtle glow)
  if (streak >= 3) {
    return {
      className: "text-orange-500",
      glowClass: "drop-shadow-[0_0_2px_rgba(249,115,22,0.4)]",
      animationType: 'none',
      tooltip: `🔥 ${streak} day streak - Momentum building!`,
      badge: null,
      milestone: 'building'
    };
  }
  
  // 1-2 days: Warm-up (Subtle orange)
  if (streak >= 1) {
    return {
      className: "text-orange-400",
      glowClass: null,
      animationType: 'none',
      tooltip: streak === 1 
        ? '✅ Day 1! Start your streak!' 
        : `🔥 ${streak} days - Keep going!`,
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

