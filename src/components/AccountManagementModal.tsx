import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Trash2, 
  Save, 
  DollarSign, 
  Building, 
  User, 
  Eye, 
  EyeOff,
  AlertTriangle,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { useAccountFilterActions, useAccounts, getAccountStatus } from '@/store/useAccountFilterStore';
import { TradingAccount } from '@/types';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';

interface AccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAccount?: TradingAccount | null;
}

interface AccountForm {
  name: string;
  type: 'demo' | 'live' | 'paper' | 'prop';
  balance: string;
  currency: string;
  broker: string;
  status: 'active' | 'archived' | 'deleted';
  archivedReason?: string;
  linkedAccountIds?: string[];
  
  // Prop account fields
  propFirm: string;
  accountPhase: 'evaluation' | 'funded' | 'breached' | 'passed';
  dailyLossLimit: string;
  maxDrawdown: string;
  profitTarget: string;
  profitSplit: string;
  currentDrawdown: string;
  daysTrading: string;
  minTradingDays: string;
  // Session rules (optional, per-account overrides)
  sessionMaxTrades?: string;
  sessionCutoffTime?: string; // HH:MM
  sessionAutoLockout?: boolean;
  sessionRiskPerTrade?: string;
  sessionMaxLossesPerDay?: string;
  sessionEnforcement?: 'off' | 'nudge' | 'lockout' | 'hard';
  sessionCustomRules?: any[];
}

const ACCOUNT_TYPES = [
  { value: 'demo' as const, label: 'Demo Account', description: 'Practice trading with virtual money' },
  { value: 'live' as const, label: 'Live Account', description: 'Real money trading account' },
  { value: 'paper' as const, label: 'Paper Trading', description: 'Simulated trading with real market data' },
  { value: 'prop' as const, label: 'Prop Account', description: 'Proprietary trading firm account (Topstep, FTMO, etc.)' },
];

const PROP_FIRMS = [
  'Topstep',
  'FTMO',
  'MyForexFunds',
  'The5ers',
  'FundedNext',
  'E8 Funding',
  'TradingPit',
  'BluFX',
  'City Traders Imperium',
  'SurgeTrader',
  'Other'
];

const ACCOUNT_PHASES = [
  { value: 'evaluation' as const, label: 'Evaluation', description: 'Currently in evaluation phase' },
  { value: 'funded' as const, label: 'Funded', description: 'Account is funded and live' },
  { value: 'passed' as const, label: 'Passed', description: 'Evaluation passed, waiting for funding' },
  { value: 'breached' as const, label: 'Breached', description: 'Account breached or failed' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];

export const AccountManagementModal: React.FC<AccountManagementModalProps> = ({
  isOpen,
  onClose,
  editingAccount
}) => {
  const { addAccount, updateAccount, removeAccount, setSelectedAccount } = useAccountFilterActions();
  const accounts = useAccounts();
  const parentLeader = accounts.find(a => (a.linkedAccountIds || []).includes(editingAccount?.id || ''));
  
  const [form, setForm] = useState<AccountForm>({
    name: '',
    type: 'demo',
    balance: '',
    currency: 'USD',
    broker: '',
    status: 'active',
    archivedReason: '',
    linkedAccountIds: [],
    
    // Prop account fields
    propFirm: '',
    accountPhase: 'evaluation',
    dailyLossLimit: '',
    maxDrawdown: '',
    profitTarget: '',
    profitSplit: '80',
    currentDrawdown: '0',
    daysTrading: '0',
    minTradingDays: '5',
    sessionMaxTrades: '',
    sessionCutoffTime: '',
    sessionAutoLockout: true,
    sessionRiskPerTrade: '',
    sessionMaxLossesPerDay: '',
    sessionEnforcement: 'nudge',
    sessionCustomRules: [],
  });
  
  const [errors, setErrors] = useState<Partial<AccountForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form when editing account changes
  useEffect(() => {
    if (editingAccount) {
      setForm({
        name: editingAccount.name,
        type: editingAccount.type,
        balance: editingAccount.balance.toString(),
        currency: editingAccount.currency,
        broker: editingAccount.broker || '',
        status: getAccountStatus(editingAccount),
        archivedReason: editingAccount.archivedReason || '',
        
        // Prop account fields
        propFirm: editingAccount.propFirm || '',
        accountPhase: editingAccount.accountPhase || 'evaluation',
        dailyLossLimit: editingAccount.dailyLossLimit?.toString() || '',
        maxDrawdown: editingAccount.maxDrawdown?.toString() || '',
        profitTarget: editingAccount.profitTarget?.toString() || '',
        profitSplit: editingAccount.profitSplit?.toString() || '80',
        currentDrawdown: editingAccount.currentDrawdown?.toString() || '0',
        daysTrading: editingAccount.daysTrading?.toString() || '0',
        minTradingDays: editingAccount.minTradingDays?.toString() || '5',
        sessionMaxTrades: (editingAccount.sessionRules?.maxTrades ?? '').toString() || '',
        sessionCutoffTime: (typeof editingAccount.sessionRules?.cutoffTimeMinutes === 'number'
          ? `${String(Math.floor((editingAccount.sessionRules.cutoffTimeMinutes||0)/60)).padStart(2,'0')}:${String((editingAccount.sessionRules.cutoffTimeMinutes||0)%60).padStart(2,'0')}`
          : ''),
        sessionAutoLockout: editingAccount.sessionRules?.autoLockoutEnabled ?? true,
        sessionRiskPerTrade: (editingAccount.sessionRules?.riskPerTrade ?? '').toString() || '',
        sessionMaxLossesPerDay: (editingAccount.sessionRules?.maxLossesPerDay ?? '').toString() || '',
        sessionEnforcement: (editingAccount.sessionRules?.enforcement || 'nudge') as any,
        sessionCustomRules: (editingAccount.sessionRules?.customRules as any) || [],
      });
    } else {
      setForm({
        name: '',
        type: 'demo',
        balance: '',
        currency: 'USD',
        broker: '',
        status: 'active',
        archivedReason: '',
        linkedAccountIds: [],
        
        // Prop account fields
        propFirm: '',
        accountPhase: 'evaluation',
        dailyLossLimit: '',
        maxDrawdown: '',
        profitTarget: '',
        profitSplit: '80',
        currentDrawdown: '0',
        daysTrading: '0',
        minTradingDays: '5',
        sessionMaxTrades: '',
        sessionCutoffTime: '',
        sessionAutoLockout: true,
        sessionRiskPerTrade: '',
        sessionMaxLossesPerDay: '',
        sessionEnforcement: 'nudge',
        sessionCustomRules: [],
      });
    }
    setErrors({});
    setShowDeleteConfirm(false);
  }, [editingAccount, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<AccountForm> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Account name is required';
    } else if (form.name.length < 2) {
      newErrors.name = 'Account name must be at least 2 characters';
    }

    const balance = parseFloat(form.balance);
    if (!form.balance || isNaN(balance)) {
      newErrors.balance = 'Valid balance is required';
    } else if (balance < 0) {
      newErrors.balance = 'Balance cannot be negative';
    }

    if (!form.currency) {
      newErrors.currency = 'Currency is required';
    }

    // Prop account specific validation
    if (form.type === 'prop') {
      if (!form.propFirm.trim()) {
        newErrors.propFirm = 'Prop firm is required';
      }

      const dailyLossLimit = parseFloat(form.dailyLossLimit);
      if (!form.dailyLossLimit || isNaN(dailyLossLimit) || dailyLossLimit <= 0) {
        newErrors.dailyLossLimit = 'Valid daily loss limit is required';
      }

      const maxDrawdown = parseFloat(form.maxDrawdown);
      if (!form.maxDrawdown || isNaN(maxDrawdown) || maxDrawdown <= 0) {
        newErrors.maxDrawdown = 'Valid max drawdown is required';
      }

      if (form.accountPhase === 'evaluation') {
        const profitTarget = parseFloat(form.profitTarget);
        if (!form.profitTarget || isNaN(profitTarget) || profitTarget <= 0) {
          newErrors.profitTarget = 'Profit target is required for evaluation accounts';
        }
      }
    }

    // Check for duplicate names (excluding current account if editing)
    const existingAccount = accounts.find(acc => 
      acc.name.toLowerCase() === form.name.toLowerCase() && 
      acc.id !== editingAccount?.id
    );
    if (existingAccount) {
      newErrors.name = 'An account with this name already exists';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const accountData: any = {
        name: form.name.trim(),
        type: form.type,
        balance: parseFloat(form.balance),
        currency: form.currency,
        // Only include broker if non-empty
        ...(form.broker.trim() ? { broker: form.broker.trim() } : {}),
        status: form.status,
        ...(form.status === 'archived' && form.archivedReason ? { archivedReason: form.archivedReason } : {}),
        ...(form.status === 'archived' && !editingAccount?.archivedAt ? { archivedAt: new Date().toISOString() } : {}),
        ...(form.linkedAccountIds && form.linkedAccountIds.length > 0 ? { linkedAccountIds: form.linkedAccountIds } : {}),
        
        // Prop account fields (only include if prop account)
        ...(form.type === 'prop' && {
          ...(form.propFirm.trim() ? { propFirm: form.propFirm.trim() } : {}),
          accountPhase: form.accountPhase,
          dailyLossLimit: parseFloat(form.dailyLossLimit),
          maxDrawdown: parseFloat(form.maxDrawdown),
          ...(form.profitTarget ? { profitTarget: parseFloat(form.profitTarget) } : {}),
          profitSplit: parseFloat(form.profitSplit),
          currentDrawdown: parseFloat(form.currentDrawdown),
          daysTrading: parseInt(form.daysTrading),
          minTradingDays: parseInt(form.minTradingDays),
        }),
      };

      // Session rules overrides
      const sr: any = {};
      if (form.sessionMaxTrades && !isNaN(parseInt(form.sessionMaxTrades))) sr.maxTrades = parseInt(form.sessionMaxTrades);
      if (form.sessionCutoffTime) {
        const [hh, mm] = form.sessionCutoffTime.split(':').map(Number);
        if (Number.isFinite(hh) && Number.isFinite(mm)) sr.cutoffTimeMinutes = hh * 60 + mm;
      }
      sr.autoLockoutEnabled = !!form.sessionAutoLockout;
      if (form.sessionRiskPerTrade) sr.riskPerTrade = parseFloat(form.sessionRiskPerTrade);
      if (form.sessionMaxLossesPerDay) sr.maxLossesPerDay = parseInt(form.sessionMaxLossesPerDay);
      if (form.sessionEnforcement) sr.enforcement = form.sessionEnforcement;
      if (form.sessionCustomRules && form.sessionCustomRules.length > 0) sr.customRules = form.sessionCustomRules;
      if (Object.keys(sr).length > 0) accountData.sessionRules = sr;

      if (editingAccount) {
        await updateAccount(editingAccount.id, accountData);
      } else {
        const newAccount = await addAccount(accountData);
        if (newAccount && newAccount.id) {
          setSelectedAccount(newAccount.id);
        }
      }

      onClose();
    } catch (error) {
      console.error('Failed to save account:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!editingAccount) return;
    
    removeAccount(editingAccount.id);
    onClose();
  };

  const updateForm = (field: keyof AccountForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-xl font-semibold">
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {editingAccount ? 'Update account details' : 'Create a new trading account'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} id="account-form" className="p-6 space-y-6">
            {/* Account Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Account Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="e.g., Live Trading Account"
                className={cn(
                  "w-full px-3 py-2 border rounded-lg transition-colors bg-background text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50",
                  errors.name 
                    ? "border-red-500 focus:border-red-500" 
                    : "border-border focus:border-primary"
                )}
              />
              {errors.name && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Account Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Account Type</label>
              <div className="grid grid-cols-1 gap-2">
                {ACCOUNT_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateForm('type', type.value)}
                    className={cn(
                      "p-3 text-left border rounded-lg transition-all",
                      form.type === type.value
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Balance & Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.balance}
                  onChange={(e) => updateForm('balance', e.target.value)}
                  placeholder="10000"
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg transition-colors bg-background text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    errors.balance 
                      ? "border-red-500 focus:border-red-500" 
                      : "border-border focus:border-primary"
                  )}
                />
                {errors.balance && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errors.balance}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => updateForm('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-background text-foreground"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Broker */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Building className="w-4 h-4" />
                {form.type === 'prop' ? 'Prop Firm' : 'Broker (Optional)'}
              </label>
              {form.type === 'prop' ? (
                <select
                  value={form.propFirm}
                  onChange={(e) => updateForm('propFirm', e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg transition-colors bg-background text-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50",
                    errors.propFirm 
                      ? "border-red-500 focus:border-red-500" 
                      : "border-border focus:border-primary"
                  )}
                >
                  <option value="">Select prop firm</option>
                  {PROP_FIRMS.map((firm) => (
                    <option key={firm} value={firm}>
                      {firm}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.broker}
                  onChange={(e) => updateForm('broker', e.target.value)}
                  placeholder="e.g., Interactive Brokers, TD Ameritrade"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-background text-foreground placeholder:text-muted-foreground"
                />
              )}
              {errors.propFirm && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.propFirm}
                </p>
              )}
            </div>

            {/* Prop Account Specific Fields */}
            {form.type === 'prop' && (
              <>
                {/* Account Phase */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Account Phase</label>
                  <div className="grid grid-cols-1 gap-2">
                    {ACCOUNT_PHASES.map((phase) => (
                      <button
                        key={phase.value}
                        type="button"
                        onClick={() => updateForm('accountPhase', phase.value)}
                        className={cn(
                          "p-3 text-left border rounded-lg transition-all",
                          form.accountPhase === phase.value
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="font-medium">{phase.label}</div>
                        <div className="text-xs text-muted-foreground">{phase.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Risk Limits */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Daily Loss Limit</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.dailyLossLimit}
                      onChange={(e) => updateForm('dailyLossLimit', e.target.value)}
                      placeholder="500"
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg transition-colors bg-background text-foreground placeholder:text-muted-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50",
                        errors.dailyLossLimit 
                          ? "border-red-500 focus:border-red-500" 
                          : "border-border focus:border-primary"
                      )}
                    />
                    {errors.dailyLossLimit && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {errors.dailyLossLimit}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Drawdown</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.maxDrawdown}
                      onChange={(e) => updateForm('maxDrawdown', e.target.value)}
                      placeholder="2500"
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg transition-colors bg-background text-foreground placeholder:text-muted-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50",
                        errors.maxDrawdown 
                          ? "border-red-500 focus:border-red-500" 
                          : "border-border focus:border-primary"
                      )}
                    />
                    {errors.maxDrawdown && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {errors.maxDrawdown}
                      </p>
                    )}
                  </div>
                </div>

                {/* Simple Rules (R and Bullets) */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Risk per Trade ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.sessionRiskPerTrade}
                      onChange={(e) => updateForm('sessionRiskPerTrade', e.target.value)}
                      placeholder="150"
                      className="w-full px-3 py-2 border rounded-lg bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bullets (losses/day)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.sessionMaxLossesPerDay}
                      onChange={(e) => updateForm('sessionMaxLossesPerDay', e.target.value)}
                      placeholder="2"
                      className="w-full px-3 py-2 border rounded-lg bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enforcement</label>
                    <select
                      value={form.sessionEnforcement}
                      onChange={(e) => updateForm('sessionEnforcement', e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-lg bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="off">Off</option>
                      <option value="nudge">Nudge</option>
                      <option value="lockout">Lockout</option>
                      <option value="hard">Hard stop</option>
                    </select>
                  </div>
                </div>

                {/* Advanced Rules (Templates) */}
                <div className="mt-4">
                  <details className="rounded-lg border border-border p-3">
                    <summary className="text-sm font-medium cursor-pointer">Advanced (Templates)</summary>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <button
                        type="button"
                        className={cn(
                          "px-3 py-2 rounded-lg border text-left",
                          (form.sessionCustomRules || []).some(r => r.id === 'tmpl-rapid-loss')
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-accent"
                        )}
                        onClick={() => {
                          // Add rapid loss lockout template (lossStreak >= 2 → lockout + nudge)
                          const current = (form.sessionCustomRules || []);
                          const id = 'tmpl-rapid-loss';
                          if (!current.find(r => r.id === id)) {
                            const rule = {
                              id,
                              name: 'Rapid losses lockout',
                              enabled: true,
                              priority: 10,
                              trigger: 'tradeSaved',
                              conditions: [{ metric: 'lossStreak', op: '>=', value: 2 }],
                              actions: [
                                { type: 'lockout', message: 'Two quick losses. Taking a reset lockout.' },
                                { type: 'nudge', message: 'Step away for 5–10 minutes; protect your edge.' }
                              ],
                              cooldownMs: 5 * 60 * 1000,
                            } as any;
                            updateForm('sessionCustomRules', [...current, rule]);
                          } else {
                            // toggle off
                            updateForm('sessionCustomRules', current.filter(r => r.id !== id));
                          }
                        }}
                      >
                        Rapid losses → lockout 20m { (form.sessionCustomRules || []).some(r => r.id === 'tmpl-rapid-loss') && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary">Selected</span> }
                        <div className="text-xs text-muted-foreground">If loss streak ≥ 2, auto-lockout and nudge (toggle)</div>
                      </button>

                      <button
                        type="button"
                        className={cn(
                          "px-3 py-2 rounded-lg border text-left",
                          (form.sessionCustomRules || []).some(r => r.id === 'tmpl-overtrading')
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-accent"
                        )}
                        onClick={() => {
                          // Add overtrading warning template (negative tags ≥ 3)
                          const current = (form.sessionCustomRules || []);
                          const id = 'tmpl-overtrading';
                          if (!current.find(r => r.id === id)) {
                            const rule = {
                              id,
                              name: 'Overtrading warning',
                              enabled: true,
                              priority: 20,
                              trigger: 'tradeSaved',
                              conditions: [{ metric: 'tagCount:negative', op: '>=', value: 3 }],
                              actions: [
                                { type: 'warn', message: 'Frequent negative tags today. Consider pausing.' }
                              ],
                              cooldownMs: 10 * 60 * 1000,
                            } as any;
                            updateForm('sessionCustomRules', [...current, rule]);
                          } else {
                            updateForm('sessionCustomRules', current.filter(r => r.id !== id));
                          }
                        }}
                      >
                        Overtrading warning { (form.sessionCustomRules || []).some(r => r.id === 'tmpl-overtrading') && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary">Selected</span> }
                        <div className="text-xs text-muted-foreground">Warn when negative tags (e.g., #tilt, #overtrading) ≥ 3 (toggle)</div>
                      </button>
                    </div>
                    {(form.sessionCustomRules || []).length > 0 && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        Selected templates: {(form.sessionCustomRules || []).map(r => r.name).join(', ')}
                        <button
                          type="button"
                          className="ml-2 px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border"
                          onClick={() => updateForm('sessionCustomRules', [])}
                        >Clear</button>
                      </div>
                    )}
                  </details>
                </div>

                {/* Session Rules (optional overrides) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Session Rules (Overrides)</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Max Trades</div>
                      <input
                        type="number"
                        min="0"
                        value={form.sessionMaxTrades}
                        onChange={(e) => updateForm('sessionMaxTrades', e.target.value)}
                        placeholder="e.g., 5"
                        className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Cutoff (HH:MM)</div>
                      <input
                        type="time"
                        value={form.sessionCutoffTime}
                        onChange={(e) => updateForm('sessionCutoffTime', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary bg-background text-foreground"
                      />
                    </div>
                    <label className="flex items-center gap-2 mt-6">
                      <input type="checkbox" className="accent-primary" checked={!!form.sessionAutoLockout} onChange={(e) => updateForm('sessionAutoLockout', e.target.checked)} />
                      <span className="text-sm">Auto-lockout</span>
                    </label>
                  </div>
                </div>

                {/* Evaluation & Tracking - Compact Layout */}
                <div className="space-y-4">
                  {form.accountPhase === 'evaluation' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Profit Target</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.profitTarget}
                          onChange={(e) => updateForm('profitTarget', e.target.value)}
                          placeholder="5000"
                          className={cn(
                            "w-full px-3 py-2 border rounded-lg transition-colors bg-background text-foreground placeholder:text-muted-foreground",
                            "focus:outline-none focus:ring-2 focus:ring-primary/50",
                            errors.profitTarget 
                              ? "border-red-500 focus:border-red-500" 
                              : "border-border focus:border-primary"
                          )}
                        />
                        {errors.profitTarget && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {errors.profitTarget}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Min Trading Days</label>
                        <input
                          type="number"
                          min="0"
                          value={form.minTradingDays}
                          onChange={(e) => updateForm('minTradingDays', e.target.value)}
                          placeholder="5"
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-background text-foreground"
                        />
                      </div>
                    </div>
                  )}

                  {/* Tracking Fields - Compact Layout */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Profit Split (%)</label>
                       <input
                        type="number"
                        min="0"
                        max="100"
                        value={form.profitSplit}
                        onChange={(e) => updateForm('profitSplit', e.target.value)}
                        placeholder="80"
                         className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary bg-background text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Current DD</label>
                       <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.currentDrawdown}
                        onChange={(e) => updateForm('currentDrawdown', e.target.value)}
                        placeholder="0"
                         className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary bg-background text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Days Trading</label>
                       <input
                        type="number"
                        min="0"
                        value={form.daysTrading}
                        onChange={(e) => updateForm('daysTrading', e.target.value)}
                        placeholder="0"
                         className="w-full px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary bg-background text-foreground"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Account Status */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Account Status</label>
              
              {/* Smart suggestion for breached accounts */}
              {editingAccount && form.type === 'prop' && form.accountPhase === 'breached' && form.status === 'active' && (
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-orange-500">Account Breached</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Consider archiving this account to keep your workspace clean while preserving all historical data for analytics.
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => updateForm('status', 'active')}
                  className={cn(
                    "p-3 text-left border rounded-lg transition-all",
                    form.status === 'active'
                      ? "border-green-500 bg-green-500/10 shadow-sm"
                      : "border-border hover:border-green-500/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <div className="font-medium">Active</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Currently trading • Visible in account selector
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateForm('status', 'archived')}
                  className={cn(
                    "p-3 text-left border rounded-lg transition-all",
                    form.status === 'archived'
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4" />
                    <div className="font-medium">Archived</div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Not trading • Hidden from selector • Data preserved for analytics
                  </div>
                </button>
              </div>

              {/* Archive reason (shown when status is archived) */}
              {form.status === 'archived' && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-medium text-muted-foreground">Archive Reason (Optional)</label>
                  <input
                    type="text"
                    value={form.archivedReason || ''}
                    onChange={(e) => updateForm('archivedReason', e.target.value)}
                    placeholder="e.g., Account breached, Switched prop firms, Taking a break"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-background text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              )}

              {/* Show archived date if exists */}
              {editingAccount?.archivedAt && form.status === 'archived' && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Archive className="w-3 h-3" />
                  Archived on {new Date(editingAccount.archivedAt).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Copy trading helper for followers */}
            {editingAccount && parentLeader && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="text-xs text-muted-foreground">
                  This account follows trades from <span className="font-medium text-foreground">{parentLeader.name}</span>.
                </div>
              </div>
            )}

            {/* Linked Accounts */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Linked Accounts (copytrading)</label>
              <p className="text-xs text-muted-foreground">Trades logged to this account will also be added to the selected linked accounts.</p>
              <div className="grid grid-cols-1 gap-2">
                {accounts
                  .filter(acc => !editingAccount || acc.id !== editingAccount.id)
                  .map(acc => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      const current = new Set(form.linkedAccountIds || []);
                      if (current.has(acc.id)) current.delete(acc.id); else current.add(acc.id);
                      updateForm('linkedAccountIds', Array.from(current));
                    }}
                    className={cn(
                      "p-3 text-left border rounded-lg transition-all",
                      form.linkedAccountIds?.includes(acc.id)
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="font-medium">{acc.name}</div>
                    <div className="text-xs text-muted-foreground">{acc.type} • {acc.currency}</div>
                  </button>
                ))}
                {accounts.length <= 1 && (
                  <div className="text-xs text-muted-foreground">Add another account to enable linking.</div>
                )}
              </div>
              {form.linkedAccountIds && form.linkedAccountIds.length > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => updateForm('linkedAccountIds', [])}
                    className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted/80"
                  >
                    Clear links
                  </button>
                </div>
              )}
            </div>

            </form>
          </div>
          
          {/* Actions - Fixed at bottom */}
          <div className="flex gap-3 p-6 border-t border-border bg-card/50 backdrop-blur-sm">
            {editingAccount && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            
            <div className="flex-1" />
            
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              form="account-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : editingAccount ? 'Update' : 'Create'}
            </button>
          </div>
        </motion.div>

        {/* Delete Confirmation */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 flex items-center justify-center p-4"
            >
              <div className="bg-card border border-border rounded-xl p-6 shadow-xl max-w-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Are you sure you want to delete "{editingAccount?.name}"?
                    </p>
                  </div>
                </div>
                
                <div className="bg-muted rounded-lg p-3 mb-4">
                  <p className="text-sm text-muted-foreground">
                    ⚠️ This will permanently delete the account and all associated data. This action cannot be undone.
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-3 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};