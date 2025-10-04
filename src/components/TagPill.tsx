import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeTagInput } from '@/lib/hashtagUtils';

interface TagPillProps {
  tag: string;
  variant?: 'default' | 'interactive' | 'removable' | 'suggestion';
  size?: 'sm' | 'md' | 'lg';
  onRemove?: (tag: string) => void;
  onClick?: (tag: string) => void;
  isSelected?: boolean;
  className?: string;
}

export const TagPill: React.FC<TagPillProps> = ({
  tag,
  variant = 'default',
  size = 'md',
  onRemove,
  onClick,
  isSelected = false,
  className,
}) => {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.(tag);
  };

  const handleClick = () => {
    onClick?.(tag);
  };

  const baseClasses = cn(
    'inline-flex items-center gap-1 rounded-full font-medium transition-all',
    'border border-border/50 bg-muted/30 text-muted-foreground',
    'hover:bg-muted/50 hover:text-foreground',
    // Size variants
    size === 'sm' && 'px-2 py-0.5 text-xs',
    size === 'md' && 'px-3 py-1 text-sm',
    size === 'lg' && 'px-4 py-1.5 text-base',
    // Style variants
    variant === 'interactive' && 'cursor-pointer hover:border-primary/50 hover:bg-primary/5',
    variant === 'removable' && 'pr-1',
    variant === 'suggestion' && 'border-dashed border-accent/50 bg-accent/20 text-accent-foreground hover:bg-accent/30',
    // Selected state
    isSelected && 'bg-primary/20 border-primary/50 text-primary-foreground',
    className
  );

  const pillVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 15,
      }
    },
    exit: { 
      scale: 0, 
      opacity: 0,
      transition: {
        duration: 0.15,
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 10,
      }
    },
    tap: {
      scale: 0.95,
    }
  };

  return (
    <motion.div
      className={baseClasses}
      onClick={handleClick}
      variants={pillVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      whileTap="tap"
    >
      <span className="truncate max-w-32">{tag}</span>
      {variant === 'removable' && onRemove && (
        <motion.button
          onClick={handleRemove}
          className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-muted-foreground/20 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-3 h-3" />
        </motion.button>
      )}
    </motion.div>
  );
};

interface TagListProps {
  tags: string[];
  variant?: TagPillProps['variant'];
  size?: TagPillProps['size'];
  onRemove?: (tag: string) => void;
  onClick?: (tag: string) => void;
  selectedTags?: string[];
  className?: string;
  maxTags?: number;
}

export const TagList: React.FC<TagListProps> = ({
  tags,
  variant = 'default',
  size = 'md',
  onRemove,
  onClick,
  selectedTags = [],
  className,
  maxTags,
}) => {
  const displayTags = maxTags ? tags.slice(0, maxTags) : tags;
  const remainingCount = maxTags && tags.length > maxTags ? tags.length - maxTags : 0;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {displayTags.map((tag) => (
        <TagPill
          key={tag}
          tag={tag}
          variant={variant}
          size={size}
          onRemove={onRemove}
          onClick={onClick}
          isSelected={selectedTags.includes(tag)}
        />
      ))}
      {remainingCount > 0 && (
        <TagPill
          tag={`+${remainingCount} more`}
          variant="default"
          size={size}
          className="bg-muted/50 text-muted-foreground/70"
        />
      )}
    </div>
  );
};

interface TagInputProps {
  tags: string[];
  suggestedTags?: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  placeholder?: string;
  className?: string;
  maxTags?: number;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  suggestedTags = [],
  onAddTag,
  onRemoveTag,
  placeholder = 'Add tags...',
  className,
  maxTags = 10,
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestedTags.filter(
    (tag) => 
      !tags.includes(tag) && 
      tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(value.length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue.trim());
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onRemoveTag(tags[tags.length - 1]);
    }
  };

  const addTag = (tag: string) => {
    const normalizedTag = normalizeTagInput(tag);
    if (normalizedTag && !tags.includes(normalizedTag) && tags.length < maxTags) {
      onAddTag(normalizedTag);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (tag: string) => {
    addTag(tag);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected Tags */}
      {tags.length > 0 && (
        <TagList
          tags={tags}
          variant="removable"
          size="md"
          onRemove={onRemoveTag}
        />
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(inputValue.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={tags.length >= maxTags ? 'Max tags reached' : placeholder}
          disabled={tags.length >= maxTags}
          className="w-full px-3 py-2 bg-muted/30 border border-border/50 rounded-xl 
                     text-foreground placeholder:text-muted-foreground
                     focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Suggestions */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-xl shadow-lg z-10 max-h-32 overflow-y-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {filteredSuggestions.slice(0, 8).map((tag) => (
              <motion.button
                key={tag}
                onClick={() => handleSuggestionClick(tag)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent/50 first:rounded-t-xl last:rounded-b-xl transition-colors"
                whileHover={{ backgroundColor: 'var(--accent)' }}
              >
                {tag}
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Suggested Tags */}
      {!showSuggestions && inputValue === '' && suggestedTags.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Suggested:</p>
          <TagList
            tags={suggestedTags.filter(tag => !tags.includes(tag)).slice(0, 6)}
            variant="suggestion"
            size="sm"
            onClick={handleSuggestionClick}
          />
        </div>
      )}
    </div>
  );
}; 