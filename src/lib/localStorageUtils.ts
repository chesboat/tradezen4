/**
 * Utility functions for localStorage operations
 */

export const localStorage = {
  /**
   * Get item from localStorage with JSON parsing
   */
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  },

  /**
   * Set item in localStorage with JSON stringification
   */
  setItem: <T>(key: string, value: T): void => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  },

  /**
   * Clear all localStorage
   */
  clear: (): void => {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  /**
   * Check if localStorage is available
   */
  isAvailable: (): boolean => {
    try {
      const test = '__localStorage_test__';
      window.localStorage.setItem(test, 'test');
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Storage keys used throughout the application
 */
export const STORAGE_KEYS = {
  SIDEBAR_EXPANDED: 'tradzen_sidebar_expanded',
  ACTIVITY_LOG_EXPANDED: 'tradzen_activity_log_expanded',
  SELECTED_ACCOUNT: 'tradzen_selected_account',
  THEME: 'tradzen_theme',
  PINNED_QUESTS: 'tradzen_pinned_quests',
  TRADES: 'tradzen_trades',
  QUICK_NOTES: 'tradzen_quick_notes',
  ACCOUNTS: 'tradzen_accounts',
  QUESTS: 'tradzen_quests',
  WELLNESS_ACTIONS: 'tradzen_wellness_actions',
  WELLNESS_MOOD: 'tradzen_wellness_mood',
  WELLNESS_STATS: 'tradzen_wellness_stats',
  XP_LOG: 'tradzen_xp_log',
  DAILY_REFLECTIONS: 'tradzen_daily_reflections',
  ACTIVITY_LOG: 'tradzen_activity_log',
  TRADE_LOGGER_DEFAULTS: 'tradzen_trade_logger_defaults',
  RECENT_SYMBOLS: 'tradzen_recent_symbols',
  USER_PROFILE: 'tradzen_user_profile',
  APP_SETTINGS: 'tradzen_app_settings',
  TODO_TASKS: 'tradzen_todo_tasks',
  TODO_DRAWER_EXPANDED: 'tradzen_todo_drawer_expanded',
} as const;

/**
 * Create a persistent store middleware for Zustand
 */
export const createPersistentStore = <T>(
  key: string,
  defaultValue: T
) => ({
  getPersistedState: (): T => localStorage.getItem(key, defaultValue),
  setPersistedState: (state: T): void => localStorage.setItem(key, state),
});

/**
 * Generate a unique ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  // Handle invalid dates
  if (!date || isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Format time for display
 */
export const formatTime = (date: Date | string): string => {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  // Handle invalid dates
  if (isNaN(targetDate.getTime())) {
    return 'Unknown';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(targetDate);
};

/**
 * Format date relative to now
 */
export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  // Handle invalid dates
  if (isNaN(targetDate.getTime())) {
    return 'Unknown';
  }
  
  const diff = now.getTime() - targetDate.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  return total === 0 ? 0 : Math.round((value / total) * 100);
};

/**
 * Get mood color class
 */
export const getMoodColor = (mood: string): string => {
  switch (mood) {
    case 'excellent':
      return 'text-green-400';
    case 'good':
      return 'text-green-300';
    case 'neutral':
      return 'text-yellow-400';
    case 'poor':
      return 'text-orange-400';
    case 'terrible':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

/**
 * Get mood emoji
 */
export const getMoodEmoji = (mood: string): string => {
  switch (mood) {
    case 'excellent':
      return '🤩';
    case 'good':
      return '😊';
    case 'neutral':
      return '😐';
    case 'poor':
      return '😕';
    case 'terrible':
      return '😢';
    default:
      return '❓';
  }
};

/**
 * Debounce function
 */
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function
 */
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Recent symbols management
 */
const MAX_RECENT_SYMBOLS = 8;
const DEFAULT_SYMBOLS = ['AAPL', 'TSLA', 'NVDA', 'AMZN', 'GOOGL', 'MSFT', 'META', 'SPY'];

export const getRecentSymbols = (): string[] => {
  return localStorage.getItem(STORAGE_KEYS.RECENT_SYMBOLS, DEFAULT_SYMBOLS);
};

export const addRecentSymbol = (symbol: string): string[] => {
  const cleanSymbol = symbol.toUpperCase().trim();
  if (!cleanSymbol) return getRecentSymbols();
  
  const currentSymbols = getRecentSymbols();
  
  // Remove symbol if it already exists
  const filteredSymbols = currentSymbols.filter(s => s !== cleanSymbol);
  
  // Add to front
  const newSymbols = [cleanSymbol, ...filteredSymbols];
  
  // Keep only the most recent MAX_RECENT_SYMBOLS
  const trimmedSymbols = newSymbols.slice(0, MAX_RECENT_SYMBOLS);
  
  // Save to localStorage
  localStorage.setItem(STORAGE_KEYS.RECENT_SYMBOLS, trimmedSymbols);
  
  return trimmedSymbols;
};

export const getMostRecentSymbol = (): string => {
  const recentSymbols = getRecentSymbols();
  return recentSymbols[0] || 'AAPL';
}; 