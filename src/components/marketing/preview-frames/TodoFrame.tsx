/**
 * Todo Frame - Marketing Preview
 * Apple Reminders style with trading tasks
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Flag, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoFrameProps {
  theme: 'light' | 'dark';
}

const demoTasks = [
  {
    id: 1,
    text: 'Review last 10 trades for patterns',
    done: true,
    flagged: false,
    category: 'Analysis',
  },
  {
    id: 2,
    text: 'Backtest bull flag setup on 5min chart',
    done: false,
    flagged: true,
    category: 'Study',
  },
  {
    id: 3,
    text: 'Update trading plan for next week',
    done: false,
    flagged: true,
    category: 'Planning',
  },
  {
    id: 4,
    text: 'Journal today\'s 3 trades with screenshots',
    done: true,
    flagged: false,
    category: 'Journal',
  },
  {
    id: 5,
    text: 'Calculate win rate for momentum setups',
    done: false,
    flagged: false,
    category: 'Analysis',
  },
  {
    id: 6,
    text: 'Re-engineer TSLA trade from yesterday',
    done: false,
    flagged: true,
    category: 'Study',
  },
  {
    id: 7,
    text: 'Set max loss limit for tomorrow',
    done: true,
    flagged: false,
    category: 'Risk',
  },
  {
    id: 8,
    text: 'Watch replay of morning session',
    done: false,
    flagged: false,
    category: 'Study',
  },
];

const categories = [
  { name: 'All', count: 8, color: 'text-blue-500' },
  { name: 'Today', count: 3, color: 'text-orange-500' },
  { name: 'Flagged', count: 3, color: 'text-red-500' },
  { name: 'Analysis', count: 2, color: 'text-purple-500' },
  { name: 'Study', count: 3, color: 'text-green-500' },
];

export const TodoFrame: React.FC<TodoFrameProps> = ({ theme }) => {
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
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Todo</h2>
          </div>

          {/* Categories */}
          <div className="space-y-1">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                className={cn(
                  'flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
                  index === 0 ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-muted-foreground'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', category.color)} />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <span className="text-xs">{category.count}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 p-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-2xl font-bold text-foreground mb-6">Today</h3>

          <div className="space-y-2">
            {demoTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors group',
                  task.done && 'opacity-60'
                )}
              >
                {task.done ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm',
                    task.done ? 'line-through text-muted-foreground' : 'text-foreground'
                  )}>
                    {task.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                      {task.category}
                    </span>
                  </div>
                </div>

                {task.flagged && (
                  <Flag className="w-4 h-4 text-orange-500 fill-orange-500 flex-shrink-0 mt-0.5" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Add new task hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="mt-4 flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Circle className="w-5 h-5" />
            <span className="text-sm">New Reminder</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

