/**
 * Upgrade Modal - Apple-style premium upgrade prompt
 * Clean, persuasive, beautiful
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Sparkles, Zap, TrendingUp, Clock, Calendar, Tag, History, BarChart3, Settings, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string; // Specific feature that triggered the modal
}

const PREMIUM_FEATURES = [
  {
    icon: Tag,
    title: 'Setup Analytics',
    description: 'Track which trading setups work best for you',
  },
  {
    icon: Calendar,
    title: 'Calendar Heatmap',
    description: 'Visualize your daily P&L at a glance',
  },
  {
    icon: Clock,
    title: 'Time Intelligence',
    description: 'Discover your most profitable hours and days',
  },
  {
    icon: TrendingUp,
    title: 'Custom Date Ranges',
    description: 'Analyze any date range you want',
  },
  {
    icon: Zap,
    title: 'Unlimited History',
    description: 'Access all your trades, forever',
  },
  {
    icon: Sparkles,
    title: 'Unlimited AI Insights',
    description: 'Get unlimited AI-powered analysis',
  },
  {
    icon: History,
    title: 'Insight History',
    description: 'Never miss a discovery - see all past insights',
  },
  {
    icon: BarChart3,
    title: 'Multiple Correlations',
    description: 'See top 3 habit connections, not just strongest',
  },
  {
    icon: BarChart3,
    title: 'Correlation Charts',
    description: 'Visualize habit impact with beautiful graphs',
  },
  {
    icon: Settings,
    title: 'Insight Scheduling',
    description: 'Prioritize which insights you see first',
  },
  {
    icon: FlaskConical,
    title: 'Experiment Mode',
    description: 'A/B test habits with structured experiments',
  },
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, feature }) => {
  const { isTrial, isBasic } = useSubscription();
  
  // Determine if user is a new/free user (neither trial nor basic)
  const isNewUser = !isTrial && !isBasic;
  
  // Button text changes based on user status
  const buttonText = isNewUser ? 'Start Free Trial' : 'Upgrade to Premium';
  const subText = isNewUser ? '7-Day Free Trial • Cancel Anytime' : 'Billed at $39/month • Cancel Anytime';
  
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
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-8 bg-gradient-to-br from-primary/10 via-purple-500/5 to-background border-b border-border">
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
            <div className="p-8 overflow-y-auto max-h-[60vh]">
              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Monthly */}
                <div className="p-6 border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="text-sm text-muted-foreground mb-2">Monthly</div>
                  <div className="text-3xl font-bold mb-1">$29<span className="text-lg text-muted-foreground">/mo</span></div>
                  <div className="text-sm text-muted-foreground">Billed monthly</div>
                </div>

                {/* Annual (Recommended) */}
                <div className="relative p-6 border-2 border-primary rounded-xl bg-primary/5 cursor-pointer">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                    SAVE 30%
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">Annual</div>
                  <div className="text-3xl font-bold mb-1">$20<span className="text-lg text-muted-foreground">/mo</span></div>
                  <div className="text-sm text-muted-foreground">$240/year (save $108)</div>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold">Everything in Premium:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PREMIUM_FEATURES.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{feature.title}</div>
                          <div className="text-xs text-muted-foreground">{feature.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Trust Signals */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
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

            {/* Footer */}
            <div className="p-6 border-t border-border bg-muted/20">
              <button
                onClick={() => {
                  // TODO: Open Stripe checkout
                  console.log('Open Stripe checkout');
                }}
                className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
