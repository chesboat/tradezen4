/**
 * Demo Data Loader Utilities
 * Access from browser console: window.loadDemoData()
 */

import { loadProfessionalFuturesTraderDemo } from './futuresTraderDemoData';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';

/**
 * Main loader function - call from console
 */
export async function loadDemoData() {
  console.log('🎯 TradZen Demo Data Loader');
  console.log('═'.repeat(50));
  
  try {
    // Get current account ID
    const { selectedAccountId, accounts } = useAccountFilterStore.getState();
    const accountId = selectedAccountId || accounts[0]?.id;
    
    if (!accountId) {
      console.error('❌ No account found. Please create an account first.');
      return;
    }
    
    console.log(`📊 Loading data for account: ${accountId}`);
    console.log('');
    
    // Load professional futures trader data
    const count = await loadProfessionalFuturesTraderDemo(accountId);
    
    console.log('');
    console.log('═'.repeat(50));
    console.log('✅ SUCCESS!');
    console.log(`✅ Loaded ${count} trades`);
    console.log('');
    console.log('📸 READY FOR SCREENSHOTS:');
    console.log('  → Navigate to Trading Health view');
    console.log('  → Check Analytics dashboard');
    console.log('  → View Calendar (should show 3 years of data with red & green days)');
    console.log('');
    console.log('💡 TIP: Refresh the page to see all metrics update');
    console.log('');
    console.log('📊 REALISTIC DATA:');
    console.log('  • 55% win rate (aspiring trader level)');
    console.log('  • ~1.5 profit factor (profitable but realistic)');
    console.log('  • Mix of winning and losing days');
    console.log('  • Some rough patches and win streaks');
    
  } catch (error) {
    console.error('❌ Error loading demo data:', error);
  }
}

/**
 * Clear all trades (use with caution)
 */
export async function clearAllTrades() {
  const confirmed = confirm('⚠️ WARNING: This will delete ALL trades. Are you sure?');
  
  if (!confirmed) {
    console.log('❌ Cancelled');
    return;
  }
  
  const { useTradeStore } = await import('@/store/useTradeStore');
  const { trades, deleteTrade } = useTradeStore.getState();
  
  console.log(`🗑️ Deleting ${trades.length} trades...`);
  
  for (const trade of trades) {
    await deleteTrade(trade.id);
  }
  
  console.log('✅ All trades cleared');
  console.log('💡 Refresh the page to see changes');
}

/**
 * Show stats about current data
 */
export function showDataStats() {
  const { useTradeStore } = require('@/store/useTradeStore');
  const { trades } = useTradeStore.getState();
  
  if (trades.length === 0) {
    console.log('📊 No trades found');
    return;
  }
  
  const wins = trades.filter((t: any) => (t.pnl || 0) > 0).length;
  const losses = trades.filter((t: any) => (t.pnl || 0) < 0).length;
  const winRate = (wins / trades.length) * 100;
  const totalPnL = trades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0);
  
  // Group by symbol
  const bySymbol = trades.reduce((acc: any, t: any) => {
    acc[t.symbol] = (acc[t.symbol] || 0) + 1;
    return acc;
  }, {});
  
  console.log('📊 CURRENT DATA STATS');
  console.log('═'.repeat(50));
  console.log(`Total Trades: ${trades.length}`);
  console.log(`Win Rate: ${winRate.toFixed(1)}%`);
  console.log(`Total P&L: $${totalPnL.toFixed(2)}`);
  console.log('');
  console.log('By Symbol:');
  Object.entries(bySymbol).forEach(([symbol, count]) => {
    console.log(`  ${symbol}: ${count} trades`);
  });
}

// Expose to window for console access immediately
(window as any).loadDemoData = loadDemoData;
(window as any).clearAllTrades = clearAllTrades;
(window as any).showDataStats = showDataStats;

// Log on next tick to ensure it's after React hydration
setTimeout(() => {
  console.log('🎯 TradZen Demo Data Utilities Loaded!');
  console.log('');
  console.log('Available commands:');
  console.log('  loadDemoData()    - Load 2000 trades (3 years, 70% win rate)');
  console.log('  showDataStats()   - Show current data statistics');
  console.log('  clearAllTrades()  - Clear all trades (with confirmation)');
  console.log('');
}, 100);

