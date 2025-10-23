import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  DollarSign,
  Star,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  Camera,
  X as CloseIcon,
  Image as ImageIcon,
  Maximize2
} from 'lucide-react';
import { PublicShareDialog } from './PublicShareDialog';
import { ReflectionHub } from './ReflectionHub';
import { ImageUpload } from './ImageUpload';
import { NoteContent } from './NoteContent';
import { useTradeStore } from '@/store/useTradeStore';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { useAccountFilterStore, getAccountIdsForSelection } from '@/store/useAccountFilterStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { cn } from '@/lib/utils';
import { createTradeInsightShare } from '@/lib/publicShare';

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
  const { trades, updateTrade } = useTradeStore();
  const { notes } = useQuickNoteStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { reflections } = useDailyReflectionStore();
  
  // Marked trades review states
  const [expandedMarkedTradeId, setExpandedMarkedTradeId] = useState<string | null>(null);
  const [markedTradeReviewNotes, setMarkedTradeReviewNotes] = useState<Record<string, string>>({});
  const [reviewImages, setReviewImages] = useState<Record<string, string[]>>({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [allTradesExpanded, setAllTradesExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'workflow' | 'story'>('workflow');

  // Filter trades and notes for this day (with proper grouped account support)
  const dayTrades = useMemo(() => {
    if (!dateString) return [];
    const accountIds = getAccountIdsForSelection(selectedAccountId);
    return trades.filter(t => {
      const tradeDate = new Date(t.entryTime).toISOString().split('T')[0];
      const matchesDate = tradeDate === dateString;
      const matchesAccount = accountIds.includes(t.accountId);
      return matchesDate && matchesAccount;
    });
  }, [trades, dateString, selectedAccountId]);

  const dayNotes = useMemo(() => {
    if (!dateString) return [];
    const accountIds = getAccountIdsForSelection(selectedAccountId);
    return notes.filter(n => {
      const noteDate = new Date(n.createdAt).toISOString().split('T')[0];
      const matchesDate = noteDate === dateString;
      const matchesAccount = accountIds.includes(n.accountId);
      return matchesDate && matchesAccount;
    });
  }, [notes, dateString, selectedAccountId]);

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

  // Get today's marked trades (only unreviewed)
  const markedTrades = useMemo(() => {
    return dayTrades.filter(trade => trade.markedForReview && !trade.reviewedAt);
  }, [dayTrades]);

  // Get today's reviewed trades
  const reviewedTrades = useMemo(() => {
    return dayTrades.filter(trade => trade.markedForReview && trade.reviewedAt);
  }, [dayTrades]);

  // Handle marking trade as reviewed
  const handleMarkTradeReviewed = async (tradeId: string) => {
    const reviewNote = markedTradeReviewNotes[tradeId] || '';
    const images = reviewImages[tradeId] || [];
    
    await updateTrade(tradeId, {
      reviewedAt: new Date(),
      reviewNote: reviewNote || undefined,
      reviewImages: images.length > 0 ? images : undefined,
    });

    // Clear the state
    setMarkedTradeReviewNotes(prev => {
      const updated = { ...prev };
      delete updated[tradeId];
      return updated;
    });
    setReviewImages(prev => {
      const updated = { ...prev };
      delete updated[tradeId];
      return updated;
    });

    // Collapse the expanded trade
    setExpandedMarkedTradeId(null);
  };

  // Handle image upload
  const handleImageUpload = (tradeId: string, imageUrl: string) => {
    setReviewImages(prev => ({
      ...prev,
      [tradeId]: [...(prev[tradeId] || []), imageUrl]
    }));
  };

  // Handle image removal
  const handleImageRemove = (tradeId: string, imageUrl: string) => {
    setReviewImages(prev => ({
      ...prev,
      [tradeId]: (prev[tradeId] || []).filter(url => url !== imageUrl)
    }));
  };

  // Share individual trade insight
  const handleShareTradeInsight = async (tradeId: string) => {
    console.log('🔍 Sharing trade insight for:', tradeId);
    try {
      const result = await createTradeInsightShare(tradeId);
      console.log('✅ Share created:', result);
      const { url } = result;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(url);
      console.log('📋 Copied to clipboard:', url);
      
      // Show success toast
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 bg-card border border-border rounded-xl shadow-2xl flex items-center gap-3 max-w-md';
      toast.innerHTML = `
        <div class="flex items-center gap-3 flex-1">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-foreground text-sm">Share Link Copied!</div>
            <div class="text-xs text-muted-foreground truncate mt-0.5">${url}</div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    } catch (error: any) {
      console.error('❌ Failed to share trade insight:', error);
      // Show error toast
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 bg-red-500/10 border border-red-500/30 rounded-xl shadow-2xl flex items-center gap-3 max-w-md';
      toast.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full bg-red-500"></div>
          <span class="text-sm font-medium text-red-600">${error.message || 'Failed to create share link'}</span>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }
  };

  // Force close any open tooltips when modal opens
  useEffect(() => {
    if (isOpen) {
      // Dispatch a global event to close all tooltips
      const closeEvent = new Event('close-all-tooltips');
      window.dispatchEvent(closeEvent);
    }
  }, [isOpen]);

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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal Content - Full screen on desktop, sheet on mobile */}
          <motion.div
            className={cn(
              "fixed bg-background flex flex-col overflow-hidden z-[100]",
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
              <div className="w-full md:max-w-3xl md:mx-auto px-4 md:px-6 py-6 space-y-8">
                
                {/* Mode Toggle - Workflow vs Story */}
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1 p-1 bg-muted/30 rounded-xl w-fit mx-auto">
                    <button
                      onClick={() => setViewMode('workflow')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        viewMode === 'workflow'
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      🔧 Workflow
                    </button>
                    <button
                      onClick={() => setViewMode('story')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        viewMode === 'story'
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      ✨ Story View
                    </button>
                  </div>
                  
                  {/* Mode Description */}
                  <motion.p
                    key={viewMode}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-muted-foreground text-center max-w-md mx-auto"
                  >
                    {viewMode === 'workflow' 
                      ? "Complete reviews, manage trades, and track tasks"
                      : "Clean view optimized for sharing - showcases insights & story"}
                  </motion.p>
                </div>
                
                {/* Hero Metrics - Large P&L with inline stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-4"
                >
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
                </motion.div>

                {/* Daily Reflection - The Story */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                    <h3 className="text-base font-semibold text-foreground">
                      Today's Story
                  </h3>
                  </div>
                  <ReflectionHub 
                    date={dateString}
                    className=""
                  />
                </motion.div>

                {/* Trade Insights Section - Featured Content */}
                {reviewedTrades.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Premium Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                          <Lightbulb className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-foreground">
                            Trade Insights
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Analyzed & Annotated
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 text-purple-600 rounded-full text-xs font-medium">
                        {reviewedTrades.length} {reviewedTrades.length === 1 ? 'Insight' : 'Insights'}
                      </span>
                    </div>
                    <div className="space-y-4">
                      {reviewedTrades.map((trade) => (
                        <motion.div
                          key={trade.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-br from-background to-muted/20 border-2 border-border/50 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Trade Header */}
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2 flex-1">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    (trade.pnl || 0) > 0 ? "bg-green-500" : (trade.pnl || 0) < 0 ? "bg-red-500" : "bg-gray-400"
                                  )} />
                                  <span className="font-semibold">{trade.symbol}</span>
                                  <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                                    {trade.direction === 'long' ? '↑' : '↓'} {trade.direction}
                                  </span>
                                  {trade.reviewImages && trade.reviewImages.length > 0 && (
                                    <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded">
                                      <Camera className="w-3 h-3" />
                                      {trade.reviewImages.length}
                                    </span>
                                  )}
                                  <span className={cn(
                                    "text-sm font-semibold",
                                    (trade.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"
                                  )}>
                                    {formatCurrency(trade.pnl || 0)}
                                  </span>
                </div>

                                {/* Share This Insight */}
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShareTradeInsight(trade.id);
                                  }}
                                  className="p-2 hover:bg-primary/10 rounded-lg transition-colors text-muted-foreground hover:text-primary group/share"
                                  title="Share this insight - Copy link to clipboard"
                                >
                                  <Share2 className="w-4 h-4 group-hover/share:rotate-12 transition-transform" />
                                </motion.button>
                              </div>

                              {/* Trade Details */}
                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                                <div>Entry: ${trade.entryPrice.toFixed(2)}</div>
                                <div>Exit: ${trade.exitPrice?.toFixed(2) || 'Open'}</div>
                              </div>

                              {/* Review Note */}
                              {trade.reviewNote && (
                                <div className="mb-3">
                                  <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                    <Lightbulb className="w-3 h-3" />
                                    Key Learnings
                                  </div>
                                  <div className="text-sm text-foreground bg-background/50 p-3 rounded-lg border border-border/50">
                                    {trade.reviewNote}
                                  </div>
                                </div>
                              )}

                              {/* Review Images Thumbnails */}
                              {trade.reviewImages && trade.reviewImages.length > 0 && (
                                <div className="flex flex-wrap gap-3">
                                  {trade.reviewImages.map((imageUrl, idx) => (
                                    <motion.div
                                      key={idx}
                                      className="relative group cursor-pointer"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => setLightboxImage(imageUrl)}
                                    >
                                      <img
                                        src={imageUrl}
                                        alt={`Review chart ${idx + 1}`}
                                        className="w-32 h-32 object-cover rounded-lg border-2 border-border/50 transition-all"
                                      />
                                      {/* Hover overlay with expand icon */}
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
                                        <Maximize2 className="w-6 h-6 text-white" />
                                      </div>
                                      {/* Image number badge */}
                                      <div className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white text-[10px] rounded-full flex items-center justify-center font-medium pointer-events-none">
                                        {idx + 1}
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ) : markedTrades.length > 0 && viewMode === 'story' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 text-center bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/20 rounded-2xl"
                  >
                    <Lightbulb className="w-12 h-12 text-purple-500 mx-auto mb-3 opacity-50" />
                    <h4 className="font-semibold text-foreground mb-2">Ready to Create Insights?</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      You have {markedTrades.length} {markedTrades.length === 1 ? 'trade' : 'trades'} marked for review. Complete your analysis to showcase them here.
                    </p>
                    <button
                      onClick={() => setViewMode('workflow')}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Switch to Workflow
                    </button>
                  </motion.div>
                ) : null}

                {/* Marked Trades for Review Section - Workflow Only */}
                {viewMode === 'workflow' && markedTrades.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 p-4 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border-2 border-yellow-500/30 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                          <Star className="w-4 h-4 text-white fill-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-foreground">
                            For Review
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Review while fresh 🔥
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-yellow-500 text-white rounded-full text-xs font-medium shadow-sm">
                        {markedTrades.length} Pending
                      </span>
                    </div>
                    <div className="space-y-3">
                      {markedTrades.map((trade) => (
                        <motion.div
                          key={trade.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-background border border-border rounded-lg overflow-hidden"
                        >
                          {/* Trade Summary */}
                          <div
                            className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => setExpandedMarkedTradeId(expandedMarkedTradeId === trade.id ? null : trade.id)}
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
                                    {trade.reviewImages && trade.reviewImages.length > 0 && (
                                      <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded">
                                        <Camera className="w-3 h-3" />
                                        {trade.reviewImages.length}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {new Date(trade.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                {expandedMarkedTradeId === trade.id ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Trade Details */}
                          <AnimatePresence>
                            {expandedMarkedTradeId === trade.id && (
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

                                  {/* Chart Screenshots */}
                                  <div>
                                    <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                                      <Camera className="w-3.5 h-3.5 text-purple-500" />
                                      Chart Review (Optional)
                                    </label>
                                    
                                    {/* Image Thumbnails */}
                                    {(reviewImages[trade.id] || []).length > 0 && (
                                      <div className="flex flex-wrap gap-3 mb-2">
                                        {(reviewImages[trade.id] || []).map((imageUrl, idx) => (
                                          <motion.div
                                            key={imageUrl}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="relative group cursor-pointer"
                                            onClick={() => setLightboxImage(imageUrl)}
                                          >
                                            <img
                                              src={imageUrl}
                                              alt={`Chart review ${idx + 1}`}
                                              className="w-32 h-32 object-cover rounded-lg border-2 border-border/50 transition-all"
                                            />
                                            {/* Hover overlay with expand icon */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
                                              <Maximize2 className="w-6 h-6 text-white" />
                                            </div>
                                            {/* Image number badge */}
                                            <div className="absolute top-1 left-1 w-5 h-5 bg-black/60 text-white text-[10px] rounded-full flex items-center justify-center font-medium pointer-events-none">
                                              {idx + 1}
                                            </div>
                                            {/* Remove button */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleImageRemove(trade.id, imageUrl);
                                              }}
                                              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg"
                                            >
                                              <CloseIcon className="w-3.5 h-3.5" />
                                            </button>
                                          </motion.div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {/* Image Upload */}
                          <ImageUpload
                            onImageUpload={(url) => handleImageUpload(trade.id, url)}
                            currentImages={reviewImages[trade.id] || []}
                            maxImages={4}
                            className="mb-2"
                          />
                                    <p className="text-[10px] text-muted-foreground">
                                      Paste (Cmd+V) or drag your annotated chart • Max 4 images
                                    </p>
                                  </div>

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
                                      value={markedTradeReviewNotes[trade.id] || ''}
                                      onChange={(e) => setMarkedTradeReviewNotes(prev => ({
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
                  </motion.div>
                )}

                {/* All Trades Section - Collapsible (Hidden in Story Mode) */}
                {dayTrades.length > 0 && viewMode === 'workflow' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setAllTradesExpanded(!allTradesExpanded)}
                      className="w-full flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/30 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          All Trades
                    </h3>
                        <span className="px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground">
                          {dayTrades.length}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">(Reference)</span>
                      </div>
                      <ChevronDown className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform",
                        allTradesExpanded && "rotate-180"
                      )} />
                    </button>
                    
                    <AnimatePresence>
                      {allTradesExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 overflow-hidden"
                        >
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Notes Section */}
                {dayNotes.length > 0 && viewMode === 'workflow' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Notes
                    </h3>
                      <span className="px-2 py-0.5 bg-muted/50 rounded-full text-xs text-muted-foreground">
                        {dayNotes.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {dayNotes.map((note, idx) => (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-muted/20 rounded-xl p-4"
                        >
                          <NoteContent content={note.content} className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" />
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

          {/* Lightbox for Chart Images */}
          <AnimatePresence>
            {lightboxImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setLightboxImage(null)}
              >
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute top-6 right-6 w-12 h-12 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-2xl backdrop-blur-sm border border-white/20"
                  onClick={() => setLightboxImage(null)}
                >
                  <CloseIcon className="w-6 h-6 text-black" />
                </motion.button>
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  src={lightboxImage}
                  alt="Chart review"
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

