import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { normalizeTagInput } from '@/lib/hashtagUtils';
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
  ExternalLink,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import { RichNote } from '@/types';
import { useRichNotesStore } from '@/store/useRichNotesStore';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { uploadJournalImage } from '@/lib/uploadJournalImage';

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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Store initial values to detect changes
  const initialValuesRef = useRef({
    title: existingNote?.title || '',
    content: existingNote?.content || '<p></p>',
    category: existingNote?.category || 'study',
    tags: existingNote?.tags || [],
    folder: existingNote?.folder || '',
  });

  // Image upload handler
  const handleImageUpload = async (file: File): Promise<string> => {
    setIsUploadingImage(true);
    try {
      const url = await uploadJournalImage(file);
      return url;
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to upload image');
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle image selection from file input
  const handleImageFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    try {
      const url = await handleImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
      toast.success('Image added');
    } catch (error) {
      // Error already handled in handleImageUpload
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: 'my-1', // Reduced spacing between paragraphs
          },
        },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      TiptapImage.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Placeholder.configure({ 
        placeholder: 'Start typing your note... (Drag & drop or paste images)',
        emptyEditorClass: 'is-editor-empty',
      }),
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
      // Handle drag and drop
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            
            handleImageUpload(file).then((url) => {
              const { schema } = view.state;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (coordinates) {
                const node = schema.nodes.image.create({ src: url });
                const transaction = view.state.tr.insert(coordinates.pos, node);
                view.dispatch(transaction);
                toast.success('Image added');
              }
            }).catch(() => {
              // Error already handled
            });
            
            return true;
          }
        }
        return false;
      },
      // Handle paste (Apple Notes style)
      handlePaste: (view, event, slice) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        // Check for images first
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              handleImageUpload(file).then((url) => {
                editor?.chain().focus().setImage({ src: url }).run();
                toast.success('Image pasted');
              }).catch(() => {
                // Error already handled
              });
            }
            return true;
          }
        }

        // Handle HTML paste from ChatGPT and other sources (Apple Notes style)
        const htmlContent = event.clipboardData?.getData('text/html');
        const plainText = event.clipboardData?.getData('text/plain');
        
        if (htmlContent && htmlContent.trim()) {
          event.preventDefault();
          
          // Create a temporary div to parse HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = htmlContent;
          
          // Remove excessive line breaks and normalize spacing
          // Replace multiple consecutive <br> tags with single paragraph breaks
          let cleanedHtml = tempDiv.innerHTML;
          
          // Remove <br> tags that appear multiple times in a row
          cleanedHtml = cleanedHtml.replace(/(<br\s*\/?>[\s\n]*){2,}/gi, '</p><p>');
          
          // Remove empty paragraphs
          cleanedHtml = cleanedHtml.replace(/<p[^>]*>[\s\n]*<\/p>/gi, '');
          
          // Normalize whitespace in paragraphs
          cleanedHtml = cleanedHtml.replace(/<p([^>]*)>\s+/gi, '<p$1>');
          cleanedHtml = cleanedHtml.replace(/\s+<\/p>/gi, '</p>');
          
          // Remove <br> at the end of paragraphs (redundant)
          cleanedHtml = cleanedHtml.replace(/<br\s*\/?>\s*<\/p>/gi, '</p>');
          
          // If the content doesn't have <p> tags, wrap it
          if (!cleanedHtml.includes('<p>') && !cleanedHtml.includes('<h1>') && !cleanedHtml.includes('<h2>')) {
            // Split by double line breaks and wrap each in <p>
            const lines = plainText?.split(/\n\n+/) || [cleanedHtml];
            cleanedHtml = lines
              .filter(line => line.trim())
              .map(line => `<p>${line.replace(/\n/g, '<br>')}</p>`)
              .join('');
          }
          
          // Insert the cleaned content
          editor?.commands.insertContent(cleanedHtml);
          return true;
        }
        
        return false; // Allow default behavior for plain text
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
    const normalizedTag = normalizeTagInput(newTag);
    if (normalizedTag && !tags.includes(normalizedTag)) {
      setTags([...tags, normalizedTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleShare = async () => {
    if (!existingNote) return;
    
    try {
      // Make note public first
      await updateNote(noteId, { isPublic: true });
      
      // Open modal (copy will happen from there)
      setShowShareModal(true);
      
      // Try to copy, but don't fail if it doesn't work
      try {
        const shareUrl = `${window.location.origin}/share/note/${noteId}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied to clipboard!');
      } catch (clipboardError) {
        // Clipboard failed, but that's ok - modal has copy button
        toast.success('Note is now public! Use the modal to copy the link.');
      }
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
      // Fallback: Select the text for manual copy
      const input = document.querySelector('input[value="' + shareUrl + '"]') as HTMLInputElement;
      if (input) {
        input.select();
        input.setSelectionRange(0, 99999); // For mobile
        toast('Press Cmd+C (or Ctrl+C) to copy', { duration: 3000 });
      } else {
        toast.error('Failed to copy link');
      }
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
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      {/* Floating Toolbar - Apple Notes style pill */}
      {editor && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-0.5 px-2 py-1 bg-card/95 backdrop-blur-md border border-border rounded-full shadow-lg">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn(
                'p-1.5 rounded-full hover:bg-accent transition-colors',
                editor.isActive('bold') && 'bg-accent text-primary'
              )}
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn(
                'p-1.5 rounded-full hover:bg-accent transition-colors',
                editor.isActive('italic') && 'bg-accent text-primary'
              )}
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn(
                'p-1.5 rounded-full hover:bg-accent transition-colors',
                editor.isActive('underline') && 'bg-accent text-primary'
              )}
              title="Underline"
            >
              <span className="text-sm font-semibold w-4 h-4 flex items-center justify-center">U</span>
            </button>
            
            <div className="w-px h-5 bg-border mx-1" />
            
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={cn(
                'p-1.5 rounded-full hover:bg-accent transition-colors',
                editor.isActive('heading', { level: 1 }) && 'bg-accent text-primary'
              )}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={cn(
                'p-1.5 rounded-full hover:bg-accent transition-colors',
                editor.isActive('heading', { level: 2 }) && 'bg-accent text-primary'
              )}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            
            <div className="w-px h-5 bg-border mx-1" />
            
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                'p-1.5 rounded-full hover:bg-accent transition-colors',
                editor.isActive('bulletList') && 'bg-accent text-primary'
              )}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                'p-1.5 rounded-full hover:bg-accent transition-colors',
                editor.isActive('orderedList') && 'bg-accent text-primary'
              )}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            
            <div className="w-px h-5 bg-border mx-1" />
            
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={cn(
                'p-1.5 rounded-full hover:bg-accent transition-colors',
                editor.isActive('codeBlock') && 'bg-accent text-primary'
              )}
              title="Code Block"
            >
              <Code className="w-4 h-4" />
            </button>
            
            <div className="w-px h-5 bg-border mx-1" />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              className={cn(
                'p-1.5 rounded-full hover:bg-accent transition-colors',
                isUploadingImage && 'opacity-50 cursor-not-allowed'
              )}
              title="Add image"
            >
              {isUploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
            </button>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileSelect}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Scrollable content - header scrolls with content like Apple Notes */}
      <div className="flex-1 overflow-y-auto">
        {/* Spacer for floating toolbar */}
        <div className="h-14" />
        
        {/* Header with metadata - now scrolls with content */}
        <div className="px-6 py-4 space-y-3">
          {/* Title */}
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Note"
            className="w-full text-3xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground"
          />

          {/* Compact metadata bar */}
          <div className="flex items-center gap-2 flex-wrap text-sm">
            {/* Favorite */}
            <button
              onClick={handleToggleFavorite}
              className="p-1 rounded hover:bg-accent transition-colors"
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
              className="text-xs px-2 py-1 rounded border border-border bg-background hover:bg-accent transition-colors cursor-pointer focus:outline-none"
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
              className="text-xs px-2 py-1 rounded border border-border bg-background hover:bg-accent transition-colors cursor-pointer focus:outline-none"
            >
              <option value="">No Folder</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            {/* Tags inline */}
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-primary/70 transition-colors ml-0.5"
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
              placeholder="+ tag"
              className="text-xs px-1.5 py-0.5 w-16 rounded border border-transparent hover:border-border bg-transparent focus:outline-none focus:border-primary placeholder:text-muted-foreground"
            />

            {/* Right side: status & actions */}
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              {savingStatus === 'saving' && (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 border border-primary border-t-transparent rounded-full animate-spin" />
                  Saving
                </span>
              )}
              {savingStatus === 'saved' && (
                <span className="text-green-500 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Saved
                </span>
              )}
              {savingStatus === 'idle' && existingNote.updatedAt && (
                <span className="hidden sm:inline">{new Date(existingNote.updatedAt).toLocaleDateString()}</span>
              )}
              
              <button
                onClick={existingNote.isPublic ? () => setShowShareModal(true) : handleShare}
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                title="Share"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              
              <button
                onClick={handleDelete}
                className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Editor content */}
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
                onClick={(e) => e.currentTarget.select()}
                className="flex-1 bg-transparent text-sm outline-none cursor-pointer select-all"
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

