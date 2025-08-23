import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Calendar, 
  Clock, 
  Tag, 
  MoreVertical, 
  X, 
  Pin,
  Trash2
} from 'lucide-react';
import { useTodoStore } from '@/store/useTodoStore';
import { ImprovementTask } from '@/types';
import { cn } from '@/lib/utils';

export const MobileTodoPage: React.FC = () => {
  const { tasks, toggleDone, addTask, deleteTask, updateTask } = useTodoStore();
  const [newTaskText, setNewTaskText] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'done'>('all');

  const filteredTasks = tasks.filter(task => {
    if (filter === 'open') return task.status === 'open';
    if (filter === 'done') return task.status === 'done';
    return true;
  });

  const openTasksCount = tasks.filter(task => task.status === 'open').length;
  const completedTasksCount = tasks.filter(task => task.status === 'done').length;

  const handleAddTask = async () => {
    if (newTaskText.trim()) {
      await addTask(newTaskText.trim());
      setNewTaskText('');
      setIsAddingTask(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    await toggleDone(taskId);
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Todo List</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{openTasksCount} open</span>
          <span>{completedTasksCount} completed</span>
          <span>{tasks.length} total</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-muted rounded-lg p-1 mb-6">
        {(['all', 'open', 'done'] as const).map((filterOption) => (
          <button
            key={filterOption}
            className={cn(
              'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors',
              filter === filterOption
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setFilter(filterOption)}
          >
            {filterOption === 'all' ? 'All' : filterOption === 'open' ? 'Open' : 'Completed'}
          </button>
        ))}
      </div>

      {/* Add Task Section */}
      <div className="mb-6">
        <AnimatePresence>
          {isAddingTask ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card border border-border rounded-lg p-4 mb-4"
            >
              <div className="space-y-3">
                <textarea
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full p-3 bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <motion.button
                    className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium"
                    onClick={handleAddTask}
                    whileTap={{ scale: 0.98 }}
                    disabled={!newTaskText.trim()}
                  >
                    Add Task
                  </motion.button>
                  <motion.button
                    className="px-4 py-2 border border-border rounded-lg text-muted-foreground"
                    onClick={() => {
                      setIsAddingTask(false);
                      setNewTaskText('');
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              onClick={() => setIsAddingTask(true)}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add New Task</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <motion.button
                  className={cn(
                    'mt-1 flex-shrink-0 w-5 h-5 rounded border-2 transition-colors flex items-center justify-center',
                    task.status === 'done'
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground hover:border-primary'
                  )}
                  onClick={() => handleToggleTask(task.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {task.status === 'done' && (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                </motion.button>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm leading-relaxed mb-2',
                    task.status === 'done' 
                      ? 'line-through text-muted-foreground' 
                      : 'text-foreground'
                  )}>
                    {task.text}
                  </p>

                  {/* Task Meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {task.dueAt && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {new Date(task.dueAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {task.priority && (
                      <div className="flex items-center gap-1">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'med' ? 'bg-yellow-500' : 'bg-green-500'
                        )} />
                        <span className="capitalize">{task.priority}</span>
                      </div>
                    )}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        <span>{task.tags.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Menu */}
                <motion.button
                  className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                  whileTap={{ scale: 0.95 }}
                >
                  <MoreVertical className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              {filter === 'open' ? 'No open tasks' : 
               filter === 'done' ? 'No completed tasks' : 'No tasks yet'}
            </h3>
            <p className="text-muted-foreground">
              {filter === 'open' ? 'All caught up! Great work.' :
               filter === 'done' ? 'Complete some tasks to see them here.' :
               'Add your first task to get started.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
