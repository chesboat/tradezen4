import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Clock, Tag, MoreVertical, Plus, X, Pin, Calendar, ExternalLink, Link } from 'lucide-react';
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
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border cursor-ew-resize"
           onMouseDown={(e) => {
             // Allow resizing by dragging header area horizontally
             const startX = e.clientX;
             const startW = railWidth;
             const onMove = (ev: MouseEvent) => setRailWidth(startW + (ev.clientX - startX));
             const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
             window.addEventListener('mousemove', onMove);
             window.addEventListener('mouseup', onUp);
           }}>
        <motion.button
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors relative"
          onClick={toggleDrawer}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isExpanded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {/* Badge count for collapsed state */}
          {!isExpanded && tasks.filter(t => t.status === 'open').length > 0 && (
            <motion.div
              className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {tasks.filter(t => t.status === 'open').length}
            </motion.div>
          )}
        </motion.button>

        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div className="flex items-center gap-3" variants={contentVariants} initial="collapsed" animate="expanded" exit="collapsed">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-card-foreground">Improvement Tasks</h2>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 bg-primary rounded-full">
                <span className="text-xs font-medium text-primary-foreground">{tasks.length}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Add */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div className="p-3 border-b border-border" variants={contentVariants} initial="collapsed" animate="expanded" exit="collapsed">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <textarea
                  ref={inputRef}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Add a task to improve your trading..."
                  className="flex-1 px-3 py-2 rounded-lg bg-muted text-sm outline-none focus:ring-2 ring-primary/40 resize-none overflow-hidden min-h-[40px]"
                  rows={1}
                  onInput={(e) => {
                    // Auto-resize textarea
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAdd();
                    }
                  }}
                />
                <button className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleAdd}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {/* URL input field */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="Add URL (optional)"
                    className="w-full pl-10 pr-3 py-2 rounded-lg bg-muted text-sm outline-none focus:ring-2 ring-primary/40"
                  />
                </div>
              </div>
              {/* Priority and Category selectors for new tasks */}
              <div className="flex items-center gap-2">
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
                  className="min-w-[100px]"
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
                  className="min-w-[110px]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div className="p-3 border-b border-border" variants={contentVariants} initial="collapsed" animate="expanded" exit="collapsed">
            <div className="flex items-center gap-2 flex-wrap">
              {(['today', 'all', 'open', 'done', 'snoozed'] as const).map((f) => (
                <button
                  key={f}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                  onClick={() => setFilter(f)}
                >
                  {f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
              <CustomSelect
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value as any)}
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
                size="lg"
                className="min-w-[160px]"
              />
              <div className="ml-auto relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="px-3 py-1.5 rounded-lg bg-muted text-xs outline-none focus:ring-2 ring-primary/40"
                />
              </div>
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
                className={`p-2 rounded-xl hover:bg-accent/60 transition-colors group relative ${task.pinned ? 'border-l-2 border-primary/60' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                draggable
                onDragStartCapture={(e: React.DragEvent<HTMLDivElement>) => {
                  e.dataTransfer.setData('text/plain', task.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDropCapture={(e: React.DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  const draggedId = e.dataTransfer.getData('text/plain');
                  if (!draggedId || draggedId === task.id) return;
                  const ids = sectionOrder.slice();
                  const from = ids.indexOf(draggedId);
                  const to = ids.indexOf(task.id);
                  if (from === -1 || to === -1) return;
                  const [moved] = ids.splice(from, 1);
                  ids.splice(to, 0, moved);
                  useTodoStore.getState().reorder(ids);
                }}
              >
                <div className="flex items-start gap-3 min-h-[44px]">
                  <div className="flex items-center gap-2 mt-1">
                    <motion.button 
                      className="p-1 rounded-full hover:bg-accent relative" 
                      onClick={() => handleToggleDone(task.id)} 
                      aria-label="toggle done"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
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
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
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
                              <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                              <Circle className="w-4 h-4 text-muted-foreground" />
                            }
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                    {/* Priority indicator dot */}
                    {task.priority && (
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'med' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} title={`${task.priority} priority`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <textarea
                        className="flex-1 bg-transparent text-sm text-card-foreground outline-none min-w-0 leading-relaxed py-1 resize-none overflow-hidden"
                        defaultValue={task.text}
                        rows={1}
                        onInput={(e) => {
                          // Auto-resize textarea
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
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          className={`${task.pinned ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-100 text-muted-foreground'} transition-opacity p-1 rounded hover:bg-accent`}
                          onClick={() => togglePin(task.id)}
                          aria-label="pin"
                          title="Pin"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
                          onClick={() => setSnoozeForId((prev) => (prev === task.id ? null : task.id))}
                          aria-label="snooze"
                          title="Snooze"
                        >
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
                          onClick={() => setSchedulingTaskId(task.id)}
                          aria-label="schedule"
                          title="Schedule for date"
                        >
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
                          onClick={() => {
                            setEditingUrlId(task.id);
                            setEditingUrl(task.url || '');
                          }}
                          aria-label="edit url"
                          title="Add/Edit URL"
                        >
                          <Link className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent" onClick={() => deleteTask(task.id)} aria-label="delete" title="Delete">
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.url && (
                          <button
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 transition-colors text-[10px] font-medium"
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
                            {formatUrlForDisplay(task.url)}
                          </button>
                        )}
                        {task.dueAt && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" /> {new Date(task.dueAt).toLocaleDateString()}</span>
                        )}
                        {task.scheduledFor && (
                          <span className="inline-flex items-center gap-1 text-blue-500"><Calendar className="w-3 h-3" /> {new Date(task.scheduledFor).toLocaleDateString()}</span>
                        )}
                        {/* Colorful category tag */}
                        {task.category && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            task.category === 'risk' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                            task.category === 'analysis' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                            task.category === 'journal' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                            task.category === 'wellness' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                            task.category === 'execution' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                            task.category === 'learning' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                            task.category === 'mindset' ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' :
                            'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                          }`}>
                            {task.category}
                          </span>
                        )}
                        {(task.tags && task.tags.length > 0) && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground"><Tag className="w-3 h-3" /> {task.tags.join(', ')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Priority selector */}
                        <select
                          className="px-1.5 py-0.5 rounded text-[10px] bg-muted border border-border/30 outline-none appearance-none cursor-pointer hover:bg-accent transition-colors"
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                          defaultValue={task.priority || ''}
                          onChange={(e) => updateTask(task.id, { priority: e.target.value as 'low' | 'med' | 'high' || undefined })}
                          title="Priority"
                        >
                          <option value="">Priority</option>
                          <option value="low">Low</option>
                          <option value="med">Med</option>
                          <option value="high">High</option>
                        </select>
                        {/* Category selector */}
                        <select
                          className="px-1.5 py-0.5 rounded text-[10px] bg-muted border border-border/30 outline-none appearance-none cursor-pointer hover:bg-accent transition-colors"
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                          defaultValue={task.category || ''}
                          onChange={(e) => setCategory(task.id, e.target.value || undefined)}
                          title="Category"
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
                    </div>
                  </div>
                </div>
                {snoozeForId === task.id && (
                  <div className="absolute right-2 top-9 z-50 bg-popover text-popover-foreground border border-border rounded-lg shadow px-2 py-1 flex items-center gap-1">
                    <button className="text-xs px-2 py-1 hover:bg-accent rounded" onClick={() => { snoozeTask(task.id, 15); setSnoozeForId(null); }}>15m</button>
                    <button className="text-xs px-2 py-1 hover:bg-accent rounded" onClick={() => { snoozeTask(task.id, 60); setSnoozeForId(null); }}>1h</button>
                    <button className="text-xs px-2 py-1 hover:bg-accent rounded" onClick={() => { snoozeTask(task.id, 60 * 24); setSnoozeForId(null); }}>1d</button>
                    <button className="text-xs px-2 py-1 hover:bg-accent rounded" onClick={() => setSnoozeForId(null)}>Close</button>
                  </div>
                )}
              </motion.div>
            ))}

            {pinnedTasks.length > 0 && otherTasks.length > 0 && (
              <div className="px-1 pt-3 text-[10px] uppercase tracking-wide text-muted-foreground/80">Others</div>
            )}
            {otherTasks.map((task) => (
              <motion.div
                key={task.id}
                className="p-2 rounded-xl hover:bg-accent/60 transition-colors group relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                draggable
                onDragStartCapture={(e: React.DragEvent<HTMLDivElement>) => {
                  e.dataTransfer.setData('text/plain', task.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDropCapture={(e: React.DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  const draggedId = e.dataTransfer.getData('text/plain');
                  if (!draggedId || draggedId === task.id) return;
                  const ids = sectionOrder.slice();
                  const from = ids.indexOf(draggedId);
                  const to = ids.indexOf(task.id);
                  if (from === -1 || to === -1) return;
                  const [moved] = ids.splice(from, 1);
                  ids.splice(to, 0, moved);
                  useTodoStore.getState().reorder(ids);
                }}
              >
                <div className="flex items-start gap-3 min-h-[44px]">
                  <div className="flex items-center gap-2 mt-1">
                    <motion.button 
                      className="p-1 rounded-full hover:bg-accent relative" 
                      onClick={() => handleToggleDone(task.id)} 
                      aria-label="toggle done"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
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
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
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
                              <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                              <Circle className="w-4 h-4 text-muted-foreground" />
                            }
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                    {/* Priority indicator dot */}
                    {task.priority && (
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'med' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`} title={`${task.priority} priority`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <textarea
                        className="flex-1 bg-transparent text-sm text-card-foreground outline-none min-w-0 leading-relaxed py-1 resize-none overflow-hidden"
                        defaultValue={task.text}
                        rows={1}
                        onInput={(e) => {
                          // Auto-resize textarea
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
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          className={`${task.pinned ? 'opacity-100 text-primary' : 'opacity-0 group-hover:opacity-100 text-muted-foreground'} transition-opacity p-1 rounded hover:bg-accent`}
                          onClick={() => togglePin(task.id)}
                          aria-label="pin"
                          title="Pin"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
                          onClick={() => setSnoozeForId((prev) => (prev === task.id ? null : task.id))}
                          aria-label="snooze"
                          title="Snooze"
                        >
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
                          onClick={() => setSchedulingTaskId(task.id)}
                          aria-label="schedule"
                          title="Schedule for date"
                        >
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
                          onClick={() => {
                            setEditingUrlId(task.id);
                            setEditingUrl(task.url || '');
                          }}
                          aria-label="edit url"
                          title="Add/Edit URL"
                        >
                          <Link className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent" onClick={() => deleteTask(task.id)} aria-label="delete" title="Delete">
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.url && (
                          <button
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 transition-colors text-[10px] font-medium"
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
                            {formatUrlForDisplay(task.url)}
                          </button>
                        )}
                        {task.dueAt && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" /> {new Date(task.dueAt).toLocaleDateString()}</span>
                        )}
                        {task.scheduledFor && (
                          <span className="inline-flex items-center gap-1 text-blue-500"><Calendar className="w-3 h-3" /> {new Date(task.scheduledFor).toLocaleDateString()}</span>
                        )}
                        {/* Colorful category tag */}
                        {task.category && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            task.category === 'risk' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                            task.category === 'analysis' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                            task.category === 'journal' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                            task.category === 'wellness' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                            task.category === 'execution' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                            task.category === 'learning' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                            task.category === 'mindset' ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' :
                            'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                          }`}>
                            {task.category}
                          </span>
                        )}
                        {(task.tags && task.tags.length > 0) && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground"><Tag className="w-3 h-3" /> {task.tags.join(', ')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Priority selector */}
                        <select
                          className="px-1.5 py-0.5 rounded text-[10px] bg-muted border border-border/30 outline-none appearance-none cursor-pointer hover:bg-accent transition-colors"
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                          defaultValue={task.priority || ''}
                          onChange={(e) => updateTask(task.id, { priority: e.target.value as 'low' | 'med' | 'high' || undefined })}
                          title="Priority"
                        >
                          <option value="">Priority</option>
                          <option value="low">Low</option>
                          <option value="med">Med</option>
                          <option value="high">High</option>
                        </select>
                        {/* Category selector */}
                        <select
                          className="px-1.5 py-0.5 rounded text-[10px] bg-muted border border-border/30 outline-none appearance-none cursor-pointer hover:bg-accent transition-colors"
                          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                          defaultValue={task.category || ''}
                          onChange={(e) => setCategory(task.id, e.target.value || undefined)}
                          title="Category"
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
                    </div>
                  </div>
                </div>
                {snoozeForId === task.id && (
                  <div className="absolute right-2 top-9 z-50 bg-popover text-popover-foreground border border-border rounded-lg shadow px-2 py-1 flex items-center gap-1">
                    <button className="text-xs px-2 py-1 hover:bg-accent rounded" onClick={() => { snoozeTask(task.id, 15); setSnoozeForId(null); }}>15m</button>
                    <button className="text-xs px-2 py-1 hover:bg-accent rounded" onClick={() => { snoozeTask(task.id, 60); setSnoozeForId(null); }}>1h</button>
                    <button className="text-xs px-2 py-1 hover:bg-accent rounded" onClick={() => { snoozeTask(task.id, 60 * 24); setSnoozeForId(null); }}>1d</button>
                    <button className="text-xs px-2 py-1 hover:bg-accent rounded" onClick={() => setSnoozeForId(null)}>Close</button>
                  </div>
                )}
              </motion.div>
            ))}

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground text-sm">
                No tasks yet
              </div>
            )}
          </div>
        </div>
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


