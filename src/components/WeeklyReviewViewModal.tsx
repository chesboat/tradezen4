import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, TrendingUp, Target, Award, FileText } from 'lucide-react';
import { WeeklyReview } from '@/types';
import { formatCurrency } from '@/lib/localStorageUtils';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { summarizeWinLossScratch } from '@/lib/utils';

interface WeeklyReviewViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: WeeklyReview | null;
}

export const WeeklyReviewViewModal: React.FC<WeeklyReviewViewModalProps> = ({
  isOpen,
  onClose,
  review
}) => {
  if (!review) return null;

  const { selectedAccountId } = useAccountFilterStore();
  const { trades } = useTradeStore();

  const weekStartDate = new Date(review.weekOf);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);

  // Safeguards for possibly missing/NaN stats stored in older reviews
  const storedTotalPnL = Number.isFinite(review.weeklyStats?.totalPnL as any)
    ? (review.weeklyStats!.totalPnL as number)
    : NaN;
  const storedWinRate = Number.isFinite(review.weeklyStats?.winRate as any)
    ? (review.weeklyStats!.winRate as number)
    : NaN;
  const storedTotalTrades = Number.isFinite(review.weeklyStats?.totalTrades as any)
    ? (review.weeklyStats!.totalTrades as number)
    : NaN;

  // Fallback: compute fresh stats from the week's trades when stored values are missing/stale
  const weekTrades = trades.filter((t) => {
    const d = new Date(t.entryTime);
    return (
      d >= weekStartDate &&
      d <= weekEndDate &&
      (!selectedAccountId || t.accountId === selectedAccountId)
    );
  });
  const dynamicTotalPnL = weekTrades.reduce((s, t: any) => s + (typeof t.pnl === 'number' ? t.pnl : 0), 0);
  const { winRateExclScratches } = summarizeWinLossScratch(weekTrades);
  const dynamicWinRate = winRateExclScratches;
  const dynamicTotalTrades = weekTrades.length;

  const totalPnL = Number.isFinite(storedTotalPnL) && storedTotalPnL !== 0 ? storedTotalPnL : dynamicTotalPnL;
  const winRate = Number.isFinite(storedWinRate) && storedWinRate !== 0 ? storedWinRate : dynamicWinRate;
  const totalTrades = Number.isFinite(storedTotalTrades) && storedTotalTrades !== 0 ? storedTotalTrades : dynamicTotalTrades;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Weekly Review</h2>
                  <p className="text-sm text-muted-foreground">
                    {weekStartDate.toLocaleDateString()} - {weekEndDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Stats Overview */}
              {review.weeklyStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">P&L</span>
                    </div>
                    <p className={`text-lg font-semibold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(totalPnL)}
                    </p>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium">Win Rate</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {winRate.toFixed(1)}%
                    </p>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Trades</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {totalTrades}
                    </p>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium">XP Earned</span>
                    </div>
                    <p className="text-lg font-semibold text-yellow-600">
                      {review.xpEarned || 150}
                    </p>
                  </div>
                </div>
              )}

              {/* Review Sections (from stored fields) */}
              <div className="space-y-4">
                {review.tradingPerformance && (
                  <div className="border border-border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Trading Performance</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.tradingPerformance}</p>
                  </div>
                )}
                {review.keyWins && (
                  <div className="border border-border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Key Wins & Achievements</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.keyWins}</p>
                  </div>
                )}
                {review.areasToImprove && (
                  <div className="border border-border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Areas to Improve</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.areasToImprove}</p>
                  </div>
                )}
                {review.habitsReflection && (
                  <div className="border border-border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Habits & Consistency</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.habitsReflection}</p>
                  </div>
                )}
                {review.lessonsLearned && (
                  <div className="border border-border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Lessons Learned</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.lessonsLearned}</p>
                  </div>
                )}
                {review.nextWeekFocus && (
                  <div className="border border-border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Next Week Focus</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.nextWeekFocus}</p>
                  </div>
                )}
              </div>

              {/* Completion Info */}
              {review.isComplete && review.completedAt && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Award className="w-4 h-4" />
                    <span className="font-medium">Review Completed</span>
                  </div>
                  <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                    Completed on {new Date(review.completedAt).toLocaleDateString()} at{' '}
                    {new Date(review.completedAt).toLocaleTimeString()}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-border">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
