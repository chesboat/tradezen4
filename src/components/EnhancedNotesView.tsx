import React, { useState, useEffect } from 'react';
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
  Square
} from 'lucide-react';
import { NoteContent } from './NoteContent';
import { SmartTagFilterBar } from './SmartTagFilterBar';
import { RichNoteEditorModal } from './RichNoteEditorModal';
import { useQuickNoteStore, useQuickNoteModal } from '@/store/useQuickNoteStore';
import { useRichNotesStore } from '@/store/useRichNotesStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { cn } from '@/lib/utils';

export const EnhancedNotesView: React.FC = () => {
  const { selectedAccountId } = useAccountFilterStore();
  const { notes: quickNotes, deleteNote: deleteQuickNote } = useQuickNoteStore();
  const { setEditingNote, openModal } = useQuickNoteModal();
  const { 
    notes: richNotes, 
    loadNotes: loadRichNotes, 
    deleteNote: deleteRichNote,
    createNote: createRichNote,
    getFilteredNotes,
    setSearchQuery,
    setSelectedCategory,
    setSelectedFolder,
    setShowFavoritesOnly,
    getFolders,
    getCategories
  } = useRichNotesStore();

  // State
  const [activeTab, setActiveTab] = useState<'quick' | 'rich'>('rich');
  const [isRichNoteEditorOpen, setIsRichNoteEditorOpen] = useState(false);
  const [editingRichNoteId, setEditingRichNoteId] = useState<string | undefined>();
  const [richNotesQuery, setRichNotesQuery] = useState('');
  const [selectedCategory, setSelectedCategoryState] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolderState] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnlyState] = useState(false);
  const [selectedQuickNotes, setSelectedQuickNotes] = useState<Set<string>>(new Set());

  // Load rich notes when account changes
  useEffect(() => {
    if (selectedAccountId && activeTab === 'rich') {
      loadRichNotes(selectedAccountId);
    }
  }, [selectedAccountId, activeTab, loadRichNotes]);

  // Update rich notes filters
  useEffect(() => {
    setSearchQuery(richNotesQuery);
  }, [richNotesQuery, setSearchQuery]);

  useEffect(() => {
    setSelectedCategory(selectedCategory);
  }, [selectedCategory, setSelectedCategory]);

  useEffect(() => {
    setSelectedFolder(selectedFolder);
  }, [selectedFolder, setSelectedFolder]);

  useEffect(() => {
    setShowFavoritesOnly(showFavoritesOnly);
  }, [showFavoritesOnly, setShowFavoritesOnly]);

  // Get filtered data
  const filteredRichNotes = getFilteredNotes();
  const folders = getFolders();
  const categories = getCategories();

  const categoryIcons: Record<string, React.ReactNode> = {
    study: <BookOpen className="w-4 h-4" />,
    trading: <Briefcase className="w-4 h-4" />,
    personal: <User className="w-4 h-4" />,
    research: <Search className="w-4 h-4" />,
    meeting: <CalendarIcon className="w-4 h-4" />,
    ideas: <Lightbulb className="w-4 h-4" />,
  };

  const handleCreateRichNote = () => {
    setEditingRichNoteId(undefined);
    setIsRichNoteEditorOpen(true);
  };

  const handleEditRichNote = (noteId: string) => {
    setEditingRichNoteId(noteId);
    setIsRichNoteEditorOpen(true);
  };

  const handleDeleteRichNote = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteRichNote(noteId);
    }
  };

  const handleConvertQuickNotes = async () => {
    if (!selectedAccountId || selectedQuickNotes.size === 0) return;

    for (const noteId of selectedQuickNotes) {
      const quickNote = quickNotes.find(n => n.id === noteId);
      if (!quickNote) continue;

      try {
        await createRichNote({
          title: quickNote.content.substring(0, 50).trim() + (quickNote.content.length > 50 ? '...' : ''),
          content: `<p>${quickNote.content.replace(/\n/g, '</p><p>')}</p>`,
          contentJSON: {
            type: 'doc',
            content: [{ type: 'paragraph', content: [{ type: 'text', text: quickNote.content }] }]
          },
          category: 'personal',
          tags: quickNote.tags || [],
          isFavorite: false,
          accountId: selectedAccountId,
        });

        // Delete the original quick note
        await deleteQuickNote(noteId);
      } catch (error) {
        console.error('Failed to convert note:', error);
      }
    }

    setSelectedQuickNotes(new Set());
  };

  const toggleQuickNoteSelection = (noteId: string) => {
    setSelectedQuickNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      return newSet;
    });
  };

  // Filter quick notes by account
  const filteredQuickNotes = quickNotes.filter(note => 
    !selectedAccountId || note.accountId === selectedAccountId
  );

  return (
    <div className="h-full flex flex-col">
      <SmartTagFilterBar />

      {/* Tab Navigation */}
      <div className="px-6 py-4 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('quick')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                activeTab === 'quick' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <StickyNote className="w-4 h-4" />
              Quick Notes ({quickNotes.length})
            </button>
            <button
              onClick={() => setActiveTab('rich')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2",
                activeTab === 'rich' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileEdit className="w-4 h-4" />
              Rich Notes ({richNotes.length})
            </button>
          </div>

          {activeTab === 'rich' && (
            <button
              onClick={handleCreateRichNote}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Rich Note
            </button>
          )}
        </div>

        {/* Rich Notes Controls */}
        {activeTab === 'rich' && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={richNotesQuery}
                  onChange={(e) => setRichNotesQuery(e.target.value)}
                  placeholder="Search rich notes..."
                  className="w-full pl-9 pr-3 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFavoritesOnlyState(!showFavoritesOnly)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors",
                    showFavoritesOnly 
                      ? "bg-yellow-500/20 text-yellow-600 border border-yellow-500/30" 
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                >
                  <Star className="w-4 h-4" />
                  Favorites
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategoryState(e.target.value || null)}
                className="px-3 py-1.5 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedFolder || ''}
                onChange={(e) => setSelectedFolderState(e.target.value || null)}
                className="px-3 py-1.5 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Folders</option>
                {folders.map(folder => (
                  <option key={folder} value={folder}>
                    {folder}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {activeTab === 'quick' ? (
          // Quick Notes Content
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <StickyNote className="w-4 h-4" />
                <span>{filteredQuickNotes.length} quick note{filteredQuickNotes.length !== 1 ? 's' : ''}</span>
                {selectedQuickNotes.size > 0 && (
                  <span className="ml-2">• {selectedQuickNotes.size} selected</span>
                )}
              </div>
              
              {selectedQuickNotes.size > 0 && (
                <button
                  onClick={handleConvertQuickNotes}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Convert to Rich Notes ({selectedQuickNotes.size})
                </button>
              )}
            </div>

            <AnimatePresence>
              {filteredQuickNotes.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <StickyNote className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No quick notes found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Quick notes are created from the daily journal, trade logger, or reflection templates.
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredQuickNotes.map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-card border rounded-lg p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleQuickNoteSelection(note.id)}
                          className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {selectedQuickNotes.has(note.id) ? 
                            <CheckSquare className="w-4 h-4 text-primary" /> : 
                            <Square className="w-4 h-4" />
                          }
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <NoteContent note={note} />
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingNote(note)}
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                            title="Edit Quick Note"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedQuickNotes(new Set([note.id]));
                              handleConvertQuickNotes();
                            }}
                            className="p-1.5 text-muted-foreground hover:text-primary rounded-md hover:bg-muted transition-colors"
                            title="Convert to Rich Note"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteQuickNote(note.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-muted transition-colors"
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
          </>
        ) : (
          // Rich Notes Content
          <>
            <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
              <FileEdit className="w-4 h-4" />
              <span>{filteredRichNotes.length} rich note{filteredRichNotes.length !== 1 ? 's' : ''}</span>
            </div>

            <AnimatePresence>
              {filteredRichNotes.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                  <FileEdit className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No rich notes found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create rich notes with advanced formatting, organization, and linking capabilities for your study materials and research.
                  </p>
                  <button
                    onClick={handleCreateRichNote}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Create your first rich note
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredRichNotes.map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group hover:border-primary/20"
                      onClick={() => handleEditRichNote(note.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-primary">
                            {categoryIcons[note.category]}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-1 rounded-full">
                            {note.category}
                          </span>
                          {note.folder && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                              {note.folder}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {note.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRichNote(note.id);
                            }}
                            className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-foreground mb-3 line-clamp-2 text-lg leading-tight">
                        {note.title}
                      </h3>
                      
                      <div 
                        className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: note.content.replace(/<[^>]*>/g, '').substring(0, 150) + (note.content.length > 150 ? '...' : '')
                        }}
                      />
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {note.wordCount} words
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {note.readingTime} min read
                          </span>
                        </div>
                        <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                      </div>
                      
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                              #{tag}
                            </span>
                          ))}
                          {note.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground px-2 py-1">
                              +{note.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </>
        )}
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
