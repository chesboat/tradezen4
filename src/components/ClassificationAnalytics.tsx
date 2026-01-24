/**
 * Classification Analytics - Bento grid stats page
 * Shows performance breakdown by classification categories
 * Inspired by the Notion-style statistics layout
 */

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  Filter,
  Plus,
  Settings,
  ChevronRight
} from 'lucide-react';
import { Trade, ClassificationCategory } from '@/types';
import { useClassificationStore } from '@/store/useClassificationStore';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';
import { PremiumBadge } from './PremiumBadge';

interface ClassificationAnalyticsProps {
  trades: Trade[];
  isPremium?: boolean;
  onManageCategories?: () => void;
  className?: string;
}

interface OptionStats {
  optionId: string;
  optionName: string;
  emoji?: string;
  tradeCount: number;
  winRate: number;
  totalPnL: number;
  totalRR: number;
  avgPnL: number;
}

interface CategoryStats {
  category: ClassificationCategory;
  options: OptionStats[];
  totalTrades: number;
}

// Color palette for categories
const CATEGORY_COLORS = [
  { bg: 'bg-blue-500/10', border: 'border-blue-500/20', accent: 'bg-blue-500', text: 'text-blue-600' },
  { bg: 'bg-purple-500/10', border: 'border-purple-500/20', accent: 'bg-purple-500', text: 'text-purple-600' },
  { bg: 'bg-green-500/10', border: 'border-green-500/20', accent: 'bg-green-500', text: 'text-green-600' },
  { bg: 'bg-orange-500/10', border: 'border-orange-500/20', accent: 'bg-orange-500', text: 'text-orange-600' },
  { bg: 'bg-pink-500/10', border: 'border-pink-500/20', accent: 'bg-pink-500', text: 'text-pink-600' },
  { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', accent: 'bg-cyan-500', text: 'text-cyan-600' },
];

export const ClassificationAnalytics: React.FC<ClassificationAnalyticsProps> = ({
  trades,
  isPremium = true,
  onManageCategories,
  className,
}) => {
  const { getActiveCategories } = useClassificationStore();
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  
  const categories = getActiveCategories();

  // Calculate stats for each category and option
  const categoryStats = useMemo((): CategoryStats[] => {
    return categories.map(category => {
      const optionStats: OptionStats[] = category.options.map(option => {
        // Get trades with this classification
        const matchingTrades = trades.filter(trade => 
          trade.classifications?.[category.id] === option.id
        );

        const tradeCount = matchingTrades.length;
        const wins = matchingTrades.filter(t => (t.pnl || 0) > 0).length;
        const winRate = tradeCount > 0 ? (wins / tradeCount) * 100 : 0;
        const totalPnL = matchingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const totalRR = matchingTrades.reduce((sum, t) => sum + (t.riskRewardRatio || t.rrRatio || 0), 0);
        const avgPnL = tradeCount > 0 ? totalPnL / tradeCount : 0;

        return {
          optionId: option.id,
          optionName: option.name,
          emoji: option.emoji,
          tradeCount,
          winRate,
          totalPnL,
          totalRR,
          avgPnL,
        };
      });

      const totalTrades = optionStats.reduce((sum, opt) => sum + opt.tradeCount, 0);

      return {
        category,
        options: optionStats.sort((a, b) => a.order - b.order || 0),
        totalTrades,
      };
    });
  }, [trades, categories]);

  // Check if any trades have classifications
  const hasClassifiedTrades = trades.some(t => t.classifications && Object.keys(t.classifications).length > 0);

  if (categories.length === 0) {
    return (
      <EmptyState
        title="No Categories Set Up"
        description="Create classification categories to track performance by different trade characteristics."
        onAction={onManageCategories}
        actionLabel="Set Up Categories"
      />
    );
  }

  if (!hasClassifiedTrades) {
    return (
      <EmptyState
        title="No Classified Trades Yet"
        description="Start classifying your trades to see performance breakdowns by category."
        icon={<BarChart3 className="w-8 h-8" />}
      />
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Performance by classification
          </p>
        </div>
        {onManageCategories && (
          <button
            onClick={onManageCategories}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
                     bg-muted/50 hover:bg-muted transition-colors"
          >
            <Settings className="w-4 h-4" />
            Manage Categories
          </button>
        )}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {categoryStats.map((stats, idx) => (
          <CategoryCard
            key={stats.category.id}
            stats={stats}
            colorIndex={idx}
            hoveredOption={hoveredOption}
            onHoverOption={setHoveredOption}
          />
        ))}
      </div>
    </div>
  );
};

// Individual category card
interface CategoryCardProps {
  stats: CategoryStats;
  colorIndex: number;
  hoveredOption: string | null;
  onHoverOption: (id: string | null) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  stats,
  colorIndex,
  hoveredOption,
  onHoverOption,
}) => {
  const colors = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: colorIndex * 0.05 }}
      className={cn(
        "rounded-2xl border p-4",
        colors.border,
        "bg-card"
      )}
    >
      {/* Category Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{stats.category.emoji}</span>
        <h3 className="font-semibold text-base">{stats.category.name}</h3>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 text-xs text-muted-foreground mb-2 px-1">
        <div>Name</div>
        <div className="text-right w-14">Trades</div>
        <div className="text-right w-14">Win %</div>
        <div className="text-right w-16">Total RR</div>
      </div>

      {/* Options */}
      <div className="space-y-1">
        {stats.options.map((option, optIdx) => (
          <motion.div
            key={option.optionId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: colorIndex * 0.05 + optIdx * 0.02 }}
            onMouseEnter={() => onHoverOption(option.optionId)}
            onMouseLeave={() => onHoverOption(null)}
            className={cn(
              "grid grid-cols-[1fr,auto,auto,auto] gap-2 items-center px-2 py-2 rounded-lg transition-colors",
              "hover:bg-muted/50",
              hoveredOption === option.optionId && "bg-muted/50"
            )}
          >
            {/* Name with emoji */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm">{option.emoji}</span>
              <span className="text-sm font-medium truncate">{option.optionName}</span>
            </div>

            {/* Trade Count */}
            <div className="text-sm text-right w-14 font-medium">
              {option.tradeCount}
            </div>

            {/* Win Rate */}
            <div className={cn(
              "text-sm text-right w-14 font-medium",
              option.tradeCount > 0 && (
                option.winRate >= 50 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )
            )}>
              {option.tradeCount > 0 ? `${option.winRate.toFixed(0)}%` : '—'}
            </div>

            {/* Total RR */}
            <div className={cn(
              "text-sm text-right w-16 font-bold",
              option.totalRR > 0 
                ? "text-green-600 dark:text-green-400" 
                : option.totalRR < 0 
                ? "text-red-600 dark:text-red-400"
                : ""
            )}>
              {option.tradeCount > 0 ? option.totalRR.toFixed(1) : '—'}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Option Button */}
      <button
        className="w-full mt-3 flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground 
                   hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
      >
        <Plus className="w-3 h-3" />
        New page
      </button>
    </motion.div>
  );
};

// Empty state component
interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  onAction?: () => void;
  actionLabel?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  onAction,
  actionLabel,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
      {icon || <BarChart3 className="w-8 h-8 text-muted-foreground" />}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-md mb-4">{description}</p>
    {onAction && actionLabel && (
      <button
        onClick={onAction}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {actionLabel}
      </button>
    )}
  </div>
);

// Full page wrapper component - fetches trades from store
interface ClassificationAnalyticsPageProps {
  onManageCategories?: () => void;
}

export const ClassificationAnalyticsPage: React.FC<ClassificationAnalyticsPageProps> = ({
  onManageCategories,
}) => {
  // Import hooks dynamically to avoid circular dependencies
  const { useTradeStore } = require('@/store/useTradeStore');
  const { useAccountFilterStore, getAccountIdsForSelection } = require('@/store/useAccountFilterStore');
  const { useSubscription } = require('@/hooks/useSubscription');
  
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { hasAccess } = useSubscription();
  
  // Filter trades by selected account(s)
  const filteredTrades = useMemo(() => {
    const accountIds = getAccountIdsForSelection(selectedAccountId);
    return trades.filter((trade: Trade) => accountIds.includes(trade.accountId));
  }, [trades, selectedAccountId]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ClassificationAnalytics
          trades={filteredTrades}
          isPremium={hasAccess('setup-analytics')}
          onManageCategories={onManageCategories}
        />
      </div>
    </div>
  );
};

export default ClassificationAnalytics;
