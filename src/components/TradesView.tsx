import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Target, 
  BarChart3, 
  Eye, 
  Edit, 
  Trash2, 
  Download, 
  RefreshCw,
  Plus,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle,
  AlertCircle,
  Minus,
  MinusCircle,
  Archive,
  MoreVertical,
  Star,
  Hash
} from 'lucide-react';
import { InlineTradeEntry, InlineEntryTrigger } from './InlineTradeEntry';
import { useTradeStore } from '@/store/useTradeStore';
import TradeImageImport from '@/components/TradeImageImport';
import { useAccountFilterStore, getAccountIdsForSelection } from '@/store/useAccountFilterStore';
import { useTradeLoggerModal } from '@/hooks/useTradeLoggerModal';
import { Trade, TradeResult, MoodType } from '@/types';
import { summarizeWinLossScratch, classifyTradeResult } from '@/lib/utils';
import { formatCurrency, formatRelativeTime, getMoodColor, getMoodEmoji } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';
import { TagPill, TagInput } from './TagInput';
import { useTagStore } from '@/store/useTagStore';

interface TradeFilters {
  search: string;
  result: TradeResult | 'all';
  symbol: string;
  dateFrom: string;
  dateTo: string;
  account: string;
  minPnl: string;
  maxPnl: string;
  mood: MoodType | 'all';
}

interface SortConfig {
  key: keyof Trade;
  direction: 'asc' | 'desc';
}

type ViewMode = 'table' | 'cards';

const ITEMS_PER_PAGE = 20;

interface TradesViewProps {
  onOpenTradeModal?: (trade: Trade) => void;
}

export const TradesView: React.FC<TradesViewProps> = ({ onOpenTradeModal }) => {
  const { trades, deleteTrade, updateTrade, toggleMarkForReview, getMarkedForReview } = useTradeStore();
  const { accounts, selectedAccountId } = useAccountFilterStore();
  
  // Default to cards on mobile, table on desktop
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024 ? 'cards' : 'table';
    }
    return 'table';
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'entryTime',
    direction: 'desc'
  });
  
  const [filters, setFilters] = useState<TradeFilters>({
    search: '',
    result: 'all',
    symbol: '',
    dateFrom: '',
    dateTo: '',
    account: selectedAccountId || 'all',
    minPnl: '',
    maxPnl: '',
    mood: 'all'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTrades, setSelectedTrades] = useState<Set<string>>(new Set());
  const [showImageImport, setShowImageImport] = useState(false);
  const [bulkMood, setBulkMood] = useState<MoodType | ''>('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [includeArchived, setIncludeArchived] = useState(false);
  
  // Inline editing states (Apple-style)
  const [editingRRId, setEditingRRId] = useState<string | null>(null);
  const [editingRRValue, setEditingRRValue] = useState<string>('');
  const [editingPnlId, setEditingPnlId] = useState<string | null>(null);
  const [editingPnlValue, setEditingPnlValue] = useState<string>('');
  const [editingMoodId, setEditingMoodId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingTimeValue, setEditingTimeValue] = useState<string>('');
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>('');
  const [editingEntryValue, setEditingEntryValue] = useState<string>('');
  const [editingExitId, setEditingExitId] = useState<string | null>(null);
  const [editingExitValue, setEditingExitValue] = useState<string>('');
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [editingPotentialRId, setEditingPotentialRId] = useState<string | null>(null);
  const [editingPotentialRValue, setEditingPotentialRValue] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'week' | 'winners' | 'losers' | 'marked'>('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [swipedTradeId, setSwipedTradeId] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [showInlineEntry, setShowInlineEntry] = useState(false);
  
  // Tag filters
  const [selectedTagFilters, setSelectedTagFilters] = useState<Set<string>>(new Set());
  const { getAllTags } = useTagStore();

  // Keyboard shortcut for inline entry (N key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // N key opens inline entry
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setShowInlineEntry(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset to page 1 and update filter when account changes
  React.useEffect(() => {
    console.log('🔄 TradesView: Account changed to:', selectedAccountId);
    console.log('🔄 TradesView: Total trades in store:', trades.length);
    const ids = getAccountIdsForSelection(selectedAccountId || null, includeArchived);
    const filtered = trades.filter(t => ids.includes(t.accountId));
    console.log('🔄 TradesView: Filtered trades for this account:', filtered.length, 'Account IDs:', ids);
    
    // Reset pagination when account changes to prevent showing empty page
    setCurrentPage(1);
    
    // Update the account filter to match the selected account
    // This prevents double-filtering where trades are filtered by both selectedAccountId and filters.account
    setFilters(prev => ({ ...prev, account: selectedAccountId || 'all' }));
  }, [selectedAccountId, includeArchived]);

  // Get unique symbols for filter dropdown
  const uniqueSymbols = useMemo(() => {
    const symbols = trades.map(trade => trade.symbol);
    return Array.from(new Set(symbols)).sort();
  }, [trades]);

  const uniqueTags = useMemo(() => {
    const ids = selectedAccountId ? getAccountIdsForSelection(selectedAccountId) : null;
    const scoped = ids ? trades.filter(t => ids.includes(t.accountId)) : trades;
    const tags = scoped.flatMap(t => (t.tags || []).map(tag => tag.toLowerCase()));
    return Array.from(new Set(tags)).sort();
  }, [trades, selectedAccountId]);

  // Inline R:R editing handlers (Apple-style)
  const handleRRDoubleClick = (trade: Trade) => {
    setEditingRRId(trade.id);
    setEditingRRValue(trade.riskRewardRatio?.toString() || '1.00');
  };

  const handleRRSave = async (tradeId: string, trade: Trade) => {
    const newRR = parseFloat(editingRRValue);
    if (!isNaN(newRR) && newRR > 0) {
      // Recalculate risk amount based on P&L and new R:R
      // If P&L = $343.52 and R:R = 2, then Risk = $343.52 / 2 = $171.76
      const pnl = Math.abs(trade.pnl || 0);
      const newRiskAmount = pnl / newRR;
      
      await updateTrade(tradeId, { 
        riskRewardRatio: newRR,
        riskAmount: newRiskAmount
      });
    }
    setEditingRRId(null);
    setEditingRRValue('');
  };

  const handleRRKeyDown = (e: React.KeyboardEvent, tradeId: string, trade: Trade) => {
    if (e.key === 'Enter') {
      handleRRSave(tradeId, trade);
    } else if (e.key === 'Escape') {
      setEditingRRId(null);
      setEditingRRValue('');
    }
  };

  // P&L inline editing handlers
  const handlePnlDoubleClick = (trade: Trade) => {
    setEditingPnlId(trade.id);
    setEditingPnlValue(Math.abs(trade.pnl || 0).toString());
  };

  const handlePnlSave = async (tradeId: string, trade: Trade) => {
    const newPnl = parseFloat(editingPnlValue);
    if (!isNaN(newPnl)) {
      // Preserve the sign based on original result
      const signedPnl = trade.result === 'loss' ? -Math.abs(newPnl) : Math.abs(newPnl);
      await updateTrade(tradeId, { pnl: signedPnl });
    }
    setEditingPnlId(null);
    setEditingPnlValue('');
  };

  const handlePnlKeyDown = (e: React.KeyboardEvent, tradeId: string, trade: Trade) => {
    if (e.key === 'Enter') {
      handlePnlSave(tradeId, trade);
    } else if (e.key === 'Escape') {
      setEditingPnlId(null);
      setEditingPnlValue('');
    }
  };

  // Mood inline editing handlers
  const moodOptions: MoodType[] = ['excellent', 'good', 'neutral', 'poor', 'terrible'];
  
  const handleMoodClick = (tradeId: string) => {
    setEditingMoodId(editingMoodId === tradeId ? null : tradeId);
  };

  const handleMoodSelect = async (tradeId: string, mood: MoodType) => {
    await updateTrade(tradeId, { mood });
    setEditingMoodId(null);
  };

  // Time inline editing handlers (Apple-style)
  const handleTimeDoubleClick = (trade: Trade) => {
    setEditingTimeId(trade.id);
    // Format time as HH:MM for input (24-hour format)
    const date = new Date(trade.entryTime);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    setEditingTimeValue(`${hours}:${minutes}`);
  };

  const handleTimeSave = async (tradeId: string, trade: Trade) => {
    if (!editingTimeValue || !/^\d{2}:\d{2}$/.test(editingTimeValue)) {
      setEditingTimeId(null);
      setEditingTimeValue('');
      return;
    }

    const [hours, minutes] = editingTimeValue.split(':').map(Number);
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      // Preserve the date, only update time
      const newDate = new Date(trade.entryTime);
      newDate.setHours(hours, minutes, 0, 0);
      await updateTrade(tradeId, { entryTime: newDate.toISOString() });
    }
    setEditingTimeId(null);
    setEditingTimeValue('');
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent, tradeId: string, trade: Trade) => {
    if (e.key === 'Enter') {
      handleTimeSave(tradeId, trade);
    } else if (e.key === 'Escape') {
      setEditingTimeId(null);
      setEditingTimeValue('');
    }
  };

  // Date inline editing handlers (Apple-style)
  const handleDateDoubleClick = (trade: Trade) => {
    setEditingDateId(trade.id);
    // Format date as YYYY-MM-DD for input (use local date to avoid timezone issues)
    const date = new Date(trade.entryTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    setEditingDateValue(`${year}-${month}-${day}`);
  };

  const handleDateSave = async (tradeId: string, trade: Trade) => {
    if (!editingDateValue) {
      setEditingDateId(null);
      setEditingDateValue('');
      return;
    }

    // Preserve the time, only update date
    const oldDate = new Date(trade.entryTime);
    // Parse date as local date (YYYY-MM-DD) to avoid timezone issues
    const [year, month, day] = editingDateValue.split('-').map(Number);
    const newDate = new Date(year, month - 1, day);
    newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds(), 0);
    await updateTrade(tradeId, { entryTime: newDate.toISOString() });
    
    setEditingDateId(null);
    setEditingDateValue('');
  };

  const handleDateKeyDown = (e: React.KeyboardEvent, tradeId: string, trade: Trade) => {
    if (e.key === 'Enter') {
      handleDateSave(tradeId, trade);
    } else if (e.key === 'Escape') {
      setEditingDateId(null);
      setEditingDateValue('');
    }
  };

  // Entry price inline editing handlers
  const handleEntryDoubleClick = (trade: Trade) => {
    setEditingEntryId(trade.id);
    setEditingEntryValue(trade.entryPrice?.toString() || '0');
  };

  const handleEntrySave = async (tradeId: string) => {
    const newEntry = parseFloat(editingEntryValue);
    if (!isNaN(newEntry) && newEntry >= 0) {
      await updateTrade(tradeId, { entryPrice: newEntry });
    }
    setEditingEntryId(null);
    setEditingEntryValue('');
  };

  const handleEntryKeyDown = (e: React.KeyboardEvent, tradeId: string) => {
    if (e.key === 'Enter') {
      handleEntrySave(tradeId);
    } else if (e.key === 'Escape') {
      setEditingEntryId(null);
      setEditingEntryValue('');
    }
  };

  // Exit price inline editing handlers
  const handleExitDoubleClick = (trade: Trade) => {
    setEditingExitId(trade.id);
    setEditingExitValue(trade.exitPrice?.toString() || '0');
  };

  const handleExitSave = async (tradeId: string) => {
    const newExit = parseFloat(editingExitValue);
    if (!isNaN(newExit) && newExit >= 0) {
      await updateTrade(tradeId, { exitPrice: newExit });
    }
    setEditingExitId(null);
    setEditingExitValue('');
  };

  const handleExitKeyDown = (e: React.KeyboardEvent, tradeId: string) => {
    if (e.key === 'Enter') {
      handleExitSave(tradeId);
    } else if (e.key === 'Escape') {
      setEditingExitId(null);
      setEditingExitValue('');
    }
  };

  // Long-press handlers (Apple-style bulk selection)
  const handleLongPressStart = (tradeId: string) => {
    const timer = setTimeout(() => {
      setSelectionMode(true);
      setSelectedTrades(new Set([tradeId]));
      // Haptic feedback on mobile (if supported)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press
    setLongPressTimer(timer);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Tags inline editing handlers
  const handleTagsClick = (trade: Trade) => {
    setEditingTagsId(editingTagsId === trade.id ? null : trade.id);
  };

  const handleTagsSave = async (tradeId: string, newTags: string[]) => {
    await updateTrade(tradeId, { tags: newTags });
    setEditingTagsId(null);
  };

  // Potential R handlers (Apple-style)
  const handlePotentialRClick = (trade: Trade) => {
    setEditingPotentialRId(trade.id);
    setEditingPotentialRValue(trade.potentialR?.toString() || '');
  };

  const handlePotentialRSave = async (tradeId: string) => {
    const newPotentialR = parseFloat(editingPotentialRValue);
    if (!isNaN(newPotentialR) && newPotentialR > 0) {
      await updateTrade(tradeId, { potentialR: newPotentialR });
    }
    setEditingPotentialRId(null);
    setEditingPotentialRValue('');
  };

  const handlePotentialRKeyDown = (e: React.KeyboardEvent, tradeId: string) => {
    if (e.key === 'Enter') {
      handlePotentialRSave(tradeId);
    } else if (e.key === 'Escape') {
      setEditingPotentialRId(null);
      setEditingPotentialRValue('');
    }
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTagFilters(prev => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleTradeClick = (tradeId: string) => {
    if (selectionMode) {
      // Toggle selection
      setSelectedTrades(prev => {
        const newSet = new Set(prev);
        if (newSet.has(tradeId)) {
          newSet.delete(tradeId);
        } else {
          newSet.add(tradeId);
        }
        // Exit selection mode if no trades selected
        if (newSet.size === 0) {
          setSelectionMode(false);
        }
        return newSet;
      });
    }
  };

  // Filter and sort trades
  const filteredTrades = useMemo(() => {
    let filtered = (() => {
      const ids = getAccountIdsForSelection(selectedAccountId || null, includeArchived);
      return trades.filter(t => ids.includes(t.accountId));
    })();

    // Apply quick filters (Apple-style chips)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    if (quickFilter === 'today') {
      filtered = filtered.filter(trade => new Date(trade.entryTime) >= todayStart);
    } else if (quickFilter === 'week') {
      filtered = filtered.filter(trade => new Date(trade.entryTime) >= weekStart);
    } else if (quickFilter === 'winners') {
      filtered = filtered.filter(trade => (trade.pnl || 0) > 0);
    } else if (quickFilter === 'losers') {
      filtered = filtered.filter(trade => (trade.pnl || 0) < 0);
    } else if (quickFilter === 'marked') {
      filtered = filtered.filter(trade => trade.markedForReview && !trade.reviewedAt);
    }

    // Apply filters (Apple-style smart search with hashtag support)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase().trim();
      
      // If search starts with #, treat it as a tag filter
      if (searchLower.startsWith('#')) {
        const tagQuery = searchLower.substring(1); // Remove the #
        filtered = filtered.filter(trade => 
          trade.tags?.some(tag => tag.toLowerCase().includes(tagQuery))
        );
      } else {
        // Regular search across symbol, notes, and tags
        filtered = filtered.filter(trade => 
          trade.symbol.toLowerCase().includes(searchLower) ||
          trade.notes?.toLowerCase().includes(searchLower) ||
          trade.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
    }

    if (filters.result !== 'all') {
      filtered = filtered.filter(trade => trade.result === filters.result);
    }

    if (filters.symbol) {
      filtered = filtered.filter(trade => trade.symbol === filters.symbol);
    }

    if (filters.account !== 'all') {
      const ids = getAccountIdsForSelection(filters.account);
      filtered = filtered.filter(trade => ids.includes(trade.accountId));
    }

    if (filters.mood !== 'all') {
      filtered = filtered.filter(trade => trade.mood === filters.mood);
    }

    // Tag filtering (Apple-style - can select multiple tags)
    if (selectedTagFilters.size > 0) {
      filtered = filtered.filter(trade => {
        const tradeTags = (trade.tags || []).map(t => t.toLowerCase());
        // Show trade if it has ANY of the selected tags
        return Array.from(selectedTagFilters).some(filterTag => tradeTags.includes(filterTag));
      });
    }

    if (activeTag) {
      filtered = filtered.filter(trade => (trade.tags || []).map(t => t.toLowerCase()).includes(activeTag));
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(trade => new Date(trade.entryTime) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(trade => new Date(trade.entryTime) <= toDate);
    }

    if (filters.minPnl) {
      const minPnl = parseFloat(filters.minPnl);
      filtered = filtered.filter(trade => (trade.pnl || 0) >= minPnl);
    }

    if (filters.maxPnl) {
      const maxPnl = parseFloat(filters.maxPnl);
      filtered = filtered.filter(trade => (trade.pnl || 0) <= maxPnl);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }

      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      return 0;
    });

    return filtered;
  }, [trades, filters, sortConfig, quickFilter, selectedAccountId, includeArchived, activeTag, selectedTagFilters]);

  // Calculate statistics (true, honest win rate - all trades count)
  const statistics = useMemo(() => {
    const totalTrades = filteredTrades.length;
    const { wins: winningTrades, losses: losingTrades, winRateExclScratches: winRate } = summarizeWinLossScratch(filteredTrades);

    const totalPnl = filteredTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalRisk = filteredTrades.reduce((sum, trade) => sum + trade.riskAmount, 0);
    const avgPnl = totalTrades > 0 ? totalPnl / totalTrades : 0;
    
    // Use classifyTradeResult for consistent classification (matches summarizeWinLossScratch)
    const winningPnl = filteredTrades
      .filter(t => classifyTradeResult(t) === 'win')
      .reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const losingPnl = filteredTrades
      .filter(t => classifyTradeResult(t) === 'loss')
      .reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    
    const avgWin = winningTrades > 0 ? winningPnl / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? Math.abs(losingPnl) / losingTrades : 0;
    // Dollar-based expectancy: how much you expect to make per trade on average
    const expectancy = (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      totalPnl,
      totalRisk,
      avgPnl,
      winRate,
      avgWin,
      avgLoss,
      expectancy
    };
  }, [filteredTrades]);

  // Pagination
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredTrades.slice(startIndex, endIndex);
  }, [filteredTrades, currentPage]);

  const totalPages = Math.ceil(filteredTrades.length / ITEMS_PER_PAGE);

  // Group trades by date (Apple-style)
  const groupedTrades = useMemo(() => {
    const groups: { [key: string]: Trade[] } = {};
    paginatedTrades.forEach(trade => {
      const date = new Date(trade.entryTime);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey: string;
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(trade);
    });
    return groups;
  }, [paginatedTrades]);

  const handleSort = (key: keyof Trade) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFilterChange = (key: keyof TradeFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      result: 'all',
      symbol: '',
      dateFrom: '',
      dateTo: '',
      account: selectedAccountId || 'all',
      minPnl: '',
      maxPnl: '',
      mood: 'all'
    });
    setCurrentPage(1);
  };

  const handleTradeSelect = (tradeId: string) => {
    setSelectedTrades(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tradeId)) {
        newSet.delete(tradeId);
      } else {
        newSet.add(tradeId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTrades.size === paginatedTrades.length) {
      setSelectedTrades(new Set());
    } else {
      setSelectedTrades(new Set(paginatedTrades.map(trade => trade.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedTrades.size} trades?`)) {
      selectedTrades.forEach(tradeId => {
        deleteTrade(tradeId);
      });
      setSelectedTrades(new Set());
    }
  };

  const exportTrades = () => {
    const csvData = filteredTrades.map(trade => ({
      Date: new Date(trade.entryTime).toLocaleDateString(),
      Time: new Date(trade.entryTime).toLocaleTimeString(),
      Symbol: trade.symbol,
      Side: trade.direction,
              Risk: trade.riskAmount,
      'Entry Price': trade.entryPrice,
      'Exit Price': trade.exitPrice || '',
      'P&L': trade.pnl,
      'Risk Amount': trade.riskAmount,
      'Risk Reward': trade.riskRewardRatio,
      Result: trade.result,
      Mood: trade.mood,
      Notes: trade.notes || '',
      Tags: trade.tags?.join(', ') || '',
      Account: trade.accountId
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `trades_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const SortIcon = ({ column }: { column: keyof Trade }) => {
    if (sortConfig.key !== column) {
      return <SortAsc className="w-4 h-4 opacity-0 group-hover:opacity-50" />;
    }
    return sortConfig.direction === 'asc' 
      ? <SortAsc className="w-4 h-4 text-primary" />
      : <SortDesc className="w-4 h-4 text-primary" />;
  };

  const getResultColor = (result: TradeResult) => {
    switch (result) {
      case 'win': return 'text-green-500';
      case 'loss': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getResultIcon = (result: TradeResult) => {
    switch (result) {
      case 'win': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'loss': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 2xl:p-10 3xl:p-12 max-w-7xl 2xl:max-w-[1800px] 3xl:max-w-[2200px] 4xl:max-w-[2600px] mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Trades</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage and analyze your trading performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Quick add trigger - spreadsheet style */}
          <InlineEntryTrigger onClick={() => setShowInlineEntry(true)} />
          
          {/* Mobile: Hide view mode toggle on small screens, default to cards */}
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted/70 rounded-lg transition-colors"
          >
            {viewMode === 'table' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            {viewMode === 'table' ? 'Cards' : 'Table'}
          </button>
          <button
            onClick={() => onOpenTradeModal && onOpenTradeModal({} as Trade)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Full Entry
          </button>
          <button
            onClick={() => setShowImageImport(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted/70 rounded-lg transition-colors text-sm"
          >
            <span className="sm:hidden">Import</span>
            <span className="hidden sm:inline">Import Topstep Screenshot</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
        <div className="bg-muted/30 rounded-lg p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold text-foreground">{statistics.totalTrades}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Total Trades</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold text-green-500">{statistics.winningTrades}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Winners</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold text-red-500">{statistics.losingTrades}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Losers</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 sm:p-4 text-center">
          <div className="text-lg sm:text-2xl font-bold text-primary">{statistics.winRate.toFixed(1)}%</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Win Rate</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 sm:p-4 text-center">
          <div className={cn('text-lg sm:text-2xl font-bold', statistics.totalPnl >= 0 ? 'text-green-500' : 'text-red-500')}>
            {formatCurrency(statistics.totalPnl)}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Total P&L</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 sm:p-4 text-center">
          <div className={cn('text-lg sm:text-2xl font-bold', statistics.expectancy >= 0 ? 'text-green-500' : 'text-red-500')}>
            {formatCurrency(statistics.expectancy)}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Expectancy/Trade</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search trades... (try #breakout)"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              showFilters ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted/70'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={exportTrades}
            className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted/70 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Quick Filter Chips (Apple-style) */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Quick filters:</span>
          {(['all', 'today', 'week', 'winners', 'losers', 'marked'] as const).map((filter) => {
            const markedCount = filter === 'marked' ? getMarkedForReview().length : 0;
            return (
              <motion.button
                key={filter}
                onClick={() => setQuickFilter(filter)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all relative',
                  quickFilter === filter
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted/70'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {filter === 'all' ? 'All' :
                 filter === 'today' ? 'Today' :
                 filter === 'week' ? 'This Week' :
                 filter === 'winners' ? '✓ Winners' :
                 filter === 'losers' ? '✗ Losers' :
                 filter === 'marked' ? (
                   <span className="flex items-center gap-1.5">
                     <Star className="w-3 h-3 fill-current" />
                     For Review
                     {markedCount > 0 && (
                       <span className="ml-0.5 px-1.5 py-0.5 bg-yellow-500 text-white rounded-full text-[10px] font-bold">
                         {markedCount}
                       </span>
                     )}
                   </span>
                 ) : filter}
              </motion.button>
            );
          })}
        </div>

        {/* Active Tag Filters (Apple-style - only show when filtering) */}
        {selectedTagFilters.size > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Filtering by:</span>
            {Array.from(selectedTagFilters).map((tag) => (
              <TagPill
                key={tag}
                tag={tag}
                onRemove={() => toggleTagFilter(tag)}
                className="ring-2 ring-primary"
              />
            ))}
          </div>
        )}

        {/* Extended Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-muted/30 rounded-lg p-4 space-y-4"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Result</label>
                  <select
                    value={filters.result}
                    onChange={(e) => handleFilterChange('result', e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded-lg"
                  >
                    <option value="all">All Results</option>
                    <option value="win">Win</option>
                    <option value="loss">Loss</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Symbol</label>
                  <select
                    value={filters.symbol}
                    onChange={(e) => handleFilterChange('symbol', e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded-lg"
                  >
                    <option value="">All Symbols</option>
                    {uniqueSymbols.map(symbol => (
                      <option key={symbol} value={symbol}>{symbol}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Account</label>
                  <select
                    value={filters.account}
                    onChange={(e) => handleFilterChange('account', e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded-lg"
                  >
                    <option value="all">All Accounts</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>{account.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Mood</label>
                  <select
                    value={filters.mood}
                    onChange={(e) => handleFilterChange('mood', e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded-lg"
                  >
                    <option value="all">All Moods</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="neutral">Neutral</option>
                    <option value="poor">Poor</option>
                    <option value="terrible">Terrible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Min P&L</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minPnl}
                    onChange={(e) => handleFilterChange('minPnl', e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Max P&L</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={filters.maxPnl}
                    onChange={(e) => handleFilterChange('maxPnl', e.target.value)}
                    className="w-full p-2 bg-background border border-border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted/70 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {filteredTrades.length} of {trades.length} trades
                  </span>
                </div>
                
                {/* Toggle for including archived accounts */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/50"
                  />
                  <Archive className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Include archived accounts</span>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedTrades.size > 0 && selectionMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between gap-3 flex-wrap"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm text-foreground">
                {selectedTrades.size} trades selected
              </span>
              <button
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedTrades(new Set());
                }}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Exit Selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={bulkMood}
                onChange={(e) => setBulkMood(e.target.value as MoodType | '')}
                className="px-2 py-2 bg-background border border-border rounded-lg text-sm"
              >
                <option value="">Set mood…</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="neutral">Neutral</option>
                <option value="poor">Poor</option>
                <option value="terrible">Terrible</option>
              </select>
              <button
                disabled={!bulkMood}
                onClick={async () => {
                  if (!bulkMood) return;
                  const ids = Array.from(selectedTrades);
                  for (const id of ids) {
                    await updateTrade(id, { mood: bulkMood });
                  }
                  setSelectedTrades(new Set());
                  setBulkMood('');
                }}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
              >
                Apply
              </button>
            </div>
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline Trade Entry - Spreadsheet style */}
      <AnimatePresence>
        {showInlineEntry && (
          <div className="bg-card rounded-lg border overflow-hidden">
            <InlineTradeEntry 
              onClose={() => setShowInlineEntry(false)}
              onSuccess={() => {
                // Keep inline entry open for rapid entry
                // User can press Escape when done
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Trades Table/Cards */}
      {viewMode === 'table' ? (
        <div className="bg-muted/30 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {selectionMode && (
                    <th className="p-3 text-left w-12">
                      <button
                        onClick={handleSelectAll}
                        className="text-xs text-primary hover:underline"
                      >
                        All
                      </button>
                    </th>
                  )}
                  {[
                    { key: 'entryTime', label: 'Date' },
                    { key: 'symbol', label: 'Symbol' },
                    { key: 'direction', label: 'Side' },
                    { key: 'entryPrice', label: 'Entry → Exit' },
                    { key: 'pnl', label: 'P&L' },
                    { key: 'riskRewardRatio', label: 'R:R' },
                    { key: 'result', label: 'Result' },
                    { key: 'mood', label: 'Mood' },
                  ].map(({ key, label }) => (
                    <th key={key} className="p-3 text-left">
                      <button
                        onClick={() => handleSort(key as keyof Trade)}
                        className="flex items-center gap-1 hover:text-primary transition-colors group"
                      >
                        {label}
                        <SortIcon column={key as keyof Trade} />
                      </button>
                    </th>
                  ))}
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedTrades).map(([groupName, groupTrades]) => (
                  <React.Fragment key={groupName}>
                    {/* Group Header */}
                    <tr className="bg-muted/20">
                      <td colSpan={9} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{groupName}</span>
                          <span className="text-xs text-muted-foreground">({groupTrades.length} {groupTrades.length === 1 ? 'trade' : 'trades'})</span>
                        </div>
                      </td>
                    </tr>
                    {/* Group Trades */}
                    {groupTrades.map((trade) => (
                  <motion.tr
                    key={trade.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      'border-t border-border hover:bg-muted/20 transition-colors cursor-pointer relative',
                      selectedTrades.has(trade.id) && 'bg-primary/10',
                      trade.markedForReview && 'border-l-2 border-l-yellow-500 bg-yellow-500/[0.03]'
                    )}
                    onMouseDown={() => handleLongPressStart(trade.id)}
                    onMouseUp={handleLongPressEnd}
                    onMouseLeave={handleLongPressEnd}
                    onTouchStart={() => handleLongPressStart(trade.id)}
                    onTouchEnd={handleLongPressEnd}
                    onClick={() => handleTradeClick(trade.id)}
                  >
                    {selectionMode && (
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedTrades.has(trade.id)}
                          onChange={() => handleTradeClick(trade.id)}
                          className="rounded pointer-events-none"
                        />
                      </td>
                    )}
                    <td className="p-3 text-sm">
                      <div className="flex items-center gap-2">
                        {/* Star indicator for marked trades */}
                        {trade.markedForReview && (
                          <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                        )}
                        {/* Date - Click to edit */}
                        <div 
                          className="cursor-pointer hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDateDoubleClick(trade);
                          }}
                          title="Click to edit date"
                        >
                          {editingDateId === trade.id ? (
                            <input
                              type="date"
                              value={editingDateValue}
                              onChange={(e) => setEditingDateValue(e.target.value)}
                              onBlur={() => handleDateSave(trade.id, trade)}
                              onKeyDown={(e) => handleDateKeyDown(e, trade.id, trade)}
                              className="w-32 px-1 py-0.5 bg-primary/10 border border-primary rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              autoFocus
                            />
                          ) : (
                            new Date(trade.entryTime).toLocaleDateString()
                          )}
                        </div>
                      </div>
                      
                      {/* Time - Click to edit */}
                      <div 
                        className="text-muted-foreground cursor-pointer hover:text-primary transition-colors text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimeDoubleClick(trade);
                        }}
                        title="Click to edit time"
                      >
                        {editingTimeId === trade.id ? (
                          <input
                            type="time"
                            value={editingTimeValue}
                            onChange={(e) => setEditingTimeValue(e.target.value)}
                            onBlur={() => handleTimeSave(trade.id, trade)}
                            onKeyDown={(e) => handleTimeKeyDown(e, trade.id, trade)}
                            className="w-20 px-1 py-0.5 bg-primary/10 border border-primary rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            autoFocus
                          />
                        ) : (
                          <span className="inline-block">
                            {new Date(trade.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{trade.symbol}</span>
                        
                        {/* Tag Pills - Click to edit */}
                        <div 
                          className="flex gap-1 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagsClick(trade);
                          }}
                          title="Click to edit tags"
                        >
                          {editingTagsId === trade.id ? (
                            <div className="min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                              <TagInput
                                value={trade.tags || []}
                                onChange={(newTags) => handleTagsSave(trade.id, newTags)}
                                autoFocus
                                className="text-xs"
                              />
                            </div>
                          ) : (
                            <>
                              {(trade.tags || []).slice(0, 2).map((tag) => (
                                <TagPill 
                                  key={tag} 
                                  tag={tag} 
                                  size="sm"
                                  onClick={() => {
                                    // Quick filter by clicking a tag
                                    toggleTagFilter(tag.toLowerCase());
                                  }}
                                  className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                                />
                              ))}
                              {(trade.tags || []).length > 2 && (
                                <span 
                                  className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTagsClick(trade);
                                  }}
                                  title="View all tags"
                                >
                                  +{(trade.tags || []).length - 2}
                                </span>
                              )}
                              {(!trade.tags || trade.tags.length === 0) && (
                                <button className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                                  <Hash className="w-3 h-3" />
                                  <span>Add tags</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        trade.direction === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      )}>
                        {trade.direction?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="text-sm flex items-center gap-1">
                        {/* Entry Price - Inline Editable */}
                        <div onClick={() => handleEntryDoubleClick(trade)}>
                          {editingEntryId === trade.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editingEntryValue}
                              onChange={(e) => setEditingEntryValue(e.target.value)}
                              onBlur={() => handleEntrySave(trade.id)}
                              onKeyDown={(e) => handleEntryKeyDown(e, trade.id)}
                              className="w-24 px-2 py-1 bg-primary/10 border border-primary rounded text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              autoFocus
                            />
                          ) : (
                            <span className="text-muted-foreground cursor-pointer hover:text-primary transition-colors" title="Tap to edit">
                              {formatCurrency(trade.entryPrice)}
                            </span>
                          )}
                        </div>
                        
                        <span className="mx-1 text-muted-foreground/50">→</span>
                        
                        {/* Exit Price - Inline Editable */}
                        <div onClick={() => handleExitDoubleClick(trade)}>
                          {editingExitId === trade.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editingExitValue}
                              onChange={(e) => setEditingExitValue(e.target.value)}
                              onBlur={() => handleExitSave(trade.id)}
                              onKeyDown={(e) => handleExitKeyDown(e, trade.id)}
                              className="w-24 px-2 py-1 bg-primary/10 border border-primary rounded text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              autoFocus
                            />
                          ) : (
                            <span className={cn(
                              'cursor-pointer hover:text-primary transition-colors',
                              trade.exitPrice ? '' : 'text-muted-foreground/60'
                            )} title="Tap to edit">
                              {trade.exitPrice ? formatCurrency(trade.exitPrice) : 'Open'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td 
                      className="p-3"
                      onClick={() => handlePnlDoubleClick(trade)}
                    >
                      {editingPnlId === trade.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingPnlValue}
                          onChange={(e) => setEditingPnlValue(e.target.value)}
                          onBlur={() => handlePnlSave(trade.id, trade)}
                          onKeyDown={(e) => handlePnlKeyDown(e, trade.id, trade)}
                          className="w-24 px-2 py-1 bg-primary/10 border border-primary rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          autoFocus
                        />
                      ) : (
                        <span className={cn(
                          'font-medium cursor-pointer hover:text-primary transition-colors',
                          (trade.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                        )} title="Tap to edit">
                          {formatCurrency(trade.pnl || 0)}
                        </span>
                      )}
                    </td>
                    <td 
                      className="p-3"
                      onClick={() => handleRRDoubleClick(trade)}
                    >
                      {editingRRId === trade.id ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editingRRValue}
                          onChange={(e) => setEditingRRValue(e.target.value)}
                          onBlur={() => handleRRSave(trade.id, trade)}
                          onKeyDown={(e) => handleRRKeyDown(e, trade.id, trade)}
                          className="w-16 px-2 py-1 bg-primary/10 border border-primary rounded text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          autoFocus
                        />
                      ) : (
                        <span className="cursor-pointer hover:text-primary transition-colors" title="Tap to edit">
                          {(trade.riskRewardRatio ?? 0).toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {trade.result && getResultIcon(trade.result)}
                        <span className={cn('text-sm capitalize', trade.result && getResultColor(trade.result))}>
                          {trade.result || 'Pending'}
                        </span>
                        {/* No scratch badges - every trade is simply a win or loss */}
                      </div>
                    </td>
                    <td className="p-3 relative">
                      <span 
                        className={cn('text-lg cursor-pointer hover:scale-110 transition-transform', getMoodColor(trade.mood))}
                        onClick={() => handleMoodClick(trade.id)}
                        title="Tap to change mood"
                      >
                        {getMoodEmoji(trade.mood)}
                      </span>
                      
                      {/* Mood picker popover */}
                      {editingMoodId === trade.id && (
                        <div className="absolute z-10 top-full mt-1 right-0 bg-card border border-border rounded-lg shadow-lg p-2 flex gap-2">
                          {moodOptions.map((mood) => (
                            <button
                              key={mood}
                              onClick={() => handleMoodSelect(trade.id, mood)}
                              className={cn(
                                'text-2xl p-2 rounded-lg hover:bg-muted transition-colors',
                                getMoodColor(mood)
                              )}
                              title={mood}
                            >
                              {getMoodEmoji(mood)}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-3 relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === trade.id ? null : trade.id)}
                        className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {/* Action Menu Popover (Apple-style) */}
                      <AnimatePresence>
                        {openMenuId === trade.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute right-0 bottom-12 z-50 w-48 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
                            onMouseLeave={() => setOpenMenuId(null)}
                          >
                            <button
                              onClick={() => {
                                onOpenTradeModal && onOpenTradeModal(trade);
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                            >
                              <Edit className="w-4 h-4 text-primary" />
                              <span className="text-sm">Edit Trade</span>
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const newState = await toggleMarkForReview(trade.id);
                                  // Show toast notification
                                  const toast = document.createElement('div');
                                  toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 bg-card border border-border rounded-xl shadow-lg flex items-center gap-3';
                                  toast.innerHTML = `
                                    <div class="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    <span class="text-sm font-medium">${newState ? 'Marked for review' : 'Unmarked'}</span>
                                  `;
                                  document.body.appendChild(toast);
                                  setTimeout(() => toast.remove(), 2000);
                                } catch (error) {
                                  console.error('Failed to toggle review mark:', error);
                                }
                                setOpenMenuId(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                            >
                              <Star className={cn(
                                "w-4 h-4",
                                trade.markedForReview ? "fill-yellow-500 text-yellow-500" : "text-yellow-500"
                              )} />
                              <span className="text-sm">
                                {trade.markedForReview ? 'Unmark for Review' : 'Mark for Review'}
                              </span>
                            </button>
                            {trade.result === 'win' && (
                              <>
                                <div className="h-px bg-border my-1" />
                                <button
                                  onClick={() => {
                                    handlePotentialRClick(trade);
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                                >
                                  <Target className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm">
                                    {trade.potentialR ? `Potential R: ${trade.potentialR.toFixed(2)}` : 'Add Potential R'}
                                  </span>
                                </button>
                              </>
                            )}
                            <div className="h-px bg-border my-1" />
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this trade?')) {
                                  deleteTrade(trade.id);
                                  setOpenMenuId(null);
                                }
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 transition-colors text-left text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-sm">Delete</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </td>
                  </motion.tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedTrades.map((trade) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden"
            >
              {/* Swipe Actions Background (Apple-style) */}
              <motion.div
                className="absolute inset-0 flex items-center justify-end gap-2 px-4 bg-gradient-to-l from-red-500/20 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: swipedTradeId === trade.id ? 1 : 0 }}
              >
                <button
                  onClick={() => {
                    onOpenTradeModal && onOpenTradeModal(trade);
                    setSwipedTradeId(null);
                  }}
                  className="p-2 bg-primary rounded-lg"
                >
                  <Edit className="w-5 h-5 text-primary-foreground" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this trade?')) {
                      deleteTrade(trade.id);
                    }
                    setSwipedTradeId(null);
                  }}
                  className="p-2 bg-red-500 rounded-lg"
                >
                  <Trash2 className="w-5 h-5 text-white" />
                </button>
              </motion.div>

              {/* Card Content */}
              <motion.div
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(e, { offset }) => {
                  if (offset.x < -50) {
                    setSwipedTradeId(trade.id);
                  } else {
                    setSwipedTradeId(null);
                  }
                }}
                className="bg-muted/30 rounded-lg p-4 space-y-3 relative z-10"
              >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{trade.symbol}</span>
                  <span className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    trade.direction === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  )}>
                    {trade.direction?.toUpperCase() || 'N/A'}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">← Swipe</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div onClick={() => handleEntryDoubleClick(trade)}>
                  <span className="text-muted-foreground">Entry:</span>
                  {editingEntryId === trade.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editingEntryValue}
                      onChange={(e) => setEditingEntryValue(e.target.value)}
                      onBlur={() => handleEntrySave(trade.id)}
                      onKeyDown={(e) => handleEntryKeyDown(e, trade.id)}
                      className="ml-2 w-24 px-2 py-1 bg-primary/10 border border-primary rounded text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                      autoFocus
                    />
                  ) : (
                    <span className="ml-2 cursor-pointer active:text-primary transition-colors">
                      {formatCurrency(trade.entryPrice)}
                    </span>
                  )}
                </div>
                <div onClick={() => handleExitDoubleClick(trade)}>
                  <span className="text-muted-foreground">Exit:</span>
                  {editingExitId === trade.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editingExitValue}
                      onChange={(e) => setEditingExitValue(e.target.value)}
                      onBlur={() => handleExitSave(trade.id)}
                      onKeyDown={(e) => handleExitKeyDown(e, trade.id)}
                      className="ml-2 w-24 px-2 py-1 bg-primary/10 border border-primary rounded text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                      autoFocus
                    />
                  ) : (
                    <span className="ml-2 cursor-pointer active:text-primary transition-colors">
                      {trade.exitPrice ? formatCurrency(trade.exitPrice) : 'Open'}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Risk:</span>
                  <span className="ml-2">{formatCurrency(trade.riskAmount)}</span>
                </div>
                <div onClick={() => handleRRDoubleClick(trade)}>
                  <span className="text-muted-foreground">R:R:</span>
                  {editingRRId === trade.id ? (
                    <input
                      type="number"
                      step="0.1"
                      value={editingRRValue}
                      onChange={(e) => setEditingRRValue(e.target.value)}
                      onBlur={() => handleRRSave(trade.id, trade)}
                      onKeyDown={(e) => handleRRKeyDown(e, trade.id, trade)}
                      className="ml-2 w-16 px-2 py-1 bg-primary/10 border border-primary rounded text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                      autoFocus
                    />
                  ) : (
                    <span className="ml-2 cursor-pointer active:text-primary transition-colors">
                      {(trade.riskRewardRatio ?? 0).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {trade.result && getResultIcon(trade.result)}
                  <span className={cn('text-sm capitalize', trade.result && getResultColor(trade.result))}>
                    {trade.result || 'Pending'}
                  </span>
                  {/* No scratch badges - every trade is simply a win or loss */}
                </div>
                <div className="flex items-center gap-2 relative">
                  <span 
                    className={cn('text-lg cursor-pointer active:scale-110 transition-transform', getMoodColor(trade.mood))}
                    onClick={() => handleMoodClick(trade.id)}
                  >
                    {getMoodEmoji(trade.mood)}
                  </span>
                  
                  {/* Mobile mood picker */}
                  {editingMoodId === trade.id && (
                    <div className="absolute z-10 bottom-full mb-2 right-0 bg-card border border-border rounded-lg shadow-lg p-2 flex gap-2">
                      {moodOptions.map((mood) => (
                        <button
                          key={mood}
                          onClick={() => handleMoodSelect(trade.id, mood)}
                          className={cn(
                            'text-2xl p-2 rounded-lg active:bg-muted transition-colors',
                            getMoodColor(mood)
                          )}
                        >
                          {getMoodEmoji(mood)}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div onClick={() => handlePnlDoubleClick(trade)}>
                    {editingPnlId === trade.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editingPnlValue}
                        onChange={(e) => setEditingPnlValue(e.target.value)}
                        onBlur={() => handlePnlSave(trade.id, trade)}
                        onKeyDown={(e) => handlePnlKeyDown(e, trade.id, trade)}
                        className="w-24 px-2 py-1 bg-primary/10 border border-primary rounded text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        autoFocus
                      />
                    ) : (
                      <span className={cn(
                        'font-medium cursor-pointer active:text-primary transition-colors',
                        (trade.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                      )} title="Tap to edit">
                        {formatCurrency(trade.pnl || 0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div 
                className="text-xs text-muted-foreground cursor-pointer active:text-primary transition-colors"
                onClick={() => handleTimeDoubleClick(trade)}
              >
                {editingTimeId === trade.id ? (
                  <input
                    type="time"
                    value={editingTimeValue}
                    onChange={(e) => setEditingTimeValue(e.target.value)}
                    onBlur={() => handleTimeSave(trade.id, trade)}
                    onKeyDown={(e) => handleTimeKeyDown(e, trade.id, trade)}
                    className="w-20 px-2 py-1 bg-primary/10 border border-primary rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                ) : (
                  <>
                    {formatRelativeTime(trade.entryTime)}
                    <span className="ml-1 text-[10px] opacity-60">• {new Date(trade.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </>
                )}
              </div>

              {trade.notes && (
                <div className="text-sm text-muted-foreground bg-muted/30 rounded p-2">
                  {trade.notes}
                </div>
              )}
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredTrades.length)} of {filteredTrades.length} trades
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 bg-muted/50 hover:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-2 bg-muted/50 hover:bg-muted/70 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredTrades.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No trades found</h3>
          <p className="text-muted-foreground mb-4">
            {trades.length === 0 
              ? 'Start by logging your first trade!'
              : 'Try adjusting your filters to see more trades.'
            }
          </p>
          <button
            onClick={() => onOpenTradeModal && onOpenTradeModal({} as Trade)}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
          >
            Add Your First Trade
          </button>
        </div>
      )}

      {/* Potential R Input Modal (Apple-style) */}
      <AnimatePresence>
        {editingPotentialRId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center p-4"
            onClick={() => {
              setEditingPotentialRId(null);
              setEditingPotentialRValue('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-semibold mb-4 text-foreground">Potential R Reached</h2>
              <p className="text-sm text-muted-foreground mb-4">
                How far did price actually run past your target? Enter the R value it reached.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Price ran to: <span className="text-muted-foreground">R</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editingPotentialRValue}
                      onChange={(e) => setEditingPotentialRValue(e.target.value)}
                      onKeyDown={(e) => handlePotentialRKeyDown(e, editingPotentialRId)}
                      placeholder="e.g. 1.2"
                      className="flex-1 px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      autoFocus
                    />
                    <span className="text-muted-foreground font-medium">R</span>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    💡 <span className="font-medium">Example:</span> If you targeted 0.75R but price ran to 1.5R, enter <span className="text-foreground">1.5</span>
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setEditingPotentialRId(null);
                      setEditingPotentialRValue('');
                    }}
                    className="flex-1 px-4 py-2 bg-muted/50 hover:bg-muted/70 text-foreground rounded-lg transition-colors font-medium text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handlePotentialRSave(editingPotentialRId)}
                    disabled={!editingPotentialRValue || isNaN(parseFloat(editingPotentialRValue))}
                    className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg transition-colors font-medium text-sm"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Import Modal */}
      <AnimatePresence>
        {showImageImport && (
          // Lazy import via dynamic to avoid bundling OpenAI everywhere would be ideal; simple inline for now
          // @ts-ignore
          <TradeImageImport isOpen={showImageImport} onClose={() => setShowImageImport(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}; 