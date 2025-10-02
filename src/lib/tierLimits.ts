/**
 * Tier-based data retention and feature limits
 * Apple-style: Simple, clear, enforceable
 */

export interface TierLimits {
  dataRetentionDays: number | null; // null = unlimited
  hasSetupAnalytics: boolean;
  hasCalendarHeatmap: boolean;
  hasCustomDateRanges: boolean;
  hasTimeIntelligence: boolean;
  hasUnlimitedAI: boolean;
}

export const TIER_LIMITS: Record<'trial' | 'basic' | 'premium', TierLimits> = {
  trial: {
    dataRetentionDays: null, // Full access during trial
    hasSetupAnalytics: true,
    hasCalendarHeatmap: true,
    hasCustomDateRanges: true,
    hasTimeIntelligence: true,
    hasUnlimitedAI: true,
  },
  basic: {
    dataRetentionDays: 30, // 30-day limit
    hasSetupAnalytics: false,
    hasCalendarHeatmap: false,
    hasCustomDateRanges: false,
    hasTimeIntelligence: false,
    hasUnlimitedAI: false,
  },
  premium: {
    dataRetentionDays: null, // Unlimited
    hasSetupAnalytics: true,
    hasCalendarHeatmap: true,
    hasCustomDateRanges: true,
    hasTimeIntelligence: true,
    hasUnlimitedAI: true,
  },
};

/**
 * Get limits for a subscription tier
 */
export function getTierLimits(tier: 'trial' | 'basic' | 'premium'): TierLimits {
  return TIER_LIMITS[tier];
}

/**
 * Filter data by retention limit
 * Returns only data within the tier's retention window
 */
export function filterByRetention<T extends { entryTime?: Date | string; createdAt?: Date | string }>(
  data: T[],
  tier: 'trial' | 'basic' | 'premium'
): T[] {
  const limits = getTierLimits(tier);
  
  // Unlimited retention
  if (limits.dataRetentionDays === null) {
    return data;
  }

  // Calculate cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - limits.dataRetentionDays);

  // Filter by entryTime (for trades) or createdAt (for other records)
  return data.filter(item => {
    const dateToCheck = item.entryTime || item.createdAt;
    if (!dateToCheck) return true; // Keep items without dates (shouldn't happen)
    
    const itemDate = typeof dateToCheck === 'string' ? new Date(dateToCheck) : dateToCheck;
    return itemDate >= cutoffDate;
  });
}

/**
 * Check if a specific feature is available for a tier
 */
export function hasFeature(
  tier: 'trial' | 'basic' | 'premium',
  feature: keyof Omit<TierLimits, 'dataRetentionDays'>
): boolean {
  const limits = getTierLimits(tier);
  return limits[feature];
}

/**
 * Get a user-friendly message about data retention
 */
export function getRetentionMessage(tier: 'trial' | 'basic' | 'premium'): string {
  const limits = getTierLimits(tier);
  
  if (limits.dataRetentionDays === null) {
    return 'Unlimited history';
  }
  
  return `${limits.dataRetentionDays}-day history`;
}

/**
 * Get upgrade CTA for a specific feature
 */
export function getFeatureUpgradeCTA(feature: keyof Omit<TierLimits, 'dataRetentionDays'>): {
  title: string;
  description: string;
} {
  const messages: Record<string, { title: string; description: string }> = {
    hasSetupAnalytics: {
      title: 'Setup Analytics',
      description: 'Track which trading setups work best for you. Upgrade to Premium to unlock.',
    },
    hasCalendarHeatmap: {
      title: 'Calendar Heatmap',
      description: 'Visualize your daily P&L at a glance. Upgrade to Premium to unlock.',
    },
    hasCustomDateRanges: {
      title: 'Custom Date Ranges',
      description: 'Analyze any date range you want. Upgrade to Premium to unlock.',
    },
    hasTimeIntelligence: {
      title: 'Time Intelligence',
      description: 'Discover your best trading hours and days. Upgrade to Premium to unlock.',
    },
    hasUnlimitedAI: {
      title: 'Unlimited AI Insights',
      description: 'Get unlimited AI-powered insights and analysis. Upgrade to Premium to unlock.',
    },
  };

  return messages[feature] || { title: 'Premium Feature', description: 'Upgrade to Premium to unlock this feature.' };
}

