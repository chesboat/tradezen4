/**
 * Utility to clear activity log from Firestore
 * Run in console: clearActivityLog()
 */

import { useActivityLogStore } from '@/store/useActivityLogStore';

export async function clearActivityLog() {
  const confirmed = confirm('⚠️ This will delete ALL activity log entries from Firestore. Are you sure?');
  
  if (!confirmed) {
    console.log('❌ Cancelled');
    return;
  }
  
  try {
    console.log('🗑️ Clearing activity log from Firestore...');
    await useActivityLogStore.getState().clearActivities();
    console.log('✅ Activity log cleared!');
    console.log('💡 Refresh the page to see the clean log');
  } catch (error) {
    console.error('❌ Failed to clear activity log:', error);
  }
}

// Expose to window for console access
(window as any).clearActivityLog = clearActivityLog;

// Log on next tick
setTimeout(() => {
  console.log('🧹 Activity Log Cleaner Loaded!');
  console.log('');
  console.log('To clear all activity log entries:');
  console.log('  clearActivityLog()');
  console.log('');
}, 100);

