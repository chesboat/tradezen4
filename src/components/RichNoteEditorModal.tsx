import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  Star, 
  StarOff, 
  Hash, 
  Folder, 
  Link2, 
  Eye,
  Clock,
  FileText,
  BookOpen,
  Briefcase,
  User,
  Search,
  Lightbulb,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { RichNote } from '@/types';
import { useRichNotesStore } from '@/store/useRichNotesStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { EnhancedRichTextEditor } from './EnhancedRichTextEditor';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface RichNoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId?: string; // If provided, edit existing note
  initialTitle?: string;
  initialContent?: string;
  initialCategory?: RichNote['category'];
}

const categoryOptions: { value: RichNote['category']; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'study', label: 'Study', icon: <BookOpen className="w-4 h-4" />, color: 'text-blue-500' },
  { value: 'trading', label: 'Trading', icon: <Briefcase className="w-4 h-4" />, color: 'text-green-500' },
  { value: 'personal', label: 'Personal', icon: <User className="w-4 h-4" />, color: 'text-purple-500' },
  { value: 'research', label: 'Research', icon: <Search className="w-4 h-4" />, color: 'text-orange-500' },
  { value: 'meeting', label: 'Meeting', icon: <Calendar className="w-4 h-4" />, color: 'text-red-500' },
  { value: 'ideas', label: 'Ideas', icon: <Lightbulb className="w-4 h-4" />, color: 'text-yellow-500' },
];

export const RichNoteEditorModal: React.FC<RichNoteEditorModalProps> = ({
  isOpen,
  onClose,
  noteId,
  initialTitle = '',
  initialContent = '',
  initialCategory = 'study'
}) => {
  const { selectedAccountId } = useAccountFilterStore();
  const { 
    createNote, 
    updateNote, 
    toggleFavorite, 
    getNoteById, 
    getFolders,
    getLinkedNotes,
    linkNotes,
    unlinkNotes
  } = useRichNotesStore();

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [category, setCategory] = useState<RichNote['category']>(initialCategory);
  const [tags, setTags] = useState<string[]>([]);
  const [folder, setFolder] = useState<string>('');
  const [newTag, setNewTag] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<number>();
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const folderDropdownRef = useRef<HTMLDivElement>(null);
  
  const existingNote = noteId ? getNoteById(noteId) : null;
  const folders = getFolders();
  const linkedNotes = noteId ? getLinkedNotes(noteId) : [];

  // Load existing note data
  useEffect(() => {
    if (existingNote) {
      setTitle(existingNote.title);
      setContent(existingNote.content);
      setCategory(existingNote.category);
      setTags(existingNote.tags);
      setFolder(existingNote.folder || '');
    } else {
      setTitle(initialTitle);
      setContent(initialContent);
      setCategory(initialCategory);
      setTags([]);
      setFolder('');
    }
  }, [existingNote, initialTitle, initialContent, initialCategory]);

  // Focus title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (folderDropdownRef.current && !folderDropdownRef.current.contains(event.target as Node)) {
        setIsFolderDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (!noteId || !existingNote) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = window.setTimeout(() => {
      handleAutoSave();
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [title, content, category, tags, folder]);

  const handleAutoSave = async () => {
    if (!noteId || !existingNote || !selectedAccountId) return;

    try {
      await updateNote(noteId, {
        title: title.trim() || 'Untitled Note',
        content,
        category,
        tags,
        folder: folder || undefined,
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedAccountId) {
      toast.error('Please select an account');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSaving(true);

    try {
      if (noteId && existingNote) {
        // Update existing note
        await updateNote(noteId, {
          title: title.trim(),
          content,
          category,
          tags,
          folder: folder || undefined,
        });
        toast.success('Note updated successfully');
      } else {
        // Create new note
        await createNote({
          title: title.trim(),
          content,
          contentJSON: {}, // Will be populated by the editor
          category,
          tags,
          folder: folder || undefined,
          isFavorite: false,
          accountId: selectedAccountId,
        });
        toast.success('Note created successfully');
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save note:', error);
      toast.error('Failed to save note');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleCreateFolder = () => {
    const folderName = newFolder.trim();
    if (folderName) {
      setFolder(folderName);
      setNewFolder('');
      setIsCreatingFolder(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (noteId) {
      await toggleFavorite(noteId);
    }
  };

  const categoryOption = categoryOptions.find(opt => opt.value === category);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="text-2xl font-bold bg-transparent border-none outline-none flex-1 min-w-0 text-foreground placeholder-muted-foreground"
              />
              
              {existingNote && (
                <button
                  onClick={handleToggleFavorite}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    existingNote.isFavorite 
                      ? "text-yellow-500 hover:text-yellow-600" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {existingNote.isFavorite ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Metadata Bar */}
          <div className="flex items-center gap-4 p-4 border-b border-border bg-muted/30">
            {/* Category */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Category:</span>
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="bg-background border border-border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 hover:bg-accent transition-colors flex items-center gap-2 min-w-[120px]"
                >
                  {categoryOption && (
                    <span className={categoryOption.color}>
                      {categoryOption.icon}
                    </span>
                  )}
                  <span>{categoryOption?.label}</span>
                  <ChevronDown className={cn(
                    "w-3 h-3 text-muted-foreground transition-transform ml-auto",
                    isCategoryDropdownOpen && "rotate-180"
                  )} />
                </button>

                {isCategoryDropdownOpen && (
                  <div className="absolute z-[100] w-full min-w-max mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {categoryOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setCategory(option.value);
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-left flex items-center gap-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                          option.value === category && "bg-muted"
                        )}
                      >
                        <span className={option.color}>
                          {option.icon}
                        </span>
                        <span>{option.label}</span>
                        {option.value === category && (
                          <span className="ml-auto text-primary">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Folder */}
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-muted-foreground" />
              {isCreatingFolder ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newFolder}
                    onChange={(e) => setNewFolder(e.target.value)}
                    placeholder="Folder name..."
                    className="bg-background border border-border rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateFolder();
                      if (e.key === 'Escape') setIsCreatingFolder(false);
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleCreateFolder}
                    className="text-primary hover:text-primary/80 text-sm"
                  >
                    Create
                  </button>
                </div>
              ) : (
                <div className="relative" ref={folderDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsFolderDropdownOpen(!isFolderDropdownOpen)}
                    className="bg-background border border-border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 hover:bg-accent transition-colors flex items-center gap-2 min-w-[140px]"
                  >
                    <span className="text-muted-foreground">
                      {folder || 'No folder'}
                    </span>
                    <ChevronDown className={cn(
                      "w-3 h-3 text-muted-foreground transition-transform ml-auto",
                      isFolderDropdownOpen && "rotate-180"
                    )} />
                  </button>

                  {isFolderDropdownOpen && (
                    <div className="absolute z-[100] w-full min-w-max mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setFolder('');
                          setIsFolderDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                          !folder && "bg-muted"
                        )}
                      >
                        <span className="text-muted-foreground">No folder</span>
                        {!folder && (
                          <span className="ml-auto text-primary">✓</span>
                        )}
                      </button>
                      {folders.map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            setFolder(f);
                            setIsFolderDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                            f === folder && "bg-muted"
                          )}
                        >
                          <span>{f}</span>
                          {f === folder && (
                            <span className="ml-auto text-primary">✓</span>
                          )}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingFolder(true);
                          setIsFolderDropdownOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors border-t border-border"
                      >
                        <span className="text-primary">+ Create new folder</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Word count and reading time */}
            {existingNote && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground ml-auto">
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {existingNote.wordCount} words
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {existingNote.readingTime} min read
                </div>
                {existingNote.lastViewedAt && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    Last viewed {new Date(existingNote.lastViewedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-sm cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag}
                  <X className="w-3 h-3" />
                </span>
              ))}
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                className="bg-transparent border-none outline-none text-sm placeholder-muted-foreground min-w-[100px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
            </div>

            {/* Linked notes */}
            {linkedNotes.length > 0 && (
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {linkedNotes.length} linked note{linkedNotes.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden">
            <EnhancedRichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing your note... Use rich formatting, add images, create lists, and more."
              className="h-full"
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
