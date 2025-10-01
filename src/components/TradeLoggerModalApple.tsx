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
  Info
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
      setPnl(Math.abs(editingTrade.pnl || 0).toString());
    }
  }, [editingTrade, isOpen]);

  const handleSubmit = async () => {
    if (!symbol || !result || !selectedAccountId) return;
    if (result !== 'breakeven' && !pnl) return;
    
    setIsSubmitting(true);
    
    try {
      const pnlValue = result === 'breakeven' ? 0 : parseFloat(pnl);
      
      // Calculate risk amount: If 2R profit = $343, then 1R = $343/2 = $171.50
      // For now, we default to 1R (actual R:R can be edited inline in trades table)
      const defaultRR = 1;
      const calculatedRiskAmount = Math.abs(pnlValue) / defaultRR;
      
      const tradeData = {
        symbol: symbol.toUpperCase(),
        direction,
        result,
        pnl: result === 'loss' ? -Math.abs(pnlValue) : result === 'breakeven' ? 0 : Math.abs(pnlValue),
        entryPrice: 0,
        exitPrice: result === 'win' ? Math.abs(pnlValue) : 0,
        quantity: 1,
        riskAmount: calculatedRiskAmount,
        riskRewardRatio: defaultRR,
        entryTime: new Date().toISOString(),
        mood: 'neutral' as const,
        tags: [] as string[],
        notes: '',
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

  const canSubmit = symbol && result && (result === 'breakeven' || pnl) && !isSubmitting;

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
                  <button
                    onClick={() => {
                      setResult('breakeven');
                      setPnl('0');
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center py-3 rounded-xl font-medium transition-all",
                      result === 'breakeven'
                        ? "bg-yellow-500 text-white"
                        : "bg-muted/30 text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Minus className="w-5 h-5 mb-1" />
                    <span className="text-sm">Scratch</span>
                  </button>
                </div>
                
                {/* P&L appears inline below outcome */}
                <AnimatePresence>
                  {result && result !== 'breakeven' && (
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

