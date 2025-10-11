import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Calendar, 
  BarChart3,
  Crown,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { redirectToCheckout, getPriceId } from '@/lib/stripe';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import toast from 'react-hot-toast';

/**
 * Apple-style "Welcome to Premium" screen
 * Shown to new users immediately after sign-up
 * Beautiful, non-blocking introduction to premium features
 */

type BillingPeriod = 'monthly' | 'annual';

interface WelcomeToPremiumProps {
  onSkip?: () => void;
}

export const WelcomeToPremium: React.FC<WelcomeToPremiumProps> = ({ onSkip }) => {
  const { currentUser } = useAuth();
  const { profile, updateProfile } = useUserProfileStore();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('annual');
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  const features = [
    {
      icon: Brain,
      title: 'Unlimited AI Coach',
      description: 'Get personalized insights and guidance on every trade',
      gradient: 'from-purple-500 to-blue-500',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Deep performance analysis and pattern recognition',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Calendar,
      title: 'Unlimited Journaling',
      description: 'No limits on trades, notes, or journal entries',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: TrendingUp,
      title: 'Premium Features',
      description: 'Access all current and future premium tools',
      gradient: 'from-green-500 to-emerald-500',
    },
  ];

  const handleStartTrial = async (tier: 'basic' | 'premium') => {
    if (!currentUser) {
      toast.error('Please sign in to continue');
      return;
    }

    setIsStartingTrial(true);
    try {
      const priceId = getPriceId(tier, billingPeriod);
      
      if (!priceId) {
        throw new Error(`Missing price ID. Please contact support.`);
      }
      
      // Mark that user has seen welcome screen
      if (profile) {
        await updateProfile(currentUser.uid, {
          hasSeenWelcome: true,
        });
      }
      
      await redirectToCheckout(priceId, currentUser.uid);
    } catch (error: any) {
      console.error('Error starting trial:', error);
      toast.error(error.message || 'Failed to start trial');
      setIsStartingTrial(false);
    }
  };

  const handleSkip = async () => {
    if (currentUser && profile) {
      // Mark that user has seen welcome screen
      await updateProfile(currentUser.uid, {
        hasSeenWelcome: true,
      });
    }
    onSkip?.();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background-primary)] via-[var(--background-primary)] to-blue-500/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl mb-6 shadow-xl"
          >
            <Crown className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl font-bold mb-4"
          >
            Welcome to <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">TradZen</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto"
          >
            Start your <span className="font-semibold text-[var(--accent-color)]">7-day free trial</span> and unlock everything you need to become a consistently profitable trader.
          </motion.p>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-[var(--background-secondary)] rounded-xl p-6 border border-[var(--border-color)] hover:border-[var(--accent-color)]/30 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Pricing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
            Monthly
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
            className="relative w-14 h-7 bg-[var(--background-tertiary)] rounded-full transition-colors"
          >
            <motion.div
              animate={{ x: billingPeriod === 'annual' ? 28 : 2 }}
              className="absolute top-1 w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            />
          </button>
          <span className={`text-sm font-medium ${billingPeriod === 'annual' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
            Annual
          </span>
          {billingPeriod === 'annual' && (
            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full font-medium">
              Save 20%
            </span>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="space-y-4"
        >
          {/* Trial Info Banner */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-[var(--text-primary)]">
                7 Days Free, Then {billingPeriod === 'monthly' ? '$29/month' : '$19.17/month'}
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Cancel anytime before trial ends • No charge until {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </div>

          {/* Start Trial Button */}
          <button
            onClick={() => handleStartTrial('premium')}
            disabled={isStartingTrial}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isStartingTrial ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Starting Trial...
              </>
            ) : (
              <>
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            className="w-full py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            I'll do this later →
          </button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 flex items-center justify-center gap-6 text-xs text-[var(--text-tertiary)]"
        >
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            <span>Instant Access</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            <span>Cancel Anytime</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            <span>Secure Payments</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

