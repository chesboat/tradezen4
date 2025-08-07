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
      const now = new Date().toISOString();
      const newAccount = await accountService.create({
        ...account,
        createdAt: now,
        updatedAt: now,
      });
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

// Initialize default accounts
export const initializeDefaultAccounts = () => {
  const { accounts, addAccount } = useAccountFilterStore.getState();
  
  if (accounts.length === 0) {
    const defaultAccount = {
      name: 'Demo Account',
      type: 'demo' as const,
      balance: 10000,
      currency: 'USD',
      broker: 'Demo Broker',
      isActive: true,
      accountId: 'demo-account-1'
    };
    
    // Don't await since this is initialization
    addAccount(defaultAccount).catch(console.error);
  }
};

// Selector hooks
export const useAccounts = () => useAccountFilterStore((state) => state.accounts);
export const useAccountFilterActions = () => useAccountFilterStore((state) => ({
  setSelectedAccount: state.setSelectedAccount,
  addAccount: state.addAccount,
  updateAccount: state.updateAccount,
  removeAccount: state.removeAccount,
}));