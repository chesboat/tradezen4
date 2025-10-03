import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame,
  ChevronLeft,
  ChevronRight,
  Filter,
  Target,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useReflectionTemplateStore } from '@/store/useReflectionTemplateStore';
import { summarizeWinLossScratch } from '@/lib/utils';
import { useAccountFilterStore, getAccountIdsForSelection } from '@/store/useAccountFilterStore';

import { formatDate } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';
import { JournalDayCard } from './JournalDayCard';

interface JournalTimelineProps {
  className?: string;
}

export const JournalTimeline: React.FC<JournalTimelineProps> = ({ className }) => {
  const { selectedAccountId } = useAccountFilterStore();
  const { trades } = useTradeStore();
  const { notes } = useQuickNoteStore();
  const { getReflectionByDate: getInsightReflection } = useReflectionTemplateStore();
  const { 
    reflections,
    getReflectionStreak,
    getReflectionStats,
    getReflectionTags,
    selectedTagFilter
  } = useDailyReflectionStore();

  // Component state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [daysToShow, setDaysToShow] = useState(30);
  const [showOnlyReflected, setShowOnlyReflected] = useState(false);


  // Get reflection statistics
  const reflectionStats = getReflectionStats();
  const currentStreak = getReflectionStreak(selectedAccountId || 'all');

  // Generate timeline entries  
  const timelineEntries = useMemo(() => {
    const entries: any[] = [];
    const today = new Date();
    
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Get day's trades
      const dayTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.entryTime);
        
        // Fix timezone issue: create date from YYYY-MM-DD string in local timezone  
        const dayStart = new Date(dateStr + 'T00:00:00');
        const dayEnd = new Date(dateStr + 'T23:59:59.999');
        
        const ids = getAccountIdsForSelection(selectedAccountId || null);
        return tradeDate >= dayStart && tradeDate <= dayEnd && ids.includes(trade.accountId);
      });
      
      // Get day's notes
      const dayNotes = notes.filter(note => {
        const noteDate = new Date(note.createdAt);
        const dayStart = new Date(d);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(23, 59, 59, 999);
        const ids = getAccountIdsForSelection(selectedAccountId || null);
        return noteDate >= dayStart && noteDate <= dayEnd && ids.includes(note.accountId);
      });
      
      // Calculate stats (exclude scratches and tiny fee negatives)
      const totalPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const { wins, losses, winRateExclScratches } = summarizeWinLossScratch(dayTrades);
      const winningTrades = wins;
      const winRate = winRateExclScratches;
      const avgRR = dayTrades.length > 0 
        ? dayTrades.reduce((sum, trade) => sum + trade.riskRewardRatio, 0) / dayTrades.length 
        : 0;
      
      // Check if reflection exists (check both old fields and new Insight Blocks)
      const ids = getAccountIdsForSelection(selectedAccountId || null);
      const reflection = reflections.find(r => r.date === dateStr && ids.includes(r.accountId));
      
      // Check for old-style reflection fields with actual content
      const hasOldReflection = Boolean(reflection && (
        (reflection.reflection && reflection.reflection.trim().length > 0) ||
        (reflection.keyFocus && reflection.keyFocus.trim().length > 0) ||
        (reflection.goals && reflection.goals.trim().length > 0) ||
        (reflection.lessons && reflection.lessons.trim().length > 0)
      ));
      
      // Also check for new Insight Blocks (Insight Blocks 2.0)
      const insightReflection = selectedAccountId ? getInsightReflection(dateStr, selectedAccountId) : null;
      const hasInsightBlocks = Boolean(insightReflection && insightReflection.insightBlocks && insightReflection.insightBlocks.length > 0);
      
      // Show checkmark if either old reflection OR new insight blocks exist
      const hasReflection = hasOldReflection || hasInsightBlocks;
      
      entries.push({
        date: dateStr,
        dateObj: new Date(d),
        stats: {
          pnl: totalPnL,
          trades: dayTrades.length,
          winRate,
          avgRR,
        },
        hasReflection,
        quickNotesCount: dayNotes.length,
      });
    }
    
    // Filter entries based on options
    let filteredEntries = entries;
    
    if (showOnlyReflected) {
      filteredEntries = filteredEntries.filter(entry => entry.hasReflection);
    }
    
    if (selectedTagFilter) {
      filteredEntries = filteredEntries.filter(entry => {
        // Check reflection tags
        const reflectionTags = getReflectionTags(entry.date, selectedAccountId || undefined);
        if (reflectionTags.includes(selectedTagFilter)) return true;
        
        // Check quick note tags
        const dayNotes = notes.filter(note => {
          const noteDate = new Date(note.createdAt);
          const entryDate = new Date(entry.date);
          return noteDate.toDateString() === entryDate.toDateString() &&
                 (!selectedAccountId || note.accountId === selectedAccountId);
        });
        
        return dayNotes.some(note => note.tags?.includes(selectedTagFilter));
      });
    }
    
    return filteredEntries; // Most recent first (entries are already generated in newest-to-oldest order)
  }, [trades, notes, selectedAccountId, daysToShow, showOnlyReflected, selectedTagFilter, reflections, getReflectionTags, getInsightReflection]);



  const navigateDate = (direction: 'prev' | 'next') => {
    // Fix timezone parsing issue by using local date components
    const [year, month, day] = selectedDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (direction === 'prev') {
      date.setDate(date.getDate() - 1);
    } else {
      date.setDate(date.getDate() + 1);
    }
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const jumpToToday = () => {
    const today = new Date();
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  return (
    <div className={cn("p-4 sm:p-6 min-h-screen bg-gradient-to-br from-background to-muted/30 overflow-x-hidden max-w-full w-full", className)}>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-2 sm:gap-3">
                <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
                <span className="truncate">Journal Timeline</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Your trading journey, day by day
              </p>
            </div>
            
            {/* Streak Counter */}
            <motion.div
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-2xl shadow-lg shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold">{currentStreak}</div>
                  <div className="text-xs opacity-90">Day Streak</div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Target className="w-4 h-4" />
              <span>{reflectionStats.totalReflections} reflections</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Sparkles className="w-4 h-4" />
              <span>{reflectionStats.totalXPEarned} XP earned</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <BookOpen className="w-4 h-4" />
              <span>{Math.round(reflectionStats.averageReflectionLength)} avg words</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 overflow-x-hidden">
        {/* Date Navigation */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="px-3 py-2 bg-card border rounded-lg min-w-0 flex-1 sm:flex-none">
            <span className="text-sm font-medium truncate block">
              {(() => {
                // Fix timezone parsing for display
                const [year, month, day] = selectedDate.split('-').map(Number);
                const localDate = new Date(year, month - 1, day);
                return formatDate(localDate);
              })()}
            </span>
          </div>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={jumpToToday}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm shrink-0"
          >
            Today
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <select
            value={daysToShow}
            onChange={(e) => setDaysToShow(Number(e.target.value))}
            className="px-2 py-2 bg-card border rounded-lg text-xs sm:text-sm min-w-0 flex-1 sm:flex-none"
          >
            <option value={7}>7 days</option>
            <option value={14}>2 weeks</option>
            <option value={30}>1 month</option>
            <option value={90}>3 months</option>
          </select>
          
          <button
            onClick={() => setShowOnlyReflected(!showOnlyReflected)}
            className={cn(
              "px-2 py-2 rounded-lg text-xs sm:text-sm transition-colors shrink-0 flex items-center gap-1",
              showOnlyReflected 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted hover:bg-muted/80"
            )}
          >
            <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Reflected</span>
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4 overflow-x-hidden max-w-full">
        <AnimatePresence mode="popLayout">
          {timelineEntries.map((entry, index) => (
            <motion.div
              key={entry.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <JournalDayCard
                date={entry.date}
                dateObj={entry.dateObj}
                stats={entry.stats}
                hasReflection={entry.hasReflection}
                quickNotesCount={entry.quickNotesCount}
                isToday={entry.date === new Date().toISOString().split('T')[0]}
                isExpanded={entry.date === selectedDate}
                onToggleExpanded={() => setSelectedDate(entry.date)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {timelineEntries.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No entries found
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedTagFilter
              ? `No entries found with tag "${selectedTagFilter}". Try clearing the tag filter or selecting a different tag.`
              : showOnlyReflected 
                ? "No reflected days in this period. Try expanding the date range or turning off the filter."
                : "Start trading and adding notes to see your journal timeline!"
            }
          </p>
        </div>
      )}

      {/* Tips */}
      <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">
            Timeline Tips
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700 dark:text-blue-300">
          <div>
            <p className="font-medium mb-1">• Daily Consistency</p>
            <p>Build your streak by reflecting daily. Even small insights count!</p>
          </div>
          <div>
            <p className="font-medium mb-1">• Pin Key Focus</p>
            <p>Turn your daily focus into actionable quests for tomorrow.</p>
          </div>
          <div>
            <p className="font-medium mb-1">• Use GPT-5</p>
            <p>Generate insights from your trades and notes with AI assistance.</p>
          </div>
          <div>
            <p className="font-medium mb-1">• Complete Days</p>
            <p>Mark days complete to earn XP and celebrate your progress.</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 