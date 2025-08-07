import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Target, 
  BarChart3, 
  PieChart, 
  Activity, 
  DollarSign,
  Percent,
  Clock,
  Award,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { Trade, TradeResult, MoodType } from '@/types';
import { formatCurrency, formatRelativeTime } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';

interface PeriodFilter {
  label: string;
  days: number;
}

interface PerformanceMetrics {
  totalTrades: number;
  winRate: number;
  totalPnL: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  expectancy: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  avgHoldTime: number;
  bestDay: { date: string; pnl: number };
  worstDay: { date: string; pnl: number };
}

interface ChartDataPoint {
  date: string;
  value: number;
  cumulative: number;
  trades: number;
}

const periodFilters: PeriodFilter[] = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
  { label: 'All', days: 0 },
];

export const AnalyticsView: React.FC = () => {
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>(periodFilters[2]); // 90D default
  const [activeChart, setActiveChart] = useState<'pnl' | 'winrate' | 'trades'>('pnl');

  // Filter trades by account and period
  const filteredTrades = useMemo(() => {
    let filtered = trades.filter(trade => !selectedAccountId || trade.accountId === selectedAccountId);
    
    if (selectedPeriod.days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - selectedPeriod.days);
      filtered = filtered.filter(trade => new Date(trade.entryTime) >= cutoffDate);
    }
    
    return filtered.sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime());
  }, [trades, selectedAccountId, selectedPeriod]);

  // Calculate comprehensive performance metrics
  const metrics = useMemo((): PerformanceMetrics => {
    if (filteredTrades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        totalPnL: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        expectancy: 0,
        largestWin: 0,
        largestLoss: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        avgHoldTime: 0,
        bestDay: { date: '', pnl: 0 },
        worstDay: { date: '', pnl: 0 },
      };
    }

    const wins = filteredTrades.filter(t => (t.pnl || 0) > 0);
    const losses = filteredTrades.filter(t => (t.pnl || 0) < 0);
    
    const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winRate = (wins.length / filteredTrades.length) * 100;
    
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0)) / losses.length : 0;
    
    const profitFactor = avgLoss > 0 ? Math.abs(avgWin * wins.length) / Math.abs(avgLoss * losses.length) : 0;
    
    // Calculate drawdown
    let runningPnL = 0;
    let peak = 0;
    let maxDrawdown = 0;
    
    filteredTrades.forEach(trade => {
      runningPnL += (trade.pnl || 0);
      if (runningPnL > peak) peak = runningPnL;
      const drawdown = ((peak - runningPnL) / Math.max(peak, 1)) * 100;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Calculate consecutive wins/losses
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    
    filteredTrades.forEach(trade => {
      if ((trade.pnl || 0) > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else if ((trade.pnl || 0) < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    });

    // Calculate best/worst days
    const dailyPnL = new Map<string, number>();
    filteredTrades.forEach(trade => {
      const date = new Date(trade.entryTime).toDateString();
      dailyPnL.set(date, (dailyPnL.get(date) || 0) + (trade.pnl || 0));
    });

    let bestDay = { date: '', pnl: 0 };
    let worstDay = { date: '', pnl: 0 };
    
    dailyPnL.forEach((pnl, date) => {
      if (pnl > bestDay.pnl) bestDay = { date, pnl };
      if (pnl < worstDay.pnl) worstDay = { date, pnl };
    });

    // Calculate average hold time
    const holdTimes = filteredTrades
      .filter(t => t.exitTime)
      .map(t => new Date(t.exitTime!).getTime() - new Date(t.entryTime).getTime());
    const avgHoldTime = holdTimes.length > 0 ? holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length : 0;

    // Calculate Sharpe ratio (simplified)
    const returns = filteredTrades.map(t => (t.pnl || 0) / Math.max(t.riskAmount, 1));
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const returnStdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = returnStdDev > 0 ? (avgReturn / returnStdDev) * Math.sqrt(252) : 0; // Annualized

    return {
      totalTrades: filteredTrades.length,
      winRate,
      totalPnL,
      avgWin,
      avgLoss,
      profitFactor,
      sharpeRatio,
      maxDrawdown,
      expectancy: avgLoss > 0 ? (avgWin / avgLoss) * (winRate / 100) - (1 - winRate / 100) : 0,
      largestWin: Math.max(...filteredTrades.map(t => t.pnl || 0)),
      largestLoss: Math.min(...filteredTrades.map(t => t.pnl || 0)),
      consecutiveWins: maxWinStreak,
      consecutiveLosses: maxLossStreak,
      avgHoldTime: avgHoldTime / (1000 * 60 * 60), // Convert to hours
      bestDay,
      worstDay,
    };
  }, [filteredTrades]);

  // Generate chart data
  const chartData = useMemo((): ChartDataPoint[] => {
    if (filteredTrades.length === 0) return [];

    let cumulativePnL = 0;
    const dailyData = new Map<string, { pnl: number; trades: number }>();

    filteredTrades.forEach(trade => {
      const dateStr = new Date(trade.entryTime).toISOString().split('T')[0];
      const existing = dailyData.get(dateStr) || { pnl: 0, trades: 0 };
      dailyData.set(dateStr, {
        pnl: existing.pnl + (trade.pnl || 0),
        trades: existing.trades + 1
      });
    });

    return Array.from(dailyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => {
        cumulativePnL += data.pnl;
        return {
          date,
          value: data.pnl,
          cumulative: cumulativePnL,
          trades: data.trades
        };
      });
  }, [filteredTrades]);

  // Symbol performance analysis
  const symbolPerformance = useMemo(() => {
    const symbolMap = new Map<string, { pnl: number; trades: number; wins: number }>();
    
    filteredTrades.forEach(trade => {
      const existing = symbolMap.get(trade.symbol) || { pnl: 0, trades: 0, wins: 0 };
      symbolMap.set(trade.symbol, {
        pnl: existing.pnl + (trade.pnl || 0),
        trades: existing.trades + 1,
        wins: existing.wins + ((trade.pnl || 0) > 0 ? 1 : 0)
      });
    });

    return Array.from(symbolMap.entries())
      .map(([symbol, data]) => ({
        symbol,
        pnl: data.pnl,
        trades: data.trades,
        winRate: (data.wins / data.trades) * 100,
        avgPnL: data.pnl / data.trades
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 10);
  }, [filteredTrades]);

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: number;
    format?: 'currency' | 'percentage' | 'number';
    className?: string;
  }> = ({ title, value, icon, change, format = 'number', className }) => {
    const formatValue = (val: string | number) => {
      if (typeof val === 'string') return val;
      switch (format) {
        case 'currency':
          return formatCurrency(val);
        case 'percentage':
          return `${val.toFixed(1)}%`;
        default:
          return typeof val === 'number' ? val.toFixed(2) : val;
      }
    };

    return (
      <motion.div
        className={cn('bg-muted/30 rounded-lg p-6', className)}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="text-muted-foreground">{icon}</div>
          {change !== undefined && (
            <div className={cn(
              'flex items-center text-sm font-medium',
              change >= 0 ? 'text-green-500' : 'text-red-500'
            )}>
              {change >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-foreground mb-1">
          {formatValue(value)}
        </div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </motion.div>
    );
  };

  const SimpleChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
    if (data.length === 0) return <div className="h-48 flex items-center justify-center text-muted-foreground">No data available</div>;

    const maxValue = Math.max(...data.map(d => Math.abs(d.cumulative)));
    const minValue = Math.min(...data.map(d => d.cumulative));
    const range = maxValue - minValue || 1;

    return (
      <div className="h-48 relative">
        <svg className="w-full h-full">
          <defs>
            <linearGradient id="pnlGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.8" />
              <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(percent => (
            <line
              key={percent}
              x1="0"
              y1={`${percent}%`}
              x2="100%"
              y2={`${percent}%`}
              stroke="currentColor"
              strokeOpacity="0.1"
              strokeWidth="1"
            />
          ))}
          
          {/* Chart line */}
          <polyline
            points={data.map((d, i) => {
              const x = (i / (data.length - 1)) * 100;
              const y = 100 - ((d.cumulative - minValue) / range) * 100;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="rgb(34, 197, 94)"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* Fill area */}
          <polygon
            points={[
              `0,100`,
              ...data.map((d, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = 100 - ((d.cumulative - minValue) / range) * 100;
                return `${x},${y}`;
              }),
              `100,100`
            ].join(' ')}
            fill="url(#pnlGradient)"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive trading performance analysis</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Period Filter */}
          <div className="flex bg-muted/30 rounded-lg p-1">
            {periodFilters.map((period) => (
              <button
                key={period.label}
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  'px-3 py-1 rounded text-sm font-medium transition-colors',
                  selectedPeriod.label === period.label
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {period.label}
              </button>
            ))}
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted/70 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Total P&L"
          value={metrics.totalPnL}
          icon={<DollarSign className="w-5 h-5" />}
          format="currency"
          className={metrics.totalPnL >= 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}
        />
        <MetricCard
          title="Win Rate"
          value={metrics.winRate}
          icon={<Target className="w-5 h-5" />}
          format="percentage"
        />
        <MetricCard
          title="Profit Factor"
          value={metrics.profitFactor}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricCard
          title="Sharpe Ratio"
          value={metrics.sharpeRatio}
          icon={<BarChart3 className="w-5 h-5" />}
        />
        <MetricCard
          title="Max Drawdown"
          value={metrics.maxDrawdown}
          icon={<TrendingDown className="w-5 h-5" />}
          format="percentage"
          className="border-l-4 border-orange-500"
        />
        <MetricCard
          title="Total Trades"
          value={metrics.totalTrades}
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      {/* Performance Chart */}
      <div className="bg-muted/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Performance Overview</h2>
          <div className="flex bg-muted/30 rounded-lg p-1">
            {[
              { key: 'pnl', label: 'P&L', icon: DollarSign },
              { key: 'winrate', label: 'Win Rate', icon: Target },
              { key: 'trades', label: 'Trade Count', icon: BarChart3 },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveChart(key as any)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1 rounded text-sm font-medium transition-colors',
                  activeChart === key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <SimpleChart data={chartData} />
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Trade Statistics */}
        <div className="bg-muted/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Trade Statistics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average Win:</span>
              <span className="font-medium text-green-500">{formatCurrency(metrics.avgWin)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average Loss:</span>
              <span className="font-medium text-red-500">{formatCurrency(-metrics.avgLoss)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Largest Win:</span>
              <span className="font-medium text-green-500">{formatCurrency(metrics.largestWin)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Largest Loss:</span>
              <span className="font-medium text-red-500">{formatCurrency(metrics.largestLoss)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expectancy:</span>
              <span className={cn('font-medium', metrics.expectancy >= 0 ? 'text-green-500' : 'text-red-500')}>
                {metrics.expectancy.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        {/* Streaks & Patterns */}
        <div className="bg-muted/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Streaks & Patterns
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Best Win Streak:</span>
              <span className="font-medium text-green-500">{metrics.consecutiveWins}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Worst Loss Streak:</span>
              <span className="font-medium text-red-500">{metrics.consecutiveLosses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Hold Time:</span>
              <span className="font-medium">{metrics.avgHoldTime.toFixed(1)}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Best Day:</span>
              <span className="font-medium text-green-500">{formatCurrency(metrics.bestDay.pnl)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Worst Day:</span>
              <span className="font-medium text-red-500">{formatCurrency(metrics.worstDay.pnl)}</span>
            </div>
          </div>
        </div>

        {/* Top Symbols */}
        <div className="bg-muted/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Top Performing Symbols
          </h3>
          <div className="space-y-3">
            {symbolPerformance.slice(0, 5).map((symbol, index) => (
              <div key={symbol.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-primary/20 text-primary text-xs rounded-full flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="font-medium">{symbol.symbol}</span>
                </div>
                <div className="text-right">
                  <div className={cn('font-medium', symbol.pnl >= 0 ? 'text-green-500' : 'text-red-500')}>
                    {formatCurrency(symbol.pnl)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {symbol.winRate.toFixed(0)}% • {symbol.trades} trades
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Analysis */}
      <div className="bg-muted/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Risk Analysis
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500 mb-2">{metrics.maxDrawdown.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Maximum Drawdown</div>
            <div className="text-xs text-muted-foreground mt-1">
              Largest peak-to-trough decline
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500 mb-2">{metrics.sharpeRatio.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
            <div className="text-xs text-muted-foreground mt-1">
              Risk-adjusted returns
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500 mb-2">{metrics.profitFactor.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Profit Factor</div>
            <div className="text-xs text-muted-foreground mt-1">
              Gross profit / Gross loss
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredTrades.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No trading data available</h3>
          <p className="text-muted-foreground mb-4">
            Start logging trades to see comprehensive analytics and performance insights.
          </p>
        </div>
      )}
    </div>
  );
}; 