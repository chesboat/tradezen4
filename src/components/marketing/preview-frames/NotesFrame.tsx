/**
 * Notes Frame - Marketing Preview
 * Apple Notes style with trading journal entries
 */

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Search, Star, Calendar, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotesFrameProps {
  theme: 'light' | 'dark';
}

const demoNotes = [
  {
    id: 1,
    title: 'Morning Trading Plan - Oct 28',
    preview: 'Focus on SPY momentum setups. Looking for clean breakouts above VWAP with volume confirmation. Risk: 1% per trade, max 3 trades today.',
    date: '2 min ago',
    tags: ['trading-plan', 'SPY'],
    starred: true,
  },
  {
    id: 2,
    title: 'TSLA Trade Review',
    preview: 'Entry: $242.50, Exit: $245.80. Followed my rules perfectly. Waited for the pullback to support, entered on confirmation candle. +$330 profit.',
    date: '1 hour ago',
    tags: ['trade-review', 'TSLA'],
    starred: false,
  },
  {
    id: 3,
    title: 'Weekly Reflection',
    preview: 'Great week overall. 68% win rate, stayed disciplined with position sizing. Need to work on cutting losers faster - held 2 trades too long.',
    date: 'Yesterday',
    tags: ['reflection', 'weekly'],
    starred: true,
  },
  {
    id: 4,
    title: 'Setup: Bull Flag Pattern',
    preview: 'Consolidation after strong move up. Look for tight flag formation, volume drying up, then breakout with volume spike. Best on 5min chart.',
    date: '2 days ago',
    tags: ['setup', 'study'],
    starred: false,
  },
];

export const NotesFrame: React.FC<NotesFrameProps> = ({ theme }) => {
  return (
    <div className={cn(
      'w-full h-full flex',
      theme === 'dark' ? 'dark bg-background' : 'bg-white'
    )}>
      {/* Sidebar */}
      <div className={cn(
        'w-64 border-r border-border p-4 space-y-2',
        theme === 'dark' ? 'bg-card' : 'bg-gray-50'
      )}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Notes</h2>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg text-sm"
              disabled
            />
          </div>

          {/* Folders */}
          <div className="space-y-1">
            <div className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
              All Notes
            </div>
            <div className="px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground text-sm">
              Trading Plans
            </div>
            <div className="px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground text-sm">
              Trade Reviews
            </div>
            <div className="px-3 py-2 rounded-lg hover:bg-accent text-muted-foreground text-sm">
              Setups & Studies
            </div>
          </div>
        </motion.div>
      </div>

      {/* Notes List */}
      <div className="flex-1 p-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-3"
        >
          {demoNotes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              className={cn(
                'p-4 rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer',
                theme === 'dark' ? 'bg-card' : 'bg-white shadow-sm'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {note.starred && <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />}
                  {note.title}
                </h3>
                <span className="text-xs text-muted-foreground">{note.date}</span>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {note.preview}
              </p>

              <div className="flex items-center gap-2">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

