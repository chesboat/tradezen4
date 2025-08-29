import React from 'react';
import { useReflectionTemplateStore } from '@/store/useReflectionTemplateStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { JournalTimeline } from './JournalTimeline';
import { SmartTagFilterBar } from './SmartTagFilterBar';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { DebugJournalBanner } from './DebugJournalBanner';

export const JournalView: React.FC = () => {
  const accounts = useAccountFilterStore((s) => s.accounts);
  const selectedAccountId = useAccountFilterStore((s) => s.selectedAccountId);
  const reflectionData = useReflectionTemplateStore((s) => s.reflectionData);

  // Ensure reflections are loaded on mount to avoid blank mobile page
  React.useEffect(() => {
    // Run only once on mount to avoid infinite loops
    const loadedOnce = (window as any).__JOURNAL_REMOTE_LOADED__;
    if (loadedOnce) return;
    (window as any).__JOURNAL_REMOTE_LOADED__ = true;
    console.log('[DEBUG] JournalView Mount (once)', {
      accountsCount: accounts?.length ?? 0,
      selectedAccountId,
      reflectionDataCount: reflectionData?.length || 0,
    });
    try {
      const store = useReflectionTemplateStore.getState();
      console.log('[DEBUG] Store state:', {
        hasLoadRemote: !!store._loadRemote,
        reflectionDataExists: !!store.reflectionData,
      });
      store._loadRemote?.();
    } catch (e) {
      console.error('[DEBUG] Error loading remote:', e);
    }
  }, []);
  return (
    <ErrorBoundary label="JournalView Root">
      <div className="h-full flex flex-col">
        <ErrorBoundary label="DebugBanner">
          <DebugJournalBanner />
        </ErrorBoundary>
        <ErrorBoundary label="SmartTagFilterBar">
          <SmartTagFilterBar />
        </ErrorBoundary>
        <div className="flex-1 overflow-auto">
          <ErrorBoundary label="JournalTimeline">
            <JournalTimeline />
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
}; 