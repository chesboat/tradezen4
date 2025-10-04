// Subscription tier types and configuration

export type SubscriptionTier = 'trial' | 'basic' | 'premium';
export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'past_due' | 'expired';

export interface SubscriptionLimits {
  // Account & Data
  maxAccounts: number | 'unlimited';
  storageGB: number;
  maxImages: number | 'unlimited';
  dataRetentionDays: number | 'unlimited';
  
  // Trading Features
  maxTrades: number | 'unlimited';
  
  // Journal Features
  maxNotes: number | 'unlimited';
  maxHabits: number | 'unlimited';
  dailyReflections: boolean;
  weeklyReviews: boolean;
  customTemplates: boolean;
  
  // AI Features
  aiInsights: boolean;
  aiCoach: boolean;
  aiMonthlyRequests: number | 'unlimited';
  aiAnalysis: 'none' | 'basic' | 'advanced';
  emotionalAnalysis: boolean;
  
  // Customization
  accentColors: boolean;
  dashboardCustomization: boolean;
  
  // Advanced Features
  publicSharing: boolean;
  csvImport: boolean;
  imageImport: boolean;
  dataExport: boolean;
  apiAccess: boolean;
  
  // Analytics
  advancedAnalytics: boolean;
  customReports: boolean;
  
  // Support
  prioritySupport: boolean;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number; // Total annual price
  annualMonthlyPrice: number; // Monthly equivalent when billed annually
  limits: SubscriptionLimits;
  features: string[];
  badge?: string;
  popular?: boolean;
}

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  trial: {
    tier: 'trial',
    name: '7-Day Trial',
    description: '7 days of Premium access',
    monthlyPrice: 0,
    annualPrice: 0,
    annualMonthlyPrice: 0,
    badge: '🎁 Trial Active',
    limits: {
      // Trial gets full Premium access to get them hooked
      maxAccounts: 'unlimited',
      storageGB: 10,
      maxImages: 1000,
      dataRetentionDays: 'unlimited',
      maxTrades: 'unlimited',
      maxNotes: 'unlimited',
      maxHabits: 'unlimited',
      dailyReflections: true,
      weeklyReviews: true,
      customTemplates: true,
      aiInsights: true,
      aiCoach: true,
      aiMonthlyRequests: 'unlimited',
      aiAnalysis: 'advanced',
      emotionalAnalysis: true,
      accentColors: true,
      dashboardCustomization: true,
      publicSharing: true,
      csvImport: true,
      imageImport: true,
      dataExport: true,
      apiAccess: false, // Don't give API access during trial
      advancedAnalytics: true,
      customReports: true,
      prioritySupport: false,
    },
    features: [
      '7 days of Premium access',
      'All Premium features included',
      'Auto-converts to Basic ($19/mo)',
      'Upgrade to Premium anytime',
      'Cancel anytime',
    ]
  },
  
  basic: {
    tier: 'basic',
    name: 'Basic',
    description: 'For serious traders',
    monthlyPrice: 19,
    annualPrice: 168, // $14/month equivalent
    annualMonthlyPrice: 14,
    limits: {
      maxAccounts: 3,
      storageGB: 2,
      maxImages: 100,
      dataRetentionDays: 365, // 1 year
      maxTrades: 'unlimited',
      maxNotes: 'unlimited',
      maxHabits: 10,
      dailyReflections: true,
      weeklyReviews: true,
      customTemplates: true,
      aiInsights: true,
      aiCoach: false,
      aiMonthlyRequests: 50,
      aiAnalysis: 'basic',
      emotionalAnalysis: false,
      accentColors: true, // All colors unlocked
      dashboardCustomization: true,
      publicSharing: true,
      csvImport: true,
      imageImport: true,
      dataExport: true,
      apiAccess: false,
      advancedAnalytics: true,
      customReports: false,
      prioritySupport: false,
    },
    features: [
      'Up to 3 accounts',
      'Unlimited trades',
      'Unlimited notes',
      '10 habits',
      'Top 1 habit correlation',
      'AI insights (50/month)',
      'Advanced analytics',
      'All accent colors',
      'Public sharing',
      'Image import (100)',
      'Weekly reviews',
      'Custom templates',
      '2GB storage',
      '1-year history',
    ]
  },
  
  premium: {
    tier: 'premium',
    name: 'Premium',
    description: 'For professional traders',
    monthlyPrice: 39,
    annualPrice: 348, // $29/month equivalent
    annualMonthlyPrice: 29,
    popular: true,
    badge: '🔥 Most Popular',
    limits: {
      maxAccounts: 'unlimited',
      storageGB: 10,
      maxImages: 1000,
      dataRetentionDays: 'unlimited',
      maxTrades: 'unlimited',
      maxNotes: 'unlimited',
      maxHabits: 'unlimited',
      dailyReflections: true,
      weeklyReviews: true,
      customTemplates: true,
      aiInsights: true,
      aiCoach: true,
      aiMonthlyRequests: 'unlimited',
      aiAnalysis: 'advanced',
      emotionalAnalysis: true,
      accentColors: true,
      dashboardCustomization: true,
      publicSharing: true,
      csvImport: true,
      imageImport: true,
      dataExport: true,
      apiAccess: true,
      advancedAnalytics: true,
      customReports: true,
      prioritySupport: true,
    },
    features: [
      'Unlimited accounts',
      'Unlimited trades',
      'Unlimited notes',
      'Unlimited habits',
      '🧠 Daily Trading Insights',
      '🔬 Habit Experiment Mode',
      '📊 Top 3 habit correlations',
      '📈 Correlation charts',
      '📚 Insight history archive',
      '⚙️ Custom insight scheduling',
      'AI coach (unlimited)',
      'Advanced AI analysis',
      'Emotional analysis',
      'Psychology insights',
      'Advanced analytics',
      'Custom reports',
      'API access',
      'All accent colors',
      'Public sharing',
      'Image import (1000)',
      'Weekly reviews',
      'Custom templates',
      '10GB storage',
      'Unlimited history',
      'Priority support',
    ]
  }
};

// Helper function to check if a feature is available for a tier
export function hasFeature(tier: SubscriptionTier, feature: keyof SubscriptionLimits): boolean {
  const plan = SUBSCRIPTION_PLANS[tier];
  const limit = plan.limits[feature];
  
  if (typeof limit === 'boolean') {
    return limit;
  }
  
  return limit === 'unlimited' || (typeof limit === 'number' && limit > 0);
}

// Helper function to check if limit is reached
export function isLimitReached(
  tier: SubscriptionTier,
  feature: keyof SubscriptionLimits,
  currentUsage: number
): boolean {
  const plan = SUBSCRIPTION_PLANS[tier];
  const limit = plan.limits[feature];
  
  if (limit === 'unlimited') return false;
  if (typeof limit === 'boolean') return !limit;
  if (typeof limit === 'number') return currentUsage >= limit;
  
  return false;
}

// Helper to get readable limit text
export function getLimitText(limit: number | 'unlimited' | boolean): string {
  if (limit === 'unlimited') return 'Unlimited';
  if (typeof limit === 'boolean') return limit ? 'Included' : 'Not included';
  return limit.toString();
}

