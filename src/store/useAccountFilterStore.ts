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
      // Enforce exclusivity: if updating links, clear others and normalize
      if ('linkedAccountIds' in updates) {
        const currentAccounts = get().accounts;
        const validIds = new Set(currentAccounts.map(a => a.id));
        const desiredFollowers = Array.from(new Set((updates.linkedAccountIds || []) as string[]))
          .filter(fid => fid !== id && validIds.has(fid));

        const otherLeaders = currentAccounts.filter(a => a.id !== id && (a.linkedAccountIds || []).length > 0);

        await Promise.all([
          ...otherLeaders.map(a => accountService.update(a.id, { linkedAccountIds: [] } as any)),
          accountService.update(id, { ...updates, linkedAccountIds: desiredFollowers as any })
        ]);

        const updatedAccounts = currentAccounts.map(acc => {
          if (acc.id === id) return { ...acc, ...updates, linkedAccountIds: desiredFollowers } as any;
          if (otherLeaders.some(l => l.id === acc.id)) return { ...acc, linkedAccountIds: [] } as any;
          return acc;
        });
        set({ accounts: updatedAccounts });
        return;
      }

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
    // Clean up any prior realtime listener
    try {
      const existingUnsub = (window as any).__accountsUnsub;
      if (typeof existingUnsub === 'function') existingUnsub();
      (window as any).__accountsUnsub = undefined;
    } catch {}

    // Load all accounts from Firestore
    const fetched = await accountService.getAll();
    // Sort deterministically by createdAt ascending, fallback to name/id to ensure stability across devices
    const sorted = [...fetched].sort((a: any, b: any) => {
      const aTs = a?.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bTs = b?.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
      if (aTs !== bTs) return aTs - bTs;
      const an = (a?.name || '').localeCompare?.(b?.name || '') || 0;
      if (an !== 0) return an;
      return String(a?.id || '').localeCompare(String(b?.id || ''));
    });
    useAccountFilterStore.setState({ accounts: sorted });
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

    // Attach realtime subscription for accounts
    const unsub = accountService.listenAll((docs) => {
      try {
        const sorted = [...docs].sort((a: any, b: any) => {
          const aTs = a?.createdAt ? new Date(a.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
          const bTs = b?.createdAt ? new Date(b.createdAt).getTime() : Number.MAX_SAFE_INTEGER;
          if (aTs !== bTs) return aTs - bTs;
          const an = (a?.name || '').localeCompare?.(b?.name || '') || 0;
          if (an !== 0) return an;
          return String(a?.id || '').localeCompare(String(b?.id || ''));
        });
        useAccountFilterStore.setState({ accounts: sorted });
        const st = useAccountFilterStore.getState();
        if (!st.selectedAccountId && st.accounts.length > 0) {
          const leader = st.accounts.find(a => (a as any).linkedAccountIds && (a as any).linkedAccountIds.length > 0);
          const active = st.accounts.find(a => a.isActive);
          const pick = leader || active || st.accounts[0];
          setSelectedAccount(pick.id);
        }
      } catch (e) {
        console.warn('accounts realtime update failed:', e);
      }
    });
    (window as any).__accountsUnsub = unsub;
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

// Pseudo account helpers
export const isPseudoAccountId = (accountId: string | null | undefined): boolean => {
  if (!accountId) return false;
  return accountId === 'all' || String(accountId).startsWith('group:');
};

export const filterRealAccounts = <T extends { accountId: string }>(items: T[]): T[] => {
  return items.filter((it) => !isPseudoAccountId(it.accountId));
};

// Helper: resolve which account IDs are in scope for a given selection
export const getAccountIdsForSelection = (selectedId: string | null): string[] => {
  const { accounts } = useAccountFilterStore.getState();
  if (!selectedId) return accounts.filter(a => a.isActive !== false).map((a) => a.id);
  if (selectedId.startsWith('group:')) {
    const leaderId = selectedId.split(':')[1];
    const leader = accounts.find((a) => a.id === leaderId);
    const linked = (leader?.linkedAccountIds || []).filter(id => {
      const acc = accounts.find(a => a.id === id);
      return acc && acc.isActive !== false;
    });
    const includeLeader = leader && leader.isActive !== false ? [leaderId] : [];
    return [...includeLeader, ...linked];
  }
  const single = accounts.find(a => a.id === selectedId);
  return single && single.isActive !== false ? [selectedId] : [];
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