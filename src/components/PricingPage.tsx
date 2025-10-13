import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, TrendingUp, Target, Shield, Sparkles, Calendar, Clock, BarChart3 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { redirectToCheckout, upgradeSubscription, getPriceId } from '@/lib/stripe';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import { WelcomeToPremiumModal } from '@/components/WelcomeToPremiumModal';
import toast from 'react-hot-toast';

type BillingPeriod = 'monthly' | 'annual';

export const PricingPage = () => {
  const { currentUser } = useAuth();
  const { tier, isTrial, isBasic } = useSubscription();
  const { profile } = useUserProfileStore();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [upgradeDetails, setUpgradeDetails] = useState<{
    proratedAmount?: number;
    nextBillingAmount?: number;
    nextBillingDate?: string;
  }>({});

  // 🍎 APPLE WAY: Detect if this is an upgrade (existing subscription) vs new signup
  const handleSubscribe = async (targetTier: 'basic' | 'premium') => {
    if (!currentUser) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setLoadingPlan(targetTier);
    try {
      const priceId = getPriceId(targetTier, billingPeriod);
      console.log('📋 Subscription request:', { 
        targetTier, 
        currentTier: tier,
        billingPeriod, 
        priceId, 
        userId: currentUser.uid,
        hasActiveSubscription: !!profile?.stripeSubscriptionId
      });
      
      if (!priceId) {
        throw new Error(`Missing price ID for ${targetTier} ${billingPeriod}. Check Vercel environment variables.`);
      }

      // Check if user has an existing subscription (active OR trialing)
      const hasActiveSubscription = !!(profile?.stripeSubscriptionId &&
        (profile?.subscriptionStatus === 'active' || profile?.subscriptionStatus === 'trialing'));
      
      if (hasActiveSubscription && isBasic && targetTier === 'premium') {
        // 🍎 UPGRADING: Use instant upgrade with proration
        console.log('⬆️ Upgrading Basic → Premium with proration');
        toast.loading('Upgrading your subscription...', { id: 'upgrade' });
        
        await upgradeSubscription(currentUser.uid, priceId);
        
        toast.loading('Confirming upgrade...', { id: 'upgrade' });
        
        // Wait for Stripe webhook to update Firestore (polling approach)
        let attempts = 0;
        const maxAttempts = 15; // 15 seconds max
        const checkInterval = setInterval(async () => {
          attempts++;
          
          // Reload profile from Firestore
          const { loadFromFirestore } = useUserProfileStore.getState();
          const updatedProfile = await loadFromFirestore(currentUser.uid);
          
          if (updatedProfile?.subscriptionTier === 'premium') {
            clearInterval(checkInterval);
            toast.dismiss('upgrade');
            setLoadingPlan(null);
            
            // 🍎 APPLE WAY: Calculate billing details for transparency
            const basicPrice = billingPeriod === 'annual' ? basicPlan.annualPrice : basicPlan.monthlyPrice;
            const premiumPrice = billingPeriod === 'annual' ? premiumPlan.annualPrice : premiumPlan.monthlyPrice;
            const proratedAmount = premiumPrice - basicPrice; // Simplified - Stripe calculates actual proration
            
            // Calculate next billing date from Firestore timestamp
            let nextBillingDate: string | undefined = undefined;
            if (updatedProfile.currentPeriodEnd) {
              try {
                const periodEnd = updatedProfile.currentPeriodEnd instanceof Timestamp
                  ? updatedProfile.currentPeriodEnd.toDate()
                  : new Date(updatedProfile.currentPeriodEnd);
                nextBillingDate = periodEnd.toISOString();
              } catch (error) {
                console.error('Error parsing currentPeriodEnd:', error);
              }
            }
            
            setUpgradeDetails({
              proratedAmount,
              nextBillingAmount: premiumPrice,
              nextBillingDate,
            });
            setShowWelcomeModal(true);
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            toast.success('Upgrade complete! Refresh if you don\'t see changes.', { id: 'upgrade' });
            setLoadingPlan(null);
            setTimeout(() => {
              window.location.href = '/?view=dashboard';
            }, 1000);
          }
        }, 1000); // Check every second
      } else {
        // 🆕 NEW SUBSCRIPTION: Use normal checkout flow
        console.log('🆕 Starting new subscription checkout');
        await redirectToCheckout(priceId, currentUser.uid);
      }
    } catch (error: any) {
      console.error('❌ Error with subscription:', error);
      toast.error(error.message || 'Failed to process subscription', { id: 'upgrade' });
      setLoadingPlan(null);
    }
  };

  const basicPlan = SUBSCRIPTION_PLANS.basic;
  const premiumPlan = SUBSCRIPTION_PLANS.premium;

  const getPrice = (tier: 'basic' | 'premium') => {
    const plan = tier === 'basic' ? basicPlan : premiumPlan;
    return billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualMonthlyPrice;
  };

  const getTotal = (tier: 'basic' | 'premium') => {
    const plan = tier === 'basic' ? basicPlan : premiumPlan;
    return billingPeriod === 'monthly' 
      ? plan.monthlyPrice 
      : plan.annualPrice;
  };

  const savings = billingPeriod === 'annual' ? 26 : 0;

  // 🍎 APPLE WAY: Only Premium gets trial, Basic pays upfront
  const getButtonText = (planTier: 'basic' | 'premium') => {
    // If user is on this plan already
    if (tier === planTier) {
      return 'Current Plan';
    }
    
    // Basic users upgrading to Premium
    if (isBasic && planTier === 'premium') {
      return 'Upgrade to Premium';
    }
    
    // Premium users (shouldn't downgrade, but just in case)
    if (tier === 'premium' && planTier === 'basic') {
      return 'Downgrade';
    }
    
    // New users / trial users
    if (planTier === 'premium') {
      return 'Start 7-Day Free Trial'; // Premium gets trial
    } else {
      return 'Subscribe Now'; // Basic pays upfront
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-background text-foreground py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section - Trading Health Focus */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 mb-4 bg-primary/10 px-4 py-2 rounded-full"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">YOUR TRADING HEALTH PLAN</span>
          </motion.div>
          
          <h1 className="text-5xl font-bold mb-4 text-foreground">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-12">
            Track your Edge, Consistency & Risk Control
          </p>

          {/* Trading Health Hero Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-2xl p-6 border border-orange-500/20"
            >
              <div className="text-4xl mb-3">💰</div>
              <div className="font-bold text-lg mb-1 text-foreground">Edge</div>
              <div className="text-sm text-muted-foreground">Are you profitable?</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-6 border border-green-500/20"
            >
              <div className="text-4xl mb-3">🎯</div>
              <div className="font-bold text-lg mb-1 text-foreground">Consistency</div>
              <div className="text-sm text-muted-foreground">Following your rules?</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-2xl p-6 border border-cyan-500/20"
            >
              <div className="text-4xl mb-3">⚠️</div>
              <div className="font-bold text-lg mb-1 text-foreground">Risk Control</div>
              <div className="text-sm text-muted-foreground">Protecting your capital?</div>
            </motion.div>
          </div>

          <p className="text-base text-muted-foreground mb-8">
            ✨ Premium: 7-day free trial • Basic: Pay as you go • Cancel anytime
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-muted/50 rounded-xl p-1.5 shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'annual'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual
              {billingPeriod === 'annual' && (
                <span className="text-xs bg-primary-foreground/30 px-2 py-0.5 rounded-full">
                  Save {savings}%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Basic Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl p-8 border border-border shadow-sm"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2 text-foreground">Basic</h3>
              <p className="text-muted-foreground">
                For serious traders
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-gray-900">${getPrice('basic')}</span>
                <span className="text-gray-600">/month</span>
              </div>
              {billingPeriod === 'annual' && (
                <p className="text-sm text-gray-600 mt-2">
                  ${getTotal('basic')} billed annually
                </p>
              )}
            </div>

            <button
              onClick={() => handleSubscribe('basic')}
              disabled={loadingPlan === 'basic' || (isBasic && tier === 'basic')}
              className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6 shadow-sm"
            >
              {loadingPlan === 'basic' ? 'Loading...' : getButtonText('basic')}
            </button>

            {/* Tiered Features - Apple Style */}
            <div className="space-y-6">
              {/* Tier 1: Trading Health */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm text-gray-900">Trading Health</span>
                </div>
                <div className="space-y-2 ml-6">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">7-day trends</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Edge, Consistency & Risk rings</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Basic insights (50/month)</span>
                  </div>
                </div>
              </div>

              {/* Tier 2: Core Features */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm text-gray-900">Included</span>
                </div>
                <div className="space-y-2 ml-6">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Unlimited trades & notes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Up to 3 accounts</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Advanced analytics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">Public sharing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">All accent colors</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-2xl p-8 relative overflow-hidden shadow-lg"
          >
            {/* Popular Badge */}
            <div className="absolute top-4 right-4 bg-primary-foreground/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
              🔥 Most Popular
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <p className="text-primary-foreground/90">
                For professional traders
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">${getPrice('premium')}</span>
                <span className="text-white/90">/month</span>
              </div>
              {billingPeriod === 'annual' && (
                <p className="text-sm text-white/90 mt-2">
                  ${getTotal('premium')} billed annually
                </p>
              )}
            </div>

            <button
              onClick={() => handleSubscribe('premium')}
              disabled={loadingPlan === 'premium' || tier === 'premium'}
              className="w-full py-3 px-6 bg-card text-primary rounded-xl font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6 flex items-center justify-center gap-2 shadow-sm"
            >
              <Zap className="w-4 h-4" />
              {loadingPlan === 'premium' ? 'Loading...' : getButtonText('premium')}
            </button>

            {/* Tiered Features - Apple Style for Premium */}
            <div className="space-y-6">
              {/* Everything in Basic */}
              <div>
                <div className="flex items-start gap-2 mb-2">
                  <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold">Everything in Basic</span>
                </div>
              </div>

              {/* Tier 1: Trading Health Premium */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-white" />
                  <span className="font-semibold text-sm">Trading Health Premium</span>
                </div>
                <div className="space-y-2 ml-6">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/90">30-day trends (vs 7-day)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/90">"For You" personalized insights</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/90">Unlimited AI insights</span>
                  </div>
                </div>
              </div>

              {/* Tier 2: Intelligence Layer */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-white" />
                  <span className="font-semibold text-sm">Intelligence</span>
                </div>
                <div className="space-y-2 ml-6">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/90">Setup Analytics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/90">Time Intelligence</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/90">Top 3 habit correlations</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/90">Insight history archive</span>
                  </div>
                </div>
              </div>

              {/* Tier 3: Power Features */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-white" />
                  <span className="font-semibold text-sm">Power Features</span>
                </div>
                <div className="space-y-2 ml-6">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/90">Calendar Heatmap</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/90">Custom date ranges</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/90">Unlimited accounts & history</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-white flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-white/90">Experiment Mode</span>
                  </div>
                </div>
              </div>

              {/* Progressive Disclosure */}
              <div className="text-sm text-white/70 italic pt-2 text-center border-t border-white/10">
                And 8 more features...
              </div>
            </div>
          </motion.div>
        </div>

        {/* "For You" Examples Section - Premium Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">
                Premium Example
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Get Insights Like These</h3>
            <p className="text-gray-600">
              Discover your edge with personalized "For You" suggestions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 border border-blue-200 shadow-sm">
              <div className="text-2xl mb-2">💰</div>
              <div className="text-sm font-medium mb-1 text-gray-900">Most Profitable</div>
              <div className="text-xs text-gray-700">
                "You're 34% more profitable with momentum setups before 11 AM"
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200 shadow-sm">
              <div className="text-2xl mb-2">🎯</div>
              <div className="text-sm font-medium mb-1 text-gray-900">Consistency Alert</div>
              <div className="text-xs text-gray-700">
                "Your rule adherence drops to 62% after 2 PM"
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4 border border-red-200 shadow-sm">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="text-sm font-medium mb-1 text-gray-900">Risk Pattern</div>
              <div className="text-xs text-gray-700">
                "You take 2.3x larger positions after losses"
              </div>
            </div>
          </div>
        </motion.div>

        {/* FAQ or Trust Indicators */}
        <div className="text-center mt-16 text-sm text-gray-600">
          <p>🔒 Secure payment powered by Stripe</p>
          <p className="mt-2">Cancel anytime • No questions asked • Full refund within 7 days</p>
        </div>
      </div>

      {/* 🍎 APPLE WAY: Welcome to Premium Modal */}
      <WelcomeToPremiumModal
        isOpen={showWelcomeModal}
        onClose={() => {
          setShowWelcomeModal(false);
          setTimeout(() => {
            window.location.href = '/?view=dashboard';
          }, 300);
        }}
        proratedAmount={upgradeDetails.proratedAmount}
        nextBillingAmount={upgradeDetails.nextBillingAmount}
        nextBillingDate={upgradeDetails.nextBillingDate}
        billingPeriod={billingPeriod}
      />
    </div>
  );
};

