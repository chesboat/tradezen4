/**
 * Upgrade Modal - Apple-style premium upgrade prompt
 * Clean, persuasive, beautiful
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Zap, TrendingUp, Clock, Calendar, Tag, History, BarChart3, Settings, FlaskConical, Target, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';
import { formatPrice, getAnnualSavings } from '@/lib/subscription';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string; // Specific feature that triggered the modal
}

// Apple's Tiered Feature Hierarchy
const FLAGSHIP_FEATURES = [
  {
    icon: Target,
    title: '30-day & 90-day health trends',
    description: 'See how your trading evolves over time',
  },
  {
    icon: TrendingUp,
    title: 'Detailed rule breakdown',
    description: "Know exactly which rules you're breaking and how to improve",
  },
  {
    icon: Sparkles,
    title: '"For You" personalized coaching',
    description: 'Contextual suggestions based on your trading metrics and performance',
  },
  {
    icon: BarChart3,
    title: 'Full ring calculations',
    description: 'Understand the math behind your scores with detailed breakdowns',
  },
];

const INTELLIGENCE_FEATURES = [
  {
    icon: Tag,
    title: 'Setup Analytics',
    description: 'Find your best trading strategies',
  },
  {
    icon: Clock,
    title: 'Time Intelligence',
    description: 'Trade your most profitable hours',
  },
  {
    icon: History,
    title: 'Insight History',
    description: 'Never miss a discovery',
  },
  {
    icon: FlaskConical,
    title: 'Experiment Mode',
    description: 'A/B test your habits',
  },
];

const POWER_FEATURES = [
  'Calendar Heatmap',
  'Custom Date Ranges',
  'Unlimited History',
  'Multiple Correlations',
  'Correlation Charts',
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, feature }) => {
  const { isTrial, isBasic } = useSubscription();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  
  const premiumPlan = SUBSCRIPTION_PLANS.premium;
  
  // Determine if user is a new/free user (neither trial nor basic)
  const isNewUser = !isTrial && !isBasic;
  
  // Button text changes based on feature context and user status
  const getButtonText = () => {
    if (feature) {
      // Feature-specific CTAs for Trading Health
      if (feature.includes('Trend')) return isNewUser ? 'Start Free Trial' : 'Unlock 30/90-Day Trends';
      if (feature.includes('Rule')) return isNewUser ? 'Start Free Trial' : 'Get Full Rule Breakdown';
      if (feature.includes('Edge')) return isNewUser ? 'Start Free Trial' : 'Unlock Edge Analysis';
      if (feature.includes('Risk')) return isNewUser ? 'Start Free Trial' : 'Unlock Risk Analysis';
      if (feature.includes('For You')) return isNewUser ? 'Start Free Trial' : 'Enable For You Coaching';
      
      // Feature-specific CTAs for Intelligence features
      if (feature.includes('Calendar')) return isNewUser ? 'Start Free Trial' : 'Unlock Calendar Heatmap';
      if (feature.includes('Time Intelligence')) return isNewUser ? 'Start Free Trial' : 'Unlock Time Intelligence';
      if (feature.includes('Setup Analytics')) return isNewUser ? 'Start Free Trial' : 'Unlock Setup Analytics';
      if (feature.includes('Insight History')) return isNewUser ? 'Start Free Trial' : 'Unlock Insight History';
      if (feature.includes('Experiment')) return isNewUser ? 'Start Free Trial' : 'Unlock Experiment Mode';
    }
    // Default CTAs
    return isNewUser ? 'Start Free Trial' : 'Upgrade to Premium';
  };
  
  const buttonText = getButtonText();
  
  // Subtext changes based on billing period and user status
  const subText = isNewUser 
    ? '7-Day Free Trial • Cancel Anytime'
    : billingPeriod === 'monthly'
    ? `Billed at ${formatPrice(premiumPlan.monthlyPrice)}/month • Cancel Anytime`
    : `Billed at ${formatPrice(premiumPlan.annualPrice)}/year • Cancel Anytime`;
  
  // Calculate savings
  const annualSavings = getAnnualSavings(premiumPlan.monthlyPrice, premiumPlan.annualPrice);
  const savingsPercentage = Math.round((annualSavings / (premiumPlan.monthlyPrice * 12)) * 100);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-4 sm:p-8 bg-gradient-to-br from-primary/10 via-purple-500/5 to-background border-b border-border flex-shrink-0">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Upgrade to Premium</h2>
                  <p className="text-sm text-muted-foreground">Unlock your full trading potential</p>
                </div>
              </div>

              {feature && (
                <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm text-foreground">
                    <strong>{feature}</strong> is a Premium feature
                  </p>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 sm:p-8 overflow-y-auto flex-1">
              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {/* Monthly */}
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={cn(
                    "p-4 sm:p-6 rounded-xl transition-all text-left",
                    billingPeriod === 'monthly'
                      ? 'border-2 border-primary bg-primary/5'
                      : 'border border-border hover:border-primary/50'
                  )}
                >
                  <div className="text-sm text-muted-foreground mb-2">Monthly</div>
                  <div className="text-3xl font-bold mb-1">
                    {formatPrice(premiumPlan.monthlyPrice)}
                    <span className="text-lg text-muted-foreground">/mo</span>
                  </div>
                  <div className="text-sm text-muted-foreground">Billed monthly</div>
                </button>

                {/* Annual (Recommended) */}
                <button
                  onClick={() => setBillingPeriod('annual')}
                  className={cn(
                    "relative p-4 sm:p-6 rounded-xl transition-all text-left",
                    billingPeriod === 'annual'
                      ? 'border-2 border-primary bg-primary/5'
                      : 'border border-border hover:border-primary/50'
                  )}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                    SAVE {savingsPercentage}%
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">Annual</div>
                  <div className="text-3xl font-bold mb-1">
                    {formatPrice(premiumPlan.annualMonthlyPrice)}
                    <span className="text-lg text-muted-foreground">/mo</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(premiumPlan.annualPrice)}/year (save {formatPrice(annualSavings)})
                  </div>
                </button>
              </div>

              {/* Features List - Apple Tiered Hierarchy */}
              <div className="space-y-6 mb-6 sm:mb-8">
                {/* Trading Health Hero */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-bold">Trading Health Pro</h3>
                  </div>
                  <div className="space-y-3">
                    {FLAGSHIP_FEATURES.map((feat, index) => {
                      const Icon = feat.icon;
                      return (
                        <div key={index} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <div className="p-1.5 bg-primary/10 rounded-lg flex-shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-foreground">{feat.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{feat.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Intelligence Features */}
                <div>
                  <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    Intelligence
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {INTELLIGENCE_FEATURES.map((feat, index) => {
                      const Icon = feat.icon;
                      return (
                        <div key={index} className="flex items-start gap-2.5">
                          <div className="p-1.5 bg-muted rounded-lg flex-shrink-0 mt-0.5">
                            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{feat.title}</div>
                            <div className="text-xs text-muted-foreground">{feat.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Power Features */}
                <div>
                  <h3 className="text-base font-semibold mb-3 text-muted-foreground">And Everything Else</h3>
                  <div className="flex flex-wrap gap-2">
                    {POWER_FEATURES.map((feature, index) => (
                      <div key={index} className="px-3 py-1.5 bg-muted/50 rounded-lg text-xs font-medium text-muted-foreground">
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trust Signals */}
              <div className="border-t border-border pt-4 sm:pt-6 pb-2">
                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>7-day free trial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Secure checkout</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Sticky */}
            <div className="p-4 sm:p-6 border-t border-border bg-muted/20 flex-shrink-0">
              <button
                onClick={() => {
                  // TODO: Open Stripe checkout
                  console.log('Open Stripe checkout');
                }}
                className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {buttonText}
              </button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                {subText}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;
