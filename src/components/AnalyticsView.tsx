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
import { summarizeWinLossScratch, classifyTradeResult } from '@/lib/utils';
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

    const { wins: winsCount, losses: lossesCount, scratches, winRateExclScratches } = summarizeWinLossScratch(filteredTrades);
    const wins = filteredTrades.filter(t => t.result === 'win');
    const losses = filteredTrades.filter(t => t.result === 'loss');
    
    const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winRate = winRateExclScratches;
    
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0)) / losses.length : 0;
    
    const profitFactor = avgLoss > 0 ? Math.abs(avgWin * wins.length) / Math.abs(avgLoss * losses.length) : 0;
    
    // Calculate max drawdown as percentage from prior positive peak only
    // This avoids absurd values when equity peak is near zero
    let equity = 0; // cumulative PnL
    let peak = 0;   // highest equity seen
    let maxDrawdown = 0; // in percent, 0..100
    
    filteredTrades.forEach(trade => {
      equity += (trade.pnl || 0);
      if (equity > peak) {
        peak = equity;
      }
      if (peak > 0) {
        const dd = ((peak - equity) / peak) * 100;
        if (dd > maxDrawdown) maxDrawdown = Math.min(100, dd);
      }
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

  // Net Daily P&L bar chart with tooltip
  const NetDailyPnLChart: React.FC<{ data: ChartDataPoint[] }>
    = ({ data }) => {
    if (data.length === 0) return (
      <div className="h-56 flex items-center justify-center text-muted-foreground">No data available</div>
    );

    const paddingX = 16; // svg inner padding
    const paddingY = 18;
    const width = 800; // virtual width for math; SVG scales responsively
    const height = 220;

    const minDaily = Math.min(0, ...data.map(d => d.value));
    const maxDaily = Math.max(0, ...data.map(d => d.value));
    const rangeDaily = (maxDaily - minDaily) || 1;
    const zeroY = (1 - ((0 - minDaily) / rangeDaily)) * (height - paddingY * 2) + paddingY;

    const barSpace = (width - paddingX * 2) / data.length;
    const barWidth = Math.max(2, Math.min(18, barSpace * 0.7));

    const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);

    const xForIndex = (i: number) => paddingX + i * barSpace + (barSpace - barWidth) / 2;
    const yForValue = (v: number) => (1 - ((v - minDaily) / rangeDaily)) * (height - paddingY * 2) + paddingY;

    return (
      <div className="w-full">
        <div className="h-56 relative">
          <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}
            onMouseLeave={() => setHoverIdx(null)}
            onMouseMove={(e) => {
              const rect = (e.target as SVGElement).closest('svg')!.getBoundingClientRect();
              const x = e.clientX - rect.left - paddingX;
              const i = Math.min(data.length - 1, Math.max(0, Math.floor(x / barSpace)));
              setHoverIdx(i);
            }}
          >
            {/* grid */}
            {[0, 25, 50, 75, 100].map((p) => (
              <line key={p} x1={0} y1={(p/100)*height} x2={width} y2={(p/100)*height}
                stroke="currentColor" strokeOpacity="0.06" />
            ))}
            {/* zero line */}
            <line x1={0} y1={zeroY} x2={width} y2={zeroY} stroke="currentColor" strokeOpacity="0.25" />

            {/* bars */}
            {data.map((d, i) => {
              const x = xForIndex(i);
              const y = yForValue(Math.max(d.value, 0));
              const yNeg = yForValue(Math.min(d.value, 0));
              const h = Math.abs(y - zeroY);
              const color = d.value >= 0 ? 'rgb(34,197,94)' : 'rgb(239,68,68)';
              return (
                <rect key={d.date} x={x} width={barWidth} y={Math.min(y, zeroY)} height={h}
                  fill={color} opacity={hoverIdx === i ? 0.95 : 0.7} rx={2} />
              );
            })}

            {/* hover rule */}
            {hoverIdx !== null && (
              <line x1={paddingX + hoverIdx * barSpace + barSpace/2} y1={paddingY/2}
                x2={paddingX + hoverIdx * barSpace + barSpace/2} y2={height - paddingY/2}
                stroke="currentColor" strokeOpacity="0.2" />
            )}
          </svg>

          {/* tooltip */}
          {hoverIdx !== null && (
            <div className="absolute left-0 top-0 pointer-events-none"
              style={{ transform: `translateX(calc(${(hoverIdx + 0.5) / data.length * 100}% - 50%))`, width: 160 }}>
              <div className="-translate-y-3 mx-auto w-max px-3 py-2 rounded-md bg-popover border border-border text-xs shadow-sm">
                <div className="font-medium text-foreground mb-1">{new Date(data[hoverIdx].date).toLocaleDateString()}</div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">P&L</span>
                  <span className={data[hoverIdx].value >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {formatCurrency(data[hoverIdx].value)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{new Date(data[0].date).toLocaleDateString()}</span>
          <span>{new Date(data[data.length - 1].date).toLocaleDateString()}</span>
        </div>
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

      {/* Net Daily P&L */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Net Daily P&L</h2>
          <div className="text-xs text-muted-foreground">Bars: daily net</div>
        </div>
        <NetDailyPnLChart data={chartData} />
      </div>

      {/* Performance Chart (cumulative/others) */}
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

      {/* Recent Trades (Analytics) */}
      <div className="bg-muted/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Trades
          </h3>
          <div className="text-xs text-muted-foreground">Showing latest 20</div>
        </div>
        {filteredTrades.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">No trades in selected period</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2">Date</th>
                  <th className="text-left px-3 py-2">Symbol</th>
                  <th className="text-left px-3 py-2">Side</th>
                  <th className="text-right px-3 py-2">P&L</th>
                  <th className="text-right px-3 py-2">R</th>
                  <th className="text-left px-3 py-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades
                  .slice()
                  .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
                  .slice(0, 20)
                  .map((t) => {
                    const cls = classifyTradeResult(t);
                    const isScratch = cls === 'breakeven';
                    return (
                      <tr key={t.id} className="border-t border-border/60 hover:bg-muted/20">
                        <td className="px-3 py-2 whitespace-nowrap">{new Date(t.entryTime).toLocaleDateString()}</td>
                        <td className="px-3 py-2 font-medium">{t.symbol}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.direction === 'long' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                            {t.direction?.toUpperCase()}
                          </span>
                        </td>
                        <td className={`px-3 py-2 text-right ${((t.pnl || 0) >= 0) ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(t.pnl || 0)}</td>
                        <td className="px-3 py-2 text-right">{Number.isFinite(t.riskRewardRatio) ? t.riskRewardRatio.toFixed(2) : '—'}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <span className="capitalize text-muted-foreground">{cls}</span>
                            {isScratch && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-yellow-500" title="Scratch (excluded from win rate)">⊖</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
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