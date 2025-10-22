/**
 * Statistical Confidence Banner
 * 
 * Apple-style: Honest, educational, beautifully designed
 * Shows users their sample size and statistical confidence level
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Info, TrendingUp, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StatisticalConfidence } from '@/lib/tradingHealth/statisticalConfidence';
import { getConfidenceBadgeStyle, getSampleSizeProgress, getEducationalMessage } from '@/lib/tradingHealth/statisticalConfidence';

interface StatisticalConfidenceBannerProps {
  confidence: StatisticalConfidence;
  className?: string;
}

export const StatisticalConfidenceBanner: React.FC<StatisticalConfidenceBannerProps> = ({
  confidence,
  className,
}) => {
  const badgeStyle = getConfidenceBadgeStyle(confidence.level);
  const progress = getSampleSizeProgress(confidence.tradeCount);
  const educational = getEducationalMessage(confidence);

  // Don't show banner if high confidence (clutter-free)
  if (confidence.level === 'high') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border border-border overflow-hidden',
        className
      )}
    >
      {/* Header with confidence level */}
      <div className={cn('px-4 py-3 flex items-center justify-between', badgeStyle.bg)}>
        <div className="flex items-center gap-3">
          <div className={cn('text-2xl', badgeStyle.color)}>
            {badgeStyle.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-semibold', badgeStyle.color)}>
                {confidence.message}
              </span>
              {confidence.level === 'insufficient' && (
                <AlertCircle className={cn('w-4 h-4', badgeStyle.color)} />
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {progress}
            </div>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className={cn('text-lg font-bold tabular-nums', badgeStyle.color)}>
              {Math.round(confidence.percentage)}%
            </div>
            <div className="text-xs text-muted-foreground">
              confidence
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted/30">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence.percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={cn('h-full', badgeStyle.color.replace('text-', 'bg-'))}
        />
      </div>

      {/* Educational content */}
      <div className="px-4 py-3 bg-card/50 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground mb-1">
              {educational.title}
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              {educational.message}
            </div>
            {educational.action && (
              <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-blue-500">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{educational.action}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

