/**
 * Premium Insights Showcase - Main Intelligence Hub
 * Displays all 5 premium features in one beautiful page
 * Apple-style: Clean, powerful, intuitive
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, History, BarChart3, Settings, FlaskConical, Crown, TrendingUp } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useTradeStore } from '@/store/useTradeStore';
import { useRuleTallyStore } from '@/store/useRuleTallyStore';
import { findTopHabitCorrelations } from '@/lib/habitCorrelation';
import MultipleCorrelationsView from './MultipleCorrelationsView';
import CorrelationChartsView from './CorrelationChartsView';
import InsightSchedulingView from './InsightSchedulingView';
import { UpgradeModal } from './UpgradeModal';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const PremiumInsightsShowcase: React.FC = () => {
  const { isPremium } = useSubscription();
  const { trades } = useTradeStore();
  const { rules, logs } = useRuleTallyStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeSection, setActiveSection] = useState<'correlations' | 'charts' | 'scheduling'>('correlations');
  
  // Prepare data for habit correlations
  const habitsForCorrelations = useMemo(() => {
    return rules.map(rule => ({
      id: rule.id,
      label: rule.label,
      emoji: rule.emoji || '💪',
    }));
  }, [rules]);
  
  const habitDaysForCorrelations = useMemo(() => {
    return logs.map(log => ({
      date: log.date,
      ruleId: log.ruleId,
      completed: log.tallyCount > 0,
    }));
  }, [logs]);
  
  // Calculate if we have correlations to show
  const topCorrelations = useMemo(() => {
    return findTopHabitCorrelations(habitsForCorrelations, habitDaysForCorrelations, trades, 3);
  }, [habitsForCorrelations, habitDaysForCorrelations, trades]);
  
  const hasCorrelations = topCorrelations.length > 0;
  
  return (
    <div className="flex-1 overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Trading Intelligence</h1>
                <p className="text-muted-foreground">
                  {isPremium ? 'Discover what makes you trade better' : 'Unlock powerful insights about your trading'}
                </p>
              </div>
            </div>
            {!isPremium && (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                <Crown className="w-5 h-5" />
                Upgrade to Premium
              </button>
            )}
          </div>
          
          {/* Section Tabs */}
          {isPremium && hasCorrelations && (
            <div className="flex gap-2 border-b border-border -mb-px">
              <SectionTab
                icon={TrendingUp}
                label="Correlations"
                isActive={activeSection === 'correlations'}
                onClick={() => setActiveSection('correlations')}
              />
              <SectionTab
                icon={BarChart3}
                label="Charts"
                isActive={activeSection === 'charts'}
                onClick={() => setActiveSection('charts')}
              />
              <SectionTab
                icon={Settings}
                label="Preferences"
                isActive={activeSection === 'scheduling'}
                onClick={() => setActiveSection('scheduling')}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {!isPremium ? (
            <PremiumUpsell onUpgrade={() => setShowUpgradeModal(true)} />
          ) : hasCorrelations ? (
            <>
              {activeSection === 'correlations' && (
                <motion.div
                  key="correlations"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <MultipleCorrelationsView
                    habits={habitsForCorrelations}
                    habitDays={habitDaysForCorrelations}
                    trades={trades}
                  />
                </motion.div>
              )}
              
              {activeSection === 'charts' && (
                <motion.div
                  key="charts"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <CorrelationChartsView
                    habits={habitsForCorrelations}
                    habitDays={habitDaysForCorrelations}
                    trades={trades}
                  />
                </motion.div>
              )}
              
              {activeSection === 'scheduling' && (
                <motion.div
                  key="scheduling"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <InsightSchedulingView />
                </motion.div>
              )}
            </>
          ) : (
            <NoDataState />
          )}
        </div>
      </div>
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="Trading Intelligence Suite"
      />
    </div>
  );
};

// Section Tab Component
const SectionTab: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors',
        isActive
          ? 'border-primary text-foreground'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </button>
  );
};

// Premium Upsell Component
const PremiumUpsell: React.FC<{ onUpgrade: () => void }> = ({ onUpgrade }) => {
  const features = [
    {
      icon: History,
      title: 'Insight History',
      description: 'Never miss a discovery. Access all your past daily insights with search and filters.',
    },
    {
      icon: TrendingUp,
      title: 'Multiple Correlations',
      description: 'See your top 3 habit-performance connections, not just the strongest one.',
    },
    {
      icon: BarChart3,
      title: 'Correlation Charts',
      description: 'Visualize how your habits impact trading with beautiful interactive graphs.',
    },
    {
      icon: Settings,
      title: 'Insight Scheduling',
      description: 'Prioritize which insights you see first. Full personalization control.',
    },
    {
      icon: FlaskConical,
      title: 'Habit Experiments',
      description: 'A/B test your habits with structured experiments and statistical analysis.',
    },
  ];
  
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-3xl flex items-center justify-center mb-6">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Unlock Your Trading Intelligence</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover what makes you trade better with AI-powered habit correlation, 
          beautiful visualizations, and scientific experimentation.
        </p>
        <button
          onClick={onUpgrade}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-purple-600 text-white text-lg rounded-xl font-semibold hover:opacity-90 transition-opacity mt-4"
        >
          <Crown className="w-6 h-6" />
          Upgrade to Premium - $29/mo
        </button>
      </div>
      
      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <feature.icon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </motion.div>
        ))}
      </div>
      
      {/* Social Proof */}
      <div className="p-6 bg-primary/10 border border-primary/20 rounded-xl text-center">
        <p className="text-sm text-muted-foreground mb-2">
          Trusted by serious traders
        </p>
        <p className="text-lg font-semibold">
          "The habit correlation feature is mind-blowing. I never knew going to the gym 
          improved my win rate by 18%!"
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          - Premium User
        </p>
      </div>
      
      {/* Bottom CTA */}
      <div className="text-center py-8">
        <button
          onClick={onUpgrade}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-purple-600 text-white text-lg rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          <Crown className="w-6 h-6" />
          Start Free Trial - 7 Days Free
        </button>
        <p className="text-sm text-muted-foreground mt-3">
          No credit card required • Cancel anytime
        </p>
      </div>
    </div>
  );
};

// No Data State (for premium users with no correlations yet)
const NoDataState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
        <Sparkles className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-2xl font-bold mb-2">Building Your Intelligence</h3>
      <p className="text-muted-foreground max-w-md mb-6">
        Keep tracking your habits and trades. Once you have enough data (10+ habit completions and 30+ trades), 
        we'll start discovering powerful correlations.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl w-full">
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="text-2xl font-bold text-primary mb-1">10+</div>
          <div className="text-sm text-muted-foreground">Habit completions needed</div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="text-2xl font-bold text-primary mb-1">30+</div>
          <div className="text-sm text-muted-foreground">Trades needed</div>
        </div>
        <div className="p-4 bg-card border border-border rounded-xl">
          <div className="text-2xl font-bold text-primary mb-1">2-3</div>
          <div className="text-sm text-muted-foreground">Weeks of data</div>
        </div>
      </div>
    </div>
  );
};

export default PremiumInsightsShowcase;

