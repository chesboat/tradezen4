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
      return newAccount;
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
export const initializeDefaultAccounts = async () => {
  console.log('Initializing default accounts...');
  const { accounts, addAccount, setSelectedAccount } = useAccountFilterStore.getState();
  
  if (accounts.length === 0) {
    console.log('No accounts found, creating default account...');
    const defaultAccount = {
      name: 'Demo Account',
      type: 'demo' as const,
      balance: 10000,
      currency: 'USD',
      broker: 'Demo Broker',
      isActive: true,
      accountId: 'demo-account-1'
    };
    
    try {
      const newAccount = await addAccount(defaultAccount);
      console.log('Default account created:', newAccount);
      setSelectedAccount(newAccount.id);
      console.log('Selected account set to:', newAccount.id);
    } catch (error) {
      console.error('Failed to create default account:', error);
    }
  } else {
    console.log('Existing accounts found:', accounts);
    // If there are accounts but none selected, select the first active one
    const { selectedAccountId } = useAccountFilterStore.getState();
    if (!selectedAccountId) {
      const activeAccount = accounts.find(acc => acc.isActive);
      if (activeAccount) {
        console.log('Setting selected account to first active account:', activeAccount.id);
        setSelectedAccount(activeAccount.id);
      }
    }
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