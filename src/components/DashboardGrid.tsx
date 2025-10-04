import React from 'react';
import { Responsive, WidthProvider, type Layouts, type Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useAnalyticsTilesStore, type AnalyticsTileId } from '@/store/useAnalyticsTilesStore';
import { computeEdgeScore } from '@/lib/edgeScore';
import { summarizeWinLossScratch, classifyTradeResult } from '@/lib/utils';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';
import { 
  Award, Info, Settings2, DollarSign, Target, TrendingUp, TrendingDown, 
  BarChart3, Activity, Percent, Clock, AlertTriangle, ArrowUp, ArrowDown,
  Calendar, PieChart, Flame, Shield, Zap, TrendingDown as TrendingDownIcon
} from 'lucide-react';
import AnalyticsTilesModal from './AnalyticsTilesModal';
import AISummaryTile from './AISummaryTile';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { motion } from 'framer-motion';

const ResponsiveGridLayout = WidthProvider(Responsive);

type Breakpoint = 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs' | 'xxs';

const BREAKPOINTS: Record<Breakpoint, number> = {
  xxl: 1920,
  xl: 1600,
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
};

const COLS: Record<Breakpoint, number> = {
  xxl: 16,
  xl: 14,
  lg: 12,
  md: 10,
  sm: 8,
  xs: 4,
  xxs: 2,
};

const ALL_TILE_IDS: AnalyticsTileId[] = [
  'totalPnl',
  'winRate',
  'profitFactor',
  'sharpeRatio',
  'maxDrawdown',
  'totalTrades',
  'edgeScore',
  'netDailyPnl',
  'topSymbols',
  'recentTrades',
  'riskAnalysis',
];

// Additional stat tile IDs for comprehensive analytics
const ADDITIONAL_STATS = [
  'avgWin', 'avgLoss', 'expectancy', 'longestWinStreak', 'longestLossStreak',
  'longVsShort', 'avgRR', 'largestWin', 'largestLoss', 'aiSummary'
];

// Layouts optimized for different screen sizes
const DEFAULT_XXL_LAYOUT: Layout[] = [
  // Top row - Key metrics (6 tiles across)
  { i: 'totalPnl', x: 0, y: 0, w: 2, h: 3 },
  { i: 'winRate', x: 2, y: 0, w: 2, h: 3 },
  { i: 'profitFactor', x: 4, y: 0, w: 2, h: 3 },
  { i: 'sharpeRatio', x: 6, y: 0, w: 2, h: 3 },
  { i: 'maxDrawdown', x: 8, y: 0, w: 2, h: 3 },
  { i: 'totalTrades', x: 10, y: 0, w: 2, h: 3 },
  { i: 'avgWin', x: 12, y: 0, w: 2, h: 3 },
  { i: 'avgLoss', x: 14, y: 0, w: 2, h: 3 },
  
  // Second row - More stats
  { i: 'expectancy', x: 0, y: 3, w: 2, h: 3 },
  { i: 'longestWinStreak', x: 2, y: 3, w: 2, h: 3 },
  { i: 'longestLossStreak', x: 4, y: 3, w: 2, h: 3 },
  { i: 'avgRR', x: 6, y: 3, w: 2, h: 3 },
  { i: 'largestWin', x: 8, y: 3, w: 2, h: 3 },
  { i: 'largestLoss', x: 10, y: 3, w: 2, h: 3 },
  { i: 'longVsShort', x: 12, y: 3, w: 4, h: 3 },
  
  // Main analytics tiles - larger on 4K
  { i: 'edgeScore', x: 0, y: 6, w: 8, h: 8, minW: 6, minH: 6 },
  { i: 'netDailyPnl', x: 8, y: 6, w: 8, h: 8, minW: 6, minH: 6 },
  { i: 'topSymbols', x: 0, y: 14, w: 5, h: 6 },
  { i: 'recentTrades', x: 5, y: 14, w: 6, h: 6 },
  { i: 'riskAnalysis', x: 11, y: 14, w: 5, h: 6 },
  
  // AI Summary - extra wide on 4K
  { i: 'aiSummary', x: 0, y: 20, w: 16, h: 6, minW: 8, minH: 4 },
];

const DEFAULT_XL_LAYOUT: Layout[] = [
  // Top row - Key metrics
  { i: 'totalPnl', x: 0, y: 0, w: 2, h: 3 },
  { i: 'winRate', x: 2, y: 0, w: 2, h: 3 },
  { i: 'profitFactor', x: 4, y: 0, w: 2, h: 3 },
  { i: 'sharpeRatio', x: 6, y: 0, w: 2, h: 3 },
  { i: 'maxDrawdown', x: 8, y: 0, w: 2, h: 3 },
  { i: 'totalTrades', x: 10, y: 0, w: 2, h: 3 },
  { i: 'avgWin', x: 12, y: 0, w: 2, h: 3 },
  
  // Second row - Additional stats
  { i: 'avgLoss', x: 0, y: 3, w: 2, h: 3 },
  { i: 'expectancy', x: 2, y: 3, w: 2, h: 3 },
  { i: 'longestWinStreak', x: 4, y: 3, w: 2, h: 3 },
  { i: 'longestLossStreak', x: 6, y: 3, w: 2, h: 3 },
  { i: 'avgRR', x: 8, y: 3, w: 2, h: 3 },
  { i: 'largestWin', x: 10, y: 3, w: 2, h: 3 },
  { i: 'largestLoss', x: 12, y: 3, w: 2, h: 3 },
  
  // Main analytics tiles
  { i: 'edgeScore', x: 0, y: 6, w: 7, h: 8, minW: 5, minH: 6 },
  { i: 'netDailyPnl', x: 7, y: 6, w: 7, h: 8, minW: 5, minH: 6 },
  { i: 'topSymbols', x: 0, y: 14, w: 4, h: 6 },
  { i: 'recentTrades', x: 4, y: 14, w: 5, h: 6 },
  { i: 'riskAnalysis', x: 9, y: 14, w: 5, h: 6 },
  
  // AI Summary - wide
  { i: 'aiSummary', x: 0, y: 20, w: 10, h: 6, minW: 7, minH: 4 },
  { i: 'longVsShort', x: 10, y: 20, w: 4, h: 6 },
];

const DEFAULT_LG_LAYOUT: Layout[] = [
  // Top row - Key metrics
  { i: 'totalPnl', x: 0, y: 0, w: 2, h: 3 },
  { i: 'winRate', x: 2, y: 0, w: 2, h: 3 },
  { i: 'profitFactor', x: 4, y: 0, w: 2, h: 3 },
  { i: 'sharpeRatio', x: 6, y: 0, w: 2, h: 3 },
  { i: 'maxDrawdown', x: 8, y: 0, w: 2, h: 3 },
  { i: 'totalTrades', x: 10, y: 0, w: 2, h: 3 },
  
  // Second row - Additional stats
  { i: 'avgWin', x: 0, y: 3, w: 2, h: 3 },
  { i: 'avgLoss', x: 2, y: 3, w: 2, h: 3 },
  { i: 'expectancy', x: 4, y: 3, w: 2, h: 3 },
  { i: 'longestWinStreak', x: 6, y: 3, w: 2, h: 3 },
  { i: 'longestLossStreak', x: 8, y: 3, w: 2, h: 3 },
  { i: 'avgRR', x: 10, y: 3, w: 2, h: 3 },
  
  // Main analytics tiles
  { i: 'edgeScore', x: 0, y: 6, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'netDailyPnl', x: 6, y: 6, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'topSymbols', x: 0, y: 14, w: 4, h: 6 },
  { i: 'recentTrades', x: 4, y: 14, w: 4, h: 6 },
  { i: 'riskAnalysis', x: 8, y: 14, w: 4, h: 6 },
  
  // AI Summary - large tile
  { i: 'aiSummary', x: 0, y: 20, w: 8, h: 6, minW: 6, minH: 4 },
  
  // Additional stats - smaller tiles
  { i: 'largestWin', x: 8, y: 20, w: 2, h: 3 },
  { i: 'largestLoss', x: 10, y: 20, w: 2, h: 3 },
  { i: 'longVsShort', x: 8, y: 23, w: 4, h: 3 },
];

const STORAGE_KEY_PREFIX = 'tz.layouts.v1.';

function getAccountKey(accountId: string | null): string {
  return accountId || 'all';
}

function loadLayouts(accountKey: string): Layouts | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + accountKey);
    return raw ? (JSON.parse(raw) as Layouts) : null;
  } catch {
    return null;
  }
}

function saveLayouts(accountKey: string, layouts: Layouts) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + accountKey, JSON.stringify(layouts));
  } catch {}
}

const SkeletonTile: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`h-full w-full rounded-xl border border-border bg-muted/20 ${className || ''}`}>
    <div className="h-full w-full animate-pulse">
      <div className="h-8 border-b border-border/60 px-4 flex items-center gap-2">
        <div className="h-4 w-24 bg-foreground/10 rounded" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/5 bg-foreground/10 rounded" />
        <div className="h-4 w-4/5 bg-foreground/10 rounded" />
        <div className="h-40 w-full bg-foreground/10 rounded" />
      </div>
    </div>
  </div>
);

// Helper function to calculate comprehensive metrics
const useTradeMetrics = (trades: any[]) => {
  return React.useMemo(() => {
    if (trades.length === 0) {
      return {
        totalTrades: 0, winRate: 0, totalPnL: 0, avgWin: 0, avgLoss: 0,
        profitFactor: 0, sharpeRatio: 0, maxDrawdown: 0, expectancy: 0,
        largestWin: 0, largestLoss: 0, consecutiveWins: 0, consecutiveLosses: 0,
        avgHoldTime: 0, bestDay: { date: '', pnl: 0 }, worstDay: { date: '', pnl: 0 },
        longWinRate: 0, shortWinRate: 0, avgRR: 0
      };
    }

    const { wins: winsCount, losses: lossesCount, scratches, winRateExclScratches } = summarizeWinLossScratch(trades);
    const wins = trades.filter(t => t.result === 'win');
    const losses = trades.filter(t => t.result === 'loss');
    const longs = trades.filter(t => t.direction === 'long');
    const shorts = trades.filter(t => t.direction === 'short');
    
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0)) / losses.length : 0;
    const profitFactor = avgLoss > 0 ? Math.abs(avgWin * wins.length) / Math.abs(avgLoss * losses.length) : 0;
    
    // Calculate streaks
    let currentWinStreak = 0, currentLossStreak = 0, maxWinStreak = 0, maxLossStreak = 0;
    trades.forEach(trade => {
      if ((trade.pnl || 0) > 0) {
        currentWinStreak++; currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else if ((trade.pnl || 0) < 0) {
        currentLossStreak++; currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    });

    // Calculate max drawdown
    let equity = 0, peak = 0, maxDrawdown = 0;
    trades.forEach(trade => {
      equity += (trade.pnl || 0);
      if (equity > peak) peak = equity;
      if (peak > 0) maxDrawdown = Math.max(maxDrawdown, ((peak - equity) / peak) * 100);
    });

    const longWins = longs.filter(t => (t.pnl || 0) > 0).length;
    const shortWins = shorts.filter(t => (t.pnl || 0) > 0).length;
    const avgRR = trades.filter(t => t.riskRewardRatio && Number.isFinite(t.riskRewardRatio))
      .reduce((sum, t) => sum + t.riskRewardRatio, 0) / Math.max(1, trades.filter(t => t.riskRewardRatio && Number.isFinite(t.riskRewardRatio)).length);

    return {
      totalTrades: trades.length,
      winRate: winRateExclScratches,
      totalPnL,
      avgWin,
      avgLoss,
      profitFactor,
      sharpeRatio: 0, // Simplified for now
      maxDrawdown,
      // Dollar-based expectancy: how much you expect to make per trade on average
      expectancy: (winRateExclScratches / 100) * avgWin - (1 - winRateExclScratches / 100) * avgLoss,
      largestWin: Math.max(...trades.map(t => t.pnl || 0)),
      largestLoss: Math.min(...trades.map(t => t.pnl || 0)),
      consecutiveWins: maxWinStreak,
      consecutiveLosses: maxLossStreak,
      avgHoldTime: 0, // Simplified for now
      bestDay: { date: '', pnl: 0 }, // Simplified for now
      worstDay: { date: '', pnl: 0 }, // Simplified for now
      longWinRate: longs.length > 0 ? (longWins / longs.length) * 100 : 0,
      shortWinRate: shorts.length > 0 ? (shortWins / shorts.length) * 100 : 0,
      avgRR
    };
  }, [trades]);
};

// Enhanced Edge Score Radar Tile
const EdgeScoreRadarTile: React.FC = () => {
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const filteredTrades = React.useMemo(() => {
    return trades.filter(t => !selectedAccountId || t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);
  const edge = React.useMemo(() => computeEdgeScore(filteredTrades), [filteredTrades]);

  const weakest = React.useMemo(() => {
    const entries: Array<{ key: keyof typeof edge.breakdown; label: string; value: number }> = [
      { key: 'winRate', label: 'Win %', value: edge.breakdown.winRate },
      { key: 'profitFactor', label: 'Profit Factor', value: edge.breakdown.profitFactor },
      { key: 'maxDrawdown', label: 'Max Drawdown', value: edge.breakdown.maxDrawdown },
      { key: 'avgWinLoss', label: 'Avg Win vs Loss', value: edge.breakdown.avgWinLoss },
      { key: 'consistency', label: 'Risk Consistency', value: edge.breakdown.consistency },
      { key: 'recoveryFactor', label: 'Recovery', value: edge.breakdown.recoveryFactor },
    ];
    return entries.reduce((min, cur) => (cur.value < min.value ? cur : min), entries[0]);
  }, [edge]);

  const data = [
    { metric: 'Win %', value: edge.breakdown.winRate },
    { metric: 'Profit Factor', value: edge.breakdown.profitFactor },
    { metric: 'Max Drawdown', value: edge.breakdown.maxDrawdown },
    { metric: 'Avg W/L', value: edge.breakdown.avgWinLoss },
    { metric: 'Risk Consistency', value: edge.breakdown.consistency },
    { metric: 'Recovery', value: edge.breakdown.recoveryFactor },
  ];

  const colorFor = (v: number) => (v >= 70 ? '#22c55e' : v >= 45 ? '#eab308' : '#ef4444');

  return (
    <motion.div 
      className="h-full w-full rounded-2xl border border-border bg-card dark:bg-card"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="px-4 h-11 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Edge Score</span>
          <button className="p-1 rounded hover:bg-muted" title="What is this?">
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="text-xs text-muted-foreground">Composite performance</div>
      </div>
      <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="80%">
              <PolarGrid gridType="polygon" stroke="currentColor" strokeOpacity={0.08} />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'currentColor', fontSize: 11, opacity: 0.7 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Edge" dataKey="value" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.25} />
              <RechartsTooltip cursor={{ stroke: 'currentColor', strokeOpacity: 0.15 }} contentStyle={{ fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="md:col-span-2 flex flex-col items-center justify-center gap-4">
          <div className="text-5xl font-bold tracking-tight">{edge.score}</div>
          <div className="w-40 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full transition-all duration-1000" style={{ width: `${edge.score}%`, backgroundColor: colorFor(edge.score) }} />
          </div>
          <div className="w-full grid grid-cols-2 gap-2 text-xs">
            {data.map(d => (
              <div key={d.metric} className="flex items-center justify-between px-2 py-1 rounded bg-muted/40">
                <span className="text-muted-foreground">{d.metric}</span>
                <span className="font-medium" style={{ color: colorFor(d.value) }}>{d.value}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Weakest area: <span className="font-medium text-foreground">{weakest.label}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Trade P&L Bar Chart Tile
const TradePnLBarTile: React.FC = () => {
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const [mode, setMode] = React.useState<'cumulative' | 'daily'>('daily');
  
  const filteredTrades = React.useMemo(() => {
    return trades.filter(t => !selectedAccountId || t.accountId === selectedAccountId)
      .sort((a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime());
  }, [trades, selectedAccountId]);

  const chartData = React.useMemo(() => {
    if (mode === 'daily') {
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
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString(),
          pnl: data.pnl,
          trades: data.trades
        }));
    } else {
      let cumulative = 0;
      return filteredTrades.map(trade => {
        cumulative += (trade.pnl || 0);
        return {
          date: new Date(trade.entryTime).toLocaleDateString(),
          pnl: cumulative,
          symbol: trade.symbol,
          tradePnl: trade.pnl || 0
        };
      });
    }
  }, [filteredTrades, mode]);

  return (
    <motion.div 
      className="h-full w-full rounded-2xl border border-border bg-card dark:bg-card"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div className="px-4 h-11 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Trade P&L</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted/40 rounded-md p-1">
            {(['daily', 'cumulative'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                  mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {m === 'daily' ? 'Daily' : 'Cumulative'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="p-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'currentColor', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: 'currentColor', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: any) => [formatCurrency(value), 'P&L']}
            />
            <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

// Compact Stat Tile Component
const StatTile: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  format?: 'currency' | 'percentage' | 'number';
  trend?: number;
  highlight?: boolean;
  emoji?: string;
}> = ({ title, value, icon, format = 'number', trend, highlight, emoji }) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    switch (format) {
      case 'currency': return formatCurrency(val);
      case 'percentage': return `${val.toFixed(1)}%`;
      default: return typeof val === 'number' ? val.toFixed(2) : val;
    }
  };

  return (
    <motion.div
      className={cn(
        'h-full w-full rounded-2xl border border-border bg-card dark:bg-card p-4',
        highlight && 'ring-2 ring-primary/20'
      )}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-muted-foreground">{icon}</div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center text-xs font-medium',
            trend >= 0 ? 'text-green-500' : 'text-red-500'
          )}>
            {trend >= 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-2xl font-bold text-foreground">
          {formatValue(value)}
        </div>
        {emoji && <span className="text-lg">{emoji}</span>}
      </div>
      <div className="text-sm text-muted-foreground">{title}</div>
    </motion.div>
  );
};

export const DashboardGrid: React.FC = () => {
  const { selectedAccountId } = useAccountFilterStore();
  const accountKey = getAccountKey(selectedAccountId);
  const { getLayout } = useAnalyticsTilesStore();
  const visibility = getLayout(selectedAccountId);

  const [showSettings, setShowSettings] = React.useState(false);
  const [layouts, setLayouts] = React.useState<Layouts>(() => {
    const saved = loadLayouts(accountKey);
    if (saved) return saved;
    // Use optimized layouts for each breakpoint
    const scale = (baseLayout: Layout[], cols: number): Layout[] => 
      baseLayout.map(l => ({ ...l, w: Math.min(l.w, cols), x: Math.min(l.x, Math.max(0, cols - l.w)) }));
    
    return {
      xxl: DEFAULT_XXL_LAYOUT,
      xl: DEFAULT_XL_LAYOUT,
      lg: DEFAULT_LG_LAYOUT,
      md: scale(DEFAULT_LG_LAYOUT, COLS.md),
      sm: scale(DEFAULT_LG_LAYOUT, COLS.sm),
      xs: scale(DEFAULT_LG_LAYOUT, COLS.xs),
      xxs: scale(DEFAULT_LG_LAYOUT, COLS.xxs),
    };
  });

  React.useEffect(() => {
    saveLayouts(accountKey, layouts);
  }, [accountKey, layouts]);

  // Filter tiles by visibility
  const visibleIds = React.useMemo(() => visibility.filter(t => t.visible).map(t => t.id), [visibility]);

  const onLayoutChange = (_current: Layout[], all: Layouts) => {
    setLayouts(all);
  };

  const renderTile = (id: AnalyticsTileId) => {
    const { trades } = useTradeStore();
    const { selectedAccountId } = useAccountFilterStore();
    const filteredTrades = React.useMemo(() => {
      return trades.filter(t => !selectedAccountId || t.accountId === selectedAccountId);
    }, [trades, selectedAccountId]);
    const metrics = useTradeMetrics(filteredTrades);

    switch (id) {
      case 'edgeScore':
        return <EdgeScoreRadarTile />;
      case 'netDailyPnl':
        return <TradePnLBarTile />;
      case 'totalPnl':
        return (
          <StatTile
            title="Total P&L"
            value={metrics.totalPnL}
            icon={<DollarSign className="w-5 h-5" />}
            format="currency"
            highlight={Math.abs(metrics.totalPnL) > 1000}
            emoji={metrics.totalPnL > 0 ? '📈' : metrics.totalPnL < 0 ? '📉' : undefined}
          />
        );
      case 'winRate':
        return (
          <StatTile
            title="Win Rate"
            value={metrics.winRate}
            icon={<Target className="w-5 h-5" />}
            format="percentage"
            emoji={metrics.winRate > 65 ? '🔥' : undefined}
          />
        );
      case 'profitFactor':
        return (
          <StatTile
            title="Profit Factor"
            value={metrics.profitFactor}
            icon={<TrendingUp className="w-5 h-5" />}
            highlight={metrics.profitFactor > 2.0}
          />
        );
      case 'sharpeRatio':
        return (
          <StatTile
            title="Sharpe Ratio"
            value={metrics.sharpeRatio}
            icon={<BarChart3 className="w-5 h-5" />}
          />
        );
      case 'maxDrawdown':
        return (
          <StatTile
            title="Max Drawdown"
            value={metrics.maxDrawdown}
            icon={<TrendingDownIcon className="w-5 h-5" />}
            format="percentage"
            highlight={metrics.maxDrawdown > 50}
            emoji={metrics.maxDrawdown > 50 ? '⚠️' : undefined}
          />
        );
      case 'totalTrades':
        return (
          <StatTile
            title="Total Trades"
            value={metrics.totalTrades}
            icon={<Activity className="w-5 h-5" />}
          />
        );
      case 'topSymbols':
        return (
          <motion.div className="h-full w-full rounded-2xl border border-border bg-card dark:bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Top Symbols</span>
            </div>
            <div className="space-y-3">
              {filteredTrades.reduce((acc, trade) => {
                const existing = acc.find(s => s.symbol === trade.symbol);
                if (existing) {
                  existing.pnl += (trade.pnl || 0);
                  existing.trades += 1;
                } else {
                  acc.push({ symbol: trade.symbol, pnl: trade.pnl || 0, trades: 1 });
                }
                return acc;
              }, [] as Array<{ symbol: string; pnl: number; trades: number }>)
              .sort((a, b) => b.pnl - a.pnl)
              .slice(0, 5)
              .map((symbol, index) => (
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
                    <div className="text-xs text-muted-foreground">{symbol.trades} trades</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      case 'recentTrades':
        return (
          <motion.div className="h-full w-full rounded-2xl border border-border bg-card dark:bg-card">
            <div className="px-4 h-11 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Recent Trades</span>
              </div>
              <div className="text-xs text-muted-foreground">Latest 10</div>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {filteredTrades.slice(-10).reverse().map((trade) => (
                <div key={trade.id} className="flex items-center justify-between p-2 rounded bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{trade.symbol}</span>
                    <span className={cn(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      trade.direction === 'long' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                    )}>
                      {trade.direction?.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={cn('font-medium text-sm', (trade.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500')}>
                      {formatCurrency(trade.pnl || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(trade.entryTime).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );
      case 'riskAnalysis':
        return (
          <motion.div className="h-full w-full rounded-2xl border border-border bg-card dark:bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Risk Analysis</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500 mb-2">{metrics.maxDrawdown.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Max Drawdown</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-500 mb-2">{metrics.avgRR.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Avg R:R</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-500 mb-2">{formatCurrency(metrics.expectancy)}</div>
                <div className="text-sm text-muted-foreground">Expectancy/Trade</div>
              </div>
            </div>
          </motion.div>
        );
      
      // Additional stat tiles
      case 'avgWin':
        return (
          <StatTile
            title="Average Win"
            value={metrics.avgWin}
            icon={<TrendingUp className="w-5 h-5" />}
            format="currency"
          />
        );
      case 'avgLoss':
        return (
          <StatTile
            title="Average Loss"
            value={metrics.avgLoss}
            icon={<TrendingDown className="w-5 h-5" />}
            format="currency"
          />
        );
      case 'expectancy':
        return (
          <StatTile
            title="Expectancy"
            value={metrics.expectancy}
            icon={<Target className="w-5 h-5" />}
            highlight={metrics.expectancy > 0}
          />
        );
      case 'longestWinStreak':
        return (
          <StatTile
            title="Longest Win Streak"
            value={metrics.consecutiveWins}
            icon={<Flame className="w-5 h-5" />}
            emoji={metrics.consecutiveWins > 5 ? '🔥' : undefined}
          />
        );
      case 'longestLossStreak':
        return (
          <StatTile
            title="Longest Loss Streak"
            value={metrics.consecutiveLosses}
            icon={<TrendingDownIcon className="w-5 h-5" />}
            highlight={metrics.consecutiveLosses > 5}
            emoji={metrics.consecutiveLosses > 5 ? '⚠️' : undefined}
          />
        );
      case 'avgRR':
        return (
          <StatTile
            title="Avg Risk:Reward"
            value={metrics.avgRR}
            icon={<Shield className="w-5 h-5" />}
            highlight={metrics.avgRR > 2.0}
          />
        );
      case 'largestWin':
        return (
          <StatTile
            title="Largest Win"
            value={metrics.largestWin}
            icon={<Zap className="w-5 h-5" />}
            format="currency"
            emoji="🎯"
          />
        );
      case 'largestLoss':
        return (
          <StatTile
            title="Largest Loss"
            value={Math.abs(metrics.largestLoss)}
            icon={<AlertTriangle className="w-5 h-5" />}
            format="currency"
          />
        );
      case 'longVsShort':
        return (
          <motion.div className="h-full w-full rounded-2xl border border-border bg-card dark:bg-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Long vs Short</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500 mb-2">{metrics.longWinRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Long Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500 mb-2">{metrics.shortWinRate.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Short Win Rate</div>
              </div>
            </div>
          </motion.div>
        );
      
      case 'aiSummary':
        return (
          <AISummaryTile
            initialContent="Your AI-generated trading summary will appear here. This tile provides insights based on your recent trading performance, patterns, and areas for improvement."
            onSave={(content) => {
              // TODO: Implement save functionality
              console.log('Saving AI summary:', content);
            }}
            onRegenerate={async () => {
              // TODO: Implement AI summary generation
              return "**Strong Performance This Week**\n\nYour trading shows consistent improvement with a *65% win rate* and solid risk management. Key highlights:\n\n- **Profit Factor**: 2.1 (above target)\n- **Max Drawdown**: 8.2% (well controlled)\n- **Best Performing Symbol**: AAPL with +$1,240\n\n*Focus Area*: Consider reducing position size on TSLA trades to improve consistency.";
            }}
          />
        );
      
      default:
        return <SkeletonTile />;
    }
  };

  // Ensure every visible id has a layout item
  const ensureLayoutItems = (ls: Layouts): Layouts => {
    const next: Layouts = { ...ls };
    (Object.keys(next) as Breakpoint[]).forEach(bp => {
      const items = new Set(next[bp]?.map(l => l.i) || []);
      const current = next[bp] || [];
      const missing = visibleIds.filter(id => !items.has(id));
      const appended = missing.map((id, idx) => ({ i: id, x: (idx * 2) % (COLS[bp] || 1), y: Infinity, w: 2, h: 3 }));
      next[bp] = [...current, ...appended];
    });
    return next;
  };

  const effectiveLayouts = React.useMemo(() => ensureLayoutItems(layouts), [layouts, visibleIds]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Analytics Grid</h2>
        <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-sm hover:bg-muted/80" onClick={() => setShowSettings(true)}>
          <Settings2 className="w-4 h-4" /> Customize
        </button>
      </div>
      <ResponsiveGridLayout
        className="layout"
        layouts={effectiveLayouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={24}
        margin={[12, 12]}
        containerPadding={[0, 0]}
        isResizable
        isDraggable
        onLayoutChange={onLayoutChange}
        measureBeforeMount={false}
        useCSSTransforms
        compactType="vertical"
        preventCollision={false}
      >
        {[...ALL_TILE_IDS, ...ADDITIONAL_STATS].filter(id => visibleIds.includes(id as any)).map((id) => (
          <div key={id} className="group relative">
            {renderTile(id as AnalyticsTileId)}
            {/* Drag handle indicator */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-sm" />
                <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-sm" />
                <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-sm" />
                <div className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-sm" />
              </div>
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>

      <AnalyticsTilesModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default DashboardGrid;


