// Subscription tier types and configuration

export type SubscriptionTier = 'free' | 'basic' | 'premium';

export interface SubscriptionLimits {
  // Account & Data
  maxAccounts: number | 'unlimited';
  storageGB: number;
  
  // Trading Features
  maxPlaybooks: number | 'unlimited';
  maxTrades: number | 'unlimited';
  
  // Journal Features
  maxNotes: number | 'unlimited';
  maxHabits: number | 'unlimited';
  dailyReflections: boolean;
  weeklyReviews: boolean;
  
  // AI Features
  aiInsights: boolean;
  aiCoach: boolean;
  aiAnalysis: 'basic' | 'advanced' | 'pro';
  
  // Customization
  accentColors: boolean;
  customTemplates: boolean;
  
  // Advanced Features
  publicSharing: boolean;
  csvImport: boolean;
  imageImport: boolean;
  apiAccess: boolean;
  
  // Analytics
  advancedAnalytics: boolean;
  customReports: boolean;
  backtesting: boolean;
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
  free: {
    tier: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    monthlyPrice: 0,
    annualPrice: 0,
    annualMonthlyPrice: 0,
    limits: {
      maxAccounts: 1,
      storageGB: 0.5,
      maxPlaybooks: 1,
      maxTrades: 100,
      maxNotes: 50,
      maxHabits: 3,
      dailyReflections: true,
      weeklyReviews: false,
      aiInsights: false,
      aiCoach: false,
      aiAnalysis: 'basic',
      accentColors: false, // Only Ocean Blue
      customTemplates: false,
      publicSharing: false,
      csvImport: true,
      imageImport: false,
      apiAccess: false,
      advancedAnalytics: false,
      customReports: false,
      backtesting: false,
    },
    features: [
      '1 trading account',
      '100 trades',
      '50 notes',
      '3 habits',
      'Basic analytics',
      'CSV import',
      'Daily reflections',
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
      maxPlaybooks: 5,
      maxTrades: 'unlimited',
      maxNotes: 'unlimited',
      maxHabits: 10,
      dailyReflections: true,
      weeklyReviews: true,
      aiInsights: true,
      aiCoach: false,
      aiAnalysis: 'advanced',
      accentColors: true, // All colors unlocked
      customTemplates: true,
      publicSharing: true,
      csvImport: true,
      imageImport: true,
      apiAccess: false,
      advancedAnalytics: true,
      customReports: false,
      backtesting: false,
    },
    features: [
      'Up to 3 accounts',
      'Unlimited trades',
      'Unlimited notes',
      '10 habits',
      'AI insights',
      'Advanced analytics',
      'All accent colors',
      'Public sharing',
      'Image import',
      'Weekly reviews',
      'Custom templates',
      '2GB storage',
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
      maxPlaybooks: 'unlimited',
      maxTrades: 'unlimited',
      maxNotes: 'unlimited',
      maxHabits: 'unlimited',
      dailyReflections: true,
      weeklyReviews: true,
      aiInsights: true,
      aiCoach: true,
      aiAnalysis: 'pro',
      accentColors: true,
      customTemplates: true,
      publicSharing: true,
      csvImport: true,
      imageImport: true,
      apiAccess: true,
      advancedAnalytics: true,
      customReports: true,
      backtesting: true,
    },
    features: [
      'Unlimited accounts',
      'Unlimited trades',
      'Unlimited notes',
      'Unlimited habits',
      'AI coach',
      'Pro AI analysis',
      'Advanced analytics',
      'Custom reports',
      'Backtesting',
      'API access',
      'All accent colors',
      'Public sharing',
      'Image import',
      'Weekly reviews',
      'Custom templates',
      '10GB storage',
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

