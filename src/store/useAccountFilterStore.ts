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

// Initialize accounts from Firestore and ensure a default exists if none
export const initializeDefaultAccounts = async () => {
  console.log('Initializing accounts...');
  const { setSelectedAccount } = useAccountFilterStore.getState();
  try {
    // Load all accounts from Firestore
    const fetched = await accountService.getAll();
    useAccountFilterStore.setState({ accounts: fetched });
    console.log('Loaded accounts:', fetched);

    const state = useAccountFilterStore.getState();
    if (state.accounts.length === 0) {
      console.log('No accounts found, creating default demo account...');
      const defaultAccount = {
        name: 'Demo Account',
        type: 'demo' as const,
        balance: 10000,
        currency: 'USD',
        broker: 'Demo Broker',
        isActive: true,
      };
      const newAccount = await state.addAccount(defaultAccount);
      setSelectedAccount(newAccount.id);
    } else if (!state.selectedAccountId) {
      const leader = state.accounts.find(a => (a as any).linkedAccountIds && (a as any).linkedAccountIds.length > 0);
      const active = state.accounts.find(a => a.isActive);
      const pick = leader || active || state.accounts[0];
      setSelectedAccount(pick.id);
    }
  } catch (error) {
    console.error('Failed to initialize accounts:', error);
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

// Helper: resolve which account IDs are in scope for a given selection
export const getAccountIdsForSelection = (selectedId: string | null): string[] => {
  const { accounts } = useAccountFilterStore.getState();
  if (!selectedId) return accounts.map((a) => a.id);
  if (selectedId.startsWith('group:')) {
    const leaderId = selectedId.split(':')[1];
    const leader = accounts.find((a) => a.id === leaderId);
    const linked = leader?.linkedAccountIds || [];
    return [leaderId, ...linked];
  }
  return [selectedId];
};

// Get the full group (leader first) for any account selection (single or group)
export const getGroupIdsFromAnySelection = (selectedId: string | null): string[] => {
  const { accounts } = useAccountFilterStore.getState();
  if (!selectedId) return [];
  if (selectedId.startsWith('group:')) {
    return getAccountIdsForSelection(selectedId);
  }
  // If this account is a leader
  const leader = accounts.find(a => a.id === selectedId && (a.linkedAccountIds?.length || 0) > 0);
  if (leader) return [leader.id, ...(leader.linkedAccountIds || [])];
  // If this account is a follower in someone's group
  const parentLeader = accounts.find(a => (a.linkedAccountIds || []).includes(selectedId));
  if (parentLeader) return [parentLeader.id, ...(parentLeader.linkedAccountIds || [])];
  // No group found, return just this account
  return [selectedId];
};