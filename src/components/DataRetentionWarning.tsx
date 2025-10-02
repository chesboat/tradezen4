/**
 * Data Retention Warning - Alert Basic users before their data rolls off
 * Apple-style: Subtle, informative, actionable
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, Sparkles, X } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useTradeStore } from '@/store/useTradeStore';
import { cn } from '@/lib/utils';

interface DataRetentionWarningProps {
  onUpgrade: () => void;
}

export const DataRetentionWarning: React.FC<DataRetentionWarningProps> = ({ onUpgrade }) => {
  const { tier, isBasic } = useSubscription();
  const { trades } = useTradeStore();
  const [isDismissed, setIsDismissed] = React.useState(() => {
    return localStorage.getItem('dataRetentionWarning_dismissed') === 'true';
  });

  // Calculate trades that will expire in next 7 days
  const expiringData = useMemo(() => {
    if (!isBasic || trades.length === 0) return null;

    const now = new Date();
    const retentionDays = 30;
    const warningDays = 7; // Warn 7 days before expiry

    // Calculate cutoff dates
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - (retentionDays - warningDays));

    const hardCutoff = new Date();
    hardCutoff.setDate(hardCutoff.getDate() - retentionDays);

    // Find trades that will expire in next 7 days
    const expiringTrades = trades.filter(trade => {
      const tradeDate = new Date(trade.entryTime);
      return tradeDate < expiryDate && tradeDate >= hardCutoff;
    });

    if (expiringTrades.length === 0) return null;

    // Calculate days until oldest trade expires
    const oldestTrade = expiringTrades.reduce((oldest, trade) => {
      const tradeDate = new Date(trade.entryTime);
      const oldestDate = new Date(oldest.entryTime);
      return tradeDate < oldestDate ? trade : oldest;
    }, expiringTrades[0]);

    const oldestDate = new Date(oldestTrade.entryTime);
    const daysSinceOldest = Math.floor((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilExpiry = retentionDays - daysSinceOldest;

    return {
      count: expiringTrades.length,
      daysUntilExpiry: Math.max(0, daysUntilExpiry),
      isUrgent: daysUntilExpiry <= 3,
    };
  }, [isBasic, trades]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('dataRetentionWarning_dismissed', 'true');
    // Auto-show again after 24 hours
    setTimeout(() => {
      localStorage.removeItem('dataRetentionWarning_dismissed');
    }, 24 * 60 * 60 * 1000);
  };

  // Don't show if not Basic, no expiring data, or dismissed
  if (!isBasic || !expiringData || isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={cn(
          "mx-auto max-w-7xl 2xl:max-w-[1800px] px-6 2xl:px-8 py-4",
          "sticky top-0 z-40"
        )}
      >
        <div className={cn(
          "rounded-xl p-4 backdrop-blur-sm border",
          expiringData.isUrgent
            ? "bg-red-500/10 border-red-500/30"
            : "bg-orange-500/10 border-orange-500/30"
        )}>
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={cn(
              "p-2 rounded-lg flex-shrink-0",
              expiringData.isUrgent ? "bg-red-500/20" : "bg-orange-500/20"
            )}>
              {expiringData.isUrgent ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : (
                <Clock className="w-5 h-5 text-orange-500" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                {expiringData.isUrgent
                  ? `⚠️ ${expiringData.count} ${expiringData.count === 1 ? 'trade' : 'trades'} expiring in ${expiringData.daysUntilExpiry} ${expiringData.daysUntilExpiry === 1 ? 'day' : 'days'}`
                  : `⏰ ${expiringData.count} ${expiringData.count === 1 ? 'trade' : 'trades'} will be deleted soon`
                }
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Basic plan only keeps 30 days of history. Upgrade to Premium for unlimited history and never lose your data.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={onUpgrade}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-xs font-medium flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade to Premium
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Remind me tomorrow
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DataRetentionWarning;

