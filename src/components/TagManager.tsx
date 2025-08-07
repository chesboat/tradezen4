import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Tag, 
  Trash2, 
  Search, 
  BarChart3, 
  Filter,
  X,
  Hash,
  TrendingUp,
  Calendar,
  Eye,
  EyeOff
} from 'lucide-react';
import { useQuickNoteStore, useQuickNoteTags } from '@/store/useQuickNoteStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { cn } from '@/lib/utils';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

type SortOption = 'alphabetical' | 'usage' | 'recent';
type FilterOption = 'all' | 'used' | 'unused';

export const TagManager: React.FC<TagManagerProps> = ({ isOpen, onClose }) => {
  const { notes, removeTag } = useQuickNoteStore();
  const { allTags, tagsByUsage, tagUsageCount } = useQuickNoteTags();
  const { selectedAccountId } = useAccountFilterStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('usage');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showStats, setShowStats] = useState(true);

  // Get account-specific notes for tag usage calculation
  const accountNotes = useMemo(() => {
    return notes.filter(note => !selectedAccountId || note.accountId === selectedAccountId);
  }, [notes, selectedAccountId]);

  // Calculate tag statistics
  const tagStats = useMemo(() => {
    const stats = new Map<string, {
      count: number;
      lastUsed: Date | null;
      notes: string[];
    }>();

    // Initialize all tags
    allTags.forEach(tag => {
      stats.set(tag, { count: 0, lastUsed: null, notes: [] });
    });

    // Count usage in account-specific notes
    accountNotes.forEach(note => {
      note.tags.forEach(tag => {
        const current = stats.get(tag) || { count: 0, lastUsed: null, notes: [] };
        stats.set(tag, {
          count: current.count + 1,
          lastUsed: current.lastUsed ? 
            (note.createdAt > current.lastUsed ? note.createdAt : current.lastUsed) : 
            note.createdAt,
          notes: [...current.notes, note.id]
        });
      });
    });

    return stats;
  }, [allTags, accountNotes]);

  // Filter and sort tags
  const filteredTags = useMemo(() => {
    let tags = Array.from(tagStats.entries());

    // Apply search filter
    if (searchTerm) {
      tags = tags.filter(([tag]) => 
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply usage filter
    switch (filterBy) {
      case 'used':
        tags = tags.filter(([, stats]) => stats.count > 0);
        break;
      case 'unused':
        tags = tags.filter(([, stats]) => stats.count === 0);
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'alphabetical':
        tags.sort(([a], [b]) => a.localeCompare(b));
        break;
      case 'usage':
        tags.sort(([, a], [, b]) => b.count - a.count);
        break;
      case 'recent':
        tags.sort(([, a], [, b]) => {
          if (!a.lastUsed && !b.lastUsed) return 0;
          if (!a.lastUsed) return 1;
          if (!b.lastUsed) return -1;
          return b.lastUsed.getTime() - a.lastUsed.getTime();
        });
        break;
    }

    return tags;
  }, [tagStats, searchTerm, sortBy, filterBy]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const totalTags = allTags.length;
    const usedTags = Array.from(tagStats.values()).filter(stats => stats.count > 0).length;
    const unusedTags = totalTags - usedTags;
    const totalUsage = Array.from(tagStats.values()).reduce((sum, stats) => sum + stats.count, 0);
    const avgUsage = usedTags > 0 ? totalUsage / usedTags : 0;

    return { totalTags, usedTags, unusedTags, totalUsage, avgUsage };
  }, [allTags.length, tagStats]);

  const handleDeleteTag = (tag: string) => {
    removeTag(tag);
    setSelectedTags(prev => {
      const next = new Set(prev);
      next.delete(tag);
      return next;
    });
  };

  const handleBulkDelete = () => {
    selectedTags.forEach(tag => removeTag(tag));
    setSelectedTags(new Set());
  };

  const toggleTagSelection = (tag: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const selectUnusedTags = () => {
    const unusedTags = filteredTags
      .filter(([, stats]) => stats.count === 0)
      .map(([tag]) => tag);
    setSelectedTags(new Set(unusedTags));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-background rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Tag Manager</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your hashtags and view usage statistics
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statistics Panel */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-4 bg-muted/30 border-b border-border overflow-hidden"
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{overallStats.totalTags}</div>
                  <div className="text-xs text-muted-foreground">Total Tags</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{overallStats.usedTags}</div>
                  <div className="text-xs text-muted-foreground">Used Tags</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{overallStats.unusedTags}</div>
                  <div className="text-xs text-muted-foreground">Unused Tags</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{overallStats.totalUsage}</div>
                  <div className="text-xs text-muted-foreground">Total Usage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">{overallStats.avgUsage.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Avg per Tag</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tags..."
                className="pl-10 pr-4 py-2 w-full bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="usage">Sort by Usage</option>
              <option value="alphabetical">Sort A-Z</option>
              <option value="recent">Sort by Recent</option>
            </select>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="all">All Tags</option>
              <option value="used">Used Only</option>
              <option value="unused">Unused Only</option>
            </select>

            {/* Toggle Stats */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Toggle Statistics"
            >
              {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedTags.size > 0 && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedTags.size} tag{selectedTags.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedTags(new Set())}
                className="px-3 py-1 bg-muted text-foreground rounded text-sm hover:bg-muted/80 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}

          {overallStats.unusedTags > 0 && (
            <div className="mt-2">
              <button
                onClick={selectUnusedTags}
                className="text-sm text-yellow-600 hover:text-yellow-700 transition-colors"
              >
                Select all {overallStats.unusedTags} unused tags
              </button>
            </div>
          )}
        </div>

        {/* Tags List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredTags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tags found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTags.map(([tag, stats]) => (
                <motion.div
                  key={tag}
                  layout
                  className={cn(
                    "p-3 border rounded-lg transition-all duration-200 cursor-pointer hover:shadow-md",
                    selectedTags.has(tag) ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                    stats.count === 0 && "opacity-60"
                  )}
                  onClick={() => toggleTagSelection(tag)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-primary">#</span>
                        <span className="font-medium truncate">{tag}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          {stats.count} uses
                        </span>
                        {stats.lastUsed && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {stats.lastUsed.toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTag(tag);
                      }}
                      className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                      title="Delete tag"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};