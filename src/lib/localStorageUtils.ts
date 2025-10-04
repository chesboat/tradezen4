/**
 * Utility functions for localStorage operations
 */

export const localStorage = {
  /**
   * Get item from localStorage with JSON parsing and validation
   * BULLETPROOF: Handles all edge cases to prevent app crashes
   */
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      const item = window.localStorage.getItem(key);
      
      // No data stored - return default
      if (item === null || item === undefined) {
        return defaultValue;
      }
      
      // Empty string - treat as no data
      if (item === '') {
        console.warn(`[localStorage] Empty string for key "${key}". Clearing and using default.`);
        window.localStorage.removeItem(key);
        return defaultValue;
      }
      
      // Try to parse JSON
      let parsed: any;
      try {
        parsed = JSON.parse(item);
      } catch (parseError) {
        console.warn(`[localStorage] Invalid JSON for key "${key}". Clearing invalid data.`);
        window.localStorage.removeItem(key);
        return defaultValue;
      }
      
      // Validate data structure matches expected type
      
      // If defaultValue is an array, ensure parsed is also an array
      if (Array.isArray(defaultValue)) {
        if (!Array.isArray(parsed)) {
          console.warn(`[localStorage] Expected array for key "${key}", got ${typeof parsed}. Clearing invalid data.`);
          window.localStorage.removeItem(key);
          return defaultValue;
        }
        // Additional validation: ensure array elements are valid
        // If we expect objects with specific properties, check first element
        if (defaultValue.length > 0 && parsed.length > 0) {
          const expectedType = typeof defaultValue[0];
          const actualType = typeof parsed[0];
          if (expectedType !== actualType) {
            console.warn(`[localStorage] Array elements type mismatch for key "${key}". Expected ${expectedType}, got ${actualType}. Clearing.`);
            window.localStorage.removeItem(key);
            return defaultValue;
          }
        }
      }
      
      // If defaultValue is an object (but not array), ensure parsed is too
      else if (defaultValue !== null && typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
        if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
          console.warn(`[localStorage] Expected object for key "${key}", got ${Array.isArray(parsed) ? 'array' : typeof parsed}. Clearing invalid data.`);
          window.localStorage.removeItem(key);
          return defaultValue;
        }
      }
      
      // If defaultValue is a primitive, ensure parsed matches
      else if (typeof defaultValue !== 'object') {
        if (typeof parsed !== typeof defaultValue) {
          console.warn(`[localStorage] Type mismatch for key "${key}". Expected ${typeof defaultValue}, got ${typeof parsed}. Clearing.`);
          window.localStorage.removeItem(key);
          return defaultValue;
        }
      }
      
      return parsed as T;
    } catch (error) {
      console.error(`[localStorage] Unexpected error reading key "${key}":`, error);
      // Proactively clear corrupted data
      try {
        window.localStorage.removeItem(key);
      } catch (e) {
        // Ignore cleanup errors
      }
      return defaultValue;
    }
  },

  /**
   * Set item in localStorage with JSON stringification and error recovery
   */
  setItem: <T>(key: string, value: T): void => {
    try {
      const serialized = JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
    } catch (error) {
      // Check if quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error(`[localStorage] Quota exceeded for key "${key}". Consider clearing old data.`);
      } else {
        console.error(`[localStorage] Error setting key "${key}":`, error);
      }
      // Continue execution - don't block the app
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

  /**
   * Validate and sanitize all localStorage data at startup
   * This prevents corrupted data from breaking the app
   */
  validateAndSanitizeAll: (): void => {
    if (!localStorage.isAvailable()) {
      console.warn('[localStorage] localStorage not available, skipping validation');
      return;
    }

    const keysToValidate = Object.values(STORAGE_KEYS);
    let cleanedCount = 0;

    keysToValidate.forEach(key => {
      try {
        const raw = window.localStorage.getItem(key);
        
        // Skip if no data
        if (raw === null || raw === undefined) return;
        
        // Check for empty strings
        if (raw === '') {
          window.localStorage.removeItem(key);
          cleanedCount++;
          return;
        }
        
        // Try to parse JSON
        try {
          const parsed = JSON.parse(raw);
          
          // Check for null or undefined parsed values
          if (parsed === null || parsed === undefined) {
            window.localStorage.removeItem(key);
            cleanedCount++;
            return;
          }
          
          // Additional checks for common corrupted patterns
          // e.g., string when array expected
          if (key.includes('tasks') || key.includes('tiles') || key.includes('notes')) {
            if (!Array.isArray(parsed)) {
              console.warn(`[localStorage] Startup cleanup: "${key}" should be array, got ${typeof parsed}`);
              window.localStorage.removeItem(key);
              cleanedCount++;
            }
          }
        } catch (parseError) {
          console.warn(`[localStorage] Startup cleanup: Invalid JSON in "${key}"`);
          window.localStorage.removeItem(key);
          cleanedCount++;
        }
      } catch (error) {
        console.error(`[localStorage] Error validating "${key}":`, error);
        // Try to remove the problematic key
        try {
          window.localStorage.removeItem(key);
          cleanedCount++;
        } catch (e) {
          // Ignore
        }
      }
    });

    if (cleanedCount > 0) {
      console.log(`[localStorage] Startup validation: cleaned ${cleanedCount} corrupted item(s)`);
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
  DASHBOARD_TILES: 'tradzen_dashboard_tiles',
  ANALYTICS_TILES: 'tradzen_analytics_tiles',
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
 * Coerce various timestamp shapes into a valid Date
 * - Firestore Timestamp-like: { seconds, nanoseconds }
 * - Unix seconds: number < 1e12
 * - Unix millis: number >= 1e12
 * - ISO string or numeric string
 */
const coerceToDate = (value: any): Date => {
  if (value instanceof Date) return value;
  // Firestore Timestamp instance
  if (value && typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch {
      // fall through
    }
  }
  if (typeof value === 'number') {
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms);
  }
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) {
      return coerceToDate(numeric);
    }
    return new Date(value);
  }
  if (value && typeof value === 'object') {
    const seconds = (value.seconds ?? (value as any)._seconds) as number | undefined;
    const nanoseconds = (value.nanoseconds ?? (value as any)._nanoseconds) as number | undefined;
    if (typeof seconds === 'number') {
      const ms = seconds * 1000 + (typeof nanoseconds === 'number' ? Math.floor(nanoseconds / 1e6) : 0);
      return new Date(ms);
    }
  }
  return new Date(NaN);
};

/**
 * Format time for display
 */
export const formatTime = (date: any): string => {
  const targetDate = coerceToDate(date);
  if (isNaN(targetDate.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(targetDate);
};

/**
 * Format date relative to now
 */
export const formatRelativeTime = (date: any): string => {
  const now = new Date();
  const targetDate = coerceToDate(date);
  if (isNaN(targetDate.getTime())) return 'Unknown';
  const diff = now.getTime() - targetDate.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
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