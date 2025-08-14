import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Target, ThumbsUp, TrendingUp, Zap, CheckCircle } from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useSessionStore } from '@/store/useSessionStore';
import { generateDailySummary } from '@/lib/ai/generateDailySummary';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';
import { useCoachHabitStore } from '@/store/useCoachHabitStore';
import { useCoachStore } from '@/store/useCoachStore';

export const CoachView: React.FC = () => {
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { getKeyFocusForDate, reflections } = useDailyReflectionStore();
  const { rules } = useSessionStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const keyFocus = getKeyFocusForDate(todayStr) || '';
  const [isGenerating, setIsGenerating] = useState(false);
  const [debrief, setDebrief] = useState<string>('');
  const { habits, toggle, resetForToday } = useCoachHabitStore();
  const openChat = useCoachStore(s => s.open);
  const addChatMessage = useCoachStore(s => s.addMessage);
  const setCurrentView = useNavigationStore(s => s.setCurrentView);

  const filteredTrades = useMemo(() => {
    return trades.filter(t => !selectedAccountId || t.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

  const todayTrades = useMemo(() => {
    const d0 = new Date(); d0.setHours(0,0,0,0);
    return filteredTrades.filter(t => {
      const d = new Date(t.entryTime); d.setHours(0,0,0,0);
      return d.getTime() === d0.getTime();
    });
  }, [filteredTrades]);

  const stats = useMemo(() => {
    const totalPnL = todayTrades.reduce((s, t) => s + (t.pnl || 0), 0);
    const wins = todayTrades.filter(t => (t.pnl || 0) > 0).length;
    const wr = todayTrades.length ? (wins / todayTrades.length) * 100 : 0;
    const lossesAbs = Math.abs(todayTrades.filter(t => (t.pnl || 0) < 0).reduce((s, t) => s + (t.pnl || 0), 0));
    return { totalPnL, winRate: wr, lossesAbs };
  }, [todayTrades]);

  const handleGenerateDebrief = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const summary = await generateDailySummary({
        trades: todayTrades as any,
        notes: [],
        stats: {
          totalPnL: stats.totalPnL,
          winRate: stats.winRate,
          totalXP: 0,
          moodTrend: 'neutral',
          tradeCount: todayTrades.length,
        },
      });
      setDebrief(summary);
    } finally {
      setIsGenerating(false);
    }
  };

  const encouragement = useMemo(() => {
    const msgs: string[] = [];
    if (rules?.maxTrades != null) msgs.push(`Stay process-first: cap of ${rules.maxTrades} trades keeps you selective.`);
    if (stats.totalPnL < 0) msgs.push('Losses today are tuition. Focus on quality setups and execution tomorrow.');
    if (stats.winRate < 40 && todayTrades.length > 0) msgs.push('Win rate is a snapshot. Keep sample size growing; discipline compounds.');
    if (msgs.length === 0) msgs.push('Solid work staying intentional. Keep following your plan — results follow the process.');
    return msgs;
  }, [rules, stats, todayTrades.length]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coach</h1>
          <p className="text-muted-foreground">Personalized guidance to improve your trading process</p>
        </div>
        {/* Chat bubble exists globally; keep page header minimal */}
      </div>

      {/* Debrief + Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div className="bg-card rounded-2xl p-5 border border-border" whileHover={{ scale: 1.01 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Target className="w-5 h-5 text-primary"/><h3 className="text-sm font-semibold">Daily Debrief</h3></div>
            <button
              className="px-3 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80 text-xs"
              onClick={handleGenerateDebrief}
              disabled={isGenerating}
            >{isGenerating ? 'Generating…' : 'Generate'}</button>
          </div>
          {debrief ? (
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{debrief}</div>
          ) : (
            <div className="text-sm text-muted-foreground">Click Generate to get a concise coaching summary for today.</div>
          )}
        </motion.div>

        <motion.div className="bg-card rounded-2xl p-5 border border-border" whileHover={{ scale: 1.01 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Heart className="w-5 h-5 text-pink-500"/><h3 className="text-sm font-semibold">Focus & Encouragement</h3></div>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted">
              <div className="text-xs text-muted-foreground mb-1">Key Focus</div>
              <div className={cn('text-sm', keyFocus ? 'text-foreground' : 'text-muted-foreground')}>{keyFocus || 'No focus set yet.'}</div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {encouragement.slice(0,2).map((msg, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/40 border border-border text-sm flex items-start gap-2">
                  <ThumbsUp className="w-4 h-4 text-green-500 mt-0.5"/>
                  <span>{msg}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">Today: {todayTrades.length} trades • P&L {formatCurrency(stats.totalPnL)} • Win rate {stats.winRate.toFixed(0)}%</div>
          </div>
        </motion.div>
      </div>

      {/* Next Best Action */}
      <motion.div className="bg-card rounded-2xl p-5 border border-border" whileHover={{ scale: 1.01 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500"/><h3 className="text-sm font-semibold">Next Best Action</h3></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/80" onClick={() => {
            const accId = selectedAccountId || 'default';
            openChat();
            addChatMessage({ role: 'user', content: "Give me a 3-bullet plan to improve tomorrow based on today's trades.", date: todayStr, accountId: accId });
          }}>Ask for 3-step plan</button>
          <button className="px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/80" onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}>Review daily debrief</button>
          <button className="px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-muted/80" onClick={() => {
            setCurrentView('journal');
          }}>Journal reflection</button>
        </div>
      </motion.div>

      {/* Simple trend recap */}
      <motion.div className="bg-card rounded-2xl p-5 border border-border" whileHover={{ scale: 1.01 }}>
        <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-blue-500"/><h3 className="text-sm font-semibold">Process Recap</h3></div>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-muted/40 border">Trades today: <span className="font-semibold">{todayTrades.length}</span></div>
          <div className="p-3 rounded-lg bg-muted/40 border">P&L: <span className={cn('font-semibold', stats.totalPnL>=0?'text-green-500':'text-red-500')}>{formatCurrency(stats.totalPnL)}</span></div>
          <div className="p-3 rounded-lg bg-muted/40 border">Win rate: <span className="font-semibold">{stats.winRate.toFixed(0)}%</span></div>
        </div>
      </motion.div>

      {/* Habit Checklist + Streak */}
      <motion.div className="bg-card rounded-2xl p-5 border border-border" whileHover={{ scale: 1.01 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-500"/><h3 className="text-sm font-semibold">Daily Habits</h3></div>
          <button className="px-3 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80 text-xs" onClick={resetForToday}>Reset</button>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          {habits.map(h => (
            <button key={h.id} onClick={() => toggle(h.id)} className={cn('p-3 rounded-lg border text-left text-sm transition', h.checked ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-muted/40 border-border')}> 
              <div className="flex items-center gap-2">
                <span className={cn('inline-block w-2.5 h-2.5 rounded-full', h.checked ? 'bg-emerald-500' : 'bg-muted-foreground')} />
                <span className={cn(h.checked ? 'text-emerald-400' : 'text-foreground')}>{h.text}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground mt-3">Completing habits daily builds consistency and boosts your long‑term edge.</div>
      </motion.div>
    </div>
  );
};


