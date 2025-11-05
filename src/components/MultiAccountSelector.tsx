import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { getAccountStatus, isAccountActive } from '@/store/useAccountFilterStore';
import type { TradingAccount } from '@/types';

interface MultiAccountSelectorProps {
  selectedAccountIds: string[];
  onSelectionChange: (accountIds: string[]) => void;
  className?: string;
  label?: string;
}

export const MultiAccountSelector: React.FC<MultiAccountSelectorProps> = ({
  selectedAccountIds,
  onSelectionChange,
  className,
  label = 'Accounts'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { accounts } = useAccountFilterStore();

  // Separate active and archived accounts
  const activeAccounts = useMemo(() => 
    accounts.filter(isAccountActive).sort((a, b) => a.name.localeCompare(b.name)),
    [accounts]
  );
  
  const archivedAccounts = useMemo(() => 
    accounts.filter(acc => getAccountStatus(acc) === 'archived').sort((a, b) => a.name.localeCompare(b.name)),
    [accounts]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const toggleAccount = (accountId: string) => {
    const newSelection = selectedAccountIds.includes(accountId)
      ? selectedAccountIds.filter(id => id !== accountId)
      : [...selectedAccountIds, accountId];
    
    // Ensure at least one account is selected
    if (newSelection.length > 0) {
      onSelectionChange(newSelection);
    }
  };

  const selectAll = () => {
    onSelectionChange(activeAccounts.map(acc => acc.id));
  };

  const selectNone = () => {
    // Keep at least one selected (first active account)
    if (activeAccounts.length > 0) {
      onSelectionChange([activeAccounts[0].id]);
    }
  };

  const getDisplayText = () => {
    if (selectedAccountIds.length === 0) return 'Select accounts';
    if (selectedAccountIds.length === 1) {
      const account = accounts.find(acc => acc.id === selectedAccountIds[0]);
      return account?.name || 'Unknown account';
    }
    if (selectedAccountIds.length === activeAccounts.length && archivedAccounts.length === 0) {
      return 'All accounts';
    }
    return `${selectedAccountIds.length} accounts`;
  };

  const getAccountIcon = (account: TradingAccount) => {
    if (account.type === 'prop') return '🏆';
    if (account.type === 'demo') return '🎮';
    if (account.type === 'paper') return '📝';
    return '💰';
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <div className="mb-2">
          <label className="block text-xs font-medium text-muted-foreground">
            {label}
          </label>
        </div>
      )}

      {/* Trigger Button */}
      <motion.button
        className={cn(
          'w-full flex items-center justify-between px-3 py-2.5 bg-muted rounded-xl border transition-all duration-200',
          isOpen 
            ? 'border-primary shadow-glow-sm' 
            : 'border-border hover:border-primary/50'
        )}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-2 flex-1">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {getDisplayText()}
          </span>
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-background border border-border rounded-xl shadow-lg overflow-hidden"
          >
            {/* Quick Actions */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
              <span className="text-xs font-medium text-muted-foreground">
                {selectedAccountIds.length} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  All
                </button>
                <span className="text-xs text-muted-foreground">•</span>
                <button
                  onClick={selectNone}
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Account List */}
            <div className="max-h-[400px] overflow-y-auto">
              {/* Active Accounts */}
              {activeAccounts.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/20">
                    Active Accounts
                  </div>
                  {activeAccounts.map((account) => (
                    <AccountCheckboxItem
                      key={account.id}
                      account={account}
                      isSelected={selectedAccountIds.includes(account.id)}
                      onToggle={() => toggleAccount(account.id)}
                      icon={getAccountIcon(account)}
                    />
                  ))}
                </div>
              )}

              {/* Archived Accounts */}
              {archivedAccounts.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted/20 border-t border-border">
                    Archived Accounts
                  </div>
                  {archivedAccounts.map((account) => (
                    <AccountCheckboxItem
                      key={account.id}
                      account={account}
                      isSelected={selectedAccountIds.includes(account.id)}
                      onToggle={() => toggleAccount(account.id)}
                      icon={getAccountIcon(account)}
                      isArchived
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Individual checkbox item component
interface AccountCheckboxItemProps {
  account: TradingAccount;
  isSelected: boolean;
  onToggle: () => void;
  icon: string;
  isArchived?: boolean;
}

const AccountCheckboxItem: React.FC<AccountCheckboxItemProps> = ({
  account,
  isSelected,
  onToggle,
  icon,
  isArchived = false
}) => {
  return (
    <motion.button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 transition-colors',
        'hover:bg-muted/50',
        isArchived && 'opacity-60'
      )}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Custom Checkbox */}
      <div
        className={cn(
          'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200',
          isSelected
            ? 'bg-primary border-primary'
            : 'border-border bg-background'
        )}
      >
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Account Info */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm">{icon}</span>
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium text-foreground truncate">
            {account.name}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {account.type === 'prop' && account.propFirm && `${account.propFirm} • `}
            {account.type !== 'prop' && account.broker && `${account.broker} • `}
            {account.currency}
          </div>
        </div>
      </div>
    </motion.button>
  );
};

