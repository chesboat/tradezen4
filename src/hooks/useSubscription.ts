import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { SUBSCRIPTION_PLANS, hasFeature, isLimitReached, type SubscriptionTier } from '@/types/subscription';

// Admin emails that get automatic premium access
const ADMIN_EMAILS = [
  'chesbo@gmail.com', // Admin email for premium testing
];

export const useSubscription = () => {
  const { currentUser } = useAuth();
  const { profile } = useUserProfileStore();
  
  // Get subscription tier from profile (updated by Stripe webhook)
  const [tier, setTier] = useState<SubscriptionTier>(() => {
    try {
      // Check if admin
      if (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email)) {
        return 'premium';
      }
      
      // Check profile for subscription tier
      return profile?.subscriptionTier || 'trial';
    } catch (error) {
      console.error('Error initializing subscription tier:', error);
      return 'trial';
    }
  });

  // Update tier when user or profile changes
  useEffect(() => {
    try {
      if (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email)) {
        setTier('premium');
        return;
      }
      
      // Check profile subscription status from Firestore (updated by Stripe webhook)
      if (profile?.subscriptionTier && 
          profile?.subscriptionStatus && 
          ['active', 'trialing'].includes(profile.subscriptionStatus)) {
        setTier(profile.subscriptionTier);
      } else {
        // Default to trial for new users
        setTier('trial');
      }
    } catch (error) {
      console.error('Error updating subscription tier:', error);
      setTier('trial');
    }
  }, [currentUser, profile]);

  const plan = SUBSCRIPTION_PLANS[tier];
  
  // Check if user has access to a feature
  const hasAccess = (feature: keyof typeof plan.limits) => {
    try {
      return hasFeature(tier, feature);
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  };
  
  // Check if limit is reached for a feature
  const checkLimit = (feature: keyof typeof plan.limits, currentUsage: number) => {
    try {
      return isLimitReached(tier, feature, currentUsage);
    } catch (error) {
      console.error('Error checking limit:', error);
      return false;
    }
  };
  
  // Get remaining usage for a limit
  const getRemainingUsage = (feature: keyof typeof plan.limits, currentUsage: number) => {
    try {
      const limit = plan.limits[feature];
      if (limit === 'unlimited') return 'unlimited';
      if (typeof limit === 'number') {
        return Math.max(0, limit - currentUsage);
      }
      return 0;
    } catch (error) {
      console.error('Error getting remaining usage:', error);
      return 0;
    }
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

