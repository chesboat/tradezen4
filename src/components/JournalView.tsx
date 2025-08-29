import React from 'react';
import { useReflectionTemplateStore } from '@/store/useReflectionTemplateStore';
import { JournalTimeline } from './JournalTimeline';
import { SmartTagFilterBar } from './SmartTagFilterBar';

export const JournalView: React.FC = () => {
  // Ensure reflections are loaded on mount to avoid blank mobile page
  React.useEffect(() => {
    try { (useReflectionTemplateStore.getState()._loadRemote as any)?.(); } catch {}
  }, []);
  return (
    <div className="h-full flex flex-col">
      <SmartTagFilterBar />
      <div className="flex-1 overflow-auto">
        <JournalTimeline />
      </div>
    </div>
  );
}; 