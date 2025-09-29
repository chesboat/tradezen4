import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  Share2,
  FileText,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore, getAccountIdsForSelection } from '@/store/useAccountFilterStore';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useWeeklyReviewStore } from '@/store/useWeeklyReviewStore';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { useTodoStore } from '@/store/useTodoStore';
import { CalendarDay, WeeklySummary, MoodType, WeeklyReview } from '@/types';
import { formatCurrency, formatDate, getMoodColor } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';
import { DayDetailModal } from './DayDetailModal';
import { CalendarShareModal } from './CalendarShareModal';
import { WeeklyReviewModal } from './WeeklyReviewModal';
import { WeeklyReviewViewModal } from './WeeklyReviewViewModal';
import { Tooltip } from './ui/Tooltip';

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
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);
  const [weeklyReviewWeek, setWeeklyReviewWeek] = useState<string | undefined>(undefined);
  const [selectedWeeklyReview, setSelectedWeeklyReview] = useState<WeeklyReview | null>(null);
  const [isWeeklyReviewViewOpen, setIsWeeklyReviewViewOpen] = useState(false);
  const { trades } = useTradeStore();
  const { getNotesForDate } = useQuickNoteStore();
  const { reflections, getReflectionByDate } = useDailyReflectionStore();
  const { getMondayOfWeek, isWeekReviewAvailable, getCurrentWeekReview, getReviewByWeek } = useWeeklyReviewStore();
  
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

  // Advanced responsive system based on available space
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1920);
  const [tileSize, setTileSize] = useState<number>(0);
  useEffect(() => {
    const onResize = () => {
      setViewportWidth(window.innerWidth);
      // Recompute a representative tile width
      const el = document.querySelector('[data-day-tile]') as HTMLElement | null;
      if (el) setTileSize(el.clientWidth);
    };
    window.addEventListener('resize', onResize);
    // Initial compute
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Observe tile size changes (covers Firefox when sidebars expand without window resize)
  useEffect(() => {
    const el = document.querySelector('[data-day-tile]') as HTMLElement | null;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      if (entries[0]) {
        const w = Math.floor(entries[0].contentRect.width);
        if (w > 0) setTileSize(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [bothSidebarsExpanded, activityLogExpanded, sidebarExpanded]);
  
  // Calculate available space more precisely
  const getSpaceLevel = (): 'ultra-compact' | 'compact' | 'normal' | 'spacious' => {
    const sidebarWidth = sidebarExpanded ? 280 : 80;
    const activityWidth = activityLogExpanded ? 320 : 0;
    const todoWidth = todoExpanded ? 320 : 0;
    const usedSpace = sidebarWidth + activityWidth + todoWidth;
    const availableSpace = viewportWidth - usedSpace - 64; // 64px for margins
    
    // Tuned breakpoints: only use ultra-compact at very tight widths
    if (availableSpace < 1000) return 'ultra-compact';
    if (availableSpace < 1400) return 'compact';
    if (availableSpace < 1800) return 'normal';
    return 'spacious';
  };
  
  const spaceLevel = getSpaceLevel();
  const compactMode = spaceLevel === 'ultra-compact' || spaceLevel === 'compact';

  // Listen for weekly review open events from todo links
  useEffect(() => {
    const handleOpenWeeklyReview = (event: CustomEvent) => {
      const { weekOf } = event.detail;
      if (weekOf && selectedAccountId) {
        const review = getReviewByWeek(weekOf, selectedAccountId);
        
        if (review && review.isComplete) {
          // Show completed review
          setSelectedWeeklyReview(review);
          setIsWeeklyReviewViewOpen(true);
        } else {
          // Edit or create review
          setWeeklyReviewWeek(weekOf);
          setIsWeeklyReviewOpen(true);
        }
      }
    };

    window.addEventListener('openWeeklyReview', handleOpenWeeklyReview as EventListener);
    // If there is a pending intent (from a todo link), honor it on mount
    try {
      const pending = (window as any).__pendingOpenWeeklyReview as string | undefined;
      if (pending) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('openWeeklyReview', { detail: { weekOf: pending } }));
          (window as any).__pendingOpenWeeklyReview = undefined;
        }, 50);
      }
    } catch {}
    return () => {
      window.removeEventListener('openWeeklyReview', handleOpenWeeklyReview as EventListener);
    };
  }, [selectedAccountId, getReviewByWeek, setSelectedWeeklyReview, setIsWeeklyReviewViewOpen, setWeeklyReviewWeek, setIsWeeklyReviewOpen]);

  const handleWeeklySummaryClick = (weekIndex: number, week: CalendarDay[]) => {
    if (!selectedAccountId) return;

    // Use the actual dates shown in this row to determine the week
    const weekStartDate = week[0]?.date || new Date();
    const mondayOfWeek = getMondayOfWeek(weekStartDate);
    const review = getReviewByWeek(mondayOfWeek, selectedAccountId);
    
    // Debug: Uncomment to verify week calculations
    // console.log('Week calculation debug:', {
    //   weekStartDate: weekStartDate.toDateString(),
    //   mondayOfWeek,
    //   weekDates: week.map(day => day.date.toDateString())
    // });
    
    if (review && review.isComplete) {
      // Show completed review
      setSelectedWeeklyReview(review);
      setIsWeeklyReviewViewOpen(true);
    } else if (review && !review.isComplete) {
      // Edit draft review
      setWeeklyReviewWeek(mondayOfWeek);
      setIsWeeklyReviewOpen(true);
    } else if (isWeekReviewAvailable(mondayOfWeek, selectedAccountId)) {
      // Create new review for available week
      setWeeklyReviewWeek(mondayOfWeek);
      setIsWeeklyReviewOpen(true);
    } else {
      // Check if it's a recent past week (up to 4 weeks back)
      const now = new Date();
      const weekStart = new Date(mondayOfWeek);
      const daysDiff = Math.floor((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 0 && daysDiff <= 28) { // 4 weeks = 28 days
        // Allow creating review for recent past weeks
        setWeeklyReviewWeek(mondayOfWeek);
        setIsWeeklyReviewOpen(true);
      }
      // For future weeks or very old weeks, do nothing
    }
  };

  // Helper function to get review status for a week
  const getWeekReviewStatus = (week: CalendarDay[]) => {
    if (!selectedAccountId) return null;
    
    const weekStartDate = week[0]?.date || new Date();
    const mondayOfWeek = getMondayOfWeek(weekStartDate);
    const review = getReviewByWeek(mondayOfWeek, selectedAccountId);
    
    if (review && review.isComplete) {
      return 'completed';
    } else if (review && !review.isComplete) {
      return 'available'; // Draft review exists
    } else if (isWeekReviewAvailable(mondayOfWeek, selectedAccountId)) {
      return 'available';
    } else {
      // Check if it's a recent past week that can be filled out
      const now = new Date();
      const weekStart = new Date(mondayOfWeek);
      const daysDiff = Math.floor((now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 0 && daysDiff <= 28) { // 4 weeks = 28 days
        return 'available';
      }
    }
    return null;
  };

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
      // Only include days visible in the current month to avoid leaking next/prev month totals
      const weekDays = week.filter(day => !day.isOtherMonth);
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
        activeDays: weekDays.filter(d => d.tradesCount > 0).length,
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
    const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6; // Sunday or Saturday
    
    // Space-aware responsive padding - ensures minimum padding to prevent cutoff
    const paddingClasses = (() => {
      switch (spaceLevel) {
        case 'ultra-compact':
          return 'p-1 sm:p-1.5 lg:p-2';
        case 'compact':
          return 'p-1.5 sm:p-2 lg:p-2.5';
        case 'normal':
          return 'p-2 sm:p-2.5 lg:p-3 2xl:p-3.5';
        case 'spacious':
        default:
          return 'p-2.5 sm:p-3 lg:p-4 2xl:p-5 3xl:p-6';
      }
    })();
    
    // Consistent aspect ratio that prevents text cutoff
    // Mobile: match weekly summary tile (square). Desktop: slightly taller for readability
    const heightClasses = 'aspect-square lg:aspect-[7/6] min-h-0';
    
    return cn(
      'relative overflow-hidden rounded-lg sm:rounded-xl transition-all duration-300 cursor-pointer flex flex-col',
      paddingClasses,
      heightClasses,
      
      // Weekend styling (subtle, muted appearance)
      isWeekend && !day.isOtherMonth 
        ? 'border border-dashed border-border/40 bg-muted/20 opacity-60 hover:opacity-75 hover:border-primary/30 hover:bg-muted/30'
        : 'border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10',
      
      // Mobile: Reduce opacity change for other month days
      day.isOtherMonth && 'opacity-30 sm:opacity-40',
      isToday && 'ring-1 sm:ring-2 ring-primary/50',
      isSelected && 'bg-primary/10 border-primary',
      isHovered && 'bg-accent/50',
      day.tradesCount > 0 && 'bg-muted/30',
      day.pnl > 0 && 'border-green-500/30 bg-green-50/10',
      day.pnl < 0 && 'border-red-500/30 bg-red-50/10',
    );
  };

  // Space-aware text sizing helper
  const getTextSizes = () => {
    switch (spaceLevel) {
      case 'ultra-compact':
        return {
          date: 'text-xs',
          pnl: 'text-[10px]',
          trades: 'text-[12px]',
          stats: 'text-[9px]',
          weekend: 'text-[10px]',
          weekTitle: 'text-xs',
          weekPnl: 'text-xs',
          weekDays: 'text-[10px]'
        };
      case 'compact':
        return {
          date: 'text-sm',
          pnl: 'text-[11px]',
          trades: 'text-[12px]',
          stats: 'text-[10px]',
          weekend: 'text-xs',
          weekTitle: 'text-sm',
          weekPnl: 'text-sm',
          weekDays: 'text-xs'
        };
      case 'normal':
        return {
          date: 'text-sm lg:text-base',
          pnl: 'text-[11px] lg:text-base',
          trades: 'text-sm',
          stats: 'text-xs',
          weekend: 'text-xs lg:text-sm',
          weekTitle: 'text-sm lg:text-base',
          weekPnl: 'text-base lg:text-lg',
          weekDays: 'text-xs lg:text-sm'
        };
      case 'spacious':
      default:
        return {
          date: 'text-base lg:text-lg xl:text-xl',
          pnl: 'text-xs lg:text-lg xl:text-xl',
          trades: 'text-base',
          stats: 'text-xs lg:text-sm',
          weekend: 'text-sm lg:text-base',
          weekTitle: 'text-base lg:text-lg xl:text-xl',
          weekPnl: 'text-lg lg:text-xl xl:text-2xl',
          weekDays: 'text-sm lg:text-base'
        };
    }
  };

  const textSizes = getTextSizes();

  // Dynamic font-size helpers using CSS clamp to prevent overflow on narrow tiles (e.g., Firefox)
  const pnlFontStyle: React.CSSProperties = useMemo(() => {
    // Make PNL visually prominent while still shrinking when narrow
    if (spaceLevel === 'ultra-compact') return { fontSize: 'clamp(12px, 1.4vw, 16px)', lineHeight: 1 };
    if (spaceLevel === 'compact') return { fontSize: 'clamp(13px, 1.6vw, 18px)', lineHeight: 1 };
    if (spaceLevel === 'normal') return { fontSize: 'clamp(14px, 1.8vw, 22px)', lineHeight: 1 };
    return { fontSize: 'clamp(16px, 2.0vw, 26px)', lineHeight: 1 };
  }, [spaceLevel]);

  const weeklyPnlFontStyle: React.CSSProperties = useMemo(() => {
    if (spaceLevel === 'ultra-compact') return { fontSize: 'clamp(14px, 1.6vw, 18px)', lineHeight: 1 };
    if (spaceLevel === 'compact') return { fontSize: 'clamp(15px, 1.8vw, 20px)', lineHeight: 1 };
    if (spaceLevel === 'normal') return { fontSize: 'clamp(16px, 2.0vw, 24px)', lineHeight: 1 };
    return { fontSize: 'clamp(18px, 2.2vw, 28px)', lineHeight: 1 };
  }, [spaceLevel]);

  // Container-size-informed font sizes
  const computedDailyPnlFont: React.CSSProperties = useMemo(() => {
    if (!tileSize) return pnlFontStyle;
    // Scale strictly by tile width; smaller factors and conservative caps to avoid oversizing
    const factor = spaceLevel === 'spacious' ? 0.20 : spaceLevel === 'normal' ? 0.19 : spaceLevel === 'compact' ? 0.18 : 0.17;
    const maxPx = spaceLevel === 'spacious' ? 30 : spaceLevel === 'normal' ? 28 : spaceLevel === 'compact' ? 26 : 24;
    const minPx = 12;
    const px = Math.max(minPx, Math.min(maxPx, tileSize * factor));
    return { ...pnlFontStyle, fontSize: `${px}px` };
  }, [tileSize, pnlFontStyle, spaceLevel]);

  const computedWeeklyPnlFont: React.CSSProperties = useMemo(() => {
    if (!tileSize) return weeklyPnlFontStyle;
    const factor = spaceLevel === 'spacious' ? 0.24 : spaceLevel === 'normal' ? 0.26 : spaceLevel === 'compact' ? 0.28 : 0.3;
    const maxPx = spaceLevel === 'spacious' ? 26 : spaceLevel === 'normal' ? 28 : 32;
    const px = Math.max(14, Math.min(maxPx, tileSize * factor));
    return { ...weeklyPnlFontStyle, fontSize: `${px}px` };
  }, [tileSize, weeklyPnlFontStyle]);

  // Additional size helpers for trades count and stats to better utilize tile space on desktop
  const computedTradesFont: React.CSSProperties = useMemo(() => {
    if (!tileSize) return {};
    const factor = spaceLevel === 'spacious' ? 0.14 : spaceLevel === 'normal' ? 0.145 : spaceLevel === 'compact' ? 0.155 : 0.16;
    const maxPx = spaceLevel === 'spacious' ? 18 : spaceLevel === 'normal' ? 17 : spaceLevel === 'compact' ? 16 : 16;
    const minPx = 11;
    const px = Math.max(minPx, Math.min(maxPx, tileSize * factor));
    return { fontSize: `${px}px`, lineHeight: 1.05 };
  }, [tileSize, spaceLevel]);

  const computedStatsFont: React.CSSProperties = useMemo(() => {
    if (!tileSize) return {};
    const factor = spaceLevel === 'spacious' ? 0.12 : spaceLevel === 'normal' ? 0.13 : spaceLevel === 'compact' ? 0.14 : 0.14;
    const maxPx = spaceLevel === 'spacious' ? 16 : spaceLevel === 'normal' ? 15 : 14;
    const minPx = 10;
    const px = Math.max(minPx, Math.min(maxPx, tileSize * factor));
    return { fontSize: `${px}px`, lineHeight: 1.05 };
  }, [tileSize, spaceLevel]);

  // Helper function to generate tooltip content for compact day tiles
  const getDayTooltipContent = (day: CalendarDay) => {
    const parts: string[] = [];
    
    // Date
    parts.push(`${day.date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    })}`);
    
    // P&L
    if (day.pnl !== 0) {
      parts.push(`P&L: ${formatCurrency(day.pnl)}`);
    }
    
    // Trades
    if (day.tradesCount > 0) {
      parts.push(`${day.tradesCount} trade${day.tradesCount > 1 ? 's' : ''}`);
      parts.push(`Win Rate: ${day.winRate.toFixed(1)}%`);
      parts.push(`Avg R:R: ${day.avgRR.toFixed(2)}:1`);
    }
    
    // Notes and reflections
    if (day.quickNotesCount > 0) {
      parts.push(`${day.quickNotesCount} note${day.quickNotesCount > 1 ? 's' : ''}`);
    }
    
    if (day.hasReflection) {
      parts.push('Has reflection');
    }
    
    // Mood
    if (day.tradesCount > 0) {
      parts.push(`Mood: ${day.mood}`);
    }
    
    return parts.join(' • ');
  };

  // Helper function to generate tooltip content for compact weekly tiles
  const getWeeklyTooltipContent = (weekSummary: WeeklySummary) => {
    const parts: string[] = [];
    
    parts.push(`Week ${weekSummary.weekNumber}`);
    parts.push(`P&L: ${formatCurrency(weekSummary.totalPnl)}`);
    parts.push(`${weekSummary.tradesCount} total trades`);
    parts.push(`${weekSummary.activeDays} active days`);
    
    if (weekSummary.tradesCount > 0) {
      parts.push(`Win Rate: ${weekSummary.winRate.toFixed(1)}%`);
      parts.push(`Avg R:R: ${weekSummary.avgRR.toFixed(2)}:1`);
    }
    
    return parts.join(' • ');
  };

  const formatPnL = (pnl: number, isCompact: boolean = false) => {
    if (pnl === 0) return null;
    
    if (isCompact) {
      // Ultra-compact mode: just show +/- and abbreviated amount
      const sign = pnl > 0 ? '+' : '';
      const abbreviated = Math.abs(pnl) >= 1000 
        ? `${sign}${(pnl / 1000).toFixed(1)}k`
        : `${sign}${pnl.toFixed(0)}`;
      
      return (
        <div className={cn(
          'text-xs font-bold truncate',
          pnl > 0 ? 'text-green-500' : 'text-red-500'
        )}>
          {abbreviated}
        </div>
      );
    }
    
    return (
      <div className={cn(
        compactMode 
          ? 'text-sm lg:text-base 2xl:text-lg 3xl:text-xl font-bold'
          : 'text-base 2xl:text-lg 3xl:text-xl 4xl:text-2xl font-bold',
        pnl > 0 ? 'text-green-500' : 'text-red-500'
      )}>
        {formatCurrency(pnl)}
      </div>
    );
  };

  const currentMonth = MONTHS[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // Dynamic container classes based on sidebar states and screen size
  const getContainerClasses = () => {
    const baseClasses = 'w-full mx-auto transition-all duration-300';
    
    // Mobile-first padding - reduced for larger tiles
    const paddingClasses = bothSidebarsExpanded 
      ? 'p-2 lg:p-3 2xl:p-4' 
      : 'p-3 lg:p-4 2xl:p-6 3xl:p-8';

    // Prevent overlap with collapsed todo drawer on desktop by reserving minimal right padding
    // When the todo drawer is expanded, layout already shifts; when collapsed, add minimal padding
    const rightPadClasses = todoExpanded ? '' : 'lg:pr-8 2xl:pr-10';
    
    let maxWidthClasses;
    if (allExpanded) {
      // All sidebars expanded - increased max widths for larger tiles
      maxWidthClasses = 'max-w-full lg:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl 4xl:max-w-[1800px]';
    } else if (bothSidebarsExpanded) {
      // Both main sidebars expanded - increased max widths
      maxWidthClasses = 'max-w-full lg:max-w-6xl 2xl:max-w-7xl 3xl:max-w-[1800px] 4xl:max-w-[2200px]';
    } else {
      // Normal or single sidebar - significantly increased for larger tiles
      maxWidthClasses = 'max-w-full lg:max-w-[1800px] 2xl:max-w-[2200px] 3xl:max-w-[2600px] 4xl:max-w-[3000px]';
    }
    
    return `${baseClasses} ${maxWidthClasses} ${paddingClasses} ${rightPadClasses}`;
  };

  return (
    <div className={cn(getContainerClasses(), className)}>
      {/* Header */}
      <div className={cn(
        "transition-all duration-300",
        bothSidebarsExpanded ? "mb-4 lg:mb-6" : "mb-6 lg:mb-8"
      )}>
        {/* Mobile Header - Stacked layout */}
        <div className="lg:hidden space-y-4">
          {/* Top row: Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.button
                onClick={() => navigateMonth('prev')}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
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
              className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              TODAY
            </motion.button>
          </div>
          
          {/* Bottom row: Stats and actions */}
          <div className="flex items-center justify-between">
            <div className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-semibold text-green-500">{formatCurrency(weeklyData.reduce((sum, week) => sum + week.totalPnl, 0))}</span>
            </div>
            <div className="flex items-center gap-1">
              {/* Removed global weekly review button - now handled per week tile */}
              
              <motion.button
                onClick={() => setIsShareModalOpen(true)}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Share2 className="w-4 h-4" />
              </motion.button>
              <motion.button
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Eye className="w-4 h-4" />
              </motion.button>
              <motion.button
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Desktop Header - Original layout */}
        <div className="hidden lg:flex items-center justify-between">
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
              {/* Removed global weekly review button - now handled per week tile */}
              
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
      </div>

      {/* Calendar Grid */}
      <div className={cn(
        "grid transition-all duration-300",
        // Mobile: Simple 7-column grid without weekly summary
        "grid-cols-7 gap-1 sm:gap-2",
        // Desktop: 8-column grid with weekly summary
        "lg:grid-cols-8",
        bothSidebarsExpanded ? "lg:gap-2 2xl:gap-2.5" : "lg:gap-2.5 2xl:gap-3 3xl:gap-3.5",
        // Ensure bottom breathing room when space is tight
        spaceLevel === 'ultra-compact' ? 'pb-2' : spaceLevel === 'compact' ? 'pb-3' : 'pb-4'
      )}>
        {/* Day Headers */}
        <div className={cn(
          "col-span-7 grid grid-cols-7 lg:col-span-8 lg:grid-cols-8 mb-4 transition-all duration-300",
          "gap-1 sm:gap-2",
          bothSidebarsExpanded ? "lg:gap-2 2xl:gap-2.5" : "lg:gap-2.5 2xl:gap-3 3xl:gap-3.5"
        )}>
          {DAYS_OF_WEEK.map((day, index) => {
            // On mobile, replace Saturday (index 6) with "Week"
            const isSaturday = index === 6;
            const displayText = isSaturday ? 'Week' : day;
            
            return (
            <div key={day} className="text-center font-semibold text-muted-foreground py-2">
                {/* Mobile: Show abbreviated day names, "Week" for Saturday */}
                <span className="text-xs sm:text-sm lg:hidden">
                  {isSaturday ? 'Week' : day.slice(0, 1)}
                </span>
                {/* Desktop: Show full day names */}
                <span className="hidden lg:block text-sm 2xl:text-base 3xl:text-lg">
              {day}
                </span>
            </div>
            );
          })}
        
          {/* Week Header - Desktop only (8th column) */}
          <div className="hidden lg:block text-center font-semibold text-muted-foreground py-2 text-sm 2xl:text-base 3xl:text-lg">
          Week
          </div>
        </div>

        {/* Calendar Weeks */}
        {calendarData.weeks.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {/* Week Days */}
            <div className={cn(
              "col-span-7 grid grid-cols-7 lg:col-span-8 lg:grid-cols-8 transition-all duration-300",
              "gap-1 sm:gap-2",
              bothSidebarsExpanded ? "lg:gap-2 2xl:gap-2.5" : "lg:gap-2.5 2xl:gap-3 3xl:gap-3.5"
            )}>
              {week.map((day, dayIndex) => {
                const isSaturday = dayIndex === 6;
                
                // On mobile, show weekly summary instead of Saturday
                if (isSaturday) {
                  const weekSummary = weeklyData[weekIndex];
                  const reviewStatus = getWeekReviewStatus(week);
                  
                  return (
                    <React.Fragment key={`${weekIndex}-${dayIndex}`}>
                      {/* Mobile: Weekly Summary */}
                      <div className="lg:hidden">
                        <Tooltip 
                          content={weekSummary ? getWeeklyTooltipContent(weekSummary) : `Week ${weekIndex + 1}`}
                          position="top"
                          fullWidth
                        >
                          <motion.div
                            className={cn(
                              'relative overflow-hidden rounded-lg border border-border/50 transition-all duration-300 cursor-pointer aspect-square',
                              'p-1.5 bg-muted/30 hover:bg-muted/50',
                              reviewStatus === 'completed' && 'ring-1 ring-green-500/30 bg-green-500/5',
                              reviewStatus === 'available' && 'ring-1 ring-blue-500/30 bg-blue-500/5'
                            )}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleWeeklySummaryClick(weekIndex, week)}
                          >
                            {/* Review Status Indicator */}
                            {reviewStatus && (
                              <div className="absolute top-1 right-1">
                                {reviewStatus === 'completed' ? (
                                  <CheckCircle2 className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Clock className="w-3 h-3 text-blue-600" />
                                )}
                              </div>
                            )}
                            
                            <div className="h-full flex flex-col justify-center items-center text-center space-y-0 pb-1">
                              <div className="text-xs font-medium text-muted-foreground truncate">
                                W{weekSummary?.weekNumber || weekIndex + 1}
                              </div>
                              {weekSummary && (
                                <>
                                  <div className={cn(
                                    'text-xs font-bold leading-none truncate whitespace-nowrap',
                                    weekSummary.totalPnl > 0 ? 'text-green-500' : 
                                    weekSummary.totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground'
                                  )}>
                                    {Math.abs(weekSummary.totalPnl) >= 1000 
                                      ? `${weekSummary.totalPnl > 0 ? '+' : ''}${(weekSummary.totalPnl/1000).toFixed(1)}k`
                                      : `${weekSummary.totalPnl > 0 ? '+' : ''}${Math.round(weekSummary.totalPnl)}`
                                    }
                                  </div>
                                  <div className="text-xs leading-none text-muted-foreground">
                                    {weekSummary.tradesCount}T
                                  </div>
                                </>
                              )}
                            </div>
                          </motion.div>
                        </Tooltip>
                      </div>
                      
                      {/* Desktop: Saturday Tile */}
                      <motion.div
                        className={cn(
                          getDayClassName(day),
                          'hidden lg:block' // Show only on desktop
                        )}
                        onClick={() => setSelectedDay(day)}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        layout
                      >
                        <div className="flex flex-col h-full space-y-1 pb-1">
                          {/* Date */}
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              textSizes.date,
                              'font-medium',
                              day.isOtherMonth ? 'text-muted-foreground' : 'text-foreground'
                            )}>
                              {day.date.getDate()}
                            </span>
                            <div className="flex items-center gap-0.5 sm:gap-1 2xl:gap-1.5">
                              {day.hasNews && (
                                <CalendarIcon className="w-2 h-2 sm:w-3 sm:h-3 lg:w-3 lg:h-3 2xl:w-4 2xl:h-4 3xl:w-5 3xl:h-5 text-primary" />
                              )}
                              {day.hasReflection && (
                                <BookOpen className="w-2 h-2 sm:w-3 sm:h-3 lg:w-3 lg:h-3 2xl:w-4 2xl:h-4 3xl:w-5 3xl:h-5 text-green-500" />
                              )}
                            </div>
                          </div>
                          
                          {/* Weekend Content */}
                          <div className="flex flex-col items-center justify-center flex-1 text-center">
                            <div className="flex flex-col items-center space-y-0.5">
                          <div className={cn(textSizes.weekend, 'text-muted-foreground/70')}>
                            Weekend
                          </div>
                          {day.quickNotesCount > 0 && (
                            <div className={cn(textSizes.stats, 'text-muted-foreground')}>
                              {day.quickNotesCount} note{day.quickNotesCount > 1 ? 's' : ''}
                            </div>
                          )}
                          {day.hasReflection && (
                            <div className={cn(textSizes.stats, 'text-green-600')}>
                              Reflection
                            </div>
                          )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </React.Fragment>
                  );
                }
                
                // Show all other days (Sunday through Friday)
                return (
                <motion.div
                  key={`${weekIndex}-${dayIndex}`}
                  className={getDayClassName(day)}
                  onClick={() => setSelectedDay(day)}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  layout
                  data-day-tile
                >
                  <div className="flex flex-col h-full space-y-0.5 md:space-y-1">
                    {/* Date */}
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        textSizes.date,
                        'font-medium',
                        day.isOtherMonth ? 'text-muted-foreground' : 'text-foreground'
                      )}>
                        {day.date.getDate()}
                      </span>
                      <div className="flex items-center gap-0.5 sm:gap-1 2xl:gap-1.5">
                        {day.hasNews && (
                          <CalendarIcon className="w-2 h-2 sm:w-3 sm:h-3 lg:w-3 lg:h-3 2xl:w-4 2xl:h-4 3xl:w-5 3xl:h-5 text-primary" />
                        )}
                        {day.hasReflection && (
                          <BookOpen className="w-2 h-2 sm:w-3 sm:h-3 lg:w-3 lg:h-3 2xl:w-4 2xl:h-4 3xl:w-5 3xl:h-5 text-green-500" />
                        )}
                      </div>
                    </div>
                    
                    {/* Weekend Content */}
                    {(isSaturday || day.date.getDay() === 0) ? (
                      <div className="flex flex-col items-center justify-center flex-1 text-center">
                        <div className="flex flex-col items-center space-y-0.5">
                          <div className={cn(textSizes.weekend, 'text-muted-foreground/70')}>
                            Weekend
                          </div>
                          {day.quickNotesCount > 0 && (
                            <div className={cn(textSizes.stats, 'text-muted-foreground')}>
                              {day.quickNotesCount} note{day.quickNotesCount > 1 ? 's' : ''}
                            </div>
                          )}
                          {day.hasReflection && (
                            <div className={cn(textSizes.stats, 'text-green-600')}>
                              Reflection
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        {compactMode ? (
                          // Ultra-compact mode for weekdays when both sidebars expanded - with tooltip
                          <Tooltip 
                            content={getDayTooltipContent(day)}
                            position="top"
                            fullWidth
                          >
                            <div className="flex flex-col items-center justify-center flex-1 space-y-0.5 pb-0.5">
                              {day.pnl !== 0 && (
                                <div className={cn(
                                  textSizes.pnl,
                                  'font-bold truncate',
                                  day.pnl > 0 ? 'text-green-500' : 'text-red-500'
                                )} style={computedDailyPnlFont}>
                                  {Math.abs(day.pnl) >= 1000 
                                    ? `${day.pnl > 0 ? '+' : ''}${(day.pnl / 1000).toFixed(1)}k`
                                    : formatCurrency(day.pnl)
                                  }
                                </div>
                              )}
                              {day.tradesCount > 0 && (
                                <div className={cn(textSizes.trades, 'text-muted-foreground')} style={computedTradesFont}>
                                  {day.tradesCount}T
                                </div>
                              )}
                            </div>
                          </Tooltip>
                        ) : (
                          <>
                            {/* P&L - Space-aware sizing */}
                            {day.pnl !== 0 && (
                              <div className={cn(
                                textSizes.pnl,
                                'font-bold truncate leading-tight',
                                'flex items-center justify-center',
                                day.pnl > 0 ? 'text-green-500' : 'text-red-500'
                              )} style={computedDailyPnlFont}>
                                {(['ultra-compact', 'compact'] as const).includes(spaceLevel as any)
                                  ? (Math.abs(day.pnl) >= 1000 
                                      ? `${day.pnl > 0 ? '+' : ''}${(day.pnl/1000).toFixed(1)}k`
                                      : `${day.pnl > 0 ? '+' : ''}${Math.round(day.pnl)}`)
                                  : formatCurrency(day.pnl)
                                }
                              </div>
                            )}
                            
                            {/* Trade Count - Space-aware display */}
                            {day.tradesCount > 0 && (
                              <div className={cn(
                                textSizes.trades,
                                'text-muted-foreground text-center leading-tight'
                              )} style={computedTradesFont}>
                                {`${day.tradesCount}T`}
                              </div>
                            )}
                            
                            {/* Metrics - Space-aware display */}
                            {day.tradesCount > 0 && (spaceLevel as any) !== 'ultra-compact' && (
                              <div className={cn(textSizes.stats, 'text-muted-foreground text-center leading-tight')} style={computedStatsFont}>
                                {day.avgRR.toFixed(1)}:1R, {day.winRate.toFixed(0)}%
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
                );
              })}
            
              {/* Weekly Summary - Desktop only (8th column) */}
            <motion.div
                className={cn(
                  "hidden lg:flex overflow-hidden bg-muted/30 border border-border/50 rounded-lg sm:rounded-xl hover:bg-muted/50 transition-all duration-300 aspect-[7/6] flex-col justify-between cursor-pointer relative",
                  (() => {
                    switch (spaceLevel) {
                      case 'ultra-compact':
                        return 'p-1.5 lg:p-2';
                      case 'compact':
                        return 'p-2 lg:p-2.5';
                      case 'normal':
                        return 'p-2.5 lg:p-3';
                      case 'spacious':
                      default:
                        return 'p-3 lg:p-4 xl:p-5';
                    }
                  })(),
                  getWeekReviewStatus(week) === 'completed' && 'ring-1 ring-green-500/30 bg-green-500/5',
                  getWeekReviewStatus(week) === 'available' && 'ring-1 ring-blue-500/30 bg-blue-500/5'
                )}
              whileHover={{ scale: 1.01 }}
                onClick={() => handleWeeklySummaryClick(weekIndex, week)}
              >
                {/* Review Status Indicator */}
                {getWeekReviewStatus(week) && (
                  <div className="absolute top-3 right-3">
                    {getWeekReviewStatus(week) === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                )}
                
              <div className="flex flex-col items-center justify-center text-center h-full min-h-0 pb-1">
                {compactMode ? (
                  // Ultra-compact weekly summary - with tooltip
                  <Tooltip 
                    content={weeklyData[weekIndex] ? getWeeklyTooltipContent(weeklyData[weekIndex]) : `Week ${weekIndex + 1}`}
                    position="top"
                    fullWidth
                  >
                    <div className="flex flex-col items-center justify-center space-y-0.5">
                      <div className={cn(textSizes.weekTitle, 'font-medium text-muted-foreground leading-tight')}>
                        W{weeklyData[weekIndex]?.weekNumber}
                      </div>
                      <div className={cn(
                        textSizes.weekPnl,
                        'font-bold leading-tight',
                        weeklyData[weekIndex]?.totalPnl > 0 ? 'text-green-500' : 
                        weeklyData[weekIndex]?.totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground'
                      )}>
                        {weeklyData[weekIndex]?.totalPnl && Math.abs(weeklyData[weekIndex].totalPnl) >= 1000 
                          ? `${weeklyData[weekIndex].totalPnl > 0 ? '+' : ''}${(weeklyData[weekIndex].totalPnl / 1000).toFixed(1)}k`
                          : formatCurrency(weeklyData[weekIndex]?.totalPnl || 0)
                        }
                      </div>
                      <div className={cn(textSizes.weekDays, 'text-muted-foreground leading-tight')}>
                        {weeklyData[weekIndex]?.activeDays || 0}d
                      </div>
                    </div>
                  </Tooltip>
                ) : (
                  // Normal weekly summary
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <div className={cn(textSizes.weekTitle, 'font-medium text-muted-foreground leading-tight')}>
                      Week {weeklyData[weekIndex]?.weekNumber}
                    </div>
                    <div className={cn(
                      textSizes.weekPnl,
                      'font-bold leading-tight',
                      weeklyData[weekIndex]?.totalPnl > 0 ? 'text-green-500' : 
                      weeklyData[weekIndex]?.totalPnl < 0 ? 'text-red-500' : 'text-muted-foreground'
                    )} style={computedWeeklyPnlFont}>
                      {formatCurrency(weeklyData[weekIndex]?.totalPnl || 0)}
                    </div>
                    <div className={cn(textSizes.weekDays, 'text-muted-foreground leading-tight')}>
                      {weeklyData[weekIndex]?.activeDays || 0} days
                    </div>
  </div>
                )}
              </div>
              {/* Removed inline review chip; the entire tile is clickable to open the review */}
            </motion.div>
            </div>
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

      {/* Weekly Review Modal */}
      <WeeklyReviewModal
        isOpen={isWeeklyReviewOpen}
        onClose={() => {
          setIsWeeklyReviewOpen(false);
          setWeeklyReviewWeek(undefined);
        }}
        weekOf={weeklyReviewWeek}
      />

      {/* Weekly Review View Modal */}
      <WeeklyReviewViewModal
        isOpen={isWeeklyReviewViewOpen}
        onClose={() => {
          setIsWeeklyReviewViewOpen(false);
          setSelectedWeeklyReview(null);
        }}
        review={selectedWeeklyReview}
      />
    </div>
  );
}; 