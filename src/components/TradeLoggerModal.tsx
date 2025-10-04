import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Zap,
  Plus,
  MessageCircle,
  Trophy,
  Check,
  Sparkles,
  Edit3,
  Calendar,
  Calculator,
  Tag as TagIcon,
  Camera,
  FileDown
} from 'lucide-react';
import { useTradeActions } from '@/store/useTradeStore';
import { useAccountFilterStore, getAccountIdsForSelection } from '@/store/useAccountFilterStore';
import { useSessionStore } from '@/store/useSessionStore';
import { useNudgeStore } from '@/store/useNudgeStore';
import { evaluateRules } from '@/lib/rules/engine';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { useQuestStore } from '@/store/useQuestStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { TagInput } from '@/components/TagPill';
import TradeImageImport from '@/components/TradeImageImport';
import TradeCSVImport from '@/components/TradeCSVImport';
import { Trade, TradeDirection, MoodType, TradeResult } from '@/types';
import { formatCurrency, localStorage, STORAGE_KEYS, getRecentSymbols, addRecentSymbol, getMostRecentSymbol } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';

interface TradeLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTrade?: Trade | null;
}

interface QuickTradeData {
  symbol: string;
  direction: TradeDirection;
  riskAmount: number;
  riskRewardRatio: number;
  result?: TradeResult;
  mood: MoodType;
  notes: string;
  customPnl?: number;
  entryDate: string; // YYYY-MM-DD format
  tags: string[];
}

const riskPresets = [25, 50, 100, 200, 500];
const rrRatios = [1, 1.5, 2, 2.5, 3, 4, 5];

const moodEmojis: { value: MoodType; emoji: string; label: string }[] = [
  { value: 'excellent', emoji: '🤩', label: 'Excellent' },
  { value: 'good', emoji: '😊', label: 'Good' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'poor', emoji: '😕', label: 'Poor' },
  { value: 'terrible', emoji: '😢', label: 'Terrible' },
];

// Dynamic recent symbols loaded from localStorage

export const TradeLoggerModal: React.FC<TradeLoggerModalProps> = ({ 
  isOpen, 
  onClose, 
  editingTrade 
}) => {
  const { addTrade, updateTrade } = useTradeActions();
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { addActivity } = useActivityLogStore();
  const { quests, updateQuestProgress, updateConsistencyProgress } = useQuestStore();
  const { isLockedOut: isLockedOutFn, lockoutUntil, cancelLockout } = useSessionStore();
  
  // Load saved defaults - use most recent symbol
  const savedDefaults = localStorage.getItem(STORAGE_KEYS.TRADE_LOGGER_DEFAULTS, {
    symbol: getMostRecentSymbol(),
    direction: 'long' as TradeDirection,
    riskAmount: 100,
    riskRewardRatio: 2,
    mood: 'neutral' as MoodType,
  });

  const [formData, setFormData] = useState<QuickTradeData>({
    symbol: savedDefaults.symbol,
    direction: savedDefaults.direction,
    riskAmount: savedDefaults.riskAmount,
    riskRewardRatio: savedDefaults.riskRewardRatio,
    result: undefined,
    mood: savedDefaults.mood,
    notes: '',
    entryDate: new Date().toISOString().split('T')[0], // Today's date as default
    tags: [],
  });

  const [showNotes, setShowNotes] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSymbolInput, setShowSymbolInput] = useState(false);
  const [showCustomRisk, setShowCustomRisk] = useState(false);
  const [showCustomRR, setShowCustomRR] = useState(false);
  const [customRiskInput, setCustomRiskInput] = useState('');
  const [customRRInput, setCustomRRInput] = useState('');
  const [showCustomPnl, setShowCustomPnl] = useState(false);
  const [customPnlInput, setCustomPnlInput] = useState('');
  const [recentSymbols, setRecentSymbols] = useState<string[]>(getRecentSymbols());
  const [lockoutRemaining, setLockoutRemaining] = useState<string | null>(null);
  const [showImageImport, setShowImageImport] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const { allTags } = useQuickNoteStore();
  
  const symbolInputRef = useRef<HTMLInputElement>(null);
  const riskInputRef = useRef<HTMLInputElement>(null);
  const rrInputRef = useRef<HTMLInputElement>(null);
  const pnlInputRef = useRef<HTMLInputElement>(null);

  // Refresh recent symbols when modal opens
  useEffect(() => {
    if (isOpen) {
      setRecentSymbols(getRecentSymbols());
    }
  }, [isOpen]);

  // Lockout countdown (UI only, does not block logging)
  useEffect(() => {
    const update = () => {
      const until = lockoutUntil as any as number | null;
      if (!until) { setLockoutRemaining(null); return; }
      const ms = until - Date.now();
      if (ms <= 0) { setLockoutRemaining(null); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLockoutRemaining(`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lockoutUntil, isOpen]);

  // Auto-save defaults when form changes
  useEffect(() => {
    const defaults = {
      symbol: formData.symbol,
      direction: formData.direction,
      riskAmount: formData.riskAmount,
      riskRewardRatio: formData.riskRewardRatio,
      mood: formData.mood,
    };
    localStorage.setItem(STORAGE_KEYS.TRADE_LOGGER_DEFAULTS, defaults);
  }, [formData.symbol, formData.direction, formData.riskAmount, formData.riskRewardRatio, formData.mood]);

  // Reset form when modal opens or populate with editing data
  useEffect(() => {
    if (isOpen) {
      if (editingTrade) {
        // Populate form with existing trade data
        setFormData({
          symbol: editingTrade.symbol,
          direction: editingTrade.direction,
          riskAmount: editingTrade.riskAmount,
          riskRewardRatio: editingTrade.riskRewardRatio,
          result: editingTrade.result,
          mood: editingTrade.mood,
          notes: editingTrade.notes || '',
          customPnl: editingTrade.pnl,
          entryDate: new Date(editingTrade.entryTime).toISOString().split('T')[0],
          tags: editingTrade.tags || [],
        });
        setShowNotes(!!editingTrade.notes);
      } else {
        // Reset form for new trade
        setFormData(prev => ({
          ...prev,
          result: undefined,
          notes: '',
          customPnl: undefined,
          entryDate: new Date().toISOString().split('T')[0],
          tags: [],
        }));
        setShowNotes(false);
      }
      setShowSuccess(false);
      setShowSymbolInput(false);
      setShowCustomRisk(false);
      setShowCustomRR(false);
      setShowCustomPnl(false);
      setCustomRiskInput('');
      setCustomRRInput('');
      setCustomPnlInput('');
    }
  }, [isOpen, editingTrade]);

  // Focus inputs when they appear
  useEffect(() => {
    if (showSymbolInput && symbolInputRef.current) {
      symbolInputRef.current.focus();
    }
  }, [showSymbolInput]);

  useEffect(() => {
    if (showCustomRisk && riskInputRef.current) {
      riskInputRef.current.focus();
    }
  }, [showCustomRisk]);

  useEffect(() => {
    if (showCustomRR && rrInputRef.current) {
      rrInputRef.current.focus();
    }
  }, [showCustomRR]);

  useEffect(() => {
    if (showCustomPnl && pnlInputRef.current) {
      pnlInputRef.current.focus();
    }
  }, [showCustomPnl]);

  const handleSymbolChange = (symbol: string) => {
    const cleanSymbol = symbol.toUpperCase();
    setFormData(prev => ({ ...prev, symbol: cleanSymbol }));
    
    // Update recent symbols and refresh the list
    const newRecentSymbols = addRecentSymbol(cleanSymbol);
    setRecentSymbols(newRecentSymbols);
    
    setShowSymbolInput(false);
  };

  const handleCustomRiskSubmit = () => {
    const amount = parseFloat(customRiskInput);
    if (!isNaN(amount) && amount > 0) {
      setFormData(prev => ({ ...prev, riskAmount: amount }));
      setShowCustomRisk(false);
      setCustomRiskInput('');
    }
  };

  const handleCustomRRSubmit = () => {
    const ratio = parseFloat(customRRInput);
    if (!isNaN(ratio) && ratio !== 0) {
      setFormData(prev => ({ ...prev, riskRewardRatio: ratio }));
      setShowCustomRR(false);
      setCustomRRInput('');
    }
  };

  const handleCustomPnlSubmit = () => {
    const pnl = parseFloat(customPnlInput);
    if (!isNaN(pnl)) {
      setFormData(prev => ({ ...prev, customPnl: pnl }));
      setShowCustomPnl(false);
      setCustomPnlInput('');
    }
  };

  const handleSave = async () => {
    console.log('Starting trade save...', { formData, selectedAccountId });
    
    if (!selectedAccountId || !formData.result) {
      console.warn('Missing required data:', { selectedAccountId, result: formData.result });
      return;
    }

    setIsLoading(true);

    try {
      const entryDateTime = new Date(formData.entryDate + 'T09:30:00'); // Default to market open
      const exitDateTime = new Date(entryDateTime.getTime() + (30 * 60 * 1000)); // 30 min later
      const baseXP = 10;
      const winBonus = formData.result === 'win' ? 15 : 0;
      const moodBonus = formData.mood === 'excellent' ? 5 : formData.mood === 'good' ? 3 : 0;
      const totalXP = baseXP + winBonus + moodBonus;

      // Use custom P&L if provided, otherwise calculate from risk/reward
      const calculatedPnl = formData.customPnl !== undefined ? formData.customPnl :
        formData.result === 'win' ? formData.riskAmount * formData.riskRewardRatio : 
        formData.result === 'loss' ? -formData.riskAmount : 0;

      const baseTags: string[] = [];
      if (useSessionStore.getState().isLockedOut()) baseTags.push('lockout-breach');
      // Merge user tags and hashtags from notes
      const noteTags = Array.from((formData.notes.match(/#([a-zA-Z0-9_-]+)/g) || []).map(t => t.slice(1).toLowerCase()));
      const inputTags = (formData.tags || []).map(t => t.toLowerCase());
      const mergedTags = Array.from(new Set([...baseTags, ...inputTags, ...noteTags]));
      const tradeData = {
        symbol: formData.symbol,
        direction: formData.direction,
        entryPrice: 100, // Placeholder - not important for quick logging
        quantity: Math.floor(formData.riskAmount / 1), // Rough estimate
        riskAmount: formData.riskAmount,
        riskRewardRatio: formData.riskRewardRatio,
        result: formData.result,
        pnl: calculatedPnl,
        entryTime: entryDateTime,
        exitTime: exitDateTime,
        mood: formData.mood,
        tags: mergedTags,
        notes: formData.notes,
        accountId: selectedAccountId,
      };

      // Soft guardrail: if selected account has daily loss limit, and this loss would exceed it, warn
      try {
        const { accounts } = useAccountFilterStore.getState();
        const acc = accounts.find(a => a.id === selectedAccountId);
        const limit = (acc as any)?.dailyLossLimit as number | undefined;
        if (typeof limit === 'number' && limit > 0) {
          const today = new Date(); today.setHours(0,0,0,0);
          const sameDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x.getTime() === today.getTime(); };
          const todaysTrades = useTradeStore.getState().trades.filter(t => t.accountId === selectedAccountId && sameDay(new Date(t.entryTime)));
          const pnlSoFar = todaysTrades.reduce((s, t) => s + (t.pnl || 0), 0);
          const projected = pnlSoFar + (tradeData.pnl || 0);
          if (projected <= -limit) {
            useNudgeStore.getState().show(`This trade would exceed daily loss limit (${limit}). Consider reducing size or pausing.`, 'warning');
            // We do NOT block logging. We only auto-lockout if enabled, but after logging completes
            const auto = useSessionStore.getState().rules.autoLockoutEnabled;
            if (auto) {
              // Defer lockout until after save to allow accurate journaling
              setTimeout(() => useSessionStore.getState().startLockout(20), 0);
            }
          }
        }
      } catch {}

      // Evaluate rules (bullets + custom)
      try {
        const account = useAccountFilterStore.getState().accounts.find(a => a.id === selectedAccountId)! as any;
        const today = new Date(); today.setHours(0,0,0,0);
        const sameDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x.getTime() === today.getTime(); };
        const todayTrades = useTradeStore.getState().trades.filter(t => t.accountId === selectedAccountId && sameDay(new Date(t.entryTime)));
        const { accounts } = useAccountFilterStore.getState();
        // Risk used pct
        const accs = [account];
        const limit = accs.every(a => typeof a.dailyLossLimit === 'number') ? accs.reduce((s: number, a: any) => s + (a.dailyLossLimit || 0), 0) : null;
        const lossesAbs = Math.abs(todayTrades.filter(t => (t.pnl || 0) < 0).reduce((s, t) => s + (t.pnl || 0), 0));
        const riskUsedPct = limit && limit > 0 ? Math.min(100, Math.round((lossesAbs / limit) * 100)) : null;
        const ctx = {
          account: account,
          todayTrades: todayTrades,
          now: new Date(),
          justSavedResult: tradeData.result as any,
          minutesSinceLastTrade: null,
          riskUsedPct,
        };
        const decisions = evaluateRules('tradeSaved', ctx as any);
        for (const d of decisions) {
          if (d.type === 'praise' || d.type === 'warn' || d.type === 'nudge') useNudgeStore.getState().show(d.message, d.type === 'praise' ? 'positive' : d.type === 'warn' ? 'warning' : 'neutral');
          if (d.type === 'lockout') { useSessionStore.getState().startLockout(20); useNudgeStore.getState().show(d.message || 'Lockout started', 'neutral'); }
          if (d.type === 'hardStop') { alert(d.message || 'Rule enforced.'); setIsLoading(false); return; }
        }
        // Praise if user reached bullets and stopped (no new trades after reaching) handled on session tick; here we just log the boundary
        if (account?.sessionRules?.maxLossesPerDay && todayTrades.filter(t => (t.pnl || 0) < 0).length === account.sessionRules.maxLossesPerDay) {
          useNudgeStore.getState().show('Bullets reached — ending early shows discipline. Nice work.', 'positive');
        }
      } catch {}

      // Update recent symbols when trade is saved
      const newRecentSymbols = addRecentSymbol(formData.symbol);
      setRecentSymbols(newRecentSymbols);
      
      if (editingTrade) {
        updateTrade(editingTrade.id, tradeData);
        if (baseTags.includes('lockout-breach')) {
          addActivity({ type: 'trade', title: 'Trade during lockout', description: 'Logged a trade while lockout was active.', xpEarned: 0, relatedId: editingTrade.id!, accountId: selectedAccountId });
        }
        // Encouragement: followed plan but loss
        if (tradeData.result === 'loss' && formData.notes?.toLowerCase().includes('followed plan')) {
          useNudgeStore.getState().show('You followed your plan. Losses are business expenses. Consistency wins long-term.', 'positive');
        }
        addActivity({
          type: 'trade',
          title: `Updated ${formData.symbol} ${formData.direction.toUpperCase()} - ${formData.result.toUpperCase()}`,
          description: `Trade updated: ${formData.result === 'win' ? 'Won' : formData.result === 'loss' ? 'Lost' : 'Broke even on'} ${formatCurrency(Math.abs(tradeData.pnl!))}`,
          xpEarned: Math.floor(totalXP / 2), // Half XP for editing
          relatedId: editingTrade.id,
          accountId: selectedAccountId,
        });
      } else {
        console.log('Attempting to add trade with data:', tradeData);
        // If group selected, add with leader accountId; store logic will replicate to followers
        const targetIds = getAccountIdsForSelection(selectedAccountId);
        const leaderId = targetIds[0] || selectedAccountId;
        const newTrade = await addTrade({ ...tradeData, accountId: leaderId });
        if (baseTags.includes('lockout-breach')) {
          addActivity({ type: 'trade', title: 'Trade during lockout', description: 'Logged a trade while lockout was active.', xpEarned: 0, relatedId: newTrade.id, accountId: leaderId });
        }
        // Nudge: back-to-back rapid losses
        try {
          const recent = useTradeStore.getState().trades
            .filter(t => t.accountId === leaderId)
            .sort((a,b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
            .slice(0, 3);
          const isLoss = (t: any) => (t.pnl || 0) < 0;
          if (recent.length >= 2 && isLoss(recent[0]) && isLoss(recent[1])) {
            const dt = Math.abs(new Date(recent[0].entryTime).getTime() - new Date(recent[1].entryTime).getTime());
            if (dt <= 15 * 60 * 1000) {
              useNudgeStore.getState().show('Two quick losses. Step away for 5–10 minutes and reset. Protect your edge.', 'warning');
            }
          }
        } catch {}
        if (tradeData.result === 'loss' && formData.notes?.toLowerCase().includes('followed plan')) {
          useNudgeStore.getState().show('Good discipline. Keep executing your edge; results follow the process.', 'positive');
        }
      console.log('Trade added successfully:', newTrade);
      addActivity({
          type: 'trade',
          title: `${formData.symbol} ${formData.direction.toUpperCase()} - ${formData.result.toUpperCase()}`,
          description: `${formData.result === 'win' ? 'Won' : formData.result === 'loss' ? 'Lost' : 'Broke even on'} ${formatCurrency(Math.abs(tradeData.pnl!))}`,
          xpEarned: totalXP,
          relatedId: newTrade.id,
            accountId: leaderId,
        });

        // Award XP through new prestige system
        try {
          const { awardXp } = await import('@/lib/xp/XpService');
          const pnl = Math.abs(tradeData.pnl || 0);
          
          console.log('🎯 About to award XP for trade:', {
            result: formData.result,
            pnl,
            isBigWin: pnl > 500,
            awardXpExists: !!awardXp
          });
          
          if (formData.result === 'win') {
            // Check for big win (>$500 or >2R)
            const isBigWin = pnl > 500; // Could also check R-multiple
            if (isBigWin) {
              await awardXp.bigWin(pnl);
            } else {
              await awardXp.tradeWin(pnl);
            }
          } else if (formData.result === 'loss') {
            await awardXp.tradeLoss(pnl);
          }
          // No more scratches - every trade is either a win or loss
          
          console.log('✅ XP award completed');
        } catch (xpError) {
          console.error('❌ Failed to award XP:', xpError);
        }

        // Check and update quest progress for all relevant quests
        if (selectedAccountId) {
          const allActiveQuests = quests.filter(q => 
            (q.accountId === selectedAccountId || q.accountId === 'all') && 
            q.status !== 'completed' && 
            q.status !== 'cancelled' && 
            q.status !== 'failed'
          );
          
          allActiveQuests.forEach(quest => {
            // First Steps quest - Log your first trade
            if (quest.title === 'First Steps' || quest.description.toLowerCase().includes('first trade')) {
              updateQuestProgress(quest.id, 1);
            }
            
            // Risk Manager quest - Complete trades without exceeding risk limit
            if (quest.title === 'Risk Manager' || quest.description.toLowerCase().includes('risk')) {
              // Assuming 2% risk as standard (could be made configurable)
              if (formData.riskAmount <= 200) { // Adjust this threshold as needed
                updateQuestProgress(quest.id, 1);
              }
            }
            
            // Journal Keeper quest - Add a quick note after each trade
            if (quest.title === 'Journal Keeper' || quest.description.toLowerCase().includes('quick note')) {
              if (formData.notes && formData.notes.trim().length > 0) {
                updateQuestProgress(quest.id, 1);
              }
            }
            
            // Daily Focus quests
            if (quest.title === 'Daily Focus') {
              if (quest.description.toLowerCase().includes('quality over quantity')) {
                // Check if it's a high-quality trade (good R:R ratio)
                if (formData.riskRewardRatio >= 2) {
                  updateQuestProgress(quest.id, 1);
                }
              }
            }
            
            // Patience-based quests (check time between trades)
            if (quest.title === 'Patience Pays' || quest.description.toLowerCase().includes('patience') || quest.description.toLowerCase().includes('wait')) {
              // This would need more sophisticated timing logic in a real implementation
              // For now, we'll give credit for any planned trade entry
              if (formData.riskRewardRatio >= 1.5) { // Good setup indicates patience
                updateQuestProgress(quest.id, 1);
              }
            }
            
            // Any quest that tracks total trades (catch-all)
            if (quest.description.toLowerCase().includes('trade') && 
                !quest.description.toLowerCase().includes('first') &&
                !quest.description.toLowerCase().includes('risk') &&
                !quest.description.toLowerCase().includes('note') &&
                !quest.description.toLowerCase().includes('patience')) {
              updateQuestProgress(quest.id, 1);
            }
          });

          // Update consistency progress for all account trades (after new trade is added)
          setTimeout(() => {
            const accountTrades = useTradeStore.getState().trades.filter(t => t.accountId === selectedAccountId);
            updateConsistencyProgress(selectedAccountId, accountTrades);
          }, 150); // Small delay to ensure new trade is in the store
        }
      }

      setXpEarned(totalXP);
      setShowSuccess(true);
      
      // Auto-close after success animation
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Error saving trade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const modalVariants = {
    hidden: {
      x: '100%',
      opacity: 0,
      scale: 0.9,
    },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      x: '100%',
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.2,
      },
    },
  };

  const successVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 20,
      }
    },
  };

  const xpVariants = {
    hidden: { scale: 0, y: 20, opacity: 0 },
    visible: { 
      scale: 1, 
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 15,
        delay: 0.3,
      }
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-4 w-full max-w-md mx-auto bg-card border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 flex-shrink-0">
              <h2 className="text-lg font-bold text-card-foreground">
                {editingTrade ? 'Edit Trade' : 'Quick Trade Log'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lockout banner (non-blocking) */}
            {isLockedOutFn() && (
              <div className="mx-4 mt-3 mb-0 p-2 rounded-lg text-xs flex items-center justify-between border bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:border-yellow-500/30">
                <div>
                  Lockout active{lockoutRemaining ? ` • ${lockoutRemaining} remaining` : ''}. You can log for accuracy; consider pausing execution.
                </div>
                <button className="px-2 py-0.5 rounded bg-yellow-200 hover:bg-yellow-300 text-yellow-900 dark:bg-yellow-500/20 dark:hover:bg-yellow-500/30 dark:text-yellow-200" onClick={cancelLockout}>End</button>
              </div>
            )}

            {/* Import CTAs */}
            {!editingTrade && (
              <div className="mx-4 mt-3 mb-0">
                <motion.button
                  onClick={() => setShowImageImport(true)}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 border border-blue-200/50 dark:border-blue-700/30 text-blue-700 dark:text-blue-300 transition-all duration-200 group"
                  whileHover={{ scale: 1.005, y: -1 }}
                  whileTap={{ scale: 0.995 }}
                >
                  <div className="p-2 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm">Import Topstep Screenshot</div>
                    <div className="text-xs text-blue-600/70 dark:text-blue-400/70">ProjectX trade table screenshots only</div>
                  </div>
                  <div className="text-xs bg-blue-500/15 px-2.5 py-1 rounded-full font-medium">
                    Try it
                  </div>
                </motion.button>
                <div className="mt-2" />
                <motion.button
                  onClick={() => setShowCsvImport(true)}
                  className="w-full flex items-center justify-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/40 dark:hover:to-teal-900/40 border border-emerald-200/50 dark:border-emerald-700/30 text-emerald-700 dark:text-emerald-300 transition-all duration-200 group"
                  whileHover={{ scale: 1.005, y: -1 }}
                  whileTap={{ scale: 0.995 }}
                >
                  <div className="p-2 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                    <FileDown className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm">Import TradingView CSV</div>
                    <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Orders → ⋯ → Export → CSV</div>
                  </div>
                  <div className="text-xs bg-emerald-500/15 px-2.5 py-1 rounded-full font-medium">
                    New
                  </div>
                </motion.button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Symbol Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Symbol
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Current:</span>
                    <div className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-sm font-bold">
                      {formData.symbol}
                    </div>
                  </div>
                </div>
                
                {showSymbolInput ? (
                  <input
                    ref={symbolInputRef}
                    type="text"
                    value={formData.symbol}
                    onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                    onBlur={() => setShowSymbolInput(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setShowSymbolInput(false);
                      }
                    }}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground text-lg font-bold text-center focus:border-primary focus:outline-none"
                    placeholder="Enter symbol..."
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground text-center">
                      Recent Symbols
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {recentSymbols.map((symbol) => (
                      <motion.button
                        key={symbol}
                        onClick={() => handleSymbolChange(symbol)}
                        className={cn(
                          'p-2.5 rounded-xl font-bold text-sm transition-all',
                          formData.symbol === symbol
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {symbol}
                      </motion.button>
                    ))}
                    <motion.button
                      onClick={() => setShowSymbolInput(true)}
                      className="p-2.5 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="w-4 h-4 mx-auto" />
                    </motion.button>
                    </div>
                  </div>
                )}
              </div>

              {/* Direction */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted-foreground">
                  Direction
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    onClick={() => setFormData(prev => ({ ...prev, direction: 'long' }))}
                    className={cn(
                      'flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all',
                      formData.direction === 'long'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <TrendingUp className="w-4 h-4" />
                    LONG
                  </motion.button>
                  <motion.button
                    onClick={() => setFormData(prev => ({ ...prev, direction: 'short' }))}
                    className={cn(
                      'flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all',
                      formData.direction === 'short'
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <TrendingDown className="w-4 h-4" />
                    SHORT
                  </motion.button>
                </div>
              </div>

              {/* Risk Amount */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted-foreground">
                  Risk Amount
                </label>
                
                {showCustomRisk ? (
                  <div className="flex gap-2">
                    <input
                      ref={riskInputRef}
                      type="number"
                      value={customRiskInput}
                      onChange={(e) => setCustomRiskInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCustomRiskSubmit();
                        } else if (e.key === 'Escape') {
                          setShowCustomRisk(false);
                          setCustomRiskInput('');
                        }
                      }}
                      className="flex-1 px-3 py-2.5 bg-muted border border-border rounded-xl text-foreground focus:border-primary focus:outline-none"
                      placeholder="Enter amount..."
                      min="0"
                      step="0.01"
                    />
                    <motion.button
                      onClick={handleCustomRiskSubmit}
                      className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {riskPresets.map((amount) => (
                      <motion.button
                        key={amount}
                        onClick={() => setFormData(prev => ({ ...prev, riskAmount: amount }))}
                        className={cn(
                          'p-2.5 rounded-xl font-bold transition-all',
                          formData.riskAmount === amount
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ${amount}
                      </motion.button>
                    ))}
                    <motion.button
                      onClick={() => setShowCustomRisk(true)}
                      className="p-2.5 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Edit3 className="w-4 h-4 mx-auto" />
                    </motion.button>
                  </div>
                )}
                
                {/* Display current custom risk if not a preset */}
                {!riskPresets.includes(formData.riskAmount) && !showCustomRisk && (
                  <div className="text-center text-sm text-muted-foreground">
                    Current: ${formData.riskAmount}
                  </div>
                )}
              </div>

              {/* Risk-Reward Ratio */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted-foreground">
                  Risk:Reward Ratio
                </label>
                
                {showCustomRR ? (
                  <div className="flex gap-2">
                    <input
                      ref={rrInputRef}
                      type="number"
                      value={customRRInput}
                      onChange={(e) => setCustomRRInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCustomRRSubmit();
                        } else if (e.key === 'Escape') {
                          setShowCustomRR(false);
                          setCustomRRInput('');
                        }
                      }}
                      className="flex-1 px-3 py-2.5 bg-muted border border-border rounded-xl text-foreground focus:border-primary focus:outline-none"
                      placeholder="e.g., 2 or 0.33"
                      step="0.01"
                    />
                    <motion.button
                      onClick={handleCustomRRSubmit}
                      className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {rrRatios.map((ratio) => (
                      <motion.button
                        key={ratio}
                        onClick={() => setFormData(prev => ({ ...prev, riskRewardRatio: ratio }))}
                        className={cn(
                          'p-2.5 rounded-xl font-bold transition-all',
                          formData.riskRewardRatio === ratio
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                        )}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {ratio}:1
                      </motion.button>
                    ))}
                    <motion.button
                      onClick={() => setShowCustomRR(true)}
                      className="p-2.5 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Edit3 className="w-4 h-4 mx-auto" />
                    </motion.button>
                  </div>
                )}
                
                {/* Display current custom RR if not a preset */}
                {!rrRatios.includes(formData.riskRewardRatio) && !showCustomRR && (
                  <div className="text-center text-sm text-muted-foreground">
                    Current: {formData.riskRewardRatio}:1
                    {formData.riskRewardRatio < 1 && (
                      <span className="text-yellow-500 ml-2">
                        (Negative RR)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Win/Loss Result */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted-foreground">
                  Result
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <motion.button
                    onClick={() => setFormData(prev => ({ ...prev, result: 'win' }))}
                    className={cn(
                      'flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all',
                      formData.result === 'win'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Trophy className="w-4 h-4" />
                    WIN
                  </motion.button>
                  <motion.button
                    onClick={() => setFormData(prev => ({ ...prev, result: 'loss' }))}
                    className={cn(
                      'flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all',
                      formData.result === 'loss'
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <X className="w-4 h-4" />
                    LOSS
                  </motion.button>
                </div>
              </div>

              {/* P&L Override (Optional) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-muted-foreground">
                    P&L Override (Optional)
                  </label>
                  <div className="text-xs text-muted-foreground">
                    {formData.customPnl !== undefined ? (
                      <span className={cn(
                        "font-medium",
                        formData.customPnl >= 0 ? "text-green-600" : "text-red-600"
                      )}>
                        Custom: {formatCurrency(formData.customPnl)}
                      </span>
                    ) : formData.result ? (
                      <span className="text-muted-foreground">
                        Auto: {formatCurrency(
                          formData.result === 'win' ? formData.riskAmount * formData.riskRewardRatio : 
                          formData.result === 'loss' ? -formData.riskAmount : 0
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Select result first</span>
                    )}
                  </div>
                </div>
                
                {showCustomPnl ? (
                  <div className="flex gap-2">
                    <input
                      ref={pnlInputRef}
                      type="number"
                      value={customPnlInput}
                      onChange={(e) => setCustomPnlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCustomPnlSubmit();
                        } else if (e.key === 'Escape') {
                          setShowCustomPnl(false);
                          setCustomPnlInput('');
                        }
                      }}
                      className="flex-1 px-3 py-2.5 bg-muted border border-border rounded-xl text-foreground focus:border-primary focus:outline-none"
                      placeholder="Enter P&L (e.g., 150 or -75)"
                      step="0.01"
                    />
                    <motion.button
                      onClick={handleCustomPnlSubmit}
                      className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Check className="w-4 h-4" />
                    </motion.button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <motion.button
                      onClick={() => setShowCustomPnl(true)}
                      className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Calculator className="w-4 h-4" />
                      Enter Exact P&L
                    </motion.button>
                    {formData.customPnl !== undefined && (
                      <motion.button
                        onClick={() => setFormData(prev => ({ ...prev, customPnl: undefined }))}
                        className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Clear custom P&L"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                )}
              </div>

              {/* Entry Date */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted-foreground">
                  Entry Date
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={formData.entryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, entryDate: e.target.value }))}
                    className="flex-1 px-3 py-2.5 bg-muted border border-border rounded-xl text-foreground focus:border-primary focus:outline-none"
                    max={new Date().toISOString().split('T')[0]} // Can't select future dates
                  />
                  <motion.button
                    onClick={() => setFormData(prev => ({ ...prev, entryDate: new Date().toISOString().split('T')[0] }))}
                    className="px-3 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-colors text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Set to today"
                  >
                    Today
                  </motion.button>
                </div>
              </div>

              {/* Mood Emojis */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted-foreground">
                  How are you feeling?
                </label>
                <div className="flex justify-between">
                  {moodEmojis.map((mood) => (
                    <motion.button
                      key={mood.value}
                      onClick={() => setFormData(prev => ({ ...prev, mood: mood.value }))}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-xl transition-all',
                        formData.mood === mood.value
                          ? 'bg-primary text-primary-foreground shadow-lg'
                          : 'hover:bg-accent'
                      )}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <span className="text-xl">{mood.emoji}</span>
                      <span className="text-xs font-medium">{mood.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quick Notes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Quick Note (Optional)
                  </label>
                  <motion.button
                    onClick={() => setShowNotes(!showNotes)}
                    className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </motion.button>
                </div>
                
                <AnimatePresence>
                  {showNotes && (
                    <motion.textarea
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="What happened? How did you feel?"
                      className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-foreground focus:border-primary focus:outline-none resize-none"
                      rows={2}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <TagIcon className="w-4 h-4" />
                  Tags
                </label>
                <TagInput
                  tags={formData.tags}
                  suggestedTags={allTags}
                  onAddTag={(tag) => {
                    const t = tag.toLowerCase();
                    if (!formData.tags.includes(t)) setFormData(prev => ({ ...prev, tags: [...prev.tags, t] }));
                  }}
                  onRemoveTag={(tag) => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
                  placeholder="Add tags (or use # in notes)"
                  maxTags={8}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/50 flex-shrink-0">
              <motion.button
                onClick={handleSave}
                disabled={!formData.result || isLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-3 p-3 rounded-xl font-bold text-base transition-all',
                  'bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700',
                  'text-primary-foreground shadow-lg',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap className="w-5 h-5" />
                )}
                LOG TRADE
              </motion.button>
            </div>

            {/* Success Animation */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  className="absolute inset-0 bg-card/95 backdrop-blur-sm flex items-center justify-center"
                  variants={successVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <div className="text-center">
                    <motion.div
                      className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                      animate={{ 
                        scale: [1, 1.2, 1], 
                        rotate: [0, 360, 360],
                      }}
                      transition={{ duration: 0.8 }}
                    >
                      <Check className="w-10 h-10 text-white" />
                    </motion.div>
                    
                    <h3 className="text-xl font-bold text-card-foreground mb-2">
                      {editingTrade ? 'Trade Updated! ✅' : 'Trade Logged! 🎉'}
                    </h3>
                    
                    <motion.div
                      className="flex items-center justify-center gap-2 text-green-500 font-bold"
                      variants={xpVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span>+{xpEarned} XP</span>
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}

      {/* Import Modals */}
      <TradeImageImport 
        key="image-import"
        isOpen={showImageImport} 
        onClose={() => setShowImageImport(false)} 
      />
      <TradeCSVImport
        key="csv-import"
        isOpen={showCsvImport}
        onClose={() => setShowCsvImport(false)}
      />
    </AnimatePresence>
  );
}; 