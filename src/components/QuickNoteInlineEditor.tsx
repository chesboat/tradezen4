import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Hash, X, Plus, Save, Trash2, Check, Loader2 } from 'lucide-react';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { cn } from '@/lib/utils';
import { normalizeTagInput } from '@/lib/hashtagUtils';
import toast from 'react-hot-toast';
import { NoteContent } from './NoteContent';

interface QuickNoteInlineEditorProps {
  noteId: string;
  onClose?: () => void;
  onDelete?: () => void;
}

export const QuickNoteInlineEditor: React.FC<QuickNoteInlineEditorProps> = ({ noteId, onClose, onDelete }) => {
  const { notes, updateNote } = useQuickNoteStore();
  const existingNote = notes.find(n => n.id === noteId);
  
  const [content, setContent] = useState(existingNote?.content || '');
  const [tags, setTags] = useState<string[]>(existingNote?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [hasChanges, setHasChanges] = useState(false);
  
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const newTagInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Store initial values to detect changes
  const initialValuesRef = useRef({
    content: existingNote?.content || '',
    tags: existingNote?.tags || [],
  });

  // Detect changes
  useEffect(() => {
    const contentChanged = content !== initialValuesRef.current.content;
    const tagsChanged = JSON.stringify(tags) !== JSON.stringify(initialValuesRef.current.tags);
    setHasChanges(contentChanged || tagsChanged);
  }, [content, tags]);

  // Auto-save when changes are made
  useEffect(() => {
    if (!hasChanges || !isEditing) return;
    
    setSavingStatus('saving');
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateNote(noteId, {
          content,
          tags,
        });
        
        // Update initial values
        initialValuesRef.current = { content, tags };
        setHasChanges(false);
        setSavingStatus('saved');
        
        setTimeout(() => setSavingStatus('idle'), 2000);
      } catch (error) {
        console.error('Failed to auto-save note:', error);
        toast.error('Failed to save changes');
        setSavingStatus('idle');
      }
    }, 1000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, tags, hasChanges, isEditing, noteId, updateNote]);

  // Auto-resize textarea
  useEffect(() => {
    if (contentTextareaRef.current && isEditing) {
      contentTextareaRef.current.style.height = 'auto';
      contentTextareaRef.current.style.height = contentTextareaRef.current.scrollHeight + 'px';
    }
  }, [content, isEditing]);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleDelete = async () => {
    if (confirm('Delete this quick note?')) {
      onDelete?.();
    }
  };

  const handleStartEditing = (focusTarget?: 'content' | 'tags') => {
    setIsEditing(true);
    setTimeout(() => {
      if (focusTarget === 'tags') {
        newTagInputRef.current?.focus();
      } else {
        contentTextareaRef.current?.focus();
        contentTextareaRef.current?.setSelectionRange(content.length, content.length);
      }
    }, 0);
  };

  const handleStopEditing = () => {
    setIsEditing(false);
  };

  if (!existingNote) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Note not found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        {/* Mobile Back Button */}
        <button
          onClick={onClose}
          className="md:hidden mr-3 p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">Quick Note</h2>
            {savingStatus === 'saving' && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            {savingStatus === 'saved' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 text-xs text-green-600"
              >
                <Check className="w-3 h-3" />
                <span>Saved</span>
              </motion.div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(existingNote.updatedAt).toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => handleStartEditing('content')}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Edit
            </button>
          ) : (
            <button
              onClick={handleStopEditing}
              className="px-3 py-1.5 text-sm bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              Done
            </button>
          )}
          
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
            title="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4 max-w-4xl mx-auto">
          {isEditing ? (
            <textarea
              ref={contentTextareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[200px] px-0 py-0 bg-transparent border-0 resize-none focus:outline-none text-base text-foreground leading-relaxed"
              placeholder="Write your note..."
            />
          ) : (
            <div 
              onClick={() => handleStartEditing('content')}
              className="min-h-[200px] cursor-text hover:bg-muted/20 rounded-lg p-4 -mx-4 transition-colors"
            >
              <NoteContent 
                content={content || 'Click to edit...'} 
                className={cn(
                  "text-base text-foreground leading-relaxed whitespace-pre-wrap",
                  !content && "text-muted-foreground"
                )} 
              />
            </div>
          )}
        </div>

        {/* Tags Section */}
        <div 
          className={cn(
            "px-6 py-4 border-t border-border max-w-4xl mx-auto",
            !isEditing && "cursor-pointer hover:bg-muted/20 transition-colors"
          )}
          onClick={!isEditing ? () => handleStartEditing('tags') : undefined}
        >
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Tags</span>
            {!isEditing && (
              <span className="text-xs text-muted-foreground">(click to edit)</span>
            )}
          </div>
          
          {/* Existing Tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            <AnimatePresence>
              {tags.map(tag => (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                  onClick={(e) => isEditing && e.stopPropagation()}
                >
                  <Hash className="w-3 h-3" />
                  <span>{tag}</span>
                  {isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTag(tag);
                      }}
                      className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            
            {tags.length === 0 && !isEditing && (
              <p className="text-sm text-muted-foreground">No tags - click to add</p>
            )}
          </div>
          
          {/* Add New Tag (only when editing) */}
          {isEditing && (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <div className="relative flex-1">
                <Hash className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={newTagInputRef}
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add tag..."
                  className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
                />
              </div>
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

