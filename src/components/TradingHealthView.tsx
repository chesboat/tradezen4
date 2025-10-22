/**
 * Trading Health View
 * Apple's flagship trading performance system
 * WWDC-worthy presentation of 3-ring health score
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Target,
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  Calendar,
  Award,
  Flame,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useSubscription } from '@/hooks/useSubscription';
import { calculateTradingHealth } from '@/lib/tradingHealth/metricsEngine';
import { detectTradingHealthEvents, checkDailySummarySchedule } from '@/lib/tradingHealthEventDetector';
import { HealthRings } from '@/components/tradingHealth/HealthRings';
import { TradingHealthOnboarding } from '@/components/tradingHealth/TradingHealthOnboarding';
import { TradingHealthDocs } from '@/components/tradingHealth/TradingHealthDocs';
import { RingDetailModal } from '@/components/tradingHealth/RingDetailModal';
import { UpgradeModal } from '@/components/UpgradeModal';
import type { TimeWindow } from '@/lib/tradingHealth/types';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

// Load debug utilities in development
if (import.meta.env.DEV) {
  import('@/lib/tradingHealth/debugUtils');
}

export const TradingHealthView: React.FC = () => {
  const { trades } = useTradeStore();
  const { profile: userProfile } = useUserProfileStore();
  const { selectedAccountId, accounts } = useAccountFilterStore();
  const { isPremium } = useSubscription();

  // Basic users get 7-day window, Premium gets 30/90-day
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(isPremium ? '30d' : '7d');
  const [selectedRing, setSelectedRing] = useState<'edge' | 'consistency' | 'riskControl' | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string>('');
  
  // Check if user has seen onboarding
  const [showOnboarding, setShowOnboarding] = useState(() => {
    const hasSeenOnboarding = localStorage.getItem('trading_health_onboarding_seen');
    return !hasSeenOnboarding;
  });

  const handleOnboardingComplete = () => {
    localStorage.setItem('trading_health_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  // Get selected account details
  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return accounts.find(a => a.id === selectedAccountId);
  }, [selectedAccountId, accounts]);

  // Filter trades based on account selection
  // Apple-style: Smart filtering based on account type
  const filteredTrades = useMemo(() => {
    // If "All Accounts" or no selection, show all trades
    if (!selectedAccountId) {
      return trades;
    }

    // Check if selected account is a group
    const isGroup = selectedAccount?.isGroup;

    if (isGroup) {
      // For groups: include all accounts in the group
      const groupAccounts = accounts.filter(a => a.groupId === selectedAccountId);
      const groupAccountIds = new Set(groupAccounts.map(a => a.id));
      return trades.filter(t => groupAccountIds.has(t.accountId));
    } else {
      // For individual accounts: filter by accountId
      return trades.filter(t => t.accountId === selectedAccountId);
    }
  }, [trades, selectedAccountId, selectedAccount, accounts]);

  // Debug: Log trades data
  React.useEffect(() => {
    console.log('[Trading Health] Account Filter:', selectedAccountId || 'All Accounts');
    if (selectedAccount) {
      console.log('[Trading Health] Selected Account:', selectedAccount.name, 'isGroup:', selectedAccount.isGroup);
    }
    console.log('[Trading Health] Total trades:', trades.length);
    console.log('[Trading Health] Filtered trades:', filteredTrades.length);
    if (filteredTrades.length > 0) {
      const sample = filteredTrades[0];
      console.log('[Trading Health] Sample trade:', sample);
      console.log('[Trading Health] Trade fields check:', {
        hasPnl: 'pnl' in sample,
        hasResult: 'result' in sample,
        hasRiskAmount: 'riskAmount' in sample,
        hasRrRatio: 'rrRatio' in sample,
        hasRiskRewardRatio: 'riskRewardRatio' in sample,
        hasAccountBalance: 'accountBalance' in sample,
        hasTags: 'tags' in sample && sample.tags?.length > 0,
        hasNotes: 'notes' in sample && (sample.notes?.length || 0) >= 10,
        pnlValue: sample.pnl,
        resultValue: sample.result,
        tagsCount: sample.tags?.length || 0,
        notesLength: sample.notes?.length || 0
      });
    }
  }, [trades, filteredTrades, selectedAccountId, selectedAccount]);

  // Calculate metrics using filtered trades
  const metrics = useMemo(() => {
    console.log('[Trading Health] Calculating metrics for', filteredTrades.length, 'trades in', timeWindow, 'window');
    // Pass account balance for accurate risk calculations
    const accountBalance = selectedAccount && !selectedAccount.isGroup ? selectedAccount.balance : undefined;
    const result = calculateTradingHealth(filteredTrades, timeWindow, accountBalance);
    console.log('[Trading Health] Metrics calculated:', result);
    console.log('[Trading Health] Edge Ring:', {
      value: result.edge.value,
      expectancy: result.edge.expectancy,
      winRate: result.edge.winRate,
      profitFactor: result.edge.profitFactor
    });
    console.log('[Trading Health] Consistency Ring:', {
      value: result.consistency.value,
      rulesFollowed: result.consistency.rulesFollowed,
      totalRules: result.consistency.totalRules,
      currentStreak: result.consistency.currentStreak
    });
    console.log('[Trading Health] Risk Control Ring:', {
      value: result.riskControl.value,
      currentDrawdown: result.riskControl.currentDrawdown,
      peakEquity: result.riskControl.peakEquity,
      maxConsecutiveLosses: result.riskControl.maxConsecutiveLosses
    });
    return result;
  }, [filteredTrades, timeWindow]);

  // Check if user has any trades (in current filter)
  const hasTrades = filteredTrades.length > 0;

  // Auto-detect and log Trading Health events (Apple-style: intelligent, not noisy)
  useEffect(() => {
    if (!hasTrades || !userProfile?.id) return;

    // Only detect events when on 30d window (to avoid duplicate events on window changes)
    if (timeWindow === '30d') {
      // Detect significant changes (ring scores, streaks, warnings)
      detectTradingHealthEvents(metrics, userProfile.id);
      
      // Check if we should generate a daily summary
      checkDailySummarySchedule(metrics, userProfile.id);
    }
  }, [metrics, userProfile?.id, timeWindow, hasTrades]);

  const overallScore = Math.round(
    (metrics.edge.value + metrics.consistency.value + metrics.riskControl.value) / 3
  );

  // Determine overall status
  const getOverallStatus = () => {
    if (overallScore >= 80) return { text: 'Excellent', color: 'text-green-500', bg: 'bg-green-500/10' };
    if (overallScore >= 60) return { text: 'Good', color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (overallScore >= 40) return { text: 'Needs Work', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
    return { text: 'Critical', color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  const status = getOverallStatus();

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <>
      {/* Onboarding Modal */}
      <TradingHealthOnboarding
        isOpen={showOnboarding}
        onClose={handleOnboardingComplete}
        onComplete={handleOnboardingComplete}
      />

      {/* Help Documentation Modal */}
      <TradingHealthDocs
        isOpen={showDocs}
        onClose={() => setShowDocs(false)}
      />

      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              Trading Health
            </h1>
            <button
              onClick={() => setShowDocs(true)}
              className="ml-2 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-primary"
              aria-label="Open help documentation"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          
          {/* Account context indicator */}
          {selectedAccount && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <span>Viewing:</span>
              <span className="font-semibold text-foreground">{selectedAccount.name}</span>
              {selectedAccount.isGroup && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                  Group
                </span>
              )}
            </motion.div>
          )}
          
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {isPremium 
              ? '30-day performance tracker. Watch your Edge, Consistency, and Risk Control improve over time.'
              : '7-day performance snapshot. Upgrade for 30/90-day trends and advanced insights.'}
          </p>

          {/* Time Window Toggle */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {(['7d', '30d', '90d'] as TimeWindow[]).map((window) => {
              const isLocked = !isPremium && (window === '30d' || window === '90d');
              
              return (
                <button
                  key={window}
                  onClick={() => {
                    if (isLocked) {
                      setUpgradeFeature(`${window === '30d' ? '30' : '90'}-Day Trends`);
                      setShowUpgradeModal(true);
                    } else {
                      setTimeWindow(window);
                    }
                  }}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all relative',
                    isLocked && 'opacity-70',
                    timeWindow === window
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-card hover:bg-muted text-muted-foreground'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {window === '7d' && '7 Days'}
                    {window === '30d' && '30 Days'}
                    {window === '90d' && '90 Days'}
                    {isLocked && (
                      <Sparkles className="w-3 h-3" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Empty State or Rings Visualization */}
        {!hasTrades ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-8 sm:p-12 text-center"
          >
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-24 h-24 mx-auto bg-primary/10 rounded-3xl flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-foreground">
                  {selectedAccount 
                    ? `No Trades for ${selectedAccount.name}` 
                    : 'Start Trading to See Your Health'}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedAccount
                    ? `Log trades for ${selectedAccount.name} to see your Trading Health rings. The system tracks your Edge, Consistency, and Risk Control automatically.`
                    : 'Your Trading Health rings will appear here once you log your first trades. The system tracks your Edge, Consistency, and Risk Control automatically.'}
                </p>
              </div>

              <div className="bg-muted/30 rounded-xl p-4 text-sm text-muted-foreground text-left space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Log at least 5-10 trades to get meaningful scores</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>8 universal rules are checked automatically</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>30-day rolling window keeps your scores current</span>
                </div>
              </div>

              <button
                onClick={() => setShowDocs(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
                Learn How Trading Health Works
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 backdrop-blur-sm border border-border rounded-3xl p-6 sm:p-8"
          >
            <div className="flex flex-col items-center gap-6">
              {/* Pure Rings */}
              <HealthRings
                metrics={metrics}
                size="large"
                showLabels={true}
                onRingClick={(ring) => setSelectedRing(ring)}
              />

              {/* Overall Score - Below Rings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col items-center gap-2"
              >
                <div className="text-6xl sm:text-7xl font-bold text-foreground">
                  {overallScore}
                </div>
                <div className="text-sm text-muted-foreground">
                  Overall Health Score
                </div>
              </motion.div>

              {/* Status Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="flex items-center justify-center gap-3"
              >
                <div className={cn('px-4 py-2 rounded-full text-sm font-semibold', status.bg, status.color)}>
                  {status.text}
                </div>
                {metrics.edge.trend !== 'stable' && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    {getTrendIcon(metrics.edge.trend)}
                  <span>Overall trending {metrics.edge.trend}</span>
                </div>
              )}
            </motion.div>
            </div>
          </motion.div>
        )}

        {/* Detailed Breakdown - Only show if has trades */}
        {hasTrades && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Edge Ring Details */}
          <RingDetailCard
            title="💰 Edge"
            description="Your profit potential per trade"
            score={metrics.edge.value}
            goal={metrics.edge.goal}
            trend={metrics.edge.trend}
            color="#FF375F"
            metrics={[
              { label: 'Expectancy', value: formatCurrency(metrics.edge.expectancy) },
              { label: 'Win Rate', value: `${metrics.edge.winRate.toFixed(1)}%` },
              { label: 'Profit Factor', value: metrics.edge.profitFactor.toFixed(2) },
            ]}
            isPremium={isPremium}
            onExpand={() => {
              if (isPremium) {
                setSelectedRing('edge');
              } else {
                setUpgradeFeature('Detailed Edge Analysis');
                setShowUpgradeModal(true);
              }
            }}
          />

          {/* Consistency Ring Details */}
          <RingDetailCard
            title="🎯 Consistency"
            description="Following your process"
            score={metrics.consistency.value}
            goal={metrics.consistency.goal}
            trend={metrics.consistency.trend}
            color="#7AFF45"
            metrics={[
              { label: 'Rules Followed', value: `${metrics.consistency.rulesFollowed}/${metrics.consistency.totalRules}` },
              { label: 'Current Streak', value: `${metrics.consistency.currentStreak} days` },
              { label: 'Longest Streak', value: `${metrics.consistency.longestStreak} days` },
            ]}
            isPremium={isPremium}
            onExpand={() => {
              if (isPremium) {
                setSelectedRing('consistency');
              } else {
                setUpgradeFeature('Detailed Rule Breakdown');
                setShowUpgradeModal(true);
              }
            }}
          />

          {/* Risk Control Ring Details */}
          <RingDetailCard
            title="⚠️ Risk Control"
            description="Protecting your capital"
            score={metrics.riskControl.value}
            goal={metrics.riskControl.goal}
            trend={metrics.riskControl.trend}
            color="#0AFFFE"
            metrics={[
              { label: 'Max Drawdown', value: `${metrics.riskControl.currentDrawdown.toFixed(1)}%` },
              { label: 'Avg Risk/Trade', value: `${metrics.riskControl.avgRisk.toFixed(1)}%` },
              { label: 'Max Losing Streak', value: `${metrics.riskControl.maxConsecutiveLosses} trades` },
            ]}
            isPremium={isPremium}
            onExpand={() => {
              if (isPremium) {
                setSelectedRing('riskControl');
              } else {
                setUpgradeFeature('Detailed Risk Analysis');
                setShowUpgradeModal(true);
              }
            }}
          />
        </div>
        )}

        {/* For You - Contextual suggestions (Premium feature) */}
        {hasTrades && isPremium && (
          <ForYouCard metrics={metrics} timeWindow={timeWindow} />
        )}

        {/* Streak Achievements - Show for all, but simplified for Basic */}
        {hasTrades && metrics.consistency.currentStreak >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-3xl p-6 sm:p-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
                <Flame className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground mb-1">
                  🔥 {metrics.consistency.currentStreak}-Day Streak!
                </h3>
                <p className="text-sm text-muted-foreground">
                  You're following your rules consistently. Keep it up!
                </p>
              </div>
            </div>
            
            {/* Milestone Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Next Milestones:</span>
                <span className="text-foreground font-medium">Longest: {metrics.consistency.longestStreak} days</span>
              </div>
              <div className="flex items-center gap-3">
                {[7, 14, 30, 60, 100].map((milestone) => {
                  const isComplete = metrics.consistency.currentStreak >= milestone;
                  const isCurrent = metrics.consistency.currentStreak < milestone && 
                                   (milestone === 7 || metrics.consistency.currentStreak >= [7, 14, 30, 60][
                                     [7, 14, 30, 60, 100].indexOf(milestone) - 1
                                   ]);
                  
                  return (
                    <div key={milestone} className="flex-1 flex flex-col items-center gap-1">
                      <div className={cn(
                        "w-full h-2 rounded-full transition-all",
                        isComplete ? "bg-gradient-to-r from-yellow-500 to-orange-500" : "bg-muted"
                      )} />
                      <span className={cn(
                        "text-xs font-medium transition-colors",
                        isComplete ? "text-yellow-500" : isCurrent ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {isComplete ? "✓" : milestone}
                        {isCurrent && " 🎯"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {metrics.consistency.currentStreak < 7 && "Next: 7 days 🏆"}
                {metrics.consistency.currentStreak >= 7 && metrics.consistency.currentStreak < 14 && "Next: 14 days 💪"}
                {metrics.consistency.currentStreak >= 14 && metrics.consistency.currentStreak < 30 && "Next: 30 days 🔥"}
                {metrics.consistency.currentStreak >= 30 && metrics.consistency.currentStreak < 60 && "Next: 60 days 🚀"}
                {metrics.consistency.currentStreak >= 60 && metrics.consistency.currentStreak < 100 && "Next: 100 days 👑"}
                {metrics.consistency.currentStreak >= 100 && "Legend Status! 🏆"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Rule Breakdown - Only show if has trades */}
        {hasTrades && (
          isPremium ? (
            // PREMIUM: Full rule breakdown
            <div className="bg-card border border-border rounded-3xl p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Target className="w-6 h-6 text-primary" />
                Universal Rules
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                8 automatic rules tracked on every trade. No setup required.
              </p>

              <div className="space-y-4">
                {metrics.consistency.ruleBreakdown.map((rule, index) => (
                  <motion.div
                    key={rule.rule}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'flex items-start gap-4 p-4 rounded-xl border transition-all',
                      rule.passed
                        ? 'bg-green-500/5 border-green-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    )}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {rule.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-foreground">
                          {rule.rule}
                        </h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                          {rule.category.replace('-', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {rule.description}
                      </p>
                      {!rule.passed && rule.improvementTip && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-500/10 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-foreground">
                            {rule.improvementTip}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            // BASIC: Simplified rule summary
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-card via-card to-primary/5 border border-border rounded-3xl p-6 sm:p-8 cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => {
                setUpgradeFeature('Full Rule Breakdown');
                setShowUpgradeModal(true);
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Universal Rules</h2>
                    <p className="text-sm text-muted-foreground">8 automatic rules tracked</p>
                  </div>
                </div>
                <Sparkles className="w-6 h-6 text-primary opacity-70" />
              </div>

              {/* Rule Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold text-green-500">{metrics.consistency.rulesFollowed}</span>
                    <span className="text-muted-foreground text-sm">/ {metrics.consistency.totalRules}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Rules Followed</p>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold text-primary">{Math.round((metrics.consistency.rulesFollowed / metrics.consistency.totalRules) * 100)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Adherence Rate</p>
                </div>
              </div>

              {/* Upgrade CTA */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-foreground">See which rules you're breaking</p>
                  <p className="text-xs text-muted-foreground">Get specific improvement tips for each rule</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </motion.div>
          )
        )}
      </div>

      {/* Ring Detail Modal */}
      {selectedRing && isPremium && (
        <RingDetailModal
          isOpen={!!selectedRing}
          onClose={() => setSelectedRing(null)}
          ringType={selectedRing}
          metrics={metrics}
          timeWindow={timeWindow}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
      />
    </div>
    </>
  );
};

// ==========================================
// Ring Detail Card Component
// ==========================================

interface RingDetailCardProps {
  title: string;
  description: string;
  score: number;
  goal: number;
  trend: 'improving' | 'stable' | 'declining';
  color: string;
  metrics: { label: string; value: string }[];
  isPremium: boolean;
  onExpand: () => void;
}

const RingDetailCard: React.FC<RingDetailCardProps> = ({
  title,
  description,
  score,
  goal,
  trend,
  color,
  metrics,
  isPremium,
  onExpand,
}) => {
  const percentage = Math.min((score / goal) * 100, 100);

  const getTrendIcon = (t: 'improving' | 'stable' | 'declining') => {
    switch (t) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-card border border-border rounded-2xl p-6 cursor-pointer group"
      onClick={onExpand}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {isPremium ? (
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        ) : (
          <Sparkles className="w-5 h-5 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-muted-foreground">/ {goal}</span>
        {getTrendIcon(trend)}
      </div>
      
      {/* Trend vs. Previous Period */}
      <div className="flex items-center gap-1.5 mb-4">
        <span className={cn(
          "text-xs font-medium",
          trend === 'improving' && "text-green-500",
          trend === 'declining' && "text-red-500",
          trend === 'stable' && "text-muted-foreground"
        )}>
          {trend === 'improving' && '↗ Improving'}
          {trend === 'declining' && '↘ Declining'}
          {trend === 'stable' && '→ Stable'}
        </span>
        <span className="text-xs text-muted-foreground">vs. previous period</span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: 0.3, duration: 1 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>

      {/* Metrics */}
      <div className="space-y-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{metric.label}</span>
            <span className="font-semibold text-foreground">{metric.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ==========================================
// FOR YOU CARD (Contextual Suggestions - Premium)
// ==========================================

interface ForYouCardProps {
  metrics: any;
  timeWindow: TimeWindow;
}

const ForYouCard: React.FC<ForYouCardProps> = ({ metrics, timeWindow }) => {
  // Generate contextual suggestions based on performance
  const suggestions = React.useMemo(() => {
    const tips: Array<{ title: string; description: string; icon: any; action?: string; priority: number }> = [];

    // Edge suggestions - Apple-style actionable guidance
    if (metrics.edge.expectancy < 0) {
      // Negative expectancy - immediate action needed
      tips.push({
        title: 'Stop Trading & Analyze',
        description: 'Your expectancy is negative. Review your last 20 trades in Notes. Tag losing patterns. Only trade A+ setups that match your winners.',
        icon: Target,
        priority: 10
      });
    } else if (metrics.edge.value < 40) {
      // Low edge score (but positive expectancy)
      tips.push({
        title: 'Study Your Best Setups',
        description: 'Use Setup Analytics to find your most profitable patterns. Focus on your top 2-3 setups. Backtest new ideas before trading them live.',
        icon: Target,
        priority: 9
      });
    } else if (metrics.edge.profitFactor < 1.5) {
      // Decent edge, but needs improvement
      tips.push({
        title: 'Let Winners Run Longer',
        description: `Your profit factor is ${metrics.edge.profitFactor.toFixed(2)}. Use trailing stops to capture bigger moves. Review your best trades and replicate their exit strategy.`,
        icon: TrendingUp,
        priority: 7
      });
    } else if (metrics.edge.winRate < 40) {
      // Low win rate (but could be valid for high R:R)
      tips.push({
        title: 'Refine Your Entry Timing',
        description: 'Your win rate is low. Use Notes to journal pre-trade plans. Wait for confirmation before entering. Tag trades by setup quality (A/B/C) to track accuracy.',
        icon: Target,
        priority: 7
      });
    }

    // Risk Control suggestions
    if (metrics.riskControl.currentDrawdown > 15) {
      tips.push({
        title: 'Reduce Position Size',
        description: `You're in a ${metrics.riskControl.currentDrawdown.toFixed(1)}% drawdown. Cut your size in half until you're back above 50% of peak.`,
        icon: Shield,
        priority: 9
      });
    } else if (metrics.riskControl.maxConsecutiveLosses >= 5) {
      tips.push({
        title: 'Take a Break After Losses',
        description: `You've had ${metrics.riskControl.maxConsecutiveLosses} consecutive losses. Set a rule: stop after 2-3 losses in a row.`,
        icon: AlertTriangle,
        priority: 8
      });
    }

    // Consistency suggestions
    const adherenceRate = (metrics.consistency.rulesFollowed / metrics.consistency.totalRules) * 100;
    if (adherenceRate < 70) {
      tips.push({
        title: 'Tighten Your Process',
        description: `You're following ${adherenceRate.toFixed(0)}% of your rules. Identify which rules you're breaking and focus on those.`,
        icon: Target,
        priority: 6
      });
    } else if (metrics.consistency.currentStreak < 3 && adherenceRate >= 70) {
      tips.push({
        title: 'Build a Streak',
        description: 'Follow 80%+ of your rules for 3 days straight to start building momentum.',
        icon: Flame,
        priority: 5
      });
    }

    // Trend-based suggestions
    if (metrics.edge.trend === 'declining') {
      tips.push({
        title: 'Your Edge is Declining',
        description: 'Review recent trades in Notes. Market conditions may have changed. Check Time Intelligence for performance shifts by hour/day.',
        icon: TrendingDown,
        priority: 8
      });
    }

    if (metrics.consistency.trend === 'declining') {
      tips.push({
        title: 'Discipline is Slipping',
        description: "You're following fewer rules than before. Review your last few trades for patterns. Mark important trades for deeper review.",
        icon: AlertTriangle,
        priority: 7
      });
    }

    // Advanced Edge optimization (for traders doing well)
    if (metrics.edge.value >= 60 && metrics.edge.value < 75 && metrics.edge.wins > 20) {
      tips.push({
        title: 'Optimize Your Best Setups',
        description: 'Your edge is solid. Use Experiment Mode to A/B test variations of your best setups. Document findings in Notes to refine your process.',
        icon: Target,
        priority: 6
      });
    }

    // Sample size warning
    if (metrics.edge.wins + metrics.edge.losses < 20) {
      tips.push({
        title: 'Build Your Sample Size',
        description: `You have ${metrics.edge.wins + metrics.edge.losses} trades. You need 30+ trades to get reliable Edge metrics. Focus on following your process consistently.`,
        icon: Info,
        priority: 4
      });
    }

    // Positive reinforcement
    if (metrics.edge.value >= 70 && metrics.consistency.value >= 70 && metrics.riskControl.value >= 70) {
      tips.push({
        title: 'All Rings Closed!',
        description: "Exceptional trading. Document your process in Notes to ensure it's repeatable. Consider teaching others what's working for you.",
        icon: Award,
        priority: 10
      });
    }

    // Sort by priority and return top 2
    return tips.sort((a, b) => b.priority - a.priority).slice(0, 2);
  }, [metrics]);

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20 rounded-3xl p-6 sm:p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">For You</h2>
      </div>

      <div className="space-y-4">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <motion.div
              key={suggestion.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4 p-4 bg-card/50 rounded-xl border border-border/50"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {suggestion.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {suggestion.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TradingHealthView;
