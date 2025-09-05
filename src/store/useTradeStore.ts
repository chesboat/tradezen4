import { create } from 'zustand';
import { Trade, TradeResult } from '@/types';
import { classifyTradeResult } from '@/lib/utils';
import { FirestoreService } from '@/lib/firestore';
import { onSnapshot, query, orderBy, collection } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

const tradeService = new FirestoreService<Trade>('trades');

interface TradeState {
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
  initializeTrades: (userIdOverride?: string) => Promise<void>;
}

/**
 * Zustand store for trade state management
 */
export const useTradeStore = create<TradeState>((set, get) => ({
  trades: [],

  // Initialize trades from Firestore
  initializeTrades: async (userIdOverride?: string) => {
    try {
      const trades = await tradeService.getAll();
      const formattedTrades = trades.map(trade => ({
        ...trade,
        createdAt: new Date(trade.createdAt),
        updatedAt: new Date(trade.updatedAt),
        entryTime: new Date(trade.entryTime),
        exitTime: trade.exitTime ? new Date(trade.exitTime) : undefined,
      }));
      // Exclude trades belonging to deleted/inactive accounts
      let filtered = formattedTrades;
      try {
        const mod = await import('./useAccountFilterStore');
        const { accounts } = mod.useAccountFilterStore.getState();
        if (accounts && accounts.length > 0) {
          const validIds = new Set(accounts.filter(a => a.isActive !== false).map(a => a.id));
          filtered = formattedTrades.filter(t => validIds.has(t.accountId));
        }
      } catch (_e) {
        // If account store is not ready yet, fall back to unfiltered
      }
      set({ trades: filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) });

      // Attach realtime listener for trades under current user
      try {
        const existingUnsub = (window as any).__tradesUnsub;
        if (typeof existingUnsub === 'function') existingUnsub();
      } catch {}
      try {
        const userId = userIdOverride || auth.currentUser?.uid;
        if (userId) {
          const colRef = collection(db as any, `users/${userId}/trades`);
          const q = query(colRef, orderBy('createdAt', 'desc'));
          const unsub = onSnapshot(q, async (snap) => {
            const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Trade[];
            const formatted = docs.map(trade => ({
              ...trade,
              createdAt: new Date(trade.createdAt),
              updatedAt: new Date(trade.updatedAt),
              entryTime: new Date(trade.entryTime as any),
              exitTime: (trade as any).exitTime ? new Date((trade as any).exitTime) : undefined,
            }));
            let filteredRealtime = formatted;
            try {
              const { accounts } = (await import('./useAccountFilterStore')).useAccountFilterStore.getState();
              if (accounts && accounts.length > 0) {
                const validIds = new Set(accounts.filter(a => a.isActive !== false).map(a => a.id));
                filteredRealtime = formatted.filter(t => validIds.has((t as any).accountId));
              }
            } catch {}
            set({ trades: filteredRealtime });
          });
          (window as any).__tradesUnsub = unsub;
        }
      } catch (e) {
        console.warn('Trades realtime subscription failed (fallback to one-time load):', e);
      }
    } catch (error) {
      console.error('Failed to initialize trades:', error);
      set({ trades: [] });
    }
  },

  // Add new trade
  addTrade: async (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('useTradeStore: Starting addTrade with data:', trade);
      const now = new Date().toISOString();
      const newTrade = await tradeService.create({
        ...trade,
        createdAt: now,
        updatedAt: now,
        entryTime: trade.entryTime instanceof Date ? trade.entryTime.toISOString() : trade.entryTime,
        exitTime: trade.exitTime instanceof Date ? trade.exitTime.toISOString() : trade.exitTime,
      });

      const formattedTrade = {
        ...newTrade,
        createdAt: new Date(newTrade.createdAt),
        updatedAt: new Date(newTrade.updatedAt),
        entryTime: new Date(newTrade.entryTime),
        exitTime: newTrade.exitTime ? new Date(newTrade.exitTime) : undefined,
      };

      const currentTrades = get().trades;
      const updatedTrades = [formattedTrade, ...currentTrades];
      set({ trades: updatedTrades });

      // Replicate to linked accounts if the source account has links
      try {
        const { accounts } = (await import('./useAccountFilterStore')).useAccountFilterStore.getState();
        const sourceAccount = accounts.find(a => a.id === trade.accountId);
        const linkedIds = sourceAccount?.linkedAccountIds || [];
        if (linkedIds.length > 0) {
          console.log('Replicating trade to linked accounts:', linkedIds);
          await Promise.all(
            linkedIds.map(async (accountId) => {
              const replicated = await tradeService.create({
                ...trade,
                accountId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                entryTime: trade.entryTime instanceof Date ? trade.entryTime.toISOString() : trade.entryTime,
                exitTime: trade.exitTime instanceof Date ? trade.exitTime.toISOString() : trade.exitTime,
              } as unknown as Trade);

              const formattedReplicated = {
                ...replicated,
                createdAt: new Date(replicated.createdAt),
                updatedAt: new Date(replicated.updatedAt),
                entryTime: new Date(replicated.entryTime),
                exitTime: replicated.exitTime ? new Date(replicated.exitTime) : undefined,
              };
              set({ trades: [formattedReplicated, ...get().trades] });
            })
          );
        }
      } catch (replicationError) {
        console.error('Failed to replicate trade to linked accounts:', replicationError);
      }
      return formattedTrade;
    } catch (error) {
      console.error('Failed to add trade:', error);
      throw error;
    }
  },

  // Update existing trade
  updateTrade: async (id: string, updates: Partial<Trade>) => {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
        entryTime: updates.entryTime instanceof Date ? updates.entryTime.toISOString() : updates.entryTime,
        exitTime: updates.exitTime instanceof Date ? updates.exitTime.toISOString() : updates.exitTime,
      };
      await tradeService.update(id, updateData);
      
      const currentTrades = get().trades;
      const updatedTrades = currentTrades.map(trade => 
        trade.id === id 
          ? {
              ...trade,
              ...updates,
              updatedAt: new Date(),
              entryTime: updates.entryTime ? new Date(updates.entryTime) : trade.entryTime,
              exitTime: updates.exitTime ? new Date(updates.exitTime) : trade.exitTime,
            }
          : trade
      );
      set({ trades: updatedTrades });
    } catch (error) {
      console.error('Failed to update trade:', error);
      throw error;
    }
  },

  // Delete trade
  deleteTrade: async (id: string) => {
    try {
      await tradeService.delete(id);
      const currentTrades = get().trades;
      const updatedTrades = currentTrades.filter(trade => trade.id !== id);
      set({ trades: updatedTrades });
    } catch (error) {
      console.error('Failed to delete trade:', error);
      throw error;
    }
  },

  // Get trades by account
  getTradesByAccount: (accountId: string) => {
    return get().trades.filter(trade => trade.accountId === accountId);
  },

  // Get trades by date range
  getTradesByDateRange: (startDate: Date, endDate: Date) => {
    return get().trades.filter(trade => {
      const tradeDate = trade.entryTime instanceof Date ? trade.entryTime : new Date(trade.entryTime);
      return tradeDate >= startDate && tradeDate <= endDate;
    });
  },

  // Get trades by symbol
  getTradesBySymbol: (symbol: string) => {
    return get().trades.filter(trade => 
      trade.symbol.toLowerCase().includes(symbol.toLowerCase())
    );
  },

  // Get open trades (no exit price)
  getOpenTrades: () => {
    return get().trades.filter(trade => !trade.exitPrice);
  },

  // Get closed trades
  getClosedTrades: () => {
    return get().trades.filter(trade => trade.exitPrice);
  },

  // Calculate P&L for a trade
  calculatePnL: (trade: Trade): number => {
    if (!trade.exitPrice) return 0;
    
    const priceDiff = trade.direction === 'long' 
      ? trade.exitPrice - trade.entryPrice
      : trade.entryPrice - trade.exitPrice;
    
    return priceDiff * trade.quantity;
  },

  // Auto-calculate trade result using R-based tolerance (scratches excluded)
  autoCalculateResult: (trade: Trade): TradeResult => {
    return classifyTradeResult(trade);
  },

  // Get recent trades (last 10)
  getRecentTrades: () => {
    return get().trades.slice(0, 10);
  },
}));

// Initialize trades when auth state changes
export const initializeTradeStore = async () => {
  await useTradeStore.getState().initializeTrades();
};

// Selector hooks for performance optimization
export const useTrades = () => useTradeStore((state) => state.trades);
export const useTradeActions = () => useTradeStore((state) => ({
  addTrade: state.addTrade,
  updateTrade: state.updateTrade,
  deleteTrade: state.deleteTrade,
}));

export const useTradesByAccount = (accountId: string) => useTradeStore((state) => 
  state.getTradesByAccount(accountId)
);

export const useOpenTrades = () => useTradeStore((state) => state.getOpenTrades());
export const useClosedTrades = () => useTradeStore((state) => state.getClosedTrades());
export const useRecentTrades = () => useTradeStore((state) => state.getRecentTrades());