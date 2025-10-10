import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { redirectToCheckout, getPriceId } from '@/lib/stripe';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import toast from 'react-hot-toast';

type BillingPeriod = 'monthly' | 'annual';

export const PricingPage = () => {
  const { currentUser } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (tier: 'basic' | 'premium') => {
    if (!currentUser) {
      toast.error('Please sign in to subscribe');
      return;
    }

    setLoadingPlan(tier);
    try {
      const priceId = getPriceId(tier, billingPeriod);
      await redirectToCheckout(priceId, currentUser.uid);
    } catch (error: any) {
      console.error('Error starting checkout:', error);
      toast.error(error.message || 'Failed to start checkout');
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

  return (
    <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-[var(--text-secondary)] mb-8">
            7-day free trial • Cancel anytime • No credit card required for trial
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-[var(--background-secondary)] rounded-xl p-1.5">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-[var(--accent-color)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'annual'
                  ? 'bg-[var(--accent-color)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Annual
              {billingPeriod === 'annual' && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
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
            transition={{ delay: 0.1 }}
            className="bg-[var(--background-secondary)] rounded-2xl p-8 border border-[var(--border-primary)]"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Basic</h3>
              <p className="text-[var(--text-secondary)]">
                For serious traders
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">${getPrice('basic')}</span>
                <span className="text-[var(--text-secondary)]">/month</span>
              </div>
              {billingPeriod === 'annual' && (
                <p className="text-sm text-[var(--text-secondary)] mt-2">
                  ${getTotal('basic')} billed annually
                </p>
              )}
            </div>

            <button
              onClick={() => handleSubscribe('basic')}
              disabled={loadingPlan === 'basic'}
              className="w-full py-3 px-6 bg-[var(--accent-color)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mb-6"
            >
              {loadingPlan === 'basic' ? 'Loading...' : 'Start Free Trial'}
            </button>

            <div className="space-y-3">
              {basicPlan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[var(--accent-color)] flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--accent-color)] text-white rounded-2xl p-8 relative overflow-hidden"
          >
            {/* Popular Badge */}
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
              🔥 Most Popular
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <p className="text-white/80">
                For professional traders
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">${getPrice('premium')}</span>
                <span className="text-white/80">/month</span>
              </div>
              {billingPeriod === 'annual' && (
                <p className="text-sm text-white/80 mt-2">
                  ${getTotal('premium')} billed annually
                </p>
              )}
            </div>

            <button
              onClick={() => handleSubscribe('premium')}
              disabled={loadingPlan === 'premium'}
              className="w-full py-3 px-6 bg-white text-[var(--accent-color)] rounded-xl font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              {loadingPlan === 'premium' ? 'Loading...' : 'Start Free Trial'}
            </button>

            <div className="space-y-3">
              {premiumPlan.features.slice(0, 12).map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/90">{feature}</span>
                </div>
              ))}
              <div className="text-sm text-white/80 italic pt-2">
                + {premiumPlan.features.length - 12} more features...
              </div>
            </div>
          </motion.div>
        </div>

        {/* FAQ or Trust Indicators */}
        <div className="text-center mt-12 text-sm text-[var(--text-secondary)]">
          <p>🔒 Secure payment powered by Stripe</p>
          <p className="mt-2">Cancel anytime • No questions asked • Full refund within 7 days</p>
        </div>
      </div>
    </div>
  );
};

