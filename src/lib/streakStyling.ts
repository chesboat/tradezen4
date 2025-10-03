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
  // streak: the streak count ON THAT SPECIFIC DAY (not current streak)
  // dayPosition: how many days ago this flame is (0 = today, 1 = yesterday, etc.)
  const isToday = dayPosition === 0;
  
  // 60+ days: ULTRA LEGENDARY - Blue Flame (Hottest!)
  if (streak >= 60) {
    return {
      className: "text-cyan-400",
      glowClass: "drop-shadow-[0_0_12px_rgba(34,211,238,1)]",
      animationType: 'shimmer',
      tooltip: isToday 
        ? `💎 ${streak} day ULTRA streak! Blue flame achieved!`
        : `Day ${streak} - Blue flame!`,
      badge: '💎 Ultra Legendary',
      milestone: 'legendary'
    };
  }
  
  // 30-59 days: Legendary - Yellow/White (Very Hot)
  if (streak >= 30) {
    return {
      className: "text-yellow-400",
      glowClass: "drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]",
      animationType: 'shimmer',
      tooltip: isToday 
        ? `✨ ${streak} day LEGENDARY streak! You're unstoppable!`
        : `Day ${streak} - Legendary!`,
      badge: '🏆 Legendary',
      milestone: 'legendary'
    };
  }
  
  // 14-29 days: Fortnight Fire - Red-Orange (Getting Hot!)
  if (streak >= 14) {
    return {
      className: "text-red-500",
      glowClass: "drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]",
      animationType: 'pulse-strong',
      tooltip: isToday
        ? `🔥🔥 ${streak} day streak! You're burning hot!`
        : `Day ${streak} - Burning hot!`,
      badge: '🔥 Fortnight Fire',
      milestone: 'fortnight'
    };
  }
  
  // 7-13 days: Week Warrior - Deep Orange (Hot)
  if (streak >= 7) {
    return {
      className: "text-orange-600",
      glowClass: "drop-shadow-[0_0_6px_rgba(234,88,12,0.7)]",
      animationType: 'pulse-soft',
      tooltip: isToday
        ? `🔥 ${streak} day streak! Keep it going!`
        : `Day ${streak} - Week warrior!`,
      badge: '💪 Week Warrior',
      milestone: 'week'
    };
  }
  
  // 5-6 days: Heating Up - Brighter orange, bigger glow
  if (streak >= 5) {
    return {
      className: "text-orange-500",
      glowClass: "drop-shadow-[0_0_5px_rgba(249,115,22,0.7)]",
      animationType: 'none',
      tooltip: isToday
        ? `🔥 ${streak} day streak - Heating up!`
        : `Day ${streak} - Heating up`,
      badge: null,
      milestone: 'building'
    };
  }
  
  // 3-4 days: Building Momentum - Orange, small glow
  if (streak >= 3) {
    return {
      className: "text-orange-500",
      glowClass: "drop-shadow-[0_0_3px_rgba(249,115,22,0.5)]",
      animationType: 'none',
      tooltip: isToday
        ? `🔥 ${streak} day streak - Momentum building!`
        : `Day ${streak} - Building momentum`,
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
        : (streak === 1 ? 'Started your streak!' : `Day ${streak}`),
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

