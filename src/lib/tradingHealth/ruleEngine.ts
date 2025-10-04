/**
 * Trading Health Rule Engine
 * Automatic rule checking for every trade - zero setup required
 */

import type { Trade } from '@/types';
import type { RuleResult, TradeRuleCheck, RuleAdherence } from './types';

// 8 Universal Rules - Automatic, No Setup Required
interface Rule {
  id: string;
  name: string;
  category: 'risk-management' | 'journaling' | 'discipline';
  description: string;
  check: (trade: Trade, allTrades: Trade[]) => boolean;
  points: number; // Weight: 1=basic, 2=important, 3=critical
  improvementTip: string;
}

export const UNIVERSAL_RULES: Rule[] = [
  // ==========================================
  // RISK MANAGEMENT (3 rules)
  // ==========================================
  {
    id: 'risk-amount-set',
    name: 'Set risk amount',
    category: 'risk-management',
    description: 'Defined how much you were risking before entering',
    check: (trade) => {
      // User defined risk amount (means they thought about risk)
      return !!trade.riskAmount && trade.riskAmount > 0;
    },
    points: 3, // Critical
    improvementTip: 'Always define your risk before entering a trade. This forces you to think about position sizing.',
  },
  {
    id: 'position-size-consistent',
    name: 'Position size appropriate',
    category: 'risk-management',
    description: 'Risk per trade stayed within 1-3% of account',
    check: (trade: any) => {
      // Skip if no account balance available (can't calculate risk %)
      if (!trade.riskAmount || !trade.accountBalance) return true; // Pass if can't verify
      const riskPercent = (trade.riskAmount / trade.accountBalance) * 100;
      return riskPercent >= 0.5 && riskPercent <= 3; // 0.5-3% is reasonable
    },
    points: 3, // Critical
    improvementTip: 'Keep risk per trade between 1-3% of your account to survive drawdowns.',
  },
  {
    id: 'risk-reward-minimum',
    name: 'Minimum 1.5:1 R:R',
    category: 'risk-management',
    description: 'Trade had at least 1.5:1 risk-to-reward potential',
    check: (trade: any) => {
      // Check both possible field names
      const rrRatio = trade.rrRatio || trade.riskRewardRatio;
      if (!rrRatio) return false;
      return rrRatio >= 1.5;
    },
    points: 2, // Important
    improvementTip: 'Target at least 1.5:1 or 2:1 R:R to build edge over time. Avoid low R:R trades.',
  },

  // ==========================================
  // JOURNALING (3 rules)
  // ==========================================
  {
    id: 'setup-tagged',
    name: 'Added setup tags',
    category: 'journaling',
    description: 'Tagged the trade with strategy/setup',
    check: (trade) => {
      return !!trade.tags && trade.tags.length > 0;
    },
    points: 2, // Important
    improvementTip: 'Tag every trade with your setup (e.g., #breakout, #reversal) to track which strategies work.',
  },
  {
    id: 'trade-notes-added',
    name: 'Added trade notes',
    category: 'journaling',
    description: 'Wrote at least a sentence about the trade',
    check: (trade: any) => {
      // Check multiple possible fields for notes
      const notes = trade.notes || trade.note || trade.description || '';
      return notes && notes.length >= 10; // At least 10 chars
    },
    points: 2, // Important
    improvementTip: 'Document your thought process. What did you see? Why did you enter? This is how you improve.',
  },
  {
    id: 'result-marked',
    name: 'Marked result',
    category: 'journaling',
    description: 'Logged the outcome (win/loss) and P&L',
    check: (trade) => {
      return trade.result !== undefined && trade.pnl !== undefined;
    },
    points: 3, // Critical
    improvementTip: 'Always log the outcome. You can\'t improve what you don\'t measure.',
  },

  // ==========================================
  // DISCIPLINE (2 rules)
  // ==========================================
  {
    id: 'no-revenge-trading',
    name: 'No revenge trading',
    category: 'discipline',
    description: 'Didn\'t trade impulsively after a loss',
    check: (trade, allTrades) => {
      // Find previous trade
      const tradeIndex = allTrades.findIndex(t => t.id === trade.id);
      if (tradeIndex === -1 || tradeIndex === 0) return true; // First trade or not found
      
      const prevTrade = allTrades[tradeIndex - 1];
      
      // If previous trade was a loss
      if (prevTrade.result === 'loss' && prevTrade.pnl < 0) {
        // Check if current trade happened within 30 minutes
        const timeDiff = new Date(trade.timestamp).getTime() - new Date(prevTrade.timestamp).getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        
        // If trade within 30 min after loss AND larger size = likely revenge
        if (minutesDiff < 30) {
          const prevRrRatio = prevTrade.rrRatio || prevTrade.riskRewardRatio || 1;
          const prevSize = Math.abs(prevTrade.pnl / prevRrRatio);
          const currentSize = Math.abs(trade.riskAmount || 0);
          
          // Revenge trading: quick trade with 1.5x+ size increase
          if (currentSize > prevSize * 1.5) {
            return false; // Likely revenge trading
          }
        }
      }
      
      return true; // No revenge trading detected
    },
    points: 3, // Critical
    improvementTip: 'Take a break after losses. Revenge trading destroys accounts. Walk away for at least 30 minutes.',
  },
  {
    id: 'no-overtrading',
    name: 'No overtrading',
    category: 'discipline',
    description: 'Stayed within daily trade limit (if set)',
    check: (trade, allTrades) => {
      // Get all trades from same day
      const tradeDate = new Date(trade.timestamp).toDateString();
      const tradesThisDay = allTrades.filter(
        t => new Date(t.timestamp).toDateString() === tradeDate
      );
      
      // If more than 5 trades in one day, flag as overtrading
      // (This is a reasonable default - user can adjust via discipline mode)
      return tradesThisDay.length <= 5;
    },
    points: 2, // Important
    improvementTip: 'Quality over quantity. Most profitable traders take 1-3 high-quality setups per day, not 10+.',
  },
];

/**
 * Check all rules for a single trade
 */
export function checkTradeRules(
  trade: Trade,
  allTrades: Trade[]
): TradeRuleCheck {
  const results: RuleResult[] = UNIVERSAL_RULES.map(rule => ({
    rule: rule.name,
    category: rule.category,
    passed: rule.check(trade, allTrades),
    points: rule.points,
  }));

  // Calculate score: (points earned / total possible points) * 100
  const pointsEarned = results.filter(r => r.passed).reduce((sum, r) => sum + r.points, 0);
  const totalPossiblePoints = UNIVERSAL_RULES.reduce((sum, r) => sum + r.points, 0);
  const score = Math.round((pointsEarned / totalPossiblePoints) * 100);

  return {
    trade,
    rules: results,
    score,
  };
}

/**
 * Calculate rule adherence for multiple trades
 */
export function calculateRuleAdherence(trades: Trade[]): RuleAdherence[] {
  if (trades.length === 0) {
    return UNIVERSAL_RULES.map(rule => ({
      rule: rule.name,
      category: rule.category,
      passed: false,
      description: rule.description,
      improvementTip: rule.improvementTip,
    }));
  }

  return UNIVERSAL_RULES.map(rule => {
    // Check how many trades passed this rule
    const passedCount = trades.filter(trade => 
      rule.check(trade, trades)
    ).length;

    const adherenceRate = passedCount / trades.length;

    return {
      rule: rule.name,
      category: rule.category,
      passed: adherenceRate >= 0.8, // 80%+ adherence = passed
      description: rule.description,
      improvementTip: adherenceRate < 0.8 ? rule.improvementTip : undefined,
    };
  });
}

/**
 * Calculate consistency score (0-100)
 */
export function calculateConsistencyScore(trades: Trade[]): number {
  if (trades.length === 0) return 0;

  const totalChecks = trades.length * UNIVERSAL_RULES.length;
  let passedChecks = 0;

  trades.forEach(trade => {
    UNIVERSAL_RULES.forEach(rule => {
      if (rule.check(trade, trades)) {
        passedChecks++;
      }
    });
  });

  return Math.round((passedChecks / totalChecks) * 100);
}

/**
 * Calculate current streak (consecutive days with 80%+ rule adherence)
 */
export function calculateConsistencyStreak(trades: Trade[]): {
  current: number;
  longest: number;
} {
  if (trades.length === 0) return { current: 0, longest: 0 };

  // Group trades by day
  const tradesByDay = new Map<string, Trade[]>();
  trades.forEach(trade => {
    const dateKey = new Date(trade.timestamp).toISOString().split('T')[0];
    if (!tradesByDay.has(dateKey)) {
      tradesByDay.set(dateKey, []);
    }
    tradesByDay.get(dateKey)!.push(trade);
  });

  // Sort days chronologically
  const sortedDays = Array.from(tradesByDay.entries())
    .sort(([a], [b]) => a.localeCompare(b));

  // Calculate score for each day
  const dailyScores = sortedDays.map(([date, dayTrades]) => ({
    date,
    score: calculateConsistencyScore(dayTrades),
    passed: calculateConsistencyScore(dayTrades) >= 80, // 80%+ = good day
  }));

  // Calculate current streak (working backwards from most recent)
  let currentStreak = 0;
  for (let i = dailyScores.length - 1; i >= 0; i--) {
    if (dailyScores[i].passed) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  dailyScores.forEach(day => {
    if (day.passed) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  });

  return {
    current: currentStreak,
    longest: longestStreak,
  };
}
