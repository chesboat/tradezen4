import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Hash, Pin, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useReflectionTemplateStore } from '@/store/useReflectionTemplateStore';
import { cn } from '@/lib/utils';

interface SmartTagFilterBarProps {
  className?: string;
}

interface TagWithFrequency {
  tag: string;
  frequency: number;
  isPinned: boolean;
}

export const SmartTagFilterBar: React.FC<SmartTagFilterBarProps> = ({ className }) => {
  const { selectedAccountId } = useAccountFilterStore();
  const { 
    selectedTagFilter, 
    setSelectedTagFilter, 
    clearTagFilter,
    getAllUsedTags: getReflectionTags,
    pinnedTags,
    togglePinnedTag,
    getTagFrequency
  } = useDailyReflectionStore();
  const { allTags: quickNoteTags, notes } = useQuickNoteStore();
  const { getAllInsightBlockTags, getInsightBlockTagFrequency } = useReflectionTemplateStore();

  // Local state
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Refs for dropdown positioning
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);

  // Combine tags from all sources with frequency calculation
  const allTagsWithFrequency = useMemo(() => {
    const reflectionTags = getReflectionTags(selectedAccountId || undefined);
    const insightBlockTags = getAllInsightBlockTags(selectedAccountId || undefined);
    
    // Filter quick note tags by account if needed
    const filteredQuickNoteTags = selectedAccountId 
      ? quickNoteTags.filter(tag => {
          return notes.some(note => 
            note.accountId === selectedAccountId && note.tags.includes(tag)
          );
        })
      : quickNoteTags;

    const combinedTags = [...new Set([...reflectionTags, ...filteredQuickNoteTags, ...insightBlockTags])];
    
    return combinedTags.map(tag => {
      // Calculate frequency from all sources
      const reflectionFreq = getTagFrequency(tag, selectedAccountId || undefined);
      const insightBlockFreq = getInsightBlockTagFrequency(tag, selectedAccountId || undefined);
      
      // Calculate quick note frequency
      const quickNoteFreq = notes.filter(note => {
        const matchesAccount = selectedAccountId ? note.accountId === selectedAccountId : true;
        return matchesAccount && note.tags.includes(tag);
      }).length;
      
      return {
        tag,
        frequency: reflectionFreq + quickNoteFreq + insightBlockFreq,
        isPinned: pinnedTags.includes(tag)
      };
    }).sort((a, b) => {
      // Sort by pinned first, then by frequency, then alphabetically
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      if (a.frequency !== b.frequency) return b.frequency - a.frequency;
      return a.tag.localeCompare(b.tag);
    });
  }, [getReflectionTags, quickNoteTags, getAllInsightBlockTags, selectedAccountId, notes, getTagFrequency, getInsightBlockTagFrequency, pinnedTags]);

  // Split tags into visible and overflow
  const maxVisibleTags = 8;
  const visibleTags = allTagsWithFrequency.slice(0, maxVisibleTags);
  const overflowTags = allTagsWithFrequency.slice(maxVisibleTags);

  // Filter tags for search
  const filteredSearchTags = useMemo(() => {
    if (!searchQuery.trim()) return allTagsWithFrequency;
    return allTagsWithFrequency.filter(({ tag }) =>
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allTagsWithFrequency, searchQuery]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(event.target as Node) &&
        !moreButtonRef.current?.contains(event.target as Node)
      ) {
        setShowMoreDropdown(false);
      }
      
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(event.target as Node) &&
        !searchButtonRef.current?.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTagClick = (tag: string) => {
    const isSelected = selectedTagFilter === tag;
    setSelectedTagFilter(isSelected ? null : tag);
    setShowMoreDropdown(false);
    setShowSearchDropdown(false);
    setSearchQuery('');
  };

  const handlePinToggle = (tag: string, event: React.MouseEvent) => {
    event.stopPropagation();
    togglePinnedTag(tag);
  };

  if (allTagsWithFrequency.length === 0) {
    return null; // Don't render if no tags available
  }

  return (
    <div className={cn("bg-card border-b sticky top-0 z-20 backdrop-blur-sm bg-card/80", className)}>
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filter by Tags</span>
            {selectedTagFilter && (
              <button
                onClick={clearTagFilter}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-2"
              >
                Clear
              </button>
            )}
          </div>
          
          {/* Search Button */}
          <div className="relative">
            <button
              ref={searchButtonRef}
              onClick={() => {
                setShowSearchDropdown(!showSearchDropdown);
                setShowMoreDropdown(false);
              }}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              title="Search all tags"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Search Dropdown */}
            <AnimatePresence>
              {showSearchDropdown && (
                <motion.div
                  ref={searchDropdownRef}
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-lg shadow-lg z-30"
                >
                  <div className="p-3 border-b">
                    <input
                      type="text"
                      placeholder="Search tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-muted rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredSearchTags.length > 0 ? (
                      filteredSearchTags.map(({ tag, frequency, isPinned }) => (
                        <button
                          key={tag}
                          onClick={() => handleTagClick(tag)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted transition-colors',
                            selectedTagFilter === tag && 'bg-primary/10 text-primary'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Hash className="w-3 h-3" />
                            <span className="text-sm">{tag}</span>
                            {isPinned && <Pin className="w-3 h-3 text-primary" />}
                          </div>
                          <span className="text-xs text-muted-foreground">{frequency}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No tags found
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tag Pills Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Visible Tags */}
          <AnimatePresence>
            {visibleTags.map(({ tag, frequency, isPinned }, index) => {
              const isSelected = selectedTagFilter === tag;
              
              return (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className="relative group"
                >
                  <motion.button
                    onClick={() => handleTagClick(tag)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
                      'hover:scale-105 active:scale-95 relative',
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isPinned && (
                      <Pin className="w-3 h-3 text-primary" />
                    )}
                    <Hash className="w-3 h-3" />
                    <span>{tag}</span>
                    <span className={cn(
                      'px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                      isSelected 
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-foreground/10 text-muted-foreground'
                    )}>
                      {frequency}
                    </span>
                    {isSelected && (
                      <X className="w-3 h-3 ml-0.5" />
                    )}
                  </motion.button>

                  {/* Pin Toggle Button */}
                  <button
                    onClick={(e) => handlePinToggle(tag, e)}
                    className={cn(
                      'absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center transition-all',
                      'opacity-0 group-hover:opacity-100 scale-75 hover:scale-100',
                      isPinned 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted-foreground text-background'
                    )}
                    title={isPinned ? 'Unpin tag' : 'Pin tag'}
                  >
                    <Pin className="w-2 h-2" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* More Button */}
          {overflowTags.length > 0 && (
            <div className="relative">
              <motion.button
                ref={moreButtonRef}
                onClick={() => {
                  setShowMoreDropdown(!showMoreDropdown);
                  setShowSearchDropdown(false);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>+{overflowTags.length} More</span>
                {showMoreDropdown ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </motion.button>

              {/* More Dropdown */}
              <AnimatePresence>
                {showMoreDropdown && (
                  <motion.div
                    ref={moreDropdownRef}
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute left-0 top-full mt-2 w-64 bg-card border rounded-lg shadow-lg z-30"
                  >
                    <div className="max-h-60 overflow-y-auto">
                      {overflowTags.map(({ tag, frequency, isPinned }) => (
                        <button
                          key={tag}
                          onClick={() => handleTagClick(tag)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted transition-colors group',
                            selectedTagFilter === tag && 'bg-primary/10 text-primary'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isPinned && <Pin className="w-3 h-3 text-primary" />}
                            <Hash className="w-3 h-3" />
                            <span className="text-sm">{tag}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{frequency}</span>
                            <button
                              onClick={(e) => handlePinToggle(tag, e)}
                              className={cn(
                                'w-4 h-4 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100',
                                isPinned 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted-foreground text-background'
                              )}
                              title={isPinned ? 'Unpin tag' : 'Pin tag'}
                            >
                              <Pin className="w-2 h-2" />
                            </button>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Helper Text */}
        <AnimatePresence>
          {selectedTagFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 mt-3"
            >
              <Filter className="w-3 h-3" />
              <span>
                Filtered by tag: <span className="font-medium text-foreground">"{selectedTagFilter}"</span>
                {(() => {
                  const matchingTag = allTagsWithFrequency.find(t => t.tag === selectedTagFilter);
                  const frequency = matchingTag?.frequency || 0;
                  return frequency > 0 && (
                    <span className="ml-1">
                      ({frequency} occurrence{frequency !== 1 ? 's' : ''})
                    </span>
                  );
                })()}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};