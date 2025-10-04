import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Trophy,
  Heart,
  Brain,
  Zap,
  PlusCircle,
  BookOpen,
  Database,
  Calendar,
  Clock,
  MinusCircle
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore, getAccountIdsForSelection } from '@/store/useAccountFilterStore';
import { useQuestStore } from '@/store/useQuestStore';
import { addDemoTradesToAccount } from '@/utils/demoDataGenerator';
import { formatCurrency } from '@/lib/localStorageUtils';
import { CircularProgress } from './ui/CircularProgress';
import { Sparkline, TrendIndicator } from './ui/Sparkline';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { generateDailySummary } from '@/lib/ai/generateDailySummary';
import { generateQuestSuggestions } from '@/lib/ai/generateQuestSuggestions';
import { getFormattedLevel, getXPProgressPercentage } from '@/store/useUserProfileStore';
import type { Quest, QuickNote } from '@/types';
import { useSessionStore } from '@/store/useSessionStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useDashboardTilesStore, type DashboardTileId } from '@/store/useDashboardTilesStore';
import DashboardTilesModal from './DashboardTilesModal';
import { useReflectionTemplateStore } from '@/store/useReflectionTemplateStore';
import { CoachChat } from './CoachChat';
import { useAppSettingsStore } from '@/store/useAppSettingsStore';
import { summarizeWinLossScratch, classifyTradeResult } from '@/lib/utils';
import { Tooltip } from './ui/Tooltip';
import { RuleTallyTracker } from './RuleTallyTracker';

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  trendData?: number[];
  showSparkline?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  trendData = [],
  showSparkline = true 
}) => {
  const changeColor = changeType === 'positive' ? 'text-green-500' : 
                     changeType === 'negative' ? 'text-red-500' : 'text-muted-foreground';
  
  return (
    <motion.div
      className="bg-background rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-200"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-muted">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 ${changeColor}`}>
            {changeType === 'positive' && <TrendingUp className="w-4 h-4" />}
            {changeType === 'negative' && <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-medium">{change}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-2xl font-bold text-card-foreground mb-1">{value}</h3>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        {showSparkline && trendData.length > 0 && trendData.some(val => val !== 0) && (
          <div className="flex flex-col items-end gap-1">
            <Sparkline 
              data={trendData} 
              width={50} 
              height={16} 
              color="auto"
              strokeWidth={2}
            />
            <TrendIndicator data={trendData} format={title.includes('P&L') ? 'currency' : title.includes('Total Trades') ? 'number' : 'none'} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Lightweight Pattern Radar widget
const PatternRadar: React.FC<{ trades: any[]; notes: QuickNote[] }> = ({ trades, notes }) => {
  const negativeTags = new Set(['fomo', 'revenge', 'overtrading', 'tilt', 'impatience', 'late-entry', 'chasing']);
  const positiveTags = new Set(['discipline', 'patience', 'followed-plan', 'risk-management', 'waited', 'partial-exit']);

  const tagCounts = new Map<string, number>();
  const bump = (tag: string) => {
    const key = tag.toLowerCase();
    tagCounts.set(key, (tagCounts.get(key) || 0) + 1);
  };

  trades.forEach(t => (t.tags || []).forEach(bump));
  (notes || []).forEach(n => (n.tags || []).forEach(bump));

  const entries = Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1]);
  const helpful = entries.filter(([t]) => positiveTags.has(t)).slice(0, 3);
  const harmful = entries.filter(([t]) => negativeTags.has(t)).slice(0, 3);

  const Pill: React.FC<{ label: string; count: number; tone: 'good' | 'bad' }> = ({ label, count, tone }) => (
    <span className={`text-xs px-2 py-1 rounded-full border ${tone === 'good' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
      {label} • {count}
    </span>
  );

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs text-muted-foreground mb-1">Helpful patterns</div>
        <div className="flex flex-wrap gap-2">
          {helpful.length > 0 ? helpful.map(([t, c]) => <Pill key={t} label={`#${t}`} count={c} tone="good" />) : <span className="text-xs text-muted-foreground">No data yet</span>}
        </div>
      </div>
      <div>
        <div className="text-xs text-muted-foreground mb-1">Harmful patterns</div>
        <div className="flex flex-wrap gap-2">
          {harmful.length > 0 ? harmful.map(([t, c]) => <Pill key={t} label={`#${t}`} count={c} tone="bad" />) : <span className="text-xs text-muted-foreground">No data yet</span>}
        </div>
      </div>
    </div>
  );
};

// Reflection Progress widget
const ReflectionProgress: React.FC<{ todayStr: string }> = ({ todayStr }) => {
  const { getReflectionByDate } = useDailyReflectionStore();
  const reflection = getReflectionByDate(todayStr);
  const isComplete = reflection?.isComplete;
  const xp = reflection?.xpEarned || 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm">Today's Reflection</div>
        <div className={`text-xs font-medium ${isComplete ? 'text-green-500' : 'text-orange-500'}`}>{isComplete ? 'Complete' : 'Incomplete'}</div>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${isComplete ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: isComplete ? '100%' : '35%' }} />
      </div>
      <div className="text-xs text-muted-foreground">XP Earned: {xp}</div>
    </div>
  );
};

// XP and Level widget
const XPLevelWidget: React.FC = () => {
  const label = getFormattedLevel();
  const pct = getXPProgressPercentage();
  return (
    <div className="space-y-3">
      <div className="text-sm">{label}</div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-purple-500" style={{ width: `${pct.toFixed(0)}%` }} />
      </div>
      <div className="text-xs text-muted-foreground">{pct.toFixed(0)}% to next level</div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { layoutByAccount, getLayout, toggleTile, setLayout, resetLayout } = useDashboardTilesStore();
  const [showTilesModal, setShowTilesModal] = useState(false);
  const { trades } = useTradeStore();
  const { accounts, selectedAccountId } = useAccountFilterStore();
  const dashboardLayout = getLayout(selectedAccountId);
  const { quests, pinnedQuests, cleanupPinnedQuests } = useQuestStore();
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const { getKeyFocusForDate, upsertReflectionForSelection } = useDailyReflectionStore();
  const dailyGetReflectionByDate = useDailyReflectionStore((s) => s.getReflectionByDate);
  const reflections = useDailyReflectionStore((s) => s.reflections);
  const { notes } = useQuickNoteStore();
  const { isActive: sessionActive, activeDate, checklist, startSession, endSession, toggleItem, resetChecklist, getRfDraft, setRfDraft, clearRfDraft, rules, setRules, startLockout: startLockoutFromStore, cancelLockout: cancelLockoutFromStore, isLockedOut: isLockedOutFromStore, setLockoutSnooze, isAutoLockoutSnoozed, clearLockoutSnooze } = useSessionStore();
  const { setCurrentView } = useNavigationStore();
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [endSummary, setEndSummary] = useState<{completed: number; total: number} | null>(null);
  const { getReflectionByDate } = useReflectionTemplateStore();
  const [rfGood, setRfGood] = useState('');
  const [rfBad, setRfBad] = useState('');
  const [rfFocus, setRfFocus] = useState('');
  const [rfSaving, setRfSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationXP, setCelebrationXP] = useState(0);
  const [confetti, setConfetti] = useState<Array<{ left: number; delay: number; color: string }>>([]);

  // Load quick reflection drafts when modal opens
  useEffect(() => {
    if (endModalOpen) {
      const d = getRfDraft(todayStr);
      if (d) {
        setRfGood(d.good || '');
        setRfBad(d.bad || '');
        setRfFocus(d.focus || '');
      }
    }
  }, [endModalOpen]);

  // Dashboard local state
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiQuestSuggestions, setAiQuestSuggestions] = useState<Quest[]>([]);
  const [aiSummaryExpanded, setAiSummaryExpanded] = useState<boolean>(false);
  const [planAppliedVisible, setPlanAppliedVisible] = useState<boolean>(false);
  const [planAppliedCount, setPlanAppliedCount] = useState<number>(0);
  const [selectedQuestIdxs, setSelectedQuestIdxs] = useState<Set<number>>(new Set());
  const [applyError, setApplyError] = useState<string>('');
  const MAX_SELECTED_QUESTS = 2;
  const [showMoreIdeas, setShowMoreIdeas] = useState<boolean>(false);
  const [autoLockTriggered, setAutoLockTriggered] = useState<boolean>(false);

  // Helpers
  const normalizeSummary = (text: string): string => {
    if (!text) return '';
    let t = text.replace(/\s+/g, ' ').trim();
    // Remove odd leading fragments like "s " caused by truncation
    t = t.replace(/^['`’]s\s+/i, '');
    // Remove leading non-letter punctuation
    t = t.replace(/^[^A-Za-z“”"'(]+/g, '');
    // If starts lowercase, capitalize first letter to avoid mid-sentence feel
    if (/^[a-z]/.test(t)) {
      t = t.charAt(0).toUpperCase() + t.slice(1);
    }
    // Ensure ending punctuation
    if (!/[.!?]$/.test(t)) t = t + '.';
    return t;
  };

  // Clean up pinned quests on dashboard load
  useEffect(() => {
    // Run cleanup immediately and add a small delay to catch any async quest updates
    cleanupPinnedQuests();
    setTimeout(() => {
      cleanupPinnedQuests();
    }, 500);
  }, [cleanupPinnedQuests]);

  // Find Demo Account
  const demoAccount = accounts.find(acc => acc.name === 'Demo Account');

  // Get pinned quests data - filter out completed, cancelled, failed, and fully progressed quests
  const pinnedQuestsList = quests.filter(q => {
    if (!pinnedQuests.includes(q.id)) return false;
    if (q.status === 'completed' || q.status === 'cancelled' || q.status === 'failed') return false;
    if (q.progress >= q.maxProgress) return false; // Also filter out quests that are fully progressed but not marked complete
    return true;
  });

  // Pinned quests created today for the selected account (shown in Daily Focus)
  const pinnedTodayList = React.useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return quests.filter(q => {
      if (!pinnedQuests.includes(q.id)) return false;
      if (q.status === 'completed' || q.status === 'cancelled' || q.status === 'failed') return false;
      const createdAt = new Date(q.createdAt as any);
      const isToday = createdAt >= startOfToday && createdAt <= endOfToday;
      // Show journal-wide quests (no accountId) or quests matching the selected account
      const accountOk = !selectedAccountId || !q.accountId || q.accountId === selectedAccountId || q.accountId === 'all';
      return isToday && accountOk;
    });
  }, [quests, pinnedQuests, selectedAccountId]);

  // Calculate real KPIs (respect group selection)
  const filteredTrades = React.useMemo(() => {
    const ids = getAccountIdsForSelection(selectedAccountId || null);
    return trades.filter(trade => ids.includes(trade.accountId));
  }, [trades, selectedAccountId]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTrades = filteredTrades.filter(trade => {
    const tradeDate = new Date(trade.entryTime);
    tradeDate.setHours(0, 0, 0, 0);
    return tradeDate.getTime() === today.getTime();
  });

  const totalPnL = filteredTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const todayPnL = todayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const wr = summarizeWinLossScratch(filteredTrades);
  const winningTrades = wr.wins;
  const losingTrades = wr.losses;
  const winRate = wr.winRateExclScratches; // Now this is just the true win rate

  // Guardrails: risk used vs daily limit (if available), trades left, time since last trade
  const todayLossAbs = Math.abs(
    todayTrades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0)
  );
  const selectionAccounts = React.useMemo(() => {
    if (!selectedAccountId) return accounts;
    const ids = getAccountIdsForSelection(selectedAccountId);
    return accounts.filter(a => ids.includes(a.id));
  }, [accounts, selectedAccountId]);
  const dailyLossLimit = selectionAccounts.every(a => typeof a.dailyLossLimit === 'number')
    ? (selectionAccounts.reduce((s, a) => s + (a.dailyLossLimit || 0), 0))
    : null;
  const riskUsedPct = dailyLossLimit && dailyLossLimit > 0 ? Math.min(100, Math.round((todayLossAbs / dailyLossLimit) * 100)) : null;
  const riskUsedDisplay = dailyLossLimit && dailyLossLimit > 0
    ? `${riskUsedPct}% (${formatCurrency(todayLossAbs)} / ${formatCurrency(dailyLossLimit)})`
    : (riskUsedPct !== null ? `${riskUsedPct}%` : '—');
  const riskPrimaryText = riskUsedPct !== null ? `${riskUsedPct}%` : '—';
  const riskSecondaryText = dailyLossLimit && dailyLossLimit > 0
    ? `(${formatCurrency(todayLossAbs)} of ${formatCurrency(dailyLossLimit)})`
    : '';
  const riskColorClass = riskUsedPct !== null && riskUsedPct >= 100 ? 'text-red-600' : 'text-foreground';
  const lastTradeTime = todayTrades.length > 0
    ? new Date(Math.max(...todayTrades.map(t => new Date(t.entryTime).getTime())))
    : null;
  const minutesSinceLastTrade = lastTradeTime ? Math.max(0, Math.floor((Date.now() - lastTradeTime.getTime()) / 60000)) : null;

  // Focus for today (from reflection store)
  const yyyy = new Date().getFullYear();
  const mm = String(new Date().getMonth() + 1).padStart(2, '0');
  const dd = String(new Date().getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const keyFocus = getKeyFocusForDate(todayStr) || '';

  // Generate trend data for sparklines
  const generateDailyPnLTrend = (): number[] => {
    const days: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayTrades = filteredTrades.filter(trade => {
        const tradeDate = new Date(trade.entryTime);
        tradeDate.setHours(0, 0, 0, 0);
        return tradeDate.getTime() === date.getTime();
      });
      
      const dayPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      days.push(dayPnL as number);
    }
    return days;
  };

  const generateWeeklyPnLTrend = (): number[] => {
    const weeks: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - (i * 7));
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      
      const weekTrades = filteredTrades.filter(trade => {
        const tradeDate = new Date(trade.entryTime);
        return tradeDate >= startDate && tradeDate <= endDate;
      });
      
      const weekPnL = weekTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      weeks.push(weekPnL as number);
    }
    return weeks;
  };

  const generateTradeCountTrend = (): number[] => {
    const days: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayTrades = filteredTrades.filter(trade => {
        const tradeDate = new Date(trade.entryTime);
        tradeDate.setHours(0, 0, 0, 0);
        return tradeDate.getTime() === date.getTime();
      });
      
      days.push(dayTrades.length as number);
    }
    return days;
  };

  const dailyPnLTrend = generateDailyPnLTrend();
  const weeklyPnLTrend = generateWeeklyPnLTrend();
  const tradeCountTrend = generateTradeCountTrend();

  // Execution Score (0–100)
  const executionScore = (() => {
    const scoreParts: number[] = [];
    const capRespected = riskUsedPct === null ? 1 : riskUsedPct < 100 ? 1 : 0;
    scoreParts.push(capRespected);
    const tradeCap = (rules?.maxTrades === null || rules?.maxTrades === undefined || todayTrades.length <= (rules?.maxTrades || 0)) ? 1 : 0;
    scoreParts.push(tradeCap);
    const reflection = selectedAccountId ? dailyGetReflectionByDate(todayStr, selectedAccountId) : dailyGetReflectionByDate(todayStr);
    const reflectionDone = reflection?.isComplete ? 1 : 0.35;
    scoreParts.push(reflectionDone);
    return Math.round((scoreParts.reduce((s, v) => s + v, 0) / scoreParts.length) * 100);
  })();

  const handleAddDemoData = async () => {
    if (!demoAccount) {
      alert('Demo Account not found. Please create a Demo Account first.');
      return;
    }

    setIsLoadingDemo(true);
    try {
      const tradesAdded = await addDemoTradesToAccount(demoAccount.id);
      alert(`Successfully added ${tradesAdded} demo trades to Demo Account! 🎉\n\nNow you can:\n• View them in the Trades section\n• Analyze performance in Analytics\n• See them on the Calendar`);
    } catch (error) {
      console.error('Error adding demo trades:', error);
      alert('Error adding demo trades. Please try again.');
    } finally {
      setIsLoadingDemo(false);
    }
  };

  // Lockout helpers
  const startLockout = (minutes: number) => {
    const until = Date.now() + minutes * 60 * 1000;
    setLockoutUntil(until);
    startLockoutFromStore(minutes);
  };
  const isLockedOut = isLockedOutFromStore() || (lockoutUntil !== null && Date.now() < lockoutUntil);

  // Auto-lockout based on rules (daily loss cap handled via riskUsedPct)
  useEffect(() => {
    if (!rules?.autoLockoutEnabled || autoLockTriggered) return;
    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const hitLossCap = (riskUsedPct !== null && riskUsedPct >= 100);
    const hitTradeCap = (rules.maxTrades !== null && rules.maxTrades !== undefined && todayTrades.length > (rules.maxTrades || 0));
    const hitCutoff = (rules.cutoffTimeMinutes !== null && rules.cutoffTimeMinutes !== undefined && minutesNow >= (rules.cutoffTimeMinutes || 0) && sessionActive);
    if (!isAutoLockoutSnoozed() && (hitLossCap || hitTradeCap || hitCutoff)) {
      startLockout(20);
      setAutoLockTriggered(true);
    }
  }, [rules, riskUsedPct, todayTrades.length, sessionActive]);

  // AI Plan generation
  const handleGeneratePlan = async () => {
    try {
      setIsGeneratingPlan(true);
      // Scope to TODAY and current account selection
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const selectionIds = selectedAccountId ? getAccountIdsForSelection(selectedAccountId) : accounts.map(a => a.id);

      const todaysTrades = filteredTrades.filter((t) => {
        const d = new Date(t.entryTime);
        return d >= startOfDay && d <= endOfDay;
      });
      const todaysNotes: QuickNote[] = (notes || []).filter((n) => {
        const nd = new Date(n.createdAt as any);
        const accountOk = selectionIds.includes(n.accountId);
        return accountOk && nd >= startOfDay && nd <= endOfDay;
      });

      const { winRateExclScratches: winRateToday } = summarizeWinLossScratch(todaysTrades);
      const totalPnLToday = todaysTrades.reduce((s, t) => s + (t.pnl || 0), 0);
      const avgRiskToday = todaysTrades.length > 0 ? todaysTrades.reduce((s, t) => s + (t.riskAmount || 0), 0) / todaysTrades.length : 100;

      const [summaryRaw, questsFromAI] = await Promise.all([
        generateDailySummary({
          trades: todaysTrades as any,
          notes: todaysNotes as any,
          stats: {
            totalPnL: totalPnLToday,
            winRate: winRateToday,
            totalXP: 0,
            moodTrend: 'neutral',
            tradeCount: todaysTrades.length,
          },
        }),
        generateQuestSuggestions({
          recentTrades: todaysTrades as any,
          recentNotes: todaysNotes as any,
          currentMood: 'neutral',
          completedQuests: [],
          winRate: winRateToday,
          totalPnL: totalPnLToday,
          avgRiskAmount: avgRiskToday,
        }),
      ]);

      const summary = normalizeSummary(summaryRaw);
      setAiSummary(summary);
      setAiQuestSuggestions(questsFromAI);
      // Preselect up to 2 quests by default to reduce overwhelm
      const preselectCount = Math.min(2, questsFromAI.length);
      setSelectedQuestIdxs(new Set(Array.from({ length: preselectCount }, (_, i) => i)));
      setApplyError('');

      // Persist AI summary and extracted focus immediately so it sticks across navigation
      const extract = useDailyReflectionStore.getState().extractKeyFocus;
      const focus = extract(summary || 'Focus on disciplined trading.');
      if (selectedAccountId) {
        await upsertReflectionForSelection(todayStr, { aiSummary: summary, keyFocus: focus }, selectedAccountId);
      }
    } catch (e) {
      console.error('Failed to generate AI plan', e);
      alert('Failed to generate plan. Please try again.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleApplyPlan = async () => {
    try {
      // Save AI summary and extract focus for today
      const extract = useDailyReflectionStore.getState().extractKeyFocus;
      const focus = extract(aiSummary || 'Focus on disciplined trading.');
      if (selectedAccountId) {
        await upsertReflectionForSelection(todayStr, {
          aiSummary: aiSummary,
          keyFocus: focus,
          planApplied: true,
          planPinnedCount: Array.from(selectedQuestIdxs).length,
        } as any, selectedAccountId);
      }
      // Add quests and pin them
      const { addQuest, pinQuest } = useQuestStore.getState();
      const chosen = aiQuestSuggestions.filter((_, idx) => selectedQuestIdxs.has(idx));
      if (chosen.length === 0) {
        setApplyError('Select at least one quest to apply.');
        return;
      }
      let pinned = 0;
      for (const q of chosen) {
        const created = await addQuest({
          title: q.title,
          description: q.description,
          type: q.type,
          status: 'pending',
          progress: 0,
          maxProgress: q.maxProgress,
          xpReward: q.xpReward,
          dueDate: q.dueDate as any,
          accountId: selectedAccountId || 'all',
        });
        pinQuest(created.id);
        pinned++;
      }
      setPlanAppliedCount(pinned);
      setPlanAppliedVisible(true);
      setApplyError('');
      // Re-run cleanup to ensure visibility
      cleanupPinnedQuests();
    } catch (e) {
      console.error('Failed to apply plan', e);
      alert('Failed to apply plan.');
    }
  };

  // Apply a single quest immediately
  const handleApplySingleQuest = async (idx: number) => {
    try {
      if (!aiQuestSuggestions[idx]) return;
      const q = aiQuestSuggestions[idx];
      const extract = useDailyReflectionStore.getState().extractKeyFocus;
      const focus = extract(aiSummary || 'Focus on disciplined trading.');
      if (selectedAccountId) {
        await upsertReflectionForSelection(todayStr, {
          aiSummary: aiSummary,
          keyFocus: focus,
          planApplied: true,
          planPinnedCount: 1,
        } as any, selectedAccountId);
      }
      const { addQuest, pinQuest } = useQuestStore.getState();
      const created = await addQuest({
        title: q.title,
        description: q.description,
        type: q.type,
        status: 'pending',
        progress: 0,
        maxProgress: q.maxProgress,
        xpReward: q.xpReward,
        dueDate: q.dueDate as any,
        accountId: selectedAccountId || 'all',
      });
      pinQuest(created.id);
      setPlanAppliedCount(1);
      setPlanAppliedVisible(true);
      cleanupPinnedQuests();
    } catch (e) {
      console.error('Failed to apply quest', e);
      alert('Failed to apply quest.');
    }
  };

  return (
    <div className="p-6 min-h-screen bg-grid">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, Trader! 👋
          </h1>
          <p className="text-muted-foreground">
            {filteredTrades.length === 0 
              ? 'Ready to start your trading journey?' 
              : `You have ${filteredTrades.length} trades tracked${todayTrades.length > 0 ? `, ${todayTrades.length} today` : ''}`
            }
          </p>
        </motion.div>
      </div>

      {/* Customize button */}
      <div className="mb-4 flex items-center justify-end">
        <button
          className="text-xs px-3 py-1.5 rounded bg-muted text-muted-foreground hover:bg-muted/80"
          onClick={() => setShowTilesModal(true)}
          title="Customize dashboard tiles"
        >Customize</button>
      </div>

      {/* KPI Cards - Primary Focus */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="P&L Today"
          value={isFocusMode ? '••••' : (todayTrades.length > 0 ? formatCurrency(todayPnL) : '$0.00')}
          change={todayTrades.length > 0 ? (todayPnL >= 0 ? '+' : '') + Math.abs(todayPnL).toFixed(0) : undefined}
          changeType={todayPnL > 0 ? 'positive' : todayPnL < 0 ? 'negative' : 'neutral'}
          icon={DollarSign}
          trendData={dailyPnLTrend}
        />
        
        {/* Win Rate with Circular Progress */}
        <motion.div
          className="bg-background rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-muted">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredTrades.length} trades
            </div>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Win Rate</h3>
          
          {filteredTrades.length > 0 ? (
            <CircularProgress
              wins={winningTrades}
              losses={losingTrades}
              breakeven={0}
              size="sm"
              showLabels={false}
              showInlineNumbers={true}
              className="mx-auto"
            />
          ) : (
            <div className="text-center py-4">
              <div className="text-2xl font-bold text-foreground mb-1">0%</div>
              <div className="text-xs text-muted-foreground">No trades yet</div>
            </div>
          )}
        </motion.div>
        
        <KPICard
          title="Total P&L"
          value={isFocusMode ? '••••' : (filteredTrades.length > 0 ? formatCurrency(totalPnL) : '$0.00')}
          change={filteredTrades.length > 0 ? (totalPnL >= 0 ? 'Profitable' : 'Drawdown') : undefined}
          changeType={totalPnL > 0 ? 'positive' : totalPnL < 0 ? 'negative' : 'neutral'}
          icon={TrendingUp}
          trendData={weeklyPnLTrend}
        />
        <KPICard
          title="Total Trades"
          value={filteredTrades.length.toString()}
          change={filteredTrades.length === 0 ? 'Get started!' : `${winningTrades} wins`}
          changeType={filteredTrades.length > 0 ? 'positive' : 'neutral'}
          icon={Trophy}
          trendData={tradeCountTrend}
        />
      </div>

      {/* Rule Tracker - Behavioral Focus */}
      {dashboardLayout.find(t => t.id === 'ruleTracker')?.visible && (
        <div className="mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
          >
            <RuleTallyTracker />
          </motion.div>
        </div>
      )}

      {/* Secondary row: Daily Focus, Guardrails, Mini-KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Daily Focus */}
        {dashboardLayout.find(t => t.id === 'dailyFocus')?.visible && (
        <motion.div className="bg-background rounded-2xl p-5 border border-border hover:border-primary/30" whileHover={{ y: -2 }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold">Daily Focus</h3>
            </div>
            <button
              className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground hover:bg-secondary/90"
              onClick={handleGeneratePlan}
              disabled={isGeneratingPlan}
            >
              {isGeneratingPlan ? 'Generating…' : 'Generate Plan'}
            </button>
          </div>
          <div className="text-sm text-muted-foreground min-h-[40px]">
            {keyFocus ? (
              <div className="space-y-2">
                <span className="text-foreground block break-words">{keyFocus}</span>
                {/* Persistent confirmation if plan was applied */}
                {(() => {
                  const ref = reflections.find(r => r.date === todayStr && (!selectedAccountId || r.accountId === selectedAccountId));
                  if (ref?.planApplied || pinnedTodayList.length > 0) {
                    return (
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-green-500/10 text-green-600 border border-green-500/30 text-[11px]">
                          <Trophy className="w-3 h-3" /> Quests pinned for today ({pinnedTodayList.length})
                        </div>
                        {pinnedTodayList.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {pinnedTodayList.map(q => (
                              <span key={q.id} className="text-[11px] px-2 py-1 rounded-full bg-muted/40 border border-border text-foreground">
                                {q.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ) : (
              <span>No focus set for today yet.</span>
            )}
          </div>
          {aiSummary && (
            <div className="mt-3 text-xs text-muted-foreground">
              <p className={aiSummaryExpanded ? '' : 'line-clamp-3 break-words'}>{aiSummary}</p>
              <button
                className="mt-2 text-[11px] px-2 py-1 rounded bg-muted hover:bg-muted/80 text-muted-foreground"
                onClick={() => setAiSummaryExpanded(v => !v)}
              >{aiSummaryExpanded ? 'Show less' : 'Show more'}</button>
            </div>
          )}
          {aiQuestSuggestions.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-muted-foreground">Today’s ideas</span>
                {aiQuestSuggestions.length > 2 && (
                  <button
                    className="text-[11px] px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80"
                    onClick={() => setShowMoreIdeas(v => !v)}
                  >{showMoreIdeas ? 'Show fewer' : 'More ideas'}</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(showMoreIdeas ? aiQuestSuggestions : aiQuestSuggestions.slice(0, 4)).map((q, idx) => {
                  const absoluteIdx = showMoreIdeas ? idx : idx;
                  const isSelected = selectedQuestIdxs.has(absoluteIdx);
                  return (
                    <button
                      type="button"
                      key={`${q.title}-${absoluteIdx}`}
                      className={`text-xs px-3 py-1 rounded-full border ${isSelected ? 'bg-primary/15 border-primary/40 text-primary' : 'bg-muted/40 border-border text-foreground hover:bg-muted/60'}`}
                      onClick={() => {
                        setSelectedQuestIdxs(prev => {
                          const next = new Set(prev);
                          if (next.has(absoluteIdx)) {
                            next.delete(absoluteIdx);
                          } else {
                            if (next.size >= MAX_SELECTED_QUESTS) return next; // cap selections
                            next.add(absoluteIdx);
                          }
                          return next;
                        });
                        setApplyError('');
                      }}
                      title={q.description}
                    >{q.title}</button>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-[11px] text-muted-foreground">Selected {selectedQuestIdxs.size}/{MAX_SELECTED_QUESTS}</div>
                <div className="flex items-center gap-2">
                  {applyError && <span className="text-[11px] text-red-500">{applyError}</span>}
                  <button
                    className="text-[11px] px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    onClick={handleApplyPlan}
                    disabled={selectedQuestIdxs.size === 0}
                  >Apply Selected</button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
        )}

        {/* Session Guardrails */}
        {dashboardLayout.find(t => t.id === 'guardrails')?.visible && (
        <motion.div className="bg-background rounded-2xl p-5 border border-border hover:border-primary/30" whileHover={{ y: -2 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h3 className="text-sm font-semibold">Session Guardrails</h3>
            </div>
            <div className="text-xs text-muted-foreground">{isLockedOut ? 'Locked out' : 'Active'}</div>
          </div>
          {isLockedOut && (
            <div className="mb-3 p-2 rounded-lg text-[11px] border bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-300 dark:border-yellow-500/30">
              Lockout active. You can still log trades; consider pausing execution to protect your edge.
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-muted-foreground">Trades Today</div>
              <div className="text-lg font-bold text-foreground">{todayTrades.length}</div>
            </div>
            <div className="p-3 bg-muted rounded-lg text-center">
              <div className="text-muted-foreground">Since Last Trade</div>
              <div className="text-lg font-bold text-foreground">{minutesSinceLastTrade !== null ? `${minutesSinceLastTrade}m` : '—'}</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-center text-muted-foreground">Risk Used</div>
              <div className={"text-3xl font-extrabold text-center leading-tight mt-1 " + riskColorClass}>{riskPrimaryText}</div>
              {riskSecondaryText && (
                <div className="text-xs text-muted-foreground text-center px-3 leading-snug break-words" title={`Loss today ${formatCurrency(todayLossAbs)} of cap ${formatCurrency(dailyLossLimit||0)}`}>{riskSecondaryText}</div>
              )}
              {riskUsedPct !== null && (
                <div className="mt-3 w-[92%] mx-auto h-2 bg-background/60 rounded-full overflow-hidden">
                  <div className={`h-full ${riskUsedPct >= 100 ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${Math.min(100, riskUsedPct)}%` }} />
                </div>
              )}
            </div>
          </div>
          {/* Rule chips */}
          {(() => {
            const acc = selectionAccounts[0] as any;
            const r = acc?.sessionRules?.riskPerTrade;
            const bullets = acc?.sessionRules?.maxLossesPerDay;
            return (
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                {r ? <span className="px-2 py-1 rounded-full bg-muted border border-border">R: {formatCurrency(r)}</span> : null}
                {bullets ? <span className="px-2 py-1 rounded-full bg-muted border border-border">Bullets: {bullets}/day</span> : null}
              </div>
            );
          })()}
          {/* Rule inputs */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-muted-foreground mb-1">Max Trades</div>
              <input type="number" className="w-full px-2 py-1 rounded bg-muted/40 border border-border/60"
                value={rules?.maxTrades ?? ''}
                onChange={(e) => setRules({ maxTrades: e.target.value ? parseInt(e.target.value) : null })} />
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Cutoff (HH:MM)</div>
              <input type="time" className="w-full px-2 py-1 rounded bg-muted/40 border border-border/60"
                value={(rules?.cutoffTimeMinutes !== null && rules?.cutoffTimeMinutes !== undefined ? `${String(Math.floor((rules.cutoffTimeMinutes||0)/60)).padStart(2,'0')}:${String((rules.cutoffTimeMinutes||0)%60).padStart(2,'0')}` : '')}
                onChange={(e) => {
                  const [hh, mm] = e.target.value.split(':').map(Number);
                  if (Number.isFinite(hh) && Number.isFinite(mm)) setRules({ cutoffTimeMinutes: hh * 60 + mm }); else setRules({ cutoffTimeMinutes: null });
                }} />
            </div>
            <label className="flex items-center gap-2 mt-5">
              <input type="checkbox" className="accent-primary" checked={!!rules?.autoLockoutEnabled} onChange={(e) => setRules({ autoLockoutEnabled: e.target.checked })} />
              <span>Auto-lockout</span>
            </label>
          </div>
          {/* Start / End Session and Checklist */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {sessionActive && activeDate === todayStr ? 'Session active' : 'No active session'}
              </div>
              <div className="flex items-center gap-2">
                {!sessionActive || activeDate !== todayStr ? (
                  <button className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { resetChecklist(todayStr); startSession(todayStr); }}>
                    Start Session
                  </button>
                ) : (
                  <button className="text-xs px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600" onClick={() => {
                    const summary = endSession();
                    setEndSummary(summary);
                    setEndModalOpen(true);
                  }}>
                    End Session
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {checklist.map(item => (
                <label key={item.id} className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={item.checked} onChange={() => toggleItem(item.id)} className="accent-primary" />
                  <span className="text-foreground">{item.text}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            {!isLockedOut ? (
              <button className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80" onClick={() => startLockout(20)}>Lockout 20m</button>
            ) : (
              <div className="flex items-center gap-2">
                <button className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80" onClick={() => { setLockoutUntil(null); cancelLockoutFromStore(); setAutoLockTriggered(false); setLockoutSnooze(60); }}>Cancel Lockout</button>
                <span className="text-[10px] text-muted-foreground">(snoozed 60m)</span>
              </div>
            )}
          </div>
        </motion.div>
        )}

        {/* Compact Focus + Exec tile */}
        {dashboardLayout.find(t => t.id === 'miniKpis')?.visible && (
        <motion.div className="bg-background rounded-2xl p-5 border border-border hover:border-primary/30" whileHover={{ y: -2 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              <h3 className="text-sm font-semibold">Focus & Execution</h3>
            </div>
            <button
              className={`px-3 py-1 rounded text-xs ${isFocusMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              onClick={() => setIsFocusMode(v => !v)}
            >Focus {isFocusMode ? 'On' : 'Off'}</button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Execution Score</span>
              <span className="text-sm font-semibold">{executionScore}</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${executionScore}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Risk adherence</span>
              <span>{riskUsedPct === null ? '—' : (riskUsedPct < 100 ? 'ok' : 'cap hit')}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Trade cap</span>
              <span>{(rules?.maxTrades ?? null) === null ? '—' : `${todayTrades.length}/${rules?.maxTrades}`}</span>
            </div>
          </div>
        </motion.div>
        )}
      </div>



      {/* Recent Trades + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Trades tile */}
        {dashboardLayout.find(t => t.id === 'recentTrades')?.visible && (
        <motion.div
          className="bg-background rounded-2xl p-6 border border-border"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-semibold text-card-foreground">Recent Trades</h2>
            </div>
            <button
              className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80"
              onClick={() => setCurrentView('trades')}
            >
              View all
            </button>
          </div>

          {filteredTrades.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">No trades yet</div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Symbol</th>
                    <th className="text-left px-3 py-2">Side</th>
                    <th className="text-right px-3 py-2">P&L</th>
                    <th className="text-right px-3 py-2">R</th>
                    <th className="text-left px-3 py-2">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades
                    .slice()
                    .sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime())
                    .slice(0, 10)
                    .map((t) => {
                      // All trades are either wins or losses
                      return (
                        <tr key={t.id} className="border-t border-border/60 hover:bg-muted/20">
                          <td className="px-3 py-2 whitespace-nowrap">{new Date(t.entryTime).toLocaleDateString()}</td>
                          <td className="px-3 py-2 font-medium">{t.symbol}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.direction === 'long' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                              {t.direction?.toUpperCase()}
                            </span>
                          </td>
                          <td className={`px-3 py-2 text-right ${((t.pnl || 0) >= 0) ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(t.pnl || 0)}</td>
                          <td className="px-3 py-2 text-right">{Number.isFinite(t.riskRewardRatio) ? t.riskRewardRatio.toFixed(2) : '—'}</td>
                          <td className="px-3 py-2">
                            <span className="capitalize text-muted-foreground">{t.result}</span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
        )}
        <motion.div
          style={{ display: dashboardLayout.find(t => t.id === 'pinnedQuests')?.visible ? undefined : 'none' }}
          className="bg-background rounded-2xl p-6 border border-border"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-card-foreground">Pinned Quests</h2>
          </div>
          
          <div className="space-y-3">
            {pinnedQuestsList.length > 0 ? (
              pinnedQuestsList.map((quest) => (
                <div key={quest.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-card-foreground">{quest.title}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        quest.type === 'daily' ? 'bg-blue-500/20 text-blue-500' :
                        quest.type === 'weekly' ? 'bg-green-500/20 text-green-500' :
                        quest.type === 'monthly' ? 'bg-purple-500/20 text-purple-500' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {quest.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{quest.description}</p>
                    
                    <div className="flex items-center gap-3">
                      {quest.progress > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted-foreground/20 rounded-full h-1.5">
                            <div 
                              className="bg-primary h-1.5 rounded-full transition-all" 
                              style={{ width: `${(quest.progress / quest.maxProgress) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {quest.progress}/{quest.maxProgress}
                          </span>
                        </div>
                      )}
                      
                      {quest.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(quest.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-orange-500 font-bold">+{quest.xpReward} XP</div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No pinned quests yet</p>
                <p className="text-xs text-muted-foreground">
                  Pin daily focus goals from your journal reflections
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          style={{ display: dashboardLayout.find(t => t.id === 'gptInsights')?.visible ? undefined : 'none' }}
          className="bg-background rounded-2xl p-6 border border-border"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-card-foreground">GPT-5 Insights</h2>
          </div>
          
          <div className="space-y-3">
            {filteredTrades.length === 0 && demoAccount ? (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">🎯 Get Started</p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mb-2">
                  Click the database icon below to add 20 realistic demo trades and test all features!
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400">
                  Includes: Tech stocks, ETFs, different outcomes, notes, and tags
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-card-foreground mb-2">💡 Pattern Recognition</p>
                  <p className="text-xs text-muted-foreground">
                    {filteredTrades.length > 0 
                      ? `Your win rate is ${winRate.toFixed(1)}% across ${filteredTrades.length} trades`
                      : 'Add trades to see personalized insights'
                    }
                  </p>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-card-foreground mb-2">📊 Performance</p>
                  <p className="text-xs text-muted-foreground">
                    {filteredTrades.length > 0 
                      ? `Total P&L: ${formatCurrency(totalPnL)} across all trades`
                      : 'Track your performance with the analytics dashboard'
                    }
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Pattern Radar + Reflection Progress + XP/Level */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pattern Radar */}
        <motion.div className="bg-background rounded-2xl p-6 border border-border hover:border-primary/30" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: dashboardLayout.find(t => t.id === 'patternRadar')?.visible ? undefined : 'none' }}>
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-card-foreground">Pattern Radar</h2>
          </div>
          <PatternRadar trades={filteredTrades} notes={notes} />
        </motion.div>

        {/* Reflection Progress */}
        <motion.div className="bg-background rounded-2xl p-6 border border-border hover:border-primary/30" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: dashboardLayout.find(t => t.id === 'reflectionProgress')?.visible ? undefined : 'none' }}>
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-semibold text-card-foreground">Reflection Progress</h2>
          </div>
          <ReflectionProgress todayStr={todayStr} />
        </motion.div>

        {/* XP / Level */}
        <motion.div className="bg-background rounded-2xl p-6 border border-border hover:border-primary/30" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: dashboardLayout.find(t => t.id === 'xpLevel')?.visible ? undefined : 'none' }}>
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-card-foreground">Progress</h2>
          </div>
          <XPLevelWidget />
        </motion.div>
      </div>



      {/* Removed floating action buttons to declutter UI; Coach chat is global */}

      {/* Plan Applied Modal */}
      {planAppliedVisible && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPlanAppliedVisible(false)} />
          <div className="absolute inset-0 flex items-end md:items-center justify-center p-4">
            <div className="w-full md:max-w-md bg-popover border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-border/50 flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-card-foreground">Plan Applied</h3>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-sm text-foreground">Daily focus saved and quests pinned.</p>
                <p className="text-xs text-muted-foreground">Pinned {planAppliedCount} quest(s). You can view them under Pinned Quests on the dashboard.</p>
              </div>
              <div className="p-4 border-t border-border/50 flex justify-end gap-2">
                <button
                  className="px-3 py-1.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 text-sm"
                  onClick={() => setPlanAppliedVisible(false)}
                >Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End Session Modal */}
      {endModalOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEndModalOpen(false)} />
          <div className="absolute inset-0 flex items-end md:items-center justify-center p-4">
            <div className="w-full md:max-w-md bg-popover border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-border/50 flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-card-foreground">Session Summary</h3>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <div>Checklist completed: {endSummary?.completed}/{endSummary?.total}</div>
                <div className="text-muted-foreground">Wrap the day with a quick reflection to lock in learning.</div>
                {(() => {
                  const reflection = selectedAccountId ? getReflectionByDate(todayStr, selectedAccountId) : undefined;
                  const score = reflection?.completionScore || 0;
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Reflection completion</span>
                        <span className="font-medium">{score}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${score}%` }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Quick Reflection (3 prompts) */}
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-medium text-foreground">Quick Reflection</div>
                  <textarea
                    value={rfGood}
                    onChange={(e) => { setRfGood(e.target.value); setRfDraft(todayStr, { good: e.target.value, bad: rfBad, focus: rfFocus }); }}
                    placeholder="What went well today?"
                    className="w-full min-h-[64px] px-3 py-2 bg-muted/30 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                  />
                  <textarea
                    value={rfBad}
                    onChange={(e) => { setRfBad(e.target.value); setRfDraft(todayStr, { good: rfGood, bad: e.target.value, focus: rfFocus }); }}
                    placeholder="What could have been better?"
                    className="w-full min-h-[64px] px-3 py-2 bg-muted/30 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                  />
                  <textarea
                    value={rfFocus}
                    onChange={(e) => { setRfFocus(e.target.value); setRfDraft(todayStr, { good: rfGood, bad: rfBad, focus: e.target.value }); }}
                    placeholder="Focus for tomorrow"
                    className="w-full min-h-[64px] px-3 py-2 bg-muted/30 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-border/50 flex justify-end gap-2">
                <button
                  className="px-3 py-1.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 text-sm"
                  onClick={() => setEndModalOpen(false)}
                >Close</button>
                <button
                  className="px-3 py-1.5 rounded bg-blue-500 text-white hover:bg-blue-600 text-sm disabled:opacity-50"
                  disabled={rfSaving || (!rfGood.trim() && !rfBad.trim() && !rfFocus.trim() && (useAppSettingsStore.getState().reflection.requireContentToComplete !== false))}
                  onClick={async () => {
                    if (!selectedAccountId) return;
                    setRfSaving(true);
                    try {
                      // Save to Reflection Template 2.0 blocks for today
                      const rStore = useReflectionTemplateStore.getState();
                      let refl = rStore.getReflectionByDate(todayStr, selectedAccountId);
                      if (!refl) {
                        refl = rStore.createOrUpdateReflection(todayStr, selectedAccountId);
                      }
                      const ensureBlock = (title: string, content: string, order: number) => {
                        const existing = refl!.insightBlocks.find(b => b.title === title);
                        if (existing) {
                          rStore.updateInsightBlock(refl!.id, existing.id, { content, order });
                        } else {
                          rStore.addInsightBlock(refl!.id, { title, content, tags: [], order, isExpanded: true });
                        }
                      };
                      ensureBlock('What went well', rfGood.trim(), 1);
                      ensureBlock("What didn't go well", rfBad.trim(), 2);
                      ensureBlock('Focus for tomorrow', rfFocus.trim(), 3);

                      // Compute simple completion score and XP
                      const wc = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
                      const words = [wc(rfGood), wc(rfBad), wc(rfFocus)];
                      const completedBlocks = words.filter(w => w >= 20).length;
                      const score = Math.round((completedBlocks / 3) * 100);
                      const xp = words.reduce((sum, w) => sum + (w >= 50 ? 25 : w >= 20 ? 15 : w >= 10 ? 5 : 0), 0);
                      rStore.createOrUpdateReflection(todayStr, selectedAccountId, { completionScore: score, totalXP: xp });

                      // Save to Daily Reflection store and mark complete
                      const dStore = useDailyReflectionStore.getState();
                      const combined = `What went well:\n${rfGood}\n\nWhat didn’t go well:\n${rfBad}\n\nFocus for tomorrow:\n${rfFocus}`;
                      dStore.upsertReflectionForSelection(todayStr, { reflection: combined, keyFocus: rfFocus, isComplete: true }, selectedAccountId);
                      const existing = dStore.getReflectionByDate(todayStr, selectedAccountId);
                      if (existing) dStore.markReflectionComplete(existing.id);

                      setRfGood(''); setRfBad(''); setRfFocus('');
                      clearRfDraft(todayStr);
                      setEndModalOpen(false);

                      // Celebration overlay
                      setCelebrationXP(xp);
                      const colors = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7'];
                      const pieces = Array.from({ length: 30 }).map(() => ({
                        left: Math.random() * 100,
                        delay: Math.random() * 0.6,
                        color: colors[Math.floor(Math.random() * colors.length)],
                      }));
                      setConfetti(pieces);
                      setShowCelebration(true);
                      setTimeout(() => setShowCelebration(false), 1800);
                    } finally {
                      setRfSaving(false);
                    }
                  }}
                >{rfSaving ? 'Saving…' : 'Save & Complete'}</button>
                <button
                  className="px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
                  onClick={() => { setEndModalOpen(false); setCurrentView('journal'); }}
                >Go to Reflection</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-[60] pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-4 py-2 rounded-xl bg-green-500 text-white font-semibold shadow-2xl"
            >
              +{celebrationXP} XP
            </motion.div>
          </div>
          {confetti.map((c, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, opacity: 0, rotate: 0 }}
              animate={{ y: 300, opacity: 1, rotate: 180 }}
              transition={{ duration: 1.2, delay: c.delay, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: 0,
                left: `${c.left}%`,
                width: 8,
                height: 12,
                backgroundColor: c.color,
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      )}
      {/* Customize Tiles Modal */}
      <DashboardTilesModal isOpen={showTilesModal} onClose={() => setShowTilesModal(false)} />
    </div>
  );
}; 