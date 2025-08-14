import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Search, Trash2, Edit2, Calendar as CalendarIcon, Hash, Smile, CheckSquare, Square, Save, Bookmark, X } from 'lucide-react';
import { NoteContent } from './NoteContent';
import { SmartTagFilterBar } from './SmartTagFilterBar';
import { useQuickNoteStore, useQuickNoteModal } from '@/store/useQuickNoteStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useNotesFilterStore } from '@/store/useNotesFilterStore';
import { cn } from '@/lib/utils';
import { useTodoStore } from '@/store/useTodoStore';

export const NotesView: React.FC = () => {
  const { notes, deleteNote } = useQuickNoteStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { selectedTagFilter } = useDailyReflectionStore();
  const { setEditingNote, openModal } = useQuickNoteModal();
  const notesFilters = useNotesFilterStore();

  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [retagValue, setRetagValue] = useState('');

  const filtered = useMemo(() => {
    return notes
      .filter(n => !selectedAccountId || n.accountId === selectedAccountId)
      .filter(n => !selectedTagFilter || (n.tags || []).includes(selectedTagFilter))
      .filter(n => {
        if (!query.trim()) return true;
        const q = query.toLowerCase();
        const inContent = n.content.toLowerCase().includes(q);
        const inTags = (n.tags || []).some(t => t.toLowerCase().includes(q));
        return inContent || inTags;
      })
      .filter(n => {
        if (!startDate && !endDate) return true;
        const d = new Date(n.createdAt);
        if (startDate) {
          const sd = new Date(startDate);
          sd.setHours(0,0,0,0);
          if (d < sd) return false;
        }
        if (endDate) {
          const ed = new Date(endDate);
          ed.setHours(23,59,59,999);
          if (d > ed) return false;
        }
        return true;
      });
  }, [notes, selectedAccountId, selectedTagFilter, query, startDate, endDate]);

  const handleEdit = (id: string) => {
    setEditingNote(id);
    openModal();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote(id);
    } catch (e) {
      console.error('Failed to delete note', e);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedIds = useMemo(() => Object.keys(selected).filter(id => selected[id]), [selected]);

  const bulkDelete = async () => {
    for (const id of selectedIds) {
      try { await deleteNote(id); } catch (e) { console.error(e); }
    }
    setSelected({});
  };

  const { updateNote } = useQuickNoteStore.getState();
  const { addTask } = useTodoStore();
  const bulkRetagAdd = async () => {
    const tag = retagValue.trim().toLowerCase();
    if (!tag) return;
    for (const id of selectedIds) {
      const n = notes.find(x => x.id === id);
      if (!n) continue;
      const nextTags = Array.from(new Set([...(n.tags || []), tag]));
      await updateNote(id, { tags: nextTags });
    }
    setRetagValue('');
    setSelected({});
  };

  const saveCurrentAsFilter = () => {
    notesFilters.addFilter({
      name: query ? query : (selectedTagFilter || 'Filter'),
      query,
      tag: selectedTagFilter || null,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  return (
    <div className="h-full flex flex-col">
      <SmartTagFilterBar />

      {/* Controls */}
      <div className="px-6 py-4 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes or tags..."
              className="w-full pl-9 pr-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">From</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-muted rounded-md text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-muted rounded-md text-sm"
              />
            </div>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-xs"
              onClick={saveCurrentAsFilter}
              title="Save current filters"
            >
              <Bookmark className="w-3.5 h-3.5" /> Save filter
            </button>
          </div>
        </div>
        {/* Saved Filters Row */}
        {notesFilters.saved.length > 0 && (
          <div className="px-6 pt-2 pb-3 flex gap-2 flex-wrap">
            {notesFilters.saved.map(f => (
              <button
                key={f.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs hover:bg-muted/80"
                onClick={() => {
                  setQuery(f.query);
                  setStartDate(f.startDate || '');
                  setEndDate(f.endDate || '');
                  // tag is handled by SmartTagFilterBar via store
                  // If needed, could set selectedTagFilter via store action
                }}
              >
                <Hash className="w-3 h-3" /> {f.name}
                <X className="w-3 h-3 opacity-70 hover:opacity-100"
                   onClick={(e) => { e.stopPropagation(); notesFilters.removeFilter(f.id); }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
          <FileText className="w-4 h-4" />
          <span>{filtered.length} note{filtered.length !== 1 ? 's' : ''}</span>
          {selectedIds.length > 0 && (
            <span className="ml-2">• {selectedIds.length} selected</span>
          )}
        </div>

        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted-foreground">
              No notes match your filters.
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {/* Bulk toolbar when selection exists */}
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 border">
                  <input
                    value={retagValue}
                    onChange={(e) => setRetagValue(e.target.value)}
                    placeholder="Add tag to selected..."
                    className="px-2 py-1 bg-card rounded-md text-sm border"
                  />
                  <button className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs" onClick={bulkRetagAdd}>
                    <Save className="w-3.5 h-3.5 inline mr-1" /> Apply Tag
                  </button>
                  <button className="px-3 py-1.5 rounded-md bg-destructive/10 text-destructive text-xs" onClick={bulkDelete}>
                    <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Delete
                  </button>
                </div>
              )}
              {filtered.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-card border border-border/60 rounded-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <button
                        className="mr-2 p-1 rounded hover:bg-muted/60 align-middle"
                        onClick={() => toggleSelect(note.id)}
                        title={selected[note.id] ? 'Unselect' : 'Select'}
                      >
                        {selected[note.id] ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                        {note.mood && (
                          <span className="inline-flex items-center gap-1">
                            <Smile className="w-3.5 h-3.5" />
                            <span className="capitalize">{note.mood}</span>
                          </span>
                        )}
                      </div>
                      <NoteContent content={note.content} />
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {note.tags.map((t) => (
                            <span key={t} className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground')}>
                              <Hash className="w-3 h-3" />
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const sel = window.getSelection?.()?.toString?.().trim();
                          const text = sel || note.content.trim();
                          if (text) addTask(text.slice(0, 280), { sourceReflectionId: note.id, accountId: note.accountId }).catch(()=>{});
                        }}
                        title="Add as Task"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                        onClick={() => handleEdit(note.id)}
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground"
                        onClick={() => handleDelete(note.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};


