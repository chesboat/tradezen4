import React from 'react';

export type TradeDirection = 'long' | 'short';
export type TradeResult = 'win' | 'loss' | 'breakeven';
export type MoodType = 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible';
export type QuestStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type WellnessActionType = 'breathwork' | 'meditation' | 'exercise' | 'gratitude' | 'break';
export type ActivityType = 'trade' | 'note' | 'quest' | 'wellness' | 'xp' | 'reflection' | 'journal';

// Base interface for Firestore documents
export interface FirestoreDocument {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Trade extends FirestoreDocument {
  symbol: string;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  riskAmount: number;
  riskRewardRatio: number;
  result?: TradeResult;
  pnl?: number;
  entryTime: string | Date;
  exitTime?: string | Date;
  mood: MoodType;
  tags: string[];
  notes?: string;
  attachedQuickNotes?: string[];
  accountId: string;
}

export interface QuickNote extends FirestoreDocument {
  content: string;
  tags: string[];
  mood?: MoodType;
  attachedToTradeId?: string;
  accountId: string;
}

export interface Quest extends FirestoreDocument {
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'achievement';
  status: QuestStatus;
  progress: number;
  maxProgress: number;
  xpReward: number;
  dueDate?: Date | string;
  completedAt?: Date | string;
  accountId: string;
}

export interface WellnessAction extends FirestoreDocument {
  type: WellnessActionType;
  title: string;
  description?: string;
  duration?: number; // in minutes
  xpReward: number;
  completedAt: Date | string;
  accountId: string;
}

export interface XPLog extends FirestoreDocument {
  amount: number;
  source: 'trade' | 'quest' | 'wellness' | 'reflection' | 'streak';
  description: string;
  relatedId?: string; // ID of the related trade, quest, etc.
  accountId: string;
}

export interface ActivityLogEntry extends FirestoreDocument {
  type: ActivityType;
  title: string;
  description?: string;
  xpEarned?: number;
  relatedId?: string;
  accountId: string;
}

export interface DailyReflection extends FirestoreDocument {
  date: Date | string;
  trades: Trade[];
  quickNotes: QuickNote[];
  mood: MoodType;
  pnl: number;
  winRate: number;
  avgRR: number;
  lessonsLearned: string[];
  goalsForTomorrow: string[];
  aiSummary?: string;
  accountId: string;
}

export interface TradingAccount extends FirestoreDocument {
  name: string;
  type: 'demo' | 'live' | 'paper' | 'prop';
  balance: number;
  currency: string;
  broker?: string;
  isActive: boolean;
  
  // Prop account specific fields
  propFirm?: string;
  accountPhase?: 'evaluation' | 'funded' | 'breached' | 'passed';
  dailyLossLimit?: number;
  maxDrawdown?: number;
  profitTarget?: number;
  profitSplit?: number;
  currentDrawdown?: number;
  daysTrading?: number;
  minTradingDays?: number;
}

// Store types
export interface TradeState {
  trades: Trade[];
  addTrade: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Trade>;
  updateTrade: (id: string, updates: Partial<Trade>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  getTradesByAccount: (accountId: string) => Trade[];
  getTradesByDateRange: (startDate: Date, endDate: Date) => Trade[];
  getTradesBySymbol: (symbol: string) => Trade[];
  getOpenTrades: () => Trade[];
  getClosedTrades: () => Trade[];
  calculatePnL: (trade: Trade) => number;
  autoCalculateResult: (trade: Trade) => TradeResult;
  getRecentTrades: () => Trade[];
  initializeTrades: () => Promise<void>;
}