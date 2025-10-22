/**
 * Trading Health Debug Utilities
 * 
 * Helper functions to debug and troubleshoot Trading Health issues
 */

/**
 * Clear the stored Trading Health snapshot
 * Use this to reset the baseline for change detection
 */
export function clearHealthSnapshot(): void {
  localStorage.removeItem('trading-health-snapshot');
  console.log('✅ Trading Health snapshot cleared');
}

/**
 * View the current stored snapshot
 */
export function viewHealthSnapshot(): void {
  const snapshot = localStorage.getItem('trading-health-snapshot');
  if (!snapshot) {
    console.log('❌ No snapshot found');
    return;
  }
  
  try {
    const parsed = JSON.parse(snapshot);
    console.log('📊 Current Trading Health Snapshot:');
    console.table({
      'Edge Score': parsed.metrics.edge.value,
      'Edge Expectancy': parsed.metrics.edge.expectancy?.toFixed(2) || 'N/A',
      'Edge Wins': parsed.metrics.edge.wins,
      'Edge Losses': parsed.metrics.edge.losses,
      'Consistency Score': parsed.metrics.consistency.value,
      'Risk Control Score': parsed.metrics.riskControl.value,
      'Timestamp': new Date(parsed.timestamp).toLocaleString(),
      'User ID': parsed.userId,
    });
    console.log('Full snapshot:', parsed);
  } catch (error) {
    console.error('❌ Failed to parse snapshot:', error);
  }
}

/**
 * Force a snapshot update with current metrics
 * Use this after manually fixing data issues
 */
export function forceSnapshotUpdate(): void {
  console.log('⚠️ To force update, navigate to Trading Health view');
  console.log('The snapshot will be automatically updated when metrics are calculated');
}

// Make these available globally in development
if (typeof window !== 'undefined') {
  (window as any).debugTradingHealth = {
    clearSnapshot: clearHealthSnapshot,
    viewSnapshot: viewHealthSnapshot,
    forceUpdate: forceSnapshotUpdate,
  };
  
  console.log('🔧 Trading Health debug utils loaded. Use:');
  console.log('  debugTradingHealth.viewSnapshot() - View current snapshot');
  console.log('  debugTradingHealth.clearSnapshot() - Clear snapshot');
  console.log('  debugTradingHealth.forceUpdate() - Force snapshot update');
}

