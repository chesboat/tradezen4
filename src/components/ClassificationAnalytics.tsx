/**
 * Classification Analytics - Bento grid stats page
 * Shows performance breakdown by classification categories, year, and month
 * Inspired by the Notion-style statistics layout
 */

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  Filter,
  Plus,
  Settings,
  ChevronRight,
  Calendar,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';
import { Trade, ClassificationCategory } from '@/types';
import { useClassificationStore } from '@/store/useClassificationStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore, getAccountIdsForSelection } from '@/store/useAccountFilterStore';
import { useSubscription } from '@/hooks/useSubscription';
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
  order: number;
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

interface TimeStats {
  label: string;
  tradeCount: number;
  winRate: number;
  totalRR: number;
  totalPnL: number;
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

// Card visibility storage key
const CARD_VISIBILITY_KEY = 'statistics-card-visibility';

interface CardVisibility {
  year: boolean;
  month: boolean;
  [categoryId: string]: boolean;
}

const getDefaultVisibility = (categoryIds: string[]): CardVisibility => {
  const visibility: CardVisibility = { year: true, month: true };
  categoryIds.forEach(id => { visibility[id] = true; });
  return visibility;
};

const loadVisibility = (categoryIds: string[]): CardVisibility => {
  try {
    const stored = localStorage.getItem(CARD_VISIBILITY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new categories
      return { ...getDefaultVisibility(categoryIds), ...parsed };
    }
  } catch {}
  return getDefaultVisibility(categoryIds);
};

const saveVisibility = (visibility: CardVisibility) => {
  localStorage.setItem(CARD_VISIBILITY_KEY, JSON.stringify(visibility));
};

// Month names for display
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const ClassificationAnalytics: React.FC<ClassificationAnalyticsProps> = ({
  trades,
  isPremium = true,
  onManageCategories,
  className,
}) => {
  const { getActiveCategories } = useClassificationStore();
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  
  const categories = getActiveCategories();
  const categoryIds = categories.map(c => c.id);
  
  const [cardVisibility, setCardVisibility] = useState<CardVisibility>(() => 
    loadVisibility(categoryIds)
  );

  // Update visibility when categories change
  useEffect(() => {
    setCardVisibility(prev => ({ ...getDefaultVisibility(categoryIds), ...prev }));
  }, [categoryIds.join(',')]);

  // Save visibility on change
  const toggleVisibility = (key: string) => {
    setCardVisibility(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      saveVisibility(updated);
      return updated;
    });
  };

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
          order: option.order,
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

  // Calculate year stats
  const yearStats = useMemo((): TimeStats[] => {
    const yearMap = new Map<number, Trade[]>();
    
    trades.forEach(trade => {
      const date = new Date(trade.entryTime);
      const year = date.getFullYear();
      if (!yearMap.has(year)) yearMap.set(year, []);
      yearMap.get(year)!.push(trade);
    });

    const stats: TimeStats[] = [];
    yearMap.forEach((yearTrades, year) => {
      const wins = yearTrades.filter(t => (t.pnl || 0) > 0).length;
      const winRate = yearTrades.length > 0 ? (wins / yearTrades.length) * 100 : 0;
      const totalRR = yearTrades.reduce((sum, t) => sum + (t.riskRewardRatio || t.rrRatio || 0), 0);
      const totalPnL = yearTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      
      stats.push({
        label: year.toString(),
        tradeCount: yearTrades.length,
        winRate,
        totalRR,
        totalPnL,
      });
    });

    return stats.sort((a, b) => parseInt(b.label) - parseInt(a.label)); // Most recent first
  }, [trades]);

  // Calculate month stats (for current year or all time)
  const monthStats = useMemo((): TimeStats[] => {
    const monthMap = new Map<string, Trade[]>();
    
    trades.forEach(trade => {
      const date = new Date(trade.entryTime);
      const monthKey = MONTH_NAMES[date.getMonth()];
      if (!monthMap.has(monthKey)) monthMap.set(monthKey, []);
      monthMap.get(monthKey)!.push(trade);
    });

    const stats: TimeStats[] = [];
    MONTH_NAMES.forEach(month => {
      const monthTrades = monthMap.get(month) || [];
      const wins = monthTrades.filter(t => (t.pnl || 0) > 0).length;
      const winRate = monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0;
      const totalRR = monthTrades.reduce((sum, t) => sum + (t.riskRewardRatio || t.rrRatio || 0), 0);
      const totalPnL = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      
      stats.push({
        label: month,
        tradeCount: monthTrades.length,
        winRate,
        totalRR,
        totalPnL,
      });
    });

    return stats;
  }, [trades]);

  // Check if any trades have classifications
  const hasClassifiedTrades = trades.some(t => t.classifications && Object.keys(t.classifications).length > 0);
  const hasTrades = trades.length > 0;

  // Count visible cards
  const visibleCount = Object.values(cardVisibility).filter(Boolean).length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Performance breakdown by time and classification
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Visibility Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
                       bg-muted/50 hover:bg-muted transition-colors"
            >
              <Eye className="w-4 h-4" />
              Show/Hide
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                showVisibilityMenu && "rotate-180"
              )} />
            </button>
            
            <AnimatePresence>
              {showVisibilityMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                >
                  <div className="p-2 space-y-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Time Stats
                    </div>
                    <VisibilityToggle
                      label="Year"
                      emoji="🗓️"
                      isVisible={cardVisibility.year}
                      onToggle={() => toggleVisibility('year')}
                    />
                    <VisibilityToggle
                      label="Month Stats"
                      emoji="📅"
                      isVisible={cardVisibility.month}
                      onToggle={() => toggleVisibility('month')}
                    />
                    
                    {categories.length > 0 && (
                      <>
                        <div className="border-t border-border my-2" />
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Classifications
                        </div>
                        {categories.map(cat => (
                          <VisibilityToggle
                            key={cat.id}
                            label={cat.name}
                            emoji={cat.emoji}
                            isVisible={cardVisibility[cat.id] ?? true}
                            onToggle={() => toggleVisibility(cat.id)}
                          />
                        ))}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
      </div>

      {/* Close menu when clicking outside */}
      {showVisibilityMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowVisibilityMenu(false)} 
        />
      )}

      {!hasTrades ? (
        <EmptyState
          title="No Trades Yet"
          description="Start logging trades to see your performance statistics."
          icon={<BarChart3 className="w-8 h-8" />}
        />
      ) : (
        <>
          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Year Stats Card */}
            {cardVisibility.year && yearStats.length > 0 && (
              <TimeStatsCard
                title="Year"
                emoji="🗓️"
                stats={yearStats}
                colorIndex={0}
                hoveredOption={hoveredOption}
                onHoverOption={setHoveredOption}
              />
            )}

            {/* Month Stats Card */}
            {cardVisibility.month && (
              <TimeStatsCard
                title="Month Stats"
                emoji="📅"
                stats={monthStats}
                colorIndex={1}
                hoveredOption={hoveredOption}
                onHoverOption={setHoveredOption}
              />
            )}

            {/* Classification Category Cards */}
            {categoryStats.map((stats, idx) => (
              cardVisibility[stats.category.id] !== false && (
                <CategoryCard
                  key={stats.category.id}
                  stats={stats}
                  colorIndex={idx + 2}
                  hoveredOption={hoveredOption}
                  onHoverOption={setHoveredOption}
                />
              )
            ))}
          </div>

          {/* Show message if all cards are hidden */}
          {visibleCount === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <EyeOff className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>All cards are hidden. Use the "Show/Hide" menu to display cards.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Visibility toggle item
interface VisibilityToggleProps {
  label: string;
  emoji?: string;
  isVisible: boolean;
  onToggle: () => void;
}

const VisibilityToggle: React.FC<VisibilityToggleProps> = ({
  label,
  emoji,
  isVisible,
  onToggle,
}) => (
  <button
    onClick={onToggle}
    className={cn(
      "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors",
      "hover:bg-muted",
      !isVisible && "opacity-50"
    )}
  >
    {emoji && <span>{emoji}</span>}
    <span className="flex-1 text-left">{label}</span>
    {isVisible ? (
      <Eye className="w-4 h-4 text-primary" />
    ) : (
      <EyeOff className="w-4 h-4 text-muted-foreground" />
    )}
  </button>
);

// Time-based stats card (Year/Month)
interface TimeStatsCardProps {
  title: string;
  emoji: string;
  stats: TimeStats[];
  colorIndex: number;
  hoveredOption: string | null;
  onHoverOption: (id: string | null) => void;
}

const TimeStatsCard: React.FC<TimeStatsCardProps> = ({
  title,
  emoji,
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
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{emoji}</span>
        <h3 className="font-semibold text-base">{title}</h3>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 text-xs text-muted-foreground mb-2 px-1">
        <div>{title === 'Year' ? 'Year' : 'Month'}</div>
        <div className="text-right w-14">Trades</div>
        <div className="text-right w-14">Win %</div>
        <div className="text-right w-16">Total RR</div>
      </div>

      {/* Stats rows */}
      <div className="space-y-1 max-h-[320px] overflow-y-auto">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: colorIndex * 0.05 + idx * 0.02 }}
            onMouseEnter={() => onHoverOption(`time-${stat.label}`)}
            onMouseLeave={() => onHoverOption(null)}
            className={cn(
              "grid grid-cols-[1fr,auto,auto,auto] gap-2 items-center px-2 py-2 rounded-lg transition-colors",
              "hover:bg-muted/50",
              hoveredOption === `time-${stat.label}` && "bg-muted/50"
            )}
          >
            {/* Label */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm">📄</span>
              <span className="text-sm font-medium truncate">{stat.label}</span>
            </div>

            {/* Trade Count */}
            <div className="text-sm text-right w-14 font-medium">
              {stat.tradeCount}
            </div>

            {/* Win Rate */}
            <div className={cn(
              "text-sm text-right w-14 font-medium",
              stat.tradeCount > 0 && (
                stat.winRate >= 50 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )
            )}>
              {stat.tradeCount > 0 ? `${stat.winRate.toFixed(0)}%` : '—'}
            </div>

            {/* Total RR */}
            <div className={cn(
              "text-sm text-right w-16 font-bold",
              stat.totalRR > 0 
                ? "text-green-600 dark:text-green-400" 
                : stat.totalRR < 0 
                ? "text-red-600 dark:text-red-400"
                : ""
            )}>
              {stat.tradeCount > 0 ? stat.totalRR.toFixed(1) : '—'}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
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
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { isPremium, isTrial } = useSubscription();
  
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
          isPremium={isPremium || isTrial}
          onManageCategories={onManageCategories}
        />
      </div>
    </div>
  );
};

export default ClassificationAnalytics;
