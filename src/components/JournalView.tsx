import React from 'react';
import { JournalTimeline } from './JournalTimeline';
import { SmartTagFilterBar } from './SmartTagFilterBar';

export const JournalView: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <SmartTagFilterBar />
      <div className="flex-1 overflow-auto">
        <JournalTimeline />
      </div>
    </div>
  );
}; 