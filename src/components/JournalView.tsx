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
    console.log('[DEBUG] JournalView Mount', {
      accounts,
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
  }, [accounts, selectedAccountId, reflectionData]);
  return (
    <ErrorBoundary>
      <div className="h-full flex flex-col">
        <DebugJournalBanner />
        <SmartTagFilterBar />
        <div className="flex-1 overflow-auto">
          <JournalTimeline />
        </div>
      </div>
    </ErrorBoundary>
  );
}; 