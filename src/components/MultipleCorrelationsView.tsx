/**
 * Multiple Habit Correlations View - Premium Feature
 * Shows top 3 habit-performance connections
 * Apple-style: Expandable cards, beautiful insights
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sparkles, TrendingUp, TrendingDown, Activity, Lock, BarChart3 } from 'lucide-react';
import { findTopHabitCorrelations, type HabitCorrelation } from '@/lib/habitCorrelation';
import { useSubscription } from '@/hooks/useSubscription';
import { getFeatureUpgradeCTA } from '@/lib/tierLimits';
import { UpgradeModal } from './UpgradeModal';
import { cn } from '@/lib/utils';

interface MultipleCorrelationsViewProps {
  habits: Array<{ id: string; label: string; emoji: string }>;
  habitDays: Array<{ date: string; ruleId: string; completed: boolean }>;
  trades: any[];
}

const MultipleCorrelationsView: React.FC<MultipleCorrelationsViewProps> = ({
  habits,
  habitDays,
  trades,
}) => {
  const { isPremium } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0); // First one expanded by default
  
  // Calculate top 3 correlations
  const topCorrelations = useMemo(() => {
    return findTopHabitCorrelations(habits, habitDays, trades, 3);
  }, [habits, habitDays, trades]);
  
  if (topCorrelations.length === 0) {
    return null; // No correlations to show
  }
  
  // Premium gate
  if (!isPremium) {
    const upgradeCTA = getFeatureUpgradeCTA('hasMultipleCorrelations');
    const previewCorrelation = topCorrelations[0]; // Show first one as preview
    
    return (
      <div className="space-y-3">
        {/* Show first correlation (unlocked) */}
        <CorrelationCard
          correlation={previewCorrelation}
          index={0}
          isExpanded={true}
          onToggle={() => {}}
          isLocked={false}
        />
        
        {/* Show locked correlations 2 and 3 */}
        {topCorrelations.length > 1 && (
          <>
            <LockedCorrelationCard
              correlationNumber={2}
              onUpgrade={() => setShowUpgradeModal(true)}
            />
            {topCorrelations.length > 2 && (
              <LockedCorrelationCard
                correlationNumber={3}
                onUpgrade={() => setShowUpgradeModal(true)}
              />
            )}
          </>
        )}
        
        {/* Upgrade CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-1">{upgradeCTA.title}</h4>
              <p className="text-sm text-muted-foreground mb-3">{upgradeCTA.description}</p>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Upgrade to Premium
              </button>
            </div>
          </div>
        </motion.div>
        
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature={upgradeCTA.title}
        />
      </div>
    );
  }
  
  // Premium content - show all correlations
  return (
    <div className="space-y-3">
      {topCorrelations.map((correlation, index) => (
        <CorrelationCard
          key={correlation.habitId}
          correlation={correlation}
          index={index}
          isExpanded={expandedIndex === index}
          onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
          isLocked={false}
        />
      ))}
    </div>
  );
};

// Individual Correlation Card
interface CorrelationCardProps {
  correlation: HabitCorrelation;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  isLocked: boolean;
}

const CorrelationCard: React.FC<CorrelationCardProps> = ({
  correlation,
  index,
  isExpanded,
  onToggle,
  isLocked,
}) => {
  const getRankBadge = (rank: number) => {
    const badges = ['🥇', '🥈', '🥉'];
    return badges[rank] || '';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'border rounded-xl overflow-hidden transition-colors',
        isExpanded
          ? 'bg-card border-primary/50'
          : 'bg-card/50 border-border hover:border-primary/30'
      )}
    >
      {/* Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/50 transition-colors"
        disabled={isLocked}
      >
        {/* Rank & Emoji */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-2xl">{getRankBadge(index)}</span>
          <span className="text-3xl">{correlation.habitEmoji}</span>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1 truncate">
            {correlation.habitLabel}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {correlation.primaryInsight}
          </p>
        </div>
        
        {/* Stats Preview */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              +{correlation.winRateImprovement.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
          
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>
      
      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-3 pt-4">
                <MetricCard
                  icon={TrendingUp}
                  label="Win Rate"
                  value={`${correlation.withHabit.winRate.toFixed(0)}%`}
                  comparison={`vs ${correlation.withoutHabit.winRate.toFixed(0)}%`}
                  positive={correlation.winRateImprovement > 0}
                />
                <MetricCard
                  icon={Activity}
                  label="Avg P&L"
                  value={`$${correlation.withHabit.avgPnL.toFixed(0)}`}
                  comparison={`vs $${correlation.withoutHabit.avgPnL.toFixed(0)}`}
                  positive={correlation.avgPnLImprovement > 0}
                />
                <MetricCard
                  icon={BarChart3}
                  label="Confidence"
                  value={`${correlation.confidence}%`}
                  comparison={`${correlation.sampleSize} days`}
                  positive={true}
                />
              </div>
              
              {/* Secondary Insights */}
              {correlation.secondaryInsights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Additional Insights</h4>
                  <div className="space-y-1.5">
                    {correlation.secondaryInsights.map((insight, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Trade Sample Sizes */}
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">{correlation.withHabit.count}</span> trades on habit days
                </div>
                <div>
                  <span className="font-medium text-foreground">{correlation.withoutHabit.count}</span> trades on other days
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Metric Card Component
interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  comparison: string;
  positive: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, label, value, comparison, positive }) => {
  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={cn(
        'text-lg font-bold',
        positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      )}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{comparison}</div>
    </div>
  );
};

// Locked Correlation Card (Premium Teaser)
interface LockedCorrelationCardProps {
  correlationNumber: number;
  onUpgrade: () => void;
}

const LockedCorrelationCard: React.FC<LockedCorrelationCardProps> = ({
  correlationNumber,
  onUpgrade,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: correlationNumber * 0.1 }}
      className="relative"
    >
      {/* Blurred background */}
      <div className="blur-sm opacity-50 pointer-events-none">
        <div className="border border-border rounded-xl p-4 bg-card">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{correlationNumber === 2 ? '🥈' : '🥉'}</span>
              <span className="text-3xl">💪</span>
            </div>
            <div className="flex-1">
              <div className="h-5 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-full" />
            </div>
            <div className="text-right">
              <div className="h-6 bg-muted rounded w-16 mb-1" />
              <div className="h-3 bg-muted rounded w-12" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
        <button
          onClick={onUpgrade}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Lock className="w-4 h-4" />
          <span>Unlock with Premium</span>
        </button>
      </div>
    </motion.div>
  );
};

export default MultipleCorrelationsView;

