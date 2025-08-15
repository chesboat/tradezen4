import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight,
  TrendingUp,
  Target,
  DollarSign,
  MessageSquare,
  BookOpen,
  CheckCircle,
  Pin,
  Plus,
  Smile,
  Zap
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useQuickNoteStore, useQuickNoteTags } from '@/store/useQuickNoteStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { useQuestStore } from '@/store/useQuestStore';
import { formatCurrency, formatDate, getMoodEmoji } from '@/lib/localStorageUtils';
import { cn, summarizeWinLossScratch } from '@/lib/utils';
import { ReflectionHub } from './ReflectionHub';
import { CircularProgress } from './ui/CircularProgress';

interface JournalDayCardProps {
  date: string;
  dateObj: Date;
  stats: {
    pnl: number;
    trades: number;
    winRate: number;
    avgRR: number;
  };
  hasReflection: boolean;
  quickNotesCount: number;
  isToday: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const JournalDayCard: React.FC<JournalDayCardProps> = ({
  date,
  dateObj,
  stats,
  hasReflection,


  isToday,
  isExpanded,
  onToggleExpanded
}) => {
  const { trades } = useTradeStore();
  const { notes, addInlineNote, getNotesForDate } = useQuickNoteStore();
  const { suggestedTags, tagsByUsage } = useQuickNoteTags();
  const { selectedAccountId } = useAccountFilterStore();
  const { addActivity } = useActivityLogStore();
  const { addQuest, pinQuest } = useQuestStore();
  const {
    reflections,
    markReflectionComplete,
    getReflectionStreak,
    getMoodTimeline,
    cleanupDuplicateMoodEntries,
    addMoodEntry
  } = useDailyReflectionStore();

  // Get reflection data with proper reactivity
  const reflection = useMemo(() => {
    if (!selectedAccountId) return null;
    return reflections.find((r) => 
      r.date === date && r.accountId === selectedAccountId
    );
  }, [reflections, date, selectedAccountId]);
  // Get mood timeline and cleanup duplicates
  const moodTimeline = useMemo(() => {
    // Clean up duplicates first
    cleanupDuplicateMoodEntries(date);
    // Then get the cleaned timeline
    return getMoodTimeline(date);
  }, [date, reflections, trades, notes]); // Removed function references from dependencies

  // Component state

  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [earnedXP, setEarnedXP] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  
  // Inline quick note state
  const [inlineNoteText, setInlineNoteText] = useState('');
  const [isInlineInputFocused, setIsInlineInputFocused] = useState(false);
  const [showInlineXP, setShowInlineXP] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);


  const processedTradesRef = useRef<Set<string>>(new Set());
  const processedNotesRef = useRef<Set<string>>(new Set());

  // Get day's data with memoization to prevent infinite loops
  const dayTrades = useMemo(() => {
    const filtered = trades.filter(trade => {
      const tradeDate = new Date(trade.entryTime);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      const matches = tradeDate >= dayStart && tradeDate <= dayEnd &&
             (!selectedAccountId || trade.accountId === selectedAccountId);
      
      // Debug logging for today's card
      if (isToday) {
        console.log(`JournalDayCard DEBUG - Today (${date}):`, {
          trade: trade.id,
          symbol: trade.symbol,
          entryTime: trade.entryTime,
          tradeDate: tradeDate.toISOString(),
          dayStart: dayStart.toISOString(),
          dayEnd: dayEnd.toISOString(),
          matches
        });
      }
      
      return matches;
    });
    
    // Debug summary for today's card
    if (isToday) {
      console.log(`JournalDayCard SUMMARY - Today (${date}): ${filtered.length} trades found`, 
        filtered.map(t => ({ id: t.id, symbol: t.symbol, pnl: t.pnl })));
    }
    
    return filtered;
  }, [trades, date, selectedAccountId, isToday]);

  const dayNotes = useMemo(() => {
    return getNotesForDate(dateObj)
      .filter(note => !selectedAccountId || note.accountId === selectedAccountId);
  }, [getNotesForDate, dateObj, selectedAccountId, notes]);

  // Track mood changes from trades
  useEffect(() => {
    if (!selectedAccountId) return;
    
    dayTrades.forEach(trade => {
      if (trade.mood && !processedTradesRef.current.has(trade.id)) {
        const trigger = trade.result === 'win' ? 'trade-win' : 
                       trade.result === 'loss' ? 'trade-loss' : 'trade-breakeven';
        addMoodEntry(date, trade.mood, trigger, trade.id, new Date(trade.entryTime), selectedAccountId);
        processedTradesRef.current.add(trade.id);
      }
    });
  }, [dayTrades, selectedAccountId, date]); // Removed addMoodEntry from dependencies

  // Track mood changes from quick notes
  useEffect(() => {
    if (!selectedAccountId) return;
    
    dayNotes.forEach(note => {
      if (note.mood && !processedNotesRef.current.has(note.id)) {
        addMoodEntry(date, note.mood, 'note', note.id, new Date(note.createdAt), selectedAccountId);
        processedNotesRef.current.add(note.id);
      }
    });
  }, [dayNotes, selectedAccountId, date]); // Removed addMoodEntry from dependencies

  // Clean up processed refs when date changes
  useEffect(() => {
    processedTradesRef.current.clear();
    processedNotesRef.current.clear();
  }, [date, selectedAccountId]);





  // Handle input change with tag suggestions
  const handleInlineNoteChange = (value: string) => {
    setInlineNoteText(value);
    
    // Check if user is typing a hashtag
    const words = value.split(' ');
    const currentWord = words[words.length - 1];
    
    if (currentWord.startsWith('#') && currentWord.length > 1) {
      const searchTerm = currentWord.slice(1).toLowerCase();
      const suggestions = [...tagsByUsage, ...suggestedTags]
        .filter(tag => tag.toLowerCase().includes(searchTerm))
        .slice(0, 5);
      
      setTagSuggestions(suggestions);
      setShowTagSuggestions(suggestions.length > 0);
    } else {
      setShowTagSuggestions(false);
    }
  };

  // Apply tag suggestion
  const applyTagSuggestion = (tag: string) => {
    const words = inlineNoteText.split(' ');
    words[words.length - 1] = `#${tag}`;
    setInlineNoteText(words.join(' ') + ' ');
    setShowTagSuggestions(false);
  };

  // Add inline quick note with hashtag parsing
  const handleAddInlineNote = () => {
    if (!inlineNoteText.trim() || !selectedAccountId) return;
    
    addInlineNote(inlineNoteText, selectedAccountId || 'all');
    
    setInlineNoteText('');
    setIsInlineInputFocused(false);
    setShowTagSuggestions(false);
    
    // Show instant feedback
    setShowInlineXP(true);
    setTimeout(() => setShowInlineXP(false), 2000);
    
    addActivity({
      type: 'note',
      title: 'Quick Note Added',
      description: inlineNoteText.slice(0, 50) + (inlineNoteText.length > 50 ? '...' : ''),
      xpEarned: 5,
      accountId: selectedAccountId,
    });
  };

  // Pin key focus as quest
  const handlePinKeyFocus = async () => {
    if (!reflection?.keyFocus || !selectedAccountId) return;
    
    const quest = await addQuest({
      title: 'Daily Focus',
      description: reflection.keyFocus,
      type: 'daily',
      status: 'pending',
      progress: 0,
      maxProgress: 1,
      xpReward: 25,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      accountId: selectedAccountId,
    });
    
    pinQuest(quest.id);
    
    addActivity({
      type: 'quest',
      title: 'Pinned Daily Focus',
      description: reflection.keyFocus,
      xpEarned: 5,
      relatedId: reflection.id,
      accountId: selectedAccountId,
    });
  };

  // Mark day complete
  const handleMarkComplete = () => {
    if (!reflection || !selectedAccountId) return;
    
    setIsCompleting(true);
    try {
      markReflectionComplete(reflection.id);
      
      const newStreak = getReflectionStreak(selectedAccountId);
      const xpEarned = 50 + (newStreak * 5);
      
      setEarnedXP(xpEarned);
      setShowXPAnimation(true);
      
      addActivity({
        type: 'journal',
        title: 'Day Complete! 🎉',
        description: `Completed reflection for ${formatDate(dateObj)} • ${newStreak} day streak!`,
        xpEarned,
        relatedId: reflection.id,
        accountId: selectedAccountId,
      });
      
      setTimeout(() => setShowXPAnimation(false), 3000);
      
    } catch (error) {
      console.error('Failed to complete day:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  // Get mood trend display
  const getMoodTrendDisplay = () => {
    if (moodTimeline.length === 0) return null;
    
    const moods = moodTimeline.map(entry => getMoodEmoji(entry.mood));
    if (moods.length === 1) return moods[0];
    
    return moods.join(' → ');
  };

  return (
    <motion.div
      className={cn(
        "bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200",
        isToday && "ring-2 ring-primary/50",
        hasReflection && "border-green-500/30 bg-green-50/5",
        isExpanded && "shadow-lg"
      )}
      layout
    >
      {/* Header */}
      <div 
        className="p-4 cursor-pointer"
        onClick={onToggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Expand/Collapse Button */}
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.div>
            
            {/* Date and Day */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">
                  {formatDate(dateObj)}
                </h3>
                {isToday && (
                  <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                    Today
                  </span>
                )}
                {hasReflection && (
                  <BookOpen className="w-4 h-4 text-green-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {dateObj.toLocaleDateString('en-US', { weekday: 'long' })}
              </p>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="flex items-center gap-6 text-sm">
            {/* P&L */}
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className={cn(
                "font-medium",
                stats.pnl > 0 ? "text-green-500" : stats.pnl < 0 ? "text-red-500" : "text-muted-foreground"
              )}>
                {formatCurrency(stats.pnl)}
              </span>
            </div>
            
            {/* Trades */}
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {stats.trades} trades
              </span>
            </div>
            
            {/* Win Rate */}
            {stats.trades > 0 && (
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {stats.winRate.toFixed(0)}%
                </span>
              </div>
            )}
            
            {/* Notes */}
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">
                    {dayNotes.length} notes
                  </span>
            </div>
            
            {/* Mood */}
            {getMoodTrendDisplay() && (
              <div className="flex items-center gap-1">
                <Smile className="w-4 h-4 text-muted-foreground" />
                <span className="text-lg">{getMoodTrendDisplay()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inline Quick Note Input */}
      <div className="px-4 pb-3">
        <motion.div
          animate={{
            height: isInlineInputFocused || inlineNoteText ? 'auto' : '40px',
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="relative overflow-hidden"
        >
          <div className="flex gap-2 items-start">
            <div className="flex-1 relative">
              <motion.input
                type="text"
                value={inlineNoteText}
                onChange={(e) => handleInlineNoteChange(e.target.value)}
                onFocus={() => setIsInlineInputFocused(true)}
                onBlur={() => {
                  // Delay blur to allow tag selection
                  setTimeout(() => {
                    if (!inlineNoteText.trim()) {
                      setIsInlineInputFocused(false);
                    }
                    setShowTagSuggestions(false);
                  }, 150);
                }}
                placeholder="Add a quick note..."
                className={cn(
                  "w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                  "transition-all duration-200 placeholder:text-muted-foreground/70",
                  isInlineInputFocused && "bg-background border-border"
                )}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (showTagSuggestions && tagSuggestions.length > 0) {
                      applyTagSuggestion(tagSuggestions[0]);
                    } else {
                      handleAddInlineNote();
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowTagSuggestions(false);
                  }
                }}
              />
              
              {/* Tag Suggestions Dropdown */}
              <AnimatePresence>
                {showTagSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-32 overflow-y-auto"
                  >
                    {tagSuggestions.map((tag, index) => (
                      <button
                        key={tag}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent input blur
                          applyTagSuggestion(tag);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors",
                          "flex items-center gap-2",
                          index === 0 && "bg-muted/50"
                        )}
                      >
                        <span className="text-primary">#</span>
                        <span>{tag}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {(isInlineInputFocused || inlineNoteText) && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleAddInlineNote}
                  disabled={!inlineNoteText.trim()}
                  className={cn(
                    "px-3 py-2 bg-primary/90 text-primary-foreground rounded-lg",
                    "hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-colors flex items-center gap-1"
                  )}
                >
                  <Plus className="w-3 h-3" />
                  <span className="text-xs">Add</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
          
          {/* Hashtag hint */}
          <AnimatePresence>
            {isInlineInputFocused && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="mt-2 text-xs text-muted-foreground flex items-center gap-1"
              >
                <span>💡 Use #hashtags to auto-tag your notes</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Inline XP Feedback */}
        <AnimatePresence>
          {showInlineXP && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="mt-2 flex items-center justify-center"
            >
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Note added +5 XP
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-6">
              {/* Stats Detail */}
              {stats.trades > 0 && (
                <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-xl">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{stats.trades}</div>
                    <div className="text-xs text-muted-foreground">Trades</div>
                  </div>
                  <div className="text-center">
                    <div className={cn(
                      "text-2xl font-bold",
                      stats.pnl > 0 ? "text-green-500" : stats.pnl < 0 ? "text-red-500" : "text-muted-foreground"
                    )}>
                      {formatCurrency(stats.pnl)}
                    </div>
                    <div className="text-xs text-muted-foreground">P&L</div>
                  </div>
                  <div className="text-center">
                    {(() => {
                      const { wins, losses, scratches } = summarizeWinLossScratch(dayTrades);
                      return (
                        <CircularProgress
                          wins={wins}
                          losses={losses}
                          breakeven={scratches}
                          size="sm"
                          showLabels={false}
                          showPercentage={true}
                          showInlineNumbers={true}
                        />
                      );
                    })()}
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{stats.avgRR.toFixed(1)}:1</div>
                    <div className="text-xs text-muted-foreground">Avg R:R</div>
                  </div>
                </div>
              )}

              {/* Quick Notes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    Quick Notes
                  </h4>
                  <span className="text-sm text-muted-foreground">
                    {dayNotes.length} notes
                  </span>
                </div>
                
                {dayNotes.length > 0 && (
                  <div className="space-y-2">
                    {dayNotes.map((note) => (
                      <div key={note.id} className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-sm text-foreground">{note.content}</p>
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {note.tags.map((tag, index) => (
                              <span 
                                key={index}
                                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(note.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                

              </div>

              {/* Daily Reflection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-green-500" />
                    Daily Reflection
                    {reflection?.isComplete && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </h4>
                </div>
                
                {/* Use new ReflectionHub for Template 2.0 system */}
                <ReflectionHub 
                  date={date}
                  className="mt-3"
                />
               </div>

              {/* Key Focus */}
              {reflection?.keyFocus && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Key Focus
                    </h5>
                    <button
                      onClick={handlePinKeyFocus}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                    >
                      <Pin className="w-3 h-3 inline mr-1" />
                      Pin as Quest
                    </button>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {reflection.keyFocus}
                  </p>
                </div>
              )}

              {/* Complete Day Button */}
              {reflection?.reflection?.trim() && !reflection?.isComplete && (
                <button
                  onClick={handleMarkComplete}
                  disabled={isCompleting}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isCompleting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Completing...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      ✅ Mark Day as Complete
                    </div>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* XP Celebration */}
      <AnimatePresence>
        {showXPAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl"
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-6 rounded-2xl shadow-2xl text-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0] 
                }}
                transition={{ 
                  duration: 0.6,
                  ease: "easeInOut",
                  repeat: 2
                }}
              >
                <Zap className="w-12 h-12 mx-auto mb-2" />
              </motion.div>
              <div className="text-2xl font-bold mb-1">+{earnedXP} XP</div>
              <div className="text-sm opacity-90">Day completed! 🎉</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}; 