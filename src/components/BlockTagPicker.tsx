import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, X, Plus, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlockTagPickerProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags?: string[];
  className?: string;
  placeholder?: string;
}

export const BlockTagPicker: React.FC<BlockTagPickerProps> = ({
  tags,
  onTagsChange,
  availableTags = [],
  className,
  placeholder = "Add tags..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Common trading tags for suggestions
  const commonTags = useMemo(() => [
    'breakout', 'support', 'resistance', 'trend', 'reversal', 'momentum',
    'scalp', 'swing', 'day-trade', 'analysis', 'setup', 'entry', 'exit',
    'profit', 'loss', 'risk-management', 'psychology', 'discipline',
    'pattern', 'chart', 'technical', 'fundamental', 'news', 'earnings'
  ], []);

  const allAvailableTags = useMemo(() => (
    [...new Set([...(availableTags || []), ...commonTags])]
  ), [availableTags, commonTags]);

  // Derive filtered tags without setState to avoid render loops
  const filteredTags = useMemo(() => {
    if (inputValue) {
      return allAvailableTags.filter(tag => 
        tag.toLowerCase().includes(inputValue.toLowerCase()) &&
        !tags.includes(tag)
      );
    }
    return allAvailableTags.filter(tag => !tags.includes(tag)).slice(0, 8);
  }, [inputValue, tags, allAvailableTags]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setInputValue('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      onTagsChange([...tags, tag]);
      setInputValue('');
      setIsOpen(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue.trim());
      } else if (filteredTags.length > 0) {
        addTag(filteredTags[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Tags Display */}
      <div className="flex flex-wrap gap-2 mb-2">
        <AnimatePresence>
          {tags.map((tag, index) => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium group hover:bg-primary/20 transition-colors"
            >
              <Hash className="w-3 h-3" />
              <span>{tag}</span>
              <button
                onClick={() => removeTag(tag)}
                className="opacity-0 group-hover:opacity-100 hover:bg-primary/20 rounded p-0.5 transition-all"
                title="Remove tag"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Add Tag Button */}
        <motion.button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          className="flex items-center gap-1 px-2 py-1 border border-dashed border-border hover:border-primary/50 rounded-lg text-xs text-muted-foreground hover:text-primary transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-3 h-3" />
          <span>Tag</span>
        </motion.button>
      </div>

      {/* Input and Suggestions */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-10 mt-1"
          >
            <div className="bg-card border border-border rounded-lg shadow-lg p-2">
              {/* Input */}
              <div className="flex items-center gap-2 p-2 border border-border rounded-lg mb-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
              </div>
              
              {/* Suggestions */}
              {filteredTags.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  <div className="text-xs text-muted-foreground px-2 py-1">
                    Suggestions
                  </div>
                  {filteredTags.map((tag) => (
                    <motion.button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-muted rounded transition-colors"
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.1 }}
                    >
                      <Hash className="w-3 h-3 text-muted-foreground" />
                      <span>{tag}</span>
                    </motion.button>
                  ))}
                </div>
              )}
              
              {inputValue && !filteredTags.some(tag => tag.toLowerCase() === inputValue.toLowerCase()) && (
                <motion.button
                  onClick={() => addTag(inputValue)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-muted rounded transition-colors border-t border-border mt-2 pt-2"
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.1 }}
                >
                  <Plus className="w-3 h-3 text-primary" />
                  <span>Create "{inputValue}"</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
