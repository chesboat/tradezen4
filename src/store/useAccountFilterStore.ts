import { create } from 'zustand';
import { TradingAccount } from '@/types';
import { AccountFilterState } from '@/types/stores';
import { FirestoreService } from '@/lib/firestore';

const accountService = new FirestoreService<TradingAccount>('tradingAccounts');

export const useAccountFilterStore = create<AccountFilterState>((set, get) => ({
  selectedAccountId: null,
  accounts: [],
  
  // Multi-select mode state
  multiSelectMode: false,
  selectedAccountIds: [],
  
  setMultiSelectMode: (enabled) => {
    const state = get();
    if (enabled) {
      // Switching to multi-select: initialize with current selection
      const currentIds = state.selectedAccountId 
        ? getAccountIdsForSelection(state.selectedAccountId)
        : [];
      set({ 
        multiSelectMode: true,
        selectedAccountIds: currentIds.length > 0 ? currentIds : []
      });
    } else {
      // Switching to single-select: use first selected account or keep current
      const firstId = state.selectedAccountIds[0] || state.selectedAccountId;
      set({ 
        multiSelectMode: false,
        selectedAccountId: firstId
      });
    }
  },
  
  setSelectedAccountIds: (accountIds) => {
    set({ selectedAccountIds: accountIds });
  },
  
  toggleAccountInMultiSelect: (accountId) => {
    const state = get();
    const currentIds = state.selectedAccountIds;
    const isSelected = currentIds.includes(accountId);
    
    if (isSelected) {
      // Don't allow deselecting the last account
      if (currentIds.length === 1) return;
      set({ selectedAccountIds: currentIds.filter(id => id !== accountId) });
    } else {
      set({ selectedAccountIds: [...currentIds, accountId] });
    }
  },

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
      // Do not mutate local state optimistically; rely on realtime listener to avoid duplicates
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
      // Deduplicate by id in case of race with realtime listener
      const unique = Array.from(new Map(updatedAccounts.map(a => [a.id, a])).values());
      set({ accounts: unique });
    } catch (error) {
      console.error('Failed to update account:', error);
      throw error;
    }
  },

  removeAccount: async (id) => {
    try {
      await accountService.delete(id);
      const currentAccounts = get().accounts;
      const filtered = currentAccounts.filter(acc => acc.id !== id);
      set({ accounts: filtered });
    } catch (error) {
      console.error('Failed to remove account:', error);
      throw error;
    }
  },

  duplicateAccount: async (id) => {
    try {
      const currentAccounts = get().accounts;
      const accountToDuplicate = currentAccounts.find(acc => acc.id === id);
      
      if (!accountToDuplicate) {
        throw new Error('Account not found');
      }

      // Generate new name with incremented number
      const baseName = accountToDuplicate.name.replace(/\s+\d+$/, ''); // Remove trailing number
      const existingNumbers = currentAccounts
        .filter(acc => acc.name.startsWith(baseName))
        .map(acc => {
          const match = acc.name.match(/\s+(\d+)$/);
          return match ? parseInt(match[1]) : 1;
        });
      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 2;
      const newName = `${baseName} ${nextNumber}`;

      // Create duplicate without id, createdAt, updatedAt, and without linkedAccountIds
      const { id: _id, createdAt: _created, updatedAt: _updated, linkedAccountIds: _linked, archivedAt, archivedReason, ...accountData } = accountToDuplicate as any;
      
      const duplicatedAccount = {
        ...accountData,
        name: newName,
        status: 'active' as const, // Always start duplicates as active
      };

      return await get().addAccount(duplicatedAccount);
    } catch (error) {
      console.error('Failed to duplicate account:', error);
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
    // Ensure uniqueness by id
    const uniqueSorted = Array.from(new Map(sorted.map(a => [a.id, a])).values());
    useAccountFilterStore.setState({ accounts: uniqueSorted });
    console.log('Loaded accounts:', fetched);

    const state = useAccountFilterStore.getState();
    if (state.accounts.length === 0) {
      // 🍎 APPLE WAY: Auto-create "Live Account" for first-time users
      console.log('🍎 No accounts found - creating default "Live Account"');
      
      try {
        const { addAccount } = useAccountFilterStore.getState();
        const defaultAccount = await addAccount({
          name: 'Live Account',
          type: 'live',
          balance: 0,
          currency: 'USD',
          broker: '',
          status: 'active',
        });
        
        // Pre-select the new account
        if (defaultAccount?.id) {
          setSelectedAccount(defaultAccount.id);
          console.log('✅ Default "Live Account" created and selected');
        }
      } catch (error) {
        console.error('❌ Failed to create default account:', error);
      }
    } else if (!state.selectedAccountId) {
      const activeAccounts = state.accounts.filter(a => getAccountStatus(a) === 'active');
      const leader = activeAccounts.find(a => (a as any).linkedAccountIds && (a as any).linkedAccountIds.length > 0);
      const pick = leader || activeAccounts[0] || state.accounts[0];
      if (pick) setSelectedAccount(pick.id);
    }

    // Attach realtime subscription for accounts (SSOT)
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
        // Ensure uniqueness by id
        const uniqueSorted = Array.from(new Map(sorted.map(a => [a.id, a])).values());
        useAccountFilterStore.setState({ accounts: uniqueSorted });
        try { (window as any).__accountsReady = true; } catch {}
        const st = useAccountFilterStore.getState();
        if (!st.selectedAccountId && st.accounts.length > 0) {
          const activeAccounts = st.accounts.filter(a => getAccountStatus(a) === 'active');
          const leader = activeAccounts.find(a => (a as any).linkedAccountIds && (a as any).linkedAccountIds.length > 0);
          const pick = leader || activeAccounts[0] || st.accounts[0];
          if (pick) setSelectedAccount(pick.id);
        }
      } catch (e) {
        console.warn('accounts realtime update failed:', e);
      }
    }, (err) => {
      console.error('Accounts snapshot error:', err);
    });
    (window as any).__accountsUnsub = unsub;
  } catch (error) {
    console.error('Failed to initialize accounts:', error);
  }
};

// Helper: Normalize account status (backwards compatibility)
export const getAccountStatus = (account: TradingAccount): 'active' | 'archived' | 'deleted' => {
  // Use new status field if available
  if (account.status) return account.status;
  // Fallback to old isActive field
  return account.isActive !== false ? 'active' : 'archived';
};

// Helper: Check if account is active
export const isAccountActive = (account: TradingAccount): boolean => {
  return getAccountStatus(account) === 'active';
};

// Selector hooks
export const useAccounts = () => useAccountFilterStore((state) => state.accounts);
export const useActiveAccounts = () => useAccountFilterStore((state) => 
  state.accounts.filter(acc => isAccountActive(acc))
);
export const useAccountFilterActions = () => useAccountFilterStore((state) => ({
  setSelectedAccount: state.setSelectedAccount,
  addAccount: state.addAccount,
  updateAccount: state.updateAccount,
  removeAccount: state.removeAccount,
  duplicateAccount: state.duplicateAccount,
}));

// Pseudo account helpers
export const isPseudoAccountId = (accountId: string | null | undefined): boolean => {
  if (!accountId) return false;
  return accountId === 'all' || accountId === 'all-with-archived' || String(accountId).startsWith('group:');
};

export const filterRealAccounts = <T extends { accountId: string }>(items: T[]): T[] => {
  return items.filter((it) => !isPseudoAccountId(it.accountId));
};

// Helper: resolve which account IDs are in scope for a given selection
// NOTE: This function reads from the store, so components using it should depend on
// both selectedAccountId AND the multi-select state for proper reactivity
export const getAccountIdsForSelection = (selectedId: string | null, includeArchived: boolean = false): string[] => {
  const { accounts, multiSelectMode, selectedAccountIds } = useAccountFilterStore.getState();
  const filterFn = (a: TradingAccount) => includeArchived ? getAccountStatus(a) !== 'deleted' : isAccountActive(a);
  
  // 🍎 APPLE ENHANCEMENT: Multi-select mode takes precedence
  if (multiSelectMode && selectedAccountIds.length > 0) {
    // Return the explicitly selected account IDs
    // Filter to ensure they still exist and match the archive filter
    return selectedAccountIds.filter(id => {
      const acc = accounts.find(a => a.id === id);
      return acc && (includeArchived || filterFn(acc));
    });
  }
  
  // Legacy single-select behavior (unchanged)
  // Special case: "all-with-archived" shows ALL accounts (active + archived)
  if (selectedId === 'all-with-archived') {
    return accounts.filter(a => getAccountStatus(a) !== 'deleted').map(a => a.id);
  }
  
  if (!selectedId) return accounts.filter(filterFn).map((a) => a.id);
  if (selectedId.startsWith('group:')) {
    const leaderId = selectedId.split(':')[1];
    const leader = accounts.find((a) => a.id === leaderId);
    const linked = (leader?.linkedAccountIds || []).filter(id => {
      const acc = accounts.find(a => a.id === id);
      return acc && filterFn(acc);
    });
    const includeLeader = leader && filterFn(leader) ? [leaderId] : [];
    return [...includeLeader, ...linked];
  }
  const single = accounts.find(a => a.id === selectedId);
  // When explicitly selecting an individual account (even archived), always return it
  // This allows viewing historical data from archived accounts
  return single && getAccountStatus(single) !== 'deleted' ? [selectedId] : [];
};

// Helper to get a stable reference for dependency arrays
// Returns a string that changes when the selection changes (for any mode)
export const getAccountSelectionKey = (): string => {
  const { selectedAccountId, multiSelectMode, selectedAccountIds } = useAccountFilterStore.getState();
  if (multiSelectMode) {
    return `multi:${selectedAccountIds.sort().join(',')}`;
  }
  return `single:${selectedAccountId || 'all'}`;
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