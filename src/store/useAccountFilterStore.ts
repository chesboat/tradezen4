import { create } from 'zustand';
import { TradingAccount } from '@/types';
import { AccountFilterState } from '@/types/stores';
import { FirestoreService } from '@/lib/firestore';

const accountService = new FirestoreService<TradingAccount>('tradingAccounts');

export const useAccountFilterStore = create<AccountFilterState>((set, get) => ({
  selectedAccountId: null,
  accounts: [],

  setSelectedAccount: (accountId) => {
    set({ selectedAccountId: accountId });
  },

  addAccount: async (account) => {
    try {
      const newAccount = await accountService.create(account);
      const currentAccounts = get().accounts;
      set({ accounts: [...currentAccounts, newAccount] });
    } catch (error) {
      console.error('Failed to add account:', error);
      throw error;
    }
  },

  updateAccount: async (id, updates) => {
    try {
      await accountService.update(id, updates);
      const currentAccounts = get().accounts;
      const updatedAccounts = currentAccounts.map(acc => 
        acc.id === id ? { ...acc, ...updates } : acc
      );
      set({ accounts: updatedAccounts });
    } catch (error) {
      console.error('Failed to update account:', error);
      throw error;
    }
  },

  removeAccount: async (id) => {
    try {
      await accountService.delete(id);
      const currentAccounts = get().accounts;
      set({ accounts: currentAccounts.filter(acc => acc.id !== id) });
    } catch (error) {
      console.error('Failed to remove account:', error);
      throw error;
    }
  }
}));