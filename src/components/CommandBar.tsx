import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, Target, NotebookPen, Search, X, Image as ImageIcon } from 'lucide-react';
import TradeImageImport from '@/components/TradeImageImport';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useTradeLoggerModal } from '@/hooks/useTradeLoggerModal';
import { useQuickNoteModalStore } from '@/store/useQuickNoteModalStore';
import { useSessionStore } from '@/store/useSessionStore';
import { useTodoStore } from '@/store/useTodoStore';

type Command = {
  id: string;
  title: string;
  hint?: string;
  action: () => void;
  keywords?: string[];
};

export const CommandBar: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = React.useState(false);

  const { setCurrentView } = useNavigationStore();
  const tradeLogger = useTradeLoggerModal();
  const quickNoteModal = useQuickNoteModalStore();
  const { toggleDrawer: toggleTodo } = useTodoStore();
  const { isActive, startSession, endSession } = useSessionStore();

  const todayStr = React.useMemo(() => {
    const yyyy = new Date().getFullYear();
    const mm = String(new Date().getMonth() + 1).padStart(2, '0');
    const dd = String(new Date().getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        toggleTodo();
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleTodo]);

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setQuery('');
  }, [open]);

  const commands: Command[] = React.useMemo(() => [
    {
      id: 'todo:toggle',
      title: 'Toggle Tasks',
      hint: 'Show/hide improvement tasks',
      action: () => { setOpen(false); toggleTodo(); },
      keywords: ['task', 'todo', 'improvement']
    },
    {
      id: 'trade:new',
      title: 'Add Trade',
      hint: 'Open trade logger',
      action: () => { setOpen(false); tradeLogger.openForNew(); },
      keywords: ['trade', 'logger', 'add trade']
    },
    {
      id: 'trade:import-screenshot',
      title: 'Import from Screenshot',
      hint: 'Parse a trade table image',
      action: () => { setOpen(false); setImportOpen(true); },
      keywords: ['import', 'screenshot', 'image', 'ocr']
    },
    {
      id: 'note:new',
      title: 'Quick Note',
      hint: 'Open quick note',
      action: () => { setOpen(false); quickNoteModal.openModal(); },
      keywords: ['note', 'quick note']
    },
    {
      id: 'nav:journal',
      title: 'Go to Journal',
      action: () => { setOpen(false); setCurrentView('journal'); },
      keywords: ['reflection', 'journal']
    },
    {
      id: 'nav:dashboard',
      title: 'Go to Dashboard',
      action: () => { setOpen(false); setCurrentView('dashboard'); },
      keywords: ['home', 'dashboard']
    },
    {
      id: 'session:toggle',
      title: isActive ? 'End Session' : 'Start Session',
      action: () => {
        setOpen(false);
        if (isActive) endSession(); else startSession(todayStr);
      },
      keywords: ['session', 'start', 'end']
    },
  ], [isActive, todayStr, tradeLogger, quickNoteModal, setCurrentView, toggleTodo]);

  const filtered = commands.filter(c =>
    !query.trim() || c.title.toLowerCase().includes(query.toLowerCase()) || (c.keywords || []).some(k => k.includes(query.toLowerCase()))
  );

  return (
    <>
      {/* Floating + */}
      <button
        aria-label="Quick Add"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
        onClick={() => setOpen(true)}
      >
        <Plus className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="absolute inset-0 flex items-start justify-center p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className="w-full max-w-xl bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header/Search */}
                <div className="flex items-center gap-2 p-3 border-b border-border/50">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type a command… (e.g., trade, note, journal)"
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                  <button className="p-1 rounded hover:bg-muted text-muted-foreground" onClick={() => setOpen(false)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">No matching commands</div>
                  ) : (
                    filtered.map(cmd => (
                      <button
                        key={cmd.id}
                        onClick={cmd.action}
                        className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="text-sm text-foreground">{cmd.title}</div>
                        {cmd.hint && <div className="text-xs text-muted-foreground">{cmd.hint}</div>}
                      </button>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-border/50 text-xs text-muted-foreground flex items-center gap-3">
                  <span className="inline-flex items-center gap-1"><FileText className="w-3 h-3" /> Quick Note</span>
                  <span className="inline-flex items-center gap-1"><Target className="w-3 h-3" /> Add Trade</span>
                  <span className="ml-auto">Cmd/Ctrl + K</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Import modal */}
      <TradeImageImport isOpen={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
};


