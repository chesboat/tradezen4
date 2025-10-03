import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Tag, Smile, Link, Save, Sparkles, Image as ImageIcon, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MoodType } from '@/types';
type Timeout = ReturnType<typeof setTimeout>;
import { useQuickNoteStore, useQuickNoteModal, useQuickNoteTags } from '@/store/useQuickNoteStore';
import { useAccountFilterStore, getAccountIdsForSelection } from '@/store/useAccountFilterStore';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { TagInput } from '@/components/TagPill';
import { getMoodEmoji } from '@/lib/localStorageUtils';
import { useTodoStore } from '@/store/useTodoStore';
import { NoteContent } from './NoteContent';

interface QuickNoteModalProps {
  attachToTradeId?: string;
  className?: string;
}

interface QuickNoteFormData {
  content: string;
  tags: string[];
  mood?: MoodType;
}

const moodOptions: { mood: MoodType; emoji: string; label: string }[] = [
  { mood: 'excellent', emoji: '🤩', label: 'Excellent' },
  { mood: 'good', emoji: '😊', label: 'Good' },
  { mood: 'neutral', emoji: '😐', label: 'Neutral' },
  { mood: 'poor', emoji: '😕', label: 'Poor' },
  { mood: 'terrible', emoji: '😢', label: 'Terrible' },
];

export const QuickNoteModal: React.FC<QuickNoteModalProps> = ({
  attachToTradeId,
  className,
}) => {
  const { selectedAccountId } = useAccountFilterStore();
  const { addActivity } = useActivityLogStore();
  const { addNote, updateNote, notes } = useQuickNoteStore();
  const { 
    isModalOpen, 
    editingNoteId, 
    draftNote, 
    closeModal, 
    saveDraft, 
    loadDraft, 
    clearDraft 
  } = useQuickNoteModal();
  const { suggestedTags, addTag } = useQuickNoteTags();

  const [formData, setFormData] = useState<QuickNoteFormData>({
    content: '',
    tags: [],
    mood: undefined,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showNotesToggle, setShowNotesToggle] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const { addTask } = useTodoStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const noteContainerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<number>();

  // Load existing note if editing - Apple-style: separate images from text
  useEffect(() => {
    if (editingNoteId) {
      const noteToEdit = notes.find(note => note.id === editingNoteId);
      if (noteToEdit) {
        // Extract images from markdown content
        const imageRegex = /!\[image\]\((https?:\/\/[^)]+)\)/g;
        const images: string[] = [];
        let match;
        while ((match = imageRegex.exec(noteToEdit.content)) !== null) {
          images.push(match[1]);
        }
        
        // Remove image markdown from visible content
        const textContent = noteToEdit.content.replace(imageRegex, '').trim();
        
        setFormData({
          content: textContent,
          tags: noteToEdit.tags,
          mood: noteToEdit.mood,
        });
        setUploadedImages(images);
      }
    } else {
      // Load draft if available
      const draft = loadDraft();
      if (draft) {
        setFormData({
          content: draft.content || '',
          tags: draft.tags || [],
          mood: draft.mood,
        });
        setUploadedImages([]);
      }
    }
  }, [editingNoteId, notes, loadDraft]);

  // Auto-save draft functionality
  useEffect(() => {
    if (!editingNoteId && (formData.content || formData.tags.length > 0)) {
      setAutoSaveStatus('saving');
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = window.setTimeout(() => {
        saveDraft(formData);
        setAutoSaveStatus('saved');
        
        // Clear status after 2 seconds
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      }, 1000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [formData, editingNoteId, saveDraft]);

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isModalOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
    // Lock horizontal scroll while modal is open
    try {
      if (isModalOpen) {
        document.documentElement.style.overflowX = 'hidden';
        document.body.style.overflowX = 'hidden';
      } else {
        document.documentElement.style.overflowX = '';
        document.body.style.overflowX = '';
      }
    } catch {}
  }, [isModalOpen]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, content: value }));
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleTagAdd = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      addTag(tag);
    }
  };

  const handleTagRemove = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleMoodSelect = (mood: MoodType) => {
    setFormData(prev => ({ ...prev, mood: prev.mood === mood ? undefined : mood }));
  };

  // 🍎 Apple Notes-style image handling
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      console.warn('Not an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      console.warn('File too large (max 10MB)');
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploadedUrl = await useQuickNoteStore.getState().uploadImage(file);
      setUploadedImages(prev => [...prev, uploadedUrl]);
      // Apple-style: Don't show markdown in textarea - just keep images in gallery
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle drag and drop (Apple Notes style - entire note area is drop zone)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the container entirely
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    
    for (const file of imageFiles) {
      await handleImageUpload(file);
    }
  };

  // Handle paste (Cmd+V) - Apple Notes style
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Only handle if modal is open and textarea is focused
      if (!isModalOpen || document.activeElement !== textareaRef.current) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            await handleImageUpload(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isModalOpen]);

  const handleRemoveImage = (imageUrl: string) => {
    setUploadedImages(prev => prev.filter(url => url !== imageUrl));
    // Apple-style: Images are separate from text, no need to modify content
  };

  const handleSave = async () => {
    // Combine text content with image markdown (Apple-style: hidden from user, added on save)
    const textContent = formData.content.trim();
    const imageMarkdown = uploadedImages.map(url => `![image](${url})`).join('\n\n');
    const finalContent = textContent && imageMarkdown 
      ? `${textContent}\n\n${imageMarkdown}`
      : textContent || imageMarkdown;

    if (!selectedAccountId || !finalContent) return;

    setIsLoading(true);

    try {
      const targetAccountIds = getAccountIdsForSelection(selectedAccountId);
      const baseNote = {
        content: finalContent, // Apple-style: Combined text + image markdown
        tags: formData.tags,
        mood: formData.mood,
        attachedToTradeId: attachToTradeId,
      } as const;

      if (editingNoteId) {
        // Editing updates only the current note
        updateNote(editingNoteId, { ...baseNote, accountId: selectedAccountId });
      } else {
        // Create a note for each account in the selection (group or single)
        const created = [] as { id: string; accountId: string }[];
        for (const accountId of targetAccountIds) {
          const newNote = await addNote({ ...baseNote, accountId });
          created.push({ id: newNote.id, accountId });
          addActivity({
            type: 'note',
            title: 'Quick Note Added',
            description: textContent.length > 50 
              ? `${textContent.substring(0, 50)}...`
              : textContent || 'Image attachment',
            // Quick notes don't award XP - remove misleading xpEarned field
            relatedId: newNote.id,
            accountId,
          });
        }

        // Clear draft after successful save
        clearDraft();
      }

      setShowSuccess(true);
      
      // Auto-close after success animation
      setTimeout(() => {
        onClose();
        setShowSuccess(false);
      }, 1500);

    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onClose = () => {
    // Save draft if there's content and we're not editing
    if (!editingNoteId && (formData.content || formData.tags.length > 0)) {
      saveDraft(formData);
    }
    
    closeModal();
    setFormData({ content: '', tags: [], mood: undefined });
    setUploadedImages([]);
    setIsDragOver(false);
    setAutoSaveStatus('idle');
    setShowNotesToggle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave();
    }
  };

  const isFormValid = formData.content.trim().length > 0;

  const modalVariants = {
    hidden: {
      x: '100%',
      opacity: 0,
      scale: 0.95,
    },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      x: '100%',
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
  };

  const successVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 20,
      }
    },
  };

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className={cn(
              "fixed inset-4 w-full max-w-lg mx-auto bg-card border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] overflow-x-hidden",
              className
            )}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onKeyDown={handleKeyDown}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-card-foreground">
                  {editingNoteId ? 'Edit Note' : 'Quick Note'}
                </h2>
                {attachToTradeId && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-xs text-primary">
                    <Link className="w-3 h-3" />
                    Trade
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Auto-save status */}
                {autoSaveStatus !== 'idle' && (
                  <motion.div
                    className="flex items-center gap-1 text-xs text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {autoSaveStatus === 'saving' && (
                      <>
                        <motion.div
                          className="w-2 h-2 bg-yellow-500 rounded-full"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        />
                        Saving...
                      </>
                    )}
                    {autoSaveStatus === 'saved' && (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Saved
                      </>
                    )}
                  </motion.div>
                )}

                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Note Text - Apple Notes style drop zone */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  What's on your mind?
                </label>
                <div
                  ref={noteContainerRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "relative rounded-xl transition-all duration-200",
                    isDragOver && "ring-2 ring-primary/50 ring-offset-2"
                  )}
                >
                  <textarea
                    ref={textareaRef}
                    value={formData.content}
                    onChange={handleContentChange}
                    placeholder="Trade idea, emotion, lesson learned, mistake to avoid... (Drop images or press Cmd+V to paste)"
                    className={cn(
                      "w-full min-h-[100px] max-h-[200px] px-4 py-3 border rounded-xl",
                      "text-foreground placeholder:text-muted-foreground resize-none",
                      "focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                      "transition-all duration-200",
                      isDragOver
                        ? "bg-primary/5 border-primary/30"
                        : "bg-muted/30 border-border/50"
                    )}
                  />
                  {/* Apple-style drag overlay */}
                  <AnimatePresence>
                    {isDragOver && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-primary/10 rounded-xl border-2 border-dashed border-primary/50 flex items-center justify-center pointer-events-none"
                      >
                        <div className="flex flex-col items-center gap-2 text-primary">
                          <ImageIcon className="w-8 h-8" />
                          <p className="text-sm font-medium">Drop images here</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Uploaded Images Gallery - Apple style */}
                {uploadedImages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                  >
                    {uploadedImages.map((imageUrl, idx) => (
                      <motion.div
                        key={imageUrl}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative group"
                      >
                        <img
                          src={imageUrl}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-border/50"
                        />
                        <button
                          onClick={() => handleRemoveImage(imageUrl)}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center shadow-lg"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Upload status */}
                {isUploadingImage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Uploading image...</span>
                  </motion.div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    💡 Tip: Drop images or press Cmd+V to paste screenshots
                  </p>
                  <button
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs"
                    onClick={() => {
                      const text = formData.content.trim();
                      if (text) addTask(text.slice(0, 280)).catch(()=>{});
                    }}
                    title="Add as Task"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Add as Task
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Tag className="w-4 h-4" />
                  Tags
                </label>
                <TagInput
                  tags={formData.tags}
                  suggestedTags={suggestedTags}
                  onAddTag={handleTagAdd}
                  onRemoveTag={handleTagRemove}
                  placeholder="Add tags..."
                  maxTags={8}
                />
              </div>

              {/* Mood Selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Smile className="w-4 h-4" />
                  Mood (Optional)
                </label>
                <div className="flex gap-2">
                  {moodOptions.map(({ mood, emoji, label }) => (
                    <motion.button
                      key={mood}
                      onClick={() => handleMoodSelect(mood)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm',
                        formData.mood === mood
                          ? 'bg-primary/20 border-primary/50 text-primary-foreground'
                          : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-lg">{emoji}</span>
                      <span className="hidden sm:inline">{label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Collapsible Notes Toggle */}
              <motion.button
                onClick={() => setShowNotesToggle(!showNotesToggle)}
                className="w-full flex items-center justify-center gap-2 p-3 bg-muted/20 border border-border/50 rounded-xl 
                         text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-all"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <FileText className="w-4 h-4" />
                {showNotesToggle ? 'Hide' : 'Show'} Quick Notes
              </motion.button>

              {/* Collapsible Notes List */}
              <AnimatePresence>
                {showNotesToggle && (
                  <motion.div
                    className="space-y-2 max-h-48 overflow-y-auto"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <p className="text-sm text-muted-foreground">Recent Notes:</p>
                    {notes.slice(0, 5).map((note) => (
                      <motion.div
                        key={note.id}
                        className="p-3 bg-muted/20 border border-border/50 rounded-lg"
                        whileHover={{ backgroundColor: 'var(--muted)' }}
                      >
                        <div className="text-sm text-foreground line-clamp-2">
                          <NoteContent content={note.content} className="text-sm text-foreground leading-relaxed whitespace-pre-wrap" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {note.mood && (
                            <span className="text-xs">{getMoodEmoji(note.mood)}</span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border/50 flex-shrink-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>⌘Enter to save</span>
                <span>•</span>
                <span>Esc to close</span>
              </div>
              
              <motion.button
                onClick={handleSave}
                disabled={!isFormValid || isLoading}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
                  isFormValid
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                )}
                whileHover={isFormValid ? { scale: 1.02 } : {}}
                whileTap={isFormValid ? { scale: 0.98 } : {}}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Note
                  </>
                )}
              </motion.button>
            </div>

            {/* Success Animation */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  className="absolute inset-0 bg-card/95 backdrop-blur-sm flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className="flex flex-col items-center gap-4 text-center"
                    variants={successVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="relative">
                      <motion.div
                        className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5 }}
                      >
                        <FileText className="w-8 h-8 text-white" />
                      </motion.div>
                      <motion.div
                        className="absolute -top-2 -right-2"
                        animate={{ 
                          scale: [0, 1, 0],
                          rotate: [0, 180, 360] 
                        }}
                        transition={{ duration: 1, delay: 0.2 }}
                      >
                        <Sparkles className="w-6 h-6 text-yellow-500" />
                      </motion.div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {editingNoteId ? 'Note Updated!' : 'Note Saved!'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Note saved successfully
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 