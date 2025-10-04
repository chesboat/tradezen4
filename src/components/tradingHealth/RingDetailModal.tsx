import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Info,
  Target,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import type { TradingHealthMetrics } from '@/lib/tradingHealth/types';
import { formatCurrency } from '@/lib/subscription';
import { cn } from '@/lib/utils';

interface RingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ringType: 'edge' | 'consistency' | 'riskControl';
  metrics: TradingHealthMetrics;
  timeWindow: '7d' | '30d' | '90d';
}

export const RingDetailModal: React.FC<RingDetailModalProps> = ({
  isOpen,
  onClose,
  ringType,
  metrics,
  timeWindow,
}) => {
  const getRingData = () => {
    switch (ringType) {
      case 'edge':
        return {
          title: '💰 Edge',
          subtitle: 'Your profit potential per trade',
          color: '#FF375F',
          score: metrics.edge.value,
          goal: metrics.edge.goal,
          trend: metrics.edge.trend,
          data: metrics.edge,
        };
      case 'consistency':
        return {
          title: '🎯 Consistency',
          subtitle: 'Following your process',
          color: '#7AFF45',
          score: metrics.consistency.value,
          goal: metrics.consistency.goal,
          trend: metrics.consistency.trend,
          data: metrics.consistency,
        };
      case 'riskControl':
        return {
          title: '⚠️ Risk Control',
          subtitle: 'Protecting your capital',
          color: '#0AFFFE',
          score: metrics.riskControl.value,
          goal: metrics.riskControl.goal,
          trend: metrics.riskControl.trend,
          data: metrics.riskControl,
        };
    }
  };

  const ringData = getRingData();
  const percentage = Math.min((ringData.score / ringData.goal) * 100, 100);

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

  const getTrendLabel = (t: 'improving' | 'stable' | 'declining') => {
    switch (t) {
      case 'improving':
        return 'Improving';
      case 'declining':
        return 'Declining';
      default:
        return 'Stable';
    }
  };

  const getScoreColor = (score: number, goal: number) => {
    const pct = (score / goal) * 100;
    if (pct >= 80) return 'text-green-500';
    if (pct >= 60) return 'text-blue-500';
    if (pct >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number, goal: number) => {
    const pct = (score / goal) * 100;
    if (pct >= 80) return 'Excellent';
    if (pct >= 60) return 'Good';
    if (pct >= 40) return 'Needs Work';
    return 'Critical';
  };

  const getTimeWindowLabel = () => {
    switch (timeWindow) {
      case '7d':
        return '7-Day';
      case '30d':
        return '30-Day';
      case '90d':
        return '90-Day';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 md:inset-0 z-[201] flex items-end md:items-center justify-center p-0 md:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-card w-full max-w-2xl max-h-[90vh] md:max-h-[85vh] rounded-t-3xl md:rounded-3xl border border-border overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex-shrink-0 px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold text-foreground">{ringData.title}</h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">{ringData.subtitle}</p>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {/* Score Overview */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-baseline gap-3">
                      <span className={cn('text-5xl font-bold', getScoreColor(ringData.score, ringData.goal))}>
                        {ringData.score}
                      </span>
                      <span className="text-2xl text-muted-foreground">/ {ringData.goal}</span>
                      <div className="flex items-center gap-1.5 ml-2">
                        {getTrendIcon(ringData.trend)}
                        <span className="text-sm text-muted-foreground">{getTrendLabel(ringData.trend)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn('text-lg font-bold', getScoreColor(ringData.score, ringData.goal))}>
                        {getScoreLabel(ringData.score, ringData.goal)}
                      </div>
                      <div className="text-xs text-muted-foreground">{getTimeWindowLabel()} Window</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.2, duration: 0.8 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: ringData.color }}
                    />
                  </div>
                </div>

                {/* Ring-Specific Content */}
                {ringType === 'edge' && <EdgeDetails data={ringData.data} />}
                {ringType === 'consistency' && <ConsistencyDetails data={ringData.data} />}
                {ringType === 'riskControl' && <RiskControlDetails data={ringData.data} />}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Edge Details Component
const EdgeDetails: React.FC<{ data: any }> = ({ data }) => {
  const avgWin = data.totalWinningPnl / data.wins || 0;
  const avgLoss = Math.abs(data.totalLosingPnl / data.losses) || 0;

  return (
    <div className="space-y-6">
      {/* Current Performance */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
          <Target className="w-5 h-5" />
          Current Performance
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard label="Expectancy" value={formatCurrency(data.expectancy)} />
          <MetricCard label="Win Rate" value={`${data.winRate.toFixed(1)}%`} />
          <MetricCard label="Profit Factor" value={data.profitFactor.toFixed(2)} />
          <MetricCard label="Total Trades" value={data.wins + data.losses} />
          <MetricCard label="Avg Win" value={formatCurrency(avgWin)} />
          <MetricCard label="Avg Loss" value={formatCurrency(avgLoss)} />
        </div>
      </section>

      {/* How It's Calculated */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
          <Info className="w-5 h-5" />
          How Edge is Calculated
        </h3>
        <div className="bg-muted/30 rounded-xl p-4 space-y-3 text-sm">
          <div>
            <div className="font-semibold text-foreground mb-1">Edge Score Formula:</div>
            <div className="text-muted-foreground">
              Based on your expectancy (profit per trade) and profit factor, scored 0-80.
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <div className="font-semibold text-foreground mb-1">Expectancy:</div>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              (Win Rate × Avg Win) - (Loss Rate × Avg Loss)
            </code>
            <div className="text-muted-foreground mt-1">
              = ({data.winRate.toFixed(1)}% × {formatCurrency(avgWin)}) - ({(100 - data.winRate).toFixed(1)}% × {formatCurrency(avgLoss)})
            </div>
            <div className="text-primary font-semibold mt-1">
              = {formatCurrency(data.expectancy)} per trade
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <div className="font-semibold text-foreground mb-1">Profit Factor:</div>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              Total Wins ÷ Total Losses
            </code>
            <div className="text-muted-foreground mt-1">
              = {formatCurrency(data.totalWinningPnl)} ÷ {formatCurrency(Math.abs(data.totalLosingPnl))}
            </div>
            <div className="text-primary font-semibold mt-1">
              = {data.profitFactor.toFixed(2)}x
            </div>
          </div>
        </div>
      </section>

      {/* How to Improve */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
          <Lightbulb className="w-5 h-5" />
          How to Improve
        </h3>
        <div className="space-y-3">
          {data.expectancy < 0 && (
            <ImprovementTip
              type="critical"
              text="Negative expectancy means you're losing money per trade. Review your strategy immediately."
            />
          )}
          {data.winRate < 40 && (
            <ImprovementTip
              type="warning"
              text="Win rate is low. Focus on higher-probability setups and reduce trade frequency."
            />
          )}
          {data.profitFactor < 1.5 && (
            <ImprovementTip
              type="info"
              text="Let winners run longer and cut losers faster. Target 2:1 reward-to-risk minimum."
            />
          )}
          {avgWin > 0 && avgLoss > 0 && avgWin / avgLoss < 1.5 && (
            <ImprovementTip
              type="info"
              text="Your average win is too close to your average loss. Scale into winners and use trailing stops."
            />
          )}
          {data.expectancy > 0 && data.profitFactor > 1.5 && (
            <ImprovementTip
              type="success"
              text="You have a solid edge! Focus on consistency and position sizing to maximize returns."
            />
          )}
        </div>
      </section>
    </div>
  );
};

// Consistency Details Component
const ConsistencyDetails: React.FC<{ data: any }> = ({ data }) => {
  const passingRules = data.ruleResults?.filter((r: any) => r.passed) || [];
  const failingRules = data.ruleResults?.filter((r: any) => !r.passed) || [];

  return (
    <div className="space-y-6">
      {/* Rule Breakdown */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
          <Target className="w-5 h-5" />
          Rule Adherence: {data.rulesFollowed}/{data.totalRules}
        </h3>

        {/* Passing Rules */}
        {passingRules.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-semibold text-green-500 mb-2">✅ Passing Rules ({passingRules.length})</div>
            <div className="space-y-2">
              {passingRules.map((rule: any) => (
                <RuleItem key={rule.id} rule={rule} passing />
              ))}
            </div>
          </div>
        )}

        {/* Failing Rules */}
        {failingRules.length > 0 && (
          <div>
            <div className="text-sm font-semibold text-red-500 mb-2">❌ Failing Rules ({failingRules.length})</div>
            <div className="space-y-2">
              {failingRules.map((rule: any) => (
                <RuleItem key={rule.id} rule={rule} passing={false} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Streak Progress */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
          <Flame className="w-5 h-5" />
          Streak Progress
        </h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <MetricCard label="Current Streak" value={`${data.currentStreak} days`} />
          <MetricCard label="Longest Streak" value={`${data.longestStreak} days`} />
        </div>
        <div className="bg-muted/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">Next Milestone</span>
            <span className="text-sm text-muted-foreground">
              {data.currentStreak < 3 ? '3 days 🔥' : data.currentStreak < 7 ? '7 days ⭐' : '30 days 🏆'}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {data.currentStreak === 0
              ? 'Follow 80%+ of rules on your next trade to start a streak!'
              : `Keep it up! ${data.currentStreak < 3 ? 3 - data.currentStreak : data.currentStreak < 7 ? 7 - data.currentStreak : 30 - data.currentStreak} more days to unlock the next milestone.`}
          </div>
        </div>
      </section>

      {/* How It's Calculated */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
          <Info className="w-5 h-5" />
          How Consistency is Calculated
        </h3>
        <div className="bg-muted/30 rounded-xl p-4 space-y-3 text-sm">
          <div>
            <div className="font-semibold text-foreground mb-1">Consistency Score Formula:</div>
            <div className="text-muted-foreground">
              Your score is the percentage of rules you follow (0-80 scale). Following 80%+ of rules = 64+ score.
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <div className="font-semibold text-foreground mb-1">8 Universal Rules:</div>
            <ul className="text-muted-foreground space-y-1 ml-4">
              <li>• Set risk amount before entry</li>
              <li>• Maintain 1.5:1 minimum R:R ratio</li>
              <li>• Position size appropriate (&lt;2% account risk)</li>
              <li>• Add tags to categorize setups</li>
              <li>• Add notes with reasoning</li>
              <li>• Mark result after exit</li>
              <li>• No revenge trading (wait after losses)</li>
              <li>• Max 5 trades per day</li>
            </ul>
          </div>
          <div className="border-t border-border pt-3">
            <div className="font-semibold text-foreground mb-1">Streak System:</div>
            <div className="text-muted-foreground">
              Maintain 80%+ rule adherence daily to build a streak. Streaks reset if you drop below 80% for a day.
            </div>
          </div>
        </div>
      </section>

      {/* How to Improve */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
          <Lightbulb className="w-5 h-5" />
          Quick Wins
        </h3>
        <div className="space-y-3">
          {failingRules.length === 0 ? (
            <ImprovementTip
              type="success"
              text="Perfect! You're following all rules. Keep this up to build a long streak!"
            />
          ) : (
            <>
              {failingRules.some((r: any) => r.id === 'trade-notes-added') && (
                <ImprovementTip
                  type="info"
                  text='Add notes to every trade explaining your reasoning. Even "Clean breakout" counts!'
                />
              )}
              {failingRules.some((r: any) => r.id === 'position-size-consistent') && (
                <ImprovementTip
                  type="warning"
                  text="Track your account balance to verify position sizing stays under 2% risk per trade."
                />
              )}
              {failingRules.some((r: any) => r.id === 'no-overtrading') && (
                <ImprovementTip
                  type="warning"
                  text="You're taking too many trades per day. Quality over quantity - focus on A+ setups only."
                />
              )}
              {failingRules.some((r: any) => r.id === 'no-revenge-trading') && (
                <ImprovementTip
                  type="critical"
                  text="Wait at least 30 minutes after a loss before taking another trade. Revenge trading destroys accounts."
                />
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

// Risk Control Details Component
const RiskControlDetails: React.FC<{ data: any }> = ({ data }) => {
  return (
    <div className="space-y-6">
      {/* Current State */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
          <Target className="w-5 h-5" />
          Current State
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <MetricCard label="Current Drawdown" value={`${data.currentDrawdown.toFixed(1)}%`} />
          <MetricCard label="Peak Equity" value={formatCurrency(data.peakEquity)} />
          <MetricCard label="Avg Risk/Trade" value={`${data.avgRisk.toFixed(1)}%`} />
          <MetricCard label="Max Losing Streak" value={`${data.maxConsecutiveLosses} trades`} />
        </div>
      </section>

      {/* Risk Analysis */}
      {data.maxConsecutiveLosses > 5 && (
        <section>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-red-500 mb-1">High Losing Streak Detected</div>
                <div className="text-sm text-muted-foreground">
                  {data.maxConsecutiveLosses} consecutive losses is concerning. This suggests:
                </div>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4">
                  <li>• Revenge trading after losses</li>
                  <li>• Trading against the trend</li>
                  <li>• Strategy not working in current market conditions</li>
                  <li>• Overtrading low-probability setups</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It's Calculated */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
          <Info className="w-5 h-5" />
          How Risk Control is Calculated
        </h3>
        <div className="bg-muted/30 rounded-xl p-4 space-y-3 text-sm">
          <div>
            <div className="font-semibold text-foreground mb-1">Risk Control Score Formula:</div>
            <div className="text-muted-foreground">
              Based on your current drawdown from peak equity. Lower drawdown = higher score (0-80 scale).
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <div className="font-semibold text-foreground mb-1">Current Drawdown:</div>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              ((Peak Equity - Current Equity) / Peak Equity) × 100
            </code>
            <div className="text-muted-foreground mt-1">
              Your equity peaked at {formatCurrency(data.peakEquity)}
            </div>
            <div className="text-primary font-semibold mt-1">
              Current drawdown: {data.currentDrawdown.toFixed(1)}%
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <div className="font-semibold text-foreground mb-1">Scoring:</div>
            <ul className="text-muted-foreground space-y-1 ml-4">
              <li>• 0-5% drawdown = 80 (Excellent)</li>
              <li>• 5-10% drawdown = 60-80 (Good)</li>
              <li>• 10-20% drawdown = 40-60 (Needs Work)</li>
              <li>• 20%+ drawdown = 0-40 (Critical)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How to Improve */}
      <section>
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
          <Lightbulb className="w-5 h-5" />
          Recommended Actions
        </h3>
        <div className="space-y-3">
          {data.currentDrawdown > 20 && (
            <ImprovementTip
              type="critical"
              text="STOP TRADING. Your drawdown is critical. Take a break, review all losing trades, and identify the root cause before continuing."
            />
          )}
          {data.currentDrawdown > 10 && data.currentDrawdown <= 20 && (
            <ImprovementTip
              type="warning"
              text="Reduce position size by 50% until you recover to breakeven. Focus on high-probability setups only."
            />
          )}
          {data.maxConsecutiveLosses >= 3 && (
            <ImprovementTip
              type="warning"
              text="Implement a 'stop trading after 2 losses' rule. Take a break, analyze what went wrong, and come back fresh."
            />
          )}
          {data.avgRisk > 2 && (
            <ImprovementTip
              type="warning"
              text="Your position sizing is too aggressive. Risk no more than 1-2% of your account per trade."
            />
          )}
          {data.currentDrawdown <= 5 && (
            <ImprovementTip
              type="success"
              text="Excellent risk management! Your drawdown is minimal. Keep following your risk rules."
            />
          )}
        </div>
      </section>
    </div>
  );
};

// Helper Components
const MetricCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="bg-muted/30 rounded-lg p-3">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className="text-lg font-bold text-foreground">{value}</div>
  </div>
);

const RuleItem: React.FC<{ rule: any; passing: boolean }> = ({ rule, passing }) => (
  <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
    {passing ? (
      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
    )}
    <div className="flex-1 min-w-0">
      <div className="text-sm font-semibold text-foreground">{rule.name}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{rule.description}</div>
      {!passing && rule.reason && (
        <div className="text-xs text-red-400 mt-1">Why it failed: {rule.reason}</div>
      )}
    </div>
  </div>
);

const ImprovementTip: React.FC<{ type: 'success' | 'info' | 'warning' | 'critical'; text: string }> = ({
  type,
  text,
}) => {
  const styles = {
    success: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    critical: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
  };

  return (
    <div className={cn('border rounded-lg p-3 flex items-start gap-3', styles[type])}>
      <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
};
