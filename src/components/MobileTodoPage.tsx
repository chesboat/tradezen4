import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Calendar, 
  Tag, 
  MoreVertical, 
  X, 
  Flag,
  CalendarDays,
  ExternalLink,
  Link,
  Inbox,
  CheckSquare,
  Hash
} from 'lucide-react';
import { useTodoStore } from '@/store/useTodoStore';
import { ImprovementTask } from '@/types';
import { cn } from '@/lib/utils';
import { CalendarPicker } from './CalendarPicker';
import { checkAndAddWeeklyReviewTodo, openWeeklyReviewFromUrl, parseWeeklyReviewUrl } from '@/lib/weeklyReviewTodo';

export const MobileTodoPage: React.FC = () => {
  const { tasks, toggleDone, addTask, deleteTask, updateTask, scheduleTask, togglePin, setCategory, initialize } = useTodoStore();
  const [filter, setFilter] = useState<'today' | 'all' | 'open' | 'done' | 'snoozed'>('today');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newFlagged, setNewFlagged] = useState(false);
  const [newNotes, setNewNotes] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [schedulingTaskId, setSchedulingTaskId] = useState<string | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [tagContextMenu, setTagContextMenu] = useState<{ tag: string; x: number; y: number; taskId?: string } | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [editingTagsTaskId, setEditingTagsTaskId] = useState<string | null>(null);
  const [newTagForTask, setNewTagForTask] = useState('');
  
  const newTaskFormRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    const init = async () => {
      await initialize();
      await checkAndAddWeeklyReviewTodo();
    };
    init();
  }, [initialize]);

  // Filter tasks
  const filtered = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return tasks
      .slice()
      .sort((a, b) => ((b.order || 0) - (a.order || 0)))
      .filter((t) => {
        if (filter === 'all') return t.status === 'open';
        if (filter === 'today') {
          if (t.status !== 'open') return false;
          if (!t.scheduledFor) return true;
          const scheduledDate = new Date(t.scheduledFor as any);
          return scheduledDate < tomorrow;
        }
        if (filter === 'snoozed') {
          if (t.status !== 'open' || !t.scheduledFor) return false;
          const scheduledDate = new Date(t.scheduledFor as any);
          return scheduledDate >= tomorrow;
        }
        return t.status === filter;
      })
      .filter((t) => selectedTagFilter ? (t.tags && t.tags.includes(selectedTagFilter)) : true);
  }, [tasks, filter, selectedTagFilter]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach(task => {
      if (task.tags && task.tags.length > 0) {
        task.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [tasks]);

  // Handle add task
  const handleAdd = async () => {
    const text = newText.trim();
    if (!text) return;
    
    const extras: Partial<ImprovementTask> = {};
    if (newCategory) extras.category = newCategory;
    if (newUrl) extras.url = newUrl;
    if (newTags.length > 0) extras.tags = newTags;
    if (newNotes) extras.notes = newNotes;
    if (newFlagged) extras.pinned = true;
    extras.order = -Date.now();

    await addTask(text, extras);
    
    // Reset form but keep it open for rapid entry
    setNewText('');
    setNewCategory('');
    setNewUrl('');
    setNewTags([]);
    setNewNotes('');
    setNewFlagged(false);
    setShowTagInput(false);
  };

  // Handle tag deletion
  const handleDeleteTag = async (tagToDelete: string, taskId?: string) => {
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.tags) {
        const updatedTags = task.tags.filter(t => t !== tagToDelete);
        await updateTask(task.id, { tags: updatedTags.length > 0 ? updatedTags : undefined });
      }
    } else {
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

  // Handle tag rename
  const handleRenameTag = async (oldTag: string, newTag: string) => {
    if (!newTag || newTag === oldTag) return;
    
    const formattedTag = newTag.startsWith('#') ? newTag : `#${newTag}`;
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

  // Format URL for display
  const formatUrlForDisplay = (url: string): string => {
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
      
      if (hostname === 'youtube.com' || hostname === 'youtu.be') return 'YouTube';
      if (hostname === 'github.com') return `GitHub${path.length > 1 ? ` • ${path.split('/')[1]}` : ''}`;
      if (hostname === 'docs.google.com') return 'Google Docs';
      if (hostname === 'notion.so') return 'Notion';
      if (hostname === 'medium.com') return 'Medium';
      return hostname;
    } catch {
      return url.length > 30 ? url.substring(0, 30) + '...' : url;
    }
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setTagContextMenu(null);
    if (tagContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [tagContextMenu]);

  // Close expanded task on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (expandedTaskId && !target.closest(`[data-task-id="${expandedTaskId}"]`)) {
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

  // Close new task form on click outside
  useEffect(() => {
    const handleClickOutside = async (e: MouseEvent) => {
      if (isAddingNew && newTaskFormRef.current && !newTaskFormRef.current.contains(e.target as Node)) {
        if (newText.trim()) {
          await handleAdd();
        }
        setIsAddingNew(false);
        setNewText('');
        setNewCategory('');
        setNewUrl('');
        setNewTags([]);
        setNewNotes('');
        setNewFlagged(false);
        setShowTagInput(false);
      }
    };

    if (isAddingNew) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAddingNew, newText, newCategory, newUrl, newTags, newNotes, newFlagged]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border px-4 py-3">
        <h1 className="text-xl font-semibold text-foreground">Todo</h1>
      </div>

      {/* Smart Lists */}
      <div className="px-4 pt-4 pb-3 space-y-1">
        {[
          { 
            id: 'today', 
            label: 'Today', 
            icon: Circle,
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
            id: 'all', 
            label: 'All', 
            icon: Inbox,
            count: tasks.filter(t => t.status === 'open').length 
          },
          { 
            id: 'snoozed', 
            label: 'Scheduled', 
            icon: CalendarDays,
            count: tasks.filter(t => {
              if (t.status !== 'open' || !t.scheduledFor) return false;
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const tomorrow = new Date(today);
              tomorrow.setDate(tomorrow.getDate() + 1);
              const scheduledDate = new Date(t.scheduledFor as any);
              return scheduledDate >= tomorrow;
            }).length 
          },
          { 
            id: 'done', 
            label: 'Completed', 
            icon: CheckSquare,
            count: tasks.filter(t => t.status === 'done').length 
          },
        ].map((list) => {
          const IconComponent = list.icon;
          return (
            <button
              key={list.id}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                filter === list.id 
                  ? 'bg-accent text-foreground font-medium' 
                  : 'text-muted-foreground active:bg-accent/50'
              )}
              onClick={() => setFilter(list.id as any)}
            >
              <IconComponent className="w-4 h-4" />
              <span className="flex-1 text-left">{list.label}</span>
              {list.count > 0 && (
                <span className="text-xs">{list.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tag Filter Pills */}
      {allTags.length > 0 && (
        <div className="px-4 pb-3 border-b border-border/50">
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => {
              const taskCount = tasks.filter(t => t.tags && t.tags.includes(tag)).length;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? null : tag)}
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
                  onContextMenu={(e) => e.preventDefault()} // Prevent iOS context menu
                  className={cn(
                    'px-2 py-1 rounded-full text-[11px] font-medium transition-colors select-none',
                    selectedTagFilter === tag
                      ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                      : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 active:bg-purple-500/15'
                  )}
                >
                  {tag} {taskCount}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="px-4 pt-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((task) => (
            <motion.div
              key={task.id}
              data-task-id={task.id}
              initial={false}
              className="bg-card border border-border rounded-lg overflow-hidden"
            >
              {/* Main task row */}
              <div className="flex items-start gap-3 p-3">
                {/* Checkbox */}
                <button
                  className={cn(
                    'mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center',
                    task.status === 'done'
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground/40 active:border-primary'
                  )}
                  onClick={() => toggleDone(task.id)}
                >
                  {task.status === 'done' && (
                    <CheckCircle2 className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                  )}
                </button>

                {/* Task content */}
                <div 
                  className="flex-1 min-w-0"
                  onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                >
                  <p className={cn(
                    'text-sm leading-relaxed break-words',
                    task.status === 'done' 
                      ? 'line-through text-muted-foreground' 
                      : 'text-foreground'
                  )}>
                    {task.text}
                  </p>

                  {/* Task meta info */}
                  {(task.notes || task.tags?.length || task.url || task.scheduledFor) && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      {task.notes && (
                        <span className="truncate max-w-[200px]">{task.notes}</span>
                      )}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex gap-1">
                          {task.tags.map(tag => (
                            <span key={tag} className="text-purple-600 dark:text-purple-400">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Flag icon */}
                {task.pinned && (
                  <Flag className="w-4 h-4 text-orange-500 fill-orange-500 flex-shrink-0 mt-0.5" />
                )}
              </div>

              {/* Expanded details */}
              <AnimatePresence>
                {expandedTaskId === task.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-border/50"
                  >
                    <div className="p-3 space-y-3">
                      {/* Notes */}
                      <textarea
                        placeholder="Add Note"
                        className="w-full px-0 py-1 text-xs bg-transparent text-muted-foreground placeholder:text-muted-foreground/50 outline-none resize-none"
                        rows={2}
                        defaultValue={task.notes || ''}
                        onBlur={(e) => {
                          const notes = e.target.value.trim();
                          updateTask(task.id, { notes: notes || undefined });
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-accent text-xs"
                          onClick={() => {
                            setSchedulingTaskId(task.id);
                            setIsCalendarOpen(true);
                          }}
                        >
                          <Calendar className="w-3 h-3" />
                          {task.scheduledFor ? new Date(task.scheduledFor).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Schedule'}
                        </button>

                        <select
                          className="px-2 py-1.5 rounded-md bg-accent text-xs outline-none"
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

                        <button
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs',
                            task.pinned 
                              ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' 
                              : 'bg-accent text-muted-foreground'
                          )}
                          onClick={() => togglePin(task.id)}
                        >
                          <Flag className={cn('w-3 h-3', task.pinned && 'fill-orange-500')} />
                          {task.pinned ? 'Flagged' : 'Flag'}
                        </button>

                        <button
                          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-accent text-xs"
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
                        <div className="space-y-2">
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {task.tags.map((tag) => (
                                <button
                                  key={tag}
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
                                  onContextMenu={(e) => e.preventDefault()} // Prevent iOS context menu
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-[11px] font-medium select-none"
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>
                          )}
                          {editingTagsTaskId === task.id && (
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
                              className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded-md outline-none"
                              autoFocus
                            />
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
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* Delete button */}
                      <button
                        className="w-full px-2 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 rounded-md transition-colors"
                        onClick={() => {
                          if (window.confirm('Delete this task?')) {
                            deleteTask(task.id);
                            setExpandedTaskId(null);
                          }
                        }}
                      >
                        Delete Task
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-2">
              {filter === 'today' ? 'Nothing for today' :
               filter === 'all' ? 'No tasks' : 
               filter === 'done' ? 'No completed tasks' : 
               filter === 'snoozed' ? 'No scheduled tasks' : 'No tasks'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {filter === 'today' ? 'All caught up!' :
               filter === 'all' ? 'Tap + to add your first task' :
               filter === 'done' ? 'Complete some tasks to see them here' :
               filter === 'snoozed' ? 'No tasks are currently scheduled' :
               'Add your first task to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Inline New Task Form */}
      <AnimatePresence>
        {isAddingNew && (
          <div className="fixed inset-x-0 bottom-0 bg-background border-t border-border p-4 pb-24" ref={newTaskFormRef}>
            <div className="space-y-3">
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newText.trim()) {
                    handleAdd();
                  }
                }}
                placeholder="New Task"
                className="w-full px-0 py-2 text-base bg-transparent placeholder:text-muted-foreground/50 outline-none"
                autoFocus
              />

              {/* Quick actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-accent text-xs"
                  onClick={() => {
                    setSchedulingTaskId('new');
                    setIsCalendarOpen(true);
                  }}
                >
                  <Calendar className="w-3 h-3" />
                  Schedule
                </button>

                <select
                  className="px-2 py-1.5 rounded-md bg-accent text-xs outline-none"
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

                <button
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-xs',
                    newFlagged 
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' 
                      : 'bg-accent text-muted-foreground'
                  )}
                  onClick={() => setNewFlagged(!newFlagged)}
                >
                  <Flag className={cn('w-3 h-3', newFlagged && 'fill-orange-500')} />
                </button>

                <button
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-accent text-xs"
                  onClick={() => setShowTagInput(!showTagInput)}
                >
                  <Hash className="w-3 h-3" />
                </button>
              </div>

              {/* Tags */}
              {(newTags.length > 0 || showTagInput) && (
                <div className="space-y-2">
                  {newTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {newTags.map((tag, idx) => (
                        <button
                          key={idx}
                          onClick={() => setNewTags(newTags.filter((_, i) => i !== idx))}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-[11px] font-medium"
                        >
                          {tag}
                          <X className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                  {showTagInput && (
                    <input
                      type="text"
                      placeholder="Add tag"
                      value={tagInput}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (value && !value.startsWith('#')) {
                          value = '#' + value;
                        }
                        setTagInput(value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          const formattedTag = tagInput.trim().startsWith('#') ? tagInput.trim() : `#${tagInput.trim()}`;
                          if (!newTags.includes(formattedTag)) {
                            setNewTags([...newTags, formattedTag]);
                          }
                          setTagInput('');
                        }
                      }}
                      className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded-md outline-none"
                      autoFocus
                    />
                  )}
                </div>
              )}

              {/* Notes */}
              <textarea
                placeholder="Add Note"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="w-full px-0 py-1 text-xs bg-transparent text-muted-foreground placeholder:text-muted-foreground/50 outline-none resize-none"
                rows={2}
              />

              {/* URL */}
              <input
                type="url"
                placeholder="Add URL"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-transparent border border-border/50 rounded-md outline-none"
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Add Button */}
      <div className="fixed bottom-20 right-4 z-20">
        <motion.button
          className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center"
          onClick={() => setIsAddingNew(!isAddingNew)}
          whileTap={{ scale: 0.9 }}
        >
          {isAddingNew ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.button>
      </div>

      {/* Calendar Picker Modal */}
      <CalendarPicker
        isOpen={isCalendarOpen}
        onClose={() => {
          setIsCalendarOpen(false);
          setSchedulingTaskId(null);
        }}
        onSelectDate={async (date) => {
          if (schedulingTaskId === 'new') {
            // Just store it, will be added when task is created
            // For now, do nothing special
          } else if (schedulingTaskId) {
            await scheduleTask(schedulingTaskId, date);
          }
          setIsCalendarOpen(false);
          setSchedulingTaskId(null);
        }}
        title="Schedule Task"
      />

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
                handleDeleteTag(tagContextMenu.tag, tagContextMenu.taskId);
              } else {
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
    </div>
  );
};
