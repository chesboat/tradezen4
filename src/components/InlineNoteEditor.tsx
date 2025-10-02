import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  Hash, 
  Folder, 
  Save,
  Check,
  BookOpen,
  Briefcase,
  User,
  Search,
  Lightbulb,
  Calendar,
  ChevronDown,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Code,
  Heading1,
  Heading2,
  Trash2,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { RichNote } from '@/types';
import { useRichNotesStore } from '@/store/useRichNotesStore';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface InlineNoteEditorProps {
  noteId: string;
  onClose?: () => void;
}

const categoryOptions: { value: RichNote['category']; label: string; icon: React.ReactNode }[] = [
  { value: 'study', label: 'Study', icon: <BookOpen className="w-4 h-4" /> },
  { value: 'trading', label: 'Trading', icon: <Briefcase className="w-4 h-4" /> },
  { value: 'personal', label: 'Personal', icon: <User className="w-4 h-4" /> },
  { value: 'research', label: 'Research', icon: <Search className="w-4 h-4" /> },
  { value: 'meeting', label: 'Meeting', icon: <Calendar className="w-4 h-4" /> },
  { value: 'ideas', label: 'Ideas', icon: <Lightbulb className="w-4 h-4" /> },
];

export const InlineNoteEditor: React.FC<InlineNoteEditorProps> = ({ noteId, onClose }) => {
  const { getNoteById, updateNote, toggleFavorite, getFolders, deleteNote } = useRichNotesStore();
  
  const existingNote = getNoteById(noteId);
  const folders = getFolders();

  const [title, setTitle] = useState(existingNote?.title || '');
  const [category, setCategory] = useState<RichNote['category']>(existingNote?.category || 'study');
  const [tags, setTags] = useState<string[]>(existingNote?.tags || []);
  const [folder, setFolder] = useState<string>(existingNote?.folder || '');
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasChanges, setHasChanges] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Store initial values to detect changes
  const initialValuesRef = useRef({
    title: existingNote?.title || '',
    content: existingNote?.content || '<p></p>',
    category: existingNote?.category || 'study',
    tags: existingNote?.tags || [],
    folder: existingNote?.folder || '',
  });

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start typing your note...' }),
    ],
    content: existingNote?.content || '<p></p>',
    onUpdate: ({ editor }) => {
      // Trigger auto-save
      triggerAutoSave();
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-6 py-4',
      },
    },
  });

  // Auto-focus title on mount
  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, []);

  // Trigger auto-save when title, category, tags, or folder changes
  useEffect(() => {
    if (existingNote) {
      triggerAutoSave();
    }
  }, [title, category, tags, folder]);

  const triggerAutoSave = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setSavingStatus('saving');

    autoSaveTimeoutRef.current = setTimeout(() => {
      handleAutoSave();
    }, 500); // 500ms debounce
  };

  const handleAutoSave = async () => {
    if (!existingNote || !editor) return;

    const content = editor.getHTML();
    
    // Check if anything actually changed
    const currentTitle = title || 'Untitled';
    const currentFolder = folder || '';
    const tagsChanged = JSON.stringify(tags.sort()) !== JSON.stringify(initialValuesRef.current.tags.sort());
    
    const hasActualChanges = 
      currentTitle !== initialValuesRef.current.title ||
      content !== initialValuesRef.current.content ||
      category !== initialValuesRef.current.category ||
      tagsChanged ||
      currentFolder !== initialValuesRef.current.folder;

    // Only save if there are actual changes
    if (!hasActualChanges) {
      setSavingStatus('idle');
      setHasChanges(false);
      return;
    }

    try {
      const plainText = editor.getText();
      const wordCount = plainText.split(/\s+/).filter(Boolean).length;

      await updateNote(noteId, {
        title: currentTitle,
        content,
        category,
        tags,
        folder: folder || undefined,
        wordCount,
      });

      // Update initial values after successful save
      initialValuesRef.current = {
        title: currentTitle,
        content,
        category,
        tags: [...tags],
        folder: currentFolder,
      };

      setHasChanges(false);
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast.error('Failed to save note');
      setSavingStatus('idle');
    }
  };

  const handleToggleFavorite = async () => {
    if (!existingNote) return;
    await toggleFavorite(noteId);
  };

  const handleDelete = async () => {
    if (!existingNote) return;
    
    const confirmed = window.confirm(`Delete "${existingNote.title}"? This cannot be undone.`);
    if (!confirmed) return;
    
    try {
      await deleteNote(noteId);
      toast.success('Note deleted');
      if (onClose) onClose();
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error('Failed to delete note');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleShare = async () => {
    if (!existingNote) return;
    
    // Make note public
    try {
      await updateNote(noteId, { isPublic: true });
      const shareUrl = `${window.location.origin}/share/note/${noteId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
      setShowShareModal(true);
    } catch (error) {
      console.error('Failed to share note:', error);
      toast.error('Failed to create share link');
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/share/note/${noteId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleOpenInNewTab = () => {
    const shareUrl = `${window.location.origin}/share/note/${noteId}`;
    window.open(shareUrl, '_blank');
  };

  const handleDisableSharing = async () => {
    try {
      await updateNote(noteId, { isPublic: false });
      toast.success('Sharing disabled');
      setShowShareModal(false);
    } catch (error) {
      console.error('Failed to disable sharing:', error);
      toast.error('Failed to disable sharing');
    }
  };

  if (!existingNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Note not found</p>
      </div>
    );
  }

  const selectedCategory = categoryOptions.find(c => c.value === category);
  const shareUrl = `${window.location.origin}/share/note/${noteId}`;

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header with metadata */}
      <div className="border-b border-border px-6 py-4 space-y-4 shrink-0">
        {/* Title */}
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Note"
          className="w-full text-3xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground"
        />

        {/* Metadata bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Favorite */}
          <button
            onClick={handleToggleFavorite}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            {existingNote.isFavorite ? (
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ) : (
              <Star className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Category */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as RichNote['category'])}
            className="text-sm px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Folder */}
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">No Folder</option>
            {folders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          {/* Saving indicator */}
          <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
            {savingStatus === 'saving' && (
              <>
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {savingStatus === 'saved' && (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-500">Saved</span>
              </>
            )}
            {savingStatus === 'idle' && existingNote.updatedAt && (
              <span>Last edited {new Date(existingNote.updatedAt).toLocaleString()}</span>
            )}
            
            {/* Share button */}
            <button
              onClick={existingNote.isPublic ? () => setShowShareModal(true) : handleShare}
              className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
              title={existingNote.isPublic ? "Manage sharing" : "Share note"}
            >
              <Share2 className="w-4 h-4" />
            </button>
            
            {/* Delete button */}
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
              title="Delete note"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs"
            >
              <Hash className="w-3 h-3" />
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-primary/70 transition-colors"
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add tag..."
            className="text-xs px-2 py-1 rounded-md border border-border bg-transparent focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Floating Toolbar */}
      {editor && (
        <div className="border-b border-border px-6 py-2 flex items-center gap-1 shrink-0">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'p-2 rounded hover:bg-accent transition-colors',
              editor.isActive('bold') && 'bg-accent text-primary'
            )}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'p-2 rounded hover:bg-accent transition-colors',
              editor.isActive('italic') && 'bg-accent text-primary'
            )}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              'p-2 rounded hover:bg-accent transition-colors',
              editor.isActive('underline') && 'bg-accent text-primary'
            )}
          >
            <span className="text-sm font-semibold">U</span>
          </button>
          
          <div className="w-px h-6 bg-border mx-2" />
          
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              'p-2 rounded hover:bg-accent transition-colors',
              editor.isActive('heading', { level: 1 }) && 'bg-accent text-primary'
            )}
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              'p-2 rounded hover:bg-accent transition-colors',
              editor.isActive('heading', { level: 2 }) && 'bg-accent text-primary'
            )}
          >
            <Heading2 className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-border mx-2" />
          
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              'p-2 rounded hover:bg-accent transition-colors',
              editor.isActive('bulletList') && 'bg-accent text-primary'
            )}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              'p-2 rounded hover:bg-accent transition-colors',
              editor.isActive('orderedList') && 'bg-accent text-primary'
            )}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-border mx-2" />
          
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn(
              'p-2 rounded hover:bg-accent transition-colors',
              editor.isActive('codeBlock') && 'bg-accent text-primary'
            )}
          >
            <Code className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowShareModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6"
          >
            {/* Header */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Share Note</h3>
              <p className="text-sm text-muted-foreground">
                Anyone with the link can view this note
              </p>
            </div>

            {/* Share URL */}
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                title="Copy link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleOpenInNewTab}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Open in New Tab
              </button>
              <button
                onClick={handleDisableSharing}
                className="px-4 py-2.5 border border-border rounded-lg hover:bg-accent transition-colors font-medium"
              >
                Disable Sharing
              </button>
            </div>

            {/* Close */}
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

