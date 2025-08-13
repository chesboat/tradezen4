import OpenAI from 'openai';
import { useCoachStore } from '@/store/useCoachStore';
import { QuickNote, Trade } from '@/types';

export interface CoachContext {
  date: string;
  accountId: string;
  trades: Trade[];
  notes: QuickNote[];
  moodSummary?: string;
  rules?: {
    dailyLossLimit?: number | null;
    maxDrawdown?: number | null;
    maxTrades?: number | null;
    cutoffTime?: string | null;
  };
}

export class CoachService {
  private static getClient(): OpenAI | null {
    const apiKey = (import.meta as any).env.VITE_OPENAI_API_KEY;
    if (!apiKey) return null;
    return new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  }

  static async askCoach(question: string, context: CoachContext): Promise<string> {
    try {
      const client = this.getClient();
      const summary = this.enrichContext(context);
      const userJson = JSON.stringify({ question, context, summary }, null, 2);
      if (!client) {
        return this.localAnswer(question, context);
      }
      const state = useCoachStore.getState?.();
      const model = state?.model || 'gpt-4o';
      console.debug('[CoachService] Using model:', model);
      const res = await client.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              `You are an elite trading coach. Use the provided context summary and data to give actionable guidance.\n\nStyle: ${useCoachStore.getState().detailLevel === 'detailed' ? 'a few short paragraphs plus bullets' : '3–6 concise bullets'}.\nRules:\n- Use bold labels (**risk**, **action**, **pattern**)\n- Cite concrete numbers from context (win rate, R, loss cap, time windows)\n- Prioritize process recommendations (entries, pacing, risk)\n- ${useCoachStore.getState().detailLevel === 'detailed' ? '≈220 words max' : '≈120 words max'}\n- No platitudes`,
          },
          { role: 'user', content: userJson },
        ],
        max_completion_tokens: 450,
      });
      return res.choices[0]?.message?.content?.trim() || this.localAnswer(question, context);
    } catch (e) {
      return this.localAnswer(question, context);
    }
  }

  private static enrichContext(ctx: CoachContext): string {
    const trades = ctx.trades || [];
    const notes = ctx.notes || [];
    const recent = trades.slice(-10).reverse();
    const base = recent.length > 0 ? recent : trades;
    const total = base.length;
    const wins = base.filter(t => (t.pnl || 0) > 0).length;
    const losses = base.filter(t => (t.pnl || 0) < 0).length;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const avgR = base.length > 0 ? (base.reduce((s,t) => s + Math.abs((t.pnl || 0)) / Math.max(1, t.riskAmount || 1), 0) / base.length).toFixed(2) : '1.00';
    const totalPnl = base.reduce((s, t) => s + (t.pnl || 0), 0).toFixed(2);
    const bucket = (d: Date) => {
      const m = d.getHours() * 60 + d.getMinutes();
      if (m < 11 * 60 + 30) return 'open';
      if (m < 14 * 60) return 'midday';
      return 'pm';
    };
    const perfByWindow: Record<string, { count: number; pnl: number }> = { open: { count: 0, pnl: 0 }, midday: { count: 0, pnl: 0 }, pm: { count: 0, pnl: 0 } };
    base.forEach(t => {
      const w = bucket(new Date(t.entryTime));
      perfByWindow[w].count += 1;
      perfByWindow[w].pnl += (t.pnl || 0);
    });
    const fmtWindow = (k: string) => `${k}:${perfByWindow[k].count}/${(perfByWindow[k].pnl).toFixed(0)}`;
    const tagCounts = new Map<string, number>();
    const addTag = (tag: string) => {
      const key = tag.toLowerCase();
      tagCounts.set(key, (tagCounts.get(key) || 0) + 1);
    };
    base.forEach(t => (t.tags || []).forEach(addTag));
    notes.forEach(n => (n.tags || []).forEach(addTag));
    const entries = Array.from(tagCounts.entries()).sort((a,b) => b[1]-a[1]);
    const negatives = new Set(['fomo','revenge','overtrading','tilt','impatience','late-entry','chasing']);
    const positives = new Set(['discipline','patience','followed-plan','risk-management','waited','partial-exit']);
    const topGood = entries.filter(([t]) => positives.has(t)).slice(0,3).map(([t,c])=>`#${t}:${c}`).join(', ');
    const topBad = entries.filter(([t]) => negatives.has(t)).slice(0,3).map(([t,c])=>`#${t}:${c}`).join(', ');
    const limit = ctx.rules?.dailyLossLimit || 0;
    const lossesAbs = Math.abs(base.filter(t => (t.pnl || 0) < 0).reduce((s,t)=> s + (t.pnl || 0), 0));
    const riskUsed = limit > 0 ? Math.round((lossesAbs / limit) * 100) : null;
    let streak = 0;
    for (const t of base) { if ((t.pnl || 0) < 0) streak++; else break; }
    return [
      `trades:${total}, winRate:${winRate}%, avg|R|:${avgR}, pnl:${totalPnl}`,
      `windows:${fmtWindow('open')},${fmtWindow('midday')},${fmtWindow('pm')}`,
      `tags_good:${topGood || 'none'}`,
      `tags_bad:${topBad || 'none'}`,
      limit > 0 ? `risk_used:${riskUsed}% of daily_cap(${limit})` : 'risk_cap:none',
      streak >= 2 ? `loss_streak:${streak}` : 'loss_streak:0',
    ].join(' | ');
  }

  private static localAnswer(question: string, context: CoachContext): string {
    const trades = context.trades || [];
    const pnlToday = trades.reduce((s, t) => s + (t.pnl || 0), 0);
    const lossesAbs = Math.abs(trades.filter((t) => (t.pnl || 0) < 0).reduce((s, t) => s + (t.pnl || 0), 0));
    const maxTrades = context.rules?.maxTrades ?? null;
    const limit = context.rules?.dailyLossLimit ?? null;

    if (/max\s*(daily)?\s*loss|loss limit|risk cap/i.test(question)) {
      // Simple R-based fallback guidance
      const avgRisk = trades.length > 0
        ? trades.reduce((s, t) => s + (t.riskAmount || 0), 0) / trades.length
        : 250;
      const twoR = avgRisk * 2;
      const threeR = avgRisk * 3;
      const firmCap = typeof limit === 'number' && limit > 0 ? limit : undefined;
      const suggested = firmCap ? Math.min(firmCap, twoR) : twoR;
      return [
        `- **risk**: avg R ≈ ${Math.round(avgRisk)}`,
        `- **cap (conservative)**: ${Math.round(suggested)} (≈2R)`,
        `- **cap (moderate)**: ${Math.round(Math.min(firmCap || threeR, threeR))} (≈3R)`,
        `- **rule**: use stricter of firm cap${firmCap ? ` (${firmCap})` : ''} and R‑based cap`,
      ].join('\n');
    }

    const guardrail = limit && limit > 0
      ? `Risk used today: ${Math.round((lossesAbs / limit) * 100)}% of daily cap`
      : 'Daily loss limit not set';
    const tradeCount = trades.length;
    const tradeNote = maxTrades ? `${tradeCount}/${maxTrades} trades` : `${tradeCount} trades`;

    return [
      `- **P&L today**: ${pnlToday.toFixed(2)}`,
      `- **guardrail**: ${guardrail}`,
      `- **pace**: ${tradeNote}`,
      `- **action**: set 1–2 micro‑goals; pause if loss cap hit or quality drops`,
    ].join('\n');
  }
}


