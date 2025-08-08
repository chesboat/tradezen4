import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  Target,
  Trophy,
  FileText,
  Brain,
  MessageSquare,
  Calendar,
  BarChart3,
  Clock,
  AlertCircle,
  Flame,
  Pin,
  MessageCircle,
  Smile,
  ChevronDown,
  ChevronUp,
  Star,
  Loader2,
  Minus,
  Check,
  Info,
  Zap,
  Send,
  ArrowUp,
  ArrowDown,
  RotateCcw
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useQuestStore } from '@/store/useQuestStore';
import { generateDailyFocus } from '@/lib/ai/generateDailyFocus';
import { generateQuestSuggestions } from '@/lib/ai/generateQuestSuggestions';
import { CalendarDay, TradeResult, MoodType, Quest } from '@/types';
import { formatCurrency, formatDate, getMoodColor, formatTime } from '@/lib/localStorageUtils';

import { cn } from '@/lib/utils';
import { TagPill, TagList } from './TagPill';
import { MoodTimeline } from './MoodTimeline';
import { Sparkline } from './ui/Sparkline';
import { Tooltip } from './ui/Tooltip';
import { ReflectionHub } from './ReflectionHub';

interface DayDetailModalProps {
  day: CalendarDay | null;
  isOpen: boolean;
  onClose: () => void;
}

interface GPTInsight {
  type: 'pattern' | 'warning' | 'achievement' | 'suggestion';
  title: string;
  description: string;
  confidence: number;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({ day, isOpen, onClose }) => {
  const trades = useTradeStore(state => state.trades);
  const { getNotesForDate } = useQuickNoteStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { addActivity } = useActivityLogStore();
  const { addQuest, pinQuest } = useQuestStore();
    const {
    reflections,
    getMoodTimeline,
    addMoodEntry,
    addMoodEntryForSelection,
    upsertReflectionForSelection,
    getReflectionStreak,
    cleanupDuplicateMoodEntries,
    addReflection,
    updateReflection,

  } = useDailyReflectionStore();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'trades' | 'notes' | 'insights'>('overview');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<GPTInsight[]>([]);
  const [hasGeneratedInsights, setHasGeneratedInsights] = useState(false);
  
  // State for current streak
  const [currentStreak, setCurrentStreak] = useState(0);
  
  // Refs to track processed items and prevent infinite loops
  const processedTradesRef = useRef<Set<string>>(new Set());
  const processedNotesRef = useRef<Set<string>>(new Set());
  
  // Section collapse states (mood collapsed by default now)
  const [collapsedSections, setCollapsedSections] = useState<{
    mood: boolean;
    notes: boolean;
    focus: boolean;
  }>({ mood: true, notes: false, focus: false });
  
  // Mood AI summary state
  const [moodSummary, setMoodSummary] = useState<string>('');
  
  // Legacy reflection state removed - now handled by ReflectionHub
  
  // Quick note states
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickNoteMood, setQuickNoteMood] = useState<string>('');
  const [isAddingQuickNote, setIsAddingQuickNote] = useState(false);
  const [pinnedNotes, setPinnedNotes] = useState<Set<string>>(new Set());
  
  // Focus suggestion states
  const [focusSuggestions, setFocusSuggestions] = useState<string[]>([]);
  const [previousDayFocus, setPreviousDayFocus] = useState<string>('');
  const [isGeneratingFocus, setIsGeneratingFocus] = useState(false);
  const [showFocusAlternatives, setShowFocusAlternatives] = useState(false);
  const [focusSuggestionMap, setFocusSuggestionMap] = useState<Record<string, Partial<Quest>>>({});
  const [isPinningQuest, setIsPinningQuest] = useState(false);
  const [isQuestPinned, setIsQuestPinned] = useState(false);
  
  // Legacy reflection states removed - now handled by ReflectionHub

  // Get day's trades (handle null day case)
  const dayTrades = useMemo(() => {
    if (!day) return [];
    
    const dayStart = new Date(day.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day.date);
    dayEnd.setHours(23, 59, 59, 999);
    
    return trades.filter(trade => {
      const tradeDate = new Date(trade.entryTime);
      return tradeDate >= dayStart && tradeDate <= dayEnd;
    }).filter(trade => !selectedAccountId || trade.accountId === selectedAccountId);
  }, [trades, day?.date, selectedAccountId]);

  // Get day's notes (handle null day case)
  const dayNotes = useMemo(() => {
    if (!day) return [];
    
    const notes = getNotesForDate(day.date)
      .filter(note => !selectedAccountId || note.accountId === selectedAccountId);
    
    return notes;
  }, [day?.date, getNotesForDate, selectedAccountId]);

  // Get daily reflection data
  const dateString = day?.date ? day.date.toISOString().split('T')[0] : '';
  const dailyReflection = useMemo(() => {
    if (!day || !selectedAccountId) return null;
    return reflections.find((reflection) => 
      reflection.date === dateString && reflection.accountId === selectedAccountId
    );
  }, [day, dateString, selectedAccountId, reflections]);

  // Get mood timeline
  const moodTimeline = useMemo(() => {
    if (!day) return [];
    // Clean up duplicates first
    cleanupDuplicateMoodEntries(dateString);
    // Then get the cleaned timeline
    return getMoodTimeline(dateString);
  }, [day, dateString, reflections, dayTrades, dayNotes]); // Removed function references from dependencies

  // Initialize current streak when modal opens
  useEffect(() => {
    if (isOpen && selectedAccountId) {
      setCurrentStreak(getReflectionStreak(selectedAccountId));
    }
  }, [isOpen, selectedAccountId, getReflectionStreak]);
  
  // Generate mood summary when modal opens
  useEffect(() => {
    if (isOpen && moodTimeline.length > 0 && !moodSummary) {
      generateMoodSummary();
    }
    
    // Load pinned notes from localStorage
    if (isOpen && selectedAccountId) {
      const pinnedKey = `pinnedNotes_${selectedAccountId}`;
      const savedPinned = localStorage.getItem(pinnedKey);
      if (savedPinned) {
        setPinnedNotes(new Set(JSON.parse(savedPinned)));
      }
      
      // Generate focus suggestions
      generateFocusSuggestions();
      loadPreviousDayFocus();
    }
  }, [isOpen, moodTimeline.length, selectedAccountId]);

  // Template options for quick reflection start
  // Helper function for safe date formatting
  const getSafeDateDisplay = (fallback: string = 'today'): string => {
    try {
      return day?.date && !isNaN(day.date.getTime()) ? formatDate(day.date) : fallback;
    } catch {
      return fallback;
    }
  };

  // Legacy template types removed - now handled by ReflectionHub




  // Legacy template initialization removed - now handled by ReflectionHub

  // Legacy debounced save functions removed - now handled by ReflectionHub

  // Legacy useEffect hooks removed - now handled by ReflectionHub

  // Track mood changes from trades
  useEffect(() => {
    if (!day || !selectedAccountId) return;
    
    dayTrades.forEach(trade => {
      if (trade.mood && !processedTradesRef.current.has(trade.id)) {
        const trigger = trade.result === 'win' ? 'trade-win' : 
                       trade.result === 'loss' ? 'trade-loss' : 'trade-breakeven';
        addMoodEntryForSelection(dateString, trade.mood, trigger, trade.id, new Date(trade.entryTime), selectedAccountId!);
        processedTradesRef.current.add(trade.id);
      }
    });
  }, [day, dayTrades, selectedAccountId, dateString]); // Removed addMoodEntry from dependencies

  // Track mood changes from quick notes  
  useEffect(() => {
    if (!day || !selectedAccountId) return;
    
    dayNotes.forEach(note => {
      if (note.mood && !processedNotesRef.current.has(note.id)) {
        addMoodEntryForSelection(dateString, note.mood, 'note', note.id, new Date(note.createdAt), selectedAccountId!);
        processedNotesRef.current.add(note.id);
      }
    });
  }, [day, dayNotes, selectedAccountId, dateString]); // Removed addMoodEntry from dependencies

  // Clean up processed refs when day/account changes
  useEffect(() => {
    processedTradesRef.current.clear();
    processedNotesRef.current.clear();
  }, [day?.date, selectedAccountId]);

  // Mock GPT-5 insights (replace with actual API call)
  const generateInsights = async (): Promise<GPTInsight[]> => {
    setIsGeneratingInsights(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const insights: GPTInsight[] = [];
    
    // Analyze trading patterns
    if (dayTrades.length > 0) {
      const winRate = dayTrades.filter(t => t.result === 'win').length / dayTrades.length;
      const avgRR = dayTrades.reduce((sum, t) => sum + t.riskRewardRatio, 0) / dayTrades.length;
      
      if (winRate >= 0.8) {
        insights.push({
          type: 'achievement',
          title: 'Excellent Performance',
          description: `Outstanding ${Math.round(winRate * 100)}% win rate today. Your discipline and patience paid off.`,
          confidence: 95
        });
      }
      
      if (avgRR < 1.5 && winRate < 0.6) {
        insights.push({
          type: 'warning',
          title: 'Risk Management Alert',
          description: `Consider improving your risk-reward ratio. Current avg: ${avgRR.toFixed(1)}:1`,
          confidence: 85
        });
      }
      
      if (dayTrades.length > 5) {
        insights.push({
          type: 'pattern',
          title: 'High Activity Day',
          description: `${dayTrades.length} trades executed. Monitor for overtrading patterns.`,
          confidence: 78
        });
      }
      
      // Analyze symbols
      const symbolCounts = dayTrades.reduce((acc, trade) => {
        acc[trade.symbol] = (acc[trade.symbol] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostTradedSymbol = Object.entries(symbolCounts).sort((a, b) => b[1] - a[1])[0];
      if (mostTradedSymbol && mostTradedSymbol[1] > 1) {
        insights.push({
          type: 'pattern',
          title: 'Symbol Focus',
          description: `${mostTradedSymbol[0]} was your most traded symbol (${mostTradedSymbol[1]} trades). Consider diversification.`,
          confidence: 72
        });
      }
    }
    
    // Analyze notes
    if (dayNotes.length > 0) {
      const emotions = dayNotes.filter(note => note.mood).map(note => note.mood);
      if (emotions.length > 0) {
        insights.push({
          type: 'suggestion',
          title: 'Emotional Awareness',
          description: `Your journaling shows good emotional tracking. Keep reflecting on decision-making patterns.`,
          confidence: 80
        });
      }
    }
    
    setIsGeneratingInsights(false);
    return insights;
  };

  const handleGenerateInsights = async () => {
    if (!hasGeneratedInsights) {
      const newInsights = await generateInsights();
      setInsights(newInsights);
      setHasGeneratedInsights(true);
    }
  };

  // Note: Daily reflection handlers are now handled by ReflectionInput component

  // Note: handleAddQuickNote replaced with inline quick note functionality

  const handleAddKeyFocusAsQuest = async () => {
    if (!dailyReflection?.keyFocus) return;
    
    setIsPinningQuest(true);
    try {
      const quest = await addQuest({
        title: `Daily Focus: ${new Date().toLocaleDateString()}`,
        description: dailyReflection.keyFocus,
        type: 'daily',
        status: 'pending',
        progress: 0,
        maxProgress: 1,
        xpReward: 25,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        accountId: selectedAccountId || 'all',
      });

      // Pin the quest to make it appear in the pinned section
      pinQuest(quest.id);
      setIsQuestPinned(true);

      addActivity({
        type: 'quest',
        title: 'Added Daily Focus Quest',
        description: `Pinned: ${dailyReflection.keyFocus}`,
        xpEarned: 5,
        relatedId: dailyReflection.id,
        accountId: selectedAccountId || 'all',
      });
    } finally {
      setIsPinningQuest(false);
    }
  };
  
  // Generate AI mood summary
  const generateMoodSummary = async () => {
    if (moodTimeline.length === 0) return;
    
    try {
      // Create a simple narrative summary
      let summary = '';
      if (moodTimeline.length === 1) {
        summary = `Mood remained ${moodTimeline[0].mood} throughout the day.`;
      } else {
        const startMood = moodTimeline[0].mood;
        const endMood = moodTimeline[moodTimeline.length - 1].mood;
        const hasVariation = moodTimeline.some(entry => entry.mood !== startMood);
        
        if (hasVariation) {
          summary = `Mood started ${startMood}`;
          
          // Find significant changes
          const changes: string[] = [];
          for (let i = 1; i < moodTimeline.length; i++) {
            const prev = moodTimeline[i-1];
            const curr = moodTimeline[i];
            if (prev.mood !== curr.mood) {
              const direction = getMoodDirection(prev.mood as string, curr.mood as string);
              changes.push(`${direction} to ${curr.mood}${curr.trigger ? ` after ${formatTrigger(curr.trigger)}` : ''}`);
            }
          }
          
          if (changes.length > 0) {
            summary += `, ${changes.slice(0, 2).join(', ')}`;
          }
          
          if (endMood !== startMood) {
            summary += `, ending ${endMood}.`;
          } else {
            summary += '.'
          }
        } else {
          summary = `Mood remained consistently ${startMood} throughout the trading session.`;
        }
      }
      
      setMoodSummary(summary);
    } catch (error) {
      console.error('Failed to generate mood summary:', error);
      setMoodSummary('Multiple mood entries recorded throughout the day.');
    }
  };
  
  const getMoodDirection = (fromMood: string, toMood: string): string => {
    const moodValues = { terrible: 1, poor: 2, neutral: 3, good: 4, excellent: 5 };
    const from = moodValues[fromMood as keyof typeof moodValues] || 3;
    const to = moodValues[toMood as keyof typeof moodValues] || 3;
    
    if (to > from) return 'improved';
    if (to < from) return 'declined';
    return 'shifted';
  };
  
  const formatTrigger = (trigger?: string): string => {
    if (!trigger) return '';
    const triggerMap: Record<string, string> = {
      'trade-win': 'a winning trade',
      'trade-loss': 'a losing trade', 
      'trade-breakeven': 'a breakeven trade',
      'note': 'journaling',
      'reflection': 'daily reflection'
    };
    return triggerMap[trigger] || trigger;
  };
  
  // Toggle section collapse
  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Legacy word count calculator removed - now handled by ReflectionHub



  // Legacy reflection functions removed - now handled by ReflectionHub

  // Add quick note
  const addQuickNote = async () => {
    if (!quickNoteText.trim() || !selectedAccountId) return;
    
    setIsAddingQuickNote(true);
    try {
          const newNote = {
      content: quickNoteText.trim(),
      tags: [],
      mood: quickNoteMood as any,
      accountId: selectedAccountId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const savedNote = await useQuickNoteStore.getState().addNote(newNote);
      const noteId = typeof savedNote === 'object' ? savedNote.id : savedNote;
      
      addActivity({
        type: 'note',
        title: 'Quick Note Added',
        description: quickNoteText.trim().slice(0, 50) + (quickNoteText.length > 50 ? '...' : ''),
        xpEarned: 5,
        relatedId: noteId,
        accountId: selectedAccountId,
      });
      
      setQuickNoteText('');
      setQuickNoteMood('');
    } catch (error) {
      console.error('Failed to add quick note:', error);
    } finally {
      setIsAddingQuickNote(false);
    }
  };

  // Toggle note pinning
  const toggleNotePin = (noteId: string) => {
    const newPinned = new Set(pinnedNotes);
    if (newPinned.has(noteId)) {
      newPinned.delete(noteId);
    } else {
      newPinned.add(noteId);
    }
    setPinnedNotes(newPinned);
    
    // Save to localStorage
    if (selectedAccountId) {
      const pinnedKey = `pinnedNotes_${selectedAccountId}`;
      localStorage.setItem(pinnedKey, JSON.stringify([...newPinned]));
    }
  };

  // Generate AI-powered focus suggestions
  const generateFocusSuggestions = async () => {
    if (!selectedAccountId) return;
    
    setIsGeneratingFocus(true);
    try {
      // Get recent trading data
      const accountTrades = trades.filter(t => t.accountId === selectedAccountId).slice(-10);
      const { notes } = useQuickNoteStore.getState();
      const accountNotes = notes.filter(n => n.accountId === selectedAccountId).slice(-5);
      
      // Get current mood
      const dateString = day?.date || new Date().toISOString().split('T')[0];
      const todayMood = getMoodTimeline(typeof dateString === 'string' ? dateString : dateString.toISOString().split('T')[0]);
      const currentMood = todayMood.length > 0 ? todayMood[todayMood.length - 1].mood : 'neutral';
      
      // Get previous focus areas
      const previousFocusAreas = reflections
        .filter(r => r.accountId === selectedAccountId && r.keyFocus)
        .slice(-5)
        .map(r => r.keyFocus);
      
      // Get completed quests
      const { quests } = useQuestStore.getState();
      const completedQuests = quests
        .filter(q => q.status === 'completed' && q.accountId === selectedAccountId)
        .map(q => q.title);
      
      // Calculate performance metrics
      const winRate = accountTrades.length > 0 
        ? (accountTrades.filter(t => t.result === 'win').length / accountTrades.length) * 100 
        : 0;
      const totalPnL = accountTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const avgRiskAmount = accountTrades.length > 0
        ? accountTrades.reduce((sum, t) => sum + t.riskAmount, 0) / accountTrades.length
        : 100;
      
      // Try GPT-5 quest suggestions first (falls back internally if no key)
      try {
        const aiQuests = await generateQuestSuggestions({
          recentTrades: accountTrades,
          recentNotes: accountNotes,
          currentMood: currentMood as MoodType,
          completedQuests,
          winRate,
          totalPnL,
          avgRiskAmount,
        });
        const titles = aiQuests.map(q => q.title).filter(Boolean);
        const unique = Array.from(new Set(titles));
        if (unique.length > 0) {
          setFocusSuggestions(unique.slice(0, 5));
          const map: Record<string, Partial<Quest>> = {};
          aiQuests.forEach(q => { map[q.title] = q; });
          setFocusSuggestionMap(map);
          return;
        }
      } catch (_) {
        // ignore and use fallback
      }

      // Fallback: mood-based local focus
      const fallbackQuests = await generateDailyFocus(currentMood as MoodType);
      const fallback = fallbackQuests.map(q => q.title);
      setFocusSuggestions(Array.from(new Set(fallback)).slice(0, 3));
      const map: Record<string, Partial<Quest>> = {};
      fallbackQuests.forEach(q => { map[q.title] = q; });
      setFocusSuggestionMap(map);
      
    } catch (error) {
      console.error('Failed to generate AI focus suggestions:', error);
      // Fallback to static suggestions
      const fallbackSuggestions = [
        "Focus on risk management and position sizing",
        "Wait for high-quality setups only",
        "Maintain emotional discipline throughout the session"
      ];
      setFocusSuggestions(fallbackSuggestions);
    } finally {
      setIsGeneratingFocus(false);
    }
  };

  // Load previous day's focus
  const loadPreviousDayFocus = () => {
    if (!selectedAccountId || !day) return;
    
    const yesterday = new Date(day.date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];
    
    const previousReflection = reflections.find(r => 
      r.date === yesterdayString && 
      r.accountId === selectedAccountId &&
      r.keyFocus &&
      !r.isComplete
    );
    
    if (previousReflection) {
      setPreviousDayFocus(previousReflection.keyFocus);
    }
  };

  // Set focus from suggestion
  const setFocusFromSuggestion = (focusText: string) => {
    if (!selectedAccountId) return;
    
    upsertReflectionForSelection(dateString, {
      keyFocus: focusText,
      isComplete: dailyReflection?.isComplete ?? false,
    }, selectedAccountId);
    
    addActivity({
      type: 'reflection',
      title: 'Focus Set',
      description: `Set tomorrow's focus: ${focusText}`,
      xpEarned: 10,
      relatedId: dailyReflection?.id,
      accountId: selectedAccountId,
    });
  };

  // More legacy reflection functions removed - now handled by ReflectionHub



  // Legacy AI generation function removed - now handled by ReflectionHub
  /* const handleGenerateReflection = async () => {
    if (!selectedAccountId) return;
    
    setIsGeneratingInsights(true);
    try {
      // Get day's data
      const [year, month, dayOfMonth] = dateString.split('-').map(Number);
      const dayStart = new Date(year, month - 1, dayOfMonth, 0, 0, 0, 0);
      const dayEnd = new Date(year, month - 1, dayOfMonth, 23, 59, 59, 999);
      
      const dayTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.entryTime);
        return tradeDate >= dayStart && tradeDate <= dayEnd &&
               (!selectedAccountId || trade.accountId === selectedAccountId);
      });
      
      const dayNotes = getNotesForDate(new Date(dateString))
        .filter(note => !selectedAccountId || note.accountId === selectedAccountId);

      const totalPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winningTrades = dayTrades.filter(t => (t.pnl || 0) > 0).length;
      const winRate = dayTrades.length > 0 ? (winningTrades / dayTrades.length) * 100 : 0;

      const dailyData = {
        trades: dayTrades,
        notes: dayNotes,
        stats: {
          totalPnL,
          winRate,
          totalXP: dayTrades.length * 10 + dayNotes.length * 5,
          moodTrend: 'neutral',
          tradeCount: dayTrades.length,
        }
      };
      
      const aiSummary = await generateDailySummary(dailyData);
      const keyFocus = extractKeyFocus(aiSummary);
      
      // Save existing section contents first (preserve user's work)
      const hasExistingContent = Object.values(sectionContents).some(content => content.trim());
      if (hasExistingContent) {
        await saveCurrentContent(); // Save user's template content
      }
      
      // Update reflection - only update AI summary, preserve existing reflection content
      if (dailyReflection) {
        updateReflection(dailyReflection.id, { 
          aiSummary,
          keyFocus,
          // Don't overwrite reflection if user has template content
          ...(hasExistingContent ? {} : { reflection: aiSummary })
        });
      } else {
        // For new reflections, generate structured template if using templates
        const currentReflectionContent = hasExistingContent 
          ? reflectionSections
              .filter(s => s.enabled)
              .sort((a, b) => a.order - b.order)
              .map(s => `## ${s.label}:\n${sectionContents[s.id] || ''}\n`)
              .join('\n')
          : aiSummary;
          
        const newReflection = addReflection({
          date: dateString,
          reflection: currentReflectionContent,
          keyFocus,
          isComplete: false,
          moodTimeline: [],
          streakCount: getReflectionStreak(selectedAccountId),
          xpEarned: 0,
          reflectionTags: [],
          aiSummary,
          accountId: selectedAccountId,
        });
        
        addActivity({
          type: 'reflection',
          title: 'AI Summary Generated',
          description: `Generated AI-powered daily summary for ${getSafeDateDisplay()}`,
          xpEarned: 20,
          relatedId: newReflection.id,
          accountId: selectedAccountId,
        });
      }
      
      // Only update reflection text if no existing template content
      if (!hasExistingContent) {
        setReflectionText(aiSummary);
        setReflectionWordCount(calculateWordCount(aiSummary));
      } else {
        // Keep existing template content, just update AI summary
        setEditableSummary(aiSummary);
      }
      
    } catch (error) {
      console.error('Failed to generate reflection:', error);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  // Manual save function for completion (combines sections and saves immediately)
  const saveCurrentContent = async () => {
    if (!selectedAccountId || !dateString) return;
    
    const updatedSections = reflectionSections
      .filter(s => s.enabled)
      .sort((a, b) => a.order - b.order)
      .map(s => `## ${s.label}:\n${sectionContents[s.id] || ''}\n`);
    
    const updatedContent = updatedSections.join('\n');
    setReflectionText(updatedContent);
    
    if (dailyReflection) {
      updateReflection(dailyReflection.id, { reflection: updatedContent });
    } else if (updatedContent.trim()) {
      const newReflection = addReflection({
        date: dateString,
        reflection: updatedContent,
        keyFocus: '',
        isComplete: false,
        moodTimeline: [],
        streakCount: getReflectionStreak(selectedAccountId),
        xpEarned: 0,
        reflectionTags: [],
        accountId: selectedAccountId,
      });
      
      addActivity({
        type: 'reflection',
        title: 'Daily Reflection Started',
        description: `Began writing reflection for ${getSafeDateDisplay()}`,
        xpEarned: 10,
        relatedId: newReflection.id,
        accountId: selectedAccountId,
      });
    }
  }; */

  // Mood emojis mapping
  const moodEmojis: Record<string, string> = {
    excellent: '🤩',
    good: '😊',
    neutral: '😐',
    poor: '😕',
    terrible: '😢',
  };

  // Mood values for sentiment analysis
  const moodValues: Record<string, number> = {
    terrible: 1,
    poor: 2,
    neutral: 3,
    good: 4,
    excellent: 5,
  };

  // Create sparkline data for mood trend
  const moodSparklineData = useMemo(() => {
    if (moodTimeline.length < 2) return [];
    return moodTimeline.map(entry => moodValues[entry.mood as keyof typeof moodValues] || 3);
  }, [moodTimeline]);

  // Mood analysis for collapsed state
  const moodAnalysis = useMemo(() => {
    if (moodTimeline.length === 0) return null;

    const firstMood = moodTimeline[0];
    const lastMood = moodTimeline[moodTimeline.length - 1];
    const firstValue = moodValues[firstMood.mood] || 3;
    const lastValue = moodValues[lastMood.mood] || 3;
    
    // Calculate trend
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    let trendIcon = <Minus className="w-3 h-3 text-gray-500" />;
    let trendText = 'stable';
    
    if (lastValue > firstValue + 0.5) {
      trend = 'improving';
      trendIcon = <ArrowUp className="w-3 h-3 text-green-500" />;
      trendText = 'improving';
    } else if (lastValue < firstValue - 0.5) {
      trend = 'declining';
      trendIcon = <ArrowDown className="w-3 h-3 text-red-500" />;
      trendText = 'declining';
    }

    // Get mood sequence (max 5 visible)
    const visibleMoods = moodTimeline.slice(0, 5);
    const extraCount = Math.max(0, moodTimeline.length - 5);

    // Calculate volatility
    let volatility = 'low';
    if (moodTimeline.length > 1) {
      const changes = moodTimeline.slice(1).map((entry, i) => 
        Math.abs(moodValues[entry.mood] - moodValues[moodTimeline[i].mood])
      );
      const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
      if (avgChange > 1.5) volatility = 'high';
      else if (avgChange > 0.8) volatility = 'medium';
    }

    return {
      firstMood: firstMood.mood,
      lastMood: lastMood.mood,
      firstEmoji: moodEmojis[firstMood.mood] || '😐',
      lastEmoji: moodEmojis[lastMood.mood] || '😐',
      trend,
      trendIcon,
      trendText,
      visibleMoods,
      extraCount,
      volatility,
      totalEntries: moodTimeline.length
    };
  }, [moodTimeline]);

  const getTradeIcon = (result: TradeResult) => {
    switch (result) {
      case 'win': return <Trophy className="w-4 h-4 text-green-500" />;
      case 'loss': return <X className="w-4 h-4 text-red-500" />;
      case 'breakeven': return <Target className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getInsightIcon = (type: GPTInsight['type']) => {
    switch (type) {
      case 'pattern': return <BarChart3 className="w-4 h-4 text-blue-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'achievement': return <Trophy className="w-4 h-4 text-green-500" />;
      case 'suggestion': return <MessageSquare className="w-4 h-4 text-purple-500" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Calendar },
    { id: 'trades', label: 'Trades', icon: TrendingUp, count: dayTrades.length },
    { id: 'notes', label: 'Notes', icon: FileText, count: dayNotes.length },
    { id: 'insights', label: 'AI Insights', icon: Brain, badge: insights.length > 0 },
  ];

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };

  // Handle null day case after all hooks
  if (!day) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-card-foreground">
                    {getSafeDateDisplay('Daily Journal')}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Trading Journal • Day Analysis
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-6">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                  {tab.badge && (
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                  )}
                </motion.button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Enhanced Header with Streak */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">Daily Journal</h3>
                        <p className="text-sm text-muted-foreground">
                          {getSafeDateDisplay('Today')} • {dayTrades.length} trades, {dayNotes.length} notes
                        </p>
                      </div>
                    </div>
                    
                    {/* Streak Badge */}
                    <AnimatePresence>
                      {currentStreak > 0 && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30"
                        >
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-bold text-orange-500">
                            {currentStreak} day streak!
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <motion.div 
                      className="bg-muted/30 rounded-xl p-3 md:p-4 text-center hover:bg-muted/50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="text-lg md:text-xl font-bold text-foreground">
                        {formatCurrency(day.pnl)}
                      </div>
                      <div className="text-xs text-muted-foreground">P&L</div>
                    </motion.div>
                    <motion.div 
                      className="bg-muted/30 rounded-xl p-3 md:p-4 text-center hover:bg-muted/50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="text-lg md:text-xl font-bold text-foreground">
                        {day.tradesCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Trades</div>
                    </motion.div>
                    <motion.div 
                      className="bg-muted/30 rounded-xl p-3 md:p-4 text-center hover:bg-muted/50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="text-lg md:text-xl font-bold text-foreground">
                        {day.winRate.toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Win Rate</div>
                    </motion.div>
                    <motion.div 
                      className="bg-muted/30 rounded-xl p-3 md:p-4 text-center hover:bg-muted/50 transition-colors"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="text-lg md:text-xl font-bold text-foreground">
                        {day.avgRR.toFixed(1)}:1
                      </div>
                      <div className="text-xs text-muted-foreground">Avg R:R</div>
                    </motion.div>
                  </div>

                  {/* HERO SECTION: Daily Reflection - Template 2.0 */}
                  <ReflectionHub 
                        date={dateString}
                    className="mb-8"
                      />

                  {/* Secondary Sections - Adaptive Layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                    {/* Enhanced Mood Timeline */}
                    <motion.div 
                      className="bg-gradient-to-br from-card to-blue-50/5 dark:to-blue-900/5 border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                      whileHover={{ scale: 1.001 }}
                    >
                      {/* Gradient accent bar */}
                      <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500"></div>
                      
                      <div 
                        className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => toggleSection('mood')}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                              <Clock className="w-4 h-4 text-blue-500" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">Mood Timeline</h4>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full text-xs font-medium">
                                  {moodTimeline.length} {moodTimeline.length === 1 ? 'entry' : 'entries'}
                                </span>
                                {moodAnalysis && (
                                  <div className="flex items-center gap-1">
                                    {moodAnalysis.trendIcon}
                                    <span className="text-xs text-muted-foreground capitalize">
                                      {moodAnalysis.trendText}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {collapsedSections.mood ? 'Expand Timeline' : 'Collapse'}
                            </span>
                            {collapsedSections.mood ? 
                              <ChevronDown className="w-4 h-4 text-muted-foreground" /> : 
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            }
                          </div>
                        </div>

                        {/* Enhanced Collapsed State */}
                        {collapsedSections.mood && moodAnalysis && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                          >
                            {/* Mood Progression Bar */}
                            <div className="relative">
                              <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg border border-border/30">
                                {/* Emoji Sequence */}
                                <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-muted">
                                  {moodAnalysis.visibleMoods.map((entry, index) => (
                                    <Tooltip
                                      key={entry.id}
                                      content={`${formatTime(entry.timestamp)}: ${entry.mood}${entry.trigger ? ` (${entry.trigger})` : ''}`}
                                    >
                                      <motion.div
                                        className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-background border border-border/50 hover:scale-110 transition-transform cursor-help"
                                        whileHover={{ scale: 1.1 }}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                      >
                                        <span className="text-lg">
                                          {moodEmojis[entry.mood] || '😐'}
                                        </span>
                                        {index < moodAnalysis.visibleMoods.length - 1 && (
                                          <div className="absolute -right-1 top-1/2 w-2 h-0.5 bg-gradient-to-r from-blue-500/50 to-purple-500/50 -translate-y-1/2"></div>
                                        )}
                                      </motion.div>
                                    </Tooltip>
                                  ))}
                                  
                                  {/* Extra count indicator */}
                                  {moodAnalysis.extraCount > 0 && (
                                    <motion.div
                                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 border border-border/50 text-xs font-medium text-muted-foreground"
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: 0.5 }}
                                    >
                                      +{moodAnalysis.extraCount}
                                    </motion.div>
                                  )}
                                </div>

                                {/* Sparkline */}
                                {moodSparklineData.length > 1 && (
                                  <div className="flex-shrink-0 ml-auto">
                                    <Sparkline 
                                      data={moodSparklineData} 
                                      width={80} 
                                      height={24} 
                                      className={cn(
                                        'transition-colors',
                                        moodAnalysis.trend === 'improving' && 'text-green-500',
                                        moodAnalysis.trend === 'declining' && 'text-red-500',
                                        moodAnalysis.trend === 'stable' && 'text-blue-500'
                                      )}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Summary Text */}
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Mood journey:</span>
                                <div className="flex items-center gap-1">
                                  <span>{moodAnalysis.firstEmoji}</span>
                                  <span className="text-muted-foreground">→</span>
                                  <span>{moodAnalysis.lastEmoji}</span>
                                </div>
                                <span className="text-muted-foreground capitalize">
                                  ({moodAnalysis.firstMood} → {moodAnalysis.lastMood})
                                </span>
                              </div>
                              
                              {/* Enhanced Volatility indicator with tooltip */}
                              <Tooltip content="Volatility measures how much your mood fluctuated throughout the day. High volatility may indicate emotional trading patterns.">
                                <div className="flex items-center gap-1 cursor-help">
                                  <div className={cn(
                                    "w-3 h-3 rounded-full",
                                    moodAnalysis.volatility === 'high' && "bg-red-500",
                                    moodAnalysis.volatility === 'medium' && "bg-yellow-500", 
                                    moodAnalysis.volatility === 'low' && "bg-green-500"
                                  )} />
                                  <span className="text-muted-foreground text-xs">
                                    {moodAnalysis.volatility === 'high' && 'High volatility'}
                                    {moodAnalysis.volatility === 'medium' && 'Medium volatility'}
                                    {moodAnalysis.volatility === 'low' && 'Low volatility'}
                                  </span>
                                  <Info className="w-3 h-3 text-muted-foreground" />
                                </div>
                              </Tooltip>
                            </div>
                          </motion.div>
                        )}

                        {/* Empty state for collapsed */}
                        {collapsedSections.mood && moodTimeline.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                            <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No mood data for this day</p>
                          </div>
                        )}
                      </div>
                      
                      <AnimatePresence>
                        {!collapsedSections.mood && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border"
                          >
                            <div className="p-4">
                              {moodSummary && (
                                <div className="mb-4 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                                  <div className="flex items-start gap-2">
                                    <Brain className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">AI Summary</p>
                                      <p className="text-sm text-foreground">{moodSummary}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {moodTimeline.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground">
                                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">No mood data for this day</p>
                                </div>
                              ) : (
                                <MoodTimeline moodEntries={moodTimeline} compact />
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Enhanced Quick Notes */}
                    <motion.div 
                      className="bg-gradient-to-br from-card to-green-50/5 dark:to-green-900/5 border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                      whileHover={{ scale: 1.001 }}
                    >
                      {/* Gradient accent bar */}
                      <div className="h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
                      
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                              <MessageCircle className="w-4 h-4 text-green-500" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">Quick Notes</h4>
                              <p className="text-xs text-muted-foreground">
                                {dayNotes.length} {dayNotes.length === 1 ? 'note' : 'notes'} today
                              </p>
                            </div>
                          </div>
                          <motion.button
                            onClick={() => toggleSection('notes')}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            whileHover={{ scale: 1.05 }}
                          >
                            {collapsedSections.notes ? 'Expand' : 'Collapse'}
                            {collapsedSections.notes ? 
                              <ChevronDown className="w-4 h-4" /> : 
                              <ChevronUp className="w-4 h-4" />
                            }
                          </motion.button>
                        </div>

                        {/* Inline Quick Add */}
                        <div className="mb-4 p-3 bg-muted/20 rounded-lg border border-border/30">
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              value={quickNoteText}
                              onChange={(e) => setQuickNoteText(e.target.value)}
                              placeholder="Write a quick note..."
                              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  addQuickNote();
                                }
                              }}
                            />
                            
                            {/* Mood Selector */}
                            <div className="flex items-center gap-1">
                              {['😢', '😕', '😐', '😊', '🤩'].map((emoji, index) => {
                                const moods = ['terrible', 'poor', 'neutral', 'good', 'excellent'];
                                const mood = moods[index];
                                return (
                                  <motion.button
                                    key={mood}
                                    onClick={() => setQuickNoteMood(quickNoteMood === mood ? '' : mood)}
                                    className={cn(
                                      "w-6 h-6 rounded-full flex items-center justify-center text-sm transition-all",
                                      quickNoteMood === mood 
                                        ? "bg-primary/20 ring-2 ring-primary/50" 
                                        : "hover:bg-muted/50"
                                    )}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title={mood}
                                  >
                                    {emoji}
                                  </motion.button>
                                );
                              })}
                            </div>
                            
                            {/* Add Button */}
                            <motion.button
                              onClick={addQuickNote}
                              disabled={!quickNoteText.trim() || isAddingQuickNote}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg transition-all text-sm disabled:opacity-50"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              {isAddingQuickNote ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                            </motion.button>
                          </div>
                          {quickNoteMood && (
                            <div className="text-xs text-muted-foreground">
                              Mood: <span className="capitalize">{quickNoteMood}</span>
                            </div>
                          )}
                        </div>
                      
                      <AnimatePresence>
                        {!collapsedSections.notes && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border/30"
                          >
                            <div className="p-4">
                              {dayNotes.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notes for this day</p>
                                  <p className="text-xs mt-1">Use the input above to add your first note</p>
                      </div>
                    ) : (
                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                  {/* Pinned Notes First */}
                                  {dayNotes
                                    .filter(note => pinnedNotes.has(note.id))
                                    .map((note) => (
                          <motion.div
                            key={note.id}
                                        className="p-3 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-lg border border-yellow-500/20 hover:bg-yellow-500/10 transition-colors"
                            whileHover={{ scale: 1.01 }}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                      >
                                        <div className="flex items-start gap-3">
                                          {/* Pinned indicator */}
                                          <motion.button
                                            onClick={() => toggleNotePin(note.id)}
                                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-yellow-500 hover:text-yellow-600 transition-colors"
                                            whileHover={{ scale: 1.1, rotate: 12 }}
                                            whileTap={{ scale: 0.9 }}
                                            title="Unpin note"
                                          >
                                            <Star className="w-4 h-4 fill-current" />
                                          </motion.button>
                                          
                                          {note.mood && (
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-lg">
                                              {note.mood === 'excellent' ? '🤩' : 
                                               note.mood === 'good' ? '😊' :
                                               note.mood === 'neutral' ? '😐' :
                                               note.mood === 'poor' ? '😕' : '😢'}
                                            </div>
                                          )}
                                          
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium">
                                                Pinned
                                    </span>
                                              <span className="text-xs text-muted-foreground font-medium">
                                                {formatTime(note.createdAt)}
                                              </span>
                                              {note.mood && (
                                                <span className={cn('text-xs font-medium capitalize', getMoodColor(note.mood))}>
                                                  {note.mood}
                                    </span>
                                  )}
                                </div>
                                            <p className="text-sm text-foreground leading-relaxed mb-2">{note.content}</p>
                                            {note.tags && note.tags.length > 0 && (
                                              <TagList 
                                                tags={note.tags}
                                                size="sm"
                                                maxTags={4}
                                              />
                                            )}
                                          </div>
                                        </div>
                                      </motion.div>
                                    ))}
                                  
                                  {/* Regular Notes */}
                                  {dayNotes
                                    .filter(note => !pinnedNotes.has(note.id))
                                    .map((note) => (
                                      <motion.div
                                        key={note.id}
                                        className="p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors group"
                                        whileHover={{ scale: 1.01 }}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                      >
                                        <div className="flex items-start gap-3">
                                          {/* Pin button (shows on hover) */}
                                          <motion.button
                                            onClick={() => toggleNotePin(note.id)}
                                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-yellow-500 transition-colors opacity-0 group-hover:opacity-100"
                                            whileHover={{ scale: 1.1, rotate: 12 }}
                                            whileTap={{ scale: 0.9 }}
                                            title="Pin note"
                                          >
                                            <Star className="w-4 h-4" />
                                          </motion.button>
                                          
                                          {note.mood && (
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-lg">
                                              {note.mood === 'excellent' ? '🤩' : 
                                               note.mood === 'good' ? '😊' :
                                               note.mood === 'neutral' ? '😐' :
                                               note.mood === 'poor' ? '😕' : '😢'}
                                            </div>
                                          )}
                                          
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                              <span className="text-xs text-muted-foreground font-medium">
                                  {formatTime(note.createdAt)}
                                </span>
                                {note.mood && (
                                                <span className={cn('text-xs font-medium capitalize', getMoodColor(note.mood))}>
                                    {note.mood}
                                  </span>
                                              )}
                                            </div>
                                            <p className="text-sm text-foreground leading-relaxed mb-2">{note.content}</p>
                                            {note.tags && note.tags.length > 0 && (
                                              <TagList 
                                                tags={note.tags}
                                                size="sm"
                                                maxTags={4}
                                              />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                                  
                                  {dayNotes.length > 5 && (
                          <button
                            onClick={() => setActiveTab('notes')}
                                      className="w-full text-sm text-green-500 hover:text-green-600 transition-colors py-2 text-center font-medium"
                          >
                            View all {dayNotes.length} notes →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      </div>
                    </motion.div>

                    {/* Enhanced Key Focus for Tomorrow */}
                    <motion.div
                      className="bg-gradient-to-br from-card to-purple-50/5 dark:to-purple-900/5 border border-border rounded-xl overflow-hidden lg:col-span-2 hover:shadow-lg transition-all duration-300"
                      whileHover={{ scale: 1.001 }}
                    >
                      {/* Gradient accent bar */}
                      <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500"></div>
                      
                      <div className="p-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                              <Target className="w-4 h-4 text-purple-500" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">Key Focus for Tomorrow</h4>
                              <p className="text-xs text-muted-foreground">
                                {dailyReflection?.keyFocus ? 'Focus set' : 'Set your daily trading focus'}
                              </p>
                            </div>
                        </div>
                        <motion.button
                            onClick={() => toggleSection('focus')}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            whileHover={{ scale: 1.05 }}
                          >
                            {collapsedSections.focus ? 'Expand' : 'Collapse'}
                            {collapsedSections.focus ? 
                              <ChevronDown className="w-4 h-4" /> : 
                              <ChevronUp className="w-4 h-4" />
                            }
                          </motion.button>
                        </div>
                      
                                            <AnimatePresence>
                        {!collapsedSections.focus && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border/30"
                          >
                            <div className="p-4 space-y-4">
                              {/* Previous day carry-over */}
                              {previousDayFocus && !dailyReflection?.keyFocus && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20"
                                >
                                  <div className="flex items-start gap-3">
                                    <RotateCcw className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                                        Continue from yesterday?
                                      </p>
                                      <p className="text-sm text-muted-foreground mb-3">
                                        "{previousDayFocus}"
                                      </p>
                                      <motion.button
                                        onClick={() => setFocusFromSuggestion(previousDayFocus)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg transition-all text-sm"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                                        <RotateCcw className="w-3 h-3" />
                                        Reuse Focus
                        </motion.button>
                      </div>
                                  </div>
                    </motion.div>
                  )}

                              {dailyReflection?.keyFocus ? (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20"
                                >
                                  <div className="flex items-start gap-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                      🎯
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-semibold text-foreground mb-1">Tomorrow's Quest</h5>
                                      <p className="text-sm text-muted-foreground leading-relaxed">
                                        {typeof dailyReflection.keyFocus === 'string' 
                                          ? dailyReflection.keyFocus 
                                          : (dailyReflection.keyFocus as any)?.title || '[untitled]'}
                                      </p>
                                    </div>
                                  </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <motion.button
                                      onClick={handleAddKeyFocusAsQuest}
                                      disabled={isPinningQuest || isQuestPinned}
                                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg transition-all hover:shadow-lg font-medium disabled:opacity-60"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <Pin className="w-4 h-4" />
                                      {isQuestPinned ? 'Pinned' : (isPinningQuest ? 'Pinning…' : 'Pin as Quest')}
                                      <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">+25 XP</span>
                                    </motion.button>
                                    <motion.button
                                      onClick={async () => {
                                        setShowFocusAlternatives(true);
                                        setIsGeneratingFocus(true);
                                        await generateFocusSuggestions();
                                        setCollapsedSections(prev => ({ ...prev, focus: false }));
                                      }}
                                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-all font-medium"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                    >
                                      <RotateCcw className={cn("w-4 h-4", isGeneratingFocus && "animate-spin")} />
                                      {isGeneratingFocus ? 'Regenerating…' : 'Change Focus'}
                                    </motion.button>
                                  </div>
                                  {showFocusAlternatives && (
                                    <div className="mt-4 space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Zap className="w-4 h-4 text-purple-500" />
                                          <span className="text-sm font-medium text-foreground">Alternative Focus Suggestions</span>
                                        </div>
                                        <motion.button
                                          onClick={() => setShowFocusAlternatives(false)}
                                          className="text-xs text-muted-foreground hover:text-foreground"
                                          whileHover={{ scale: 1.05 }}
                                        >
                                          Hide
                                        </motion.button>
                                      </div>
                                      {isGeneratingFocus ? (
                                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                                          <RotateCcw className="w-3 h-3 animate-spin" /> Regenerating...
                                        </div>
                                      ) : (
                                        <div className="grid gap-2">
                                          {focusSuggestions.map((suggestion, index) => (
                                            <motion.button
                                              key={`alt-${suggestion}`}
                                              onClick={() => { setFocusFromSuggestion(suggestion); setShowFocusAlternatives(false); }}
                                              className="p-3 text-left bg-muted/30 hover:bg-purple-500/10 border border-border/50 hover:border-purple-500/30 rounded-lg transition-all group"
                                              whileHover={{ scale: 1.02 }}
                                              whileTap={{ scale: 0.98 }}
                                              initial={{ opacity: 0, x: -20 }}
                                              animate={{ opacity: 1, x: 0 }}
                                              transition={{ delay: index * 0.05 }}
                                            >
                                              <div className="flex items-center justify-between">
                                                <div>
                                                  <div className="text-sm text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 font-medium">
                                                    {suggestion}
                                                  </div>
                                                  {focusSuggestionMap[suggestion]?.description && (
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                      {focusSuggestionMap[suggestion]?.description as string}
                                                    </div>
                                                  )}
                                                  {focusSuggestionMap[suggestion]?.maxProgress !== undefined && (
                                                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                                      <span className="px-2 py-0.5 bg-muted/40 rounded-full">Steps: {focusSuggestionMap[suggestion]?.maxProgress}</span>
                                                      {typeof focusSuggestionMap[suggestion]?.xpReward === 'number' && (
                                                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded-full">{focusSuggestionMap[suggestion]?.xpReward} XP</span>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <Check className="w-4 h-4 text-purple-500" />
                                                </div>
                                              </div>
                                            </motion.button>
                                          ))}
                                          {focusSuggestions.length === 0 && (
                                            <div className="text-xs text-muted-foreground">No alternative suggestions found.</div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </motion.div>
                              ) : (
                  <div className="space-y-4">
                                  {/* AI Suggested Focus Prompts */}
                                  {focusSuggestions.length > 0 && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="space-y-3"
                                    >
                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Zap className="w-4 h-4 text-purple-500" />
                                          <span className="text-sm font-medium text-foreground">AI Suggested Focus Areas</span>
                                        </div>
                                        <motion.button
                                          onClick={generateFocusSuggestions}
                                          disabled={isGeneratingFocus}
                                          className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 rounded-md transition-all disabled:opacity-50"
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                        >
                                          <RotateCcw className={cn("w-3 h-3", isGeneratingFocus && "animate-spin")} />
                                          {isGeneratingFocus ? 'Generating...' : 'Regenerate'}
                                        </motion.button>
                    </div>
                                      <div className="grid gap-2">
                                        {focusSuggestions.map((suggestion, index) => (
                                          <motion.button
                                            key={suggestion}
                                            onClick={() => setFocusFromSuggestion(suggestion)}
                                            className="p-3 text-left bg-muted/30 hover:bg-purple-500/10 border border-border/50 hover:border-purple-500/30 rounded-lg transition-all group"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="text-sm text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400">
                                                {suggestion}
                                              </span>
                                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Check className="w-4 h-4 text-purple-500" />
                                              </div>
                                            </div>
                                          </motion.button>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}

                                  {/* Loading state */}
                                  {isGeneratingFocus && (
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      className="text-center py-6 text-muted-foreground"
                                    >
                                      <div className="flex items-center justify-center gap-2">
                                        <RotateCcw className="w-4 h-4 animate-spin" />
                                        <span className="text-sm">Generating personalized focus areas...</span>
                                      </div>
                                    </motion.div>
                                  )}

                                  {/* Generate Focus Button when no suggestions */}
                                  {focusSuggestions.length === 0 && !isGeneratingFocus && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="text-center py-6"
                                    >
                                      <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                      <p className="text-sm mb-4 text-muted-foreground">No focus set for tomorrow</p>
                                      <motion.button
                                        onClick={generateFocusSuggestions}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 rounded-lg transition-all mx-auto"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <Zap className="w-4 h-4" />
                                        Generate AI Focus Suggestions
                                      </motion.button>
                                      <p className="text-xs mt-2 text-muted-foreground">
                                        Get personalized suggestions based on your recent trading
                                      </p>
                                    </motion.div>
                                  )}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      </div>
                    </motion.div>
                  </div>
                </div>
              )}

              {activeTab === 'trades' && (
                <div className="space-y-4">
                  {dayTrades.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No trades recorded for this day</p>
                    </div>
                  ) : (
                    dayTrades.map((trade) => {
                      // Find related notes for this trade
                      const relatedNotes = dayNotes.filter(note => 
                        note.content.toLowerCase().includes(trade.symbol.toLowerCase()) ||
                        Math.abs(new Date(note.createdAt).getTime() - new Date(trade.entryTime).getTime()) < 30 * 60 * 1000 // Within 30 minutes
                      );
                      
                      return (
                        <motion.div
                          key={trade.id}
                          className="bg-muted/30 rounded-xl p-4 hover:bg-muted/50 transition-colors"
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {trade.result && getTradeIcon(trade.result)}
                              <div>
                                <span className="font-bold text-lg">{trade.symbol}</span>
                                <span className={cn(
                                  'ml-2 px-2 py-0.5 rounded-full text-xs font-medium',
                                  trade.direction === 'long' 
                                    ? 'bg-green-500/20 text-green-500'
                                    : 'bg-red-500/20 text-red-500'
                                )}>
                                  {trade.direction.toUpperCase()}
                                </span>
                                
                                {/* Smart indicators */}
                                <div className="flex items-center gap-2 mt-1">
                                  {trade.mood && (
                                    <motion.div
                                      className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-full text-xs"
                                      whileHover={{ scale: 1.05 }}
                                      title={`Mood: ${trade.mood}`}
                                    >
                                      <Smile className="w-3 h-3" />
                                      <span className={getMoodColor(trade.mood)}>
                                        {trade.mood}
                                      </span>
                                    </motion.div>
                                  )}
                                  
                                  {relatedNotes.length > 0 && (
                                    <motion.div
                                      className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 rounded-full text-xs text-blue-500"
                                      whileHover={{ scale: 1.05 }}
                                      title={`${relatedNotes.length} related notes`}
                                    >
                                      <MessageCircle className="w-3 h-3" />
                                      <span>{relatedNotes.length}</span>
                                    </motion.div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={cn(
                                'text-lg font-bold',
                                trade.pnl && trade.pnl > 0 ? 'text-green-500' : 
                                trade.pnl && trade.pnl < 0 ? 'text-red-500' : 'text-muted-foreground'
                              )}>
                                {trade.pnl ? formatCurrency(trade.pnl) : 'N/A'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatTime(trade.entryTime)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-muted-foreground">Risk:</span>
                              <span className="ml-2 font-medium">{formatCurrency(trade.riskAmount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">R:R:</span>
                              <span className="ml-2 font-medium">{trade.riskRewardRatio}:1</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Entry:</span>
                              <span className="ml-2 font-medium">{formatTime(trade.entryTime)}</span>
                            </div>
                          </div>
                          
                          {/* Trade notes */}
                          {trade.notes && (
                            <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Trade Notes</span>
                              </div>
                              <p className="text-sm text-foreground">{trade.notes}</p>
                            </div>
                          )}
                          
                          {/* Related quick notes */}
                          {relatedNotes.length > 0 && (
                            <div className="mt-3 p-3 bg-blue-500/5 rounded-lg border border-blue-500/20">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageCircle className="w-3 h-3 text-blue-500" />
                                <span className="text-xs text-blue-500 font-medium">
                                  Related Notes ({relatedNotes.length})
                                </span>
                              </div>
                              <div className="space-y-2">
                                {relatedNotes.slice(0, 2).map((note) => (
                                  <motion.div
                                    key={note.id}
                                    className="flex items-start gap-2 p-2 bg-blue-500/5 rounded-lg"
                                    whileHover={{ scale: 1.01 }}
                                  >
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-foreground line-clamp-2">{note.content}</p>
                                      {note.tags && note.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {note.tags.slice(0, 2).map((tag, index) => (
                                            <span 
                                              key={index}
                                              className="px-1 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                                            >
                                              #{tag}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        {formatTime(note.createdAt)}
                                      </span>
                                    </div>
                                  </motion.div>
                                ))}
                                {relatedNotes.length > 2 && (
                                  <button
                                    onClick={() => setActiveTab('notes')}
                                    className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
                                  >
                                    View all {relatedNotes.length} related notes →
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {dayNotes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No notes recorded for this day</p>
                    </div>
                  ) : (
                    dayNotes.map((note) => (
                      <motion.div
                        key={note.id}
                        className="bg-muted/30 rounded-xl p-4 hover:bg-muted/50 transition-colors"
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-muted-foreground">
                              {formatTime(note.createdAt)}
                            </span>
                          </div>
                          {note.mood && (
                            <span className={cn('text-sm font-medium', getMoodColor(note.mood))}>
                              {note.mood}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-foreground mb-3">{note.content}</p>
                        
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {note.tags.map((tag, index) => (
                              <TagPill key={index} tag={tag} size="sm" />
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="space-y-4">
                  {!hasGeneratedInsights && (
                    <div className="text-center py-8">
                      <motion.button
                        onClick={handleGenerateInsights}
                        disabled={isGeneratingInsights}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isGeneratingInsights ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Generating Insights...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4" />
                            Generate AI Insights
                          </>
                        )}
                      </motion.button>
                    </div>
                  )}
                  
                  {insights.length > 0 && (
                    <div className="space-y-4">
                      {insights.map((insight, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-muted/30 rounded-xl p-4 border-l-4 border-l-purple-500"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 p-2 bg-purple-500/10 rounded-lg">
                              {getInsightIcon(insight.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-foreground">{insight.title}</h4>
                                <span className="text-xs text-muted-foreground">
                                  {insight.confidence}% confidence
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{insight.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
          

        </motion.div>
      )}
    </AnimatePresence>
  );
}; 