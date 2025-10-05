/**
 * Trading Health View
 * Apple's flagship trading performance system
 * WWDC-worthy presentation of 3-ring health score
 */

import React, { useState, useMemo } from 'react';
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
import { calculateTradingHealth } from '@/lib/tradingHealth/metricsEngine';
import { HealthRings } from '@/components/tradingHealth/HealthRings';
import { TradingHealthOnboarding } from '@/components/tradingHealth/TradingHealthOnboarding';
import { TradingHealthDocs } from '@/components/tradingHealth/TradingHealthDocs';
import { RingDetailModal } from '@/components/tradingHealth/RingDetailModal';
import type { TimeWindow } from '@/lib/tradingHealth/types';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

export const TradingHealthView: React.FC = () => {
  const { trades } = useTradeStore();
  const { profile: userProfile } = useUserProfileStore();
  const { selectedAccountId, accounts } = useAccountFilterStore();

  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30d');
  const [selectedRing, setSelectedRing] = useState<'edge' | 'consistency' | 'riskControl' | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  
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
            Your complete trading performance in three rings. Close all three to build a consistently profitable edge.
          </p>

          {/* Time Window Toggle */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {(['7d', '30d', '90d'] as TimeWindow[]).map((window) => (
              <button
                key={window}
                onClick={() => setTimeWindow(window)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  timeWindow === window
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-card hover:bg-muted text-muted-foreground'
                )}
              >
                {window === '7d' && '7 Days'}
                {window === '30d' && '30 Days'}
                {window === '90d' && '90 Days'}
              </button>
            ))}
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
            onExpand={() => setSelectedRing('edge')}
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
            onExpand={() => setSelectedRing('consistency')}
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
            onExpand={() => setSelectedRing('riskControl')}
          />
        </div>
        )}

        {/* Streak Achievements - Only show if has trades */}
        {hasTrades && metrics.consistency.currentStreak >= 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-3xl p-6 sm:p-8"
          >
            <div className="flex items-center gap-4">
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
          </motion.div>
        )}

        {/* Rule Breakdown - Only show if has trades */}
        {hasTrades && (
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
        )}
      </div>

      {/* Ring Detail Modal */}
      {selectedRing && (
        <RingDetailModal
          isOpen={!!selectedRing}
          onClose={() => setSelectedRing(null)}
          ringType={selectedRing}
          metrics={metrics}
          timeWindow={timeWindow}
        />
      )}
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
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-muted-foreground">/ {goal}</span>
        {getTrendIcon(trend)}
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

export default TradingHealthView;
