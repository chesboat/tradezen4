import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Plus, Calendar, ChevronDown, Grid3X3 } from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useTagStore } from '@/store/useTagStore';
import { useClassificationStore } from '@/store/useClassificationStore';
import { cn } from '@/lib/utils';
import { Trade, TradeResult, MoodType, TradeClassifications } from '@/types';
import { ClassificationPicker } from './ClassificationPicker';
import toast from 'react-hot-toast';

interface InlineTradeEntryProps {
  onClose: () => void;
  onSuccess?: () => void;
  /** Optional date string (YYYY-MM-DD) to pre-set the trade date */
  defaultDate?: string;
}

// Mood options with emojis
const MOODS: { value: MoodType; emoji: string; label: string }[] = [
  { value: 'excellent', emoji: '🔥', label: 'Excellent' },
  { value: 'good', emoji: '😊', label: 'Good' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'poor', emoji: '😕', label: 'Poor' },
  { value: 'terrible', emoji: '😫', label: 'Terrible' },
];

/**
 * Spreadsheet-style inline trade entry
 * Tab through fields, Enter to save, Escape to cancel
 */
export const InlineTradeEntry: React.FC<InlineTradeEntryProps> = ({ onClose, onSuccess, defaultDate }) => {
  const { addTrade } = useTradeStore();
  const { selectedAccountId, accounts } = useAccountFilterStore();
  const { getAllTags } = useTagStore();
  const { getActiveCategories } = useClassificationStore();
  
  // Form state
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [symbol, setSymbol] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [pnl, setPnl] = useState('');
  const [shares, setShares] = useState('');
  const [rr, setRr] = useState('');
  const [mood, setMood] = useState<MoodType | ''>('');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [classifications, setClassifications] = useState<TradeClassifications>({});
  const [showClassifications, setShowClassifications] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Check if there are any categories to show
  const hasCategories = getActiveCategories().length > 0;
  const [tradeDate, setTradeDate] = useState(() => {
    // Use defaultDate if provided (for journal page entries), otherwise use current time
    if (defaultDate) {
      // Set to noon on the specified date to avoid timezone issues
      return `${defaultDate}T12:00`;
    }
    const now = new Date();
    return now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  
  // Refs for field navigation
  const symbolRef = useRef<HTMLInputElement>(null);
  const entryRef = useRef<HTMLInputElement>(null);
  const exitRef = useRef<HTMLInputElement>(null);
  const sharesRef = useRef<HTMLInputElement>(null);
  const pnlRef = useRef<HTMLInputElement>(null);
  const rrRef = useRef<HTMLInputElement>(null);
  const tagRef = useRef<HTMLInputElement>(null);
  
  // Get existing tags for autocomplete (getAllTags returns TagMetadata objects)
  const existingTagsMetadata = getAllTags();
  const existingTags = existingTagsMetadata.map(t => t.name);
  const filteredTags = existingTags.filter(
    tag => tag.toLowerCase().includes(tagInput.toLowerCase()) && !selectedTags.includes(tag)
  );
  
  // Auto-focus symbol field on mount
  useEffect(() => {
    symbolRef.current?.focus();
  }, []);
  
  // Auto-calculate P&L when entry, exit, and shares change
  useEffect(() => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const qty = parseFloat(shares) || 1;
    
    if (!isNaN(entry) && !isNaN(exit) && entry > 0) {
      const multiplier = direction === 'long' ? 1 : -1;
      const calculated = (exit - entry) * qty * multiplier;
      setPnl(calculated.toFixed(2));
    }
  }, [entryPrice, exitPrice, shares, direction]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [onClose]);
  
  // Handle tag input
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && tagInput === '' && selectedTags.length > 0) {
      setSelectedTags(prev => prev.slice(0, -1));
    }
  };
  
  const addTag = (tag?: string) => {
    const newTag = (tag || tagInput).trim().toLowerCase();
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags(prev => [...prev, newTag]);
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };
  
  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };
  
  // Determine trade result from P&L
  const getTradeResult = (pnlValue: number): TradeResult => {
    if (pnlValue >= 0) return 'win'; // Win or scratch (break-even)
    return 'loss';
  };
  
  // Submit the trade
  const handleSubmit = async () => {
    // Validation
    if (!symbol.trim()) {
      toast.error('Symbol is required');
      symbolRef.current?.focus();
      return;
    }
    
    const pnlValue = parseFloat(pnl);
    if (isNaN(pnlValue) && !entryPrice && !exitPrice) {
      toast.error('Enter P&L or Entry/Exit prices');
      pnlRef.current?.focus();
      return;
    }
    
    // Get account ID
    const accountId = selectedAccountId || accounts[0]?.id;
    if (!accountId) {
      toast.error('No account selected');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const tradeDateObj = new Date(tradeDate);
      const finalPnl = isNaN(pnlValue) ? 0 : pnlValue;
      const entryPriceNum = parseFloat(entryPrice) || 0;
      const exitPriceNum = parseFloat(exitPrice) || 0;
      const sharesNum = parseFloat(shares) || 1;
      const rrNum = parseFloat(rr) || 1;
      
      const isLoss = finalPnl < 0;
      
      const newTrade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'> = {
        symbol: symbol.toUpperCase().trim(),
        direction,
        entryPrice: entryPriceNum,
        exitPrice: exitPriceNum,
        quantity: sharesNum,
        pnl: finalPnl,
        riskRewardRatio: isLoss ? 1 : rrNum, // For losses, RR is 1 (lossRR tracks actual loss)
        lossRR: isLoss ? rrNum : undefined, // Only set for losses
        result: getTradeResult(finalPnl),
        entryTime: tradeDateObj.toISOString(),
        exitTime: tradeDateObj.toISOString(),
        mood: mood || 'neutral', // Default to neutral if not selected
        notes: '',
        accountId,
        riskAmount: Math.abs(finalPnl) || 100,
        tags: selectedTags,
        classifications: Object.keys(classifications).length > 0 ? classifications : undefined,
      };
      
      await addTrade(newTrade);
      toast.success(`${symbol.toUpperCase()} added`);
      
      // Reset form for next entry (keep direction and date)
      setSymbol('');
      setEntryPrice('');
      setExitPrice('');
      setPnl('');
      setShares('');
      setRr('');
      setMood('');
      setTagInput('');
      setSelectedTags([]);
      setClassifications({});
      symbolRef.current?.focus();
      
      onSuccess?.();
    } catch (error) {
      console.error('Failed to add trade:', error);
      toast.error('Failed to add trade');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const inputClassName = cn(
    "w-full bg-transparent border-0 border-b border-transparent",
    "focus:border-primary focus:ring-0 focus:outline-none",
    "text-sm px-2 py-2 transition-colors",
    "placeholder:text-muted-foreground/40"
  );
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-primary/5 border-b-2 border-primary/30"
      onKeyDown={handleKeyDown}
    >
      {/* Row 1: Core Trade Data */}
      <div className="flex items-center flex-wrap">
        {/* Direction Toggle */}
        <div className="flex-shrink-0 px-1 border-r border-border/30">
          <button
            onClick={() => setDirection(d => d === 'long' ? 'short' : 'long')}
            className={cn(
              "px-2 py-1.5 rounded text-xs font-bold transition-colors",
              direction === 'long' 
                ? "bg-green-500/20 text-green-600 dark:text-green-400" 
                : "bg-red-500/20 text-red-600 dark:text-red-400"
            )}
            title={`Click to switch to ${direction === 'long' ? 'Short' : 'Long'}`}
          >
            {direction === 'long' ? 'L' : 'S'}
          </button>
        </div>
        
        {/* Symbol */}
        <div className="w-16 sm:w-20 flex-shrink-0 border-r border-border/30">
          <input
            ref={symbolRef}
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="SYM"
            className={cn(inputClassName, "font-semibold uppercase")}
            autoComplete="off"
          />
        </div>
        
        {/* Entry Price */}
        <div className="w-16 sm:w-20 flex-shrink-0 border-r border-border/30">
          <input
            ref={entryRef}
            type="text"
            inputMode="decimal"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder="Entry"
            className={cn(inputClassName, "text-right tabular-nums")}
            autoComplete="off"
          />
        </div>
        
        {/* Exit Price */}
        <div className="w-16 sm:w-20 flex-shrink-0 border-r border-border/30">
          <input
            ref={exitRef}
            type="text"
            inputMode="decimal"
            value={exitPrice}
            onChange={(e) => setExitPrice(e.target.value)}
            placeholder="Exit"
            className={cn(inputClassName, "text-right tabular-nums")}
            autoComplete="off"
          />
        </div>
        
        {/* Shares/Qty */}
        <div className="w-14 sm:w-16 flex-shrink-0 border-r border-border/30">
          <input
            ref={sharesRef}
            type="text"
            inputMode="decimal"
            value={shares}
            onChange={(e) => setShares(e.target.value)}
            placeholder="Qty"
            className={cn(inputClassName, "text-right tabular-nums")}
            autoComplete="off"
          />
        </div>
        
        {/* P&L */}
        <div className="w-16 sm:w-20 flex-shrink-0 border-r border-border/30">
          <input
            ref={pnlRef}
            type="text"
            inputMode="decimal"
            value={pnl}
            onChange={(e) => setPnl(e.target.value)}
            placeholder="P&L"
            className={cn(
              inputClassName, 
              "text-right tabular-nums font-medium",
              parseFloat(pnl) > 0 && "text-green-600 dark:text-green-400",
              parseFloat(pnl) < 0 && "text-red-600 dark:text-red-400"
            )}
            autoComplete="off"
          />
        </div>
        
        {/* R:R */}
        <div className="w-10 sm:w-12 flex-shrink-0 border-r border-border/30">
          <input
            ref={rrRef}
            type="text"
            inputMode="decimal"
            value={rr}
            onChange={(e) => setRr(e.target.value)}
            placeholder="R"
            className={cn(inputClassName, "text-right tabular-nums")}
            autoComplete="off"
          />
        </div>
        
        {/* Actions - on same row */}
        <div className="flex items-center gap-1 px-2 ml-auto">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="p-1.5 rounded hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-colors"
            title="Save (Enter)"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-colors"
            title="Cancel (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Row 2: Mood, Tags, Date */}
      <div className="flex items-center border-t border-border/20 bg-muted/20">
        {/* Mood Selector */}
        <div className="flex items-center gap-0.5 px-2 py-1 border-r border-border/30">
          {MOODS.map(({ value, emoji, label }) => (
            <button
              key={value}
              onClick={() => setMood(mood === value ? '' : value)}
              className={cn(
                "w-6 h-6 rounded text-sm transition-all",
                mood === value 
                  ? "bg-primary/20 scale-110" 
                  : "opacity-50 hover:opacity-100 hover:bg-muted/50"
              )}
              title={label}
            >
              {emoji}
            </button>
          ))}
        </div>
        
        {/* Tags Input */}
        <div className="flex-1 min-w-0 border-r border-border/30 relative">
          <div className="flex items-center gap-1 px-2 py-1 flex-wrap">
            {selectedTags.map(tag => (
              <span 
                key={tag}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] rounded"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
              </span>
            ))}
            <input
              ref={tagRef}
              type="text"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setShowTagSuggestions(true);
              }}
              onFocus={() => setShowTagSuggestions(true)}
              onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
              onKeyDown={handleTagKeyDown}
              placeholder={selectedTags.length === 0 ? "tags..." : ""}
              className="flex-1 min-w-[60px] bg-transparent border-0 focus:ring-0 focus:outline-none text-xs placeholder:text-muted-foreground/40 py-1"
              autoComplete="off"
            />
          </div>
          
          {/* Tag Suggestions Dropdown - Opens upward to avoid clipping */}
          {showTagSuggestions && filteredTags.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 bg-popover border border-border rounded-t shadow-lg z-[200] max-h-40 overflow-y-auto mb-1">
              {filteredTags.slice(0, 5).map(tag => (
                <button
                  key={tag}
                  onMouseDown={() => addTag(tag)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Classifications Toggle */}
        {hasCategories && (
          <div className="flex-shrink-0 px-1 border-r border-border/30">
            <button
              onClick={() => setShowClassifications(!showClassifications)}
              className={cn(
                "p-1.5 rounded transition-colors flex items-center gap-1",
                showClassifications 
                  ? "bg-primary/20 text-primary" 
                  : Object.keys(classifications).length > 0
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              title="Trade classifications"
            >
              <Grid3X3 className="w-4 h-4" />
              {Object.keys(classifications).length > 0 && (
                <span className="text-[10px] font-medium">{Object.keys(classifications).length}</span>
              )}
            </button>
          </div>
        )}
        
        {/* Date/Time Toggle */}
        <div className="flex-shrink-0 px-2">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className={cn(
              "p-1.5 rounded transition-colors",
              showDatePicker ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            title="Change date/time"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Classifications Picker (expandable) */}
      <AnimatePresence>
        {showClassifications && hasCategories && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-3 border-t border-border/30 bg-muted/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <Grid3X3 className="w-3.5 h-3.5 text-muted-foreground" />
              <label className="text-xs font-medium text-muted-foreground">Classifications</label>
            </div>
            <ClassificationPicker
              value={classifications}
              onChange={setClassifications}
              compact
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Date/Time Picker (expandable) */}
      <AnimatePresence>
        {showDatePicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-2 py-2 border-t border-border/30 bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground">Trade Date/Time:</label>
              <input
                type="datetime-local"
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
                className="px-2 py-1 text-xs bg-background border border-border rounded focus:outline-none focus:border-primary"
              />
              <button
                onClick={() => setTradeDate(new Date().toISOString().slice(0, 16))}
                className="text-xs text-primary hover:underline"
              >
                Reset to now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Helper text */}
      <div className="px-2 py-1 text-[10px] text-muted-foreground/60 flex items-center gap-3">
        <span><kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">Tab</kbd> next</span>
        <span><kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">Enter</kbd> save</span>
        <span><kbd className="px-1 py-0.5 rounded bg-muted text-[9px]">Esc</kbd> close</span>
        <span className="ml-auto opacity-60">P&L auto-calculates • Click L/S to toggle direction</span>
      </div>
    </motion.div>
  );
};

/**
 * Compact button to trigger inline entry
 */
export const InlineEntryTrigger: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
        "text-sm text-muted-foreground hover:text-foreground",
        "hover:bg-accent/50 transition-colors",
        "border border-dashed border-border/50 hover:border-primary/30"
      )}
    >
      <Plus className="w-3.5 h-3.5" />
      <span>Quick add</span>
      <kbd className="ml-1 px-1.5 py-0.5 rounded bg-muted/50 text-[10px] font-mono">N</kbd>
    </button>
  );
};
