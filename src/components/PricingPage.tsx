import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, TrendingUp, Target, Shield, Sparkles, Calendar, Clock, BarChart3 } from 'lucide-react';
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
      console.log('Subscribing:', { tier, billingPeriod, priceId, userId: currentUser.uid });
      
      if (!priceId) {
        throw new Error(`Missing price ID for ${tier} ${billingPeriod}. Check Vercel environment variables.`);
      }
      
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
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section - Trading Health Focus */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 mb-4 bg-blue-100 px-4 py-2 rounded-full"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">YOUR TRADING HEALTH PLAN</span>
          </motion.div>
          
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 mb-12">
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
              <div className="font-bold text-lg mb-1 text-gray-900">Edge</div>
              <div className="text-sm text-gray-600">Are you profitable?</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-2xl p-6 border border-green-500/20"
            >
              <div className="text-4xl mb-3">🎯</div>
              <div className="font-bold text-lg mb-1 text-gray-900">Consistency</div>
              <div className="text-sm text-gray-600">Following your rules?</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-2xl p-6 border border-cyan-500/20"
            >
              <div className="text-4xl mb-3">⚠️</div>
              <div className="font-bold text-lg mb-1 text-gray-900">Risk Control</div>
              <div className="text-sm text-gray-600">Protecting your capital?</div>
            </motion.div>
          </div>

          <p className="text-base text-gray-600 mb-8">
            ✨ 7-day free trial • Cancel anytime • No credit card required for trial
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-gray-100 rounded-xl p-1.5 shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                billingPeriod === 'annual'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              {billingPeriod === 'annual' && (
                <span className="text-xs bg-white/30 px-2 py-0.5 rounded-full">
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
            className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2 text-gray-900">Basic</h3>
              <p className="text-gray-600">
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
              disabled={loadingPlan === 'basic'}
              className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6 shadow-sm"
            >
              {loadingPlan === 'basic' ? 'Loading...' : 'Start Free Trial'}
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
            className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-8 relative overflow-hidden shadow-lg"
          >
            {/* Popular Badge */}
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
              🔥 Most Popular
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Premium</h3>
              <p className="text-white/90">
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
              disabled={loadingPlan === 'premium'}
              className="w-full py-3 px-6 bg-white text-blue-600 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6 flex items-center justify-center gap-2 shadow-sm"
            >
              <Zap className="w-4 h-4" />
              {loadingPlan === 'premium' ? 'Loading...' : 'Start Free Trial'}
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
    </div>
  );
};

