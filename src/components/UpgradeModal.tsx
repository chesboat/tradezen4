import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Crown, Sparkles } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import { formatPrice, formatAnnualMonthly, getSavingsPercentage } from '@/lib/subscription';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: 'trial' | 'basic' | 'premium';
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ 
  isOpen, 
  onClose,
  currentTier = 'trial'
}) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  
  const basicPlan = SUBSCRIPTION_PLANS.basic;
  const premiumPlan = SUBSCRIPTION_PLANS.premium;

  const handleUpgrade = (tier: 'basic' | 'premium', period: 'monthly' | 'annual') => {
    // TODO: Implement Stripe checkout
    console.log('Upgrade to:', tier, period);
    // For now, just close modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-background rounded-2xl border border-border shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Upgrade Your Plan</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the plan that fits your trading journey
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Billing Toggle */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-4 py-2 rounded-lg font-medium transition-all relative ${
                  billingPeriod === 'annual'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Annual
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Save {getSavingsPercentage(basicPlan.monthlyPrice, basicPlan.annualPrice)}%
                </span>
              </button>
            </div>
          </div>

          {/* Plans */}
          <div className="px-6 pb-6 grid md:grid-cols-2 gap-6">
            {/* Basic Plan */}
            <motion.div
              className={`relative rounded-xl border-2 p-6 transition-all ${
                currentTier === 'basic'
                  ? 'border-green-500 bg-green-500/5'
                  : 'border-border hover:border-primary/30'
              }`}
              whileHover={{ y: -4 }}
            >
              {currentTier === 'basic' && (
                <div className="absolute top-4 right-4">
                  <span className="text-xs px-3 py-1 rounded-full bg-green-500 text-white font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold">{basicPlan.name}</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {basicPlan.description}
              </p>

              <div className="mb-6">
                {billingPeriod === 'monthly' ? (
                  <div>
                    <div className="text-3xl font-bold">
                      {formatPrice(basicPlan.monthlyPrice)}
                      <span className="text-lg text-muted-foreground font-normal">/month</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl font-bold">
                      {formatAnnualMonthly(basicPlan.annualPrice)}
                      <span className="text-lg text-muted-foreground font-normal">/month</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPrice(basicPlan.annualPrice)} billed annually
                    </div>
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {basicPlan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade('basic', billingPeriod)}
                disabled={currentTier === 'basic'}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  currentTier === 'basic'
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {currentTier === 'basic' ? 'Current Plan' : 'Upgrade to Basic'}
              </button>
            </motion.div>

            {/* Premium Plan */}
            <motion.div
              className={`relative rounded-xl border-2 p-6 transition-all ${
                currentTier === 'premium'
                  ? 'border-green-500 bg-green-500/5'
                  : 'border-primary bg-primary/5'
              }`}
              whileHover={{ y: -4 }}
            >
              {!currentTier || currentTier === 'trial' ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-xs px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </span>
                </div>
              ) : currentTier === 'premium' ? (
                <div className="absolute top-4 right-4">
                  <span className="text-xs px-3 py-1 rounded-full bg-green-500 text-white font-medium">
                    Current Plan
                  </span>
                </div>
              ) : null}

              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold">{premiumPlan.name}</h3>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {premiumPlan.description}
              </p>

              <div className="mb-6">
                {billingPeriod === 'monthly' ? (
                  <div>
                    <div className="text-3xl font-bold">
                      {formatPrice(premiumPlan.monthlyPrice)}
                      <span className="text-lg text-muted-foreground font-normal">/month</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl font-bold">
                      {formatAnnualMonthly(premiumPlan.annualPrice)}
                      <span className="text-lg text-muted-foreground font-normal">/month</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatPrice(premiumPlan.annualPrice)} billed annually
                    </div>
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {premiumPlan.features.slice(0, 10).map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="font-medium">{feature}</span>
                  </li>
                ))}
                {premiumPlan.features.length > 10 && (
                  <li className="text-sm text-muted-foreground pl-6">
                    + {premiumPlan.features.length - 10} more features
                  </li>
                )}
              </ul>

              <button
                onClick={() => handleUpgrade('premium', billingPeriod)}
                disabled={currentTier === 'premium'}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  currentTier === 'premium'
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90'
                }`}
              >
                {currentTier === 'premium' ? 'Current Plan' : 'Upgrade to Premium'}
              </button>
            </motion.div>
          </div>

          {/* Footer */}
          <div className="border-t border-border px-6 py-4 bg-muted/30">
            <p className="text-xs text-center text-muted-foreground">
              ✓ Cancel anytime • ✓ No hidden fees • ✓ Secure payment with Stripe
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

