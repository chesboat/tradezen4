import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Hash, Check } from 'lucide-react';
import { useTagStore, TAG_COLORS, TagColor } from '@/store/useTagStore';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[]; // Array of tag names
  onChange: (tags: string[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Apple-style tag input with autocomplete and color coding
 * - Pills for existing tags (x to remove)
 * - Input field for new tags
 * - Autocomplete dropdown (existing tags)
 * - Accepts comma or Enter to add tag (spaces allowed in tag names)
 */
export const TagInput: React.FC<TagInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Add tags (press Enter or comma to save)',
  autoFocus = false,
  className,
}) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { getOrCreateTag, suggestTags, getTagColor, incrementUsage } = useTagStore();

  // Get suggestions based on input
  const suggestions = suggestTags(input, 5).filter(
    (tag) => !value.includes(tag.name)
  );

  // Focus input on mount if autoFocus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Update dropdown position when it opens or on scroll
  useEffect(() => {
    const updatePosition = () => {
      if (showSuggestions && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Use actual height if available, otherwise estimate based on number of suggestions
        const estimatedHeight = dropdownRef.current?.offsetHeight || Math.min(suggestions.length * 45 + 10, 200);
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const gap = 4; // Smaller gap for tighter positioning
        
        // Determine if dropdown should appear above or below
        const shouldShowAbove = spaceBelow < estimatedHeight + gap && spaceAbove > spaceBelow;
        
        // For fixed positioning, use viewport coordinates (no scrollY/scrollX needed)
        setDropdownPosition({
          top: shouldShowAbove 
            ? rect.top - estimatedHeight - gap 
            : rect.bottom + gap,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    // Initial position
    updatePosition();
    
    // Re-calculate after a brief delay to use actual rendered height
    const timeoutId = setTimeout(updatePosition, 10);

    // Update position on scroll and resize
    if (showSuggestions) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
    
    return () => clearTimeout(timeoutId);
  }, [showSuggestions, suggestions.length]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tagName: string) => {
    const normalized = tagName.toLowerCase().trim().replace(/^#/, '');
    
    if (!normalized) return;
    if (value.includes(normalized)) return; // Already exists
    
    // Create or get tag metadata
    const tag = getOrCreateTag(normalized);
    incrementUsage(normalized);
    
    // Add to value
    onChange([...value, normalized]);
    setInput('');
    setShowSuggestions(false);
    setSelectedIndex(0);
    
    // Keep focus on input
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter or Comma - add tag
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      
      if (showSuggestions && suggestions.length > 0) {
        // Select from suggestions
        addTag(suggestions[selectedIndex].name);
      } else if (input.trim()) {
        // Add new tag
        addTag(input);
      }
      return;
    }

    // Backspace on empty input - remove last tag
    if (e.key === 'Backspace' && !input && value.length > 0) {
      e.preventDefault();
      removeTag(value[value.length - 1]);
      return;
    }

    // Arrow navigation in suggestions
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value;
    setInput(newInput);
    setShowSuggestions(newInput.trim().length > 0);
    setSelectedIndex(0);
  };

  const handleInputFocus = () => {
    if (input.trim().length > 0 || value.length === 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Tag Pills + Input */}
      <div className="flex flex-wrap gap-1.5 p-2 bg-muted/30 rounded-lg border border-border focus-within:ring-2 focus-within:ring-primary/50 transition-all">
        
        {/* Existing Tags */}
        <AnimatePresence mode="popLayout">
          {value.map((tag) => {
            const color = getTagColor(tag);
            const colorStyles = TAG_COLORS[color];
            
            return (
              <motion.div
                key={tag}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
                  colorStyles.bg,
                  colorStyles.text,
                  colorStyles.border
                )}
              >
                <span>#{tag}</span>
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                  type="button"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>

      {/* Autocomplete Suggestions - Rendered as Portal to avoid clipping */}
      {showSuggestions && suggestions.length > 0 && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="fixed bg-popover border border-border rounded-lg shadow-xl z-[9999] overflow-y-auto"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxHeight: '200px',
            }}
          >
            {suggestions.map((tag, index) => {
              const colorStyles = TAG_COLORS[tag.color];
              const isSelected = index === selectedIndex;
              
              return (
                <button
                  key={tag.name}
                  onClick={() => addTag(tag.name)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                    isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                  )}
                  type="button"
                >
                  {/* Color indicator */}
                  <div
                    className={cn('w-3 h-3 rounded-full', colorStyles.bg, colorStyles.border, 'border')}
                  />
                  
                  {/* Tag name */}
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">#{tag.displayName}</span>
                    {tag.usageCount > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({tag.usageCount} {tag.usageCount === 1 ? 'trade' : 'trades'})
                      </span>
                    )}
                  </div>

                  {/* Selected indicator */}
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Helper text */}
      {value.length === 0 && !showSuggestions && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Type and press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> or{' '}
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">,</kbd> to add tags
        </p>
      )}
    </div>
  );
};

/**
 * Tag Pill (read-only display)
 * Used in tables, cards, etc.
 * Supports long-press on mobile and right-click on desktop for context menu
 */
interface TagPillProps {
  tag: string;
  onClick?: () => void;
  onRemove?: () => void;
  onContextMenu?: (e: React.MouseEvent | React.TouchEvent) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const TagPill: React.FC<TagPillProps> = ({
  tag,
  onClick,
  onRemove,
  onContextMenu,
  size = 'sm',
  className,
}) => {
  const { getTagColor } = useTagStore();
  const color = getTagColor(tag);
  const colorStyles = TAG_COLORS[color];
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!onContextMenu) return;
    
    const timer = setTimeout(() => {
      // Vibrate on long-press (if supported)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      onContextMenu(e);
    }, 500); // 500ms long press
    
    setLongPressTimer(timer);
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    if (!onContextMenu) return;
    e.preventDefault();
    onContextMenu(e);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      onContextMenu={handleRightClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium border transition-colors select-none',
        colorStyles.bg,
        colorStyles.text,
        colorStyles.border,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        (onClick || onContextMenu) && 'cursor-pointer hover:opacity-80',
        className
      )}
      type="button"
    >
      <span>#{tag}</span>
      {onRemove && (
        <X
          className={cn('cursor-pointer hover:bg-black/10 rounded-full', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </motion.button>
  );
};

