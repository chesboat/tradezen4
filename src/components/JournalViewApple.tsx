import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight,
  CheckCircle,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useAccountFilterStore, getAccountIdsForSelection } from '@/store/useAccountFilterStore';
import { summarizeWinLossScratch } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { DayDetailModalApple } from './DayDetailModalApple';

interface DayEntry {
  date: string;
  dateObj: Date;
  pnl: number;
  trades: number;
  hasReflection: boolean;
  winRate: number;
}

export const JournalViewApple: React.FC = () => {
  const { selectedAccountId } = useAccountFilterStore();
  const { trades } = useTradeStore();
  const { notes } = useQuickNoteStore();
  const { reflections } = useDailyReflectionStore();
  
  const [selectedDay, setSelectedDay] = useState<DayEntry | null>(null);
  const [daysToShow] = useState(60); // Show 2 months by default

  // Generate day entries
  const dayEntries = useMemo(() => {
    const entries: DayEntry[] = [];
    const today = new Date();
    
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Get day's trades
      const dayTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.entryTime);
        const dayStart = new Date(dateStr + 'T00:00:00');
        const dayEnd = new Date(dateStr + 'T23:59:59.999');
        const ids = getAccountIdsForSelection(selectedAccountId || null);
        return tradeDate >= dayStart && tradeDate <= dayEnd && ids.includes(trade.accountId);
      });
      
      // Calculate stats
      const totalPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const { winRateExclScratches } = summarizeWinLossScratch(dayTrades);
      
      // Check if reflection exists
      const ids = getAccountIdsForSelection(selectedAccountId || null);
      const hasReflection = reflections.find(r => r.date === dateStr && ids.includes(r.accountId)) !== undefined;
      
      entries.push({
        date: dateStr,
        dateObj: d,
        pnl: totalPnL,
        trades: dayTrades.length,
        hasReflection,
        winRate: winRateExclScratches,
      });
    }
    
    return entries;
  }, [trades, notes, selectedAccountId, daysToShow, reflections]);

  // Group entries by month
  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: DayEntry[] } = {};
    
    dayEntries.forEach(entry => {
      const monthKey = entry.dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(entry);
    });
    
    return groups;
  }, [dayEntries]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format date for row display
  const formatRowDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    
    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Simple Header - iOS Style */}
      <div className="px-4 py-3 border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="text-2xl font-semibold text-foreground">Journal</h1>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedEntries).map(([monthKey, entries]) => (
          <div key={monthKey}>
            {/* Month Header */}
            <div className="sticky top-0 z-[5] px-4 py-2 bg-muted/80 backdrop-blur-sm">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {monthKey}
              </h2>
            </div>

            {/* Day Rows */}
            <div className="divide-y divide-border/50">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.date}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "px-4 py-3 hover:bg-muted/30 active:bg-muted/50 transition-colors cursor-pointer",
                    "flex items-center justify-between gap-3"
                  )}
                  onClick={() => setSelectedDay(entry)}
                >
                  {/* Left: Date + Reflection Status */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Reflection Indicator */}
                    <div className="shrink-0">
                      {entry.hasReflection ? (
                        <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-muted" />
                      )}
                    </div>
                    
                    {/* Date */}
                    <div className="min-w-0">
                      <div className="text-base font-medium text-foreground">
                        {formatRowDate(entry.dateObj)}
                      </div>
                      {entry.trades > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {entry.trades} {entry.trades === 1 ? 'trade' : 'trades'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: P&L + Arrow */}
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.trades > 0 && (
                      <div className={cn(
                        "text-base font-semibold tabular-nums",
                        entry.pnl >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {entry.pnl >= 0 ? "+" : ""}{formatCurrency(entry.pnl)}
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {dayEntries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No Journal Entries
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Start trading and adding reflections to build your journal timeline.
            </p>
          </div>
        )}
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <DayDetailModalApple
          day={selectedDay}
          dateString={selectedDay.date}
          isOpen={!!selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
};

