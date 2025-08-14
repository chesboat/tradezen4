import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Clock, Tag, MoreVertical, Plus, X, Pin } from 'lucide-react';
import { useTodoStore } from '@/store/useTodoStore';
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
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const [snoozeForId, setSnoozeForId] = useState<string | null>(null);

  useEffect(() => {
    initialize();
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
    await addTask(text);
    setNewText('');
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
              <select
                className="px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
              >
                <option value="all">All categories</option>
                <option value="risk">Risk</option>
                <option value="execution">Execution</option>
                <option value="journal">Journal</option>
                <option value="learning">Learning</option>
                <option value="mindset">Mindset</option>
              </select>
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
                  <button className="mt-1 p-1 rounded-full hover:bg-accent" onClick={() => toggleDone(task.id)} aria-label="toggle done">
                    {task.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                  </button>
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
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {task.dueAt && (
                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(task.dueAt).toLocaleDateString()}</span>
                      )}
                      {(task.tags && task.tags.length > 0) && (
                        <span className="inline-flex items-center gap-1"><Tag className="w-3 h-3" /> {task.tags.join(', ')}</span>
                      )}
                      <select
                        className="ml-auto px-2 py-1 rounded bg-muted text-[11px]"
                        defaultValue={task.category || ''}
                        onChange={(e) => setCategory(task.id, e.target.value || undefined)}
                        title="Category"
                      >
                        <option value="">No category</option>
                        <option value="risk">Risk</option>
                        <option value="execution">Execution</option>
                        <option value="journal">Journal</option>
                        <option value="learning">Learning</option>
                        <option value="mindset">Mindset</option>
                      </select>
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
                  <button className="mt-1 p-1 rounded-full hover:bg-accent" onClick={() => toggleDone(task.id)} aria-label="toggle done">
                    {task.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                  </button>
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
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {task.dueAt && (
                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(task.dueAt).toLocaleDateString()}</span>
                      )}
                      {(task.tags && task.tags.length > 0) && (
                        <span className="inline-flex items-center gap-1"><Tag className="w-3 h-3" /> {task.tags.join(', ')}</span>
                      )}
                      <select
                        className="ml-auto px-2 py-1 rounded bg-muted text-[11px]"
                        defaultValue={task.category || ''}
                        onChange={(e) => setCategory(task.id, e.target.value || undefined)}
                        title="Category"
                      >
                        <option value="">No category</option>
                        <option value="risk">Risk</option>
                        <option value="execution">Execution</option>
                        <option value="journal">Journal</option>
                        <option value="learning">Learning</option>
                        <option value="mindset">Mindset</option>
                      </select>
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


