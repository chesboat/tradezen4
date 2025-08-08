import React, { useState, useMemo, useCallback } from 'react';
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
  Minus
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import TradeImageImport from '@/components/TradeImageImport';
import { useAccountFilterStore, getAccountIdsForSelection } from '@/store/useAccountFilterStore';
import { useTradeLoggerModal } from '@/hooks/useTradeLoggerModal';
import { Trade, TradeResult, MoodType } from '@/types';
import { formatCurrency, formatRelativeTime, getMoodColor, getMoodEmoji } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';

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
  const { trades, deleteTrade } = useTradeStore();
  const { accounts, selectedAccountId } = useAccountFilterStore();
  
  const [viewMode, setViewMode] = useState<ViewMode>('table');
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

  // Get unique symbols for filter dropdown
  const uniqueSymbols = useMemo(() => {
    const symbols = trades.map(trade => trade.symbol);
    return Array.from(new Set(symbols)).sort();
  }, [trades]);

  // Filter and sort trades
  const filteredTrades = useMemo(() => {
    let filtered = (() => {
      if (!selectedAccountId || selectedAccountId === 'all') return trades;
      const ids = getAccountIdsForSelection(selectedAccountId);
      return trades.filter(t => ids.includes(t.accountId));
    })();

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(trade => 
        trade.symbol.toLowerCase().includes(searchLower) ||
        trade.notes?.toLowerCase().includes(searchLower) ||
        trade.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
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
  }, [trades, filters, sortConfig]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalTrades = filteredTrades.length;
    const winningTrades = filteredTrades.filter(t => t.result === 'win').length;
    const losingTrades = filteredTrades.filter(t => t.result === 'loss').length;
    const breakEvenTrades = filteredTrades.filter(t => t.result === 'breakeven').length;
    
    const totalPnl = filteredTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const totalRisk = filteredTrades.reduce((sum, trade) => sum + trade.riskAmount, 0);
    const avgPnl = totalTrades > 0 ? totalPnl / totalTrades : 0;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    
    const winningPnl = filteredTrades
      .filter(t => t.result === 'win')
      .reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const losingPnl = filteredTrades
      .filter(t => t.result === 'loss')
      .reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    
    const avgWin = winningTrades > 0 ? winningPnl / winningTrades : 0;
    const avgLoss = losingTrades > 0 ? Math.abs(losingPnl) / losingTrades : 0;
    const expectancy = avgLoss > 0 ? (avgWin / avgLoss) * (winRate / 100) - (1 - winRate / 100) : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      breakEvenTrades,
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
      case 'breakeven': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const getResultIcon = (result: TradeResult) => {
    switch (result) {
      case 'win': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'loss': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'breakeven': return <Minus className="w-4 h-4 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Trades</h1>
          <p className="text-muted-foreground">
            Manage and analyze your trading performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
            className="flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted/70 rounded-lg transition-colors"
          >
            {viewMode === 'table' ? <Grid className="w-4 h-4" /> : <List className="w-4 h-4" />}
            {viewMode === 'table' ? 'Cards' : 'Table'}
          </button>
          <button
            onClick={() => onOpenTradeModal && onOpenTradeModal({} as Trade)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Trade
          </button>
          <button
            onClick={() => setShowImageImport(true)}
            className="flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted/70 rounded-lg transition-colors"
          >
            Import from Screenshot
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{statistics.totalTrades}</div>
          <div className="text-sm text-muted-foreground">Total Trades</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{statistics.winningTrades}</div>
          <div className="text-sm text-muted-foreground">Winners</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{statistics.losingTrades}</div>
          <div className="text-sm text-muted-foreground">Losers</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary">{statistics.winRate.toFixed(1)}%</div>
          <div className="text-sm text-muted-foreground">Win Rate</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <div className={cn('text-2xl font-bold', statistics.totalPnl >= 0 ? 'text-green-500' : 'text-red-500')}>
            {formatCurrency(statistics.totalPnl)}
          </div>
          <div className="text-sm text-muted-foreground">Total P&L</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-4 text-center">
          <div className={cn('text-2xl font-bold', statistics.expectancy >= 0 ? 'text-green-500' : 'text-red-500')}>
            {statistics.expectancy.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">Expectancy</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search trades by symbol, notes, or tags..."
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
                    <option value="breakeven">Break Even</option>
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

              <div className="flex items-center gap-2">
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedTrades.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between"
          >
            <span className="text-sm text-foreground">
              {selectedTrades.size} trades selected
            </span>
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

      {/* Trades Table/Cards */}
      {viewMode === 'table' ? (
        <div className="bg-muted/30 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedTrades.size === paginatedTrades.length && paginatedTrades.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  {[
                    { key: 'entryTime', label: 'Date' },
                    { key: 'symbol', label: 'Symbol' },
                    { key: 'direction', label: 'Side' },
                    { key: 'riskAmount', label: 'Risk' },
                    { key: 'entryPrice', label: 'Entry' },
                    { key: 'exitPrice', label: 'Exit' },
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
                {paginatedTrades.map((trade) => (
                  <motion.tr
                    key={trade.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-border hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedTrades.has(trade.id)}
                        onChange={() => handleTradeSelect(trade.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3 text-sm">
                      <div>{new Date(trade.entryTime).toLocaleDateString()}</div>
                      <div className="text-muted-foreground">
                        {new Date(trade.entryTime).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-3 font-medium">{trade.symbol}</td>
                    <td className="p-3">
                      <span className={cn(
                        'px-2 py-1 rounded text-xs font-medium',
                        trade.direction === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      )}>
                        {trade.direction?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3">{formatCurrency(trade.riskAmount)}</td>
                    <td className="p-3">{formatCurrency(trade.entryPrice)}</td>
                    <td className="p-3">{trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}</td>
                    <td className="p-3">
                      <span className={cn(
                        'font-medium',
                        (trade.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                      )}>
                        {formatCurrency(trade.pnl || 0)}
                      </span>
                    </td>
                    <td className="p-3">{trade.riskRewardRatio.toFixed(2)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {trade.result && getResultIcon(trade.result)}
                        <span className={cn('text-sm capitalize', trade.result && getResultColor(trade.result))}>
                          {trade.result || 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={cn('text-lg', getMoodColor(trade.mood))}>
                        {getMoodEmoji(trade.mood)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenTradeModal && onOpenTradeModal(trade)}
                          className="p-1 hover:bg-primary/20 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this trade?')) {
                              deleteTrade(trade.id);
                            }
                          }}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
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
              className="bg-muted/30 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedTrades.has(trade.id)}
                    onChange={() => handleTradeSelect(trade.id)}
                    className="rounded"
                  />
                  <span className="font-medium">{trade.symbol}</span>
                  <span className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    trade.direction === 'long' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  )}>
                    {trade.direction?.toUpperCase() || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenTradeModal && onOpenTradeModal(trade)}
                    className="p-1 hover:bg-primary/20 rounded transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this trade?')) {
                        deleteTrade(trade.id);
                      }
                    }}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Entry:</span>
                  <span className="ml-2">{formatCurrency(trade.entryPrice)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Exit:</span>
                  <span className="ml-2">{trade.exitPrice ? formatCurrency(trade.exitPrice) : '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Risk:</span>
                  <span className="ml-2">{formatCurrency(trade.riskAmount)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">R:R:</span>
                  <span className="ml-2">{trade.riskRewardRatio.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {trade.result && getResultIcon(trade.result)}
                  <span className={cn('text-sm capitalize', trade.result && getResultColor(trade.result))}>
                    {trade.result || 'Pending'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-lg', getMoodColor(trade.mood))}>
                    {getMoodEmoji(trade.mood)}
                  </span>
                  <span className={cn(
                    'font-medium',
                    (trade.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                  )}>
                    {formatCurrency(trade.pnl || 0)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                {formatRelativeTime(trade.entryTime)}
              </div>

              {trade.notes && (
                <div className="text-sm text-muted-foreground bg-muted/30 rounded p-2">
                  {trade.notes}
                </div>
              )}
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