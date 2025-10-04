import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Tag, 
  Hash, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { generateReflectionTags, COMMON_REFLECTION_TAGS } from '@/lib/ai/generateReflectionTags';
import { normalizeTagInput } from '@/lib/hashtagUtils';
import { cn } from '@/lib/utils';

interface ReflectionTagPickerProps {
  date: string; // YYYY-MM-DD format
  className?: string;
  showSuggestedTags?: boolean;
}

export const ReflectionTagPicker: React.FC<ReflectionTagPickerProps> = ({
  date,
  className,
  showSuggestedTags = true
}) => {
  const { selectedAccountId } = useAccountFilterStore();
  const { addActivity } = useActivityLogStore();
  const {
    reflections,
    addReflectionTag,
    removeReflectionTag,
    getAllUsedTags
  } = useDailyReflectionStore();

  // Get current reflection for AI tag suggestions with proper reactivity
  const reflection = useMemo(() => {
    if (!selectedAccountId) return null;
    return reflections.find((r) => 
      r.date === date && r.accountId === selectedAccountId
    );
  }, [reflections, date, selectedAccountId]);
  
  // Component state
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current tags for this reflection with proper reactivity
  const currentTags = useMemo(() => {
    return reflection?.reflectionTags || [];
  }, [reflection?.reflectionTags]);

  // Get all previously used tags for autocomplete
  const allUsedTags = useMemo(() => {
    return getAllUsedTags(selectedAccountId || undefined);
  }, [selectedAccountId, getAllUsedTags]);

  // Combine common tags with user's previously used tags
  const autocompleteOptions = useMemo(() => {
    const combined = [...new Set([...allUsedTags, ...COMMON_REFLECTION_TAGS])];
    
    // Filter out already selected tags and match input
    return combined
      .filter(tag => 
        !currentTags.includes(tag) && 
        tag.toLowerCase().includes(inputValue.toLowerCase())
      )
      .sort()
      .slice(0, 8); // Limit to 8 suggestions
  }, [allUsedTags, currentTags, inputValue]);

  // Generate AI suggestions when reflection content changes
  useEffect(() => {
    if (!reflection?.reflection || !showSuggestedTags) return;

    const generateSuggestions = async () => {
      if (reflection.aiSummary && currentTags.length === 0) {
        // Only generate suggestions if we don't have tags yet
        setIsGeneratingSuggestions(true);
        try {
          const tags = await generateReflectionTags(reflection.reflection);
          setSuggestedTags(tags.filter(tag => !currentTags.includes(tag)));
        } catch (error) {
          console.error('Failed to generate tag suggestions:', error);
        } finally {
          setIsGeneratingSuggestions(false);
        }
      }
    };

    generateSuggestions();
  }, [reflection?.reflection, reflection?.aiSummary, currentTags.length, showSuggestedTags]);

  // Calculate dropdown position
  const calculateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4, // 4px margin
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // Handle dropdown open/close
  const handleDropdownToggle = (show: boolean) => {
    if (show) {
      calculateDropdownPosition();
    }
    setShowDropdown(show);
  };

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        handleDropdownToggle(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update dropdown position on scroll/resize
  useEffect(() => {
    if (!showDropdown) return;

    const handleReposition = () => {
      calculateDropdownPosition();
    };

    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [showDropdown]);

  const handleAddTag = (tag: string) => {
    const normalizedTag = normalizeTagInput(tag);
    if (!normalizedTag || !selectedAccountId) return;

    addReflectionTag(date, normalizedTag, selectedAccountId);
    
    // Log activity
    addActivity({
      type: 'journal',
      title: 'Reflection Tag Added',
      description: `Added tag: ${normalizedTag}`,
      xpEarned: 5,
      relatedId: reflection?.id,
      accountId: selectedAccountId,
    });

    // Clear input and close dropdown
    setInputValue('');
    handleDropdownToggle(false);
    
    // Remove from suggested tags if it was there
    setSuggestedTags(prev => prev.filter(t => t !== normalizedTag));
  };

  const handleRemoveTag = (tag: string) => {
    if (!selectedAccountId) return;

    removeReflectionTag(date, tag, selectedAccountId);
    
    // Log activity
    addActivity({
      type: 'journal',
      title: 'Reflection Tag Removed',
      description: `Removed tag: ${tag}`,
      xpEarned: 2,
      relatedId: reflection?.id,
      accountId: selectedAccountId,
    });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        handleAddTag(inputValue);
      }
    } else if (e.key === 'Escape') {
      handleDropdownToggle(false);
      setInputValue('');
    }
  };

  const handleSuggestedTagClick = (tag: string) => {
    handleAddTag(tag);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Current Tags */}
      {currentTags.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Tags</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {currentTags.map((tag) => (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="group"
                >
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Add Tag Input */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => handleDropdownToggle(true)}
              onKeyDown={handleInputKeyDown}
              placeholder="Add a tag..."
              className="w-full px-3 py-2 pl-8 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <Tag className="absolute left-2.5 top-2.5 w-3 h-3 text-muted-foreground" />
          </div>
          
          {inputValue.trim() && (
            <button
              onClick={() => handleAddTag(inputValue)}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown - Rendered as Portal */}
        {showDropdown && autocompleteOptions.length > 0 && createPortal(
          <AnimatePresence>
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="fixed bg-card border border-border rounded-lg shadow-lg z-[9999] max-h-40 overflow-y-auto"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
              }}
            >
              {autocompleteOptions.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleAddTag(tag)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Hash className="w-3 h-3 text-muted-foreground" />
                  {tag}
                </button>
              ))}
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
      </div>

      {/* AI Suggested Tags */}
      {showSuggestedTags && (suggestedTags.length > 0 || isGeneratingSuggestions) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-500">
              {isGeneratingSuggestions ? 'Generating suggestions...' : 'Suggested Tags'}
            </span>
          </div>
          
          {isGeneratingSuggestions ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
              <span className="text-sm text-muted-foreground">Analyzing reflection...</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {suggestedTags.map((tag) => (
                  <motion.button
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleSuggestedTagClick(tag)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors border border-purple-200 dark:border-purple-800"
                  >
                    <Plus className="w-3 h-3" />
                    {tag}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {currentTags.length === 0 && !isGeneratingSuggestions && suggestedTags.length === 0 && (
        <div className="text-center py-4">
          <Hash className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">
            Add tags to categorize your reflection
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tags help you find patterns and insights over time
          </p>
        </div>
      )}
    </div>
  );
}; 