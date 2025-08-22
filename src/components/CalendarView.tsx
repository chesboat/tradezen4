import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Zap,
  Eye,
  Settings,
  BookOpen,
  Share2
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore, getAccountIdsForSelection } from '@/store/useAccountFilterStore';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { CalendarDay, WeeklySummary, MoodType } from '@/types';
import { formatCurrency, formatDate, getMoodColor } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';
import { DayDetailModal } from './DayDetailModal';
import { CalendarShareModal } from './CalendarShareModal';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface CalendarViewProps {
  className?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ className }) => {
  const { selectedAccountId } = useAccountFilterStore();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { trades } = useTradeStore();
  const { getNotesForDate } = useQuickNoteStore();
  const { reflections, getReflectionByDate } = useDailyReflectionStore();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [hoveredDay, setHoveredDay] = useState<CalendarDay | null>(null);

  // Helper function to create calendar day data
  const createCalendarDay = useCallback((date: Date, isOtherMonth: boolean): CalendarDay => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Get trades for this day
    const dayTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.entryTime);
      if (!(tradeDate >= dayStart && tradeDate <= dayEnd)) return false;
      if (!selectedAccountId) return true;
      const ids = getAccountIdsForSelection(selectedAccountId);
      return ids.includes(trade.accountId);
    });
    
    // Calculate day statistics
    const pnl = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const tradesCount = dayTrades.length;
    const avgRR = tradesCount > 0 
      ? dayTrades.reduce((sum, trade) => sum + trade.riskRewardRatio, 0) / tradesCount 
      : 0;
    
    const winningTrades = dayTrades.filter(trade => (trade.pnl || 0) > 0);
    const winRate = tradesCount > 0 ? (winningTrades.length / tradesCount) * 100 : 0;
    
    // Calculate mood (simplified)
    const dayMoods = dayTrades.map(trade => trade.mood).filter(Boolean);
    const avgMoodScore = dayMoods.length > 0 
      ? dayMoods.reduce((sum, mood) => {
          const moodScores = { excellent: 5, good: 4, neutral: 3, poor: 2, terrible: 1 };
          return sum + moodScores[mood];
        }, 0) / dayMoods.length 
      : 3;
    
    const mood: MoodType = avgMoodScore >= 4.5 ? 'excellent' :
                          avgMoodScore >= 3.5 ? 'good' :
                          avgMoodScore >= 2.5 ? 'neutral' :
                          avgMoodScore >= 1.5 ? 'poor' : 'terrible';
    
    // Get notes for this day
    const dayNotes = getNotesForDate(date).filter(note => {
      if (!selectedAccountId) return true;
      const ids = getAccountIdsForSelection(selectedAccountId);
      return ids.includes(note.accountId);
    });
    
    // Check if a reflection exists for this day
    const dateString = date.toISOString().split('T')[0];
    const hasReflection = reflections.find(r => {
      if (r.date !== dateString) return false;
      if (!selectedAccountId) return true;
      const ids = getAccountIdsForSelection(selectedAccountId);
      return ids.includes(r.accountId);
    }) !== undefined;
    
    return {
      date,
      pnl,
      tradesCount,
      avgRR,
      xpEarned: dayTrades.reduce((sum, trade) => sum + 10, 0), // Base XP calculation
      mood,
      quickNotesCount: dayNotes.length,
      hasNews: false, // TODO: Implement news integration
      hasReflection,
      winRate,
      isOtherMonth,
    };
  }, [trades, selectedAccountId, getNotesForDate, reflections]);

  // Calculate calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Get previous month's last few days
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    
    // Build calendar grid
    const calendarDays: CalendarDay[] = [];
    const weeks: CalendarDay[][] = [];
    
    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i);
      calendarDays.push(createCalendarDay(date, true));
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      calendarDays.push(createCalendarDay(date, false));
    }
    
    // Next month days to fill grid
    const totalCells = Math.ceil(calendarDays.length / 7) * 7;
    for (let day = 1; calendarDays.length < totalCells; day++) {
      const date = new Date(year, month + 1, day);
      calendarDays.push(createCalendarDay(date, true));
    }
    
    // Group into weeks
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    
    return { calendarDays, weeks };
  }, [currentDate, createCalendarDay]);

  // Calculate weekly summaries
  const weeklyData = useMemo(() => {
    return calendarData.weeks.map((week, index) => {
      const weekDays = week.filter(day => !day.isOtherMonth && day.tradesCount > 0);
      const totalPnl = weekDays.reduce((sum, day) => sum + day.pnl, 0);
      const totalXP = weekDays.reduce((sum, day) => sum + day.xpEarned, 0);
      const totalTrades = weekDays.reduce((sum, day) => sum + day.tradesCount, 0);
      
      const avgMoodScore = weekDays.length > 0 
        ? weekDays.reduce((sum, day) => {
            const moodScores = { excellent: 5, good: 4, neutral: 3, poor: 2, terrible: 1 };
            return sum + moodScores[day.mood];
          }, 0) / weekDays.length 
        : 3;
      
      const avgMood: MoodType = avgMoodScore >= 4.5 ? 'excellent' :
                               avgMoodScore >= 3.5 ? 'good' :
                               avgMoodScore >= 2.5 ? 'neutral' :
                               avgMoodScore >= 1.5 ? 'poor' : 'terrible';
      
      const avgRR = weekDays.length > 0 
        ? weekDays.reduce((sum, day) => sum + day.avgRR, 0) / weekDays.length 
        : 0;
      
      const avgWinRate = weekDays.length > 0 
        ? weekDays.reduce((sum, day) => sum + day.winRate, 0) / weekDays.length 
        : 0;

      return {
        weekStart: week[0].date,
        weekEnd: week[6].date,
        totalPnl,
        totalXP,
        avgMood,
        tradesCount: totalTrades,
        winRate: avgWinRate,
        avgRR,
        activeDays: weekDays.length,
        weekNumber: index + 1,
      };
    });
  }, [calendarData.weeks]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDayClassName = (day: CalendarDay) => {
    const isToday = new Date().toDateString() === day.date.toDateString();
    const isSelected = selectedDay?.date.toDateString() === day.date.toDateString();
    const isHovered = hoveredDay?.date.toDateString() === day.date.toDateString();
    
    return cn(
      'relative p-3 rounded-xl border border-border/50 transition-all duration-200 cursor-pointer',
      'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10',
      day.isOtherMonth && 'opacity-40',
      isToday && 'ring-2 ring-primary/50',
      isSelected && 'bg-primary/10 border-primary',
      isHovered && 'bg-accent/50',
      day.tradesCount > 0 && 'bg-muted/30',
      day.pnl > 0 && 'border-green-500/30 bg-green-50/10',
      day.pnl < 0 && 'border-red-500/30 bg-red-50/10',
    );
  };

  const formatPnL = (pnl: number) => {
    if (pnl === 0) return null;
    return (
      <div className={cn(
        'text-sm font-bold',
        pnl > 0 ? 'text-green-500' : 'text-red-500'
      )}>
        {formatCurrency(pnl)}
      </div>
    );
  };

  const currentMonth = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  return (
    <div className={cn('w-full max-w-7xl mx-auto p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            
            <h1 className="text-2xl font-bold text-foreground">
              {currentMonth} {currentYear}
            </h1>
            
            <motion.button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
          
          <motion.button
            onClick={goToToday}
            className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            TODAY
          </motion.button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Monthly stats: <span className="font-semibold text-green-500">{formatCurrency(weeklyData.reduce((sum, week) => sum + week.totalPnl, 0))}</span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setIsShareModalOpen(true)}
              className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Share2 className="w-4 h-4" />
              Share Calendar
            </motion.button>
            <motion.button
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Eye className="w-5 h-5" />
            </motion.button>
            <motion.button
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-8 gap-3">
        {/* Day Headers */}
        <div className="col-span-7 grid grid-cols-7 gap-3 mb-4">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center font-semibold text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Week Header */}
        <div className="text-center font-semibold text-muted-foreground py-2">
          Week
        </div>

        {/* Calendar Weeks */}
        {calendarData.weeks.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {/* Week Days */}
            <div className="col-span-7 grid grid-cols-7 gap-3">
              {week.map((day, dayIndex) => (
                <motion.div
                  key={`${weekIndex}-${dayIndex}`}
                  className={getDayClassName(day)}
                  onClick={() => setSelectedDay(day)}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  layout
                >
                  <div className="space-y-1">
                    {/* Date */}
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        'text-sm font-medium',
                        day.isOtherMonth ? 'text-muted-foreground' : 'text-foreground'
                      )}>
                        {day.date.getDate()}
                      </span>
                      <div className="flex items-center gap-1">
                        {day.hasNews && (
                          <CalendarIcon className="w-3 h-3 text-primary" />
                        )}
                        {day.hasReflection && (
                          <BookOpen className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                    </div>
                    
                    {/* P&L */}
                    {formatPnL(day.pnl)}
                    
                    {/* Trade Count */}
                    {day.tradesCount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {day.tradesCount} trade{day.tradesCount > 1 ? 's' : ''}
                      </div>
                    )}
                    
                    {/* Metrics */}
                    {day.tradesCount > 0 && (
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div>{day.avgRR.toFixed(1)}:1R, {day.winRate.toFixed(0)}%</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Weekly Summary */}
            <motion.div
              className="bg-muted/30 border border-border/50 rounded-xl p-4 hover:bg-muted/50 transition-colors"
              whileHover={{ scale: 1.01 }}
            >
              <div className="text-center space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Week {weeklyData[weekIndex]?.weekNumber}
                </div>
                <div className={cn(
                  'text-lg font-bold',
                  weeklyData[weekIndex]?.totalPnl > 0 ? 'text-green-500' : 
                  weeklyData[weekIndex]?.totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground'
                )}>
                  {formatCurrency(weeklyData[weekIndex]?.totalPnl || 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {weeklyData[weekIndex]?.activeDays || 0} days
                </div>
              </div>
            </motion.div>
          </React.Fragment>
        ))}
      </div>

      {/* Day Detail Modal */}
      <DayDetailModal
        day={selectedDay}
        isOpen={!!selectedDay}
        onClose={() => setSelectedDay(null)}
      />

      {/* Calendar Share Modal */}
      <CalendarShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentDate={currentDate}
        calendarData={calendarData}
        weeklyData={weeklyData}
      />
    </div>
  );
}; 