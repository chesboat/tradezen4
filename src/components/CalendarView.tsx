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
import { useSidebarStore } from '@/store/useSidebarStore';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { useTodoStore } from '@/store/useTodoStore';
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
  
  // Sidebar state detection for dynamic layout
  const { isExpanded: sidebarExpanded } = useSidebarStore();
  const { isExpanded: activityLogExpanded } = useActivityLogStore();
  const { isExpanded: todoExpanded } = useTodoStore();
  
  // Calculate available space and adjust layout accordingly
  const bothSidebarsExpanded = sidebarExpanded && activityLogExpanded;
  const allExpanded = sidebarExpanded && activityLogExpanded && todoExpanded;
  
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
    
    // Dynamic height and padding based on sidebar states
    const paddingClasses = bothSidebarsExpanded 
      ? 'p-2 2xl:p-3 3xl:p-4' 
      : 'p-3 2xl:p-4 3xl:p-5';
    
    const heightClasses = allExpanded
      ? 'min-h-[80px] 2xl:min-h-[90px] 3xl:min-h-[100px] 4xl:min-h-[110px]'
      : bothSidebarsExpanded
      ? 'min-h-[85px] 2xl:min-h-[100px] 3xl:min-h-[115px] 4xl:min-h-[130px]'
      : 'min-h-[100px] 2xl:min-h-[120px] 3xl:min-h-[140px] 4xl:min-h-[160px]';
    
    return cn(
      'relative rounded-xl border border-border/50 transition-all duration-300 cursor-pointer',
      paddingClasses,
      heightClasses,
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
        'text-base 2xl:text-lg 3xl:text-xl 4xl:text-2xl font-bold',
        pnl > 0 ? 'text-green-500' : 'text-red-500'
      )}>
        {formatCurrency(pnl)}
      </div>
    );
  };

  const currentMonth = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // Dynamic container classes based on sidebar states
  const getContainerClasses = () => {
    const baseClasses = 'w-full mx-auto transition-all duration-300';
    const paddingClasses = bothSidebarsExpanded ? 'p-4 2xl:p-6' : 'p-6 2xl:p-8 3xl:p-10';
    
    let maxWidthClasses;
    if (allExpanded) {
      // All sidebars expanded - very constrained space
      maxWidthClasses = 'max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl 4xl:max-w-7xl';
    } else if (bothSidebarsExpanded) {
      // Both main sidebars expanded - moderately constrained
      maxWidthClasses = 'max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl 4xl:max-w-[1800px]';
    } else {
      // Normal or single sidebar - full space
      maxWidthClasses = 'max-w-7xl 2xl:max-w-[1800px] 3xl:max-w-[2200px] 4xl:max-w-[2600px]';
    }
    
    return `${baseClasses} ${maxWidthClasses} ${paddingClasses}`;
  };

  return (
    <div className={cn(getContainerClasses(), className)}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between transition-all duration-300",
        bothSidebarsExpanded ? "mb-6" : "mb-8"
      )}>
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
      <div className={cn(
        "grid grid-cols-8 transition-all duration-300",
        bothSidebarsExpanded ? "gap-2 2xl:gap-3" : "gap-3 2xl:gap-4 3xl:gap-5"
      )}>
        {/* Day Headers */}
        <div className={cn(
          "col-span-7 grid grid-cols-7 mb-4 transition-all duration-300",
          bothSidebarsExpanded ? "gap-2 2xl:gap-3" : "gap-3 2xl:gap-4 3xl:gap-5"
        )}>
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="text-center font-semibold text-muted-foreground py-2 text-sm 2xl:text-base 3xl:text-lg">
              {day}
            </div>
          ))}
        </div>
        
        {/* Week Header */}
        <div className="text-center font-semibold text-muted-foreground py-2 text-sm 2xl:text-base 3xl:text-lg">
          Week
        </div>

        {/* Calendar Weeks */}
        {calendarData.weeks.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {/* Week Days */}
            <div className={cn(
              "col-span-7 grid grid-cols-7 transition-all duration-300",
              bothSidebarsExpanded ? "gap-2 2xl:gap-3" : "gap-3 2xl:gap-4 3xl:gap-5"
            )}>
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
                        'text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl font-medium',
                        day.isOtherMonth ? 'text-muted-foreground' : 'text-foreground'
                      )}>
                        {day.date.getDate()}
                      </span>
                      <div className="flex items-center gap-1 2xl:gap-1.5">
                        {day.hasNews && (
                          <CalendarIcon className="w-3 h-3 2xl:w-4 2xl:h-4 3xl:w-5 3xl:h-5 text-primary" />
                        )}
                        {day.hasReflection && (
                          <BookOpen className="w-3 h-3 2xl:w-4 2xl:h-4 3xl:w-5 3xl:h-5 text-green-500" />
                        )}
                      </div>
                    </div>
                    
                    {/* P&L */}
                    {formatPnL(day.pnl)}
                    
                    {/* Trade Count */}
                    {day.tradesCount > 0 && (
                      <div className="text-xs 2xl:text-sm 3xl:text-base text-muted-foreground">
                        {day.tradesCount} trade{day.tradesCount > 1 ? 's' : ''}
                      </div>
                    )}
                    
                    {/* Metrics */}
                    {day.tradesCount > 0 && (
                      <div className="text-xs 2xl:text-sm 3xl:text-base text-muted-foreground space-y-0.5">
                        <div>{day.avgRR.toFixed(1)}:1R, {day.winRate.toFixed(0)}%</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Weekly Summary */}
            <motion.div
              className="bg-muted/30 border border-border/50 rounded-xl p-4 2xl:p-5 3xl:p-6 hover:bg-muted/50 transition-colors min-h-[100px] 2xl:min-h-[120px] 3xl:min-h-[140px] 4xl:min-h-[160px] flex items-center justify-center"
              whileHover={{ scale: 1.01 }}
            >
              <div className="text-center space-y-2">
                <div className="text-sm 2xl:text-base 3xl:text-lg font-medium text-muted-foreground">
                  Week {weeklyData[weekIndex]?.weekNumber}
                </div>
                <div className={cn(
                  'text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl font-bold',
                  weeklyData[weekIndex]?.totalPnl > 0 ? 'text-green-500' : 
                  weeklyData[weekIndex]?.totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground'
                )}>
                  {formatCurrency(weeklyData[weekIndex]?.totalPnl || 0)}
                </div>
                <div className="text-xs 2xl:text-sm 3xl:text-base text-muted-foreground">
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