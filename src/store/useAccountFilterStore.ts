import { create } from 'zustand';
import { AccountFilterState, TradingAccount } from '@/types';
import { localStorage, STORAGE_KEYS, generateId } from '@/lib/localStorageUtils';

/**
 * Zustand store for account filter state management
 */
export const useAccountFilterStore = create<AccountFilterState>((set, get) => ({
  // Initialize with persisted state
  selectedAccountId: localStorage.getItem(STORAGE_KEYS.SELECTED_ACCOUNT, null),
  accounts: localStorage.getItem(STORAGE_KEYS.ACCOUNTS, []),

  // Set selected account
  setSelectedAccount: (accountId: string | null) => {
    set({ selectedAccountId: accountId });
    localStorage.setItem(STORAGE_KEYS.SELECTED_ACCOUNT, accountId);
  },

  // Add new account
  addAccount: (account: Omit<TradingAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAccount: TradingAccount = {
      ...account,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const currentAccounts = get().accounts;
    const updatedAccounts = [...currentAccounts, newAccount];

    set({ accounts: updatedAccounts });
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, updatedAccounts);

    // If this is the first account, select it automatically
    if (currentAccounts.length === 0) {
      set({ selectedAccountId: newAccount.id });
      localStorage.setItem(STORAGE_KEYS.SELECTED_ACCOUNT, newAccount.id);
    }
  },

  // Update existing account
  updateAccount: (id: string, updates: Partial<TradingAccount>) => {
    const currentAccounts = get().accounts;
    const updatedAccounts = currentAccounts.map(account => 
      account.id === id 
        ? { ...account, ...updates, updatedAt: new Date() }
        : account
    );

    set({ accounts: updatedAccounts });
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, updatedAccounts);
  },

  // Remove account
  removeAccount: (id: string) => {
    const currentAccounts = get().accounts;
    const updatedAccounts = currentAccounts.filter(account => account.id !== id);

    set({ accounts: updatedAccounts });
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, updatedAccounts);

    // If the removed account was selected, select the first remaining account
    if (get().selectedAccountId === id) {
      const newSelectedId = updatedAccounts.length > 0 ? updatedAccounts[0].id : null;
      set({ selectedAccountId: newSelectedId });
      localStorage.setItem(STORAGE_KEYS.SELECTED_ACCOUNT, newSelectedId);
    }
  },
}));

// Selector hooks for performance optimization
export const useSelectedAccount = () => useAccountFilterStore((state) => {
  const selectedId = state.selectedAccountId;
  return selectedId ? state.accounts.find(account => account.id === selectedId) || null : null;
});

export const useAccounts = () => useAccountFilterStore((state) => state.accounts);
export const useActiveAccounts = () => useAccountFilterStore((state) => 
  state.accounts.filter(account => account.isActive)
);

export const useAccountFilterActions = () => useAccountFilterStore((state) => ({
  setSelectedAccount: state.setSelectedAccount,
  addAccount: state.addAccount,
  updateAccount: state.updateAccount,
  removeAccount: state.removeAccount,
}));

// Initialize with demo accounts if none exist
export const initializeDefaultAccounts = () => {
  const store = useAccountFilterStore.getState();
  
  if (store.accounts.length === 0) {
    // Add demo accounts
    const demoAccount: Omit<TradingAccount, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Demo Account',
      type: 'demo',
      balance: 10000,
      currency: 'USD',
      broker: 'Demo Broker',
      isActive: true,
    };

    const liveAccount: Omit<TradingAccount, 'id' | 'createdAt' | 'updatedAt'> = {
      name: 'Live Account',
      type: 'live',
      balance: 5000,
      currency: 'USD',
      broker: 'Interactive Brokers',
      isActive: true,
    };

    store.addAccount(demoAccount);
    store.addAccount(liveAccount);
  }
}; 