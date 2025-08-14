import { Trade, QuickNote, Quest, ActivityLogEntry, TradingAccount, JournalEntry } from './index';

export interface SidebarState {
  isExpanded: boolean;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
}

export interface ActivityLogState {
  isExpanded: boolean;
  activities: ActivityLogEntry[];
  toggleActivityLog: () => void;
  setActivityLogExpanded: (expanded: boolean) => void;
  addActivity: (activity: Omit<ActivityLogEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  clearActivities: () => void;
}

export interface AccountFilterState {
  selectedAccountId: string | null;
  accounts: TradingAccount[];
  setSelectedAccount: (accountId: string | null) => void;
  addAccount: (account: Omit<TradingAccount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TradingAccount>;
  updateAccount: (id: string, updates: Partial<TradingAccount>) => void;
  removeAccount: (id: string) => void;
}

export interface QuestState {
  quests: Quest[];
  pinnedQuests: string[];
  addQuest: (quest: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Quest>;
  updateQuest: (id: string, updates: Partial<Quest>) => Promise<void>;
  completeQuest: (id: string) => Promise<void>;
  cancelQuest: (id: string) => Promise<void>;
  failQuest: (id: string) => Promise<void>;
  cleanupOldQuests: (olderThanDays?: number) => number;
  cleanupPinnedQuests: () => void;
  pinQuest: (id: string) => void;
  unpinQuest: (id: string) => void;
  generateDailyQuests: (trades?: Trade[], notes?: QuickNote[], currentMood?: any, forceRegenerate?: boolean) => Promise<void>;
  updateQuestProgress: (id: string, progressIncrement?: number) => void;
  checkDailyFocusProgress: (accountId: string) => Quest[];
  updateConsistencyProgress: (accountId: string, trades: Trade[]) => void;
}

export interface QuickNoteState {
  notes: QuickNote[];
  addNote: (note: Omit<QuickNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<QuickNote>;
  addInlineNote: (content: string, accountId: string) => Promise<QuickNote>;
  updateNote: (id: string, updates: Partial<QuickNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  getNotesByAccount: (accountId: string) => QuickNote[];
  getNotesByTag: (tag: string) => QuickNote[];
  getNotesForDate: (date: Date) => QuickNote[];
  allTags: string[];
  removeTag: (tag: string) => void;
  initializeNotes: () => Promise<void>;
  uploadImage: (file: Blob | File) => Promise<string>;
}

export interface QuickNoteModalState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export interface JournalStoreState {
  entries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<JournalEntry>;
  updateEntry: (id: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getEntryByDate: (date: string) => JournalEntry | undefined;
}