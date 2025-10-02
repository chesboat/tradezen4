import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { getTrialInfo, getTrialMessage, getUpgradeCTA } from '@/lib/subscription';

interface TrialBannerProps {
  onUpgradeClick: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ onUpgradeClick }) => {
  const { isTrial } = useSubscription();
  const { profile } = useUserProfileStore();
  const [isDismissed, setIsDismissed] = useState(false);
  const [trialInfo, setTrialInfo] = useState(() => getTrialInfo(profile?.trialStartedAt));

  // Update trial info every minute
  useEffect(() => {
    if (!isTrial) return;

    const interval = setInterval(() => {
      setTrialInfo(getTrialInfo(profile?.trialStartedAt));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [isTrial, profile?.trialStartedAt]);

  // Don't show if not on trial, dismissed, or no trial info
  if (!isTrial || isDismissed || !trialInfo) return null;

  const message = getTrialMessage(trialInfo);
  const ctaText = getUpgradeCTA(trialInfo);
  const isUrgent = trialInfo.isExpiringSoon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`relative overflow-hidden border-b ${
          isUrgent 
            ? 'bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10 border-orange-500/20' 
            : 'bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Trial Status */}
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                isUrgent ? 'bg-orange-500/20' : 'bg-primary/20'
              }`}>
                <Zap className={`w-4 h-4 ${
                  isUrgent ? 'text-orange-500' : 'text-primary'
                }`} />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {message}
                  </span>
                  {isUrgent && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 font-medium">
                      Expiring Soon
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {trialInfo.isLastDay 
                    ? 'Auto-converts to Basic ($19/mo) after trial' 
                    : 'Enjoying Premium features? Upgrade to keep them forever'}
                </p>
              </div>
            </div>

            {/* Right: CTA + Dismiss */}
            <div className="flex items-center gap-2">
              <motion.button
                onClick={onUpgradeClick}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  isUrgent
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {ctaText}
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <button
                onClick={() => setIsDismissed(true)}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Animated progress bar for last day */}
        {trialInfo.isLastDay && (
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500"
            initial={{ width: '100%' }}
            animate={{ width: `${(trialInfo.hoursRemaining / 24) * 100}%` }}
            transition={{ duration: 1 }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

