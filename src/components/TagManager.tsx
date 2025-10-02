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
  Calendar,
  Eye,
  EyeOff,
  Edit2,
  Check,
  FileText,
  TrendingUp,
  Palette,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useTagStore, TAG_COLORS, TagColor } from '@/store/useTagStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { cn } from '@/lib/utils';

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

type SortOption = 'alphabetical' | 'usage' | 'recent';
type FilterOption = 'all' | 'trades' | 'notes' | 'both' | 'unused';

interface UnifiedTagStats {
  tag: string;
  color: TagColor;
  tradesCount: number;
  notesCount: number;
  totalCount: number;
  lastUsed: Date | null;
  tradeIds: string[];
  noteIds: string[];
}

export const TagManager: React.FC<TagManagerProps> = ({ isOpen, onClose }) => {
  const { notes, removeTag: removeNoteTag, renameTag: renameNoteTag } = useQuickNoteStore();
  const { trades, updateTrade } = useTradeStore();
  const { getAllTags, getTagColor, updateTagColor, renameTag: renameTagMetadata, deleteTag: deleteTagMetadata } = useTagStore();
  // Subscribe to the tags object directly to trigger re-renders on color changes
  const tagStoreVersion = useTagStore((state) => Object.keys(state.tags).length + JSON.stringify(Object.values(state.tags).map(t => t.color)));
  const { selectedAccountId } = useAccountFilterStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('usage');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [showStats, setShowStats] = useState(true);
  const [editingTagName, setEditingTagName] = useState<string | null>(null);
  const [editingTagValue, setEditingTagValue] = useState('');
  const [editingTagColor, setEditingTagColor] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get account-specific data
  const accountNotes = useMemo(() => {
    return notes.filter(note => !selectedAccountId || note.accountId === selectedAccountId);
  }, [notes, selectedAccountId]);

  const accountTrades = useMemo(() => {
    return trades.filter(trade => !selectedAccountId || trade.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

  // Calculate unified tag statistics
  const unifiedTagStats = useMemo(() => {
    const statsMap = new Map<string, UnifiedTagStats>();

    // Collect all unique tags from both notes and trades
    const allTagsSet = new Set<string>();
    
    // Add tags from notes
    accountNotes.forEach(note => {
      (note.tags || []).forEach(tag => allTagsSet.add(tag.toLowerCase()));
    });
    
    // Add tags from trades
    accountTrades.forEach(trade => {
      (trade.tags || []).forEach(tag => allTagsSet.add(tag.toLowerCase()));
    });

    // Add tags from tag store (in case some aren't used yet)
    getAllTags().forEach(tagMetadata => {
      allTagsSet.add(tagMetadata.name.toLowerCase());
    });

    // Initialize stats for all tags
    allTagsSet.forEach(tag => {
      statsMap.set(tag, {
        tag,
        color: getTagColor(tag),
        tradesCount: 0,
        notesCount: 0,
        totalCount: 0,
        lastUsed: null,
        tradeIds: [],
        noteIds: []
      });
    });

    // Count note usage
    accountNotes.forEach(note => {
      (note.tags || []).forEach(tag => {
        const normalized = tag.toLowerCase();
        const stats = statsMap.get(normalized)!;
        stats.notesCount++;
        stats.totalCount++;
        stats.noteIds.push(note.id);
        const noteDate = new Date(note.createdAt);
        if (!stats.lastUsed || noteDate > stats.lastUsed) {
          stats.lastUsed = noteDate;
        }
      });
    });

    // Count trade usage
    accountTrades.forEach(trade => {
      (trade.tags || []).forEach(tag => {
        const normalized = tag.toLowerCase();
        const stats = statsMap.get(normalized)!;
        stats.tradesCount++;
        stats.totalCount++;
        stats.tradeIds.push(trade.id);
        const tradeDate = new Date(trade.entryTime);
        if (!stats.lastUsed || tradeDate > stats.lastUsed) {
          stats.lastUsed = tradeDate;
        }
      });
    });

    return Array.from(statsMap.values());
  }, [accountNotes, accountTrades, getAllTags, getTagColor, refreshKey, tagStoreVersion]);

  // Filter and sort tags
  const filteredTags = useMemo(() => {
    let tags = [...unifiedTagStats];

    // Apply search filter
    if (searchTerm) {
      tags = tags.filter(stats => 
        stats.tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply usage filter
    switch (filterBy) {
      case 'trades':
        tags = tags.filter(stats => stats.tradesCount > 0);
        break;
      case 'notes':
        tags = tags.filter(stats => stats.notesCount > 0);
        break;
      case 'both':
        tags = tags.filter(stats => stats.tradesCount > 0 && stats.notesCount > 0);
        break;
      case 'unused':
        tags = tags.filter(stats => stats.totalCount === 0);
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'alphabetical':
        tags.sort((a, b) => a.tag.localeCompare(b.tag));
        break;
      case 'usage':
        tags.sort((a, b) => b.totalCount - a.totalCount);
        break;
      case 'recent':
        tags.sort((a, b) => {
          if (!a.lastUsed && !b.lastUsed) return 0;
          if (!a.lastUsed) return 1;
          if (!b.lastUsed) return -1;
          return b.lastUsed.getTime() - a.lastUsed.getTime();
        });
        break;
    }

    return tags;
  }, [unifiedTagStats, searchTerm, sortBy, filterBy]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const totalTags = unifiedTagStats.length;
    const tradeTags = unifiedTagStats.filter(s => s.tradesCount > 0).length;
    const noteTags = unifiedTagStats.filter(s => s.notesCount > 0).length;
    const sharedTags = unifiedTagStats.filter(s => s.tradesCount > 0 && s.notesCount > 0).length;
    const unusedTags = unifiedTagStats.filter(s => s.totalCount === 0).length;
    const totalUsage = unifiedTagStats.reduce((sum, s) => sum + s.totalCount, 0);

    return { totalTags, tradeTags, noteTags, sharedTags, unusedTags, totalUsage };
  }, [unifiedTagStats]);

  const handleDeleteTag = async (tag: string) => {
    const stats = unifiedTagStats.find(s => s.tag === tag);
    if (!stats) return;

    // Confirm if tag is used
    if (stats.totalCount > 0) {
      const message = `Delete #${tag}?\n\nUsed in:\n• ${stats.tradesCount} trade${stats.tradesCount !== 1 ? 's' : ''}\n• ${stats.notesCount} note${stats.notesCount !== 1 ? 's' : ''}\n\nThis will remove it from all items.`;
      if (!confirm(message)) return;
    }

    // Remove from notes
    if (stats.notesCount > 0) {
      removeNoteTag(tag);
    }

    // Remove from trades
    if (stats.tradesCount > 0) {
      for (const tradeId of stats.tradeIds) {
        const trade = accountTrades.find(t => t.id === tradeId);
        if (trade) {
          const newTags = (trade.tags || []).filter(t => t.toLowerCase() !== tag);
          await updateTrade(tradeId, { tags: newTags });
        }
      }
    }

    // Remove from tag store
    deleteTagMetadata(tag);

    // Remove from selection
    setSelectedTags(prev => {
      const next = new Set(prev);
      next.delete(tag);
      return next;
    });
  };

  const handleRenameTag = async (oldTag: string, newTag: string) => {
    const normalized = newTag.toLowerCase().trim().replace(/^#/, '');
    if (!normalized || normalized === oldTag) {
      setEditingTagName(null);
      setEditingTagValue('');
      return;
    }

    // Check if new name already exists
    if (unifiedTagStats.some(s => s.tag === normalized && s.tag !== oldTag)) {
      alert(`Tag #${normalized} already exists. Please choose a different name.`);
      return;
    }

    const stats = unifiedTagStats.find(s => s.tag === oldTag);
    if (!stats) return;

    // Rename in notes
    if (stats.notesCount > 0) {
      renameNoteTag(oldTag, normalized);
    }

    // Rename in trades
    if (stats.tradesCount > 0) {
      for (const tradeId of stats.tradeIds) {
        const trade = accountTrades.find(t => t.id === tradeId);
        if (trade) {
          const newTags = (trade.tags || []).map(t => 
            t.toLowerCase() === oldTag ? normalized : t
          );
          await updateTrade(tradeId, { tags: newTags });
        }
      }
    }

    // Rename in tag store
    renameTagMetadata(oldTag, normalized);

    setEditingTagName(null);
    setEditingTagValue('');
  };

  const handleColorChange = (tag: string, color: TagColor) => {
    console.log('🎨 Changing color:', { tag, color });
    updateTagColor(tag, color);
    // Force re-render by updating both the editing state and refresh key
    setEditingTagColor(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleBulkDelete = async () => {
    const totalUsage = Array.from(selectedTags).reduce((sum, tag) => {
      const stats = unifiedTagStats.find(s => s.tag === tag);
      return sum + (stats?.totalCount || 0);
    }, 0);

    if (totalUsage > 0) {
      if (!confirm(`Delete ${selectedTags.size} tag(s)? This will remove them from ${totalUsage} items.`)) {
        return;
      }
    }

    for (const tag of Array.from(selectedTags)) {
      await handleDeleteTag(tag);
    }
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
      .filter(stats => stats.totalCount === 0)
      .map(stats => stats.tag);
    setSelectedTags(new Set(unusedTags));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-background rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Tag Manager</h2>
                <p className="text-sm text-muted-foreground">
                  Manage tags across trades and notes
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
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{overallStats.totalTags}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{overallStats.tradeTags}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Trades
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">{overallStats.noteTags}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <FileText className="w-3 h-3" />
                    Notes
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{overallStats.sharedTags}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Shared
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{overallStats.unusedTags}</div>
                  <div className="text-xs text-muted-foreground">Unused</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{overallStats.totalUsage}</div>
                  <div className="text-xs text-muted-foreground">Usage</div>
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
              <option value="trades">Trades Only</option>
              <option value="notes">Notes Only</option>
              <option value="both">Both (Shared)</option>
              <option value="unused">Unused</option>
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
                className="text-sm text-yellow-600 hover:text-yellow-700 transition-colors flex items-center gap-1"
              >
                <AlertCircle className="w-3 h-3" />
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
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredTags.map((stats) => {
                const colorStyles = TAG_COLORS[stats.color];
                const isEditing = editingTagName === stats.tag;
                const isEditingColor = editingTagColor === stats.tag;
                
                return (
                  <motion.div
                    key={stats.tag}
                    layout
                    className={cn(
                      "group p-3 border rounded-lg transition-all duration-200 hover:shadow-md",
                      selectedTags.has(stats.tag) ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                      stats.totalCount === 0 && "opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Tag Name - Double-click to edit (Apple-style) */}
                        {isEditing ? (
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-primary">#</span>
                            <input
                              type="text"
                              value={editingTagValue}
                              onChange={(e) => setEditingTagValue(e.target.value)}
                              onBlur={() => {
                                if (editingTagValue.trim()) {
                                  handleRenameTag(stats.tag, editingTagValue);
                                } else {
                                  setEditingTagName(null);
                                  setEditingTagValue('');
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (editingTagValue.trim()) {
                                    handleRenameTag(stats.tag, editingTagValue);
                                  }
                                } else if (e.key === 'Escape') {
                                  setEditingTagName(null);
                                  setEditingTagValue('');
                                }
                              }}
                              className="flex-1 px-2 py-1 bg-primary/10 border border-primary rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (editingTagValue.trim()) {
                                  handleRenameTag(stats.tag, editingTagValue);
                                }
                              }}
                              className="p-1 hover:bg-green-100 hover:text-green-600 rounded transition-colors"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTagName(null);
                                setEditingTagValue('');
                              }}
                              className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-2">
                            {/* Color Dot - Click to change */}
                            <button
                              className={cn(
                                'w-3 h-3 rounded-full border-2 transition-all hover:scale-125',
                                colorStyles.bg,
                                isEditingColor ? 'border-foreground ring-2 ring-offset-2 ring-primary scale-125' : colorStyles.border
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTagColor(isEditingColor ? null : stats.tag);
                              }}
                              title={isEditingColor ? 'Close color picker' : 'Change color'}
                            />
                            <span className="text-primary">#</span>
                            <span 
                              className="font-medium truncate cursor-text"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingTagName(stats.tag);
                                setEditingTagValue(stats.tag);
                              }}
                              title="Double-click to rename"
                            >
                              {stats.tag}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTagName(stats.tag);
                                setEditingTagValue(stats.tag);
                              }}
                              className="p-1 hover:bg-muted rounded transition-colors opacity-0 group-hover:opacity-100"
                              title="Rename tag"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Color Picker - Apple style popover */}
                        <AnimatePresence>
                          {isEditingColor && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mb-2 overflow-hidden"
                            >
                              <div className="p-2 bg-muted/50 rounded-lg border border-border">
                                <div className="text-xs text-muted-foreground mb-2">Choose color:</div>
                                <div className="flex gap-2 flex-wrap">
                                  {(Object.keys(TAG_COLORS) as TagColor[]).map((color) => {
                                    const colorStyle = TAG_COLORS[color];
                                    return (
                                      <button
                                        key={color}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          console.log('Color button clicked:', { tag: stats.tag, color });
                                          handleColorChange(stats.tag, color);
                                        }}
                                        className={cn(
                                          'w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer',
                                          colorStyle.bg,
                                          stats.color === color 
                                            ? 'border-foreground scale-110 ring-2 ring-offset-2 ring-primary' 
                                            : 'border-border hover:scale-110 hover:border-muted-foreground'
                                        )}
                                        title={color}
                                      >
                                        {stats.color === color && (
                                          <Check className="w-4 h-4 text-foreground" strokeWidth={3} />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Stats */}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {stats.tradesCount > 0 && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              {stats.tradesCount} trade{stats.tradesCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {stats.notesCount > 0 && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {stats.notesCount} note{stats.notesCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {stats.totalCount === 0 && (
                            <span className="text-yellow-600 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Unused
                            </span>
                          )}
                        </div>
                        {stats.lastUsed && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {stats.lastUsed.toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleTagSelection(stats.tag)}
                          className={cn(
                            "p-1 rounded transition-colors",
                            selectedTags.has(stats.tag) ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          )}
                          title={selectedTags.has(stats.tag) ? "Deselect" : "Select"}
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteTag(stats.tag)}
                          className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                          title="Delete tag"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
