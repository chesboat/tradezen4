import { Rule, Action, Trigger, TradingAccount, Metric } from '@/types';

export interface RuleContext {
  account: TradingAccount;
  todayTrades: Array<{ pnl?: number; entryTime: Date | string; tags?: string[] }>;
  now: Date;
  justSavedResult?: 'win' | 'loss' | 'breakeven';
  minutesSinceLastTrade?: number | null;
  riskUsedPct?: number | null;
}

export type Decision = { type: Action['type']; message: string; params?: Record<string, any> };

export const evaluateRules = (event: Trigger, ctx: RuleContext): Decision[] => {
  const decisions: Decision[] = [];
  const sr = ctx.account.sessionRules || {};
  const lossesToday = ctx.todayTrades.filter(t => (t.pnl || 0) < 0).length;

  // Core bullets rule
  if (event === 'tradeSaved' && sr.maxLossesPerDay && ctx.justSavedResult === 'loss') {
    if (lossesToday >= (sr.maxLossesPerDay || 0)) {
      const enforcement = sr.enforcement || (sr.autoLockoutEnabled ? 'lockout' : 'nudge');
      if (enforcement === 'hard') decisions.push({ type: 'hardStop', message: `Daily losses reached (${lossesToday}). Stopping aligns with your plan.` });
      else if (enforcement === 'lockout') decisions.push({ type: 'lockout', message: 'Daily stop reached. Locking out for 20 minutes.' });
      else decisions.push({ type: 'warn', message: 'Daily stop reached. Consider ending session here.' });
      decisions.push({ type: 'praise', message: 'You followed your bullets rule. Excellent discipline.' });
    } else if (lossesToday === (sr.maxLossesPerDay || 0) - 1) {
      decisions.push({ type: 'warn', message: 'One bullet left. Protect your edge.' });
    }
  }

  // Custom rules
  const customs = sr.customRules || [];
  const metrics = getMetricsSnapshot(ctx);
  for (const rule of customs) {
    if (!rule.enabled) continue;
    if (rule.trigger !== event) continue;
    if (!rule.conditions.every(c => compareMetric(metrics, c.metric, c.op, c.value))) continue;
    for (const action of rule.actions) {
      decisions.push({ type: action.type, message: action.message || '', params: action.params });
    }
  }

  return decisions;
};

function getMetricsSnapshot(ctx: RuleContext) {
  const trades = ctx.todayTrades;
  const lossesToday = trades.filter(t => (t.pnl || 0) < 0).length;
  const winsToday = trades.filter(t => (t.pnl || 0) > 0).length;
  const tradesToday = trades.length;
  const pnlToday = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  let lossStreak = 0; for (const t of trades) { if ((t.pnl || 0) < 0) lossStreak++; else break; }
  let winStreak = 0; for (const t of trades) { if ((t.pnl || 0) > 0) winStreak++; else break; }
  const tagCountPositive = countTags(trades, true);
  const tagCountNegative = countTags(trades, false);
  const minutesSinceLastTrade = ctx.minutesSinceLastTrade ?? null;
  const riskUsedPct = ctx.riskUsedPct ?? null;
  const timeOfDay = getTimeOfDay(ctx.now);
  return { lossesToday, winsToday, tradesToday, pnlToday, lossStreak, winStreak, tagCountPositive, tagCountNegative, minutesSinceLastTrade, riskUsedPct, timeOfDay };
}

function countTags(trades: RuleContext['todayTrades'], positive: boolean): number {
  const negatives = new Set(['fomo','revenge','overtrading','tilt','impatience','late-entry','chasing']);
  const positives = new Set(['discipline','patience','followed-plan','risk-management','waited','partial-exit']);
  let count = 0;
  for (const t of trades) {
    for (const tag of (t.tags || [])) {
      const key = tag.toLowerCase();
      if (positive && positives.has(key)) count++;
      if (!positive && negatives.has(key)) count++;
    }
  }
  return count;
}

function getTimeOfDay(d: Date): 'open' | 'midday' | 'pm' {
  const m = d.getHours() * 60 + d.getMinutes();
  if (m < 11 * 60 + 30) return 'open';
  if (m < 14 * 60) return 'midday';
  return 'pm';
}

function compareMetric(m: any, metric: Metric, op: any, value: any): boolean {
  const left = (() => {
    switch (metric) {
      case 'lossesToday': return m.lossesToday;
      case 'winsToday': return m.winsToday;
      case 'tradesToday': return m.tradesToday;
      case 'pnlToday': return m.pnlToday;
      case 'lossStreak': return m.lossStreak;
      case 'winStreak': return m.winStreak;
      case 'riskUsedPct': return m.riskUsedPct ?? 0;
      case 'minutesSinceLastTrade': return m.minutesSinceLastTrade ?? 999;
      case 'timeOfDay': return m.timeOfDay;
      case 'tagCount:positive': return m.tagCountPositive;
      case 'tagCount:negative': return m.tagCountNegative;
      default: return 0;
    }
  })();
  if (typeof left === 'string') return left === value;
  switch (op) {
    case '>': return left > value;
    case '>=': return left >= value;
    case '==': return left == value;
    case '<=': return left <= value;
    case '<': return left < value;
    default: return false;
  }
}


