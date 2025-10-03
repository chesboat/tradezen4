import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, TrendingUp, Target, Lightbulb, Award, CheckCircle2, Star, ChevronDown, ChevronRight, Eye, AlertCircle } from 'lucide-react';
import { useWeeklyReviewStore } from '@/store/useWeeklyReviewStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useRuleTallyStore } from '@/store/useRuleTallyStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { summarizeWinLossScratch } from '@/lib/utils';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';
import { getWeeklyReviewXpDisplay } from '@/lib/xp/displayUtils';
import { Trade } from '@/types';

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
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [tradeReviewNotes, setTradeReviewNotes] = useState<Record<string, string>>({});

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

  // Get marked trades for this week (pending review)
  const getMarkedTradesForWeek = (): Trade[] => {
    if (!selectedAccountId) return [];

    const weekStart = new Date(reviewWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return trades.filter(trade => {
      const tradeDate = new Date(trade.entryTime);
      return tradeDate >= weekStart && 
             tradeDate <= weekEnd && 
             trade.accountId === selectedAccountId &&
             trade.markedForReview &&
             !trade.reviewedAt;
    }).sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
  };

  // Get reviewed trades for this week
  const getReviewedTradesForWeek = (): Trade[] => {
    if (!selectedAccountId) return [];

    const weekStart = new Date(reviewWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return trades.filter(trade => {
      const tradeDate = new Date(trade.entryTime);
      return tradeDate >= weekStart && 
             tradeDate <= weekEnd && 
             trade.accountId === selectedAccountId &&
             trade.markedForReview &&
             trade.reviewedAt;
    }).sort((a, b) => new Date(b.reviewedAt!).getTime() - new Date(a.reviewedAt!).getTime());
  };

  const markedTrades = getMarkedTradesForWeek();

  // Handle marking trade as reviewed
  const handleMarkTradeReviewed = async (tradeId: string) => {
    const { updateTrade } = useTradeStore.getState();
    const reviewNote = tradeReviewNotes[tradeId] || '';
    
    await updateTrade(tradeId, {
      reviewedAt: new Date(),
      reviewNote: reviewNote || undefined,
    });

    // Clear the note from state
    setTradeReviewNotes(prev => {
      const updated = { ...prev };
      delete updated[tradeId];
      return updated;
    });
  };

  // Generate reflection suggestions from marked trades
  const generateReflectionSuggestions = () => {
    if (markedTrades.length === 0) return;

    const winners = markedTrades.filter(t => (t.pnl || 0) > 0);
    const losers = markedTrades.filter(t => (t.pnl || 0) < 0);

    let suggestions = {
      tradingPerformance: '',
      keyWins: '',
      areasToImprove: '',
      lessonsLearned: '',
    };

    // Generate trading performance insight
    if (markedTrades.length > 0) {
      const totalPnL = markedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      suggestions.tradingPerformance = `Reviewed ${markedTrades.length} key trades (${winners.length} wins, ${losers.length} losses) with ${totalPnL >= 0 ? 'positive' : 'negative'} P&L of ${formatCurrency(totalPnL)}. `;
    }

    // Generate key wins from winning trades
    if (winners.length > 0) {
      const topWin = winners.reduce((max, t) => ((t.pnl || 0) > (max.pnl || 0) ? t : max));
      suggestions.keyWins = `Best trade: ${topWin.symbol} (${formatCurrency(topWin.pnl || 0)}). ${topWin.notes ? 'Notes: ' + topWin.notes : ''}`;
    }

    // Generate areas to improve from losing trades
    if (losers.length > 0) {
      const worstLoss = losers.reduce((min, t) => ((t.pnl || 0) < (min.pnl || 0) ? t : min));
      suggestions.areasToImprove = `Review ${worstLoss.symbol} loss (${formatCurrency(worstLoss.pnl || 0)}). ${worstLoss.notes ? 'Notes: ' + worstLoss.notes : ''}`;
    }

    // Combine review notes into lessons
    const reviewNotes = Object.values(tradeReviewNotes).filter(note => note.trim());
    if (reviewNotes.length > 0) {
      suggestions.lessonsLearned = reviewNotes.join(' • ');
    }

    setFormData(prev => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(suggestions).map(([key, value]) => [
          key,
          prev[key as keyof typeof prev] ? prev[key as keyof typeof prev] + '\n\n' + value : value
        ])
      )
    }));
  };

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
                    <span className="font-semibold">Weekly Review Complete! {getWeeklyReviewXpDisplay().display}</span>
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

              {/* Review Summary Section */}
              {(markedTrades.length > 0 || getReviewedTradesForWeek().length > 0) && (
                <div className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                      <h3 className="font-semibold text-foreground">Review Summary</h3>
                    </div>
                    {markedTrades.length > 0 && (
                      <motion.button
                        onClick={generateReflectionSuggestions}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                        whileTap={{ scale: 0.95 }}
                        title="Auto-fill reflection fields with insights from marked trades"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        Use as Reflection
                      </motion.button>
                    )}
                  </div>
                  
                  {/* Review Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600">{getReviewedTradesForWeek().length}</div>
                      <div className="text-xs text-muted-foreground">Reviewed</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{markedTrades.length}</div>
                      <div className="text-xs text-muted-foreground">Pending</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-foreground">{getReviewedTradesForWeek().length + markedTrades.length}</div>
                      <div className="text-xs text-muted-foreground">Total Marked</div>
                    </div>
                    <div className="bg-background/50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {getReviewedTradesForWeek().length + markedTrades.length > 0
                          ? Math.round((getReviewedTradesForWeek().length / (getReviewedTradesForWeek().length + markedTrades.length)) * 100)
                          : 0}%
                      </div>
                      <div className="text-xs text-muted-foreground">Complete</div>
                    </div>
                  </div>

                  {markedTrades.length > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-yellow-600">{markedTrades.length} trade{markedTrades.length !== 1 ? 's' : ''}</span> still need review. Open daily journal to review while fresh!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Expandable: Marked Trades Still Pending */}
              {markedTrades.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">Pending Reviews</h3>
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-600 rounded-full text-xs font-medium">
                        {markedTrades.length}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {markedTrades.map((trade) => (
                      <motion.div
                        key={trade.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-background border border-border rounded-lg overflow-hidden"
                      >
                        {/* Trade Summary */}
                        <div
                          className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => setExpandedTradeId(expandedTradeId === trade.id ? null : trade.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                (trade.pnl || 0) > 0 ? "bg-green-500" : (trade.pnl || 0) < 0 ? "bg-red-500" : "bg-gray-400"
                              )} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{trade.symbol}</span>
                                  <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                                    {trade.direction === 'long' ? '↑' : '↓'} {trade.direction}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(trade.entryTime).toLocaleDateString()} at {new Date(trade.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "font-semibold",
                                (trade.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {formatCurrency(trade.pnl || 0)}
                              </div>
                              {expandedTradeId === trade.id ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expanded Trade Details */}
                        <AnimatePresence>
                          {expandedTradeId === trade.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="border-t border-border"
                            >
                              <div className="p-4 space-y-3 bg-muted/20">
                                {/* Trade Details */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <div className="text-muted-foreground text-xs">Entry</div>
                                    <div className="font-medium">${trade.entryPrice.toFixed(2)}</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground text-xs">Exit</div>
                                    <div className="font-medium">${trade.exitPrice?.toFixed(2) || 'Open'}</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground text-xs">Quantity</div>
                                    <div className="font-medium">{trade.quantity}</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground text-xs">R:R</div>
                                    <div className="font-medium">{trade.riskRewardRatio}:1</div>
                                  </div>
                                </div>

                                {/* Original Notes */}
                                {trade.notes && (
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Original Notes</div>
                                    <div className="text-sm bg-background/50 p-2 rounded border border-border/50">
                                      {trade.notes}
                                    </div>
                                  </div>
                                )}

                                {/* Review Note Input */}
                                <div>
                                  <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                                    <Lightbulb className="w-3.5 h-3.5 text-blue-500" />
                                    What did you learn from this trade?
                                  </label>
                                  <textarea
                                    className="w-full p-2 text-sm bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    rows={2}
                                    placeholder="Key lessons, insights, or patterns to remember..."
                                    value={tradeReviewNotes[trade.id] || ''}
                                    onChange={(e) => setTradeReviewNotes(prev => ({
                                      ...prev,
                                      [trade.id]: e.target.value
                                    }))}
                                  />
                                </div>

                                {/* Action Button */}
                                <motion.button
                                  onClick={() => handleMarkTradeReviewed(trade.id)}
                                  className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  Mark as Reviewed
                                </motion.button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
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
                * Required fields • Complete review to earn {getWeeklyReviewXpDisplay().xp} XP
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
                  {existingReview?.isComplete ? 'Completed' : `Complete Review (${getWeeklyReviewXpDisplay().display})`}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
