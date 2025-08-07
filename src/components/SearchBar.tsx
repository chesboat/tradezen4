import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from '@/lib/localStorageUtils';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  className, 
  placeholder = 'Search trades, notes...', 
  onSearch 
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce((searchQuery: string) => {
      if (onSearch) {
        onSearch(searchQuery);
      }
    }, 300)
  ).current;

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleClear = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setQuery('');
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`relative flex items-center bg-muted rounded-xl border transition-all duration-200 ${
          isFocused 
            ? 'border-primary shadow-glow-sm' 
            : 'border-border hover:border-primary/50'
        }`}
        animate={{
          scale: isFocused ? 1.02 : 1,
        }}
        transition={{
          duration: 0.2,
          ease: 'easeOut',
        }}
      >
        <Search className="w-4 h-4 text-muted-foreground ml-3 flex-shrink-0" />
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 bg-transparent text-foreground placeholder-muted-foreground text-sm focus:outline-none"
        />
        
        <AnimatePresence>
          {query && (
            <motion.button
              className="p-1 mr-2 rounded-full hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
              onClick={handleClear}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Search results dropdown could go here */}
    </div>
  );
}; 