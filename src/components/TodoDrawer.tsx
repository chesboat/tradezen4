import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Clock, Tag, MoreVertical, Plus, X, Pin } from 'lucide-react';
import { useTodoStore, initializeSampleTasks } from '@/store/useTodoStore';
import { ImprovementTask } from '@/types';
import { useActivityLogStore } from '@/store/useActivityLogStore';

interface TodoDrawerProps {
  className?: string;
  forcedWidth?: number;
}

const sidebarVariants = {
  expanded: { width: 360, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  collapsed: { width: 60, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
};

const contentVariants = {
  expanded: { opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.1, ease: 'easeOut' } },
  collapsed: { opacity: 0, x: 20, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const TodoDrawer: React.FC<TodoDrawerProps> = ({ className, forcedWidth }) => {
  const { isExpanded, tasks, toggleDrawer, addTask, toggleDone, deleteTask, updateTask, initialize, togglePin, setCategory, railWidth, setRailWidth } = useTodoStore();
  const { isExpanded: activityExpanded } = useActivityLogStore();
  const { snoozeTask } = useTodoStore.getState();
  const [filter, setFilter] = useState<'all' | 'open' | 'done' | 'snoozed'>('all');
  const [query, setQuery] = useState('');
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'med' | 'high' | ''>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const [snoozeForId, setSnoozeForId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await initialize();
      await initializeSampleTasks();
    };
    init();
  }, [initialize]);

  useEffect(() => {
    if (isExpanded) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isExpanded]);

  const filtered = useMemo(() => {
    return tasks
      .slice()
      .sort((a, b) => (Number(!!b.pinned) - Number(!!a.pinned)) || ((b.order || 0) - (a.order || 0)))
      .filter((t) => (filter === 'all' ? true : t.status === filter))
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
    await addTask(text, extras);
    setNewText('');
    setNewPriority('');
    setNewCategory('');
  };

  const rightOffset = Math.max(60, (activityExpanded ? 320 : 60));
  const clampedWidth = Math.max(220, Math.min(420, isExpanded ? (forcedWidth ?? railWidth) : 60));

  return (
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
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
          onClick={toggleDrawer}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isExpanded ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
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
                <input
                  ref={inputRef}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Add a task to improve your trading..."
                  className="flex-1 px-3 py-2 rounded-lg bg-muted text-sm outline-none focus:ring-2 ring-primary/40"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                />
                <button className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleAdd}>
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {/* Priority and Category selectors for new tasks */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as 'low' | 'med' | 'high' | '')}
                    className="px-2 py-1 pr-6 rounded text-xs bg-muted border border-border/50 outline-none appearance-none cursor-pointer hover:bg-accent transition-colors w-full"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    <option value="">Priority</option>
                    <option value="high">🔴 High</option>
                    <option value="med">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="px-2 py-1 pr-6 rounded text-xs bg-muted border border-border/50 outline-none appearance-none cursor-pointer hover:bg-accent transition-colors w-full"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                  >
                    <option value="">Category</option>
                    <option value="risk">🔴 Risk</option>
                    <option value="analysis">🔵 Analysis</option>
                    <option value="journal">🟢 Journal</option>
                    <option value="wellness">🟣 Wellness</option>
                    <option value="execution">🟠 Execution</option>
                    <option value="learning">🔷 Learning</option>
                    <option value="mindset">🩷 Mindset</option>
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
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
              {(['all', 'open', 'done', 'snoozed'] as const).map((f) => (
                <button
                  key={f}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                  onClick={() => setFilter(f)}
                >
                  {f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
              <div className="relative">
                <select
                  className="px-3 py-1.5 pr-8 rounded-lg bg-muted border border-border/50 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground appearance-none cursor-pointer transition-colors w-full"
                  style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                >
                  <option value="all">All categories</option>
                  <option value="risk">🔴 Risk</option>
                  <option value="analysis">🔵 Analysis</option>
                  <option value="execution">🟠 Execution</option>
                  <option value="journal">🟢 Journal</option>
                  <option value="learning">🔷 Learning</option>
                  <option value="wellness">🟣 Wellness</option>
                  <option value="mindset">🩷 Mindset</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
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
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 mt-1">
                    <button className="p-1 rounded-full hover:bg-accent" onClick={() => toggleDone(task.id)} aria-label="toggle done">
                      {task.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                    </button>
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
                    <div className="flex items-start justify-between">
                      <input
                        className="w-full bg-transparent text-sm text-card-foreground outline-none"
                        defaultValue={task.text}
                        onBlur={(e) => {
                          const text = e.target.value.trim();
                          if (text && text !== task.text) updateTask(task.id, { text });
                          else e.target.value = task.text;
                        }}
                      />
                      <div className="flex items-center gap-1">
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
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent" onClick={() => deleteTask(task.id)} aria-label="delete" title="Delete">
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <div className="flex items-center gap-2">
                        {task.dueAt && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" /> {new Date(task.dueAt).toLocaleDateString()}</span>
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
                      <div className="flex items-center gap-1">
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
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 mt-1">
                    <button className="p-1 rounded-full hover:bg-accent" onClick={() => toggleDone(task.id)} aria-label="toggle done">
                      {task.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                    </button>
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
                    <div className="flex items-start justify-between">
                      <input
                        className="w-full bg-transparent text-sm text-card-foreground outline-none"
                        defaultValue={task.text}
                        onBlur={(e) => {
                          const text = e.target.value.trim();
                          if (text && text !== task.text) updateTask(task.id, { text });
                          else e.target.value = task.text;
                        }}
                      />
                      <div className="flex items-center gap-1">
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
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent" onClick={() => deleteTask(task.id)} aria-label="delete" title="Delete">
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <div className="flex items-center gap-2">
                        {task.dueAt && (
                          <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="w-3 h-3" /> {new Date(task.dueAt).toLocaleDateString()}</span>
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
                      <div className="flex items-center gap-1">
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
    </motion.aside>
  );
};

export default TodoDrawer;


