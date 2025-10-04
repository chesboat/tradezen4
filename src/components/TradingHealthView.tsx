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
import { calculateTradingHealth } from '@/lib/tradingHealth/metricsEngine';
import { HealthRings } from '@/components/tradingHealth/HealthRings';
import { TradingHealthOnboarding } from '@/components/tradingHealth/TradingHealthOnboarding';
import { TradingHealthDocs } from '@/components/tradingHealth/TradingHealthDocs';
import type { TimeWindow } from '@/lib/tradingHealth/types';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

export const TradingHealthView: React.FC = () => {
  const { trades } = useTradeStore();
  const { userProfile } = useUserProfileStore();

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

  // Debug: Log trades data
  React.useEffect(() => {
    console.log('[Trading Health] Trades loaded:', trades.length);
    if (trades.length > 0) {
      console.log('[Trading Health] Sample trade:', trades[0]);
    }
  }, [trades]);

  // Calculate metrics
  const metrics = useMemo(() => {
    console.log('[Trading Health] Calculating metrics for', trades.length, 'trades in', timeWindow, 'window');
    const result = calculateTradingHealth(trades, timeWindow);
    console.log('[Trading Health] Metrics calculated:', result);
    return result;
  }, [trades, timeWindow]);

  // Check if user has any trades
  const hasTrades = trades.length > 0;

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
                  Start Trading to See Your Health
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your Trading Health rings will appear here once you log your first trades. 
                  The system tracks your Edge, Consistency, and Risk Control automatically.
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
            <HealthRings
              metrics={metrics}
              size="large"
              showLabels={true}
              onRingClick={(ring) => setSelectedRing(ring)}
            />

            {/* Overall Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-8 flex items-center justify-center gap-3"
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
