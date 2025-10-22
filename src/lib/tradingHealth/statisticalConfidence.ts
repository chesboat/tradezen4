/**
 * Statistical Confidence System
 * 
 * Apple's approach: Honest, educational, never misleading
 * 
 * Based on trading statistics best practices:
 * - Van Tharp: 30 trades minimum, 100+ for confidence
 * - Professional prop firms: 50+ trades over 30-60 days
 * - Statistical significance: 30 data points minimum
 */

export type ConfidenceLevel = 'insufficient' | 'low' | 'medium' | 'high';

export interface StatisticalConfidence {
  level: ConfidenceLevel;
  tradeCount: number;
  minRequired: number;
  percentage: number;
  canShowScores: boolean;
  canShowAchievements: boolean;
  message: string;
  educationalTip: string;
}

/**
 * Trade count thresholds based on statistical best practices
 */
export const CONFIDENCE_THRESHOLDS = {
  INSUFFICIENT: 0,   // 0-9 trades: Not enough data
  LOW: 10,           // 10-29 trades: Early indicators only
  MEDIUM: 30,        // 30-99 trades: Statistically meaningful
  HIGH: 100,         // 100+ trades: High confidence
} as const;

/**
 * Minimum trades required for specific features
 */
export const MIN_TRADES_FOR = {
  SCORES: 10,              // Show scores (with low confidence warning)
  ACHIEVEMENTS: 30,        // Unlock achievements like "Edge Mastery"
  MILESTONES: 30,          // Celebrate milestones
  TREND_ANALYSIS: 20,      // Show week-over-week trends
  ADVANCED_METRICS: 50,    // Show advanced statistical metrics
} as const;

/**
 * Calculate statistical confidence based on trade count
 */
export function calculateStatisticalConfidence(tradeCount: number): StatisticalConfidence {
  // Insufficient data (0-9 trades)
  if (tradeCount < CONFIDENCE_THRESHOLDS.LOW) {
    return {
      level: 'insufficient',
      tradeCount,
      minRequired: CONFIDENCE_THRESHOLDS.LOW,
      percentage: (tradeCount / CONFIDENCE_THRESHOLDS.LOW) * 100,
      canShowScores: false,
      canShowAchievements: false,
      message: 'Building your sample size...',
      educationalTip: 'Professional traders need at least 30 trades to assess their edge. Keep trading your plan!',
    };
  }
  
  // Low confidence (10-29 trades)
  if (tradeCount < CONFIDENCE_THRESHOLDS.MEDIUM) {
    return {
      level: 'low',
      tradeCount,
      minRequired: CONFIDENCE_THRESHOLDS.MEDIUM,
      percentage: (tradeCount / CONFIDENCE_THRESHOLDS.MEDIUM) * 100,
      canShowScores: true,
      canShowAchievements: false,
      message: 'Early indicators',
      educationalTip: `You're ${CONFIDENCE_THRESHOLDS.MEDIUM - tradeCount} trades away from statistically meaningful results.`,
    };
  }
  
  // Medium confidence (30-99 trades)
  if (tradeCount < CONFIDENCE_THRESHOLDS.HIGH) {
    return {
      level: 'medium',
      tradeCount,
      minRequired: CONFIDENCE_THRESHOLDS.HIGH,
      percentage: (tradeCount / CONFIDENCE_THRESHOLDS.HIGH) * 100,
      canShowScores: true,
      canShowAchievements: true,
      message: 'Statistically meaningful',
      educationalTip: `Your sample size is meaningful. ${CONFIDENCE_THRESHOLDS.HIGH - tradeCount} more trades for high confidence.`,
    };
  }
  
  // High confidence (100+ trades)
  return {
    level: 'high',
    tradeCount,
    minRequired: CONFIDENCE_THRESHOLDS.HIGH,
    percentage: 100,
    canShowScores: true,
    canShowAchievements: true,
    message: 'High confidence',
    educationalTip: 'Your sample size provides statistically significant results.',
  };
}

/**
 * Check if user has enough trades for a specific feature
 */
export function hasMinimumTrades(tradeCount: number, feature: keyof typeof MIN_TRADES_FOR): boolean {
  return tradeCount >= MIN_TRADES_FOR[feature];
}

/**
 * Get confidence badge styling (Apple-style)
 */
export function getConfidenceBadgeStyle(level: ConfidenceLevel): {
  color: string;
  bg: string;
  icon: string;
} {
  switch (level) {
    case 'insufficient':
      return {
        color: 'text-muted-foreground',
        bg: 'bg-muted/50',
        icon: '○',
      };
    case 'low':
      return {
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        icon: '◔',
      };
    case 'medium':
      return {
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        icon: '◑',
      };
    case 'high':
      return {
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        icon: '●',
      };
  }
}

/**
 * Get progress message for building sample size
 */
export function getSampleSizeProgress(tradeCount: number): string {
  if (tradeCount < CONFIDENCE_THRESHOLDS.LOW) {
    return `${tradeCount}/${CONFIDENCE_THRESHOLDS.LOW} trades logged`;
  }
  if (tradeCount < CONFIDENCE_THRESHOLDS.MEDIUM) {
    return `${tradeCount}/${CONFIDENCE_THRESHOLDS.MEDIUM} trades for statistical significance`;
  }
  if (tradeCount < CONFIDENCE_THRESHOLDS.HIGH) {
    return `${tradeCount}/${CONFIDENCE_THRESHOLDS.HIGH} trades for high confidence`;
  }
  return `${tradeCount} trades - statistically significant`;
}

/**
 * Get educational message for current confidence level
 */
export function getEducationalMessage(confidence: StatisticalConfidence): {
  title: string;
  message: string;
  action?: string;
} {
  switch (confidence.level) {
    case 'insufficient':
      return {
        title: 'Building Your Trading Edge',
        message: `You've logged ${confidence.tradeCount} trade${confidence.tradeCount === 1 ? '' : 's'}. Professional traders need at least 30 trades to assess their edge with statistical confidence.`,
        action: 'Keep trading your plan consistently',
      };
    
    case 'low':
      return {
        title: 'Early Indicators',
        message: `With ${confidence.tradeCount} trades, you're seeing early patterns. ${CONFIDENCE_THRESHOLDS.MEDIUM - confidence.tradeCount} more trades will give you statistically meaningful results.`,
        action: 'Continue following your trading rules',
      };
    
    case 'medium':
      return {
        title: 'Statistically Meaningful',
        message: `Your ${confidence.tradeCount} trades provide meaningful statistical insights. Your edge metrics are now reliable for decision-making.`,
        action: `${CONFIDENCE_THRESHOLDS.HIGH - confidence.tradeCount} more trades for maximum confidence`,
      };
    
    case 'high':
      return {
        title: 'High Statistical Confidence',
        message: `With ${confidence.tradeCount} trades, your metrics are statistically significant. You have a robust sample size for analysis.`,
      };
  }
}

