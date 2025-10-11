import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Crown, Zap } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { useState } from 'react';

/**
 * Apple-style trial reminder banner
 * Shows on days 5, 6, 7 of trial with increasing urgency
 */
export const TrialBanner = () => {
  const { isTrial } = useSubscription();
  const { setCurrentView } = useNavigationStore();
  const { profile } = useUserProfileStore();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isTrial || isDismissed) return null;

  const trialEnd = profile?.trialEndsAt;
  if (!trialEnd) return null;

  const now = new Date();
  const endDate = trialEnd instanceof Date ? trialEnd : new Date(trialEnd);
  const msRemaining = endDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.ceil(msRemaining / (1000 * 60 * 60));

  // Only show on days 3 and under
  if (daysRemaining > 3 || daysRemaining < 0) return null;

  const isLastDay = daysRemaining <= 1;
  const isCritical = daysRemaining <= 2;

  // Different messages based on urgency
  const getMessage = () => {
    if (isLastDay) {
      const hours = hoursRemaining === 1 ? '1 hour' : `${hoursRemaining} hours`;
      return {
        title: '⏰ Last Day of Premium Trial',
        subtitle: `Only ${hours} left! Subscribe now to keep AI Coach, unlimited features, and all your data.`,
        icon: Zap,
        gradient: 'from-orange-500 to-red-500',
        bgGradient: 'from-orange-500/10 to-red-500/10',
        borderColor: 'border-orange-500/30',
      };
    }
    if (isCritical) {
      return {
        title: '🔔 Your Premium Trial Ends Soon',
        subtitle: `${daysRemaining} days left. Upgrade to keep unlimited AI insights, advanced analytics, and premium features.`,
        icon: Crown,
        gradient: 'from-yellow-500 to-orange-500',
        bgGradient: 'from-yellow-500/10 to-orange-500/10',
        borderColor: 'border-yellow-500/30',
      };
    }
    return {
      title: '✨ You\'re on a Premium Trial',
      subtitle: `${daysRemaining} days left. Upgrade anytime to keep unlimited access to all premium features.`,
      icon: Sparkles,
      gradient: 'from-blue-500 to-purple-500',
      bgGradient: 'from-blue-500/10 to-purple-500/10',
      borderColor: 'border-blue-500/30',
    };
  };

  const message = getMessage();
  const Icon = message.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className="w-full"
      >
        <div className={`
          relative overflow-hidden
          bg-gradient-to-r ${message.bgGradient}
          border ${message.borderColor}
          backdrop-blur-xl
        `}>
          {/* Apple-style background blur effect */}
          <div className="absolute inset-0 bg-[var(--background-primary)] opacity-50" />
          
          <div className="relative px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Icon */}
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                bg-gradient-to-br ${message.gradient}
              `}>
                <Icon className="w-5 h-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] mb-1">
                  {message.title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-3">
                  {message.subtitle}
                </p>
                <button
                  onClick={() => setCurrentView('pricing')}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-sm
                    bg-gradient-to-r ${message.gradient}
                    text-white shadow-sm
                    hover:shadow-md hover:scale-[1.02]
                    transition-all duration-200
                    inline-flex items-center gap-2
                  `}
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Premium
                </button>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => setIsDismissed(true)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1 -mt-1 -mr-1"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
