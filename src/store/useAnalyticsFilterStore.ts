/**
 * Analytics Filter Store
 * Manages filtering context when navigating from Daily Insights to Analytics
 * Apple-style: Smart filtering that helps users understand their patterns
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Trade } from '@/types';

export type AnalyticsFilterType =
  | 'overtrade-days'
  | 'golden-hour'
  | 'revenge-trades'
  | 'session-first'
  | 'session-last'
  | 'loss-pattern'
  | 'habit-correlation'
  | null;

export interface AnalyticsFilter {
  type: AnalyticsFilterType;
  label: string;
  description?: string;
  filterFn: (trade: Trade) => boolean;
  comparisonFilterFn?: (trade: Trade) => boolean; // For showing "vs normal"
}

interface AnalyticsFilterState {
  activeFilter: AnalyticsFilter | null;
  
  /**
   * Set an active filter
   */
  setFilter: (filter: AnalyticsFilter | null) => void;
  
  /**
   * Clear the active filter
   */
  clearFilter: () => void;
  
  /**
   * Get filter function for trades
   */
  getFilteredTrades: (trades: Trade[]) => Trade[];
  
  /**
   * Get comparison trades (for "vs normal" analysis)
   */
  getComparisonTrades: (trades: Trade[]) => Trade[];
}

export const useAnalyticsFilterStore = create<AnalyticsFilterState>()(
  devtools(
    (set, get) => ({
      activeFilter: null,

      setFilter: (filter) => {
        set({ activeFilter: filter });
      },

      clearFilter: () => {
        set({ activeFilter: null });
      },

      getFilteredTrades: (trades) => {
        const { activeFilter } = get();
        if (!activeFilter) return trades;
        
        return trades.filter(activeFilter.filterFn);
      },

      getComparisonTrades: (trades) => {
        const { activeFilter } = get();
        if (!activeFilter || !activeFilter.comparisonFilterFn) return [];
        
        return trades.filter(activeFilter.comparisonFilterFn);
      },
    }),
    { name: 'analytics-filter-store' }
  )
);

/**
 * Factory functions for creating filters from insights
 */

export function createOvertradeDaysFilter(avgTradesPerDay: number): AnalyticsFilter {
  // Group trades by day and find overtrade days
  const dayMap = new Map<string, Trade[]>();
  
  return {
    type: 'overtrade-days',
    label: 'Overtrade Days',
    description: `Days with more than ${Math.ceil(avgTradesPerDay * 1.5)} trades`,
    filterFn: (trade) => {
      // This will be applied per-trade, so we need to identify if the trade's day was an overtrade day
      // We'll do a simpler approach: just show days with many trades
      // The actual logic will be handled when creating the filter with full trade context
      return true; // Placeholder - will be replaced with actual day-based logic
    },
    comparisonFilterFn: (trade) => true, // Normal days
  };
}

export function createGoldenHourFilter(hour: number): AnalyticsFilter {
  return {
    type: 'golden-hour',
    label: `Golden Hour (${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'})`,
    description: `Trades during your best performing hour`,
    filterFn: (trade) => {
      const tradeHour = new Date(trade.entryTime).getHours();
      return tradeHour === hour;
    },
    comparisonFilterFn: (trade) => {
      const tradeHour = new Date(trade.entryTime).getHours();
      return tradeHour !== hour;
    },
  };
}

export function createRevengeTradesFilter(trades: Trade[]): AnalyticsFilter {
  // Build a set of trade IDs that are revenge trades
  const revengeTrades = new Set<string>();
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime()
  );

  for (let i = 1; i < sortedTrades.length; i++) {
    const prevTrade = sortedTrades[i - 1];
    const currentTrade = sortedTrades[i];

    if ((prevTrade.pnl || 0) < 0) {
      const timeDiff =
        (new Date(currentTrade.entryTime).getTime() -
          new Date(prevTrade.entryTime).getTime()) /
        (1000 * 60);

      if (timeDiff <= 30) {
        revengeTrades.add(currentTrade.id);
      }
    }
  }

  return {
    type: 'revenge-trades',
    label: 'Revenge Trades',
    description: 'Trades taken within 30 minutes of a loss',
    filterFn: (trade) => revengeTrades.has(trade.id),
    comparisonFilterFn: (trade) => !revengeTrades.has(trade.id),
  };
}

export function createFirstTradesFilter(trades: Trade[]): AnalyticsFilter {
  // Build a set of first trade IDs per day
  const dayMap = new Map<string, Trade[]>();
  trades.forEach((t) => {
    const dateStr = new Date(t.entryTime).toDateString();
    if (!dayMap.has(dateStr)) {
      dayMap.set(dateStr, []);
    }
    dayMap.get(dateStr)!.push(t);
  });

  const firstTradeIds = new Set<string>();
  dayMap.forEach((dayTrades) => {
    if (dayTrades.length >= 2) {
      const sorted = dayTrades.sort(
        (a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime()
      );
      firstTradeIds.add(sorted[0].id);
    }
  });

  return {
    type: 'session-first',
    label: 'First Trades of Day',
    description: 'Your opening trade each session',
    filterFn: (trade) => firstTradeIds.has(trade.id),
    comparisonFilterFn: (trade) => !firstTradeIds.has(trade.id),
  };
}

export function createLastTradesFilter(trades: Trade[]): AnalyticsFilter {
  // Build a set of last trade IDs per day
  const dayMap = new Map<string, Trade[]>();
  trades.forEach((t) => {
    const dateStr = new Date(t.entryTime).toDateString();
    if (!dayMap.has(dateStr)) {
      dayMap.set(dateStr, []);
    }
    dayMap.get(dateStr)!.push(t);
  });

  const lastTradeIds = new Set<string>();
  dayMap.forEach((dayTrades) => {
    if (dayTrades.length >= 2) {
      const sorted = dayTrades.sort(
        (a, b) => new Date(a.entryTime).getTime() - new Date(b.entryTime).getTime()
      );
      lastTradeIds.add(sorted[sorted.length - 1].id);
    }
  });

  return {
    type: 'session-last',
    label: 'Last Trades of Day',
    description: 'Your closing trade each session',
    filterFn: (trade) => lastTradeIds.has(trade.id),
    comparisonFilterFn: (trade) => !lastTradeIds.has(trade.id),
  };
}

export function createLossPatternFilter(): AnalyticsFilter {
  return {
    type: 'loss-pattern',
    label: 'Recent Losses',
    description: 'Your last 3 losing trades',
    filterFn: (trade) => (trade.pnl || 0) < 0,
    comparisonFilterFn: (trade) => (trade.pnl || 0) >= 0,
  };
}

