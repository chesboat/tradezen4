import React from 'react';
import { motion } from 'framer-motion';
import { Clock, ArrowUp, ArrowDown, Minus, Info } from 'lucide-react';
import { MoodType } from '@/types';
import { formatTime, getMoodColor } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';

interface MoodEntry {
  id: string;
  timestamp: Date;
  mood: MoodType;
  trigger?: string;
  relatedId?: string;
}

interface MoodTimelineProps {
  moodEntries: MoodEntry[];
  compact?: boolean;
  className?: string;
}

const moodEmojis: Record<MoodType, string> = {
  excellent: '🤩',
  good: '😊',
  neutral: '😐',
  poor: '😕',
  terrible: '😢',
};

const moodTrends: Record<MoodType, number> = {
  excellent: 5,
  good: 4,
  neutral: 3,
  poor: 2,
  terrible: 1,
};

const getTrendIcon = (current: MoodType, previous: MoodType) => {
  const currentScore = moodTrends[current];
  const previousScore = moodTrends[previous];
  
  if (currentScore > previousScore) {
    return <ArrowUp className="w-3 h-3 text-green-500" />;
  } else if (currentScore < previousScore) {
    return <ArrowDown className="w-3 h-3 text-red-500" />;
  } else {
    return <Minus className="w-3 h-3 text-gray-500" />;
  }
};

const getTriggerColor = (trigger?: string) => {
  if (!trigger) return 'text-gray-500';
  
  if (trigger.includes('win') || trigger.includes('profit')) {
    return 'text-green-500';
  } else if (trigger.includes('loss') || trigger.includes('stop')) {
    return 'text-red-500';
  } else if (trigger.includes('note')) {
    return 'text-blue-500';
  } else if (trigger.includes('wellness')) {
    return 'text-purple-500';
  } else {
    return 'text-gray-500';
  }
};

const formatTrigger = (trigger?: string) => {
  if (!trigger) return '';
  
  const triggerMap: Record<string, string> = {
    'trade-win': 'Winning Trade',
    'trade-loss': 'Losing Trade',
    'trade-breakeven': 'Breakeven Trade',
    'note': 'Quick Note',
    'reflection': 'Daily Reflection',
    'session-start': 'Session Start',
    'session-end': 'Session End',
    'wellness-mood': 'Mood Update',
    'wellness-breathwork': 'Breathwork Session',
    'wellness-meditation': 'Meditation Session',
    'wellness-exercise': 'Exercise Session',
    'wellness-gratitude': 'Gratitude Practice',
    'wellness-break': 'Wellness Break',
  };
  
  return triggerMap[trigger] || trigger;
};

export const MoodTimeline: React.FC<MoodTimelineProps> = ({ 
  moodEntries, 
  compact = false,
  className 
}) => {
  // Sort entries by timestamp
  const sortedEntries = [...moodEntries].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (sortedEntries.length === 0) {
    return (
      <div className={cn("text-center py-6 text-muted-foreground", className)}>
        <div className="p-3 bg-muted/30 rounded-lg inline-block">
          <Clock className="w-5 h-5 mx-auto mb-2" />
          <p className="text-sm">No mood data for this day</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-foreground">Mood Timeline</h4>
        </div>
        <div className="text-xs text-muted-foreground">
          {sortedEntries.length} mood {sortedEntries.length === 1 ? 'entry' : 'entries'}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
        
        {/* Mood entries */}
        <div className="space-y-4">
          {sortedEntries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-center gap-4"
            >
              {/* Timeline dot */}
              <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-background border-2 border-border rounded-full">
                <span className="text-2xl" role="img" aria-label={entry.mood}>
                  {moodEmojis[entry.mood]}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('text-sm font-medium', getMoodColor(entry.mood))}>
                    {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                  </span>
                  
                  {/* Trend indicator */}
                  {index > 0 && (
                    <div className="flex items-center">
                      {getTrendIcon(entry.mood, sortedEntries[index - 1].mood)}
                    </div>
                  )}
                  
                  {/* Timestamp */}
                  <span className="text-xs text-muted-foreground">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
                
                {/* Trigger */}
                {entry.trigger && (
                  <div className="flex items-center gap-1 mt-1">
                    <Info className="w-3 h-3 text-muted-foreground" />
                    <span className={cn('text-xs', getTriggerColor(entry.trigger))}>
                      {formatTrigger(entry.trigger)}
                    </span>
                  </div>
                )}
              </div>

              {/* Compact view adjustments */}
              {compact && (
                <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{entry.mood}</span>
                  {entry.trigger && (
                    <span className={getTriggerColor(entry.trigger)}>
                      • {formatTrigger(entry.trigger)}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mood summary */}
      <div className="mt-4 p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Mood Trend:</span>
          <div className="flex items-center gap-2">
            {sortedEntries.length > 1 && (
              <div className="flex items-center gap-1">
                {getTrendIcon(
                  sortedEntries[sortedEntries.length - 1].mood,
                  sortedEntries[0].mood
                )}
                <span className="text-xs text-muted-foreground">
                  {sortedEntries[0].mood} → {sortedEntries[sortedEntries.length - 1].mood}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 