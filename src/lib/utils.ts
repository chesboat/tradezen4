import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as currency
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format number as percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Format date relative to now
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
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
}

/**
 * Generate a random color for avatars
 */
export function getAvatarColor(seed: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-pink-500',
  ];
  
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: Record<string, any>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Random number between min and max
 */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
} 

/**
 * Format a Date as local YYYY-MM-DD (avoids UTC shift issues with toISOString)
 */
export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- Trading metrics helpers (win/loss classification) ---
import type { Trade, TradeResult } from '@/types';

export interface ClassificationOptions {
  breakevenBandR?: number; // tolerance in R to call a scratch
  breakevenBandUSD?: number; // fallback absolute $ band when riskAmount not available
  ignoreFeesForClassification?: boolean; // if true, use gross PnL before fees if provided separately (not available now)
}

export const defaultClassificationOptions: Required<ClassificationOptions> = {
  breakevenBandR: 0.08, // Increased from 5% to 8% of risk
  breakevenBandUSD: 15, // Increased from $10 to $15
  ignoreFeesForClassification: true,
};

function getComputedPnL(trade: Trade): number {
  if (typeof trade.pnl === 'number') return trade.pnl || 0;
  if (!trade.exitPrice) return 0;
  const priceDiff = trade.direction === 'long'
    ? (trade.exitPrice - trade.entryPrice)
    : (trade.entryPrice - trade.exitPrice);
  return priceDiff * trade.quantity;
}

export function classifyTradeResult(trade: Trade, options: ClassificationOptions = {}): TradeResult {
  const opts = { ...defaultClassificationOptions, ...options };
  const pnl = getComputedPnL(trade);
  const risk = Number(trade.riskAmount) || 0;

  // Use hybrid approach: whichever band is more generous
  if (risk > 0 && Number.isFinite(risk)) {
    // Calculate R-based band
    const rBand = risk * opts.breakevenBandR;
    // Use whichever band is larger (more generous)
    const band = Math.max(rBand, opts.breakevenBandUSD);
    
    if (pnl > band) return 'win';
    if (pnl < -band) return 'loss';
    return 'breakeven';
  }

  // Fallback: absolute dollar band only
  const band = Math.max(0, opts.breakevenBandUSD);
  if (pnl > band) return 'win';
  if (pnl < -band) return 'loss';
  return 'breakeven';
}

export function summarizeWinLossScratch(
  trades: Trade[],
  options: ClassificationOptions = {}
): { wins: number; losses: number; scratches: number; winRateExclScratches: number } {
  let wins = 0, losses = 0, scratches = 0;
  
  for (const t of trades) {
    const r = classifyTradeResult(t, options);
    if (r === 'win') wins++; else if (r === 'loss') losses++; else scratches++;
  }
  
  const denom = wins + losses;
  const winRateExclScratches = denom > 0 ? (wins / denom) * 100 : 0;
  
  return { wins, losses, scratches, winRateExclScratches };
}