import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Tag, Smile, Link, Save, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MoodType } from '@/types';
type Timeout = ReturnType<typeof setTimeout>;
import { useQuickNoteStore, useQuickNoteModal, useQuickNoteTags } from '@/store/useQuickNoteStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { TagInput } from '@/components/TagPill';
import { getMoodEmoji } from '@/lib/localStorageUtils';

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [showNotesToggle, setShowNotesToggle] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<number>();

  // Load existing note if editing
  useEffect(() => {
    if (editingNoteId) {
      const noteToEdit = notes.find(note => note.id === editingNoteId);
      if (noteToEdit) {
        setFormData({
          content: noteToEdit.content,
          tags: noteToEdit.tags,
          mood: noteToEdit.mood,
        });
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

  const handleSave = async () => {
    if (!selectedAccountId || !formData.content.trim()) return;

    setIsLoading(true);

    try {
      const noteData = {
        content: formData.content.trim(),
        tags: formData.tags,
        mood: formData.mood,
        attachedToTradeId: attachToTradeId,
        accountId: selectedAccountId,
      };

      if (editingNoteId) {
        updateNote(editingNoteId, noteData);
      } else {
        const newNote = await addNote(noteData);
        
        // Add to activity log
        addActivity({
          type: 'note',
          title: 'Quick Note Added',
          description: formData.content.length > 50 
            ? `${formData.content.substring(0, 50)}...`
            : formData.content,
          xpEarned: 5,
          relatedId: newNote.id,
          accountId: selectedAccountId,
        });

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
              "fixed inset-4 w-full max-w-lg mx-auto bg-card border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]",
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
              {/* Note Text */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-muted-foreground">
                  What's on your mind?
                </label>
                <textarea
                  ref={textareaRef}
                  value={formData.content}
                  onChange={handleContentChange}
                  placeholder="Trade idea, emotion, lesson learned, mistake to avoid..."
                  className="w-full min-h-[100px] max-h-[200px] px-4 py-3 bg-muted/30 border border-border/50 rounded-xl 
                           text-foreground placeholder:text-muted-foreground resize-none
                           focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
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
                        <p className="text-sm text-foreground line-clamp-2">
                          {note.content}
                        </p>
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
                        +5 XP earned
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