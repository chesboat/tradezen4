/**
 * Classification Analytics - Bento grid stats page
 * Shows performance breakdown by classification categories, year, month, pairs, and results
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
  Clock,
  CalendarDays,
  Coins,
  PieChart,
  Layers,
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
  avgRR: number;
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
  avgRR?: number;
}

interface PairStats {
  symbol: string;
  tradeCount: number;
  winRate: number;
  totalRR: number;
  avgRR: number;
}

interface ResultStats {
  result: 'win' | 'loss' | 'scratch';
  label: string;
  dotColor: string;
  color: string;
  tradeCount: number;
  avgRR: number;
  totalRR: number;
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

// Time filter options
type TimeFilter = 'all' | '7d' | '30d' | '90d' | 'ytd';

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'ytd', label: 'Year to Date' },
];

// Card visibility storage key
const CARD_VISIBILITY_KEY = 'statistics-card-visibility';
const TIME_FILTER_KEY = 'statistics-time-filter';

interface CardVisibility {
  year: boolean;
  month: boolean;
  pairs: boolean;
  results: boolean;
  [categoryId: string]: boolean;
}

const getDefaultVisibility = (categoryIds: string[]): CardVisibility => {
  const visibility: CardVisibility = { year: true, month: true, pairs: true, results: true };
  categoryIds.forEach(id => { visibility[id] = true; });
  return visibility;
};

const loadVisibility = (categoryIds: string[]): CardVisibility => {
  try {
    const stored = localStorage.getItem(CARD_VISIBILITY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...getDefaultVisibility(categoryIds), ...parsed };
    }
  } catch {}
  return getDefaultVisibility(categoryIds);
};

const saveVisibility = (visibility: CardVisibility) => {
  localStorage.setItem(CARD_VISIBILITY_KEY, JSON.stringify(visibility));
};

const loadTimeFilter = (): TimeFilter => {
  try {
    const stored = localStorage.getItem(TIME_FILTER_KEY);
    if (stored && TIME_FILTERS.some(f => f.value === stored)) {
      return stored as TimeFilter;
    }
  } catch {}
  return 'all';
};

const saveTimeFilter = (filter: TimeFilter) => {
  localStorage.setItem(TIME_FILTER_KEY, filter);
};

// Month names for display
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Calculate the signed RR for a trade
 * - Wins: positive RR (use stored value)
 * - Losses: negative RR (use stored lossRR if available, otherwise default to -1)
 * - Scratch: 0
 * - Excluded trades: 0 (don't count toward RR)
 */
const getSignedRR = (trade: Trade): number => {
  // Excluded trades don't count toward RR stats
  if (trade.excludeFromAnalytics) return 0;
  
  const pnl = trade.pnl || 0;
  const rr = trade.riskRewardRatio || trade.rrRatio || 1;
  
  if (pnl > 0) {
    return Math.abs(rr);
  } else if (pnl < 0) {
    if (rr < 0) return rr;
    if (trade.lossRR !== undefined) return -Math.abs(trade.lossRR);
    return -1;
  }
  return 0;
};

/**
 * Check if a trade should count toward win rate calculations
 * Excluded trades don't count toward win/loss statistics
 */
const shouldCountForWinRate = (trade: Trade): boolean => {
  return !trade.excludeFromAnalytics;
};

/**
 * Filter trades by time period
 */
const filterTradesByTime = (trades: Trade[], filter: TimeFilter): Trade[] => {
  if (filter === 'all') return trades;
  
  const now = new Date();
  let cutoffDate: Date;
  
  switch (filter) {
    case '7d':
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'ytd':
      cutoffDate = new Date(now.getFullYear(), 0, 1); // Jan 1 of current year
      break;
    default:
      return trades;
  }
  
  return trades.filter(trade => {
    const tradeDate = new Date(trade.entryTime);
    return tradeDate >= cutoffDate;
  });
};

export const ClassificationAnalytics: React.FC<ClassificationAnalyticsProps> = ({
  trades: allTrades,
  isPremium = true,
  onManageCategories,
  className,
}) => {
  const { getActiveCategories } = useClassificationStore();
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [showTimeFilterMenu, setShowTimeFilterMenu] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(() => loadTimeFilter());
  
  const categories = getActiveCategories();
  const categoryIds = categories.map(c => c.id);
  
  const [cardVisibility, setCardVisibility] = useState<CardVisibility>(() => 
    loadVisibility(categoryIds)
  );

  // Filter trades by time
  const trades = useMemo(() => 
    filterTradesByTime(allTrades, timeFilter),
    [allTrades, timeFilter]
  );

  // Update visibility when categories change
  useEffect(() => {
    setCardVisibility(prev => ({ ...getDefaultVisibility(categoryIds), ...prev }));
  }, [categoryIds.join(',')]);

  // Save time filter on change
  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
    saveTimeFilter(filter);
    setShowTimeFilterMenu(false);
  };

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
        const matchingTrades = trades.filter(trade => 
          trade.classifications?.[category.id] === option.id
        );

        const tradeCount = matchingTrades.length;
        // Only count non-excluded trades for win rate
        const countableTrades = matchingTrades.filter(shouldCountForWinRate);
        const wins = countableTrades.filter(t => (t.pnl || 0) > 0).length;
        const winRate = countableTrades.length > 0 ? (wins / countableTrades.length) * 100 : 0;
        const totalPnL = matchingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
        const totalRR = matchingTrades.reduce((sum, t) => sum + getSignedRR(t), 0);
        const avgRR = tradeCount > 0 ? totalRR / tradeCount : 0;

        return {
          optionId: option.id,
          optionName: option.name,
          emoji: option.emoji,
          order: option.order,
          tradeCount,
          winRate,
          totalPnL,
          totalRR,
          avgRR,
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
      const countableTrades = yearTrades.filter(shouldCountForWinRate);
      const wins = countableTrades.filter(t => (t.pnl || 0) > 0).length;
      const winRate = countableTrades.length > 0 ? (wins / countableTrades.length) * 100 : 0;
      const totalRR = yearTrades.reduce((sum, t) => sum + getSignedRR(t), 0);
      const totalPnL = yearTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      
      stats.push({
        label: year.toString(),
        tradeCount: yearTrades.length,
        winRate,
        totalRR,
        totalPnL,
      });
    });

    return stats.sort((a, b) => parseInt(b.label) - parseInt(a.label));
  }, [trades]);

  // Calculate month stats
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
      const countableTrades = monthTrades.filter(shouldCountForWinRate);
      const wins = countableTrades.filter(t => (t.pnl || 0) > 0).length;
      const winRate = countableTrades.length > 0 ? (wins / countableTrades.length) * 100 : 0;
      const totalRR = monthTrades.reduce((sum, t) => sum + getSignedRR(t), 0);
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

  // Calculate pair/symbol stats
  const pairStats = useMemo((): PairStats[] => {
    const pairMap = new Map<string, Trade[]>();
    
    trades.forEach(trade => {
      const symbol = trade.symbol.toUpperCase();
      if (!pairMap.has(symbol)) pairMap.set(symbol, []);
      pairMap.get(symbol)!.push(trade);
    });

    const stats: PairStats[] = [];
    pairMap.forEach((pairTrades, symbol) => {
      const countableTrades = pairTrades.filter(shouldCountForWinRate);
      const wins = countableTrades.filter(t => (t.pnl || 0) > 0).length;
      const winRate = countableTrades.length > 0 ? (wins / countableTrades.length) * 100 : 0;
      const totalRR = pairTrades.reduce((sum, t) => sum + getSignedRR(t), 0);
      const avgRR = pairTrades.length > 0 ? totalRR / pairTrades.length : 0;
      
      stats.push({
        symbol,
        tradeCount: pairTrades.length,
        winRate,
        totalRR,
        avgRR,
      });
    });

    // Sort by trade count descending
    return stats.sort((a, b) => b.tradeCount - a.tradeCount);
  }, [trades]);

  // Calculate result stats (only count non-excluded trades)
  const resultStats = useMemo((): ResultStats[] => {
    const countableTrades = trades.filter(shouldCountForWinRate);
    const wins = countableTrades.filter(t => (t.pnl || 0) > 0);
    const losses = countableTrades.filter(t => (t.pnl || 0) < 0);
    const scratches = countableTrades.filter(t => (t.pnl || 0) === 0);

    const calcStats = (tradeset: Trade[]): { avgRR: number; totalRR: number } => {
      const totalRR = tradeset.reduce((sum, t) => sum + getSignedRR(t), 0);
      const avgRR = tradeset.length > 0 ? totalRR / tradeset.length : 0;
      return { avgRR, totalRR };
    };

    const winStats = calcStats(wins);
    const lossStats = calcStats(losses);
    const scratchStats = calcStats(scratches);

    return [
      {
        result: 'win',
        label: 'Win',
        dotColor: 'bg-green-500',
        color: 'text-green-600 dark:text-green-400',
        tradeCount: wins.length,
        avgRR: winStats.avgRR,
        totalRR: winStats.totalRR,
      },
      {
        result: 'loss',
        label: 'Loss',
        dotColor: 'bg-red-500',
        color: 'text-red-600 dark:text-red-400',
        tradeCount: losses.length,
        avgRR: lossStats.avgRR,
        totalRR: lossStats.totalRR,
      },
      {
        result: 'scratch',
        label: 'BE',
        dotColor: 'bg-yellow-500',
        color: 'text-yellow-600 dark:text-yellow-400',
        tradeCount: scratches.length,
        avgRR: scratchStats.avgRR,
        totalRR: scratchStats.totalRR,
      },
    ];
  }, [trades]);

  const hasClassifiedTrades = trades.some(t => t.classifications && Object.keys(t.classifications).length > 0);
  const hasTrades = trades.length > 0;
  const visibleCount = Object.values(cardVisibility).filter(Boolean).length;
  const currentFilterLabel = TIME_FILTERS.find(f => f.value === timeFilter)?.label || 'All Time';

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Performance breakdown • {trades.length} trades {timeFilter !== 'all' && `(${currentFilterLabel})`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Time Filter */}
          <div className="relative">
            <button
              onClick={() => setShowTimeFilterMenu(!showTimeFilterMenu)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
                       bg-muted/50 hover:bg-muted transition-colors"
            >
              <Clock className="w-4 h-4" />
              {currentFilterLabel}
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform",
                showTimeFilterMenu && "rotate-180"
              )} />
            </button>
            
            <AnimatePresence>
              {showTimeFilterMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-44 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                >
                  <div className="p-1">
                    {TIME_FILTERS.map(filter => (
                      <button
                        key={filter.value}
                        onClick={() => handleTimeFilterChange(filter.value)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                          timeFilter === filter.value
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
                  className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto"
                >
                  <div className="p-2 space-y-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Time Stats
                    </div>
                    <VisibilityToggle
                      label="Year"
                      icon={<Calendar className="w-4 h-4" />}
                      isVisible={cardVisibility.year}
                      onToggle={() => toggleVisibility('year')}
                    />
                    <VisibilityToggle
                      label="Month Stats"
                      icon={<CalendarDays className="w-4 h-4" />}
                      isVisible={cardVisibility.month}
                      onToggle={() => toggleVisibility('month')}
                    />
                    
                    <div className="border-t border-border my-2" />
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Trade Stats
                    </div>
                    <VisibilityToggle
                      label="Pair Stats"
                      icon={<Coins className="w-4 h-4" />}
                      isVisible={cardVisibility.pairs}
                      onToggle={() => toggleVisibility('pairs')}
                    />
                    <VisibilityToggle
                      label="Result Stats"
                      icon={<PieChart className="w-4 h-4" />}
                      isVisible={cardVisibility.results}
                      onToggle={() => toggleVisibility('results')}
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
                            icon={<Layers className="w-4 h-4" />}
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
              Manage
            </button>
          )}
        </div>
      </div>

      {/* Close menus when clicking outside */}
      {(showVisibilityMenu || showTimeFilterMenu) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowVisibilityMenu(false);
            setShowTimeFilterMenu(false);
          }} 
        />
      )}

      {!hasTrades ? (
        <EmptyState
          title="No Trades Yet"
          description={timeFilter !== 'all' 
            ? `No trades found for ${currentFilterLabel.toLowerCase()}. Try a different time range.`
            : "Start logging trades to see your performance statistics."
          }
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
                icon={<Calendar className="w-5 h-5 text-muted-foreground" />}
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
                icon={<CalendarDays className="w-5 h-5 text-muted-foreground" />}
                stats={monthStats}
                colorIndex={1}
                hoveredOption={hoveredOption}
                onHoverOption={setHoveredOption}
              />
            )}

            {/* Pair Stats Card */}
            {cardVisibility.pairs && pairStats.length > 0 && (
              <PairStatsCard
                stats={pairStats}
                colorIndex={2}
                hoveredOption={hoveredOption}
                onHoverOption={setHoveredOption}
              />
            )}

            {/* Result Stats Card */}
            {cardVisibility.results && (
              <ResultStatsCard
                stats={resultStats}
                colorIndex={3}
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
                  colorIndex={idx + 4}
                  hoveredOption={hoveredOption}
                  onHoverOption={setHoveredOption}
                />
              )
            ))}
          </div>

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
  icon?: React.ReactNode;
  isVisible: boolean;
  onToggle: () => void;
}

const VisibilityToggle: React.FC<VisibilityToggleProps> = ({
  label,
  icon,
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
    {icon && <span className="text-muted-foreground">{icon}</span>}
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
  icon: React.ReactNode;
  stats: TimeStats[];
  colorIndex: number;
  hoveredOption: string | null;
  onHoverOption: (id: string | null) => void;
}

const TimeStatsCard: React.FC<TimeStatsCardProps> = ({
  title,
  icon,
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
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-semibold text-base">{title}</h3>
      </div>

      <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 text-xs text-muted-foreground mb-2 px-1">
        <div>{title === 'Year' ? 'Year' : 'Month'}</div>
        <div className="text-right w-14">Trades</div>
        <div className="text-right w-14">Win %</div>
        <div className="text-right w-16">Total RR</div>
      </div>

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
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium truncate">{stat.label}</span>
            </div>
            <div className="text-sm text-right w-14 font-medium">
              {stat.tradeCount}
            </div>
            <div className={cn(
              "text-sm text-right w-14 font-medium",
              stat.tradeCount > 0 && (
                stat.winRate >= 50 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )
            )}>
              {stat.tradeCount > 0 ? `${stat.winRate.toFixed(0)}%` : '—'}
            </div>
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

// Pair Stats Card
interface PairStatsCardProps {
  stats: PairStats[];
  colorIndex: number;
  hoveredOption: string | null;
  onHoverOption: (id: string | null) => void;
}

const PairStatsCard: React.FC<PairStatsCardProps> = ({
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
      <div className="flex items-center gap-2 mb-4">
        <Coins className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-base">Pair Stats</h3>
      </div>

      <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 text-xs text-muted-foreground mb-2 px-1">
        <div>Pair</div>
        <div className="text-right w-14">Trades</div>
        <div className="text-right w-14">Win %</div>
        <div className="text-right w-16">Total RR</div>
      </div>

      <div className="space-y-1 max-h-[320px] overflow-y-auto">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.symbol}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: colorIndex * 0.05 + idx * 0.02 }}
            onMouseEnter={() => onHoverOption(`pair-${stat.symbol}`)}
            onMouseLeave={() => onHoverOption(null)}
            className={cn(
              "grid grid-cols-[1fr,auto,auto,auto] gap-2 items-center px-2 py-2 rounded-lg transition-colors",
              "hover:bg-muted/50",
              hoveredOption === `pair-${stat.symbol}` && "bg-muted/50"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium truncate">{stat.symbol}</span>
            </div>
            <div className="text-sm text-right w-14 font-medium">
              {stat.tradeCount}
            </div>
            <div className={cn(
              "text-sm text-right w-14 font-medium",
              stat.tradeCount > 0 && (
                stat.winRate >= 50 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )
            )}>
              {stat.tradeCount > 0 ? `${stat.winRate.toFixed(0)}%` : '—'}
            </div>
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

// Result Stats Card
interface ResultStatsCardProps {
  stats: ResultStats[];
  colorIndex: number;
  hoveredOption: string | null;
  onHoverOption: (id: string | null) => void;
}

const ResultStatsCard: React.FC<ResultStatsCardProps> = ({
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
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-base">Result Stats</h3>
      </div>

      <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 text-xs text-muted-foreground mb-2 px-1">
        <div>Result</div>
        <div className="text-right w-14">Trades</div>
        <div className="text-right w-14">Avg RR</div>
        <div className="text-right w-16">Total RR</div>
      </div>

      <div className="space-y-1">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.result}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: colorIndex * 0.05 + idx * 0.02 }}
            onMouseEnter={() => onHoverOption(`result-${stat.result}`)}
            onMouseLeave={() => onHoverOption(null)}
            className={cn(
              "grid grid-cols-[1fr,auto,auto,auto] gap-2 items-center px-2 py-2 rounded-lg transition-colors",
              "hover:bg-muted/50",
              hoveredOption === `result-${stat.result}` && "bg-muted/50"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={cn("w-2 h-2 rounded-full", stat.dotColor)} />
              <span className="text-sm font-medium truncate">{stat.label}</span>
            </div>
            <div className="text-sm text-right w-14 font-medium">
              {stat.tradeCount}
            </div>
            <div className={cn(
              "text-sm text-right w-14 font-medium",
              stat.avgRR > 0 
                ? "text-green-600 dark:text-green-400" 
                : stat.avgRR < 0 
                ? "text-red-600 dark:text-red-400"
                : ""
            )}>
              {stat.tradeCount > 0 ? stat.avgRR.toFixed(2) : '—'}
            </div>
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
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-base">{stats.category.name}</h3>
      </div>

      <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 text-xs text-muted-foreground mb-2 px-1">
        <div>Name</div>
        <div className="text-right w-14">Trades</div>
        <div className="text-right w-14">Win %</div>
        <div className="text-right w-16">Total RR</div>
      </div>

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
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium truncate">{option.optionName}</span>
            </div>
            <div className="text-sm text-right w-14 font-medium">
              {option.tradeCount}
            </div>
            <div className={cn(
              "text-sm text-right w-14 font-medium",
              option.tradeCount > 0 && (
                option.winRate >= 50 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )
            )}>
              {option.tradeCount > 0 ? `${option.winRate.toFixed(0)}%` : '—'}
            </div>
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

// Full page wrapper component
interface ClassificationAnalyticsPageProps {
  onManageCategories?: () => void;
}

export const ClassificationAnalyticsPage: React.FC<ClassificationAnalyticsPageProps> = ({
  onManageCategories,
}) => {
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { isPremium, isTrial } = useSubscription();
  
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
