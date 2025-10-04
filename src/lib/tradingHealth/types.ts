/**
 * Trading Health System Types
 * Apple-style health rings for trading performance
 */

import type { Trade } from '@/types';

export interface TradingHealthScore {
  edge: number;           // 0-100: Based on expectancy
  consistency: number;    // 0-100: Based on rule adherence
  riskControl: number;    // 0-100: Based on drawdown management
  overall: number;        // Average of all three
}

export interface RingMetric {
  value: number;          // 0-100
  goal: number;           // Target value (usually 80-90)
  status: 'excellent' | 'good' | 'needs-work' | 'critical';
  trend: 'improving' | 'stable' | 'declining';
  weekOverWeekChange: number; // Percentage change from last week
}

export interface TradingHealthMetrics {
  edge: RingMetric & {
    expectancy: number;
    winRate: number;
    profitFactor: number;
  };
  consistency: RingMetric & {
    rulesFollowed: number;
    totalRules: number;
    ruleBreakdown: RuleAdherence[];
    currentStreak: number;
    longestStreak: number;
  };
  riskControl: RingMetric & {
    currentDrawdown: number;
    peakEquity: number;
    avgRisk: number;
    maxConsecutiveLosses: number;
  };
}

export interface RuleAdherence {
  rule: string;
  category: 'risk-management' | 'journaling' | 'discipline';
  passed: boolean;
  description: string;
  improvementTip?: string;
}

export interface TradeRuleCheck {
  trade: Trade;
  rules: RuleResult[];
  score: number; // 0-100 based on % of rules followed
}

export interface RuleResult {
  rule: string;
  category: 'risk-management' | 'journaling' | 'discipline';
  passed: boolean;
  points: number; // Weight of this rule (1-3)
}

export type TimeWindow = '7d' | '30d' | '90d';

export interface StreakMilestone {
  days: number;
  title: string;
  description: string;
  icon: string;
  achieved: boolean;
  achievedDate?: Date;
}

export interface TradingHealthHistory {
  date: Date;
  edge: number;
  consistency: number;
  riskControl: number;
}
