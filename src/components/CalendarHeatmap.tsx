/**
 * Calendar Heatmap - Premium Feature
 * GitHub contributions style meets Apple Health
 * Pure visual P&L analysis - minimal, beautiful, shareable
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Lock, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { Trade } from '@/types';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';
import { PremiumBadge } from './PremiumBadge';

interface DayData {
  date: string;
  pnl: number;
  tradeCount: number;
  winRate: number;
}

interface CalendarHeatmapProps {
  trades: Trade[];
  isPremium: boolean;
  onUpgrade?: () => void;
  monthsToShow?: number; // Default: 3 months
}

// Calculate color intensity based on P&L
const getPnLColor = (pnl: number, maxAbsPnL: number): string => {
  if (pnl === 0) return 'bg-muted/30'; // Gray for breakeven
  
  const intensity = Math.min(Math.abs(pnl) / maxAbsPnL, 1);
  
  if (pnl > 0) {
    // Green gradient (light → dark)
    if (intensity > 0.75) return 'bg-green-600 dark:bg-green-500';
    if (intensity > 0.5) return 'bg-green-500 dark:bg-green-400';
    if (intensity > 0.25) return 'bg-green-400 dark:bg-green-300';
    return 'bg-green-300 dark:bg-green-200';
  } else {
    // Red gradient (light → dark)
    if (intensity > 0.75) return 'bg-red-600 dark:bg-red-500';
    if (intensity > 0.5) return 'bg-red-500 dark:bg-red-400';
    if (intensity > 0.25) return 'bg-red-400 dark:bg-red-300';
    return 'bg-red-300 dark:bg-red-200';
  }
};

export const CalendarHeatmap: React.FC<CalendarHeatmapProps> = ({
  trades,
  isPremium,
  onUpgrade,
  monthsToShow = 3,
}) => {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  // Process trades into daily P&L
  const { heatmapData, maxAbsPnL, stats } = useMemo(() => {
    const dayMap = new Map<string, DayData>();
    
    // Group trades by day
    trades.forEach(trade => {
      const date = new Date(trade.entryTime);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!dayMap.has(dateStr)) {
        dayMap.set(dateStr, {
          date: dateStr,
          pnl: 0,
          tradeCount: 0,
          winRate: 0,
        });
      }
      
      const dayData = dayMap.get(dateStr)!;
      dayData.pnl += trade.pnl || 0;
      dayData.tradeCount += 1;
    });

    // Calculate win rate for each day
    dayMap.forEach((dayData) => {
      const dayTrades = trades.filter(t => {
        const tradeDate = new Date(t.entryTime).toISOString().split('T')[0];
        return tradeDate === dayData.date;
      });
      const wins = dayTrades.filter(t => (t.pnl || 0) > 0).length;
      dayData.winRate = dayTrades.length > 0 ? (wins / dayTrades.length) * 100 : 0;
    });

    // Calculate max absolute P&L for color scaling
    let maxAbs = 0;
    dayMap.forEach(day => {
      maxAbs = Math.max(maxAbs, Math.abs(day.pnl));
    });

    // Calculate overall stats
    const profitDays = Array.from(dayMap.values()).filter(d => d.pnl > 0).length;
    const lossDays = Array.from(dayMap.values()).filter(d => d.pnl < 0).length;
    const totalDays = dayMap.size;
    const dayWinRate = totalDays > 0 ? (profitDays / totalDays) * 100 : 0;
    const totalPnL = Array.from(dayMap.values()).reduce((sum, d) => sum + d.pnl, 0);

    return {
      heatmapData: dayMap,
      maxAbsPnL: maxAbs,
      stats: { profitDays, lossDays, totalDays, dayWinRate, totalPnL },
    };
  }, [trades]);

  // Generate calendar grid (last N months)
  const calendarGrid = useMemo(() => {
    const weeks: Array<Array<{ date: string; dayData: DayData | null }>> = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setMonth(startDate.getMonth() - monthsToShow);
    startDate.setDate(1); // Start from first of month

    // Find the Monday of the week containing startDate
    const dayOfWeek = startDate.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust to Monday
    startDate.setDate(startDate.getDate() - diff);

    let currentWeek: Array<{ date: string; dayData: DayData | null }> = [];
    const currentDate = new Date(startDate);

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = heatmapData.get(dateStr) || null;

      currentWeek.push({ date: dateStr, dayData });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [heatmapData, monthsToShow]);

  // Show locked state for non-premium users
  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden"
      >
        {/* Blurred preview */}
        <div className="absolute inset-0 backdrop-blur-sm bg-background/50 z-10 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Calendar Heatmap</h3>
            <p className="text-muted-foreground">
              Visualize your daily P&L at a glance. Spot patterns, track consistency, and share your progress.
            </p>
            <button
              onClick={onUpgrade}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-semibold"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>

        {/* Preview content (blurred) */}
        <div className="space-y-4 opacity-30">
          <div className="mb-4">
            <h2 className="text-xl font-bold">Performance Heatmap</h2>
          </div>
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-1">
                {[...Array(12)].map((_, j) => (
                  <div key={j} className="w-6 h-6 bg-muted/50 rounded-sm" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // No trades
  if (trades.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-8"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-2xl flex items-center justify-center">
            <Calendar className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No Trading Data Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start logging trades to see your performance heatmap!
          </p>
        </div>
      </motion.div>
    );
  }

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Performance Heatmap
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Last {monthsToShow} months • {stats.totalDays} trading days
          </p>
        </div>
        {/* Apple-style: No badges for features you have access to */}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-3 bg-muted/30 rounded-xl">
          <div className="text-xs text-muted-foreground mb-1">Total P&L</div>
          <div className={cn(
            "text-lg font-bold",
            stats.totalPnL > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
          )}>
            {formatCurrency(stats.totalPnL)}
          </div>
        </div>
        <div className="p-3 bg-muted/30 rounded-xl">
          <div className="text-xs text-muted-foreground mb-1">Day Win Rate</div>
          <div className="text-lg font-bold">{stats.dayWinRate.toFixed(0)}%</div>
        </div>
        <div className="p-3 bg-green-500/10 rounded-xl">
          <div className="text-xs text-green-600 dark:text-green-400 mb-1">Profit Days</div>
          <div className="text-lg font-bold text-green-600 dark:text-green-400">{stats.profitDays}</div>
        </div>
        <div className="p-3 bg-red-500/10 rounded-xl">
          <div className="text-xs text-red-600 dark:text-red-400 mb-1">Loss Days</div>
          <div className="text-lg font-bold text-red-600 dark:text-red-400">{stats.lossDays}</div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-1 min-w-full">
          {/* Day labels */}
          <div className="flex gap-1">
            <div className="w-8" /> {/* Spacer for day labels */}
            {calendarGrid[0]?.map((_, weekIndex) => {
              // Show month labels for first week of each month
              if (weekIndex % 4 === 0) {
                const date = new Date(calendarGrid[0][weekIndex].date);
                const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                return (
                  <div key={weekIndex} className="text-[10px] text-muted-foreground w-8 text-center">
                    {monthName}
                  </div>
                );
              }
              return <div key={weekIndex} className="w-8" />;
            })}
          </div>

          {/* Heatmap rows */}
          {dayLabels.map((label, dayIndex) => (
            <div key={label} className="flex gap-1 items-center">
              <div className="w-8 text-[10px] text-muted-foreground text-right pr-1">
                {label}
              </div>
              {calendarGrid.map((week, weekIndex) => {
                const day = week[dayIndex];
                if (!day) return <div key={`${weekIndex}-empty`} className="w-8 h-8" />;

                const isToday = day.date === new Date().toISOString().split('T')[0];
                const isFuture = new Date(day.date) > new Date();

                return (
                  <motion.div
                    key={`${weekIndex}-${dayIndex}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: (weekIndex * 7 + dayIndex) * 0.002 }}
                    className={cn(
                      "w-8 h-8 rounded-sm transition-all cursor-pointer",
                      day.dayData ? getPnLColor(day.dayData.pnl, maxAbsPnL) : "bg-muted/20",
                      isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                      isFuture && "opacity-30 cursor-not-allowed",
                      day.dayData && "hover:ring-2 hover:ring-primary/50 hover:scale-110"
                    )}
                    onMouseEnter={(e) => {
                      if (day.dayData && !isFuture) {
                        setHoveredDay(day.dayData);
                        setHoverPosition({ x: e.clientX, y: e.clientY });
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredDay(null);
                      setHoverPosition(null);
                    }}
                    onMouseMove={(e) => {
                      if (day.dayData && !isFuture) {
                        setHoverPosition({ x: e.clientX, y: e.clientY });
                      }
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded-sm bg-red-300 dark:bg-red-200" />
          <div className="w-4 h-4 rounded-sm bg-red-400 dark:bg-red-300" />
          <div className="w-4 h-4 rounded-sm bg-muted/30" />
          <div className="w-4 h-4 rounded-sm bg-green-400 dark:bg-green-300" />
          <div className="w-4 h-4 rounded-sm bg-green-600 dark:bg-green-500" />
        </div>
        <span>More</span>
      </div>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {hoveredDay && hoverPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: hoverPosition.x + 10,
              top: hoverPosition.y - 80,
            }}
          >
            <div className="bg-popover border border-border rounded-lg shadow-xl p-3 min-w-[180px]">
              <div className="text-xs text-muted-foreground mb-1">
                {new Date(hoveredDay.date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <div className={cn(
                "text-lg font-bold mb-1",
                hoveredDay.pnl > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {hoveredDay.pnl > 0 ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                {formatCurrency(hoveredDay.pnl)}
              </div>
              <div className="text-xs text-muted-foreground">
                {hoveredDay.tradeCount} {hoveredDay.tradeCount === 1 ? 'trade' : 'trades'} • {hoveredDay.winRate.toFixed(0)}% win rate
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CalendarHeatmap;

