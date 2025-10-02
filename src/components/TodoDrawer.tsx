import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Clock, Tag, MoreVertical, Plus, X, Pin, Flag, Calendar, ExternalLink, Link, Inbox, CalendarDays, CheckSquare, Hash } from 'lucide-react';
import { useTodoStore, initializeSampleTasks } from '@/store/useTodoStore';
import { ImprovementTask } from '@/types';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { CustomSelect } from './CustomSelect';
import { checkAndAddWeeklyReviewTodo, openWeeklyReviewFromUrl, parseWeeklyReviewUrl } from '@/lib/weeklyReviewTodo';
import { cn } from '@/lib/utils';

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
  const newTaskFormRef = useRef<HTMLDivElement>(null);
  const [newNotes, setNewNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [newTags, setNewTags] = useState<string[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [newFlagged, setNewFlagged] = useState(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [tagContextMenu, setTagContextMenu] = useState<{ tag: string; x: number; y: number; taskId?: string } | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [editingTagsTaskId, setEditingTagsTaskId] = useState<string | null>(null);
  const [newTagForTask, setNewTagForTask] = useState('');

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

  // Handle click outside to close expanded task details
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if click is outside any expanded details panel
      if (expandedTaskId && !target.closest('.expanded-details-panel')) {
        setExpandedTaskId(null);
      }
    };

    if (expandedTaskId) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [expandedTaskId]);

  // Close tag context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setTagContextMenu(null);
    if (tagContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [tagContextMenu]);

  // Handle click outside new task form
  useEffect(() => {
    const handleClickOutside = async (e: MouseEvent) => {
      if (isAddingNew && newTaskFormRef.current && !newTaskFormRef.current.contains(e.target as Node)) {
        if (newText.trim()) {
          await handleAdd();
        } else {
          setIsAddingNew(false);
        }
      }
    };

    if (isAddingNew) {
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isAddingNew, newText, newNotes, newUrl, newTags, newCategory, newFlagged]);

  const filtered = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return tasks
      .slice()
      .sort((a, b) => {
        // Sort by order only (descending = newer at top)
        // No special sorting for flagged items - they stay in natural order
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
      .filter((t) => selectedTagFilter ? (t.tags && t.tags.includes(selectedTagFilter)) : true)
      .filter((t) => !query.trim() || t.text.toLowerCase().includes(query.toLowerCase()));
  }, [tasks, filter, query, categoryFilter, selectedTagFilter]);

  // Get all unique tags from tasks
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach(task => {
      if (task.tags && task.tags.length > 0) {
        task.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [tasks]);

  const handleDeleteTag = async (tagToDelete: string, taskId?: string) => {
    if (taskId) {
      // Remove tag from specific task only
      const task = tasks.find(t => t.id === taskId);
      if (task && task.tags) {
        const updatedTags = task.tags.filter(t => t !== tagToDelete);
        await updateTask(task.id, { tags: updatedTags.length > 0 ? updatedTags : undefined });
      }
    } else {
      // Remove tag from all tasks that have it (global tag management)
      const tasksWithTag = tasks.filter(t => t.tags && t.tags.includes(tagToDelete));
      for (const task of tasksWithTag) {
        const updatedTags = task.tags!.filter(t => t !== tagToDelete);
        await updateTask(task.id, { tags: updatedTags.length > 0 ? updatedTags : undefined });
      }
      if (selectedTagFilter === tagToDelete) {
        setSelectedTagFilter(null);
      }
    }
    setTagContextMenu(null);
  };

  const handleRenameTag = async (oldTag: string, newTag: string) => {
    if (!newTag || newTag === oldTag) return;
    
    // Add hashtag if not present
    const formattedTag = newTag.startsWith('#') ? newTag : `#${newTag}`;
    
    // Update tag in all tasks that have it
    const tasksWithTag = tasks.filter(t => t.tags && t.tags.includes(oldTag));
    for (const task of tasksWithTag) {
      const updatedTags = task.tags!.map(t => t === oldTag ? formattedTag : t);
      await updateTask(task.id, { tags: updatedTags });
    }
    setTagContextMenu(null);
    if (selectedTagFilter === oldTag) {
      setSelectedTagFilter(formattedTag);
    }
  };

  const handleAdd = async () => {
    const text = newText.trim();
    if (!text) return;
    const extras: Partial<ImprovementTask> = {};
    if (newPriority) extras.priority = newPriority;
    if (newCategory) extras.category = newCategory;
    if (newUrl.trim()) extras.url = newUrl.trim();
    if (newNotes.trim()) extras.notes = newNotes.trim();
    if (newTags.length > 0) extras.tags = newTags;
    if (newFlagged) extras.pinned = true;
    
    // Set order to current timestamp for natural insertion order at bottom
    extras.order = -Date.now();
    
    await addTask(text, extras);
    setNewText('');
    setNewPriority('');
    setNewCategory('');
    setNewUrl('');
    setNewNotes('');
    setNewTags([]);
    setShowNotesInput(false);
    setShowUrlInput(false);
    setShowTagInput(false);
    setTagInput('');
    setNewFlagged(false);
    // Keep form open and refocus
    setTimeout(() => newTaskInputRef.current?.focus(), 50);
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

            {/* Tag Filter Pills */}
            {allTags.length > 0 && (
              <div className="pt-3 border-t border-border/50">
                <div className="px-3 pb-2 text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5 px-3">
                  {allTags.map((tag) => {
                    const taskCount = tasks.filter(t => t.tags && t.tags.includes(tag)).length;
                    return (
                      <button
                        key={tag}
                    onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? null : tag)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setTagContextMenu({ tag, x: e.clientX, y: e.clientY });
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault(); // Prevent text selection
                      const timer = setTimeout(() => {
                        const touch = e.touches[0];
                        setTagContextMenu({ tag, x: touch.clientX, y: touch.clientY });
                      }, 500);
                      setLongPressTimer(timer);
                    }}
                    onTouchEnd={() => {
                      if (longPressTimer) {
                        clearTimeout(longPressTimer);
                        setLongPressTimer(null);
                      }
                    }}
                    onTouchMove={() => {
                      if (longPressTimer) {
                        clearTimeout(longPressTimer);
                        setLongPressTimer(null);
                      }
                    }}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors select-none',
                      selectedTagFilter === tag
                        ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                        : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/15'
                    )}
                  >
                        {tag} {taskCount}
                </button>
                    );
                  })}
              </div>
            </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-3 space-y-2" onDragOver={(e) => e.preventDefault()}>
            {filtered.map((task) => (
              <motion.div
                key={task.id}
                className="group px-2 py-2 rounded-md hover:bg-accent/50 transition-all"
                initial={false}
                animate={{ opacity: 1 }}
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

                    {/* Notes display */}
                    {task.notes && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {task.notes}
                      </div>
                    )}

                    {/* Tags display */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mt-1">
                        {task.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Flag icon - right side like Apple */}
                  {task.pinned && (
                    <div className="flex-shrink-0 ml-2">
                      <Flag className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                    </div>
                  )}

                  {/* Info button (hover only) - minimal icon */}
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent flex-shrink-0 mt-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedTaskId(expandedTaskId === task.id ? null : task.id);
                    }}
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
                      className="expanded-details-panel mt-2 pt-2 border-t border-border/50 space-y-2"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Notes section */}
                      <div>
                        <textarea
                          placeholder="Add Note"
                          className="w-full px-0 py-1 text-xs bg-transparent text-muted-foreground placeholder:text-muted-foreground/50 outline-none resize-none"
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

                        {/* Flag button */}
                        <button
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                            task.pinned 
                              ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' 
                              : 'bg-accent hover:bg-accent/70 text-muted-foreground'
                          }`}
                          onClick={() => togglePin(task.id)}
                        >
                          <Flag className={`w-3 h-3 ${task.pinned ? 'fill-orange-500 text-orange-500' : ''}`} />
                          {task.pinned ? 'Flagged' : 'Flag'}
                        </button>

                        {/* Tag button */}
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent hover:bg-accent/70 text-xs transition-colors"
                          onClick={() => {
                            if (editingTagsTaskId === task.id) {
                              setEditingTagsTaskId(null);
                              setNewTagForTask('');
                            } else {
                              setEditingTagsTaskId(task.id);
                            }
                          }}
                        >
                          <Hash className="w-3 h-3" />
                          Tag
                        </button>
                      </div>

                      {/* Tags display and input */}
                      {(task.tags && task.tags.length > 0) || editingTagsTaskId === task.id ? (
                        <div className="space-y-1.5">
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {task.tags.map((tag) => (
                                <button
                                  key={tag}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    setTagContextMenu({ tag, x: e.clientX, y: e.clientY, taskId: task.id });
                                  }}
                                  onTouchStart={(e) => {
                                    e.preventDefault(); // Prevent text selection
                                    const timer = setTimeout(() => {
                                      const touch = e.touches[0];
                                      setTagContextMenu({ tag, x: touch.clientX, y: touch.clientY, taskId: task.id });
                                    }, 500);
                                    setLongPressTimer(timer);
                                  }}
                                  onTouchEnd={() => {
                                    if (longPressTimer) {
                                      clearTimeout(longPressTimer);
                                      setLongPressTimer(null);
                                    }
                                  }}
                                  onTouchMove={() => {
                                    if (longPressTimer) {
                                      clearTimeout(longPressTimer);
                                      setLongPressTimer(null);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-[11px] font-medium hover:bg-purple-500/15 transition-colors select-none"
                                >
                                  {tag}
                                </button>
                              ))}
                    </div>
                          )}
                          {editingTagsTaskId === task.id && (
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                placeholder="Add tag (press Enter)"
                                value={newTagForTask}
                                onChange={(e) => {
                                  let value = e.target.value;
                                  if (value && !value.startsWith('#')) {
                                    value = '#' + value;
                                  }
                                  setNewTagForTask(value);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && newTagForTask.trim()) {
                                    const formattedTag = newTagForTask.trim().startsWith('#') 
                                      ? newTagForTask.trim() 
                                      : `#${newTagForTask.trim()}`;
                                    const currentTags = task.tags || [];
                                    if (!currentTags.includes(formattedTag)) {
                                      updateTask(task.id, { tags: [...currentTags, formattedTag] });
                                    }
                                    setNewTagForTask('');
                                  } else if (e.key === 'Escape') {
                                    setEditingTagsTaskId(null);
                                    setNewTagForTask('');
                                  }
                                }}
                                onBlur={() => {
                                  if (newTagForTask.trim()) {
                                    const formattedTag = newTagForTask.trim().startsWith('#') 
                                      ? newTagForTask.trim() 
                                      : `#${newTagForTask.trim()}`;
                                    const currentTags = task.tags || [];
                                    if (!currentTags.includes(formattedTag)) {
                                      updateTask(task.id, { tags: [...currentTags, formattedTag] });
                                    }
                                  }
                                  setNewTagForTask('');
                                  setEditingTagsTaskId(null);
                                }}
                                className="flex-1 px-2 py-1 text-xs bg-transparent text-muted-foreground placeholder:text-muted-foreground/50 outline-none"
                                autoFocus
                              />
                  </div>
                          )}
                </div>
                      ) : null}

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
            {isAddingNew && (
                <div
                  ref={newTaskFormRef}
                  className="group px-2 py-2 rounded-md hover:bg-accent/50 transition-all"
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
                          }
                        }
                        if (e.key === 'Escape') {
                          setNewText('');
                          setNewPriority('');
                          setNewCategory('');
                          setNewUrl('');
                          setNewNotes('');
                          setNewTags([]);
                          setIsAddingNew(false);
                        }
                      }}
                      />

                      {/* iOS-style toolbar */}
                      <div className="new-task-details mt-2 space-y-2">
                        {/* Toolbar icons - iOS style */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <button
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              setSchedulingTaskId('new');
                            }}
                            type="button"
                          >
                            <Calendar className="w-4 h-4" />
                        </button>

                        <button
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              setShowTagInput(!showTagInput);
                            }}
                            type="button"
                          >
                            <Tag className="w-4 h-4" />
                        </button>

                          <button
                            className={`flex items-center gap-1 transition-colors ${
                              newFlagged ? 'text-orange-500' : 'hover:text-foreground'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              setNewFlagged(!newFlagged);
                            }}
                            type="button"
                          >
                            <Flag className={`w-4 h-4 ${newFlagged ? 'fill-orange-500' : ''}`} />
                          </button>

                        <select
                            className="px-2 py-0.5 text-xs bg-transparent text-muted-foreground hover:text-foreground outline-none cursor-pointer transition-colors border-0"
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

                        {/* Tag input - appears when tag icon clicked */}
                        {showTagInput && (
                          <input
                            type="text"
                            placeholder="Add Tag"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && tagInput.trim()) {
                                e.preventDefault();
                                // Add hashtag if not present
                                const tag = tagInput.trim().startsWith('#') 
                                  ? tagInput.trim() 
                                  : `#${tagInput.trim()}`;
                                setNewTags([...newTags, tag]);
                                setTagInput('');
                                setShowTagInput(false);
                              } else if (e.key === 'Escape') {
                                setTagInput('');
                                setShowTagInput(false);
                              }
                            }}
                            className="w-full px-0 py-1 text-xs bg-transparent text-purple-600 dark:text-purple-400 placeholder:text-muted-foreground/50 outline-none"
                            autoFocus
                          />
                        )}

                        {/* Tags display */}
                        {newTags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {newTags.map((tag, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs"
                              >
                                {tag}
                        <button
                                  onClick={() => setNewTags(newTags.filter((_, idx) => idx !== i))}
                                  className="hover:text-foreground"
                                >
                                  <X className="w-3 h-3" />
                        </button>
                              </span>
                            ))}
                    </div>
                        )}

                        {/* Add Note button or input */}
                        <div>
                          {!showNotesInput && !newNotes ? (
                        <button
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowNotesInput(true);
                                setTimeout(() => {
                                  const textarea = document.querySelector('.notes-input') as HTMLTextAreaElement;
                                  textarea?.focus();
                                }, 50);
                              }}
                              type="button"
                            >
                              Add Note
                        </button>
                          ) : (
                            <textarea
                              placeholder="Note"
                              value={newNotes}
                              onChange={(e) => setNewNotes(e.target.value)}
                              className="notes-input w-full px-0 py-1 text-xs bg-transparent text-muted-foreground outline-none resize-none"
                              rows={2}
                            />
                          )}
                  </div>

                        {/* Add URL button or input */}
                        <div>
                          {!showUrlInput && !newUrl ? (
                          <button
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => {
                                e.preventDefault();
                              e.stopPropagation();
                                setShowUrlInput(true);
                                setTimeout(() => {
                                  const input = document.querySelector('.url-input') as HTMLInputElement;
                                  input?.focus();
                                }, 50);
                              }}
                              type="button"
                            >
                              Add URL
                          </button>
                          ) : (
                            <input
                              type="url"
                              placeholder="URL"
                              value={newUrl}
                              onChange={(e) => setNewUrl(e.target.value)}
                              className="url-input w-full px-0 py-1 text-xs bg-transparent text-blue-500 outline-none"
                            />
                        )}
                </div>
                  </div>
                    </div>
                  </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Add Button - iOS style */}
      {isExpanded && !isAddingNew && (
        <motion.button
          className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
          onClick={() => {
            setIsAddingNew(true);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
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

      {/* Tag Context Menu */}
      {tagContextMenu && (
        <div
          className="fixed bg-card border border-border rounded-lg shadow-xl py-1 z-[60] min-w-[160px]"
          style={{
            left: `${tagContextMenu.x}px`,
            top: `${tagContextMenu.y}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
            onClick={() => {
              const newTag = window.prompt('Rename tag:', tagContextMenu.tag);
              if (newTag) {
                handleRenameTag(tagContextMenu.tag, newTag);
              }
            }}
          >
            <span className="text-muted-foreground">✏️</span>
            Rename Tag
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2 text-red-500"
            onClick={() => {
              if (tagContextMenu.taskId) {
                // Remove from specific task
                handleDeleteTag(tagContextMenu.tag, tagContextMenu.taskId);
              } else {
                // Remove from all tasks (global)
                if (window.confirm(`Delete "${tagContextMenu.tag}" from all tasks?`)) {
                  handleDeleteTag(tagContextMenu.tag);
                }
              }
            }}
          >
            <span className="text-red-500">🗑️</span>
            {tagContextMenu.taskId ? 'Remove Tag' : 'Delete Tag Globally'}
          </button>
        </div>
      )}
    </motion.aside>
    </>
  );
};

export default TodoDrawer;


