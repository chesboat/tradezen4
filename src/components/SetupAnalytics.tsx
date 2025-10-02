/**
 * Setup/Tag Analytics - Premium Feature
 * Shows performance breakdown by trading setup/strategy tags
 * Apple-style: Clean, visual, actionable insights
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Hash, Target, Award, AlertCircle, Lock } from 'lucide-react';
import { Trade } from '@/types';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';
import { PremiumBadge } from './PremiumBadge';

interface SetupPerformance {
  tag: string;
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgPnL: number;
  avgWin: number;
  avgLoss: number;
  winLossRatio: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
}

interface SetupAnalyticsProps {
  trades: Trade[];
  isPremium: boolean;
  onUpgrade?: () => void;
}

export const SetupAnalytics: React.FC<SetupAnalyticsProps> = ({ trades, isPremium, onUpgrade }) => {
  // Calculate performance by tag
  const setupPerformance = useMemo(() => {
    const tagMap = new Map<string, Trade[]>();

    // Group trades by tags
    trades.forEach(trade => {
      if (trade.tags && trade.tags.length > 0) {
        trade.tags.forEach(tag => {
          if (!tagMap.has(tag)) {
            tagMap.set(tag, []);
          }
          tagMap.get(tag)!.push(trade);
        });
      }
    });

    // Calculate metrics for each tag
    const performance: SetupPerformance[] = [];

    tagMap.forEach((tagTrades, tag) => {
      const totalTrades = tagTrades.length;
      const wins = tagTrades.filter(t => (t.pnl || 0) > 0);
      const losses = tagTrades.filter(t => (t.pnl || 0) < 0);
      
      const winRate = (wins.length / totalTrades) * 100;
      const totalPnL = tagTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const avgPnL = totalPnL / totalTrades;
      
      const totalWinAmount = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const totalLossAmount = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));
      
      const avgWin = wins.length > 0 ? totalWinAmount / wins.length : 0;
      const avgLoss = losses.length > 0 ? totalLossAmount / losses.length : 0;
      const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin;
      const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : totalWinAmount;
      
      const bestTrade = Math.max(...tagTrades.map(t => t.pnl || 0));
      const worstTrade = Math.min(...tagTrades.map(t => t.pnl || 0));

      performance.push({
        tag,
        totalTrades,
        winRate,
        totalPnL,
        avgPnL,
        avgWin,
        avgLoss,
        winLossRatio,
        profitFactor,
        bestTrade,
        worstTrade,
      });
    });

    // Sort by total P&L (best to worst)
    return performance.sort((a, b) => b.totalPnL - a.totalPnL);
  }, [trades]);

  // Show locked state for non-premium users
  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden"
      >
        {/* Blurred preview */}
        <div className="absolute inset-0 backdrop-blur-sm bg-background/50 z-10 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Setup Analytics</h3>
            <p className="text-muted-foreground">
              Discover which trading setups work best for you. Track performance by strategy tags.
            </p>
            <button
              onClick={onUpgrade}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-semibold"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>

        {/* Preview content (blurred) */}
        <div className="space-y-4 opacity-30">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Setup Performance</h2>
            <PremiumBadge />
          </div>
          <div className="grid gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 bg-muted/50 rounded-xl h-24" />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // No tagged trades
  if (setupPerformance.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-8"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-2xl flex items-center justify-center">
            <Hash className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Setup Tags Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start tagging your trades with setup strategies like #breakout, #reversal, #momentum to see which ones work best!
          </p>
        </div>
      </motion.div>
    );
  }

  // Find best and worst setups
  const bestSetup = setupPerformance[0];
  const worstSetup = setupPerformance[setupPerformance.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Setup Performance
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Which trading setups work best for you
          </p>
        </div>
        <PremiumBadge variant="subtle" />
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Best Setup */}
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Best Setup</div>
              <div className="text-lg font-bold truncate">{bestSetup.tag}</div>
              <div className="text-sm text-muted-foreground">
                {bestSetup.totalTrades} trades • {formatCurrency(bestSetup.totalPnL)}
              </div>
            </div>
          </div>
        </div>

        {/* Worst Setup */}
        {worstSetup.totalPnL < 0 && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Needs Work</div>
                <div className="text-lg font-bold truncate">{worstSetup.tag}</div>
                <div className="text-sm text-muted-foreground">
                  {worstSetup.totalTrades} trades • {formatCurrency(worstSetup.totalPnL)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Setup List */}
      <div className="space-y-3">
        {setupPerformance.map((setup, index) => (
          <motion.div
            key={setup.tag}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 bg-muted/30 hover:bg-muted/50 rounded-xl transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              {/* Tag Name & Trade Count */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                  setup.totalPnL > 0 ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-red-500/20 text-red-600 dark:text-red-400"
                )}>
                  #{index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{setup.tag}</div>
                  <div className="text-xs text-muted-foreground">
                    {setup.totalTrades} {setup.totalTrades === 1 ? 'trade' : 'trades'}
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-6">
                {/* Win Rate */}
                <div className="text-right">
                  <div className="text-sm font-semibold">{setup.winRate.toFixed(0)}%</div>
                  <div className="text-[10px] text-muted-foreground">Win Rate</div>
                </div>

                {/* Avg P&L */}
                <div className="text-right">
                  <div className={cn(
                    "text-sm font-semibold",
                    setup.avgPnL > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {formatCurrency(setup.avgPnL)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Avg P&L</div>
                </div>

                {/* Total P&L */}
                <div className="text-right min-w-[80px]">
                  <div className={cn(
                    "text-lg font-bold flex items-center justify-end gap-1",
                    setup.totalPnL > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {setup.totalPnL > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {formatCurrency(setup.totalPnL)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Total P&L</div>
                </div>
              </div>
            </div>

            {/* Expandable Details (future enhancement) */}
            {/* Could add profit factor, win/loss ratio, best/worst trades here */}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SetupAnalytics;

