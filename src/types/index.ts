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

export interface DailyJournalData {
  trades: Trade[];
  notes: QuickNote[];
  stats: {
    totalPnL: number;
    winRate: number;
    totalXP: number;
    moodTrend: string;
    tradeCount: number;
  };
}

export interface TradingAccount extends FirestoreDocument {
  name: string;
  type: 'demo' | 'live' | 'paper' | 'prop';
  balance: number;
  currency: string;
  broker?: string;
  isActive: boolean;
  propFirm?: string;
  accountPhase?: 'evaluation' | 'funded' | 'breached' | 'passed';
  dailyLossLimit?: number;
  maxDrawdown?: number;
  profitTarget?: number;
  profitSplit?: number;
  currentDrawdown?: number;
  daysTrading?: number;
  minTradingDays?: number;
  // If set on a primary account, any trade logged to this account
  // will be replicated to each of these linked account IDs
  linkedAccountIds?: string[];
  // Optional per-account session rules overrides
  sessionRules?: {
    maxTrades?: number | null;
    cutoffTimeMinutes?: number | null;
    autoLockoutEnabled?: boolean;
    // Core simple rules
    riskPerTrade?: number | null;
    maxLossesPerDay?: number | null;
    dailyLossCap?: number | null;
    enforcement?: 'off' | 'nudge' | 'lockout' | 'hard';
    // Advanced/custom rules
    customRules?: Rule[];
  };
}

// Rules engine types (advanced)
export type Trigger = 'tradeSaved' | 'sessionTick' | 'sessionStart' | 'sessionEnd' | 'noteAdded';
export type Metric =
  | 'lossesToday' | 'winsToday' | 'tradesToday' | 'pnlToday'
  | 'lossStreak' | 'winStreak' | 'riskUsedPct'
  | 'minutesSinceLastTrade' | 'timeOfDay'
  | 'tagCount:positive' | 'tagCount:negative';
export type Comparator = '>' | '>=' | '==' | '<=' | '<';
export type ActionType = 'nudge' | 'praise' | 'warn' | 'lockout' | 'hardStop' | 'startWellness' | 'pinQuest' | 'coachNote';
export interface Condition { metric: Metric; op: Comparator; value: number | string; windowMins?: number; }
export interface Action { type: ActionType; message?: string; params?: Record<string, any>; }
export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  trigger: Trigger;
  conditions: Condition[];
  actions: Action[];
  cooldownMs?: number;
  scope?: 'account' | 'group';
}

export interface CalendarDay {
  date: Date;
  pnl: number;
  tradesCount: number;
  avgRR: number;
  xpEarned: number;
  mood: MoodType;
  quickNotesCount: number;
  hasNews: boolean;
  hasReflection: boolean;
  winRate: number;
  isOtherMonth?: boolean;
}

export interface WeeklySummary {
  weekStart: Date;
  weekEnd: Date;
  totalPnl: number;
  totalXP: number;
  avgMood: MoodType;
  tradesCount: number;
  winRate: number;
  avgRR: number;
  activeDays: number;
  weekNumber: number;
}

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface GPTSummaryPrompt {
  trades: Trade[];
  quickNotes: QuickNote[];
  mood: MoodType;
  date: Date;
}

export interface DailyJournalData {
  trades: Trade[];
  notes: QuickNote[];
  stats: {
    totalPnL: number;
    winRate: number;
    totalXP: number;
    moodTrend: string;
    tradeCount: number;
  };
}

export interface CustomTemplate extends FirestoreDocument {
  name: string;
  description?: string;
  emoji?: string;
  blocks: TemplateBlock[];
  isDefault: boolean;
  category: 'mindset' | 'performance' | 'learning' | 'custom';
  accountId: string;
  usageCount: number;
}

export interface TemplateBlock {
  id: string;
  title: string;
  prompt: string;
  emoji?: string;
  order: number;
  isRequired: boolean;
  placeholder?: string;
}

export interface InsightBlock extends FirestoreDocument {
  title: string;
  content: string;
  tags?: string[];
  emoji?: string;
  xpEarned?: number;
  order: number;
  isExpanded: boolean;
  templateId?: string;
  templateBlockId?: string;
  isFavorite?: boolean;
}

export interface FavoriteBlock extends FirestoreDocument {
  templateId: string;
  templateBlockId: string;
  title: string;
  prompt: string;
  emoji?: string;
  order: number;
  accountId: string;
}

export interface ReflectionTemplateData extends FirestoreDocument {
  date: string;
  insightBlocks: InsightBlock[];
  aiGeneratedSuggestions?: string[];
  completionScore: number;
  totalXP: number;
  accountId: string;
}

export interface JournalEntry extends FirestoreDocument {
  date: string;
  aiSummary?: string;
  userReflection?: string;
  isComplete: boolean;
  mood?: MoodType;
  tags: string[];
  goals?: string;
  lessons?: string;
  accountId: string;
}