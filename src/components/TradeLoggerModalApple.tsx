import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X,
  TrendingUp,
  TrendingDown,
  Trophy,
  AlertCircle,
  Minus,
  ChevronDown,
  Check,
  Info,
  Hash,
  Grid3X3
} from 'lucide-react';
import { useTradeActions } from '@/store/useTradeStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { useClassificationStore } from '@/store/useClassificationStore';
import { Trade, TradeDirection, TradeResult, TradeClassifications } from '@/types';
import { formatCurrency, getRecentSymbols, addRecentSymbol } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';
import { TagInput } from './TagInput';
import { ClassificationPicker } from './ClassificationPicker';
import { invalidateCacheImmediate } from '@/lib/cacheInvalidation';

interface TradeLoggerModalAppleProps {
  isOpen: boolean;
  onClose: () => void;
  editingTrade?: Trade | null;
}

export const TradeLoggerModalApple: React.FC<TradeLoggerModalAppleProps> = ({ 
  isOpen, 
  onClose, 
  editingTrade 
}) => {
  const { addTrade, updateTrade } = useTradeActions();
  const { selectedAccountId } = useAccountFilterStore();
  const { addActivity } = useActivityLogStore();
  const { getActiveCategories } = useClassificationStore();
  
  // Form state
  const [symbol, setSymbol] = useState('');
  const [direction, setDirection] = useState<TradeDirection>('long');
  const [result, setResult] = useState<TradeResult | null>(null);
  const [pnl, setPnl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [classifications, setClassifications] = useState<TradeClassifications>({});
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeDate, setTradeDate] = useState<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [tradeTime, setTradeTime] = useState<string>(''); // HH:MM (empty = use current time)
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [showClassifications, setShowClassifications] = useState(false);
  const [showNotesInput, setShowNotesInput] = useState(false);
  
  // Check if there are any categories to show
  const hasCategories = getActiveCategories().length > 0;
  
  const [recentSymbols, setRecentSymbols] = useState<string[]>([]);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  
  const symbolInputRef = useRef<HTMLInputElement>(null);
  const pnlInputRef = useRef<HTMLInputElement>(null);

  // Load recent symbols
  useEffect(() => {
    if (isOpen) {
      setRecentSymbols(getRecentSymbols());
      // Focus symbol input on open
      setTimeout(() => symbolInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSymbol('');
        setDirection('long');
        setResult(null);
        setPnl('');
        setTags([]);
        setClassifications({});
        setNotes('');
        setTradeDate(new Date().toISOString().split('T')[0]);
        setTradeTime('');
        setShowSymbolPicker(false);
        setShowDateTimePicker(false);
        setShowTagInput(false);
        setShowClassifications(false);
        setShowNotesInput(false);
      }, 300);
    }
  }, [isOpen]);

  // Load editing trade
  useEffect(() => {
    if (editingTrade && isOpen) {
      setSymbol(editingTrade.symbol);
      setDirection(editingTrade.direction);
      setResult(editingTrade.result || null);
      setPnl(Math.abs(editingTrade.pnl || 0).toString());
      setTags(editingTrade.tags || []);
      setClassifications(editingTrade.classifications || {});
      setNotes(editingTrade.notes || '');
      
      // Load date and time from editing trade
      const entryDate = new Date(editingTrade.entryTime);
      setTradeDate(entryDate.toISOString().split('T')[0]);
      const hours = entryDate.getHours().toString().padStart(2, '0');
      const minutes = entryDate.getMinutes().toString().padStart(2, '0');
      setTradeTime(`${hours}:${minutes}`);
      
      // Show tag/notes/classifications inputs if they have values
      if (editingTrade.tags && editingTrade.tags.length > 0) {
        setShowTagInput(true);
      }
      if (editingTrade.classifications && Object.keys(editingTrade.classifications).length > 0) {
        setShowClassifications(true);
      }
      if (editingTrade.notes) {
        setShowNotesInput(true);
      }
    }
  }, [editingTrade, isOpen]);

  const handleSubmit = async () => {
    if (!symbol || !result || !selectedAccountId) return;
    if (!pnl) return; // P&L is always required
    
    setIsSubmitting(true);
    
    try {
      const pnlValue = parseFloat(pnl);
      
      // Calculate risk amount: If 2R profit = $343, then 1R = $343/2 = $171.50
      // For now, we default to 1R (actual R:R can be edited inline in trades table)
      const defaultRR = 1;
      const calculatedRiskAmount = Math.abs(pnlValue) / defaultRR;
      
      // Build entry time from date and time (parse as local date to avoid timezone issues)
      let entryTime: Date;
      const [year, month, day] = tradeDate.split('-').map(Number);
      entryTime = new Date(year, month - 1, day);
      
      if (tradeTime) {
        // Use custom time
        const [hours, minutes] = tradeTime.split(':').map(Number);
        entryTime.setHours(hours, minutes, 0, 0);
      } else {
        // Use current time
        const now = new Date();
        entryTime.setHours(now.getHours(), now.getMinutes(), 0, 0);
      }
      
      // Auto-extract tags from notes (hashtags)
      const noteTags = (notes.match(/#([a-zA-Z0-9_-]+)/g) || [])
        .map(t => t.slice(1).toLowerCase());
      const allTags = [...new Set([...tags, ...noteTags])]; // Merge and dedupe
      
      const tradeData = {
        symbol: symbol.toUpperCase(),
        direction,
        result,
        pnl: result === 'loss' ? -Math.abs(pnlValue) : Math.abs(pnlValue),
        entryPrice: 0,
        exitPrice: result === 'win' ? Math.abs(pnlValue) : 0,
        quantity: 1,
        riskAmount: calculatedRiskAmount,
        riskRewardRatio: defaultRR,
        entryTime: entryTime.toISOString(),
        mood: 'neutral' as const,
        tags: allTags,
        notes: notes,
        accountId: selectedAccountId,
        classifications: Object.keys(classifications).length > 0 ? classifications : undefined,
      };

      let tradeId: string | undefined;
      
      if (editingTrade) {
        await updateTrade(editingTrade.id, tradeData);
        tradeId = editingTrade.id;
      } else {
        const newTrade = await addTrade(tradeData);
        tradeId = newTrade.id;
        addRecentSymbol(symbol.toUpperCase());
      }

      // Add activity (await to ensure it's saved before closing modal)
      try {
        await addActivity({
          type: 'trade',
          title: `${symbol.toUpperCase()} ${direction.toUpperCase()} - ${result.toUpperCase()}`,
          description: `${result === 'win' ? 'Won' : result === 'loss' ? 'Lost' : 'Broke even on'} ${formatCurrency(Math.abs(pnlValue))}`,
          relatedId: tradeId,
          accountId: selectedAccountId,
        });
        console.log('✅ Activity log entry created for trade:', tradeId);
      } catch (activityError) {
        console.error('❌ Failed to create activity log entry:', activityError);
        // Don't block trade creation if activity log fails
      }

      // Invalidate cache to ensure all UI reflects new trade
      await invalidateCacheImmediate('trade');
      console.log('✅ Cache invalidated after trade action');

      // Success - close modal
      onClose();
    } catch (error) {
      console.error('Failed to save trade:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = symbol && result && pnl && !isSubmitting;

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
          
          {/* Modal */}
          <motion.div
            className={cn(
              "fixed z-[100] bg-background flex flex-col",
              // Mobile: Bottom sheet
              "left-0 right-0 bottom-0 rounded-t-3xl",
              "top-[5rem]", // 80px (top-20 equivalent)
              // Desktop: Perfectly centered modal (Apple style) - !important forces override
              "md:!top-1/2 md:!left-1/2 md:!-translate-x-1/2 md:!-translate-y-1/2 md:!bottom-auto md:!right-auto",
              "md:w-full md:max-w-md md:rounded-2xl md:border md:border-border/50 md:shadow-2xl"
            )}
            initial={{ 
              opacity: 0,
              scale: 0.95,
              y: window.innerWidth >= 768 ? 0 : "100%" // Only slide up on mobile
            }}
            animate={{ 
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{ 
              opacity: 0,
              scale: 0.95,
              y: window.innerWidth >= 768 ? 0 : "100%"
            }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border/50">
              <h2 className="text-lg font-semibold text-foreground">
                {editingTrade ? 'Edit Trade' : 'Log Trade'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - No scroll needed */}
            <div className="p-4 md:p-6 space-y-5">
              
              {/* Symbol */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Symbol
                </label>
                <div className="relative">
                  <input
                    ref={symbolInputRef}
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    onFocus={() => setShowSymbolPicker(true)}
                    onBlur={() => {
                      // Delay to allow clicking on dropdown items
                      setTimeout(() => setShowSymbolPicker(false), 150);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setShowSymbolPicker(false);
                        symbolInputRef.current?.blur();
                      }
                    }}
                    className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground font-medium text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="AAPL"
                  />
                  
                  {/* Recent Symbols Dropdown */}
                  {showSymbolPicker && recentSymbols.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onMouseDown={(e) => e.preventDefault()} // Prevent blur when clicking dropdown
                      className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden z-10"
                    >
                      {recentSymbols
                        .filter(sym => sym.includes(symbol) || symbol === '') // Filter based on input
                        .slice(0, 5)
                        .map((sym) => (
                          <button
                            key={sym}
                            onClick={() => {
                              setSymbol(sym);
                              setShowSymbolPicker(false);
                              symbolInputRef.current?.blur();
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-muted/50 transition-colors text-sm"
                          >
                            {sym}
                          </button>
                        ))}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Direction */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Direction
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDirection('long')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all",
                      direction === 'long'
                        ? "bg-green-500 text-white"
                        : "bg-muted/30 text-foreground hover:bg-muted/50"
                    )}
                  >
                    <TrendingUp className="w-5 h-5" />
                    Long
                  </button>
                  <button
                    onClick={() => setDirection('short')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all",
                      direction === 'short'
                        ? "bg-red-500 text-white"
                        : "bg-muted/30 text-foreground hover:bg-muted/50"
                    )}
                  >
                    <TrendingDown className="w-5 h-5" />
                    Short
                  </button>
                </div>
              </div>

              {/* Outcome + P&L - Inline */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Outcome
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setResult('win');
                      setTimeout(() => pnlInputRef.current?.focus(), 100);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 rounded-xl font-medium transition-all",
                      result === 'win'
                        ? "bg-green-500 text-white"
                        : "bg-muted/30 text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Trophy className="w-5 h-5 mb-1" />
                    <span className="text-sm">Win</span>
                  </button>
                  <button
                    onClick={() => {
                      setResult('loss');
                      setTimeout(() => pnlInputRef.current?.focus(), 100);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 rounded-xl font-medium transition-all",
                      result === 'loss'
                        ? "bg-red-500 text-white"
                        : "bg-muted/30 text-foreground hover:bg-muted/50"
                    )}
                  >
                    <AlertCircle className="w-5 h-5 mb-1" />
                    <span className="text-sm">Loss</span>
                  </button>
                </div>
                
                {/* P&L appears inline below outcome */}
                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-2"
                    >
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                          $
                        </span>
                        <input
                          ref={pnlInputRef}
                          type="number"
                          value={pnl}
                          onChange={(e) => setPnl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && canSubmit) {
                              handleSubmit();
                            }
                          }}
                          className="w-full pl-8 pr-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground font-medium text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                          placeholder="Enter exact P&L"
                          step="0.01"
                        />
                      </div>
                      <div className="flex items-center gap-1 mt-1 px-1">
                        <Info className="w-3 h-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          Enter net P&L after fees
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Date & Time (Optional - Apple-style collapsed) */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowDateTimePicker(!showDateTimePicker)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 hover:bg-muted/30 rounded-lg transition-colors text-sm"
                >
                  <span className="text-muted-foreground">
                    {tradeDate === new Date().toISOString().split('T')[0] 
                      ? 'Today' 
                      : new Date(tradeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {tradeTime && ` • ${new Date(`2000-01-01T${tradeTime}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                  </span>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    showDateTimePicker && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {showDateTimePicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 pt-2"
                    >
                      {/* Quick Date Shortcuts */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTradeDate(new Date().toISOString().split('T')[0])}
                          className={cn(
                            "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                            tradeDate === new Date().toISOString().split('T')[0]
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted/30 text-foreground hover:bg-muted/50"
                          )}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const yesterday = new Date();
                            yesterday.setDate(yesterday.getDate() - 1);
                            setTradeDate(yesterday.toISOString().split('T')[0]);
                          }}
                          className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-muted/30 text-foreground hover:bg-muted/50 transition-colors"
                        >
                          Yesterday
                        </button>
                      </div>

                      {/* Date Picker */}
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1 px-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={tradeDate}
                          onChange={(e) => setTradeDate(e.target.value)}
                          className="w-full px-3 py-2 bg-muted/30 border border-border/50 rounded-lg text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>

                      {/* Time Picker (Optional) */}
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1 px-1">
                          Time (optional)
                        </label>
                        <input
                          type="time"
                          value={tradeTime}
                          onChange={(e) => setTradeTime(e.target.value)}
                          className="w-full px-3 py-2 bg-muted/30 border border-border/50 rounded-lg text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Current time"
                        />
                        {!tradeTime && (
                          <p className="text-xs text-muted-foreground mt-1 px-1">
                            Leave empty to use current time
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tags (Optional - Apple-style collapsed) */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowTagInput(!showTagInput)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 hover:bg-muted/30 rounded-lg transition-colors text-sm"
                >
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="w-4 h-4" />
                    <span>{tags.length > 0 ? `${tags.length} ${tags.length === 1 ? 'tag' : 'tags'}` : 'Add Tags'}</span>
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    showTagInput && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {showTagInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-2"
                    >
                      <TagInput
                        value={tags}
                        onChange={setTags}
                        placeholder="e.g. breakout, reversal, momentum"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5 px-1">
                        Tag your setups to track which strategies work best
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Classifications (Optional - Apple-style collapsed) */}
              {hasCategories && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowClassifications(!showClassifications)}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 hover:bg-muted/30 rounded-lg transition-colors text-sm"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Grid3X3 className="w-4 h-4" />
                      <span>
                        {Object.keys(classifications).length > 0 
                          ? `${Object.keys(classifications).length} ${Object.keys(classifications).length === 1 ? 'classification' : 'classifications'}` 
                          : 'Add Classifications'}
                      </span>
                    </div>
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform",
                      showClassifications && "rotate-180"
                    )} />
                  </button>

                  <AnimatePresence>
                    {showClassifications && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pt-2"
                      >
                        <ClassificationPicker
                          value={classifications}
                          onChange={setClassifications}
                        />
                        <p className="text-xs text-muted-foreground mt-2 px-1">
                          Classify trades to see stats by category
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Notes (Optional - Apple-style collapsed) */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowNotesInput(!showNotesInput)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 hover:bg-muted/30 rounded-lg transition-colors text-sm"
                >
                  <span className="text-muted-foreground">
                    {notes ? 'Edit Note' : 'Add Note'}
                  </span>
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform",
                    showNotesInput && "rotate-180"
                  )} />
                </button>

                <AnimatePresence>
                  {showNotesInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-2"
                    >
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Quick note about this trade... (use #hashtags for tags)"
                        className="w-full px-3 py-2 bg-muted/30 border border-border/50 rounded-lg text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                        rows={3}
                      />
                      <p className="text-xs text-muted-foreground mt-1.5 px-1">
                        Use #hashtags to automatically tag trades
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 md:p-6 border-t border-border/50 bg-muted/20">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={cn(
                  "w-full py-3 rounded-xl font-semibold transition-all",
                  canSubmit
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                )}
              >
                {isSubmitting ? 'Saving...' : editingTrade ? 'Update Trade' : 'Log Trade'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

