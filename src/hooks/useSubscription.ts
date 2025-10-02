import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { SUBSCRIPTION_PLANS, hasFeature, isLimitReached, type SubscriptionTier } from '@/types/subscription';

// Admin emails that get automatic premium access
const ADMIN_EMAILS = [
  'your-email@example.com', // Replace with your actual email
  // Add your email below for testing:
  // 'yourname@gmail.com',
];

export const useSubscription = () => {
  const { currentUser } = useAuth();
  const { profile } = useUserProfileStore();
  
  // Get subscription tier from profile or default to trial
  // TODO: When implementing billing, store subscriptionTier in Firestore user profile
  const [tier, setTier] = useState<SubscriptionTier>(() => {
    // Check if admin
    if (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email)) {
      return 'premium';
    }
    
    // Check profile (when implemented)
    // return profile?.subscriptionTier || 'trial';
    
    // New users start with trial
    return 'trial';
  });

  // Update tier when user or profile changes
  useEffect(() => {
    if (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email)) {
      setTier('premium');
      return;
    }
    
    // TODO: When implementing billing, check profile.subscriptionTier and subscriptionStatus
    // For now, all users are on trial (for testing)
    // In production, check profile.subscriptionStatus === 'trialing'
    
    setTier('trial');
  }, [currentUser, profile]);

  const plan = SUBSCRIPTION_PLANS[tier];
  
  // Check if user has access to a feature
  const hasAccess = (feature: keyof typeof plan.limits) => {
    return hasFeature(tier, feature);
  };
  
  // Check if limit is reached for a feature
  const checkLimit = (feature: keyof typeof plan.limits, currentUsage: number) => {
    return isLimitReached(tier, feature, currentUsage);
  };
  
  // Get remaining usage for a limit
  const getRemainingUsage = (feature: keyof typeof plan.limits, currentUsage: number) => {
    const limit = plan.limits[feature];
    if (limit === 'unlimited') return 'unlimited';
    if (typeof limit === 'number') {
      return Math.max(0, limit - currentUsage);
    }
    return 0;
  };

  return {
    tier,
    plan,
    limits: plan.limits,
    hasAccess,
    checkLimit,
    getRemainingUsage,
    isPremium: tier === 'premium',
    isBasic: tier === 'basic',
    isTrial: tier === 'trial',
  };
};

