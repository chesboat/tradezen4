import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trade } from '@/types';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';
import { TrendingUp, Target, ArrowRight, Zap } from 'lucide-react';

interface PotentialRCardProps {
  trades: Trade[];
}

export const PotentialRAnalytics: React.FC<PotentialRCardProps> = ({ trades }) => {
  // Calculate potential R insights
  const analysis = useMemo(() => {
    // Only analyze winning trades with potentialR data
    const winsWithPotentialR = trades.filter(
      t => t.result === 'win' && t.potentialR && t.potentialR > 0
    );

    if (winsWithPotentialR.length === 0) {
      return null;
    }

    // Group by target R (riskRewardRatio)
    const targetGroups = new Map<number, { potentialRs: number[]; count: number; pnl: number[] }>();

    winsWithPotentialR.forEach(trade => {
      const targetR = trade.riskRewardRatio;
      const existing = targetGroups.get(targetR) || { potentialRs: [], count: 0, pnl: [] };
      existing.potentialRs.push(trade.potentialR!);
      existing.count++;
      existing.pnl.push(trade.pnl || 0);
      targetGroups.set(targetR, existing);
    });

    // Convert to array and sort by frequency
    const groups = Array.from(targetGroups.entries())
      .map(([targetR, data]) => ({
        targetR,
        avgPotentialR: data.potentialRs.reduce((a, b) => a + b, 0) / data.potentialRs.length,
        count: data.count,
        avgPnL: data.pnl.reduce((a, b) => a + b, 0) / data.pnl.length,
        gap: (data.potentialRs.reduce((a, b) => a + b, 0) / data.potentialRs.length) - targetR,
      }))
      .sort((a, b) => b.count - a.count);

    // Find most common target and its potential
    const mostCommonGroup = groups[0];
    
    // Calculate overall average gap across all targets
    const overallAvgGap = winsWithPotentialR.reduce((sum, t) => sum + ((t.potentialR || 0) - t.riskRewardRatio), 0) / winsWithPotentialR.length;

    // Generate AI insight
    let insight = '';
    let recommendedTarget = mostCommonGroup?.targetR;

    if (mostCommonGroup.gap > 0.5) {
      recommendedTarget = Math.round((mostCommonGroup.targetR + mostCommonGroup.avgPotentialR) / 2 * 10) / 10;
      insight = `Your ${mostCommonGroup.targetR}R targets typically run to ${mostCommonGroup.avgPotentialR.toFixed(2)}R. Consider targeting ${recommendedTarget}R instead for +${(((recommendedTarget * mostCommonGroup.avgPnL) / mostCommonGroup.targetR - mostCommonGroup.avgPnL) / Math.abs(mostCommonGroup.avgPnL) * 100).toFixed(0)}% more per win.`;
    } else if (mostCommonGroup.gap > 0.2) {
      recommendedTarget = mostCommonGroup.targetR + 0.25;
      insight = `Your ${mostCommonGroup.targetR}R targets are conservative. Price typically runs ${mostCommonGroup.gap.toFixed(2)}R further. Consider increasing to ${recommendedTarget}R.`;
    } else {
      insight = `Your targets are well-calibrated. Price runs ${mostCommonGroup.avgPotentialR.toFixed(2)}R on average vs. ${mostCommonGroup.targetR}R target.`;
    }

    return {
      groups,
      mostCommonGroup,
      winsAnalyzed: winsWithPotentialR.length,
      overallAvgGap,
      insight,
      recommendedTarget
    };
  }, [trades]);

  if (!analysis) {
    return (
      <motion.div
        className="bg-muted/30 rounded-lg p-6"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Potential R Analysis</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            Log potential R values on your winning trades to unlock AI-powered target insights.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            In the Trades page, open a winning trade and select "Add Potential R" from the menu.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-6 border border-blue-500/20"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Potential R Analysis</h3>
      </div>

      {/* Main Insight */}
      <div className="bg-card rounded-lg p-4 mb-6 border border-border">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-2">AI Insight</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {analysis.insight}
            </p>
          </div>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="space-y-3 mb-6">
        <p className="text-sm font-medium text-foreground mb-3">Target Performance</p>
        {analysis.groups.map((group, idx) => (
          <div key={`${group.targetR}`} className="bg-muted/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-blue-500 bg-blue-500/20 px-2 py-1 rounded">
                  {group.targetR.toFixed(2)}R target
                </span>
                <span className="text-xs text-muted-foreground">({group.count} wins)</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-foreground">
                  {group.avgPotentialR.toFixed(2)}R actual
                </div>
                <div className={cn(
                  'text-xs font-medium',
                  group.gap > 0 ? 'text-green-500' : 'text-muted-foreground'
                )}>
                  {group.gap > 0 ? '+' : ''}{group.gap.toFixed(2)}R gap
                </div>
              </div>
            </div>

            {/* Visual Gap Indicator */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-8">Target</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${(group.targetR / group.avgPotentialR) * 100}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-green-500/50"
                  style={{ left: `${(group.targetR / group.avgPotentialR) * 100}%` }}
                />
              </div>
              <span className="text-muted-foreground w-8 text-right">Actual</span>
            </div>
          </div>
        ))}
      </div>

      {/* Scenario Modeling */}
      <div className="bg-muted/20 rounded-lg p-4 border border-border/60">
        <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          If you targeted higher R
        </p>

        {analysis.recommendedTarget && analysis.recommendedTarget !== analysis.mostCommonGroup.targetR && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current ({analysis.mostCommonGroup.targetR.toFixed(2)}R):</span>
              <span className="font-medium">{formatCurrency(analysis.mostCommonGroup.avgPnL)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <ArrowRight className="w-4 h-4 text-primary" />
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="flex items-center justify-between text-sm bg-green-500/10 -mx-4 px-4 py-2 rounded">
              <span className="text-green-700 dark:text-green-400 font-medium">
                Target {analysis.recommendedTarget.toFixed(2)}R:
              </span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {formatCurrency(analysis.mostCommonGroup.avgPnL * (analysis.recommendedTarget / analysis.mostCommonGroup.targetR))}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on your historical win runs, targeting {analysis.recommendedTarget.toFixed(2)}R could increase avg win by{' '}
              <span className="font-medium text-green-600">
                +{((analysis.recommendedTarget / analysis.mostCommonGroup.targetR - 1) * 100).toFixed(0)}%
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="bg-muted/40 rounded p-2">
          <div className="text-sm font-semibold text-foreground">{analysis.winsAnalyzed}</div>
          <div className="text-xs text-muted-foreground">Wins tracked</div>
        </div>
        <div className="bg-muted/40 rounded p-2">
          <div className="text-sm font-semibold text-green-500">+{analysis.overallAvgGap.toFixed(2)}R</div>
          <div className="text-xs text-muted-foreground">Avg gap</div>
        </div>
        <div className="bg-muted/40 rounded p-2">
          <div className="text-sm font-semibold text-foreground">{analysis.groups.length}</div>
          <div className="text-xs text-muted-foreground">Target sizes</div>
        </div>
      </div>
    </motion.div>
  );
};

