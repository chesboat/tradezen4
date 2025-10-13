import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { SUBSCRIPTION_PLANS, hasFeature, isLimitReached, type SubscriptionTier } from '@/types/subscription';
import { Timestamp } from 'firebase/firestore';

// Admin emails that get automatic premium access
const ADMIN_EMAILS = [
  'chesbo@gmail.com', // Admin email for premium testing
];

// 🍎 APPLE WAY: Check if user has active access (even if canceled, they keep access until period ends)
function hasActiveAccess(profile: any): boolean {
  if (!profile?.subscriptionStatus) return false;
  
  const status = profile.subscriptionStatus;
  
  // Active and trialing always have access
  if (['active', 'trialing'].includes(status)) {
    return true;
  }
  
  // Canceled users keep access until currentPeriodEnd
  if (status === 'canceled' && profile.currentPeriodEnd) {
    try {
      const periodEnd = profile.currentPeriodEnd instanceof Timestamp 
        ? profile.currentPeriodEnd.toDate() 
        : new Date(profile.currentPeriodEnd);
      
      const now = new Date();
      const hasAccess = periodEnd > now;
      
      console.log('🔒 Canceled subscription access check:', {
        periodEnd: periodEnd.toISOString(),
        now: now.toISOString(),
        hasAccess
      });
      
      return hasAccess;
    } catch (error) {
      console.error('Error checking period end:', error);
      return false;
    }
  }
  
  // Past due gets a grace period (configurable)
  if (status === 'past_due' && profile.currentPeriodEnd) {
    try {
      const periodEnd = profile.currentPeriodEnd instanceof Timestamp 
        ? profile.currentPeriodEnd.toDate() 
        : new Date(profile.currentPeriodEnd);
      
      const now = new Date();
      const gracePeriodDays = 7; // 7 day grace period for past_due
      const graceEndDate = new Date(periodEnd.getTime() + (gracePeriodDays * 24 * 60 * 60 * 1000));
      
      return graceEndDate > now;
    } catch (error) {
      console.error('Error checking grace period:', error);
      return false;
    }
  }
  
  // All other statuses (incomplete, incomplete_expired, unpaid) = no access
  return false;
}

export const useSubscription = () => {
  const { currentUser } = useAuth();
  const { profile } = useUserProfileStore();
  
  // Track if access is revoked (for expired/canceled subscriptions)
  const [hasAccess, setHasAccess] = useState(true);
  
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

  // 🍎 APPLE WAY: Update tier AND access when user or profile changes
  useEffect(() => {
    try {
      // Admins always have full access
      if (currentUser?.email && ADMIN_EMAILS.includes(currentUser.email)) {
        setTier('premium');
        setHasAccess(true);
        return;
      }
      
      // 🍎 APPLE WAY: Check if user just completed checkout (grace period while webhook processes)
      let justCompletedCheckout = false;
      try {
        const checkoutTimestamp = sessionStorage.getItem('just_completed_checkout');
        if (checkoutTimestamp) {
          const elapsed = Date.now() - parseInt(checkoutTimestamp);
          const graceWindow = 60000; // 60 seconds
          
          if (elapsed < graceWindow) {
            justCompletedCheckout = true;
            console.log('⏳ Grace period active - allowing dashboard access while webhook processes');
          } else {
            // Grace period expired, clear flag
            sessionStorage.removeItem('just_completed_checkout');
          }
        }
      } catch {}
      
      // 🚨 SECURITY: New users without a subscription have NO access
      // UNLESS they just completed checkout (grace period)
      if (!profile?.subscriptionStatus && !profile?.stripeSubscriptionId && !justCompletedCheckout) {
        console.log('⛔ No subscription found - redirecting to pricing');
        setTier('trial');
        setHasAccess(false); // No access until they subscribe!
        return;
      }
      
      // If in grace period but no subscription data yet, allow temporary access
      if (justCompletedCheckout && !profile?.subscriptionStatus) {
        console.log('✅ Grace period: Allowing dashboard access');
        setTier('basic'); // Default to basic during grace period
        setHasAccess(true);
        return;
      }
      
      // Check if user has active access (handles canceled-but-not-expired)
      const activeAccess = hasActiveAccess(profile);
      setHasAccess(activeAccess);
      
      // If they have access, use their subscription tier
      if (activeAccess && profile?.subscriptionTier) {
        setTier(profile.subscriptionTier);
        
        // Clear grace period flag once we have real subscription data
        try {
          sessionStorage.removeItem('just_completed_checkout');
        } catch {}
      } else {
        // No access = trial tier (will trigger paywall)
        setTier('trial');
      }
      
      console.log('🔐 Subscription access updated:', {
        tier: activeAccess && profile?.subscriptionTier ? profile.subscriptionTier : 'trial',
        hasAccess: activeAccess,
        status: profile?.subscriptionStatus,
        hasSubscription: !!profile?.stripeSubscriptionId
      });
    } catch (error) {
      console.error('Error updating subscription tier:', error);
      setTier('trial');
      setHasAccess(false); // 🚨 SECURITY FIX: Fail closed for errors
    }
  }, [currentUser, profile]);

  const plan = SUBSCRIPTION_PLANS[tier];
  
  // Check if user has access to a feature
  const hasFeatureAccess = (feature: keyof typeof plan.limits) => {
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
    hasAccess, // 🍎 NEW: Whether user has access to the app (even if canceled, checks period end)
    hasFeatureAccess, // Check specific features
    checkLimit,
    getRemainingUsage,
    isPremium: tier === 'premium',
    isBasic: tier === 'basic',
    isTrial: tier === 'trial',
    isExpired: !hasAccess && profile?.subscriptionStatus && !['active', 'trialing'].includes(profile.subscriptionStatus), // 🍎 NEW: True if subscription expired
  };
};

