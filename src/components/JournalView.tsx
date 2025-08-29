import React from 'react';
import { JournalTimeline } from './JournalTimeline';
import { SmartTagFilterBar } from './SmartTagFilterBar';

export const JournalView: React.FC = () => {
  return (
    <div className="h-full flex flex-col overflow-x-hidden max-w-full w-full">
      <SmartTagFilterBar />
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <JournalTimeline />
      </div>
    </div>
  );
}; 