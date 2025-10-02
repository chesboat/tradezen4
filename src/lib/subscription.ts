// Subscription utility functions

export interface TrialInfo {
  daysRemaining: number;
  hoursRemaining: number;
  isExpiringSoon: boolean; // Less than 2 days
  isLastDay: boolean;
  expiresAt: Date;
}

/**
 * Calculate trial info from start date
 * Trial is 7 days from start
 */
export function getTrialInfo(trialStartedAt: Date | undefined): TrialInfo | null {
  if (!trialStartedAt) return null;

  const now = new Date();
  const trialStart = new Date(trialStartedAt);
  const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const msRemaining = trialEnd.getTime() - now.getTime();
  
  if (msRemaining <= 0) {
    return {
      daysRemaining: 0,
      hoursRemaining: 0,
      isExpiringSoon: true,
      isLastDay: true,
      expiresAt: trialEnd,
    };
  }

  const hoursRemaining = Math.ceil(msRemaining / (1000 * 60 * 60));
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  return {
    daysRemaining,
    hoursRemaining,
    isExpiringSoon: daysRemaining <= 2,
    isLastDay: daysRemaining <= 1,
    expiresAt: trialEnd,
  };
}

/**
 * Format trial countdown message
 */
export function getTrialMessage(trialInfo: TrialInfo | null): string {
  if (!trialInfo) return '';

  if (trialInfo.daysRemaining === 0) {
    return 'Trial expired';
  }

  if (trialInfo.isLastDay) {
    if (trialInfo.hoursRemaining === 1) {
      return '1 hour left in trial';
    }
    return `${trialInfo.hoursRemaining} hours left in trial`;
  }

  if (trialInfo.daysRemaining === 1) {
    return '1 day left in trial';
  }

  return `${trialInfo.daysRemaining} days left in trial`;
}

/**
 * Get upgrade CTA message based on trial status
 */
export function getUpgradeCTA(trialInfo: TrialInfo | null): string {
  if (!trialInfo) return 'Upgrade to Premium';

  if (trialInfo.isLastDay) {
    return 'Keep Premium features - Upgrade now!';
  }

  if (trialInfo.isExpiringSoon) {
    return 'Don\'t lose AI Coach - Upgrade to Premium';
  }

  return 'Upgrade to Premium';
}

/**
 * Calculate annual savings
 */
export function getAnnualSavings(monthlyPrice: number, annualPrice: number): number {
  return (monthlyPrice * 12) - annualPrice;
}

/**
 * Calculate savings percentage
 */
export function getSavingsPercentage(monthlyPrice: number, annualPrice: number): number {
  const savings = getAnnualSavings(monthlyPrice, annualPrice);
  const totalMonthly = monthlyPrice * 12;
  return Math.round((savings / totalMonthly) * 100);
}

/**
 * Format price
 */
export function formatPrice(amount: number): string {
  return `$${amount}`;
}

/**
 * Format monthly equivalent for annual
 */
export function formatAnnualMonthly(annualPrice: number): string {
  const monthly = Math.floor(annualPrice / 12);
  return `$${monthly}/mo`;
}

