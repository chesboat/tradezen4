/**
 * Apple-style formatters for clean, readable display
 * Used in shares, cards, and visual displays
 */

/**
 * Format currency the Apple way:
 * - No cents (whole numbers only)
 * - Abbreviate large numbers ($1.2k, $5.3M)
 * - Always show sign for shares (+/-)
 * 
 * @param amount - The currency amount
 * @param options - Formatting options
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrencyApple(1234.56) => "$1.2k"
 * formatCurrencyApple(554.46) => "$554"
 * formatCurrencyApple(1500000) => "$1.5M"
 * formatCurrencyApple(-250.75) => "-$251"
 */
export function formatCurrencyApple(
  amount: number,
  options: { showSign?: boolean; forceSign?: boolean } = {}
): string {
  const { showSign = false, forceSign = false } = options;
  
  const isNegative = amount < 0;
  const v = Math.abs(amount);
  
  // Determine sign
  let sign = '';
  if (forceSign) {
    sign = isNegative ? '-' : '+';
  } else if (showSign || isNegative) {
    sign = isNegative ? '-' : '';
  }
  
  // Abbreviate large numbers
  if (v >= 1000000) {
    const millions = v / 1000000;
    // Only show decimal if it's not .0
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    return `${sign}$${formatted}M`;
  }
  
  if (v >= 1000) {
    const thousands = v / 1000;
    // Only show decimal if it's not .0
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1);
    return `${sign}$${formatted}k`;
  }
  
  // Round to whole number (no cents)
  return `${sign}$${Math.round(v)}`;
}

/**
 * Format percentage the Apple way:
 * - Whole numbers for > 10%
 * - One decimal for < 10%
 * - Clean, no trailing zeros
 * 
 * @param value - The percentage value (0-100)
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercentageApple(67.333) => "67%"
 * formatPercentageApple(8.5) => "8.5%"
 * formatPercentageApple(100) => "100%"
 */
export function formatPercentageApple(value: number): string {
  if (value >= 10 || value <= -10) {
    return `${Math.round(value)}%`;
  }
  
  // For small percentages, show one decimal
  const formatted = value.toFixed(1);
  // Remove trailing .0
  return formatted.endsWith('.0') ? `${Math.round(value)}%` : `${formatted}%`;
}

/**
 * Format number the Apple way:
 * - Abbreviate large numbers (1.2k, 5.3M)
 * - No decimals for whole numbers
 * - Clean, readable
 * 
 * @param value - The number to format
 * @returns Formatted number string
 * 
 * @example
 * formatNumberApple(1234) => "1.2k"
 * formatNumberApple(50) => "50"
 * formatNumberApple(1500000) => "1.5M"
 */
export function formatNumberApple(value: number): string {
  const v = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (v >= 1000000) {
    const millions = v / 1000000;
    const formatted = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1);
    return `${sign}${formatted}M`;
  }
  
  if (v >= 1000) {
    const thousands = v / 1000;
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1);
    return `${sign}${formatted}k`;
  }
  
  return `${sign}${Math.round(v)}`;
}

