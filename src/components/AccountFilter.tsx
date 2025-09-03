import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Plus, CreditCard, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccountFilterStore, initializeDefaultAccounts } from '@/store/useAccountFilterStore';
import { Users } from 'lucide-react';
import { AccountManagementModal } from './AccountManagementModal';
import { TradingAccount } from '@/types';
import { CopyTradingManager } from './CopyTradingManager';

interface AccountFilterProps {
  className?: string;
}

export const AccountFilter: React.FC<AccountFilterProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TradingAccount | null>(null);
  const [isCopyManagerOpen, setIsCopyManagerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    selectedAccountId, 
    accounts, 
    setSelectedAccount
  } = useAccountFilterStore();

  const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);

  // Compute link roles
  const leaderIds = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach(a => {
      if (a.linkedAccountIds && a.linkedAccountIds.length > 0) set.add(a.id);
    });
    return set;
  }, [accounts]);

  const followerIds = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach(a => {
      (a.linkedAccountIds || []).forEach(id => set.add(id));
    });
    return set;
  }, [accounts]);

  // Group accounts: each leader followed immediately by its followers, then any remaining accounts alpha
  const groupedAccounts = useMemo(() => {
    const byId = new Map(accounts.map(a => [a.id, a] as const));
    const visited = new Set<string>();
    const groups: TradingAccount[] = [];

    // Add leaders and their followers
    accounts.forEach(acc => {
      const links = (acc.linkedAccountIds || []);
      if (links.length === 0) return;
      if (visited.has(acc.id)) return;
      groups.push(acc);
      visited.add(acc.id);
      links.forEach(fid => {
        const follower = byId.get(fid);
        if (follower && !visited.has(fid)) {
          groups.push(follower);
          visited.add(fid);
        }
      });
    });

    // Append any remaining accounts not in groups, sorted by name
    const remaining = accounts.filter(a => !visited.has(a.id)).sort((a, b) => a.name.localeCompare(b.name));
    return [...groups, ...remaining];
  }, [accounts]);

  const renderLinkBadge = (account: TradingAccount) => {
    const isLeader = leaderIds.has(account.id);
    const isFollower = followerIds.has(account.id);
    if (!isLeader && !isFollower) return null;
    const title = isLeader && isFollower ? 'Leader & Follower' : isLeader ? 'Leader' : 'Follower';
    const label = isLeader && isFollower ? 'Leader • Follower' : isLeader ? 'Leader' : 'Follower';
    return (
      <span
        title={title}
        className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary border border-primary/20"
      >
        {label}
      </span>
    );
  };

  // Initialize default accounts on first load
  useEffect(() => {
    initializeDefaultAccounts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccount(accountId);
    setIsOpen(false);
  };

  const handleAddAccount = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
    setIsOpen(false);
  };

  const handleEditAccount = (account: TradingAccount, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAccount(account);
    setIsModalOpen(true);
    setIsOpen(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const getAccountIcon = (account: TradingAccount) => {
    switch (account.type) {
      case 'live':
        return '🟢';
      case 'demo':
        return '🔵';
      case 'paper':
        return '🟡';
      case 'prop':
        return '🏢';
      default:
        return '⚪';
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'live':
        return 'Live';
      case 'demo':
        return 'Demo';
      case 'paper':
        return 'Paper';
      case 'prop':
        return 'Prop';
      default:
        return 'Unknown';
    }
  };

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: 'easeOut'
      }
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.15,
        ease: 'easeOut'
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="mb-2">
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Account
        </label>
      </div>
      
      <motion.button
        className={`w-full flex items-center justify-between px-3 py-2.5 bg-muted rounded-xl border transition-all duration-200 ${
          isOpen 
            ? 'border-primary shadow-glow-sm' 
            : 'border-border hover:border-primary/50'
        }`}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {selectedAccount ? (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm">{getAccountIcon(selectedAccount)}</span>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-foreground flex items-center">
                {selectedAccount.name}
                {renderLinkBadge(selectedAccount)}
              </div>
              <div className="text-xs text-muted-foreground">
                {getAccountTypeLabel(selectedAccount.type)} • {selectedAccount.currency}
                {selectedAccount.type === 'prop' ? 
                  (selectedAccount.propFirm && ` • ${selectedAccount.propFirm}`) :
                  (selectedAccount.broker && ` • ${selectedAccount.broker}`)
                }
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Select Account</span>
          </div>
        )}
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 bg-popover rounded-xl border border-border shadow-xl z-50"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="py-2 max-h-64 overflow-y-auto">
              {/* All Accounts option */}
              {accounts.length > 1 && (
                <motion.button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors group ${
                    selectedAccountId === null ? 'bg-accent' : ''
                  }`}
                  onClick={() => handleAccountSelect(null as unknown as string)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-popover-foreground flex items-center">
                      All Accounts
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary border border-primary/20">All</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Combined view across {accounts.length} accounts</div>
                  </div>
                  {selectedAccountId === null && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </motion.button>
              )}
              {groupedAccounts.map((account) => {
                const isFollower = followerIds.has(account.id);
                const hasFollowers = (account.linkedAccountIds || []).length > 0;
                const followers = accounts.filter(a => (account.linkedAccountIds || []).includes(a.id));
                return (
                  <div key={account.id} className="[transition:none]">
                    <motion.button
                      className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors group ${
                        selectedAccountId === account.id ? 'bg-accent' : ''
                      } ${isFollower ? 'pl-6' : ''}`}
                      onClick={() => handleAccountSelect(account.id)}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-sm">{getAccountIcon(account)}</span>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium text-popover-foreground flex items-center">
                          {account.name}
                          {renderLinkBadge(account)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getAccountTypeLabel(account.type)} • {account.currency}
                          {account.type === 'prop' ? 
                            (account.propFirm && ` • ${account.propFirm}`) :
                            (account.broker && ` • ${account.broker}`)
                          }
                          {account.type === 'prop' && account.accountPhase && (
                            <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                              account.accountPhase === 'funded' ? 'bg-green-500/20 text-green-400' :
                              account.accountPhase === 'evaluation' ? 'bg-blue-500/20 text-blue-400' :
                              account.accountPhase === 'passed' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {account.accountPhase}
                            </span>
                          )}
                          {hasFollowers && (
                            <>
                              {' '}• Followers: {followers.map(a => a.name).join(', ')}
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleEditAccount(account, e)}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-primary/10 rounded transition-all"
                          title="Edit account"
                        >
                          <Edit3 className="w-3 h-3 text-muted-foreground hover:text-primary" />
                        </button>
                        
                        {selectedAccountId === account.id && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    </motion.button>

                    {hasFollowers && (
                      <motion.button
                        className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent transition-colors group pl-6 ${
                          selectedAccountId === `group:${account.id}` ? 'bg-accent' : ''
                        }`}
                        onClick={() => handleAccountSelect(`group:${account.id}`)}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-popover-foreground flex items-center">
                            {account.name} — Group Total
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 text-[10px] rounded-full bg-primary/10 text-primary border border-primary/20">Group</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Includes {1 + (account.linkedAccountIds?.length || 0)} accounts</div>
                        </div>
                        {selectedAccountId === `group:${account.id}` && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </motion.button>
                    )}
                  </div>
                );
              })}

              {/* Group totals now shown inline under each leader above */}
              
              {accounts.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No accounts found
                </div>
              )}
              
              <div className="border-t border-border mt-2 pt-2">
                <motion.button
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-accent text-primary hover:text-primary/80 transition-colors"
                  onClick={handleAddAccount}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Account</span>
                </motion.button>
                <motion.button
                  className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-accent text-primary hover:text-primary/80 transition-colors"
                  onClick={() => { setIsCopyManagerOpen(true); setIsOpen(false); }}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Manage Copy Trading</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Management Modal */}
      <AccountManagementModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingAccount={editingAccount}
      />
      <CopyTradingManager isOpen={isCopyManagerOpen} onClose={() => setIsCopyManagerOpen(false)} />
    </div>
  );
}; 