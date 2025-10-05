import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, TrendingUp, TrendingDown, Activity, Calendar, 
  Trophy, AlertTriangle, ChevronDown, ChevronRight, X, ArrowUp, ArrowDown,
  Target, Zap, MinusCircle, Lightbulb, Clock, Trash2, Lock, Sparkles, Info
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useAnalyticsFilterStore } from '@/store/useAnalyticsFilterStore';
import { computeEdgeScore } from '@/lib/edgeScore';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn, summarizeWinLossScratch, classifyTradeResult } from '@/lib/utils';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { useTodoStore } from '@/store/useTodoStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useSubscription } from '@/hooks/useSubscription';
import { SetupAnalytics } from './SetupAnalytics';
import { CalendarHeatmap } from './CalendarHeatmap';
import { CustomDateRangePicker } from './CustomDateRangePicker';
import { TimeIntelligence } from './TimeIntelligence';
import { UpgradeModal } from './UpgradeModal';
import { hasFeature } from '@/lib/tierLimits';
import { calculateTradingHealth } from '@/lib/tradingHealth/metricsEngine';

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
  expectancy: number;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  selectedPeriod: string;
  customStartDate: Date | null;
  customEndDate: Date | null;
  hasCustomDateRanges: boolean;
  onPeriodChange: (period: TimePeriod) => void;
  onOpenCustomPicker: () => void;
  onUpgradeClick: (feature: string) => void;
}> = ({ currentPnL, previousPnL, expectancy, totalTrades, winRate, profitFactor, selectedPeriod, customStartDate, customEndDate, hasCustomDateRanges, onPeriodChange, onOpenCustomPicker, onUpgradeClick }) => {
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

  let selectedLabel = timePeriodOptions.find(opt => opt.value === selectedPeriod)?.label || 'All Time';
  
  // Custom date range label
  if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
    const start = customStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = customEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    selectedLabel = `${start} - ${end}`;
  }

  return (
    <div className="bg-background border-b border-border">
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
                
                {/* Custom Date Range (Premium) */}
                <div className="border-t border-border">
                  {hasCustomDateRanges ? (
                    <button
                      onClick={() => {
                        onOpenCustomPicker();
                        setDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between",
                        selectedPeriod === 'custom'
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-muted/50"
                      )}
                    >
                      <span>Custom Range</span>
                      <Calendar className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      className="w-full px-4 py-3 text-left text-sm text-muted-foreground hover:bg-muted/50 transition-colors flex items-center justify-between"
                      onClick={() => {
                        setDropdownOpen(false);
                        onUpgradeClick('Custom Date Ranges');
                      }}
                    >
                      <span>Custom Range</span>
                      <Lock className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hero P&L */}
        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
          <div>
            <h1 className={cn(
              "text-4xl sm:text-5xl md:text-6xl 2xl:text-7xl font-bold tabular-nums tracking-tight",
              isPositive ? "text-green-500" : currentPnL < 0 ? "text-red-500" : "text-muted-foreground"
            )}>
              {formatCurrency(currentPnL)}
            </h1>
            
            {/* Comparison vs Previous Period - Apple subtle style */}
            {hasComparison && (
              <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 mt-2"
              >
                <span className={cn(
                  "text-sm font-medium",
                  percentChange >= 0 ? "text-green-500/80" : "text-red-500/80"
                )}>
                  {percentChange >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(currentPnL - previousPnL))}
                </span>
                <span className="text-sm text-muted-foreground/70">vs last period</span>
              </motion.div>
            )}

            {/* Expectancy - Apple-style predictive metric */}
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 mt-3"
            >
              <Zap className="w-4 h-4 text-primary" />
              <span className={cn(
                "text-lg sm:text-xl font-semibold",
                expectancy > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {formatCurrency(expectancy)}
              </span>
              <span className="text-sm text-muted-foreground">expectancy/trade</span>
            </motion.div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4 sm:gap-6 md:gap-8 md:pb-2">
            <div>
              <div className="text-xl sm:text-2xl font-semibold text-foreground">{totalTrades}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">trades</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-semibold text-foreground">{winRate.toFixed(0)}%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">win rate</div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-semibold text-foreground">{profitFactor.toFixed(1)}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">profit factor</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===============================================
// APPLE-STYLE METRIC TOOLTIP
// ===============================================

interface MetricTooltipProps {
  title: string;
  explanation: string;
  currentState: string;
  improvementTip?: string;
  children: React.ReactNode;
}

const MetricTooltip: React.FC<MetricTooltipProps> = ({ title, explanation, currentState, improvementTip, children }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const tooltipRef = React.useRef<HTMLDivElement>(null);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center" ref={tooltipRef}>
      {children}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="ml-1.5 text-muted-foreground/60 hover:text-primary transition-colors cursor-help"
        aria-label={`Info about ${title}`}
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 top-full mt-2 w-72 bg-popover border border-border rounded-xl shadow-2xl p-4 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-semibold text-foreground">{title}</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {/* Explanation */}
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              {explanation}
            </p>
            
            {/* Current State */}
            <div className="bg-muted/30 rounded-lg p-2.5 mb-3">
              <p className="text-xs font-medium text-foreground">
                {currentState}
              </p>
            </div>
            
            {/* Improvement Tip */}
            {improvementTip && (
              <div className="flex items-start gap-2 bg-primary/5 rounded-lg p-2.5">
                <Lightbulb className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-foreground leading-relaxed">
                  {improvementTip}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
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
  tooltip?: {
    title: string;
    explanation: string;
    currentState: string;
    improvementTip?: string;
  };
}

const EdgeBar: React.FC<EdgeMetric & { onClick?: () => void }> = ({
  label,
  value,
  max,
  status,
  description,
  actionText,
  onClick,
  tooltip
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
    <motion.div
      className={cn(
        "w-full text-left p-4 rounded-xl transition-all duration-200",
        onClick && "hover:bg-muted/30 hover:scale-[1.01] cursor-pointer"
      )}
      whileTap={onClick ? { scale: 0.99 } : {}}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {tooltip ? (
            <MetricTooltip {...tooltip}>
          <span className="text-sm font-medium text-foreground">{label}</span>
            </MetricTooltip>
          ) : (
            <span className="text-sm font-medium text-foreground">{label}</span>
          )}
          <span className="text-xs">{statusIcons[status]}</span>
        </div>
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {label === 'Expectancy' ? formatCurrency(value) : 
           label === 'Win Rate' ? `${value.toFixed(1)}%` :
           label === 'Profit Factor' ? `${value.toFixed(2)}` :
           label === 'Max Drawdown' ? `${value.toFixed(1)}%` :
           value.toFixed(0)}
        </span>
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
    </motion.div>
  );
};

const YourEdgeAtAGlance: React.FC<{ trades: any[] }> = ({ trades }) => {
  const edge = React.useMemo(() => computeEdgeScore(trades), [trades]);

  // Calculate ACTUAL metrics (not scores) - Apple shows real values, not abstract scores
  const actualMetrics = React.useMemo(() => {
    if (trades.length === 0) {
      return {
        expectancy: 0,
        winRate: 0,
        profitFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        maxDrawdown: 0
      };
    }

    const { wins: winCount, losses: lossCount, winRateExclScratches } = summarizeWinLossScratch(trades);
    
    // Use classifyTradeResult for consistent classification
    const winningTrades = trades.filter((t: any) => classifyTradeResult(t) === 'win');
    const losingTrades = trades.filter((t: any) => classifyTradeResult(t) === 'loss');
    
    const grossProfit = winningTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0));
    
    const avgWin = winCount > 0 ? grossProfit / winCount : 0;
    const avgLoss = lossCount > 0 ? grossLoss / lossCount : 0;
    
    // ACTUAL profit factor (not a score)
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99 : 0);
    
    // Dollar-based expectancy
    const expectancy = (winRateExclScratches / 100) * avgWin - (1 - winRateExclScratches / 100) * avgLoss;
    
    // Calculate max drawdown %
    let equity = 0;
    let peak = 0;
    let maxDD = 0;
    trades.forEach((t: any) => {
      equity += (t.pnl || 0);
      if (equity > peak) peak = equity;
      if (peak > 0) maxDD = Math.max(maxDD, ((peak - equity) / peak) * 100);
    });
    
    return {
      expectancy,
      winRate: winRateExclScratches,
      profitFactor,
      avgWin,
      avgLoss,
      maxDrawdown: maxDD
    };
  }, [trades]);

  // Apple approach: Clear, ACTUAL metrics (not abstract scores)
  const metrics: EdgeMetric[] = [
    {
      label: 'Expectancy',
      value: Math.abs(actualMetrics.expectancy),
      max: Math.max(100, Math.abs(actualMetrics.expectancy) * 1.5),
      status: actualMetrics.expectancy > 50 ? 'excellent' : actualMetrics.expectancy > 20 ? 'good' : actualMetrics.expectancy > 0 ? 'warning' : 'danger',
      description: `${formatCurrency(actualMetrics.expectancy)} per trade`,
      tooltip: {
        title: 'Expectancy',
        explanation: 'Your expected profit per trade based on your win rate and average win/loss sizes. This is the most important metric for long-term profitability.',
        currentState: actualMetrics.expectancy > 50 
          ? `Outstanding! Your ${formatCurrency(actualMetrics.expectancy)} expectancy means you're extremely profitable.`
          : actualMetrics.expectancy > 20
          ? `Great work! Your ${formatCurrency(actualMetrics.expectancy)} expectancy shows strong profitability.`
          : actualMetrics.expectancy > 0
          ? `You're profitable at ${formatCurrency(actualMetrics.expectancy)} per trade, but there's room to grow.`
          : `Negative expectancy (${formatCurrency(actualMetrics.expectancy)}) means you're losing money over time.`,
        improvementTip: actualMetrics.expectancy > 50
          ? undefined
          : actualMetrics.expectancy > 20
          ? 'To reach excellence: Increase your average win size by letting winners run longer, or improve your entry timing to boost win rate.'
          : actualMetrics.expectancy > 0
          ? 'Focus on two things: 1) Cut losing trades faster to reduce avg loss, 2) Let winners run to increase avg win. Even small improvements compound dramatically.'
          : 'Critical: Review your strategy immediately. Focus on proper risk management, better entry signals, and cutting losses quickly. Consider reducing position size while you rebuild your edge.'
      }
    },
    {
      label: 'Win Rate',
      value: actualMetrics.winRate,
      max: 100,
      status: actualMetrics.winRate >= 60 ? 'excellent' : actualMetrics.winRate >= 50 ? 'good' : actualMetrics.winRate >= 40 ? 'warning' : 'danger',
      description: `${actualMetrics.winRate.toFixed(1)}% of trades`,
      tooltip: {
        title: 'Win Rate',
        explanation: 'The percentage of your trades that are profitable. Note: A lower win rate can still be profitable if your winners are much bigger than your losers.',
        currentState: actualMetrics.winRate >= 60
          ? `Excellent! Your ${actualMetrics.winRate.toFixed(1)}% win rate is well above average.`
          : actualMetrics.winRate >= 50
          ? `Good! Your ${actualMetrics.winRate.toFixed(1)}% win rate is solid and sustainable.`
          : actualMetrics.winRate >= 40
          ? `Your ${actualMetrics.winRate.toFixed(1)}% win rate is below average but can still be profitable with proper risk/reward.`
          : `Your ${actualMetrics.winRate.toFixed(1)}% win rate is concerning and needs improvement.`,
        improvementTip: actualMetrics.winRate >= 60
          ? undefined
          : actualMetrics.winRate >= 50
          ? 'To reach excellence: Tighten your entry criteria and wait for higher-probability setups. Quality over quantity.'
          : actualMetrics.winRate >= 40
          ? 'You can still be profitable! Focus on risk/reward. Make sure your winners are at least 2x your losers. Review your best setups and stick to them.'
          : 'Review your trading journal to identify your highest win-rate setups and time periods. Eliminate low-probability trades and focus only on your best opportunities.'
      }
    },
    {
      label: 'Profit Factor',
      value: actualMetrics.profitFactor,
      max: 3,
      status: actualMetrics.profitFactor >= 2 ? 'excellent' : actualMetrics.profitFactor >= 1.5 ? 'good' : actualMetrics.profitFactor >= 1 ? 'warning' : 'danger',
      description: `${actualMetrics.profitFactor.toFixed(2)}:1 ratio`,
      tooltip: {
        title: 'Profit Factor',
        explanation: 'How much money you make for every dollar you lose. For example, 2.0 means you make $2 for every $1 lost. Above 1.0 is profitable, above 2.0 is excellent.',
        currentState: actualMetrics.profitFactor >= 2
          ? `Excellent! Your ${actualMetrics.profitFactor.toFixed(2)} profit factor means you make $${actualMetrics.profitFactor.toFixed(2)} for every $1 lost.`
          : actualMetrics.profitFactor >= 1.5
          ? `Good! Your ${actualMetrics.profitFactor.toFixed(2)} profit factor shows healthy profitability.`
          : actualMetrics.profitFactor >= 1
          ? `You're profitable (${actualMetrics.profitFactor.toFixed(2)}), but barely. Small improvements will make a big difference.`
          : `Critical: Your profit factor of ${actualMetrics.profitFactor.toFixed(2)} means you're losing money overall.`,
        improvementTip: actualMetrics.profitFactor >= 2
          ? undefined
          : actualMetrics.profitFactor >= 1.5
          ? 'To reach excellence: Focus on asymmetric risk/reward. Target 3:1 or better on your setups and use trailing stops to capture bigger moves.'
          : actualMetrics.profitFactor >= 1
          ? 'Quick wins: 1) Cut losses at 1R consistently, 2) Trail winners to 2R or more, 3) Eliminate revenge trades and trades outside your plan.'
          : 'Emergency action needed: Your losses exceed your wins. Stop trading your current strategy. Review every trade, identify patterns in your losses, and rebuild with strict risk management (never risk more than 1% per trade).'
      }
    },
    {
      label: 'Max Drawdown',
      value: actualMetrics.maxDrawdown,
      max: 50,
      status: actualMetrics.maxDrawdown <= 15 ? 'excellent' : actualMetrics.maxDrawdown <= 25 ? 'good' : actualMetrics.maxDrawdown <= 35 ? 'warning' : 'danger',
      description: `${actualMetrics.maxDrawdown.toFixed(1)}% peak loss`,
      tooltip: {
        title: 'Max Drawdown',
        explanation: 'The largest percentage decline from your equity peak. This shows your worst losing streak. Lower is better.',
        currentState: actualMetrics.maxDrawdown <= 15
          ? `Excellent! Your ${actualMetrics.maxDrawdown.toFixed(1)}% max drawdown shows strong risk control.`
          : actualMetrics.maxDrawdown <= 25
          ? `Good! Your ${actualMetrics.maxDrawdown.toFixed(1)}% max drawdown is manageable.`
          : actualMetrics.maxDrawdown <= 35
          ? `Your ${actualMetrics.maxDrawdown.toFixed(1)}% drawdown is concerning. Tighten risk management.`
          : `Critical! Your ${actualMetrics.maxDrawdown.toFixed(1)}% drawdown is too high. You're risking too much.`,
        improvementTip: actualMetrics.maxDrawdown <= 15
          ? undefined
          : actualMetrics.maxDrawdown <= 25
          ? 'To improve: Use smaller position sizes and set stricter stop losses. Never risk more than 1-2% per trade.'
          : 'Immediate action: Cut your position sizes in half. Set hard stop losses on every trade. Take a break after 2 consecutive losses.'
      }
    }
  ];

  return null; // Removed - replaced with TradingHealthPreviewCard below
};

// ===============================================
// TRADING HEALTH PREVIEW (Gateway to Full View)
// ===============================================

const TradingHealthPreviewCard: React.FC<{ trades: any[] }> = ({ trades }) => {
  const navigate = useNavigationStore(state => state.setView);
  const { selectedAccountId, accounts } = useAccountFilterStore();
  
  // Import the same calculation logic from Trading Health
  const selectedAccount = React.useMemo(() => {
    if (!selectedAccountId || selectedAccountId === 'all') return null;
    return accounts.find(acc => acc.id === selectedAccountId);
  }, [selectedAccountId, accounts]);

  const filteredTrades = React.useMemo(() => {
    if (!selectedAccountId || selectedAccountId === 'all') {
      return trades;
    }
    
    const account = accounts.find(acc => acc.id === selectedAccountId);
    
    if (account?.isGroup && account.groupId) {
      const groupAccounts = accounts.filter(acc => 
        acc.groupId === account.groupId && !acc.isGroup
      );
      const groupIds = groupAccounts.map(acc => acc.id);
      return trades.filter(t => groupIds.includes(t.accountId));
    }
    
    return trades.filter(t => t.accountId === selectedAccountId);
  }, [trades, selectedAccountId, accounts]);

  const metrics = React.useMemo(() => {
    const accountBalance = selectedAccount?.balance;
    return calculateTradingHealth(filteredTrades, '30d', accountBalance);
  }, [filteredTrades, selectedAccount]);

  const overallScore = Math.round((metrics.edge.value + metrics.consistency.value + metrics.riskControl.value) / 3);
  const overallStatus = overallScore >= 70 ? 'excellent' : overallScore >= 50 ? 'good' : overallScore >= 30 ? 'warning' : 'critical';
  
  const statusText = {
    excellent: 'Excellent',
    good: 'Good',
    warning: 'Needs Work',
    critical: 'Critical'
  };

  const statusColors = {
    excellent: 'text-green-500',
    good: 'text-blue-500',
    warning: 'text-yellow-500',
    critical: 'text-red-500'
  };

  // Mini ring component
  const MiniRing: React.FC<{ value: number; goal: number; color: string; label: string }> = ({ value, goal, color, label }) => {
    const percentage = Math.min((value / goal) * 100, 100);
    const circumference = 2 * Math.PI * 28;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative w-16 h-16">
          <svg className="w-full h-full -rotate-90">
            {/* Background */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="5"
              fill="none"
              className="text-muted/20"
            />
            {/* Progress */}
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              stroke={color}
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-foreground">{value}</span>
            </div>
          </div>
        <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      </div>
    );
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-card via-card to-primary/5 border border-border rounded-2xl p-6 cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
      onClick={() => navigate('health')}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Trading Health</h2>
            <p className="text-xs text-muted-foreground">30-day rolling window</p>
        </div>
      </div>

        {/* Overall Score Badge */}
        <div className="text-right">
          <div className="text-3xl font-bold text-foreground tabular-nums">{overallScore}</div>
          <div className={cn('text-xs font-semibold', statusColors[overallStatus])}>{statusText[overallStatus]}</div>
      </div>
    </div>

      {/* 3 Mini Rings */}
      <div className="flex items-center justify-center gap-6 sm:gap-10 mb-6">
        <MiniRing
          value={metrics.edge.value}
          goal={metrics.edge.goal}
          color="#FF375F"
          label="Edge"
        />
        <MiniRing
          value={metrics.consistency.value}
          goal={metrics.consistency.goal}
          color="#7AFF45"
          label="Consistency"
        />
        <MiniRing
          value={metrics.riskControl.value}
          goal={metrics.riskControl.goal}
          color="#0AFFFE"
          label="Risk Control"
        />
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">View Full Health Report</span>
          {metrics.consistency.currentStreak >= 3 && (
            <span className="text-xs px-2 py-0.5 bg-orange-500/10 text-orange-500 rounded-full flex items-center gap-1">
              🔥 {metrics.consistency.currentStreak} day streak
            </span>
          )}
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
    </motion.div>
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
    <div className="bg-background border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-base font-medium text-foreground">Last 7 Days</h2>
        </div>
        {/* Weekly summary inline */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {weeklyData.reduce((sum, d) => sum + d.trades, 0)} trades
          </span>
          <span className={cn(
            "text-sm font-semibold tabular-nums",
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

      <div className="space-y-1.5">
        {weeklyData.map((day, idx) => {
          const barWidth = day.pnl !== 0 ? (Math.abs(day.pnl) / maxAbsPnL) * 100 : 0;
          const isPositive = day.pnl > 0;
          const isNegative = day.pnl < 0;
          
          return (
            <motion.div
              key={day.dateStr}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              {/* Day label - minimal */}
              <div className="w-10 flex-shrink-0">
                <div className={cn(
                  "text-xs",
                  day.isToday ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {day.dayName}
                </div>
              </div>

              {/* Bar chart - thin and subtle */}
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden relative">
                  {day.trades > 0 ? (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.4, delay: idx * 0.03, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full",
                        isPositive && "bg-green-500/60",
                        isNegative && "bg-red-500/60",
                        !isPositive && !isNegative && "bg-muted/40"
                      )}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted/10 rounded-full" />
                  )}
                </div>

                {/* P&L amount - subtle */}
                <div className="w-20 text-right">
                  {day.trades > 0 ? (
                    <div className={cn(
                      "text-xs font-medium tabular-nums",
                      isPositive && "text-green-500/80",
                      isNegative && "text-red-500/80",
                      !isPositive && !isNegative && "text-muted-foreground"
                    )}>
                      {formatCurrency(day.pnl)}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground/50">—</div>
                  )}
                </div>
              </div>

              {/* Win/Loss indicator - minimal */}
              {day.trades > 0 && (
                <div className="w-12 flex items-center justify-end gap-1 text-[10px] text-muted-foreground/60">
                  {day.wins > 0 && <span className="text-green-500/70">{day.wins}W</span>}
                  {day.losses > 0 && <span className="text-red-500/70">{day.losses}L</span>}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ===============================================
// EQUITY CURVE WITH ANNOTATIONS
// ===============================================

const AnnotatedEquityCurve: React.FC<{ 
  trades: any[];
  activityLogExpanded?: boolean;
  todoExpanded?: boolean;
}> = ({ trades, activityLogExpanded = false, todoExpanded = false }) => {
  const [hoveredPoint, setHoveredPoint] = React.useState<{ index: number; x: number; y: number; equity: number; date: Date; pnl: number; symbol: string } | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || equityData.data.length === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const percentX = (mouseX / rect.width) * 100;
    
    // Find nearest data point
    const index = Math.round((percentX / 100) * (equityData.data.length - 1));
    const clampedIndex = Math.max(0, Math.min(index, equityData.data.length - 1));
    const point = equityData.data[clampedIndex];
    
    const x = (clampedIndex / (equityData.data.length - 1)) * 100;
    const y = 40 - ((point.equity - minEquity) / range) * 38;
    
    setHoveredPoint({
      index: clampedIndex,
      x,
      y,
      equity: point.equity,
      date: point.date,
      pnl: point.pnl,
      symbol: point.symbol
    });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="bg-background border border-border rounded-2xl p-6 overflow-visible">
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

      <div 
        ref={containerRef}
        className="relative h-64 rounded-lg overflow-visible cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {equityData.data.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted/10 rounded-lg">
            No trades to display
          </div>
        ) : (
          <>
            <svg 
              ref={svgRef}
              viewBox="0 0 100 40" 
              className="w-full h-full" 
              preserveAspectRatio="none"
            >
            {/* Subtle horizontal grid lines (Apple Health style) */}
            {[10, 20, 30].map(y => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                strokeWidth="0.1"
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
              points={`0,40 ${equityData.data.map((point, idx) => {
                const x = (idx / (equityData.data.length - 1)) * 100;
                const y = 40 - ((point.equity - minEquity) / range) * 38; // Leave 2 units padding (5%)
                return `${x},${y}`;
              }).join(' ')} 100,40`}
              fill="url(#equityGradient)"
            />
            
            {/* Equity curve line (smooth with cubic bezier) */}
            <path
              d={(() => {
                if (equityData.data.length === 0) return '';
                
                // Start point
                const firstPoint = equityData.data[0];
                const firstX = 0;
                const firstY = 40 - ((firstPoint.equity - minEquity) / range) * 38;
                let path = `M ${firstX},${firstY}`;
                
                // Create smooth curve using cubic bezier
                for (let i = 1; i < equityData.data.length; i++) {
                  const curr = equityData.data[i];
                  const prev = equityData.data[i - 1];
                  
                  const currX = (i / (equityData.data.length - 1)) * 100;
                  const currY = 40 - ((curr.equity - minEquity) / range) * 38;
                  const prevX = ((i - 1) / (equityData.data.length - 1)) * 100;
                  const prevY = 40 - ((prev.equity - minEquity) / range) * 38;
                  
                  // Control points for smooth curve (Apple style)
                  const cp1x = prevX + (currX - prevX) * 0.5;
                  const cp1y = prevY;
                  const cp2x = prevX + (currX - prevX) * 0.5;
                  const cp2y = currY;
                  
                  path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${currX},${currY}`;
                }
                
                return path;
              })()}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="drop-shadow-sm"
            />
            
            {/* Hover crosshair (Apple Stocks style) */}
            {hoveredPoint && (
              <line
                x1={hoveredPoint.x}
                y1="0"
                x2={hoveredPoint.x}
                y2="40"
                stroke="hsl(var(--primary))"
                strokeWidth="0.3"
                opacity="0.5"
                className="pointer-events-none"
              />
            )}
          </svg>

          {/* Biggest win dot (HTML for perfect circle) */}
          {equityData.annotations.biggestWin && (() => {
            const winX = (equityData.annotations.biggestWin.index / (equityData.data.length - 1)) * 100;
            const winY = 40 - ((equityData.annotations.biggestWin.equity - minEquity) / range) * 38;
            const winYPercent = (winY / 40) * 100;
            
            return (
              <div 
                className="absolute pointer-events-none"
                style={{
                  left: `${winX}%`,
                  top: `${winYPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Outer glow ring */}
                <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-500 opacity-20 -translate-x-1/2 -translate-y-1/2 blur-sm" />
                {/* Main dot */}
                <div className="absolute w-2.5 h-2.5 rounded-full bg-green-500 -translate-x-1/2 -translate-y-1/2 shadow-sm" />
                {/* Inner white dot (Apple signature) */}
                <div className="absolute w-1 h-1 rounded-full bg-white opacity-80 -translate-x-1/2 -translate-y-1/2" />
              </div>
            );
          })()}

          {/* Hover dot (HTML for perfect circle) */}
          {hoveredPoint && (
            <div 
              className="absolute pointer-events-none"
              style={{
                left: `${hoveredPoint.x}%`,
                top: `${(hoveredPoint.y / 40) * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-3 h-3 rounded-full bg-primary border-2 border-background shadow-lg" />
            </div>
          )}

          {/* Hover tooltip (Apple Stocks style with smart positioning) */}
          <AnimatePresence>
            {hoveredPoint && (() => {
              // Ultra aggressive threshold - flip very early
              const isNearLeftEdge = hoveredPoint.x < 20;
              const isNearRightEdge = hoveredPoint.x > 60; // Flip after 60%
              
              let positionStyle: React.CSSProperties = {
                left: `${hoveredPoint.x}%`,
                transform: 'translateX(-50%)',
                marginTop: '-3.5rem'
              };
              
              if (isNearRightEdge) {
                // Flip tooltip to the LEFT - keep it well within chart bounds
                positionStyle = {
                  left: `${hoveredPoint.x}%`,
                  transform: 'translateX(-100%)',
                  marginTop: '-3.5rem',
                  marginLeft: '-1rem' // Extra space from cursor
                };
              } else if (isNearLeftEdge) {
                // Flip tooltip to the RIGHT
                positionStyle = {
                  left: `${hoveredPoint.x}%`,
                  transform: 'translateX(0%)',
                  marginTop: '-3.5rem',
                  marginLeft: '1rem'
                };
              }
              
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-0 left-0 bg-background/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-xl pointer-events-none z-[9999]"
                  style={positionStyle}
                >
                  <div className="text-xs text-muted-foreground mb-1 whitespace-nowrap">
                    {hoveredPoint.date.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="space-y-1">
                    <div className={cn(
                      "text-sm font-bold whitespace-nowrap",
                      hoveredPoint.pnl > 0 ? "text-green-500" : hoveredPoint.pnl < 0 ? "text-red-500" : "text-muted-foreground"
                    )}>
                      {formatCurrency(hoveredPoint.pnl)} • {hoveredPoint.symbol}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      Equity: <span className="text-foreground font-semibold">{formatCurrency(hoveredPoint.equity)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </>
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
    <div className="bg-background border border-border rounded-2xl p-6">
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

    return results.slice(0, 1); // Apple approach: Show ONE most important insight
  }, [trades]);

  if (insights.length === 0) return null;

  const insight = insights[0]; // Get the single most important insight

  const getInsightIcon = (type: SmartInsight['type']) => {
    switch (type) {
      case 'pattern': return '💡';
      case 'warning': return '⚠️';
      case 'achievement': return '✨';
      case 'tip': return '🎯';
    }
  };

  const getInsightBg = (type: SmartInsight['type']) => {
    switch (type) {
      case 'pattern': return 'from-blue-500/10 to-blue-500/5 border-blue-500/20';
      case 'warning': return 'from-yellow-500/10 to-yellow-500/5 border-yellow-500/20';
      case 'achievement': return 'from-green-500/10 to-green-500/5 border-green-500/20';
      case 'tip': return 'from-purple-500/10 to-purple-500/5 border-purple-500/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "bg-gradient-to-br border rounded-2xl p-6",
        getInsightBg(insight.type)
      )}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">{getInsightIcon(insight.type)}</div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground/60 uppercase tracking-wide mb-1">
            {insight.type === 'pattern' ? 'Pattern Detected' :
             insight.type === 'warning' ? 'Attention Needed' :
             insight.type === 'achievement' ? 'Nice Work' : 'Tip'}
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2 leading-tight">
            {insight.title.replace(/^[^\s]+\s/, '')} {/* Remove emoji from title */}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {insight.description}
          </p>
          {insight.metric && (
            <div className="text-xs font-medium text-foreground/70 bg-background/50 rounded-lg px-3 py-2 inline-block">
              {insight.metric}
            </div>
          )}
        </div>
      </div>
    </motion.div>
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
      .slice(0, 3) // Apple approach: Show top 3 only
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
    <div className="bg-background border border-border rounded-2xl p-6">
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
// WHAT'S NEXT (Actionable suggestions)
// ===============================================

const WhatsNextCard: React.FC<{ trades: any[] }> = ({ trades }) => {
  const { setCurrentView } = useNavigationStore();
  
  const suggestion = React.useMemo(() => {
    if (trades.length === 0) {
      return {
        title: "Log your first trade",
        description: "Start tracking your performance to unlock insights and identify your edge.",
        action: "Log Trade",
        actionFn: () => setCurrentView('trades')
      };
    }

    if (trades.length < 10) {
      return {
        title: "Build your sample size",
        description: `You have ${trades.length} trades logged. Get to 20+ to see meaningful patterns emerge.`,
        action: "Log More Trades",
        actionFn: () => setCurrentView('trades')
      };
    }

    // Check for recent trading (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentTrades = trades.filter(t => new Date(t.entryTime) >= weekAgo);

    if (recentTrades.length === 0) {
      return {
        title: "Time to reflect",
        description: "No trades in the past week. Review your performance and plan your next session.",
        action: "View Journal",
        actionFn: () => setCurrentView('journal')
      };
    }

    // Check for notes/reflections
    const tradesWithNotes = trades.filter(t => t.notes && t.notes.trim()).length;
    const notesRatio = tradesWithNotes / trades.length;

    if (notesRatio < 0.3) {
      return {
        title: "Add more context",
        description: `Only ${(notesRatio * 100).toFixed(0)}% of your trades have notes. Capturing your thought process helps you improve faster.`,
        action: "Review Trades",
        actionFn: () => setCurrentView('trades')
      };
    }

    // Default: Review and refine
    return {
      title: "Review your patterns",
      description: "You have enough data. Look for what's working and double down on your edge.",
      action: "View Analytics",
      actionFn: () => {} // Already on analytics
    };
  }, [trades, setCurrentView]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-xs text-muted-foreground/60 uppercase tracking-wide mb-1">
            What's Next
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {suggestion.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {suggestion.description}
          </p>
        </div>
        {suggestion.actionFn && suggestion.action !== "View Analytics" && (
          <motion.button
            onClick={suggestion.actionFn}
            className="ml-6 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {suggestion.action} →
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// ===============================================
// MAIN COMPONENT
// ===============================================

export const AppleAnalyticsDashboard: React.FC = () => {
  const { trades, getFilteredByTier } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { isExpanded: activityLogExpanded } = useActivityLogStore();
  const { isExpanded: todoExpanded } = useTodoStore();
  const { tier, isPremium } = useSubscription();
  const { activeFilter, clearFilter, getFilteredTrades, getComparisonTrades } = useAnalyticsFilterStore();
  const [selectedPeriod, setSelectedPeriod] = React.useState<TimePeriod>('all');
  const [symbolFilter, setSymbolFilter] = React.useState<string | null>(null);
  const [customStartDate, setCustomStartDate] = React.useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = React.useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
  const [upgradeFeature, setUpgradeFeature] = React.useState<string>('');
  
  const hasCustomDateRanges = hasFeature(tier, 'hasCustomDateRanges');

  const handleUpgradeClick = (featureName: string) => {
    setUpgradeFeature(featureName);
    setShowUpgradeModal(true);
  };

  // Apply tier-based data retention FIRST
  const tierFilteredTrades = React.useMemo(() => {
    return getFilteredByTier(tier);
  }, [trades, tier, getFilteredByTier]);

  // Calculate how many trades are hidden due to tier limit
  const hiddenTradesCount = React.useMemo(() => {
    return trades.length - tierFilteredTrades.length;
  }, [trades.length, tierFilteredTrades.length]);

  // Filter trades by account and period
  const filteredTrades = React.useMemo(() => {
    let filtered = selectedAccountId
      ? tierFilteredTrades.filter(t => t.accountId === selectedAccountId)
      : tierFilteredTrades;

    // Filter by symbol if selected
    if (symbolFilter) {
      filtered = filtered.filter(t => t.symbol === symbolFilter);
    }

    // Filter by time period
    if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
      // Custom date range (Premium only)
      filtered = filtered.filter(t => {
        const tradeDate = new Date(t.entryTime);
        return tradeDate >= customStartDate && tradeDate <= customEndDate;
      });
    } else {
      // Predefined periods
      const periodOption = timePeriodOptions.find(opt => opt.value === selectedPeriod);
      if (periodOption?.days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - periodOption.days);
        filtered = filtered.filter(t => new Date(t.entryTime) >= cutoffDate);
      }
    }

    // Apply insight filter (from Daily Insights)
    if (activeFilter) {
      filtered = getFilteredTrades(filtered);
    }

    return filtered;
  }, [tierFilteredTrades, selectedAccountId, selectedPeriod, symbolFilter, customStartDate, customEndDate, activeFilter, getFilteredTrades]);

  // Get comparison trades for "vs normal" analysis
  const comparisonTrades = React.useMemo(() => {
    if (!activeFilter) return [];
    
    let base = selectedAccountId
      ? tierFilteredTrades.filter(t => t.accountId === selectedAccountId)
      : tierFilteredTrades;
    
    // Apply same time period filter
    if (selectedPeriod !== 'all' && selectedPeriod !== 'custom') {
      const periodOption = timePeriodOptions.find(opt => opt.value === selectedPeriod);
      if (periodOption?.days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - periodOption.days);
        base = base.filter(t => new Date(t.entryTime) >= cutoffDate);
      }
    }
    
    return getComparisonTrades(base);
  }, [tierFilteredTrades, selectedAccountId, selectedPeriod, activeFilter, getComparisonTrades]);

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

  // Calculate metrics (excludes scratches for accurate win rate)
  const metrics = React.useMemo(() => {
    const calculateMetrics = (tradeList: any[]) => {
      const totalPnL = tradeList.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const { wins: winCount, losses: lossCount, winRateExclScratches } = summarizeWinLossScratch(tradeList);
      
      // Use classifyTradeResult for consistent classification (matches summarizeWinLossScratch)
      const totalWins = tradeList.filter(t => classifyTradeResult(t) === 'win').reduce((sum, t) => sum + (t.pnl || 0), 0);
      const totalLosses = Math.abs(tradeList.filter(t => classifyTradeResult(t) === 'loss').reduce((sum, t) => sum + (t.pnl || 0), 0));
      const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

      // Calculate expectancy using counts from summarizeWinLossScratch
      const avgWin = winCount > 0 ? totalWins / winCount : 0;
      const avgLoss = lossCount > 0 ? totalLosses / lossCount : 0;
      const expectancy = (winRateExclScratches / 100) * avgWin - (1 - winRateExclScratches / 100) * avgLoss;

      return { totalPnL, totalTrades: tradeList.length, winRate: winRateExclScratches, profitFactor, expectancy };
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
        expectancy={metrics.current.expectancy}
        totalTrades={metrics.current.totalTrades}
        winRate={metrics.current.winRate}
        profitFactor={metrics.current.profitFactor}
        selectedPeriod={selectedPeriod}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        hasCustomDateRanges={hasCustomDateRanges}
        onPeriodChange={setSelectedPeriod}
        onOpenCustomPicker={() => setShowDatePicker(true)}
        onUpgradeClick={handleUpgradeClick}
      />
      
      {/* Custom Date Range Picker Modal */}
      <AnimatePresence>
        {showDatePicker && (
          <CustomDateRangePicker
            startDate={customStartDate}
            endDate={customEndDate}
            onDateChange={(start, end) => {
              setCustomStartDate(start);
              setCustomEndDate(end);
              if (start && end) {
                setSelectedPeriod('custom');
              }
            }}
            onClose={() => setShowDatePicker(false)}
          />
        )}
      </AnimatePresence>

      {/* Insight Filter Badge (From Daily Insights) */}
      <AnimatePresence>
        {activeFilter && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "fixed top-20 z-50 transition-all duration-300",
              activityLogExpanded && todoExpanded ? 'right-[500px]' :
              activityLogExpanded ? 'right-[400px]' :
              todoExpanded ? 'right-[480px]' : 'right-[140px]'
            )}
          >
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-2 border-blue-500/20 rounded-2xl p-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">
                      {activeFilter.label}
                    </h3>
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                      {filteredTrades.length} trades
                    </span>
                  </div>
                  {activeFilter.description && (
                    <p className="text-xs text-muted-foreground">
                      {activeFilter.description}
                    </p>
                  )}
                  {comparisonTrades.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      vs {comparisonTrades.length} comparison trades
                    </p>
                  )}
                </div>
                <button
                  onClick={clearFilter}
                  className="flex-shrink-0 p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label="Clear insight filter"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Symbol Filter Badge (Sticky, respects sidebars) */}
      <AnimatePresence>
        {symbolFilter && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "fixed z-50 transition-all duration-300",
              activeFilter ? 'top-36' : 'top-20', // Offset if insight filter is showing
              activityLogExpanded && todoExpanded ? 'right-[500px]' :
              activityLogExpanded ? 'right-[400px]' :
              todoExpanded ? 'right-[480px]' : 'right-[140px]'
            )}
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
        {/* Tier Limit Banner (Basic users only) */}
        {!isPremium && hiddenTradesCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/20 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">
                  {hiddenTradesCount} {hiddenTradesCount === 1 ? 'trade' : 'trades'} hidden (30-day limit)
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You're on the Basic plan (30-day view). Your data is safely stored — upgrade to Premium for unlimited history and advanced analytics.
                </p>
                <button 
                  onClick={() => handleUpgradeClick('Unlimited History')}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  Upgrade to Premium
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Trading Health Preview */}
        <TradingHealthPreviewCard trades={filteredTrades} />

        {/* Smart Insights */}
        <SmartInsightsCard trades={filteredTrades} />

        {/* Setup Analytics (Premium) */}
        <SetupAnalytics 
          trades={filteredTrades} 
          isPremium={isPremium}
          onUpgrade={() => handleUpgradeClick('Setup Analytics')}
        />

        {/* At a Glance Weekly */}
        <AtAGlanceWeekly trades={filteredTrades} />

        {/* Calendar Heatmap (Premium) */}
        <CalendarHeatmap
          trades={filteredTrades}
          isPremium={isPremium}
          monthsToShow={3}
          onUpgrade={() => handleUpgradeClick('Calendar Heatmap')}
        />

        {/* Time Intelligence (Premium) */}
        <TimeIntelligence
          trades={filteredTrades}
          isPremium={isPremium}
          onUpgrade={() => handleUpgradeClick('Time Intelligence')}
        />

        {/* Equity Curve */}
        <AnnotatedEquityCurve 
          trades={filteredTrades}
          activityLogExpanded={activityLogExpanded}
          todoExpanded={todoExpanded}
        />

        {/* Top Symbols */}
        <TopSymbolsSection 
          trades={filteredTrades} 
          onSymbolFilter={setSymbolFilter}
        />

        {/* Trade Highlights */}
        <TradeHighlightsCard trades={filteredTrades} />

        {/* What's Next - Apple always tells you what to do */}
        <WhatsNextCard trades={filteredTrades} />
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
      />
    </div>
  );
};

export default AppleAnalyticsDashboard;

