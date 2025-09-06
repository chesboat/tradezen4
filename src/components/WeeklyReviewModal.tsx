import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, TrendingUp, Target, Lightbulb, Award, CheckCircle2 } from 'lucide-react';
import { useWeeklyReviewStore } from '@/store/useWeeklyReviewStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useRuleTallyStore } from '@/store/useRuleTallyStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { summarizeWinLossScratch } from '@/lib/utils';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';

interface WeeklyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekOf?: string; // Optional: specify which week to review
}

export const WeeklyReviewModal: React.FC<WeeklyReviewModalProps> = ({
  isOpen,
  onClose,
  weekOf
}) => {
  const { selectedAccountId } = useAccountFilterStore();
  const { trades } = useTradeStore();
  const { rules, logs } = useRuleTallyStore();
  const { reflections } = useDailyReflectionStore();
  
  const {
    addReview,
    updateReview,
    getReviewByWeek,
    markReviewComplete,
    getMondayOfWeek
  } = useWeeklyReviewStore();

  // Determine which week we're reviewing
  const reviewWeek = weekOf || getMondayOfWeek(new Date());
  const existingReview = getReviewByWeek(reviewWeek, selectedAccountId || 'default');

  // Form state
  const [formData, setFormData] = useState({
    tradingPerformance: '',
    habitsReflection: '',
    lessonsLearned: '',
    nextWeekFocus: '',
    keyWins: '',
    areasToImprove: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load existing review data
  useEffect(() => {
    if (existingReview) {
      setFormData({
        tradingPerformance: existingReview.tradingPerformance || '',
        habitsReflection: existingReview.habitsReflection || '',
        lessonsLearned: existingReview.lessonsLearned || '',
        nextWeekFocus: existingReview.nextWeekFocus || '',
        keyWins: existingReview.keyWins || '',
        areasToImprove: existingReview.areasToImprove || ''
      });
    } else {
      // Clear form when no existing review
      setFormData({
        tradingPerformance: '',
        habitsReflection: '',
        lessonsLearned: '',
        nextWeekFocus: '',
        keyWins: '',
        areasToImprove: ''
      });
    }
  }, [existingReview, reviewWeek]);

  // Calculate week stats
  const getWeekStats = () => {
    if (!selectedAccountId) return null;

    const weekStart = new Date(reviewWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Filter trades for this week
    const weekTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.entryTime);
      return tradeDate >= weekStart && tradeDate <= weekEnd && trade.accountId === selectedAccountId;
    });

    // Calculate trading stats
    const { wins, losses, scratches, winRateExclScratches } = summarizeWinLossScratch(weekTrades);
    // Compute total P&L explicitly to avoid NaN when summarizeWinLossScratch doesn't provide it
    const totalPnL = weekTrades.reduce((sum, t: any) => {
      const explicit = typeof t.pnl === 'number' ? t.pnl : 0;
      return sum + (Number.isFinite(explicit) ? explicit : 0);
    }, 0);

    // Calculate habits completed
    const weekLogs = logs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= weekStart && logDate <= weekEnd && log.accountId === selectedAccountId;
    });
    const habitsCompleted = weekLogs.reduce((sum, log) => sum + log.tallyCount, 0);

    // Calculate reflection days
    const weekReflections = reflections.filter(reflection => {
      const reflectionDate = new Date(reflection.date);
      return reflectionDate >= weekStart && reflectionDate <= weekEnd && 
             reflection.accountId === selectedAccountId && reflection.isComplete;
    });

    return {
      totalTrades: weekTrades.length,
      winRate: Number.isFinite(winRateExclScratches) ? winRateExclScratches : 0,
      totalPnL: Number.isFinite(totalPnL) ? totalPnL : 0,
      habitsCompleted,
      reflectionDays: weekReflections.length,
      wins,
      losses,
      scratches
    };
  };

  const weekStats = getWeekStats();

  const handleSubmit = async () => {
    if (!selectedAccountId) return;

    setIsSubmitting(true);
    try {
      if (existingReview) {
        // Update existing review
        await updateReview(existingReview.id, {
          ...formData,
          weeklyStats: weekStats || undefined
        });
      } else {
        // Create new review
        await addReview({
          weekOf: reviewWeek,
          ...formData,
          isComplete: false,
          xpEarned: 0,
          weeklyStats: weekStats || undefined,
          accountId: selectedAccountId
        });
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to save weekly review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!existingReview) {
      // Save first, then complete
      await handleSubmit();
      const newReview = getReviewByWeek(reviewWeek, selectedAccountId || 'default');
      if (newReview) {
        await markReviewComplete(newReview.id);
      }
    } else {
      // Ensure latest form data and computed stats are saved before completing
      await updateReview(existingReview.id, {
        ...formData,
        weeklyStats: weekStats || undefined,
      });
      await markReviewComplete(existingReview.id);
    }
    
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

  const formatWeekRange = (weekOf: string) => {
    const monday = new Date(weekOf);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const isFormValid = () => {
    return formData.tradingPerformance.trim().length > 0 &&
           formData.lessonsLearned.trim().length > 0 &&
           formData.nextWeekFocus.trim().length > 0;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Animation */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  className="absolute inset-0 bg-green-500/10 backdrop-blur-sm flex items-center justify-center z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="bg-green-500 text-white p-6 rounded-2xl flex items-center gap-3"
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.8, y: 20 }}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <span className="font-semibold">Weekly Review Complete! +150 XP</span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Weekly Review</h2>
                  <p className="text-sm text-muted-foreground">
                    Week of {formatWeekRange(reviewWeek)}
                  </p>
                </div>
              </div>
              <motion.button
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                onClick={onClose}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Week Stats */}
              {weekStats && (
                <div className="mb-6 p-4 bg-muted/30 rounded-xl">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Week Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-foreground">{weekStats.totalTrades}</div>
                      <div className="text-muted-foreground">Trades</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-foreground">{weekStats.winRate.toFixed(1)}%</div>
                      <div className="text-muted-foreground">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className={cn(
                        "font-semibold",
                        weekStats.totalPnL >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        {formatCurrency(weekStats.totalPnL)}
                      </div>
                      <div className="text-muted-foreground">P&L</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-foreground">{weekStats.habitsCompleted}</div>
                      <div className="text-muted-foreground">Habits</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-foreground">{weekStats.reflectionDays}/7</div>
                      <div className="text-muted-foreground">Reflections</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Review Form */}
              <div className="space-y-6">
                {/* Trading Performance */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Trading Performance
                  </label>
                  <textarea
                    className="w-full p-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={3}
                    placeholder="How did your trading perform this week? What went well and what could be improved?"
                    value={formData.tradingPerformance}
                    onChange={(e) => setFormData(prev => ({ ...prev, tradingPerformance: e.target.value }))}
                  />
                </div>

                {/* Key Wins */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-500" />
                    Key Wins & Achievements
                  </label>
                  <textarea
                    className="w-full p-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={2}
                    placeholder="What were your biggest wins and achievements this week?"
                    value={formData.keyWins}
                    onChange={(e) => setFormData(prev => ({ ...prev, keyWins: e.target.value }))}
                  />
                </div>

                {/* Areas to Improve */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-500" />
                    Areas to Improve
                  </label>
                  <textarea
                    className="w-full p-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={2}
                    placeholder="What areas need improvement? What challenges did you face?"
                    value={formData.areasToImprove}
                    onChange={(e) => setFormData(prev => ({ ...prev, areasToImprove: e.target.value }))}
                  />
                </div>

                {/* Habits Reflection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                    Habits & Consistency
                  </label>
                  <textarea
                    className="w-full p-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={2}
                    placeholder="How consistent were you with your habits and routines this week?"
                    value={formData.habitsReflection}
                    onChange={(e) => setFormData(prev => ({ ...prev, habitsReflection: e.target.value }))}
                  />
                </div>

                {/* Lessons Learned */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-500" />
                    Lessons Learned *
                  </label>
                  <textarea
                    className="w-full p-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={3}
                    placeholder="What key lessons did you learn this week? What insights will you carry forward?"
                    value={formData.lessonsLearned}
                    onChange={(e) => setFormData(prev => ({ ...prev, lessonsLearned: e.target.value }))}
                  />
                </div>

                {/* Next Week Focus */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Next Week Focus *
                  </label>
                  <textarea
                    className="w-full p-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={3}
                    placeholder="What will you focus on next week? What are your key goals and priorities?"
                    value={formData.nextWeekFocus}
                    onChange={(e) => setFormData(prev => ({ ...prev, nextWeekFocus: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-border">
              <div className="text-xs text-muted-foreground">
                * Required fields • Complete review to earn 150 XP
              </div>
              
              <div className="flex gap-3">
                <motion.button
                  className="px-4 py-2 bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground rounded-lg transition-colors"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !isFormValid()}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Draft'}
                </motion.button>
                
                <motion.button
                  className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleComplete}
                  disabled={isSubmitting || !isFormValid() || existingReview?.isComplete}
                  whileTap={{ scale: 0.98 }}
                >
                  {existingReview?.isComplete ? 'Completed' : 'Complete Review (+150 XP)'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
