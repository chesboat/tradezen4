import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  Trash2, 
  Edit2, 
  Plus,
  BookOpen,
  Briefcase,
  User,
  Lightbulb,
  Star,
  Clock,
  Eye,
  StickyNote,
  FileEdit,
  Calendar as CalendarIcon,
  ArrowUpRight,
  CheckSquare,
  Square,
  Save,
  Bookmark,
  X,
  Hash,
  Filter,
  Sparkles,
  Folder,
  FolderOpen,
  Settings,
  Check,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import { NoteContent } from './NoteContent';
import { SmartTagFilterBar } from './SmartTagFilterBar';
import { RichNoteEditorModal } from './RichNoteEditorModal';
import { useQuickNoteStore, useQuickNoteModal } from '@/store/useQuickNoteStore';
import { useRichNotesStore } from '@/store/useRichNotesStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useNotesFilterStore } from '@/store/useNotesFilterStore';
import { cn } from '@/lib/utils';
import { useTodoStore } from '@/store/useTodoStore';
import { RichNote, QuickNote } from '@/types';
import toast from 'react-hot-toast';

// Unified note type for display
interface UnifiedNote {
  id: string;
  type: 'quick' | 'rich';
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  accountId: string;
  
  // Quick note specific
  mood?: string;
  images?: string[];
  
  // Rich note specific
  category?: RichNote['category'];
  folder?: string;
  isFavorite?: boolean;
  wordCount?: number;
  readingTime?: number;
  lastViewedAt?: string;
}

export const NotesView: React.FC = () => {
  const { selectedAccountId } = useAccountFilterStore();
  const { selectedTagFilter } = useDailyReflectionStore();
  const notesFilters = useNotesFilterStore();
  const { addTask } = useTodoStore();

  // Quick notes
  const { notes: quickNotes, deleteNote: deleteQuickNote } = useQuickNoteStore();
  const { setEditingNote } = useQuickNoteModal();

  // Rich notes
  const { 
    notes: richNotes, 
    loadNotes: loadRichNotes, 
    deleteNote: deleteRichNote,
    createNote: createRichNote,
    selectedFolder,
    setSelectedFolder,
    getFolders,
    renameFolder,
    deleteFolder
  } = useRichNotesStore();

  // State
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [retagValue, setRetagValue] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'quick' | 'rich'>('all');
  
  // Rich note editor state
  const [isRichNoteEditorOpen, setIsRichNoteEditorOpen] = useState(false);
  const [editingRichNoteId, setEditingRichNoteId] = useState<string | undefined>();
  
  // Folder management state
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [showFolderMenu, setShowFolderMenu] = useState<string | null>(null);
  const folderNavRef = useRef<HTMLDivElement | null>(null);
  
  // Filter dropdown state
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement | null>(null);

  // Load rich notes when account changes
  useEffect(() => {
    // null selectedAccountId means All Accounts; store filters out deleted/inactive
    loadRichNotes(selectedAccountId || null);
  }, [selectedAccountId, loadRichNotes]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Close folder menu
      if (showFolderMenu && folderNavRef.current && !folderNavRef.current.contains(target)) {
        setShowFolderMenu(null);
      }
      
      // Close filter dropdown
      if (isFilterDropdownOpen && filterDropdownRef.current && !filterDropdownRef.current.contains(target)) {
        setIsFilterDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFolderMenu, isFilterDropdownOpen]);

  // Convert notes to unified format
  const unifiedNotes = useMemo((): UnifiedNote[] => {
    const quick: UnifiedNote[] = quickNotes
      .filter(n => !selectedAccountId || n.accountId === selectedAccountId)
      .map(note => ({
        id: note.id,
        type: 'quick' as const,
        title: note.content.substring(0, 50).trim() + (note.content.length > 50 ? '...' : ''),
        content: note.content,
        tags: note.tags || [],
        createdAt: (note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt) as string,
        updatedAt: (note.updatedAt instanceof Date ? note.updatedAt.toISOString() : (note.updatedAt || note.createdAt)) as string,
        accountId: note.accountId,
        mood: note.mood,
        images: note.images,
      }));

    const rich: UnifiedNote[] = richNotes.map(note => ({
      id: note.id,
      type: 'rich' as const,
      title: note.title,
      content: note.content,
      tags: note.tags,
      createdAt: (note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt) as string,
      updatedAt: (note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt) as string,
      accountId: note.accountId,
      category: note.category,
      folder: note.folder,
      isFavorite: note.isFavorite,
      wordCount: note.wordCount,
      readingTime: note.readingTime,
      lastViewedAt: note.lastViewedAt,
    }));

    return [...quick, ...rich].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [quickNotes, richNotes, selectedAccountId]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    return unifiedNotes.filter(note => {
      // Type filter
      if (filterType !== 'all' && note.type !== filterType) return false;

      // Folder filter (only applies to rich notes)
      if (selectedFolder && note.type === 'rich' && note.folder !== selectedFolder) return false;

      // Tag filter
      if (selectedTagFilter && !note.tags.includes(selectedTagFilter)) return false;

      // Search filter
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(q);
        const matchesContent = note.content.toLowerCase().includes(q);
        const matchesTags = note.tags.some(tag => tag.toLowerCase().includes(q));
        
        if (!matchesTitle && !matchesContent && !matchesTags) return false;
      }

      // Date filter
      if (startDate || endDate) {
        const d = new Date(note.createdAt);
        if (startDate) {
          const sd = new Date(startDate);
          sd.setHours(0, 0, 0, 0);
          if (d < sd) return false;
        }
        if (endDate) {
          const ed = new Date(endDate);
          ed.setHours(23, 59, 59, 999);
          if (d > ed) return false;
        }
      }

      return true;
    });
  }, [unifiedNotes, filterType, selectedTagFilter, query, startDate, endDate, selectedFolder]);

  const selectedIds = useMemo(() => Object.keys(selected).filter(id => selected[id]), [selected]);

  // Handlers
  const handleCreateRichNote = () => {
    setEditingRichNoteId(undefined);
    setIsRichNoteEditorOpen(true);
  };

  // Folder management handlers
  const handleStartEditFolder = (folderName: string) => {
    setEditingFolder(folderName);
    setEditingFolderName(folderName);
    setShowFolderMenu(null);
  };

  const handleSaveFolder = async () => {
    if (!editingFolder || !editingFolderName.trim()) return;
    
    const newName = editingFolderName.trim();
    if (newName === editingFolder) {
      setEditingFolder(null);
      return;
    }
    
    try {
      await renameFolder(editingFolder, newName);
      setEditingFolder(null);
      toast.success(`Folder renamed to "${newName}"`);
    } catch (error) {
      console.error('Failed to rename folder:', error);
      toast.error('Failed to rename folder');
    }
  };

  const handleDeleteFolder = async (folderName: string) => {
    if (!confirm(`Delete folder "${folderName}"? All notes will be moved to the root level.`)) {
      return;
    }
    
    try {
      await deleteFolder(folderName);
      setShowFolderMenu(null);
      toast.success(`Folder "${folderName}" deleted`);
    } catch (error) {
      console.error('Failed to delete folder:', error);
      toast.error('Failed to delete folder');
    }
  };

  const handleCancelEditFolder = () => {
    setEditingFolder(null);
    setEditingFolderName('');
  };

  const handleEditNote = (note: UnifiedNote) => {
    if (note.type === 'quick') {
      const quickNote = quickNotes.find(n => n.id === note.id);
      if (quickNote) setEditingNote(quickNote.id);
    } else {
      setEditingRichNoteId(note.id);
      setIsRichNoteEditorOpen(true);
    }
  };

  const handleDeleteNote = async (note: UnifiedNote) => {
    if (note.type === 'quick') {
      await deleteQuickNote(note.id);
    } else {
      await deleteRichNote(note.id);
    }
  };

  const handleConvertToRich = async (quickNote: UnifiedNote) => {
    if (!selectedAccountId || quickNote.type !== 'quick') return;

    try {
      await createRichNote({
        title: quickNote.title,
        content: `<p>${quickNote.content.replace(/\n/g, '</p><p>')}</p>`,
        contentJSON: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: quickNote.content }] }]
        },
        category: 'personal',
        tags: quickNote.tags,
        isFavorite: false,
        accountId: selectedAccountId,
      });

      // Delete the original quick note
      await deleteQuickNote(quickNote.id);
    } catch (error) {
      console.error('Failed to convert note:', error);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const bulkDelete = async () => {
    for (const id of selectedIds) {
      const note = unifiedNotes.find(n => n.id === id);
      if (note) await handleDeleteNote(note);
    }
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

  const categoryIcons: Record<string, React.ReactNode> = {
    study: <BookOpen className="w-3 h-3" />,
    trading: <Briefcase className="w-3 h-3" />,
    personal: <User className="w-3 h-3" />,
    research: <Search className="w-3 h-3" />,
    meeting: <CalendarIcon className="w-3 h-3" />,
    ideas: <Lightbulb className="w-3 h-3" />,
  };

  return (
    <div className="h-full flex flex-col">
      <SmartTagFilterBar />

      {/* Header with New Note button */}
      <div className="px-6 py-4 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Notes</h1>
            <span className="text-sm text-muted-foreground">
              ({filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'})
            </span>
          </div>

          <button
            onClick={handleCreateRichNote}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-9 pr-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="relative" ref={filterDropdownRef}>
              <button
                type="button"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className="px-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary hover:bg-accent transition-colors flex items-center gap-2 min-w-[140px]"
              >
                <span className="flex items-center gap-1.5">
                  {filterType === 'quick' && <StickyNote className="w-3 h-3" />}
                  {filterType === 'rich' && <FileEdit className="w-3 h-3" />}
                  {filterType === 'all' && <FileText className="w-3 h-3" />}
                  {filterType === 'all' ? 'All Notes' : filterType === 'quick' ? 'Quick Notes' : 'Rich Notes'}
                </span>
                <ChevronDown className={cn(
                  "w-3 h-3 text-muted-foreground transition-transform ml-auto",
                  isFilterDropdownOpen && "rotate-180"
                )} />
              </button>

              {isFilterDropdownOpen && (
                <div className="absolute z-[100] w-full min-w-max mt-1 bg-popover border border-border rounded-md shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType('all');
                      setIsFilterDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left flex items-center gap-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                      filterType === 'all' && "bg-muted"
                    )}
                  >
                    <FileText className="w-3 h-3" />
                    <span>All Notes</span>
                    {filterType === 'all' && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType('quick');
                      setIsFilterDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left flex items-center gap-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                      filterType === 'quick' && "bg-muted"
                    )}
                  >
                    <StickyNote className="w-3 h-3 text-yellow-500" />
                    <span>Quick Notes</span>
                    {filterType === 'quick' && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType('rich');
                      setIsFilterDropdownOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left flex items-center gap-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                      filterType === 'rich' && "bg-muted"
                    )}
                  >
                    <FileEdit className="w-3 h-3 text-violet-500" />
                    <span>Rich Notes</span>
                    {filterType === 'rich' && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Folder Navigation */}
            {getFolders().length > 0 && (
              <div ref={folderNavRef} className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={cn(
                    "px-2 py-1 text-xs rounded transition-colors flex items-center gap-1",
                    !selectedFolder 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileText className="w-3 h-3" />
                  All
                </button>
                {getFolders().map(folder => (
                  <div key={folder} className="relative flex items-center">
                    {editingFolder === folder ? (
                      <div className="flex items-center gap-1 bg-background rounded px-2 py-1">
                        <input
                          type="text"
                          value={editingFolderName}
                          onChange={(e) => setEditingFolderName(e.target.value)}
                          className="text-xs bg-transparent border-none outline-none w-20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveFolder();
                            if (e.key === 'Escape') handleCancelEditFolder();
                          }}
                          onBlur={handleSaveFolder}
                          autoFocus
                        />
                        <button
                          onClick={handleSaveFolder}
                          className="text-green-500 hover:text-green-600"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleCancelEditFolder}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setSelectedFolder(folder)}
                          className={cn(
                            "px-2 py-1 text-xs rounded transition-colors flex items-center gap-1 max-w-[100px] truncate",
                            selectedFolder === folder 
                              ? "bg-background text-foreground shadow-sm" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          title={folder}
                        >
                          {selectedFolder === folder ? (
                            <FolderOpen className="w-3 h-3 flex-shrink-0" />
                          ) : (
                            <Folder className="w-3 h-3 flex-shrink-0" />
                          )}
                          <span className="truncate">{folder}</span>
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={() => setShowFolderMenu(showFolderMenu === folder ? null : folder)}
                            className="ml-1 p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors"
                          >
                            <MoreHorizontal className="w-3 h-3" />
                          </button>
                          
                          {showFolderMenu === folder && (
                            <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 min-w-[120px]">
                              <button
                                onClick={() => handleStartEditFolder(folder)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2"
                              >
                                <Edit2 className="w-3 h-3" />
                                Rename
                              </button>
                              <button
                                onClick={() => handleDeleteFolder(folder)}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 text-red-500 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
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
              <Bookmark className="w-3.5 h-3.5" /> Save
            </button>
          </div>
        </div>

        {/* Saved Filters */}
        {notesFilters.saved.length > 0 && (
          <div className="pt-3 flex gap-2 flex-wrap">
            {notesFilters.saved.map(f => (
              <button
                key={f.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-xs hover:bg-muted/80"
                onClick={() => {
                  setQuery(f.query);
                  setStartDate(f.startDate || '');
                  setEndDate(f.endDate || '');
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

      {/* Notes List */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <AnimatePresence>
          {filteredNotes.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-center py-12"
            >
              <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No notes found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first note to start capturing your thoughts and ideas.
              </p>
              <button
                onClick={handleCreateRichNote}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Create your first note
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {/* Bulk Actions */}
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border">
                  <span className="text-sm text-muted-foreground">
                    {selectedIds.length} selected
                  </span>
                  <button 
                    className="px-3 py-1.5 rounded-md bg-destructive/10 text-destructive text-xs hover:bg-destructive/20 transition-colors" 
                    onClick={bulkDelete}
                  >
                    <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Delete
                  </button>
                </div>
              )}

              {/* Notes */}
              {filteredNotes.map((note) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="bg-card border rounded-xl p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    {/* Selection checkbox */}
                    <button
                      onClick={() => toggleSelect(note.id)}
                      className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {selected[note.id] ? 
                        <CheckSquare className="w-4 h-4 text-primary" /> : 
                        <Square className="w-4 h-4" />
                      }
                    </button>

                    {/* Note content */}
                    <div className="flex-1 min-w-0">
                      {/* Header with type indicator */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          {note.type === 'rich' ? (
                            <>
                              <FileEdit className="w-4 h-4 text-violet-500" />
                              <span className="text-xs font-medium text-violet-600 bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 rounded-full">
                                Rich Note
                              </span>
                              {note.category && categoryIcons[note.category] && (
                                <span className="text-muted-foreground">
                                  {categoryIcons[note.category]}
                                </span>
                              )}
                              {note.isFavorite && (
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              )}
                            </>
                          ) : (
                            <>
                              <StickyNote className="w-4 h-4 text-yellow-500" />
                              <span className="text-xs font-medium text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 px-2 py-0.5 rounded-full">
                                Quick Note
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground ml-auto">
                          <CalendarIcon className="w-3 h-3" />
                          <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                          {note.wordCount && (
                            <>
                              <span>•</span>
                              <span>{note.wordCount} words</span>
                            </>
                          )}
                          {note.readingTime && (
                            <>
                              <span>•</span>
                              <span>{note.readingTime} min read</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Title for rich notes */}
                      {note.type === 'rich' && (
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
                          {note.title}
                        </h3>
                      )}

                      {/* Content preview */}
                      <div className="mb-3">
                        {note.type === 'rich' ? (
                          <div 
                            className="text-sm text-muted-foreground line-clamp-3"
                            dangerouslySetInnerHTML={{ 
                              __html: note.content.replace(/<[^>]*>/g, '').substring(0, 200) + (note.content.length > 200 ? '...' : '')
                            }}
                          />
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            <div className="whitespace-pre-wrap line-clamp-3">
                              {note.content}
                            </div>
                            {note.mood && (
                              <div className="flex items-center gap-1 mt-2 text-xs">
                                <span className="text-muted-foreground">Mood:</span>
                                <span className="capitalize font-medium">{note.mood}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {note.tags.slice(0, 4).map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                              <Hash className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 4 && (
                            <span className="text-xs text-muted-foreground px-2 py-0.5">
                              +{note.tags.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {note.type === 'quick' && (
                        <button
                          onClick={() => handleConvertToRich(note)}
                          className="p-2 text-muted-foreground hover:text-violet-500 rounded-lg hover:bg-muted transition-colors"
                          title="Convert to Rich Note"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          const sel = window.getSelection?.()?.toString?.().trim();
                          const text = sel || note.content.replace(/<[^>]*>/g, '').trim();
                          if (text) addTask(text.slice(0, 280), { sourceReflectionId: note.id, accountId: note.accountId }).catch(()=>{});
                        }}
                        className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                        title="Add as Task"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleEditNote(note)}
                        className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteNote(note)}
                        className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted transition-colors"
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

      {/* Rich Note Editor Modal */}
      <RichNoteEditorModal
        isOpen={isRichNoteEditorOpen}
        onClose={() => {
          setIsRichNoteEditorOpen(false);
          setEditingRichNoteId(undefined);
        }}
        noteId={editingRichNoteId}
      />
    </div>
  );
};