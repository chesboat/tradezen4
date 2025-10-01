import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, TrendingUp, TrendingDown, Activity, Calendar, 
  Trophy, AlertTriangle, ChevronDown, ChevronRight, X, ArrowUp, ArrowDown,
  Target, Zap, MinusCircle, Lightbulb, Clock, FileDown, Trash2
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

type TimePeriod = 'all' | '7d' | '1m' | '3m' | '6m' | '1y' | 'custom';

interface SmartInsight {
  id: string;
  type: 'pattern' | 'warning' | 'achievement' | 'tip';
  title: string;
  description: string;
  metric?: string;
  action?: string;
  actionFn?: () => void;
}

interface TimePeriodOption {
  value: TimePeriod;
  label: string;
  days?: number;
}

const timePeriodOptions: TimePeriodOption[] = [
  { value: 'all', label: 'All Time' },
  { value: '7d', label: 'Last 7 Days', days: 7 },
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

        {/* Export Button */}
        <div className="ml-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              // TODO: Implement PDF export
              alert('PDF Export coming soon! This will generate a beautiful report with all your analytics.');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors shadow-lg"
          >
            <FileDown className="w-4 h-4" />
            <span className="text-sm font-medium">Export Report</span>
          </motion.button>
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
// AT A GLANCE WEEKLY SUMMARY (iOS Battery style)
// ===============================================

const AtAGlanceWeekly: React.FC<{ trades: any[] }> = ({ trades }) => {
  const weeklyData = React.useMemo(() => {
    // Get last 7 days
    const days: Array<{
      date: Date;
      dateStr: string;
      dayName: string;
      pnl: number;
      trades: number;
      wins: number;
      losses: number;
      isToday: boolean;
    }> = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTrades = trades.filter(t => {
        const tradeDate = new Date(t.entryTime).toISOString().split('T')[0];
        return tradeDate === dateStr;
      });
      
      const dayPnL = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const dayWins = dayTrades.filter(t => (t.pnl || 0) > 0).length;
      const dayLosses = dayTrades.filter(t => (t.pnl || 0) < 0).length;
      
      days.push({
        date,
        dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        pnl: dayPnL,
        trades: dayTrades.length,
        wins: dayWins,
        losses: dayLosses,
        isToday: dateStr === today.toISOString().split('T')[0]
      });
    }
    
    return days;
  }, [trades]);

  const maxAbsPnL = Math.max(...weeklyData.map(d => Math.abs(d.pnl)), 1);

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Last 7 Days at a Glance</h2>
      </div>

      <div className="space-y-2">
        {weeklyData.map((day, idx) => {
          const barWidth = day.pnl !== 0 ? (Math.abs(day.pnl) / maxAbsPnL) * 100 : 0;
          const isPositive = day.pnl > 0;
          const isNegative = day.pnl < 0;
          
          return (
            <motion.div
              key={day.dateStr}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "flex items-center gap-4 p-3 rounded-lg transition-all duration-200",
                day.isToday && "bg-primary/5 border border-primary/20"
              )}
            >
              {/* Day label */}
              <div className="w-12 flex-shrink-0">
                <div className={cn(
                  "text-sm font-medium",
                  day.isToday ? "text-primary" : "text-muted-foreground"
                )}>
                  {day.dayName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {day.date.getDate()}
                </div>
              </div>

              {/* Bar chart */}
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-8 bg-muted/30 rounded-lg overflow-hidden relative">
                  {day.trades > 0 ? (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className={cn(
                        "h-full rounded-lg flex items-center justify-center",
                        isPositive && "bg-green-500",
                        isNegative && "bg-red-500",
                        !isPositive && !isNegative && "bg-muted"
                      )}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">No trades</span>
                    </div>
                  )}
                </div>

                {/* P&L amount */}
                <div className="w-24 text-right">
                  {day.trades > 0 ? (
                    <div className={cn(
                      "text-sm font-semibold tabular-nums",
                      isPositive && "text-green-500",
                      isNegative && "text-red-500",
                      !isPositive && !isNegative && "text-muted-foreground"
                    )}>
                      {formatCurrency(day.pnl)}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">—</div>
                  )}
                </div>
              </div>

              {/* Win/Loss indicator */}
              {day.trades > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {day.wins > 0 && <span className="text-green-500">✓{day.wins}</span>}
                  {day.losses > 0 && <span className="text-red-500">✗{day.losses}</span>}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Weekly summary */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
        <span className="text-sm text-muted-foreground">7-Day Total</span>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            {weeklyData.reduce((sum, d) => sum + d.trades, 0)} trades
          </span>
          <span className={cn(
            "text-lg font-bold tabular-nums",
            weeklyData.reduce((sum, d) => sum + d.pnl, 0) > 0 
              ? "text-green-500" 
              : weeklyData.reduce((sum, d) => sum + d.pnl, 0) < 0
              ? "text-red-500"
              : "text-muted-foreground"
          )}>
            {formatCurrency(weeklyData.reduce((sum, d) => sum + d.pnl, 0))}
          </span>
        </div>
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

      <div className="relative h-64 rounded-lg overflow-hidden">
        {equityData.data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted/10">
            No trades to display
          </div>
        ) : (
          <svg viewBox={`0 0 ${equityData.data.length} 100`} className="w-full h-full" preserveAspectRatio="none">
            {/* Subtle horizontal grid lines (Apple Health style) */}
            {[25, 50, 75].map(y => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2={equityData.data.length}
                y2={y}
                stroke="currentColor"
                strokeWidth="0.05"
                className="text-muted-foreground opacity-20"
              />
            ))}
            
            {/* Gradient fill under curve (Apple Stocks style) */}
            <defs>
              <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            
            {/* Fill under curve */}
            <polygon
              points={`0,100 ${equityData.data.map((point, idx) => {
                const x = idx;
                const y = 100 - ((point.equity - minEquity) / range) * 100;
                return `${x},${y}`;
              }).join(' ')} ${equityData.data.length},100`}
              fill="url(#equityGradient)"
            />
            
            {/* Equity curve line (thinner, Apple style) */}
            <polyline
              points={equityData.data.map((point, idx) => {
                const x = idx;
                const y = 100 - ((point.equity - minEquity) / range) * 100;
                return `${x},${y}`;
              }).join(' ')}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="0.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-sm"
            />
            
            {/* Biggest win annotation (static dot, no pulse) */}
            {equityData.annotations.biggestWin && (
              <g>
                <circle
                  cx={equityData.annotations.biggestWin.index}
                  cy={100 - ((equityData.annotations.biggestWin.equity - minEquity) / range) * 100}
                  r="0.8"
                  fill="#22c55e"
                  className="drop-shadow"
                />
                <circle
                  cx={equityData.annotations.biggestWin.index}
                  cy={100 - ((equityData.annotations.biggestWin.equity - minEquity) / range) * 100}
                  r="1.5"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="0.15"
                  opacity="0.5"
                />
              </g>
            )}
          </svg>
        )}
      </div>

      {/* Y-axis labels (Apple style) */}
      {equityData.data.length > 0 && (
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{formatCurrency(minEquity)}</span>
          <span>{formatCurrency(maxEquity)}</span>
        </div>
      )}
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Top Performing Symbols</h2>
        </div>
        {topSymbols.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Tap any symbol to filter</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        )}
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
// SMART INSIGHTS (Pattern Detection)
// ===============================================

const SmartInsightsCard: React.FC<{ trades: any[] }> = ({ trades }) => {
  const insights = React.useMemo((): SmartInsight[] => {
    if (trades.length < 5) return [];

    const results: SmartInsight[] = [];

    // Analyze time-of-day performance
    const tradesByHour = new Map<number, { wins: number; losses: number; total: number; pnl: number }>();
    trades.forEach(trade => {
      const hour = new Date(trade.entryTime).getHours();
      const existing = tradesByHour.get(hour) || { wins: 0, losses: 0, total: 0, pnl: 0 };
      existing.total++;
      existing.pnl += (trade.pnl || 0);
      if ((trade.pnl || 0) > 0) existing.wins++;
      if ((trade.pnl || 0) < 0) existing.losses++;
      tradesByHour.set(hour, existing);
    });

    // Find best/worst time windows (morning vs afternoon)
    const morningTrades = trades.filter(t => new Date(t.entryTime).getHours() < 12);
    const afternoonTrades = trades.filter(t => new Date(t.entryTime).getHours() >= 14);
    
    if (morningTrades.length >= 3 && afternoonTrades.length >= 3) {
      const morningWinRate = (morningTrades.filter(t => (t.pnl || 0) > 0).length / morningTrades.length) * 100;
      const afternoonWinRate = (afternoonTrades.filter(t => (t.pnl || 0) > 0).length / afternoonTrades.length) * 100;
      
      if (Math.abs(morningWinRate - afternoonWinRate) > 20) {
        const bestTime = morningWinRate > afternoonWinRate ? 'morning (before 12 PM)' : 'afternoon (after 2 PM)';
        const bestRate = Math.max(morningWinRate, afternoonWinRate);
        const worstTime = morningWinRate > afternoonWinRate ? 'afternoon' : 'morning';
        const worstRate = Math.min(morningWinRate, afternoonWinRate);
        
        results.push({
          id: 'time-pattern',
          type: 'pattern',
          title: '⏰ Time of Day Pattern Detected',
          description: `You win ${bestRate.toFixed(0)}% of trades in the ${bestTime}, but only ${worstRate.toFixed(0)}% in the ${worstTime}`,
          metric: `${(bestRate - worstRate).toFixed(0)}% difference`
        });
      }
    }

    // Analyze symbol consistency
    const symbolStats = new Map<string, { wins: number; total: number; pnl: number }>();
    trades.forEach(trade => {
      const symbol = trade.symbol || 'Unknown';
      const existing = symbolStats.get(symbol) || { wins: 0, total: 0, pnl: 0 };
      existing.total++;
      existing.pnl += (trade.pnl || 0);
      if ((trade.pnl || 0) > 0) existing.wins++;
      symbolStats.set(symbol, existing);
    });

    // Find symbols with high volume but poor performance
    const symbolsArray = Array.from(symbolStats.entries()).map(([symbol, stats]) => ({
      symbol,
      winRate: (stats.wins / stats.total) * 100,
      total: stats.total,
      pnl: stats.pnl
    }));

    const problematicSymbol = symbolsArray.find(s => s.total >= 3 && s.winRate < 40 && s.pnl < 0);
    if (problematicSymbol) {
      results.push({
        id: 'symbol-warning',
        type: 'warning',
        title: `⚠️ ${problematicSymbol.symbol} Underperforming`,
        description: `You've traded ${problematicSymbol.symbol} ${problematicSymbol.total} times with only ${problematicSymbol.winRate.toFixed(0)}% win rate (${formatCurrency(problematicSymbol.pnl)} total)`,
        metric: `Consider avoiding or refining your ${problematicSymbol.symbol} strategy`
      });
    }

    // Analyze win/loss streaks
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    const sortedTrades = [...trades].sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime());
    
    sortedTrades.forEach(trade => {
      if ((trade.pnl || 0) > 0) {
        currentStreak = currentStreak > 0 ? currentStreak + 1 : 1;
        maxWinStreak = Math.max(maxWinStreak, currentStreak);
      } else if ((trade.pnl || 0) < 0) {
        currentStreak = currentStreak < 0 ? currentStreak - 1 : -1;
        maxLossStreak = Math.max(maxLossStreak, Math.abs(currentStreak));
      } else {
        currentStreak = 0;
      }
    });

    if (maxWinStreak >= 5) {
      results.push({
        id: 'streak-achievement',
        type: 'achievement',
        title: '🔥 Impressive Win Streak',
        description: `Your longest winning streak is ${maxWinStreak} trades in a row`,
        metric: 'Keep the momentum going!'
      });
    }

    // Analyze R-multiple consistency
    const tradesWithR = trades.filter(t => t.rMultiple !== undefined);
    if (tradesWithR.length >= 5) {
      const avgR = tradesWithR.reduce((sum, t) => sum + (t.rMultiple || 0), 0) / tradesWithR.length;
      const winningTrades = tradesWithR.filter(t => (t.pnl || 0) > 0);
      const avgWinR = winningTrades.length > 0 
        ? winningTrades.reduce((sum, t) => sum + (t.rMultiple || 0), 0) / winningTrades.length 
        : 0;
      
      if (avgWinR > 2) {
        results.push({
          id: 'r-multiple-tip',
          type: 'achievement',
          title: '🎯 Excellent Risk Management',
          description: `Your average winning trade is ${avgWinR.toFixed(1)}R - you're letting winners run`,
          metric: 'This is professional-level discipline'
        });
      } else if (avgWinR < 1 && winningTrades.length > 3) {
        results.push({
          id: 'r-multiple-warning',
          type: 'tip',
          title: '💡 Room for Improvement',
          description: `Your average winning trade is only ${avgWinR.toFixed(1)}R - consider letting winners run longer`,
          metric: 'Target: 2R+ on winning trades'
        });
      }
    }

    // If no patterns found, show encouragement
    if (results.length === 0 && trades.length >= 10) {
      const winRate = (trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100;
      results.push({
        id: 'consistency',
        type: 'achievement',
        title: '📊 Consistent Trading',
        description: `You're maintaining a ${winRate.toFixed(0)}% win rate across ${trades.length} trades`,
        metric: 'Keep analyzing and refining'
      });
    }

    return results.slice(0, 2); // Show max 2 insights
  }, [trades]);

  if (insights.length === 0) return null;

  const getInsightIcon = (type: SmartInsight['type']) => {
    switch (type) {
      case 'pattern': return <Lightbulb className="w-5 h-5 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'achievement': return <Trophy className="w-5 h-5 text-green-500" />;
      case 'tip': return <Target className="w-5 h-5 text-purple-500" />;
    }
  };

  const getInsightBg = (type: SmartInsight['type']) => {
    switch (type) {
      case 'pattern': return 'bg-blue-500/10 border-blue-500/20';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/20';
      case 'achievement': return 'bg-green-500/10 border-green-500/20';
      case 'tip': return 'bg-purple-500/10 border-purple-500/20';
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Smart Insights</h2>
      </div>

      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "p-4 rounded-xl border transition-all duration-200",
              getInsightBg(insight.type)
            )}
          >
            <div className="flex items-start gap-3">
              {getInsightIcon(insight.type)}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-1">{insight.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                  {insight.description}
                </p>
                {insight.metric && (
                  <div className="text-xs font-medium text-foreground/70">
                    {insight.metric}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// ===============================================
// TRADE HIGHLIGHTS (Card-based, not table)
// ===============================================

const TradeHighlightsCard: React.FC<{ trades: any[] }> = ({ trades }) => {
  const { deleteTrade } = useTradeStore();
  const [hoveredTradeId, setHoveredTradeId] = React.useState<string | null>(null);

  const recentHighlights = React.useMemo(() => {
    return trades
      .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
      .slice(0, 5)
      .map(trade => {
        // Apple's approach: Prioritize trade-specific notes over general reflections
        // 1. Trade notes (most specific)
        // 2. Trade tags (context clues)
        // 3. Nothing (clean card)
        let highlight = '';
        
        if (trade.notes && trade.notes.trim()) {
          highlight = trade.notes;
        } else if (trade.tags && trade.tags.length > 0) {
          // Show tags as context
          highlight = trade.tags.slice(0, 3).join(' • ');
        }
        
        return { ...trade, highlight };
      });
  }, [trades]);

  const handleDelete = (trade: any) => {
    if (window.confirm(`Delete ${trade.symbol} trade (${formatCurrency(trade.pnl || 0)})?`)) {
      deleteTrade(trade.id);
    }
  };

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
                onMouseEnter={() => setHoveredTradeId(trade.id)}
                onMouseLeave={() => setHoveredTradeId(null)}
                className="relative group p-4 bg-muted/20 hover:bg-muted/30 rounded-xl border border-border transition-all duration-200"
              >
                {/* Quick Action - Delete (shown on hover) */}
                <AnimatePresence>
                  {hoveredTradeId === trade.id && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(trade);
                      }}
                      className="absolute top-3 right-3 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-all duration-200 z-10"
                      title="Delete trade"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                </AnimatePresence>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Direction indicator */}
                    <div className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      trade.direction === 'long' 
                        ? "bg-green-500/10 text-green-600" 
                        : "bg-red-500/10 text-red-600"
                    )}>
                      {trade.direction === 'long' ? '↑ Long' : '↓ Short'}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {new Date(trade.entryTime).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })}
                      <span className="mx-1">•</span>
                      {new Date(trade.entryTime).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
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
                    "text-lg font-semibold tabular-nums",
                    pnl > 0 ? "text-green-500" : pnl < 0 ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {formatCurrency(pnl)}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-foreground text-lg">{trade.symbol}</span>
                  {trade.rMultiple !== undefined && (
                    <span className={cn(
                      "text-sm font-medium px-2 py-0.5 rounded",
                      trade.rMultiple >= 0 
                        ? "bg-green-500/10 text-green-600" 
                        : "bg-red-500/10 text-red-600"
                    )}>
                      {trade.rMultiple > 0 ? '+' : ''}{trade.rMultiple.toFixed(1)}R
                    </span>
                  )}
                </div>

                {trade.highlight && (
                  <div className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
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

      {/* Symbol Filter Badge (Sticky, always visible when active) */}
      <AnimatePresence>
        {symbolFilter && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-20 right-6 z-50"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl shadow-xl border border-primary/20">
              <span className="text-sm font-medium">Viewing: {symbolFilter}</span>
              <button
                onClick={() => setSymbolFilter(null)}
                className="p-1 hover:bg-primary-foreground/20 rounded-full transition-colors"
                aria-label="Clear filter"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl 2xl:max-w-[1800px] mx-auto px-6 2xl:px-8 py-8 space-y-8">
        {/* Your Edge at a Glance */}
        <YourEdgeAtAGlance trades={filteredTrades} />

        {/* Smart Insights */}
        <SmartInsightsCard trades={filteredTrades} />

        {/* At a Glance Weekly */}
        <AtAGlanceWeekly trades={filteredTrades} />

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

