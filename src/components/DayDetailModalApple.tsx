import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft,
  Share2,
  TrendingUp,
  TrendingDown,
  Target,
  Trophy,
  Flame,
  Clock,
  DollarSign
} from 'lucide-react';
import { PublicShareDialog } from './PublicShareDialog';
import { ReflectionHub } from './ReflectionHub';
import { useTradeStore } from '@/store/useTradeStore';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { cn } from '@/lib/utils';

interface DayDetailModalAppleProps {
  day: any;
  dateString: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DayDetailModalApple: React.FC<DayDetailModalAppleProps> = ({
  day,
  dateString,
  isOpen,
  onClose
}) => {
  const [shareOpen, setShareOpen] = useState(false);
  const { trades } = useTradeStore();
  const { notes } = useQuickNoteStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { reflections } = useDailyReflectionStore();

  // Filter trades and notes for this day
  const dayTrades = useMemo(() => {
    if (!dateString) return [];
    return trades.filter(t => {
      const tradeDate = new Date(t.entryTime).toISOString().split('T')[0];
      const matchesDate = tradeDate === dateString;
      const matchesAccount = !selectedAccountId || selectedAccountId === 'all' || t.accountId === selectedAccountId;
      return matchesDate && matchesAccount;
    });
  }, [trades, dateString, selectedAccountId]);

  const dayNotes = useMemo(() => {
    if (!dateString) return [];
    return notes.filter(n => {
      const noteDate = new Date(n.createdAt).toISOString().split('T')[0];
      return noteDate === dateString;
    });
  }, [notes, dateString]);

  // Calculate metrics
  const dayPnL = useMemo(() => {
    return dayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  }, [dayTrades]);

  const winRate = useMemo(() => {
    if (dayTrades.length === 0) return 0;
    const winners = dayTrades.filter(t => (t.pnl || 0) > 0).length;
    return Math.round((winners / dayTrades.length) * 100);
  }, [dayTrades]);

  const avgRR = useMemo(() => {
    if (dayTrades.length === 0) return 0;
    const totalRR = dayTrades.reduce((sum, t) => sum + (t.riskRewardRatio || 0), 0);
    return (totalRR / dayTrades.length).toFixed(1);
  }, [dayTrades]);

  const dailyReflection = useMemo(() => {
    return reflections.find(r => r.date === dateString);
  }, [reflections, dateString]);

  const currentStreak = dailyReflection?.streakCount || 0;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Format date display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!day) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal Content - Full screen on desktop, sheet on mobile */}
          <motion.div
            className={cn(
              "fixed z-50 bg-background flex flex-col overflow-hidden",
              // Desktop: Full screen with subtle border
              "md:inset-4 md:rounded-2xl md:border md:border-border/50 md:shadow-2xl",
              // Mobile: Bottom sheet
              "inset-x-0 bottom-0 top-16 rounded-t-3xl"
            )}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(e, { offset, velocity }) => {
              // Only on mobile - swipe down to dismiss
              if (window.innerWidth < 768) {
                if (offset.y > 150 || velocity.y > 500) {
                  onClose();
                }
              }
            }}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Apple-style Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
              {/* Mobile: Drag Handle */}
              <div className="md:hidden absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-border/50 rounded-full" />
              
              <div className="flex items-center gap-3 flex-1">
                {/* Back Button */}
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {/* Date - Hero Title */}
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-foreground">
                    {formatDate(dateString)}
                  </h2>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShareOpen(true)}
                  className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Single Scroll Content - Apple Style */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-8">
                
                {/* Hero Metrics - Large P&L with inline stats */}
                <div className="space-y-4">
                  <div className="text-center space-y-3">
                    {/* Large P&L */}
                    <div className={cn(
                      "text-5xl md:text-7xl font-semibold tabular-nums tracking-tight",
                      dayPnL >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {dayPnL >= 0 ? "+" : ""}{formatCurrency(dayPnL)}
                    </div>
                    
                    {/* Inline stats */}
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                      <span className="font-medium">{dayTrades.length} {dayTrades.length === 1 ? 'trade' : 'trades'}</span>
                      <span>•</span>
                      <span>{winRate}% win rate</span>
                      {currentStreak > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-4 h-4 text-orange-500" />
                            {currentStreak} day streak
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quick Stats Cards */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="bg-muted/30 rounded-xl p-4 text-center">
                      <div className="text-2xl font-semibold text-foreground tabular-nums">
                        {winRate}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Win Rate</div>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-4 text-center">
                      <div className="text-2xl font-semibold text-foreground tabular-nums">
                        {avgRR}:1
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Avg R:R</div>
                    </div>
                    <div className="bg-muted/30 rounded-xl p-4 text-center">
                      <div className="text-2xl font-semibold text-foreground tabular-nums">
                        {dayTrades.length}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Trades</div>
                    </div>
                  </div>
                </div>

                {/* Daily Reflection */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                    Daily Reflection
                  </h3>
                  <div className="bg-muted/20 rounded-xl p-1">
                    <ReflectionHub 
                      date={dateString}
                      className=""
                    />
                  </div>
                </div>

                {/* Trades Section */}
                {dayTrades.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Trades ({dayTrades.length})
                    </h3>
                    <div className="space-y-2">
                      {dayTrades.map((trade, idx) => (
                        <motion.div
                          key={trade.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-muted/20 rounded-xl p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {trade.symbol}
                              </span>
                              <span className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                trade.direction === 'long' 
                                  ? "bg-green-500/10 text-green-500" 
                                  : "bg-red-500/10 text-red-500"
                              )}>
                                {trade.direction?.toUpperCase()}
                              </span>
                            </div>
                            <div className={cn(
                              "text-lg font-semibold tabular-nums",
                              (trade.pnl || 0) >= 0 ? "text-green-500" : "text-red-500"
                            )}>
                              {(trade.pnl || 0) >= 0 ? "+" : ""}{formatCurrency(trade.pnl || 0)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Entry: {formatCurrency(trade.entryPrice || 0)}</span>
                            <span>→</span>
                            <span>Exit: {formatCurrency(trade.exitPrice || 0)}</span>
                            {trade.riskRewardRatio && (
                              <>
                                <span>•</span>
                                <span>R:R {trade.riskRewardRatio.toFixed(1)}:1</span>
                              </>
                            )}
                          </div>
                          
                          {trade.notes && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              {trade.notes}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                {dayNotes.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Notes ({dayNotes.length})
                    </h3>
                    <div className="space-y-2">
                      {dayNotes.map((note, idx) => (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-muted/20 rounded-xl p-4"
                        >
                          <div className="text-sm text-foreground whitespace-pre-wrap">
                            {note.content}
                          </div>
                          {note.tags && note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {note.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {dayTrades.length === 0 && dayNotes.length === 0 && (
                  <div className="text-center py-12 space-y-3">
                    <div className="text-4xl opacity-20">📝</div>
                    <div className="text-sm text-muted-foreground">
                      No trades or notes for this day
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          
          <PublicShareDialog 
            date={dateString} 
            accountId={selectedAccountId || 'all'} 
            isOpen={shareOpen} 
            onClose={() => setShareOpen(false)} 
          />
        </>
      )}
    </AnimatePresence>
  );
};

