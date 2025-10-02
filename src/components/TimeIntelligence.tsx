/**
 * Time Intelligence - Premium Feature
 * Discover your best trading hours and days
 * Apple Health + GitHub insights style
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, TrendingUp, TrendingDown, Lock, Sparkles, AlertTriangle } from 'lucide-react';
import { Trade } from '@/types';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';
import { PremiumBadge } from './PremiumBadge';

interface TimeIntelligenceProps {
  trades: Trade[];
  isPremium: boolean;
  onUpgrade: () => void;
}

interface HourMetric {
  hour: number;
  totalPnL: number;
  totalTrades: number;
  winRate: number;
  avgPnL: number;
}

interface DayMetric {
  day: number; // 0 = Sunday, 1 = Monday, etc.
  dayName: string;
  totalPnL: number;
  totalTrades: number;
  winRate: number;
  avgPnL: number;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const TimeIntelligence: React.FC<TimeIntelligenceProps> = ({ trades, isPremium, onUpgrade }) => {
  // Calculate hourly performance
  const hourlyMetrics = useMemo((): HourMetric[] => {
    const hourMap = new Map<number, Trade[]>();
    
    // Group trades by hour
    trades.forEach(trade => {
      const date = new Date(trade.entryTime);
      const hour = date.getHours();
      
      if (!hourMap.has(hour)) {
        hourMap.set(hour, []);
      }
      hourMap.get(hour)?.push(trade);
    });

    // Calculate metrics for each hour
    return HOURS.map(hour => {
      const hourTrades = hourMap.get(hour) || [];
      const totalPnL = hourTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const totalTrades = hourTrades.length;
      const wins = hourTrades.filter(t => (t.pnl || 0) > 0).length;
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
      const avgPnL = totalTrades > 0 ? totalPnL / totalTrades : 0;

      return {
        hour,
        totalPnL,
        totalTrades,
        winRate,
        avgPnL,
      };
    });
  }, [trades]);

  // Calculate daily performance
  const dailyMetrics = useMemo((): DayMetric[] => {
    const dayMap = new Map<number, Trade[]>();
    
    // Group trades by day of week
    trades.forEach(trade => {
      const date = new Date(trade.entryTime);
      const day = date.getDay(); // 0 = Sunday
      
      if (!dayMap.has(day)) {
        dayMap.set(day, []);
      }
      dayMap.get(day)?.push(trade);
    });

    // Calculate metrics for each day
    return DAYS.map((dayName, day) => {
      const dayTrades = dayMap.get(day) || [];
      const totalPnL = dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const totalTrades = dayTrades.length;
      const wins = dayTrades.filter(t => (t.pnl || 0) > 0).length;
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
      const avgPnL = totalTrades > 0 ? totalPnL / totalTrades : 0;

      return {
        day,
        dayName,
        totalPnL,
        totalTrades,
        winRate,
        avgPnL,
      };
    });
  }, [trades]);

  // Find best/worst hours
  const hoursWithTrades = hourlyMetrics.filter(h => h.totalTrades > 0);
  const bestHour = hoursWithTrades.length > 0 
    ? hoursWithTrades.reduce((best, curr) => curr.totalPnL > best.totalPnL ? curr : best)
    : null;
  const worstHour = hoursWithTrades.length > 0
    ? hoursWithTrades.reduce((worst, curr) => curr.totalPnL < worst.totalPnL ? curr : worst)
    : null;

  // Find best/worst days
  const daysWithTrades = dailyMetrics.filter(d => d.totalTrades > 0);
  const bestDay = daysWithTrades.length > 0
    ? daysWithTrades.reduce((best, curr) => curr.totalPnL > best.totalPnL ? curr : best)
    : null;
  const worstDay = daysWithTrades.length > 0
    ? daysWithTrades.reduce((worst, curr) => curr.totalPnL < worst.totalPnL ? curr : worst)
    : null;

  // Format hour for display (e.g., "9:00 AM")
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  // Get color intensity for heatmap
  const getHeatColor = (pnl: number, maxAbsPnL: number): string => {
    if (pnl === 0) return 'bg-muted/20';
    
    const intensity = Math.abs(pnl) / maxAbsPnL;
    
    if (pnl > 0) {
      // Green scale
      if (intensity > 0.75) return 'bg-green-600';
      if (intensity > 0.5) return 'bg-green-500';
      if (intensity > 0.25) return 'bg-green-400';
      return 'bg-green-300';
    } else {
      // Red scale
      if (intensity > 0.75) return 'bg-red-600';
      if (intensity > 0.5) return 'bg-red-500';
      if (intensity > 0.25) return 'bg-red-400';
      return 'bg-red-300';
    }
  };

  // Calculate max P&L for color scaling
  const maxAbsPnL = Math.max(
    ...hourlyMetrics.map(h => Math.abs(h.totalPnL)),
    ...dailyMetrics.map(d => Math.abs(d.totalPnL)),
    1 // Avoid division by zero
  );

  const renderContent = () => (
    <div className="space-y-6">
      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Best Hour */}
        {bestHour && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Best Hour</span>
            </div>
            <div className="text-2xl font-bold mb-1">{formatHour(bestHour.hour)}</div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(bestHour.totalPnL)} from {bestHour.totalTrades} trades
            </div>
          </div>
        )}

        {/* Best Day */}
        {bestDay && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Best Day</span>
            </div>
            <div className="text-2xl font-bold mb-1">{bestDay.dayName}</div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(bestDay.totalPnL)} from {bestDay.totalTrades} trades
            </div>
          </div>
        )}

        {/* Worst Hour (if negative) */}
        {worstHour && worstHour.totalPnL < 0 && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Avoid This Hour</span>
            </div>
            <div className="text-2xl font-bold mb-1">{formatHour(worstHour.hour)}</div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(worstHour.totalPnL)} from {worstHour.totalTrades} trades
            </div>
          </div>
        )}

        {/* Worst Day (if negative) */}
        {worstDay && worstDay.totalPnL < 0 && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Avoid This Day</span>
            </div>
            <div className="text-2xl font-bold mb-1">{worstDay.dayName}</div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(worstDay.totalPnL)} from {worstDay.totalTrades} trades
            </div>
          </div>
        )}
      </div>

      {/* Hourly Performance Table */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Performance by Hour
        </h3>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {hourlyMetrics.map(({ hour, totalPnL, totalTrades }) => {
            if (totalTrades === 0) return null;
            
            return (
              <motion.div
                key={hour}
                whileHover={{ scale: 1.05 }}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  getHeatColor(totalPnL, maxAbsPnL),
                  totalPnL > 0 ? 'border-green-500/20' : totalPnL < 0 ? 'border-red-500/20' : 'border-border'
                )}
                title={`${formatHour(hour)}: ${formatCurrency(totalPnL)} (${totalTrades} trades)`}
              >
                <div className="text-xs font-semibold text-center">{formatHour(hour)}</div>
                <div className="text-xs text-center mt-1 font-medium">
                  {formatCurrency(totalPnL)}
                </div>
                <div className="text-[10px] text-center text-muted-foreground mt-0.5">
                  {totalTrades} trades
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Daily Performance Table */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Performance by Day
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {dailyMetrics.map(({ day, dayName, totalPnL, totalTrades, winRate }) => {
            if (totalTrades === 0) return null;
            
            return (
              <motion.div
                key={day}
                whileHover={{ scale: 1.02 }}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all",
                  getHeatColor(totalPnL, maxAbsPnL),
                  totalPnL > 0 ? 'border-green-500/20' : totalPnL < 0 ? 'border-red-500/20' : 'border-border'
                )}
              >
                <div className="text-sm font-semibold mb-2">{dayName}</div>
                <div className="text-lg font-bold mb-1">{formatCurrency(totalPnL)}</div>
                <div className="text-xs text-muted-foreground">
                  {totalTrades} trades • {winRate.toFixed(0)}% WR
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card rounded-2xl shadow-lg border border-border p-6 relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Time Intelligence
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Discover your best trading hours and days
          </p>
        </div>
        <PremiumBadge variant="subtle" />
      </div>

      {/* Premium Lock Overlay */}
      {!isPremium && (
        <div className="absolute inset-0 bg-card/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 p-6">
          <div className="text-center max-w-md">
            <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Unlock Time Intelligence</h3>
            <p className="text-muted-foreground mb-6">
              Discover your most profitable hours and days. Optimize your trading schedule
              based on data, not guesses. Upgrade to Premium to unlock.
            </p>
            <button 
              onClick={onUpgrade}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium mx-auto"
            >
              <Sparkles className="w-5 h-5" />
              Upgrade to Premium
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {renderContent()}
    </motion.div>
  );
};

export default TimeIntelligence;

