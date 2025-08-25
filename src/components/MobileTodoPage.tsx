import React, { useState, useMemo, useEffect } from 'react';
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
  Trash2,
  Edit,
  CalendarDays,
  ExternalLink,
  Link
} from 'lucide-react';
import { useTodoStore } from '@/store/useTodoStore';
import { ImprovementTask } from '@/types';
import { cn } from '@/lib/utils';
import { CustomSelect } from './CustomSelect';
import { CalendarPicker } from './CalendarPicker';

export const MobileTodoPage: React.FC = () => {
  const { tasks, toggleDone, addTask, deleteTask, updateTask, scheduleTask, togglePin } = useTodoStore();
  const [newTaskText, setNewTaskText] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'med' | 'high' | ''>('');
  const [newCategory, setNewCategory] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [filter, setFilter] = useState<'today' | 'all' | 'open' | 'done' | 'snoozed'>('today');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTaskMenu, setActiveTaskMenu] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null);
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState<string>('');

  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks
      .slice()
      .sort((a, b) => (Number(!!b.pinned) - Number(!!a.pinned)) || ((b.order || 0) - (a.order || 0)))
      .filter((t) => {
        if (filter === 'all') return true;
        if (filter === 'today') {
          // Show tasks scheduled for today, overdue tasks, or unscheduled open tasks
          if (t.status !== 'open') return false;
          if (!t.scheduledFor) return true; // Unscheduled open tasks show in Today
          const scheduledDate = new Date(t.scheduledFor as any);
          return scheduledDate < tomorrow; // Today or overdue
        }
        return t.status === filter;
      })
      .filter((t) => categoryFilter === 'all' ? true : t.category === categoryFilter);
  }, [tasks, filter, categoryFilter]);

  const openTasksCount = tasks.filter(task => task.status === 'open').length;
  const completedTasksCount = tasks.filter(task => task.status === 'done').length;
  const todayTasksCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks.filter(t => {
      if (t.status !== 'open') return false;
      if (!t.scheduledFor) return true;
      const scheduledDate = new Date(t.scheduledFor as any);
      return scheduledDate < tomorrow;
    }).length;
  }, [tasks]);

  const handleAddTask = async () => {
    if (newTaskText.trim()) {
      await addTask(newTaskText.trim(), {
        priority: newPriority || undefined,
        category: newCategory || undefined,
        url: newUrl.trim() || undefined,
      });
      setNewTaskText('');
      setNewPriority('');
      setNewCategory('');
      setNewUrl('');
      setIsAddingTask(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    await toggleDone(taskId);
  };

  const handleScheduleTask = async (taskId: string, date: Date) => {
    await scheduleTask(taskId, date);
    setActiveTaskMenu(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    setActiveTaskMenu(null);
  };

  const handleTogglePin = async (taskId: string) => {
    await togglePin(taskId);
    setActiveTaskMenu(null);
  };

  const handleOpenCalendar = (taskId: string) => {
    setSchedulingTaskId(taskId);
    setIsCalendarOpen(true);
    setActiveTaskMenu(null);
  };

  const handleCalendarDateSelect = async (date: Date) => {
    if (schedulingTaskId) {
      await scheduleTask(schedulingTaskId, date);
      setSchedulingTaskId(null);
    }
    setIsCalendarOpen(false);
  };

  // Helper function to format URLs for display (same as desktop)
  const formatUrlForDisplay = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      const path = urlObj.pathname;
      
      if (hostname === 'youtube.com' || hostname === 'youtu.be') {
        return 'YouTube';
      } else if (hostname === 'github.com') {
        return `GitHub${path.length > 1 ? ` • ${path.split('/')[1]}` : ''}`;
      } else if (hostname === 'docs.google.com') {
        return 'Google Docs';
      } else if (hostname === 'notion.so') {
        return 'Notion';
      } else if (hostname === 'medium.com') {
        return 'Medium';
      } else {
        return hostname;
      }
    } catch {
      return url.length > 30 ? url.substring(0, 30) + '...' : url;
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveTaskMenu(null);
    };

    if (activeTaskMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeTaskMenu]);

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Todo List</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{todayTasksCount} today</span>
          <span>{openTasksCount} open</span>
          <span>{completedTasksCount} completed</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="space-y-4 mb-6">
        <div className="flex bg-muted rounded-lg p-1">
          {(['today', 'all', 'open', 'done', 'snoozed'] as const).map((filterOption) => (
            <button
              key={filterOption}
              className={cn(
                'flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors',
                filter === filterOption
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setFilter(filterOption)}
            >
              {filterOption === 'today' ? 'Today' :
               filterOption === 'all' ? 'All' : 
               filterOption === 'open' ? 'Open' : 
               filterOption === 'done' ? 'Done' : 'Snoozed'}
            </button>
          ))}
        </div>
        
        {/* Category Filter */}
        <CustomSelect
          value={categoryFilter}
          onChange={(value) => setCategoryFilter(value as string)}
          options={[
            { value: 'all', label: 'All categories', emoji: '✓' },
            { value: 'risk', label: 'Risk', emoji: '🔴' },
            { value: 'analysis', label: 'Analysis', emoji: '🔵' },
            { value: 'execution', label: 'Execution', emoji: '🟠' },
            { value: 'journal', label: 'Journal', emoji: '🟢' },
            { value: 'learning', label: 'Learning', emoji: '🔷' },
            { value: 'wellness', label: 'Wellness', emoji: '🟣' },
            { value: 'mindset', label: 'Mindset', emoji: '🩷' }
          ]}
          placeholder="All categories"
          size="md"
          className="w-full"
        />
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
                
                {/* URL input field */}
                <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="Add URL (optional)"
                    className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                
                {/* Priority and Category selectors */}
                <div className="flex gap-2">
                  <CustomSelect
                    value={newPriority}
                    onChange={(value) => setNewPriority(value as 'low' | 'med' | 'high' | '')}
                    options={[
                      { value: '', label: 'Priority' },
                      { value: 'high', label: 'High', emoji: '🔴' },
                      { value: 'med', label: 'Medium', emoji: '🟡' },
                      { value: 'low', label: 'Low', emoji: '🟢' }
                    ]}
                    placeholder="Priority"
                    size="md"
                    className="flex-1"
                  />
                  <CustomSelect
                    value={newCategory}
                    onChange={(value) => setNewCategory(value)}
                    options={[
                      { value: '', label: 'Category' },
                      { value: 'risk', label: 'Risk', emoji: '🔴' },
                      { value: 'analysis', label: 'Analysis', emoji: '🔵' },
                      { value: 'journal', label: 'Journal', emoji: '🟢' },
                      { value: 'wellness', label: 'Wellness', emoji: '🟣' },
                      { value: 'execution', label: 'Execution', emoji: '🟠' },
                      { value: 'learning', label: 'Learning', emoji: '🔷' },
                      { value: 'mindset', label: 'Mindset', emoji: '🩷' }
                    ]}
                    placeholder="Category"
                    size="md"
                    className="flex-1"
                  />
                </div>
                
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
                      setNewPriority('');
                      setNewCategory('');
                      setNewUrl('');
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
                  <div className="flex items-start gap-2 mb-2">
                    {task.pinned && (
                      <Pin className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                    )}
                    <p className={cn(
                      'text-sm leading-relaxed',
                      task.status === 'done' 
                        ? 'line-through text-muted-foreground' 
                        : 'text-foreground'
                    )}>
                      {task.text}
                    </p>
                  </div>

                  {/* Task Meta */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    {task.url && (
                      <a
                        href={task.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 transition-colors text-xs font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {formatUrlForDisplay(task.url)}
                      </a>
                    )}
                    {task.category && (
                      <div className="flex items-center gap-1">
                        <span>
                          {task.category === 'risk' ? '🔴' :
                           task.category === 'analysis' ? '🔵' :
                           task.category === 'journal' ? '🟢' :
                           task.category === 'wellness' ? '🟣' :
                           task.category === 'execution' ? '🟠' :
                           task.category === 'learning' ? '🔷' :
                           task.category === 'mindset' ? '🩷' : '📝'}
                        </span>
                        <span className="capitalize">{task.category}</span>
                      </div>
                    )}
                    {task.scheduledFor && (
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        <span>Scheduled: {new Date(task.scheduledFor).toLocaleDateString()}</span>
                      </div>
                    )}
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
                <div className="relative">
                  <motion.button
                    className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-accent-foreground"
                    onClick={(e) => { e.stopPropagation(); setActiveTaskMenu(activeTaskMenu === task.id ? null : task.id); }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </motion.button>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {activeTaskMenu === task.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[160px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                            onClick={() => handleTogglePin(task.id)}
                          >
                            <Pin className="w-3 h-3" />
                            {task.pinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                            onClick={() => {
                              setEditingUrlId(task.id);
                              setEditingUrl(task.url || '');
                              setActiveTaskMenu(null);
                            }}
                          >
                            <Link className="w-3 h-3" />
                            {task.url ? 'Edit URL' : 'Add URL'}
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                            onClick={() => handleScheduleTask(task.id, new Date())}
                          >
                            <CalendarDays className="w-3 h-3" />
                            Schedule for Today
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                            onClick={() => {
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              handleScheduleTask(task.id, tomorrow);
                            }}
                          >
                            <Calendar className="w-3 h-3" />
                            Schedule for Tomorrow
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                            onClick={() => handleOpenCalendar(task.id)}
                          >
                            <CalendarDays className="w-3 h-3" />
                            Schedule for Date...
                          </button>
                          <div className="border-t border-border my-1" />
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent text-red-600 flex items-center gap-2"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
              {filter === 'today' ? 'Nothing for today' :
               filter === 'open' ? 'No open tasks' : 
               filter === 'done' ? 'No completed tasks' : 
               filter === 'snoozed' ? 'No snoozed tasks' : 'No tasks yet'}
            </h3>
            <p className="text-muted-foreground">
              {filter === 'today' ? 'All caught up for today! Great work.' :
               filter === 'open' ? 'All tasks completed! Great work.' :
               filter === 'done' ? 'Complete some tasks to see them here.' :
               filter === 'snoozed' ? 'No tasks are currently snoozed.' :
               'Add your first task to get started.'}
            </p>
          </div>
        )}
      </div>

      {/* Calendar Picker Modal */}
      <CalendarPicker
        isOpen={isCalendarOpen}
        onClose={() => {
          setIsCalendarOpen(false);
          setSchedulingTaskId(null);
        }}
        onSelectDate={handleCalendarDateSelect}
        title="Schedule Task"
      />

      {/* URL Edit Modal */}
      <AnimatePresence>
        {editingUrlId && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingUrlId(null)}
          >
            <motion.div
              className="bg-card border border-border rounded-xl p-6 shadow-xl max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Link className="w-5 h-5 text-primary" />
                Add/Edit URL
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">URL</label>
                  <input
                    type="url"
                    value={editingUrl}
                    onChange={(e) => setEditingUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Add a link to YouTube videos, articles, documentation, or any resource related to this task.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    onClick={() => {
                      updateTask(editingUrlId, { url: editingUrl.trim() || undefined });
                      setEditingUrlId(null);
                      setEditingUrl('');
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-accent transition-colors font-medium"
                    onClick={() => {
                      updateTask(editingUrlId, { url: undefined });
                      setEditingUrlId(null);
                      setEditingUrl('');
                    }}
                  >
                    Remove URL
                  </button>
                </div>
                <button
                  className="w-full px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
                  onClick={() => {
                    setEditingUrlId(null);
                    setEditingUrl('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
