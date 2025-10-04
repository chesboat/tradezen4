import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  ChevronDown,
  MoreVertical,
  Pin,
  Archive,
  Inbox,
  ChevronLeft,
  Image as ImageIcon
} from 'lucide-react';
import { NoteContent } from './NoteContent';
import { SmartTagFilterBar } from './SmartTagFilterBar';
import { RichNoteEditorModal } from './RichNoteEditorModal';
import { InlineNoteEditor } from './InlineNoteEditor';
import { QuickNoteInlineEditor } from './QuickNoteInlineEditor';
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
  accountId?: string; // Optional: notes can be journal-wide
  
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

// Helper function to clean preview text (Apple-style: hide markdown/markup)
function cleanPreviewText(content: string): { text: string; hasImages: boolean } {
  let cleaned = content;
  
  // Strip markdown image syntax: ![alt](url) or ![image](url)
  const imageMatches = cleaned.match(/!\[.*?\]\(.*?\)/g);
  const hasImages = !!imageMatches && imageMatches.length > 0;
  cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, '');
  
  // Strip HTML tags (for rich notes)
  cleaned = cleaned.replace(/<[^>]*>/g, '');
  
  // Strip extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return { text: cleaned.substring(0, 100), hasImages };
}

export const NotesView: React.FC = () => {
  const { selectedAccountId } = useAccountFilterStore();
  const { selectedTagFilter, selectedTagFilters, toggleTagFilter, clearTagFilters } = useDailyReflectionStore();
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
  
  // Apple-style 3-column layout state
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [smartFolder, setSmartFolder] = useState<'all' | 'recent' | 'favorites' | 'untagged' | 'quick'>('all');
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  
  // Mobile view state (Apple-style navigation)
  const [mobileView, setMobileView] = useState<'folders' | 'list' | 'content'>('list');
  
  // Long-press selection (Apple-style)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  
  // Menu states
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showFolderMenu, setShowFolderMenu] = useState<string | null>(null);
  
  // Folder management state
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const folderNavRef = useRef<HTMLDivElement | null>(null);
  
  // Tags section collapse state (Apple-style)
  const [isTagsSectionCollapsed, setIsTagsSectionCollapsed] = useState(true);
  
  // Context menu state (Apple-style right-click)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; noteId: string } | null>(null);
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);

  // Long-press handlers (Apple-style)
  const handleLongPressStart = useCallback((noteId: string) => {
    const timer = setTimeout(() => {
      setSelectionMode(true);
      setSelectedNotes(new Set([noteId]));
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
    setLongPressTimer(timer);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);
  
  // Handle right-click context menu
  const handleContextMenu = useCallback((e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      noteId,
    });
  }, []);
  
  // Close context menu
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const handleNoteClick = useCallback((noteId: string) => {
    if (selectionMode) {
      setSelectedNotes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(noteId)) {
          newSet.delete(noteId);
        } else {
          newSet.add(noteId);
        }
        if (newSet.size === 0) {
          setSelectionMode(false);
        }
        return newSet;
      });
    } else {
      setSelectedNoteId(noteId);
      setIsEditingNote(false);
      // On mobile, navigate to content view
      setMobileView('content');
    }
  }, [selectionMode]);

  const handleNoteDoubleClick = useCallback((noteId: string) => {
    if (!selectionMode) {
      setSelectedNoteId(noteId);
      setIsEditingNote(true);
    }
  }, [selectionMode]);

  // Load rich notes when account changes
  useEffect(() => {
    // null selectedAccountId means All Accounts; store filters out deleted/inactive
    loadRichNotes(selectedAccountId || null);
  }, [selectedAccountId, loadRichNotes]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Close folder menu
      if (showFolderMenu && folderNavRef.current && !folderNavRef.current.contains(target)) {
        setShowFolderMenu(null);
      }
      
      // Close action menu
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFolderMenu, openMenuId]);

  // Convert notes to unified format
  const unifiedNotes = useMemo((): UnifiedNote[] => {
    const quick: UnifiedNote[] = quickNotes
      .filter(n => !selectedAccountId || n.accountId === selectedAccountId)
      .map(note => {
        // Clean content first, then extract title (Apple-style: no markdown in previews)
        const cleaned = cleanPreviewText(note.content).text;
        return {
          id: note.id,
          type: 'quick' as const,
          title: cleaned.substring(0, 50).trim() + (cleaned.length > 50 ? '...' : ''),
          content: note.content,
          tags: note.tags || [],
          createdAt: (note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt) as string,
          updatedAt: (note.updatedAt instanceof Date ? note.updatedAt.toISOString() : (note.updatedAt || note.createdAt)) as string,
          accountId: note.accountId,
          mood: note.mood,
          images: note.images,
        };
      });

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

  // Filter notes (with Smart Folders - Apple style)
  const filteredNotes = useMemo(() => {
    let filtered = unifiedNotes.filter(note => {
      // Type filter
      if (filterType !== 'all' && note.type !== filterType) return false;

      // Smart Folder filter
      if (smartFolder === 'recent') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (new Date(note.updatedAt) < sevenDaysAgo) return false;
      } else if (smartFolder === 'favorites') {
        if (!note.isFavorite) return false;
      } else if (smartFolder === 'untagged') {
        if (note.tags.length > 0) return false;
      } else if (smartFolder === 'quick') {
        if (note.type !== 'quick') return false;
      }

      // Folder filter (only applies to rich notes when not in smart folder mode)
      if (selectedFolderName && note.type === 'rich' && note.folder !== selectedFolderName) return false;

      // Tag filter (multi-select support - Apple Notes style)
      if (selectedTagFilters.length > 0) {
        // Note must have ALL selected tags (AND logic)
        const hasAllTags = selectedTagFilters.every(tag => note.tags.includes(tag));
        if (!hasAllTags) return false;
      }
      
      // Legacy single tag filter (for compatibility)
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

    return filtered;
  }, [unifiedNotes, filterType, selectedTagFilter, selectedTagFilters, query, startDate, endDate, selectedFolderName, smartFolder]);

  const selectedIds = useMemo(() => Object.keys(selected).filter(id => selected[id]), [selected]);

  // Get all tags with their counts from unified notes (Apple-style)
  const allTagsWithCounts = useMemo(() => {
    const tagMap = new Map<string, number>();
    
    unifiedNotes.forEach(note => {
      note.tags.forEach(tag => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    
    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
  }, [unifiedNotes]);

  // Get the currently selected note for the right panel
  const selectedNote = useMemo(() => {
    return filteredNotes.find(n => n.id === selectedNoteId) || null;
  }, [filteredNotes, selectedNoteId]);

  // Group notes by date (Apple style)
  const groupedNotes = useMemo(() => {
    const groups: { [key: string]: UnifiedNote[] } = {};
    filteredNotes.forEach(note => {
      const date = new Date(note.updatedAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let groupKey: string;
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else if (date > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        groupKey = 'This Week';
      } else {
        groupKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(note);
    });
    return groups;
  }, [filteredNotes]);

  // Handlers
  const handleCreateRichNote = async () => {
    // Create blank note instantly (Apple Notes style)
    const newNote = await createRichNote({
      title: 'Untitled',
      content: '<p></p>',
      contentJSON: { type: 'doc', content: [{ type: 'paragraph' }] },
      category: 'study',
      tags: [],
      isFavorite: false,
      accountId: selectedAccountId || undefined,
    });
    
    // Select it immediately and switch to content view on mobile
    setSelectedNoteId(newNote.id);
    setMobileView('content');
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
      // Quick notes now edit inline - just select the note
      setSelectedNoteId(note.id);
      setMobileView('content');
    } else {
      setEditingRichNoteId(note.id);
      setIsRichNoteEditorOpen(true);
    }
  };

  const handleDeleteNote = async (note: UnifiedNote) => {
    if (note.type === 'quick') {
      await deleteQuickNote(note.id);
      toast.success('Note deleted');
    } else {
      await deleteRichNote(note.id);
      toast.success('Note deleted');
    }
  };
  
  // Quick action: Toggle favorite
  const handleToggleFavorite = async (noteId: string) => {
    const note = unifiedNotes.find(n => n.id === noteId);
    if (!note || note.type !== 'rich') return;
    
    const { toggleFavorite } = useRichNotesStore.getState();
    await toggleFavorite(noteId);
  };
  
  // Context menu actions
  const handleContextAction = async (action: 'delete' | 'favorite' | 'select', noteId: string) => {
    const note = unifiedNotes.find(n => n.id === noteId);
    if (!note) return;
    
    setContextMenu(null);
    
    switch (action) {
      case 'delete':
        if (confirm('Delete this note?')) {
          await handleDeleteNote(note);
        }
        break;
      case 'favorite':
        if (note.type === 'rich') {
          await handleToggleFavorite(noteId);
        }
        break;
      case 'select':
        setSelectionMode(true);
        setSelectedNotes(new Set([noteId]));
        break;
    }
  };
  
  // Batch delete selected notes
  const handleBatchDelete = async () => {
    if (selectedNotes.size === 0) return;
    
    if (confirm(`Delete ${selectedNotes.size} note${selectedNotes.size > 1 ? 's' : ''}?`)) {
      for (const noteId of Array.from(selectedNotes)) {
        const note = unifiedNotes.find(n => n.id === noteId);
        if (note) await handleDeleteNote(note);
      }
      setSelectionMode(false);
      setSelectedNotes(new Set());
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Search Bar (Apple-style - always visible) */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 pr-3 py-2 bg-muted/50 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={handleCreateRichNote}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>

      {/* 3-Column Layout (Apple Notes style) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* LEFT COLUMN: Folders & Smart Folders (Desktop only OR mobile folders view) */}
        <div className={cn(
          "w-full md:w-48 lg:w-56 border-r border-border bg-muted/30 flex flex-col overflow-hidden",
          "md:flex", // Always show on desktop
          mobileView === 'folders' ? "flex" : "hidden" // Show on mobile only when in folders view
        )}>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {/* Smart Folders */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">
                Smart Folders
              </div>
              
              <button
                onClick={() => {
                  setSmartFolder('all');
                  setSelectedFolderName(null);
                  setMobileView('list'); // Return to list on mobile
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                  smartFolder === 'all' && !selectedFolderName
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <Inbox className="w-4 h-4" />
                <span>All Notes</span>
                <span className="ml-auto text-xs">{unifiedNotes.length}</span>
              </button>
              
              <button
                onClick={() => {
                  setSmartFolder('recent');
                  setSelectedFolderName(null);
                  setMobileView('list');
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                  smartFolder === 'recent'
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <Clock className="w-4 h-4" />
                <span>Recent</span>
              </button>
              
              <button
                onClick={() => {
                  setSmartFolder('favorites');
                  setSelectedFolderName(null);
                  setMobileView('list');
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                  smartFolder === 'favorites'
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <Star className="w-4 h-4" />
                <span>Favorites</span>
              </button>
              
              <button
                onClick={() => {
                  setSmartFolder('quick');
                  setSelectedFolderName(null);
                  setMobileView('list');
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                  smartFolder === 'quick'
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <StickyNote className="w-4 h-4" />
                <span>Quick Notes</span>
              </button>
            </div>

            {/* User Folders */}
            {getFolders().length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 mb-2">
                  Folders
                </div>
                {getFolders().map(folder => (
                  <button
                    key={folder}
                    onClick={() => {
                      setSmartFolder('all');
                      setSelectedFolderName(folder);
                      setMobileView('list');
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
                      selectedFolderName === folder
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <Folder className="w-4 h-4" />
                    <span className="truncate">{folder}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Tags Section (Apple-style collapsible) */}
            {allTagsWithCounts.length > 0 && (
              <div>
                <div className="flex items-center justify-between px-2 py-1.5">
                  <button
                    onClick={() => setIsTagsSectionCollapsed(!isTagsSectionCollapsed)}
                    className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
                  >
                    <span>Tags</span>
                    <ChevronDown 
                      className={cn(
                        "w-3.5 h-3.5 transition-transform duration-200",
                        isTagsSectionCollapsed && "-rotate-90"
                      )} 
                    />
                  </button>
                  {selectedTagFilters.length > 0 && (
                    <button
                      onClick={() => {
                        clearTagFilters();
                        setSmartFolder('all');
                        setSelectedFolderName(null);
                      }}
                      className="text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                <AnimatePresence initial={false}>
                  {!isTagsSectionCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      {/* Apple-style flowing grid of tag pills */}
                      <div className="px-2 py-2 flex flex-wrap gap-1.5">
                        {allTagsWithCounts.map(({ tag, count }) => {
                          const isSelected = selectedTagFilters.includes(tag);
                          return (
                            <motion.button
                              key={tag}
                              onClick={() => {
                                toggleTagFilter(tag);
                                setSmartFolder('all');
                                setSelectedFolderName(null);
                                setMobileView('list');
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={cn(
                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                                isSelected
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                            >
                              <span>#{tag}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN: Notes List (Desktop always OR mobile list view) */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 border-r border-border flex flex-col overflow-hidden",
          "md:flex", // Always show on desktop
          mobileView === 'list' ? "flex" : "hidden md:flex" // Show on mobile only in list view
        )}>
          {/* Note count + Mobile Folders Button */}
          <div className="px-4 py-2 border-b border-border bg-muted/20">
            <div className="flex items-center justify-between mb-1">
              <button
                onClick={() => setMobileView('folders')}
                className="md:hidden flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Folder className="w-4 h-4" />
                <span>Folders</span>
              </button>
              <div className="text-sm font-medium text-foreground">
                {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
              </div>
            </div>
            
            {/* Active tag filters (Apple-style) */}
            {selectedTagFilters.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {selectedTagFilters.map(tag => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                  >
                    <Hash className="w-3 h-3" />
                    <span>{tag}</span>
                    <button
                      onClick={() => toggleTagFilter(tag)}
                      className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No notes found</p>
              </div>
            ) : (
              Object.entries(groupedNotes).map(([groupName, groupNotes]) => (
                <div key={groupName}>
                  {/* Date Group Header */}
                  <div className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm px-4 py-2 border-b border-border">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {groupName}
                    </div>
                  </div>
                  
                  {/* Notes in Group */}
                  {groupNotes.map(note => (
                    <motion.div
                      key={note.id}
                      onMouseDown={() => handleLongPressStart(note.id)}
                      onMouseUp={handleLongPressEnd}
                      onMouseEnter={() => setHoveredNoteId(note.id)}
                      onMouseLeave={() => {
                        handleLongPressEnd();
                        setHoveredNoteId(null);
                      }}
                      onTouchStart={() => handleLongPressStart(note.id)}
                      onTouchEnd={handleLongPressEnd}
                      onClick={() => handleNoteClick(note.id)}
                      onDoubleClick={() => handleNoteDoubleClick(note.id)}
                      onContextMenu={(e) => handleContextMenu(e, note.id)}
                      className={cn(
                        "px-4 py-3 border-b border-border cursor-pointer transition-colors relative group",
                        selectedNoteId === note.id && "bg-primary/5 border-l-2 border-l-primary",
                        selectedNotes.has(note.id) && selectionMode && "bg-primary/10",
                        selectedNoteId !== note.id && !selectedNotes.has(note.id) && "hover:bg-muted/30"
                      )}
                    >
                      {selectionMode && (
                        <div className="absolute left-2 top-3">
                          <input
                            type="checkbox"
                            checked={selectedNotes.has(note.id)}
                            className="rounded pointer-events-none"
                            readOnly
                          />
                        </div>
                      )}
                      
                      <div className={cn("space-y-1", selectionMode && "ml-6")}>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-sm line-clamp-1 text-foreground">
                            {note.title}
                          </h3>
                          {note.isFavorite && (
                            <Star className="w-3 h-3 text-yellow-500 fill-current flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                        
                        {(() => {
                          const { text, hasImages } = cleanPreviewText(note.content);
                          return (
                            <>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {text}
                              </p>
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                                {note.type === 'rich' ? (
                                  <FileEdit className="w-3 h-3 text-violet-500" />
                                ) : (
                                  <StickyNote className="w-3 h-3 text-yellow-500" />
                                )}
                                {hasImages && (
                                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded">
                                    <ImageIcon className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      
                      {/* Hover Actions (Apple-style) */}
                      {!selectionMode && hoveredNoteId === note.id && (
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 p-1 shadow-lg"
                        >
                          {note.type === 'rich' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(note.id);
                              }}
                              className={cn(
                                "p-1.5 rounded hover:bg-muted transition-colors",
                                note.isFavorite && "text-yellow-500"
                              )}
                              title={note.isFavorite ? "Unfavorite" : "Favorite"}
                            >
                              <Star className={cn("w-3.5 h-3.5", note.isFavorite && "fill-current")} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this note?')) {
                                handleDeleteNote(note);
                              }
                            }}
                            className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Note Content (Desktop always OR mobile content view) */}
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden bg-background",
          "md:flex", // Always show on desktop
          mobileView === 'content' ? "flex" : "hidden md:flex" // Show on mobile only in content view
        )}>
          {selectedNote ? (
            selectedNote.type === 'rich' ? (
              /* Rich Note: Inline Editor (Apple Notes style) */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile Back Button */}
                <div className="md:hidden px-4 py-2 border-b border-border">
                  <button
                    onClick={() => setMobileView('list')}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
                <InlineNoteEditor
                  key={selectedNote.id}
                  noteId={selectedNote.id}
                  onClose={() => setSelectedNoteId(null)}
                />
              </div>
            ) : (
              /* Quick Note: Inline editable view */
              <QuickNoteInlineEditor
                key={selectedNote.id}
                noteId={selectedNote.id}
                onClose={() => setMobileView('list')}
                onDelete={() => {
                  handleDeleteNote(selectedNote);
                  setSelectedNoteId(null);
                }}
              />
            )
          ) : (
            <div className="flex-1 flex items-center justify-center text-center px-6">
              <div>
                <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Select a note to view</p>
              </div>
            </div>
          )}
        </div>
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
      
      {/* Context Menu (Apple-style right-click) */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              zIndex: 100,
            }}
            className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden min-w-[180px]"
          >
            <div className="py-1">
              {(() => {
                const note = unifiedNotes.find(n => n.id === contextMenu.noteId);
                return (
                  <>
                    {note?.type === 'rich' && (
                      <button
                        onClick={() => handleContextAction('favorite', contextMenu.noteId)}
                        className="w-full text-left px-4 py-2 hover:bg-muted transition-colors flex items-center gap-3 text-sm"
                      >
                        <Star className={cn("w-4 h-4", note.isFavorite && "fill-yellow-500 text-yellow-500")} />
                        <span>{note.isFavorite ? 'Unfavorite' : 'Favorite'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleContextAction('select', contextMenu.noteId)}
                      className="w-full text-left px-4 py-2 hover:bg-muted transition-colors flex items-center gap-3 text-sm"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>Select</span>
                    </button>
                    <div className="h-px bg-border my-1" />
                    <button
                      onClick={() => handleContextAction('delete', contextMenu.noteId)}
                      className="w-full text-left px-4 py-2 hover:bg-red-500/10 transition-colors flex items-center gap-3 text-sm text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Selection Mode Bar (Apple-style) */}
      <AnimatePresence>
        {selectionMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-background border-2 border-border rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4">
              <div className="text-sm font-medium">
                {selectedNotes.size} selected
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchDelete}
                  disabled={selectedNotes.size === 0}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={() => {
                    setSelectionMode(false);
                    setSelectedNotes(new Set());
                  }}
                  className="px-4 py-2 bg-muted hover:bg-muted/70 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
