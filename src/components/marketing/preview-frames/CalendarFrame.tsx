/**
 * Calendar Frame - Marketing Preview
 * Shows calendar with P&L tracking (matches actual product design)
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Flame, ChevronLeft, ChevronRight, Share2, Eye, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarFrameProps {
  theme: 'light' | 'dark';
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Demo calendar data - October 2025 with positive P&L
const calendarDays = [
  // Week 1
  { date: 28, isCurrentMonth: false },
  { date: 29, isCurrentMonth: false },
  { date: 30, isCurrentMonth: false },
  { date: 1, pnl: 0, trades: 0, isWeekend: false },
  { date: 2, pnl: 0, trades: 0, isWeekend: false },
  { date: 3, pnl: 0, trades: 0, isWeekend: false },
  { date: 4, pnl: 0, trades: 0, isWeekend: true },
  
  // Week 2
  { date: 5, pnl: 0, trades: 0, isWeekend: true },
  { date: 6, pnl: 0, trades: 0, isWeekend: false },
  { date: 7, pnl: 0, trades: 0, isWeekend: false, isToday: true },
  { date: 8, pnl: 0, trades: 0, isWeekend: false },
  { date: 9, pnl: 0, trades: 0, isWeekend: false },
  { date: 10, pnl: 0, trades: 0, isWeekend: false },
  { date: 11, pnl: 0, trades: 0, isWeekend: true },
  
  // Week 3
  { date: 12, pnl: 0, trades: 0, isWeekend: true },
  { date: 13, pnl: 0, trades: 0, isWeekend: false },
  { date: 14, pnl: 0, trades: 0, isWeekend: false },
  { date: 15, pnl: 0, trades: 0, isWeekend: false },
  { date: 16, pnl: 0, trades: 0, isWeekend: false },
  { date: 17, pnl: 0, trades: 0, isWeekend: false },
  { date: 18, pnl: 0, trades: 0, isWeekend: true },
  
  // Week 4 - Trading days with P&L
  { date: 19, pnl: 0, trades: 0, isWeekend: true },
  { date: 20, pnl: 0, trades: 0, isWeekend: false },
  { date: 21, pnl: 366, trades: 1, isWeekend: false, hasStreak: true },
  { date: 22, pnl: 580, trades: 3, isWeekend: false, hasStreak: true },
  { date: 23, pnl: 330, trades: 1, isWeekend: false, hasStreak: true },
  { date: 24, pnl: 329, trades: 3, isWeekend: false, hasStreak: true },
  { date: 25, pnl: 0, trades: 0, isWeekend: true },
  
  // Week 5
  { date: 26, pnl: 0, trades: 0, isWeekend: true },
  { date: 27, pnl: 612, trades: 3, isWeekend: false, hasStreak: true },
  { date: 28, pnl: 307, trades: 1, isWeekend: false, hasStreak: true },
  { date: 29, pnl: 0, trades: 0, isWeekend: false },
  { date: 30, pnl: 0, trades: 0, isWeekend: false },
  { date: 31, pnl: 0, trades: 0, isWeekend: false },
  { date: 1, isCurrentMonth: false },
];

const weeklyStats = [
  { week: 1, pnl: 0, days: 0 },
  { week: 2, pnl: 0, days: 0 },
  { week: 3, pnl: 0, days: 0 },
  { week: 4, pnl: 1605, days: 4 }, // +$366 +$580 +$330 +$329
  { week: 5, pnl: 919, days: 2 },  // +$612 +$307
];

export const CalendarFrame: React.FC<CalendarFrameProps> = ({ theme }) => {
  return (
    <div className={cn(
      'w-full h-full flex p-6',
      theme === 'dark' ? 'dark bg-background' : 'bg-white'
    )}>
      <div className="flex-1 space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h2 className="text-2xl font-bold text-foreground">
              October 2025
            </h2>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              TODAY
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Monthly stats:</span>
            <span className="text-lg font-bold text-green-500">+$2,524.62</span>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <Share2 className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <Eye className="w-4 h-4 text-muted-foreground" />
            </button>
            <button className="p-2 hover:bg-accent rounded-lg transition-colors">
              <Settings className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </motion.div>

        {/* Calendar Grid */}
        <div className="flex gap-4 flex-1">
          {/* Main Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1"
          >
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.3 + index * 0.01,
                  }}
                  className={cn(
                    'aspect-square rounded-lg border transition-all relative',
                    day.isCurrentMonth === false 
                      ? 'bg-muted/20 border-transparent opacity-30'
                      : day.isToday
                      ? 'bg-primary/10 border-primary'
                      : (day.pnl ?? 0) > 0
                      ? 'bg-card border-border hover:border-primary/50'
                      : day.isWeekend
                      ? 'bg-muted/10 border-transparent'
                      : 'bg-card border-border hover:border-border'
                  )}
                >
                  <div className="p-2 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-1">
                      <span className={cn(
                        'text-xs font-medium',
                        day.isCurrentMonth === false ? 'text-muted-foreground/50' : 'text-foreground'
                      )}>
                        {day.date}
                      </span>
                      {day.hasStreak && (
                        <Flame className="w-3 h-3 text-orange-500" />
                      )}
                    </div>
                    {(day.pnl ?? 0) > 0 && (
                      <div className="mt-auto">
                        <div className="text-xs font-bold text-green-500">
                          +${day.pnl}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {day.trades} trade{day.trades !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                    {day.isWeekend && day.pnl === 0 && day.isCurrentMonth !== false && (
                      <div className="mt-auto">
                        <div className="text-[10px] text-muted-foreground">
                          Weekend
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Weekly Summary Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="w-48 space-y-2"
          >
            <div className="text-sm font-semibold text-foreground mb-3">Week</div>
            {weeklyStats.map((week, index) => (
              <motion.div
                key={week.week}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className={cn(
                  'p-3 rounded-lg border transition-all',
                  week.pnl > 0 
                    ? 'bg-card border-border' 
                    : 'bg-muted/10 border-transparent'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Week {week.week}</span>
                  {week.pnl > 0 && (
                    <Flame className="w-3 h-3 text-orange-500" />
                  )}
                </div>
                <div className={cn(
                  'text-lg font-bold',
                  week.pnl > 0 ? 'text-green-500' : 'text-muted-foreground'
                )}>
                  {week.pnl > 0 ? `+$${week.pnl.toLocaleString()}` : '$0'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {week.days} day{week.days !== 1 ? 's' : ''}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

