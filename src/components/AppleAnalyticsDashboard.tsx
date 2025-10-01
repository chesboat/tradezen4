import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, TrendingUp, TrendingDown, Activity, Calendar, 
  Trophy, AlertTriangle, ChevronDown, ChevronRight, X, ArrowUp, ArrowDown,
  Target, Zap, MinusCircle
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { computeEdgeScore } from '@/lib/edgeScore';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';

// ===============================================
// TYPES & UTILITIES
// ===============================================

type TimePeriod = 'all' | '1m' | '3m' | '6m' | '1y' | 'custom';

interface TimePeriodOption {
  value: TimePeriod;
  label: string;
  days?: number;
}

const timePeriodOptions: TimePeriodOption[] = [
  { value: 'all', label: 'All Time' },
  { value: '1m', label: 'Last 30 Days', days: 30 },
  { value: '3m', label: 'Last 90 Days', days: 90 },
  { value: '6m', label: 'Last 6 Months', days: 180 },
  { value: '1y', label: 'Last Year', days: 365 },
];

// ===============================================
// HERO P&L SECTION (Apple-style prominent)
// ===============================================

const HeroAnalyticsPnL: React.FC<{
  currentPnL: number;
  previousPnL: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  selectedPeriod: string;
  onPeriodChange: (period: TimePeriod) => void;
}> = ({ currentPnL, previousPnL, totalTrades, winRate, profitFactor, selectedPeriod, onPeriodChange }) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const percentChange = previousPnL !== 0 ? ((currentPnL - previousPnL) / Math.abs(previousPnL)) * 100 : 0;
  const isPositive = currentPnL >= 0;
  const hasComparison = previousPnL !== 0;

  const selectedLabel = timePeriodOptions.find(opt => opt.value === selectedPeriod)?.label || 'All Time';

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl 2xl:max-w-[1800px] mx-auto px-6 2xl:px-8 py-8">
        {/* Time Period Dropdown */}
        <div className="relative inline-block mb-4" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-background hover:bg-muted/50 rounded-xl border border-border transition-all duration-200"
          >
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{selectedLabel}</span>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              dropdownOpen && "rotate-180"
            )} />
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-2 w-56 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden"
              >
                {timePeriodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onPeriodChange(option.value);
                      setDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm transition-colors",
                      selectedPeriod === option.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hero P&L */}
        <div className="flex items-end gap-8">
          <div>
            <h1 className={cn(
              "text-6xl 2xl:text-7xl font-bold tabular-nums tracking-tight",
              isPositive ? "text-green-500" : currentPnL < 0 ? "text-red-500" : "text-muted-foreground"
            )}>
              {formatCurrency(currentPnL)}
            </h1>
            
            {/* Comparison vs Previous Period */}
            {hasComparison && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mt-2"
              >
                {percentChange >= 0 ? (
                  <ArrowUp className="w-4 h-4 text-green-500" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-red-500" />
                )}
                <span className={cn(
                  "text-lg font-medium",
                  percentChange >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {formatCurrency(Math.abs(currentPnL - previousPnL))} ({Math.abs(percentChange).toFixed(1)}%)
                </span>
                <span className="text-sm text-muted-foreground">vs previous period</span>
              </motion.div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex gap-8 pb-2">
            <div>
              <div className="text-2xl font-semibold text-foreground">{totalTrades}</div>
              <div className="text-sm text-muted-foreground">trades</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">{winRate.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">win rate</div>
            </div>
            <div>
              <div className="text-2xl font-semibold text-foreground">{profitFactor.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">profit factor</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===============================================
// YOUR EDGE AT A GLANCE (Horizontal Bars)
// ===============================================

interface EdgeMetric {
  label: string;
  value: number;
  max: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
  description: string;
  actionText?: string;
  onAction?: () => void;
}

const EdgeBar: React.FC<EdgeMetric & { onClick?: () => void }> = ({
  label,
  value,
  max,
  status,
  description,
  actionText,
  onClick
}) => {
  const percentage = (value / max) * 100;
  
  const statusColors = {
    excellent: 'bg-green-500',
    good: 'bg-blue-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500'
  };

  const statusIcons = {
    excellent: '✓',
    good: '✓',
    warning: '⚠️',
    danger: '⚠️'
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-xl transition-all duration-200",
        onClick && "hover:bg-muted/30 hover:scale-[1.01] cursor-pointer"
      )}
      whileTap={onClick ? { scale: 0.99 } : {}}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="text-xs">{statusIcons[status]}</span>
        </div>
        <span className="text-sm font-semibold text-foreground tabular-nums">{value.toFixed(0)}</span>
      </div>
      
      {/* Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn("h-full rounded-full", statusColors[status])}
        />
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">{description}</span>
        {actionText && onClick && (
          <span className="text-xs text-primary font-medium">{actionText} →</span>
        )}
      </div>
    </motion.button>
  );
};

const YourEdgeAtAGlance: React.FC<{ trades: any[] }> = ({ trades }) => {
  const edge = React.useMemo(() => computeEdgeScore(trades), [trades]);

  const metrics: EdgeMetric[] = [
    {
      label: 'Win Rate',
      value: edge.breakdown.winRate,
      max: 100,
      status: edge.breakdown.winRate >= 60 ? 'excellent' : edge.breakdown.winRate >= 50 ? 'good' : edge.breakdown.winRate >= 40 ? 'warning' : 'danger',
      description: 'Percentage of profitable trades'
    },
    {
      label: 'Profit Factor',
      value: edge.breakdown.profitFactor,
      max: 3,
      status: edge.breakdown.profitFactor >= 2 ? 'excellent' : edge.breakdown.profitFactor >= 1.5 ? 'good' : edge.breakdown.profitFactor >= 1 ? 'warning' : 'danger',
      description: 'Ratio of gross profit to gross loss'
    },
    {
      label: 'Risk Management',
      value: 100 - edge.breakdown.maxDrawdown,
      max: 100,
      status: edge.breakdown.maxDrawdown <= 15 ? 'excellent' : edge.breakdown.maxDrawdown <= 25 ? 'good' : edge.breakdown.maxDrawdown <= 35 ? 'warning' : 'danger',
      description: 'Lower drawdown = better risk control'
    },
    {
      label: 'Consistency',
      value: edge.breakdown.consistency,
      max: 100,
      status: edge.breakdown.consistency >= 70 ? 'excellent' : edge.breakdown.consistency >= 55 ? 'good' : edge.breakdown.consistency >= 40 ? 'warning' : 'danger',
      description: 'Stability of returns over time'
    }
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Your Edge at a Glance</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Overall Score:</span>
          <span className="text-2xl font-bold text-primary">{edge.score}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <EdgeBar key={metric.label} {...metric} />
        ))}
      </div>
    </div>
  );
};

// ===============================================
// EQUITY CURVE WITH ANNOTATIONS
// ===============================================

const AnnotatedEquityCurve: React.FC<{ trades: any[] }> = ({ trades }) => {
  const equityData = React.useMemo(() => {
    if (trades.length === 0) return { data: [], annotations: { biggestWin: null, longestStreak: 0 } };

    // Build cumulative equity
    let cumulative = 0;
    const data = trades
      .sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime())
      .map((trade, idx) => {
        cumulative += (trade.pnl || 0);
        return {
          index: idx,
          date: new Date(trade.entryTime),
          equity: cumulative,
          pnl: trade.pnl || 0,
          symbol: trade.symbol
        };
      });

    // Find biggest win
    const biggestWin = data.reduce((max, point) => point.pnl > (max?.pnl || 0) ? point : max, data[0]);

    // Calculate longest win streak
    let currentStreak = 0;
    let longestStreak = 0;
    trades.forEach(trade => {
      if ((trade.pnl || 0) > 0) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return { data, annotations: { biggestWin, longestStreak } };
  }, [trades]);

  const maxEquity = Math.max(...equityData.data.map(d => d.equity), 0);
  const minEquity = Math.min(...equityData.data.map(d => d.equity), 0);
  const range = maxEquity - minEquity || 1;

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Equity Curve</h2>
        </div>
        {equityData.annotations.biggestWin && (
          <div className="text-sm text-muted-foreground">
            Biggest win: <span className="font-semibold text-green-500">
              {formatCurrency(equityData.annotations.biggestWin.pnl)}
            </span> • Longest streak: <span className="font-semibold text-foreground">
              {equityData.annotations.longestStreak} trades
            </span>
          </div>
        )}
      </div>

      <div className="relative h-64 bg-muted/10 rounded-lg overflow-hidden">
        {equityData.data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            No trades to display
          </div>
        ) : (
          <svg viewBox={`0 0 ${equityData.data.length} 100`} className="w-full h-full" preserveAspectRatio="none">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2={equityData.data.length}
                y2={y}
                stroke="currentColor"
                strokeWidth="0.1"
                className="text-border opacity-30"
              />
            ))}
            
            {/* Equity curve */}
            <polyline
              points={equityData.data.map((point, idx) => {
                const x = idx;
                const y = 100 - ((point.equity - minEquity) / range) * 100;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.5"
              className="drop-shadow"
            />
            
            {/* Fill under curve */}
            <polygon
              points={`0,100 ${equityData.data.map((point, idx) => {
                const x = idx;
                const y = 100 - ((point.equity - minEquity) / range) * 100;
                return `${x},${y}`;
              }).join(' ')} ${equityData.data.length},100`}
              fill="hsl(var(--primary))"
              opacity="0.1"
            />
            
            {/* Biggest win annotation */}
            {equityData.annotations.biggestWin && (
              <circle
                cx={equityData.annotations.biggestWin.index}
                cy={100 - ((equityData.annotations.biggestWin.equity - minEquity) / range) * 100}
                r="1"
                fill="#22c55e"
                className="drop-shadow-lg animate-pulse"
              />
            )}
          </svg>
        )}
      </div>
    </div>
  );
};

// ===============================================
// TOP SYMBOLS (Full-width, clickable filter)
// ===============================================

const TopSymbolsSection: React.FC<{ 
  trades: any[];
  onSymbolFilter?: (symbol: string) => void;
}> = ({ trades, onSymbolFilter }) => {
  const topSymbols = React.useMemo(() => {
    if (trades.length === 0) return [];

    const symbolStats = new Map<string, { pnl: number; trades: number; winRate: number; wins: number }>();
    
    trades.forEach(trade => {
      const symbol = trade.symbol || 'Unknown';
      const pnl = trade.pnl || 0;
      const existing = symbolStats.get(symbol) || { pnl: 0, trades: 0, winRate: 0, wins: 0 };
      
      existing.pnl += pnl;
      existing.trades += 1;
      if (pnl > 0) existing.wins += 1;
      existing.winRate = (existing.wins / existing.trades) * 100;
      
      symbolStats.set(symbol, existing);
    });

    return Array.from(symbolStats.entries())
      .map(([symbol, stats]) => ({ symbol, ...stats }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 6);
  }, [trades]);

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Top Performing Symbols</h2>
        <span className="text-sm text-muted-foreground ml-auto">Click to filter →</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {topSymbols.map((symbolData) => (
          <motion.button
            key={symbolData.symbol}
            onClick={() => onSymbolFilter?.(symbolData.symbol)}
            className="p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border transition-all duration-200"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-lg font-bold text-foreground mb-1">{symbolData.symbol}</div>
            <div className={cn(
              "text-xl font-semibold mb-2",
              symbolData.pnl > 0 ? "text-green-500" : symbolData.pnl < 0 ? "text-red-500" : "text-muted-foreground"
            )}>
              {formatCurrency(symbolData.pnl)}
            </div>
            <div className="text-xs text-muted-foreground">
              {symbolData.winRate.toFixed(0)}% • {symbolData.trades} trades
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// ===============================================
// TRADE HIGHLIGHTS (Card-based, not table)
// ===============================================

const TradeHighlightsCard: React.FC<{ trades: any[] }> = ({ trades }) => {
  const { getReflectionByDate } = useDailyReflectionStore();
  const { selectedAccountId } = useAccountFilterStore();

  const recentHighlights = React.useMemo(() => {
    return trades
      .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
      .slice(0, 5)
      .map(trade => {
        const dateStr = new Date(trade.entryTime).toISOString().split('T')[0];
        const reflectionData = getReflectionByDate(dateStr, selectedAccountId || undefined);
        
        // Extract key learning or summary
        const highlight = reflectionData?.lessons || reflectionData?.reflection || reflectionData?.aiSummary || '';
        const mood = reflectionData?.moodTimeline?.[0]?.mood;
        
        return { ...trade, highlight, mood };
      });
  }, [trades, getReflectionByDate, selectedAccountId]);

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Trade Highlights</h2>
        </div>
        <button className="text-sm text-primary hover:text-primary/80 font-medium">
          View All →
        </button>
      </div>

      <div className="space-y-3">
        {recentHighlights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No trades yet
          </div>
        ) : (
          recentHighlights.map((trade, idx) => {
            const pnl = trade.pnl || 0;
            const status = Math.abs(pnl) < 0.01 ? 'scratch' : pnl > 0 ? 'win' : 'loss';
            
            return (
              <motion.div
                key={trade.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 bg-muted/20 hover:bg-muted/30 rounded-xl border border-border transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">
                      {new Date(trade.entryTime).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    {status === 'scratch' && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 rounded-full">
                        <MinusCircle className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-yellow-600">Scratch</span>
                      </div>
                    )}
                  </div>
                  <div className={cn(
                    "text-lg font-semibold",
                    pnl > 0 ? "text-green-500" : pnl < 0 ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {formatCurrency(pnl)}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-foreground">{trade.symbol}</span>
                  {trade.rMultiple && (
                    <span className="text-sm text-muted-foreground">
                      {trade.rMultiple.toFixed(1)}R
                    </span>
                  )}
                </div>

                {trade.highlight && (
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {trade.highlight}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ===============================================
// MAIN COMPONENT
// ===============================================

export const AppleAnalyticsDashboard: React.FC = () => {
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const [selectedPeriod, setSelectedPeriod] = React.useState<TimePeriod>('all');
  const [symbolFilter, setSymbolFilter] = React.useState<string | null>(null);

  // Filter trades by account and period
  const filteredTrades = React.useMemo(() => {
    let filtered = selectedAccountId
      ? trades.filter(t => t.accountId === selectedAccountId)
      : trades;

    // Filter by symbol if selected
    if (symbolFilter) {
      filtered = filtered.filter(t => t.symbol === symbolFilter);
    }

    // Filter by time period
    const periodOption = timePeriodOptions.find(opt => opt.value === selectedPeriod);
    if (periodOption?.days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - periodOption.days);
      filtered = filtered.filter(t => new Date(t.entryTime) >= cutoffDate);
    }

    return filtered;
  }, [trades, selectedAccountId, selectedPeriod, symbolFilter]);

  // Calculate previous period trades for comparison
  const previousPeriodTrades = React.useMemo(() => {
    if (selectedPeriod === 'all') return [];
    
    const periodOption = timePeriodOptions.find(opt => opt.value === selectedPeriod);
    if (!periodOption?.days) return [];

    const cutoffStart = new Date();
    cutoffStart.setDate(cutoffStart.getDate() - periodOption.days * 2);
    const cutoffEnd = new Date();
    cutoffEnd.setDate(cutoffEnd.getDate() - periodOption.days);

    return trades.filter(t => {
      const tradeDate = new Date(t.entryTime);
      return tradeDate >= cutoffStart && tradeDate < cutoffEnd;
    });
  }, [trades, selectedPeriod]);

  // Calculate metrics
  const metrics = React.useMemo(() => {
    const calculateMetrics = (tradeList: any[]) => {
      const totalPnL = tradeList.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const winTrades = tradeList.filter(t => (t.pnl || 0) > 0);
      const lossTrades = tradeList.filter(t => (t.pnl || 0) < 0);
      const winRate = tradeList.length > 0 ? (winTrades.length / tradeList.length) * 100 : 0;
      
      const totalWins = winTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const totalLosses = Math.abs(lossTrades.reduce((sum, t) => sum + (t.pnl || 0), 0));
      const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

      return { totalPnL, totalTrades: tradeList.length, winRate, profitFactor };
    };

    const current = calculateMetrics(filteredTrades);
    const previous = calculateMetrics(previousPeriodTrades);

    return { current, previous };
  }, [filteredTrades, previousPeriodTrades]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroAnalyticsPnL
        currentPnL={metrics.current.totalPnL}
        previousPnL={metrics.previous.totalPnL}
        totalTrades={metrics.current.totalTrades}
        winRate={metrics.current.winRate}
        profitFactor={metrics.current.profitFactor}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />

      {/* Symbol Filter Badge (if active) */}
      {symbolFilter && (
        <div className="max-w-7xl 2xl:max-w-[1800px] mx-auto px-6 2xl:px-8 pt-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl border border-primary/20"
          >
            <span className="text-sm font-medium">Filtered by: {symbolFilter}</span>
            <button
              onClick={() => setSymbolFilter(null)}
              className="p-1 hover:bg-primary/20 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl 2xl:max-w-[1800px] mx-auto px-6 2xl:px-8 py-8 space-y-8">
        {/* Your Edge at a Glance */}
        <YourEdgeAtAGlance trades={filteredTrades} />

        {/* Equity Curve */}
        <AnnotatedEquityCurve trades={filteredTrades} />

        {/* Top Symbols */}
        <TopSymbolsSection 
          trades={filteredTrades} 
          onSymbolFilter={setSymbolFilter}
        />

        {/* Trade Highlights */}
        <TradeHighlightsCard trades={filteredTrades} />
      </div>
    </div>
  );
};

export default AppleAnalyticsDashboard;

