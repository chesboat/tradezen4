import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles, Brain, TrendingUp, Calendar, Target, MessageCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useUserProfileStore } from '@/store/useUserProfileStore';

// Feature cards for onboarding
const features = [
  {
    icon: TrendingUp,
    title: 'Log Your First Trade',
    description: 'Start building your journal with your first trade entry',
    action: 'Add Trade',
    color: 'from-blue-500 to-purple-500',
  },
  {
    icon: Calendar,
    title: 'Track Your Discipline',
    description: 'Set up habits and close your daily rings',
    action: 'View Calendar',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Brain,
    title: 'Meet Your AI Coach',
    description: 'Get personalized insights and guidance',
    action: 'Ask Coach',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Target,
    title: 'Set Your Goals',
    description: 'Define your trading objectives and metrics',
    action: 'Set Goals',
    color: 'from-yellow-500 to-orange-500',
  },
];

export const SubscriptionSuccess = () => {
  const sessionId = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('session_id')
    : null;
  const [selectedFeature, setSelectedFeature] = useState(0);
  const { profile } = useUserProfileStore();
  
  // 🍎 APPLE WAY: Check if user just signed up for Basic (from sessionStorage)
  const [justSignedUpForBasic, setJustSignedUpForBasic] = useState(false);

  // 🍎 APPLE WAY: Detect if this is Basic (no trial) or Premium (trial)
  // Check both profile data AND sessionStorage for immediate detection
  const isBasic = profile?.subscriptionTier === 'basic' || justSignedUpForBasic;
  const isPremiumTrial = profile?.subscriptionStatus === 'trialing';

  useEffect(() => {
    // Clear post-signup pricing flag on success page
    try { sessionStorage.removeItem('show_pricing_after_auth'); } catch {}
    
    // 🍎 APPLE WAY: Force light mode for success page (marketing/conversion)
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    
    // 🍎 APPLE WAY: Set a temporary grace flag to allow dashboard access
    // while webhook processes subscription. Expires after 60 seconds.
    try {
      sessionStorage.setItem('just_completed_checkout', Date.now().toString());
    } catch {}
    
    // 🍎 APPLE WAY: Detect which plan was purchased by checking localStorage
    // This is set in PricingPage before checkout
    try {
      const purchasedPlan = localStorage.getItem('purchased_plan_tier');
      if (purchasedPlan === 'basic') {
        setJustSignedUpForBasic(true);
        localStorage.removeItem('purchased_plan_tier'); // Clear after reading
      }
    } catch {}

    // Trigger confetti celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Log the successful checkout
    if (sessionId) {
      console.log('Checkout session completed:', sessionId);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 text-gray-900 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl w-full"
      >
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl mb-6 shadow-xl"
          >
            <CheckCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
          </motion.div>

          {/* Success Message */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl font-bold mb-4"
          >
            {isBasic ? "Welcome to Basic! 🎉" : "You're All Set! 🎉"}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg sm:text-xl text-gray-600"
          >
            {isBasic 
              ? "Your subscription is active. Start building your trading edge today."
              : isPremiumTrial
                ? <>Your <span className="font-semibold text-blue-600">7-day free trial</span> starts now</>
                : "Your Premium subscription is active"
            }
          </motion.p>
        </div>

        {/* Benefits Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                {isBasic ? "What's Included in Basic" : "What's Included in Your Trial"}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {isBasic ? (
                  <>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>Up to 3 trading accounts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>Unlimited trades & journal entries</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>AI insights (50/month)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>Advanced analytics & public sharing</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>Unlimited AI Coach conversations & insights</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>Advanced analytics & performance tracking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>Unlimited trade logs & journal entries</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>All premium features unlocked for 7 days</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {isBasic 
                ? "✅ Your subscription is active. Cancel anytime from settings."
                : "💳 You won't be charged until your trial ends. Cancel anytime before then at no cost."
              }
            </p>
          </div>
        </motion.div>

        {/* Quick Start Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold mb-4 text-center">
            Get Started in Minutes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="bg-[var(--background-secondary)] hover:bg-[var(--background-tertiary)] rounded-xl p-5 cursor-pointer transition-all group border border-transparent hover:border-[var(--accent-color)]/20"
                  onClick={() => setSelectedFeature(index)}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg text-lg"
          >
            Start Exploring
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => window.location.href = '/?view=settings'}
            className="w-full py-3 px-6 bg-[var(--background-secondary)] text-[var(--text-primary)] rounded-xl font-medium hover:bg-[var(--background-tertiary)] transition-colors"
          >
            Manage Subscription
          </button>
        </motion.div>

        {/* Support Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-sm text-[var(--text-tertiary)] mt-6"
        >
          Questions? We're here to help. Contact support anytime.
        </motion.p>
      </motion.div>
    </div>
  );
};

