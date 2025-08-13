import OpenAI from 'openai';
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
      const userJson = JSON.stringify({ question, context }, null, 2);
      if (!client) {
        return this.localAnswer(question, context);
      }
      const res = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a trading coach. Respond with concise, skimmable guidance grounded in the user\'s trades, notes, mood, and account rules.\n\nFormatting rules:\n- Use 3–6 short bullet points (start lines with “- ”)\n- Bold brief labels where helpful (e.g., **risk**, **action**)\n- Prefer concrete numbers and thresholds\n- Keep under ~120 words unless asked for detail\n- No long paragraphs, no fluff',
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


