/**
 * Daily Insight Card
 * Apple-style: Simple, beautiful, actionable
 * Shows ONE insight per day to help traders improve
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Info } from 'lucide-react';
import type { DailyInsight } from '@/lib/dailyInsightEngine';
import { cn } from '@/lib/utils';

interface DailyInsightCardProps {
  insight: DailyInsight;
  onDismiss?: () => void;
  onAction?: (action: string) => void;
  className?: string;
}

export const DailyInsightCard: React.FC<DailyInsightCardProps> = ({
  insight,
  onDismiss,
  onAction,
  className,
}) => {
  const [isDismissing, setIsDismissing] = useState(false);

  const handleDismiss = () => {
    setIsDismissing(true);
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  };

  // Color schemes based on severity
  const colorScheme = {
    success: {
      gradient: 'from-green-500/10 via-emerald-500/5 to-transparent',
      border: 'border-green-500/20',
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      textAccent: 'text-green-600 dark:text-green-400',
    },
    warning: {
      gradient: 'from-yellow-500/10 via-orange-500/5 to-transparent',
      border: 'border-yellow-500/20',
      iconBg: 'bg-gradient-to-br from-yellow-500 to-orange-600',
      textAccent: 'text-yellow-600 dark:text-yellow-400',
    },
    danger: {
      gradient: 'from-red-500/10 via-orange-500/5 to-transparent',
      border: 'border-red-500/20',
      iconBg: 'bg-gradient-to-br from-red-500 to-orange-600',
      textAccent: 'text-red-600 dark:text-red-400',
    },
    info: {
      gradient: 'from-blue-500/10 via-purple-500/5 to-transparent',
      border: 'border-blue-500/20',
      iconBg: 'bg-gradient-to-br from-blue-500 to-purple-600',
      textAccent: 'text-blue-600 dark:text-blue-400',
    },
  };

  const colors = colorScheme[insight.severity];

  return (
    <AnimatePresence>
      {!isDismissing && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className={cn(
            'relative overflow-hidden rounded-2xl border backdrop-blur-xl',
            'bg-gradient-to-br',
            colors.gradient,
            colors.border,
            'shadow-lg hover:shadow-xl transition-shadow duration-300',
            className
          )}
        >
          {/* Background pattern (subtle) */}
          <div className="absolute inset-0 opacity-[0.02]">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
              backgroundSize: '32px 32px',
            }} />
          </div>

          {/* Content */}
          <div className="relative p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4 flex-1">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 15,
                    delay: 0.1,
                  }}
                  className={cn(
                    'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg',
                    colors.iconBg
                  )}
                >
                  {insight.icon}
                </motion.div>

                {/* Title & Label */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {insight.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Today's Trading Insight
                  </p>
                </div>
              </div>

              {/* Dismiss button */}
              {onDismiss && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDismiss}
                  className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                  title="Dismiss"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              )}
            </div>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-foreground/90 leading-relaxed mb-4"
            >
              {insight.message}
            </motion.p>

            {/* Metric (if provided) */}
            {insight.metric && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-4 p-3 bg-background/50 rounded-xl border border-border/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">
                      {insight.metric.label}
                    </div>
                    <div className={cn('text-2xl font-bold', colors.textAccent)}>
                      {insight.metric.value}
                    </div>
                  </div>
                  {insight.metric.comparison && (
                    <div className="text-xs text-muted-foreground text-right">
                      {insight.metric.comparison}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Suggestion */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-4 flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10"
            >
              <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80">
                <span className="font-medium text-primary">Suggestion: </span>
                {insight.suggestion}
              </p>
            </motion.div>

            {/* Actions */}
            {insight.actions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-2"
              >
                {insight.actions.primary && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAction?.(insight.actions!.primary!.action)}
                    className={cn(
                      'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                      'bg-primary text-primary-foreground',
                      'hover:bg-primary/90 shadow-sm hover:shadow-md'
                    )}
                  >
                    {insight.actions.primary.label}
                  </motion.button>
                )}
                {insight.actions.secondary && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAction?.(insight.actions!.secondary!.action)}
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-all bg-muted hover:bg-muted/80 text-foreground"
                  >
                    {insight.actions.secondary.label}
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Confidence indicator (subtle, bottom right) */}
            <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/50">
              {insight.confidence}% confidence
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Empty state when no insight is available
 */
export const DailyInsightEmptyState: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'rounded-2xl border border-border/50 bg-muted/20 p-8 text-center',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center mx-auto mb-4">
        <TrendingUp className="w-8 h-8 text-blue-500/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Keep Trading
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        Daily insights appear once you have enough trading data to analyze patterns.
        Keep logging trades to unlock personalized insights!
      </p>
    </motion.div>
  );
};

