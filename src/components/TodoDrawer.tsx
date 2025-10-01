import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Clock, Tag, MoreVertical, Plus, X, Pin, Calendar, ExternalLink, Link, Inbox, CalendarDays, CheckSquare } from 'lucide-react';
import { useTodoStore, initializeSampleTasks } from '@/store/useTodoStore';
import { ImprovementTask } from '@/types';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { CustomSelect } from './CustomSelect';
import { checkAndAddWeeklyReviewTodo, openWeeklyReviewFromUrl, parseWeeklyReviewUrl } from '@/lib/weeklyReviewTodo';

interface TodoDrawerProps {
  className?: string;
  forcedWidth?: number;
}

const sidebarVariants = {
  expanded: { width: 400, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  collapsed: { width: 60, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

const contentVariants = {
  expanded: { opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.1, ease: 'easeOut' } },
  collapsed: { opacity: 0, x: 20, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const TodoDrawer: React.FC<TodoDrawerProps> = ({ className, forcedWidth }) => {
  const { isExpanded, tasks, toggleDrawer, addTask, toggleDone, deleteTask, updateTask, initialize, togglePin, setCategory, scheduleTask, railWidth, setRailWidth } = useTodoStore();
  const { isExpanded: activityExpanded } = useActivityLogStore();
  const { snoozeTask } = useTodoStore.getState();
  const [filter, setFilter] = useState<'all' | 'today' | 'open' | 'done' | 'snoozed'>('today');
  const [query, setQuery] = useState('');
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'med' | 'high' | ''>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [snoozeForId, setSnoozeForId] = useState<string | null>(null);
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set());
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null);
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState<string>('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const newTaskInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const init = async () => {
      await initialize();
      await initializeSampleTasks();
      // Check if we need to add a weekly review todo
      await checkAndAddWeeklyReviewTodo();
    };
    init();
  }, [initialize]);

  useEffect(() => {
    if (isExpanded) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isExpanded]);

  const filtered = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks
      .slice()
      .sort((a, b) => {
        // Pinned tasks always at top
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        // Within same pinned status, sort by order (descending = newer at top)
        return (b.order || 0) - (a.order || 0);
      })
      .filter((t) => {
        if (filter === 'all') return true;
        if (filter === 'today') {
          // Show tasks scheduled for today, overdue tasks, or unscheduled open tasks
          if (t.status !== 'open') return false;
          if (!t.scheduledFor) return true; // Unscheduled open tasks show in Today
          const scheduledDate = new Date(t.scheduledFor as any);
          return scheduledDate < tomorrow; // Today or overdue
        }
        if (filter === 'snoozed') {
          // Show tasks scheduled for future dates (not today)
          if (t.status !== 'open') return false;
          if (!t.scheduledFor) return false;
          const scheduledDate = new Date(t.scheduledFor as any);
          return scheduledDate >= tomorrow; // Tomorrow or later
        }
        return t.status === filter;
      })
      .filter((t) => categoryFilter === 'all' ? true : t.category === categoryFilter)
      .filter((t) => !query.trim() || t.text.toLowerCase().includes(query.toLowerCase()));
  }, [tasks, filter, query, categoryFilter]);

  const pinnedTasks = React.useMemo(() => filtered.filter(t => t.pinned), [filtered]);
  const otherTasks = React.useMemo(() => filtered.filter(t => !t.pinned), [filtered]);
  const sectionOrder = React.useMemo(() => [...pinnedTasks, ...otherTasks].map(t => t.id), [pinnedTasks, otherTasks]);

  const handleAdd = async () => {
    const text = newText.trim();
    if (!text) return;
    const extras: Partial<ImprovementTask> = {};
    if (newPriority) extras.priority = newPriority;
    if (newCategory) extras.category = newCategory;
    if (newUrl.trim()) extras.url = newUrl.trim();
    
    // Set order to put it at the bottom (lowest order value)
    const lowestOrder = Math.min(...tasks.map(t => t.order || 0), 0);
    extras.order = lowestOrder - 1;
    
    await addTask(text, extras);
    setNewText('');
    setNewPriority('');
    setNewCategory('');
    setNewUrl('');
  };

  const handleToggleDone = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.status === 'open') {
      // Mark as completing for animation
      setCompletingTasks(prev => new Set(prev).add(taskId));
      
      // Wait for animation, then toggle and remove from view
      setTimeout(async () => {
        await toggleDone(taskId);
        setCompletingTasks(prev => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }, 600); // Animation duration
    } else {
      // Unchecking - no animation needed
      await toggleDone(taskId);
    }
  };

  const rightOffset = Math.max(60, (activityExpanded ? 320 : 60));
  const clampedWidth = Math.max(280, Math.min(480, isExpanded ? (forcedWidth ?? railWidth) : 60));

  // Helper function to format URLs for display
  const formatUrlForDisplay = (url: string): string => {
    // Check for weekly review URLs first
    const weekOf = parseWeeklyReviewUrl(url);
    if (weekOf) {
      const weekDate = new Date(weekOf);
      const weekEndDate = new Date(weekDate);
      weekEndDate.setDate(weekDate.getDate() + 6);
      return `Weekly Review (${weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    }
    
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

  return (
    <>
      {/* Backdrop when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleDrawer}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`fixed top-0 h-full bg-card border-l border-border z-50 flex flex-col shadow-xl ${className}`}
        style={{ right: rightOffset, width: clampedWidth }}
        variants={sidebarVariants}
        animate={isExpanded ? 'expanded' : 'collapsed'}
        initial={false}
      >
      {/* Header - Apple-style minimal */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div 
              className="flex items-center gap-2 flex-1"
              variants={contentVariants} 
              initial="collapsed" 
              animate="expanded" 
              exit="collapsed"
            >
              <h2 className="text-base font-semibold text-foreground">Todo</h2>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-muted rounded-md">
                <span className="text-xs font-medium text-muted-foreground">{tasks.filter(t => t.status === 'open').length}</span>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1" />
          )}
        </AnimatePresence>

        <motion.button
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors relative"
          onClick={toggleDrawer}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isExpanded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {/* Badge count for collapsed state */}
          {!isExpanded && tasks.filter(t => t.status === 'open').length > 0 && (
            <motion.div
              className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {tasks.filter(t => t.status === 'open').length}
            </motion.div>
          )}
        </motion.button>
      </div>


      {/* Smart Lists - Apple Reminders style */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div 
            className="px-3 pt-3 pb-2" 
            variants={contentVariants} 
            initial="collapsed" 
            animate="expanded" 
            exit="collapsed"
          >
            <div className="space-y-0.5">
              {[
                { 
                  id: 'today', 
                  label: 'Today', 
                  icon: Circle,
                  iconColor: 'text-blue-500',
                  count: tasks.filter(t => {
                    if (t.status !== 'open') return false;
                    if (!t.scheduledFor) return true;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const scheduledDate = new Date(t.scheduledFor as any);
                    return scheduledDate < tomorrow;
                  }).length 
                },
                { 
                  id: 'open', 
                  label: 'All', 
                  icon: Inbox,
                  iconColor: 'text-muted-foreground',
                  count: tasks.filter(t => t.status === 'open').length 
                },
                { 
                  id: 'snoozed', 
                  label: 'Scheduled', 
                  icon: CalendarDays,
                  iconColor: 'text-red-500',
                  count: tasks.filter(t => {
                    if (t.status !== 'open') return false;
                    if (!t.scheduledFor) return false;
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const scheduledDate = new Date(t.scheduledFor as any);
                    return scheduledDate >= tomorrow; // Tomorrow or later
                  }).length 
                },
                { 
                  id: 'done', 
                  label: 'Completed', 
                  icon: CheckSquare,
                  iconColor: 'text-muted-foreground',
                  count: tasks.filter(t => t.status === 'done').length 
                },
              ].map((list) => {
                const IconComponent = list.icon;
                return (
                <button
                    key={list.id}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      filter === list.id 
                        ? 'bg-accent text-foreground font-medium' 
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    }`}
                    onClick={() => setFilter(list.id as any)}
                  >
                    <IconComponent className={`w-4 h-4 ${filter === list.id ? list.iconColor : 'text-muted-foreground/60'}`} />
                    <span className="flex-1 text-left">{list.label}</span>
                    {list.count > 0 && (
                      <span className={`text-xs ${filter === list.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {list.count}
                      </span>
                    )}
                </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-3 space-y-2" onDragOver={(e) => e.preventDefault()}>
            {pinnedTasks.length > 0 && (
              <div className="px-1 pt-1 text-[10px] uppercase tracking-wide text-muted-foreground/80">Pinned</div>
            )}
            {pinnedTasks.map((task) => (
              <motion.div
                key={task.id}
                className="group px-2 py-2 rounded-md hover:bg-accent/50 transition-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start gap-2">
                  {/* Checkbox - matches sidebar icons */}
                    <motion.button 
                    className="flex-shrink-0 mt-0.5" 
                      onClick={() => handleToggleDone(task.id)} 
                      aria-label="toggle done"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    >
                      <AnimatePresence mode="wait">
                        {completingTasks.has(task.id) ? (
                          <motion.div
                            key="completing"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ 
                              scale: [0.8, 1.2, 1], 
                              opacity: 1,
                              rotate: [0, 360]
                            }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ 
                              duration: 0.6, 
                              ease: "easeOut",
                              times: [0, 0.6, 1]
                            }}
                          >
                          <CheckCircle2 className="w-[18px] h-[18px] text-primary" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="normal"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {task.status === 'done' ? 
                            <CheckCircle2 className="w-[18px] h-[18px] text-primary" /> : 
                            <Circle className="w-[18px] h-[18px] text-muted-foreground/60" />
                            }
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    {/* Task Text - wraps naturally */}
                      <textarea
                      className={`w-full bg-transparent text-sm outline-none resize-none overflow-hidden leading-relaxed ${
                        task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                        defaultValue={task.text}
                        rows={1}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                        onBlur={(e) => {
                          const text = e.target.value.trim();
                          if (text && text !== task.text) updateTask(task.id, { text });
                          else e.target.value = task.text;
                        }}
                      />
                    
                    {/* Metadata Row - Apple Reminders style */}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {/* URL Pill */}
                        {task.url && (
                          <button
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (parseWeeklyReviewUrl(task.url!)) {
                                openWeeklyReviewFromUrl(task.url!);
                              } else {
                                window.open(task.url!, '_blank', 'noopener,noreferrer');
                              }
                            }}
                          >
                            <ExternalLink className="w-3 h-3" />
                          <span className="max-w-[150px] truncate">{formatUrlForDisplay(task.url)}</span>
                          </button>
                        )}
                      
                      {/* Schedule Pill */}
                        {task.scheduledFor && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent text-foreground text-xs">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        )}
                      
                      {/* Category Tag */}
                        {task.category && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent text-muted-foreground text-xs">
                          <Tag className="w-3 h-3" />
                            {task.category}
                          </span>
                        )}
                      </div>
                  </div>

                  {/* Info button (hover only) - minimal icon */}
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent flex-shrink-0 mt-0.5"
                    onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                    aria-label="info"
                    title="Details"
                  >
                    <MoreVertical className="w-[14px] h-[14px] text-muted-foreground/60" />
                  </button>
                </div>

                {/* Expanded Details Panel - Apple Reminders style */}
                <AnimatePresence>
                  {expandedTaskId === task.id && (
                    <motion.div
                      className="mt-2 pt-2 border-t border-border/50 space-y-2"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Notes section */}
                      <div>
                        <textarea
                          placeholder="Add Note"
                          className="w-full px-2 py-1.5 text-xs bg-transparent border border-border/50 rounded-md outline-none focus:ring-1 focus:ring-primary resize-none"
                          rows={2}
                          defaultValue={task.notes || ''}
                          onBlur={(e) => {
                            const notes = e.target.value.trim();
                            updateTask(task.id, { notes: notes || undefined });
                          }}
                        />
                      </div>

                      {/* Details buttons row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Schedule button */}
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent hover:bg-accent/70 text-xs transition-colors"
                          onClick={() => setSchedulingTaskId(task.id)}
                        >
                          <Calendar className="w-3 h-3" />
                          {task.scheduledFor ? new Date(task.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Schedule'}
                        </button>

                        {/* Category button */}
                        <select
                          className="px-2 py-1 rounded-md bg-accent hover:bg-accent/70 text-xs outline-none cursor-pointer transition-colors"
                          value={task.category || ''}
                          onChange={(e) => setCategory(task.id, e.target.value || undefined)}
                        >
                          <option value="">Category</option>
                          <option value="risk">Risk</option>
                          <option value="analysis">Analysis</option>
                          <option value="execution">Execution</option>
                          <option value="journal">Journal</option>
                          <option value="learning">Learning</option>
                          <option value="wellness">Wellness</option>
                          <option value="mindset">Mindset</option>
                        </select>

                        {/* Pin button */}
                        <button
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                            task.pinned 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-accent hover:bg-accent/70'
                          }`}
                          onClick={() => togglePin(task.id)}
                        >
                          <Pin className="w-3 h-3" />
                          {task.pinned ? 'Pinned' : 'Pin'}
                        </button>
                      </div>

                      {/* URL input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          placeholder="Add URL"
                          className="flex-1 px-2 py-1.5 text-xs bg-transparent border border-border/50 rounded-md outline-none focus:ring-1 focus:ring-primary"
                          defaultValue={task.url || ''}
                          onBlur={(e) => {
                            const url = e.target.value.trim();
                            updateTask(task.id, { url: url || undefined });
                          }}
                        />
                    </div>

                      {/* Delete button */}
                      <button
                        className="w-full px-2 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        onClick={() => {
                          if (window.confirm('Delete this task?')) {
                            deleteTask(task.id);
                            setExpandedTaskId(null);
                          }
                        }}
                      >
                        Delete Task
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {otherTasks.map((task) => (
              <motion.div
                key={task.id}
                className="group px-2 py-2 rounded-md hover:bg-accent/50 transition-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start gap-2">
                  {/* Checkbox - matches sidebar icons */}
                    <motion.button 
                    className="flex-shrink-0 mt-0.5" 
                      onClick={() => handleToggleDone(task.id)} 
                      aria-label="toggle done"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    >
                      <AnimatePresence mode="wait">
                        {completingTasks.has(task.id) ? (
                          <motion.div
                            key="completing"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ 
                              scale: [0.8, 1.2, 1], 
                              opacity: 1,
                              rotate: [0, 360]
                            }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ 
                              duration: 0.6, 
                              ease: "easeOut",
                              times: [0, 0.6, 1]
                            }}
                          >
                          <CheckCircle2 className="w-[18px] h-[18px] text-primary" />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="normal"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {task.status === 'done' ? 
                            <CheckCircle2 className="w-[18px] h-[18px] text-primary" /> : 
                            <Circle className="w-[18px] h-[18px] text-muted-foreground/60" />
                            }
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    {/* Task Text - wraps naturally */}
                      <textarea
                      className={`w-full bg-transparent text-sm outline-none resize-none overflow-hidden leading-relaxed ${
                        task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                        defaultValue={task.text}
                        rows={1}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                        onBlur={(e) => {
                          const text = e.target.value.trim();
                          if (text && text !== task.text) updateTask(task.id, { text });
                          else e.target.value = task.text;
                        }}
                      />
                    
                    {/* Metadata Row - Apple Reminders style */}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {/* URL Pill */}
                        {task.url && (
                          <button
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (parseWeeklyReviewUrl(task.url!)) {
                                openWeeklyReviewFromUrl(task.url!);
                              } else {
                                window.open(task.url!, '_blank', 'noopener,noreferrer');
                              }
                            }}
                          >
                            <ExternalLink className="w-3 h-3" />
                          <span className="max-w-[150px] truncate">{formatUrlForDisplay(task.url)}</span>
                          </button>
                        )}
                      
                      {/* Schedule Pill */}
                        {task.scheduledFor && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent text-foreground text-xs">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        )}
                      
                      {/* Category Tag */}
                        {task.category && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent text-muted-foreground text-xs">
                          <Tag className="w-3 h-3" />
                            {task.category}
                          </span>
                        )}
                      </div>
                  </div>

                  {/* Info button (hover only) - minimal icon */}
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent flex-shrink-0 mt-0.5"
                    onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                    aria-label="info"
                    title="Details"
                  >
                    <MoreVertical className="w-[14px] h-[14px] text-muted-foreground/60" />
                  </button>
                </div>

                {/* Expanded Details Panel - Apple Reminders style */}
                <AnimatePresence>
                  {expandedTaskId === task.id && (
                    <motion.div
                      className="mt-2 pt-2 border-t border-border/50 space-y-2"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* Notes section */}
                      <div>
                        <textarea
                          placeholder="Add Note"
                          className="w-full px-2 py-1.5 text-xs bg-transparent border border-border/50 rounded-md outline-none focus:ring-1 focus:ring-primary resize-none"
                          rows={2}
                          defaultValue={task.notes || ''}
                          onBlur={(e) => {
                            const notes = e.target.value.trim();
                            updateTask(task.id, { notes: notes || undefined });
                          }}
                        />
                      </div>

                      {/* Details buttons row */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Schedule button */}
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent hover:bg-accent/70 text-xs transition-colors"
                          onClick={() => setSchedulingTaskId(task.id)}
                        >
                          <Calendar className="w-3 h-3" />
                          {task.scheduledFor ? new Date(task.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Schedule'}
                        </button>

                        {/* Category button */}
                        <select
                          className="px-2 py-1 rounded-md bg-accent hover:bg-accent/70 text-xs outline-none cursor-pointer transition-colors"
                          value={task.category || ''}
                          onChange={(e) => setCategory(task.id, e.target.value || undefined)}
                        >
                          <option value="">Category</option>
                          <option value="risk">Risk</option>
                          <option value="analysis">Analysis</option>
                          <option value="execution">Execution</option>
                          <option value="journal">Journal</option>
                          <option value="learning">Learning</option>
                          <option value="wellness">Wellness</option>
                          <option value="mindset">Mindset</option>
                        </select>

                        {/* Pin button */}
                        <button
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                            task.pinned 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-accent hover:bg-accent/70'
                          }`}
                          onClick={() => togglePin(task.id)}
                        >
                          <Pin className="w-3 h-3" />
                          {task.pinned ? 'Pinned' : 'Pin'}
                        </button>
                      </div>

                      {/* URL input */}
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          placeholder="Add URL"
                          className="flex-1 px-2 py-1.5 text-xs bg-transparent border border-border/50 rounded-md outline-none focus:ring-1 focus:ring-primary"
                          defaultValue={task.url || ''}
                          onBlur={(e) => {
                            const url = e.target.value.trim();
                            updateTask(task.id, { url: url || undefined });
                          }}
                        />
                    </div>

                      {/* Delete button */}
                      <button
                        className="w-full px-2 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        onClick={() => {
                          if (window.confirm('Delete this task?')) {
                            deleteTask(task.id);
                            setExpandedTaskId(null);
                          }
                        }}
                      >
                        Delete Task
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {filtered.length === 0 && !isAddingNew && (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground text-sm">
                No tasks yet
              </div>
            )}

            {/* Inline New Task - Apple Reminders style */}
            <AnimatePresence>
              {isAddingNew && (
                <motion.div
                  className="group px-2 py-2 rounded-md hover:bg-accent/50 transition-all"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="flex items-start gap-2">
                    {/* Empty checkbox */}
                    <div className="flex-shrink-0 mt-0.5">
                      <Circle className="w-[18px] h-[18px] text-muted-foreground/60" />
          </div>

                    {/* New Task Input */}
                    <div className="flex-1 min-w-0">
                      <textarea
                        ref={newTaskInputRef}
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        placeholder="New Task"
                        className="w-full bg-transparent text-sm outline-none resize-none overflow-hidden leading-relaxed text-foreground"
                        rows={1}
                        autoFocus
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (newText.trim()) {
                              handleAdd();
                              setIsAddingNew(false);
                            }
                          }
                          if (e.key === 'Escape') {
                            setNewText('');
                            setNewPriority('');
                            setNewCategory('');
                            setNewUrl('');
                            setIsAddingNew(false);
                          }
                        }}
                        onBlur={() => {
                          // Save task if there's text, otherwise cancel
                          if (newText.trim()) {
                            handleAdd();
                            setIsAddingNew(false);
                          } else {
                            setIsAddingNew(false);
                          }
                        }}
                      />

                      {/* Quick details row */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent hover:bg-accent/70 text-xs transition-colors"
                          onClick={() => setSchedulingTaskId('new')}
                        >
                          <Calendar className="w-3 h-3" />
                          Schedule
                        </button>

                        <select
                          className="px-2 py-1 rounded-md bg-accent hover:bg-accent/70 text-xs outline-none cursor-pointer transition-colors"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                        >
                          <option value="">Category</option>
                          <option value="risk">Risk</option>
                          <option value="analysis">Analysis</option>
                          <option value="execution">Execution</option>
                          <option value="journal">Journal</option>
                          <option value="learning">Learning</option>
                          <option value="wellness">Wellness</option>
                          <option value="mindset">Mindset</option>
                        </select>
        </div>

                      {/* URL input */}
                      {newUrl || (
                        <button
                          className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => newTaskInputRef.current?.focus()}
                        >
                          Add URL
                        </button>
                      )}
                      {newUrl && (
                        <input
                          type="url"
                          placeholder="Add URL"
                          value={newUrl}
                          onChange={(e) => setNewUrl(e.target.value)}
                          className="w-full mt-2 px-2 py-1.5 text-xs bg-transparent border border-border/50 rounded-md outline-none focus:ring-1 focus:ring-primary"
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Floating Add Button - iOS style */}
      {isExpanded && (
        <motion.button
          className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
          onClick={() => {
            setIsAddingNew(true);
            setTimeout(() => newTaskInputRef.current?.focus(), 100);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      )}

      {/* Schedule Modal */}
      <AnimatePresence>
        {schedulingTaskId && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSchedulingTaskId(null)}
          >
            <motion.div
              className="bg-card border border-border rounded-xl p-6 shadow-xl max-w-sm w-full mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Schedule Task
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      if (e.target.value) {
                        const selectedDate = new Date(e.target.value);
                        scheduleTask(schedulingTaskId, selectedDate);
                        setSchedulingTaskId(null);
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    onClick={() => {
                      const today = new Date();
                      scheduleTask(schedulingTaskId, today);
                      setSchedulingTaskId(null);
                    }}
                  >
                    Today
                  </button>
                  <button
                    className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-accent transition-colors"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      scheduleTask(schedulingTaskId, tomorrow);
                      setSchedulingTaskId(null);
                    }}
                  >
                    Tomorrow
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-accent transition-colors"
                    onClick={() => {
                      scheduleTask(schedulingTaskId, undefined); // Clear schedule
                      setSchedulingTaskId(null);
                    }}
                  >
                    Clear Schedule
                  </button>
                  <button
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                    onClick={() => setSchedulingTaskId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* URL Edit Modal */}
      <AnimatePresence>
        {editingUrlId && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setEditingUrlId(null)}
          >
            <motion.div
              className="bg-card border border-border rounded-xl p-6 shadow-xl max-w-md w-full mx-4"
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
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Add a link to YouTube videos, articles, documentation, or any resource related to this task.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    onClick={() => {
                      updateTask(editingUrlId, { url: editingUrl.trim() || undefined });
                      setEditingUrlId(null);
                      setEditingUrl('');
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-accent transition-colors"
                    onClick={() => {
                      updateTask(editingUrlId, { url: undefined });
                      setEditingUrlId(null);
                      setEditingUrl('');
                    }}
                  >
                    Remove URL
                  </button>
                  <button
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                    onClick={() => {
                      setEditingUrlId(null);
                      setEditingUrl('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
    </>
  );
};

export default TodoDrawer;


