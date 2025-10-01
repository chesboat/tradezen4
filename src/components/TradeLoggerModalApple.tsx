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
  Check
} from 'lucide-react';
import { useTradeActions } from '@/store/useTradeStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { Trade, TradeDirection, TradeResult } from '@/types';
import { formatCurrency, getRecentSymbols, addRecentSymbol } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';

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
  
  // Form state
  const [symbol, setSymbol] = useState('');
  const [direction, setDirection] = useState<TradeDirection>('long');
  const [result, setResult] = useState<TradeResult | null>(null);
  const [pnl, setPnl] = useState('');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
        setNote('');
        setShowNote(false);
        setShowSymbolPicker(false);
      }, 300);
    }
  }, [isOpen]);

  // Load editing trade
  useEffect(() => {
    if (editingTrade && isOpen) {
      setSymbol(editingTrade.symbol);
      setDirection(editingTrade.direction);
      setResult(editingTrade.result || null);
      setPnl(editingTrade.pnl?.toString() || '');
      setNote(editingTrade.notes || '');
      setShowNote(!!editingTrade.notes);
    }
  }, [editingTrade, isOpen]);

  const handleSubmit = async () => {
    if (!symbol || !result || !pnl || !selectedAccountId) return;
    
    setIsSubmitting(true);
    
    try {
      const pnlValue = parseFloat(pnl);
      
      const tradeData = {
        symbol: symbol.toUpperCase(),
        direction,
        result,
        pnl: result === 'loss' ? -Math.abs(pnlValue) : Math.abs(pnlValue),
        entryPrice: 0,
        exitPrice: result === 'win' ? Math.abs(pnlValue) : 0,
        quantity: 1,
        riskAmount: Math.abs(pnlValue),
        riskRewardRatio: 1,
        entryTime: new Date().toISOString(),
        mood: 'neutral' as const,
        tags: [] as string[],
        notes: note,
        accountId: selectedAccountId,
      };

      if (editingTrade) {
        await updateTrade(editingTrade.id, tradeData);
      } else {
        await addTrade(tradeData);
        addRecentSymbol(symbol.toUpperCase());
      }

      // Add activity
      addActivity({
        type: 'trade',
        title: `${symbol.toUpperCase()} ${direction.toUpperCase()} - ${result.toUpperCase()}`,
        description: `${result === 'win' ? 'Won' : result === 'loss' ? 'Lost' : 'Broke even on'} ${formatCurrency(Math.abs(pnlValue))}`,
        relatedId: editingTrade?.id,
        accountId: selectedAccountId,
      });

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
              "fixed z-[100] bg-background flex flex-col overflow-hidden",
              // Desktop: Centered card
              "md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
              "md:w-full md:max-w-md md:rounded-2xl md:border md:border-border/50 md:shadow-2xl",
              // Mobile: Bottom sheet
              "inset-x-0 bottom-0 top-20 rounded-t-3xl"
            )}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              
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
                    className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground font-medium text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="AAPL"
                  />
                  
                  {/* Recent Symbols Dropdown */}
                  {showSymbolPicker && recentSymbols.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden z-10"
                    >
                      {recentSymbols.slice(0, 5).map((sym) => (
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

              {/* Outcome */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Outcome
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setResult('win')}
                    className={cn(
                      "flex flex-col items-center justify-center py-4 rounded-xl font-medium transition-all",
                      result === 'win'
                        ? "bg-green-500 text-white"
                        : "bg-muted/30 text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Trophy className="w-5 h-5 mb-1" />
                    <span className="text-sm">Win</span>
                  </button>
                  <button
                    onClick={() => setResult('loss')}
                    className={cn(
                      "flex flex-col items-center justify-center py-4 rounded-xl font-medium transition-all",
                      result === 'loss'
                        ? "bg-red-500 text-white"
                        : "bg-muted/30 text-foreground hover:bg-muted/50"
                    )}
                  >
                    <AlertCircle className="w-5 h-5 mb-1" />
                    <span className="text-sm">Loss</span>
                  </button>
                  <button
                    onClick={() => setResult('breakeven')}
                    className={cn(
                      "flex flex-col items-center justify-center py-4 rounded-xl font-medium transition-all",
                      result === 'breakeven'
                        ? "bg-yellow-500 text-white"
                        : "bg-muted/30 text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Minus className="w-5 h-5 mb-1" />
                    <span className="text-sm">Scratch</span>
                  </button>
                </div>
              </div>

              {/* P&L - Only show if result is selected */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-muted-foreground">
                      P&L Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">
                        $
                      </span>
                      <input
                        ref={pnlInputRef}
                        type="number"
                        value={pnl}
                        onChange={(e) => setPnl(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground font-medium text-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Note - Optional */}
              <div className="space-y-2">
                {!showNote ? (
                  <button
                    onClick={() => setShowNote(true)}
                    className="w-full py-2 text-sm text-primary hover:text-primary/80 transition-colors text-left"
                  >
                    + Add Note
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium text-muted-foreground">
                      Note (Optional)
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl text-foreground text-sm resize-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Quick thoughts about this trade..."
                      rows={3}
                    />
                  </motion.div>
                )}
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

