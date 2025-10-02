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
  Hash,
  Camera,
  MapPin
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
  const newTaskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initialize();
    checkAndAddWeeklyReviewTodo();
  }, [initialize]);

  // Filter tasks
  const filtered = useMemo(() => {
    let result = tasks;

    // Apply status filter
    if (filter === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
      result = tasks.filter(t => {
          if (t.status !== 'open') return false;
        if (!t.scheduledFor) return true;
          const scheduledDate = new Date(t.scheduledFor as any);
        return scheduledDate < tomorrow;
      });
    } else if (filter === 'all') {
      result = tasks.filter(t => t.status === 'open');
    } else if (filter === 'done') {
      result = tasks.filter(t => t.status === 'done');
    } else if (filter === 'snoozed') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
      result = tasks.filter(t => {
        if (t.status !== 'open' || !t.scheduledFor) return false;
      const scheduledDate = new Date(t.scheduledFor as any);
        return scheduledDate >= tomorrow;
      });
    }

    // Apply tag filter
    if (selectedTagFilter) {
      result = result.filter(t => t.tags && t.tags.includes(selectedTagFilter));
    }

    // Sort: pinned first, then by creation date
    return result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks, filter, selectedTagFilter]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    tasks.forEach(task => {
      if (task.tags) {
        task.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [tasks]);

  const handleAdd = () => {
    if (!newText.trim()) return;

    addTask(newText.trim(), {
        category: newCategory || undefined,
      url: newUrl || undefined,
      tags: newTags.length > 0 ? newTags : undefined,
      notes: newNotes || undefined,
      pinned: newFlagged,
      });

    // Reset form
    setNewText('');
      setNewCategory('');
      setNewUrl('');
    setNewTags([]);
    setNewNotes('');
    setNewFlagged(false);
    setShowTagInput(false);
    setIsAddingNew(false);
  };

  const formatUrlForDisplay = (url: string) => {
    try {
      const u = new URL(url);
      return u.hostname.replace('www.', '');
    } catch {
      return url.length > 20 ? url.substring(0, 20) + '...' : url;
    }
  };

  const handleRenameTag = (oldTag: string, newTag: string, taskId?: string) => {
    if (!newTag.trim() || newTag === oldTag) return;

    const formattedNewTag = newTag.startsWith('#') ? newTag : `#${newTag}`;

    if (taskId) {
      // Rename tag for a specific task
      const task = tasks.find(t => t.id === taskId);
      if (task && task.tags) {
        const updatedTags = task.tags.map(t => t === oldTag ? formattedNewTag : t);
        updateTask(taskId, { tags: updatedTags });
      }
    } else {
      // Rename tag globally
      tasks.forEach(task => {
        if (task.tags && task.tags.includes(oldTag)) {
          const updatedTags = task.tags.map(t => t === oldTag ? formattedNewTag : t);
          updateTask(task.id, { tags: updatedTags });
        }
      });
    }
  };

  const handleDeleteTag = (tag: string, taskId?: string) => {
    if (taskId) {
      // Delete tag from a specific task
      const task = tasks.find(t => t.id === taskId);
      if (task && task.tags) {
        const updatedTags = task.tags.filter(t => t !== tag);
        updateTask(taskId, { tags: updatedTags.length > 0 ? updatedTags : undefined });
      }
    } else {
      // Delete tag globally
      tasks.forEach(task => {
        if (task.tags && task.tags.includes(tag)) {
          const updatedTags = task.tags.filter(t => t !== tag);
          updateTask(task.id, { tags: updatedTags.length > 0 ? updatedTags : undefined });
        }
      });
    }
  };

  // Close new task form if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isAddingNew && newTaskFormRef.current && !newTaskFormRef.current.contains(event.target as Node)) {
        if (newText.trim()) {
          handleAdd();
        } else {
          setIsAddingNew(false);
        }
      }
    };

    if (isAddingNew) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAddingNew, newText, newCategory, newUrl, newTags, newNotes, newFlagged]);

  // Auto-focus input when adding new task
  useEffect(() => {
    if (isAddingNew && newTaskInputRef.current) {
      newTaskInputRef.current.focus();
    }
  }, [isAddingNew]);

  return (
    <div className="min-h-screen bg-background pb-32">
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
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                filter === list.id
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-foreground hover:bg-accent/50'
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
                    e.preventDefault();
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
                  onContextMenu={(e) => e.preventDefault()}
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

      {/* Tasks List - Apple Reminders Style */}
      <div className="divide-y divide-border">
        <AnimatePresence mode="popLayout">
          {filtered.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="relative overflow-hidden"
            >
              {/* Swipe action backgrounds */}
              <div className="absolute inset-0 flex items-center justify-between px-6">
                <div className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2 text-red-500">
                  <X className="w-5 h-5" />
                </div>
              </div>

              {/* Swipeable task */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, info) => {
                  const threshold = 100;
                  if (info.offset.x > threshold) {
                    toggleDone(task.id);
                  } else if (info.offset.x < -threshold) {
                    if (window.confirm('Delete this task?')) {
                      deleteTask(task.id);
                    }
                  }
                }}
                className="bg-background relative z-10"
              >
                {/* Task row - full width, no card */}
                <div 
                  className="flex items-center gap-3 px-4 py-3 active:bg-muted/30 transition-colors"
                  onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                >
                  {/* Circular checkbox */}
                  <button
                  className={cn(
                      'flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center',
                    task.status === 'done'
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/40 active:border-primary active:scale-110'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDone(task.id);
                    }}
                >
                  {task.status === 'done' && (
                      <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                    )}
                  </button>

                  {/* Task content */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-[15px] leading-snug',
                      task.status === 'done' 
                        ? 'line-through text-muted-foreground' 
                        : 'text-foreground'
                    )}>
                      {task.text}
                    </p>

                    {/* Metadata - compact */}
                    {(task.notes || task.tags?.length || task.url) && (
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                    {task.url && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (parseWeeklyReviewUrl(task.url!)) {
                            openWeeklyReviewFromUrl(task.url!);
                          } else {
                            window.open(task.url!, '_blank', 'noopener,noreferrer');
                          }
                        }}
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400"
                      >
                        <ExternalLink className="w-3 h-3" />
                            <span>{formatUrlForDisplay(task.url)}</span>
                      </button>
                    )}
                        {task.notes && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                            {task.notes}
                        </span>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex gap-1">
                            {task.tags.map(tag => (
                              <span key={tag} className="text-[11px] text-purple-600 dark:text-purple-400">
                                {tag}
                              </span>
                            ))}
                      </div>
                    )}
                      </div>
                    )}
                  </div>

                  {/* Flag icon */}
                  {task.pinned && (
                    <Flag className="w-4 h-4 text-orange-500 fill-orange-500 flex-shrink-0" />
                  )}

                  {/* Info indicator */}
                  {expandedTaskId === task.id && (
                    <div className="w-1 h-1 bg-primary rounded-full flex-shrink-0" />
                  )}
                </div>

                {/* Expanded details */}
                  <AnimatePresence>
                  {expandedTaskId === task.id && (
                      <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/50 bg-muted/20"
                    >
                      <div className="px-4 py-3 space-y-3">
                        {/* Notes */}
                        <textarea
                          placeholder="Notes"
                          className="w-full px-0 py-1 text-sm bg-transparent text-foreground placeholder:text-muted-foreground/50 outline-none resize-none"
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-xs"
                            onClick={() => {
                              setSchedulingTaskId(task.id);
                              setIsCalendarOpen(true);
                            }}
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {task.scheduledFor 
                                ? new Date(task.scheduledFor as any).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                : 'Date'}
                            </span>
                          </button>

                          <button
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs',
                              task.pinned
                                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                                : 'bg-accent text-muted-foreground'
                            )}
                            onClick={() => togglePin(task.id)}
                          >
                            <Flag className={cn('w-3.5 h-3.5', task.pinned && 'fill-orange-500')} />
                            <span>Flag</span>
                          </button>

                          <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-xs"
                            onClick={() => setEditingTagsTaskId(task.id)}
                          >
                            <Hash className="w-3.5 h-3.5" />
                            <span>Tags</span>
                          </button>
                        </div>

                        {/* Tag editing */}
                        {editingTagsTaskId === task.id && (
                          <div className="space-y-2">
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {task.tags.map((tag) => (
                          <button
                                    key={tag}
                                    onClick={() => {
                                      const updatedTags = task.tags!.filter(t => t !== tag);
                                      updateTask(task.id, { tags: updatedTags.length > 0 ? updatedTags : undefined });
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-[11px] font-medium"
                                  >
                                    {tag}
                                    <X className="w-3 h-3" />
                          </button>
                                ))}
                              </div>
                            )}
                            <input
                              type="text"
                              placeholder="Add tag"
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
                          </div>
                        )}

                        {/* URL */}
                        <input
                          type="url"
                          placeholder="URL"
                          className="w-full px-2 py-1.5 text-xs bg-transparent border border-border/50 rounded-md outline-none"
                          defaultValue={task.url || ''}
                          onBlur={(e) => {
                            const url = e.target.value.trim();
                            updateTask(task.id, { url: url || undefined });
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />

                        {/* Delete */}
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
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* New Task Row - Inline at bottom (Apple Reminders style) */}
        {isAddingNew && (
          <div 
            ref={newTaskFormRef}
            className="border-t border-border bg-background"
          >
            {/* Main input row */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-muted-foreground/40" />
              <input
                ref={newTaskInputRef}
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newText.trim()) {
                    handleAdd();
                  } else if (e.key === 'Escape') {
                    setIsAddingNew(false);
                    setNewText('');
                  }
                }}
                placeholder="New Reminder"
                className="flex-1 text-[15px] bg-transparent placeholder:text-muted-foreground/50 outline-none"
              />
              {newFlagged && (
                <Flag className="w-4 h-4 text-orange-500 fill-orange-500 flex-shrink-0" />
              )}
            </div>

            {/* Notes */}
            {newNotes && (
              <div className="px-4 pb-2">
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Notes"
                  className="w-full px-0 py-1 text-sm bg-transparent text-muted-foreground placeholder:text-muted-foreground/50 outline-none resize-none"
                  rows={2}
                />
              </div>
            )}

            {/* Tags */}
            {newTags.length > 0 && (
              <div className="px-4 pb-2">
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
              </div>
            )}

            {/* URL */}
            {newUrl && (
              <div className="px-4 pb-2">
                <div className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400">
                  <ExternalLink className="w-3 h-3" />
                  <span>{formatUrlForDisplay(newUrl)}</span>
                </div>
              </div>
            )}

            {/* Bottom Toolbar - Apple Reminders Style */}
            <div className="flex items-center gap-1 px-2 py-2 border-t border-border/30">
              <button
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                onClick={() => {
                  setSchedulingTaskId('new');
                  setIsCalendarOpen(true);
                }}
                title="Date"
              >
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                onClick={() => setShowTagInput(true)}
                title="Tags"
              >
                <Hash className="w-5 h-5 text-muted-foreground" />
              </button>

              <button
                className={cn(
                  'p-2 hover:bg-accent rounded-lg transition-colors',
                  newFlagged && 'bg-orange-500/10'
                )}
                onClick={() => setNewFlagged(!newFlagged)}
                title="Flag"
              >
                <Flag className={cn(
                  'w-5 h-5',
                  newFlagged ? 'text-orange-500 fill-orange-500' : 'text-muted-foreground'
                )} />
              </button>

              <button
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                onClick={() => {
                  const url = prompt('Enter URL:');
                  if (url) setNewUrl(url);
                }}
                title="URL"
              >
                <Link className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="flex-1" />

              {/* Done button */}
              {newText.trim() && (
                <button
                  className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                  onClick={handleAdd}
                >
                  Add
                </button>
              )}
            </div>

            {/* Tag input (if showing) */}
            {showTagInput && (
              <div className="px-4 pb-3">
                <input
                  type="text"
                  placeholder="Tag name"
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
                      setShowTagInput(false);
                    } else if (e.key === 'Escape') {
                      setShowTagInput(false);
                      setTagInput('');
                    }
                  }}
                  onBlur={() => {
                    if (tagInput.trim()) {
                      const formattedTag = tagInput.trim().startsWith('#') ? tagInput.trim() : `#${tagInput.trim()}`;
                      if (!newTags.includes(formattedTag)) {
                        setNewTags([...newTags, formattedTag]);
                      }
                    }
                    setTagInput('');
                    setShowTagInput(false);
                  }}
                  className="w-full px-2 py-1.5 text-xs bg-background border border-border rounded-md outline-none"
                  autoFocus
                />
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {filtered.length === 0 && !isAddingNew && (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-base font-medium text-foreground mb-2">
              {filter === 'today' ? 'No Reminders' :
               filter === 'all' ? 'No Reminders' : 
               filter === 'done' ? 'No Completed' : 
               filter === 'snoozed' ? 'No Scheduled' : 'No Reminders'}
            </h3>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      {!isAddingNew && (
        <button
          className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-20"
          onClick={() => setIsAddingNew(true)}
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Calendar Picker Modal */}
      <CalendarPicker
        isOpen={isCalendarOpen}
        onClose={() => {
          setIsCalendarOpen(false);
          setSchedulingTaskId(null);
        }}
        onSelectDate={(date) => {
          if (schedulingTaskId === 'new') {
            // For new task, we'll apply it when adding
            // (Not implemented in this simplified version)
          } else if (schedulingTaskId) {
            scheduleTask(schedulingTaskId, date);
          }
          setIsCalendarOpen(false);
          setSchedulingTaskId(null);
        }}
      />

      {/* Tag Context Menu */}
      <AnimatePresence>
        {tagContextMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setTagContextMenu(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden min-w-[150px]"
              style={{
                left: Math.min(tagContextMenu.x, window.innerWidth - 160),
                top: Math.min(tagContextMenu.y, window.innerHeight - 100),
              }}
            >
                  <button
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
                    onClick={() => {
                  const newTag = prompt('Rename tag:', tagContextMenu.tag);
                  if (newTag) {
                    handleRenameTag(tagContextMenu.tag, newTag, tagContextMenu.taskId);
                  }
                  setTagContextMenu(null);
                }}
              >
                Rename
                  </button>
                  <button
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                    onClick={() => {
                  if (confirm(`Delete tag "${tagContextMenu.tag}"?`)) {
                    handleDeleteTag(tagContextMenu.tag, tagContextMenu.taskId);
                  }
                  setTagContextMenu(null);
                }}
              >
                Delete
                </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
