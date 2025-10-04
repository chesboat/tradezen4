export type TradeDirection = 'long' | 'short';
// Simplified: Every trade is either a win or loss. No scratches/breakeven.
// This provides honest, reliable data that traders can trust.
export type TradeResult = 'win' | 'loss';
export type MoodType = 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible';
export type QuestStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type WellnessActionType = 'breathwork' | 'meditation' | 'exercise' | 'gratitude' | 'break';
export type ActivityType = 'trade' | 'note' | 'quest' | 'wellness' | 'xp' | 'reflection' | 'journal' | 'habit' | 'weekly_review' | 'todo' | 'rich_note';

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
  accountBalance?: number; // Account balance at time of trade (for risk % calculation)
  timestamp?: string | Date; // Alternative timestamp field (some trades use this instead of entryTime)
  rrRatio?: number; // Alternative field name for riskRewardRatio
  // Review system
  markedForReview?: boolean;
  reviewNote?: string;
  reviewTags?: string[];
  reviewedAt?: string | Date;
  reviewImages?: string[]; // Chart screenshots/annotations
}

export interface QuickNote extends FirestoreDocument {
  content: string;
  tags: string[];
  mood?: MoodType;
  attachedToTradeId?: string;
  accountId: string;
  images?: string[];
}

export interface RichNote extends FirestoreDocument {
  title: string;
  content: string; // HTML from TipTap
  contentJSON: any; // TipTap JSON for editing
  category: 'study' | 'trading' | 'personal' | 'research' | 'meeting' | 'ideas';
  tags: string[];
  isFavorite: boolean;
  isPublic?: boolean; // For sharing notes publicly
  userId?: string; // Owner's user ID (for public sharing paths)
  folder?: string;
  linkedNotes?: string[]; // IDs of related notes
  attachments?: string[]; // Image URLs
  wordCount: number;
  readingTime: number; // estimated minutes
  lastViewedAt?: string;
  accountId?: string; // Optional: study notes are personal, not account-specific
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
  accountId?: string; // Optional: journal-wide quests don't need an account
}

export interface WellnessAction extends FirestoreDocument {
  type: WellnessActionType;
  title: string;
  description?: string;
  duration?: number; // in minutes
  xpReward: number;
  completedAt: Date | string;
  accountId?: string; // Optional: wellness is personal, not account-specific
}

export interface XPLog extends FirestoreDocument {
  amount: number;
  source: 'trade' | 'quest' | 'wellness' | 'reflection' | 'streak' | 'todo';
  description: string;
  relatedId?: string; // ID of the related trade, quest, etc.
  accountId?: string; // Optional: can be journal-wide
}

export interface ActivityLogEntry extends FirestoreDocument {
  type: ActivityType;
  title: string;
  description?: string;
  xpEarned?: number;
  relatedId?: string;
  accountId?: string; // Optional: can be journal-wide
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
  status: 'active' | 'archived' | 'deleted';
  isActive?: boolean; // Deprecated: kept for backwards compatibility, use status instead
  archivedAt?: string | Date; // Timestamp when account was archived
  archivedReason?: string; // Optional reason for archiving
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
  // Account grouping for analytics
  isGroup?: boolean; // True if this is a group of accounts
  groupId?: string; // ID of the group this account belongs to
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
  wrapperClassName?: string;
  fullWidth?: boolean;
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
  category?: InsightBlockCategory; // Category for filtering by day type
}

export type InsightBlockCategory = 'trading' | 'general' | 'weekend';

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
  images?: string[]; // Array of image URLs for trade screenshots and charts
  category?: InsightBlockCategory; // Category for filtering by day type
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

export interface ImprovementTask extends FirestoreDocument {
  text: string;
  status: 'open' | 'done' | 'snoozed';
  priority?: 'low' | 'med' | 'high';
  tags?: string[];
  category?: string;
  dueAt?: Date | string;
  scheduledFor?: Date | string; // New: Things 3 style scheduling
  sourceReflectionId?: string;
  completedAt?: Date | string;
  pinned?: boolean;
  order?: number;
  url?: string; // Optional URL for linking to resources
  notes?: string; // Optional notes for the task (Apple Reminders style)
  accountId?: string; // Optional: todos are personal, not account-specific
}

export type HabitCategory = 'daily' | 'trading' | 'weekdays' | 'custom';

export interface HabitSchedule {
  days: number[]; // 0=Sunday, 1=Monday, etc.
  skipHolidays?: boolean;
}

export interface TallyRule extends FirestoreDocument {
  label: string;
  emoji: string;
  accountId?: string; // Optional: habits are personal, not account-specific
  isActive: boolean;
  category: HabitCategory;
  schedule?: HabitSchedule;
}

export interface TallyLog extends FirestoreDocument {
  date: string; // YYYY-MM-DD format
  ruleId: string;
  tallyCount: number;
  xpEarned: number;
  accountId?: string; // Optional: matches the rule's accountId
}

export interface TallyStreak {
  ruleId: string;
  currentStreak: number;
  longestStreak: number;
  lastTallyDate: string | null;
}

export interface WeeklyReview extends FirestoreDocument {
  weekOf: string; // YYYY-MM-DD (Monday of the week)
  tradingPerformance: string;
  habitsReflection: string;
  lessonsLearned: string;
  nextWeekFocus: string;
  keyWins: string;
  areasToImprove: string;
  isComplete: boolean;
  completedAt?: Date;
  xpEarned: number;
  weeklyStats?: {
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    habitsCompleted: number;
    reflectionDays: number;
  };
  accountId: string;
}