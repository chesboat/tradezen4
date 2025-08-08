import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Copy,
  GripVertical,
  Sparkles,
  Star,
  StarOff,
  Loader2,
  Save,
  Settings,
  Wand2,
  Target,
  CheckCircle,
  MoreHorizontal,
} from 'lucide-react';
import { useReflectionTemplateStore } from '@/store/useReflectionTemplateStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { CustomTemplate, InsightBlock, TemplateBlock } from '@/types';
import { cn } from '@/lib/utils';
import { debounce, formatDate } from '@/lib/localStorageUtils';
import { FavoritesManager } from './FavoritesManager';

interface ReflectionTemplateManagerProps {
  date: string; // YYYY-MM-DD format
  className?: string;
  onEditTemplate?: (template: CustomTemplate) => void;
}

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

// Simple rich text editor component
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder,
  className,
}) => {
  const [isRichMode, setIsRichMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertBold = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + `**${selectedText}**` + content.substring(end);
    onChange(newText);
  };

  const insertItalic = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + `*${selectedText}*` + content.substring(end);
    onChange(newText);
  };

  const insertBulletPoint = () => {
    const lines = content.split('\n');
    const newLines = lines.map(line => line.trim() ? `• ${line.replace(/^[•-]\s*/, '')}` : line);
    onChange(newLines.join('\n'));
  };

  return (
    <div className="space-y-2">
      {isRichMode && (
        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg border">
          <motion.button
            onClick={insertBold}
            className="px-2 py-1 text-xs font-bold bg-background hover:bg-muted rounded transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            B
          </motion.button>
          <motion.button
            onClick={insertItalic}
            className="px-2 py-1 text-xs italic bg-background hover:bg-muted rounded transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            I
          </motion.button>
          <motion.button
            onClick={insertBulletPoint}
            className="px-2 py-1 text-xs bg-background hover:bg-muted rounded transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            • List
          </motion.button>
          <div className="ml-auto">
            <motion.button
              onClick={() => setIsRichMode(false)}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Plain Text
            </motion.button>
          </div>
        </div>
      )}
      
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full min-h-[120px] p-4 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground leading-7 resize-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
            className
          )}
        />
        
        {!isRichMode && (
          <motion.button
            onClick={() => setIsRichMode(true)}
            className="absolute bottom-3 right-3 p-1 text-muted-foreground hover:text-primary transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Enable rich text formatting"
          >
            <Wand2 className="w-4 h-4" />
          </motion.button>
        )}
      </div>
    </div>
  );
};

export const ReflectionTemplateManager: React.FC<ReflectionTemplateManagerProps> = ({
  date,
  className,
  onEditTemplate,
}) => {
  const { selectedAccountId } = useAccountFilterStore();
  const { trades } = useTradeStore();
  const { notes } = useQuickNoteStore();
  const { addActivity } = useActivityLogStore();
  
  const {
    builtInTemplates,
    customTemplates,
    reflectionData,
    isGeneratingAITemplate,
    getReflectionByDate,
    createOrUpdateReflection,
    addInsightBlock,
    updateInsightBlock,
    deleteInsightBlock,
    reorderInsightBlocks,
    duplicateInsightBlock,
    incrementTemplateUsage,
    generateAITemplate,
    deleteCustomTemplate,
    getFavoriteBlocks,
    isFavoriteBlock,
    toggleBlockFavorite,
    addFavoriteBlock,
    autoPopulateFavorites,
    updateFavoritesOrder,
  } = useReflectionTemplateStore();

  // Local state
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showFavoritesManager, setShowFavoritesManager] = useState(false);
  const [completionScore, setCompletionScore] = useState(0);
  const [totalWordCount, setTotalWordCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentReflection, setCurrentReflection] = useState<any>(null);

  // Initialize reflection data
  useEffect(() => {
    if (!selectedAccountId) {
      setCurrentReflection(null);
      setIsInitializing(false);
      return;
    }

    // Check for existing reflection first
    const existing = getReflectionByDate(date, selectedAccountId);
    if (existing) {
      setCurrentReflection(existing);
      setIsInitializing(false);
      return;
    }

    // For new days, show loading briefly then auto-populate with favorites
    const timer = setTimeout(() => {
      const newReflection = autoPopulateFavorites(date, selectedAccountId);
      setCurrentReflection(newReflection);
      setIsInitializing(false);
    }, 150); // Slightly longer delay for smoother transition

    return () => clearTimeout(timer);
  }, [date, selectedAccountId, getReflectionByDate, autoPopulateFavorites]);

  // Update currentReflection when store data changes
  useEffect(() => {
    if (selectedAccountId && !isInitializing) {
      const updated = getReflectionByDate(date, selectedAccountId);
      if (updated) {
        setCurrentReflection(updated);
      }
    }
  }, [reflectionData, date, selectedAccountId, getReflectionByDate, isInitializing]);

  const allTemplates = [...builtInTemplates, ...customTemplates];

  // Auto-save functionality
  const debouncedAutoSave = debounce(async () => {
    if (!selectedAccountId || !currentReflection) return;
    
    try {
      // Calculate completion score based on content quality
      const score = calculateCompletionScore(currentReflection.insightBlocks);
      const totalXP = calculateTotalXP(currentReflection.insightBlocks);
      
      setCompletionScore(score);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, 1000);

  // Calculate word count and completion score
  useEffect(() => {
    if (currentReflection) {
      const wordCount = currentReflection.insightBlocks.reduce((total, block) => {
        return total + (block.content.trim().split(/\s+/).filter(word => word.length > 0).length);
      }, 0);
      setTotalWordCount(wordCount);
      
      const score = calculateCompletionScore(currentReflection.insightBlocks);
      setCompletionScore(score);
    } else {
      setTotalWordCount(0);
      setCompletionScore(0);
    }
  }, [currentReflection]);

  const calculateCompletionScore = (blocks: InsightBlock[]): number => {
    if (blocks.length === 0) return 0;
    
    const totalBlocks = blocks.length;
    const completedBlocks = blocks.filter(block => {
      const wordCount = block.content.trim().split(/\s+/).filter(word => word.length > 0).length;
      return wordCount >= 20; // Consider block complete if it has at least 20 words
    }).length;
    
    return Math.round((completedBlocks / totalBlocks) * 100);
  };

  const calculateTotalXP = (blocks: InsightBlock[]): number => {
    return blocks.reduce((total, block) => {
      const wordCount = block.content.trim().split(/\s+/).filter(word => word.length > 0).length;
      if (wordCount >= 50) return total + 25; // High quality insight
      if (wordCount >= 20) return total + 15; // Good insight
      if (wordCount >= 10) return total + 5;  // Basic insight
      return total;
    }, 0);
  };

  const handleAddInsightBlock = (template?: CustomTemplate, blockTemplate?: TemplateBlock) => {
    if (!selectedAccountId) return;
    
    let reflection = currentReflection;
    if (!reflection) {
      reflection = createOrUpdateReflection(date, selectedAccountId);
    }

    const isFavorite = template && blockTemplate && selectedAccountId
      ? isFavoriteBlock(template.id, blockTemplate.id, selectedAccountId)
      : false;

    const newBlock: Omit<InsightBlock, 'id' | 'createdAt' | 'updatedAt'> = {
      title: blockTemplate?.title || 'New Insight',
      content: '',
      tags: [],
      emoji: blockTemplate?.emoji || '💭',
      xpEarned: 0,
      order: (reflection.insightBlocks.length || 0) + 1,
      isExpanded: true,
      templateId: template?.id,
      templateBlockId: blockTemplate?.id,
      isFavorite,
    };

    const addedBlock = addInsightBlock(reflection.id, newBlock);
    
    if (template) {
      incrementTemplateUsage(template.id);
    }

    addActivity({
      type: 'reflection',
      title: 'Added Insight Block',
      description: `Added "${newBlock.title}" to reflection`,
      xpEarned: 5,
      relatedId: reflection.id,
      accountId: selectedAccountId,
    });

    debouncedAutoSave();
  };

  const handleUpdateInsightBlock = (blockId: string, updates: Partial<InsightBlock>) => {
    if (!currentReflection) return;
    
    console.log('📝 Updating insight block:', { 
      reflectionId: currentReflection.id, 
      blockId, 
      updates 
    });
    updateInsightBlock(currentReflection.id, blockId, updates);
    debouncedAutoSave();
  };

  const handleDeleteInsightBlock = (blockId: string) => {
    if (!currentReflection) return;
    
    deleteInsightBlock(currentReflection.id, blockId);
    debouncedAutoSave();
  };

  const handleDuplicateInsightBlock = (blockId: string) => {
    if (!currentReflection) return;
    
    duplicateInsightBlock(currentReflection.id, blockId);
    debouncedAutoSave();
  };

  const handleReorderBlocks = (newOrder: InsightBlock[]) => {
    if (!currentReflection || !selectedAccountId) return;
    
    // Update the order of blocks in the store
    newOrder.forEach((block, index) => {
      if (block.order !== index + 1) {
        updateInsightBlock(currentReflection.id, block.id, { order: index + 1 });
      }
    });

    // Update favorites order if favorite blocks were reordered
    const favoriteBlocks = newOrder.filter(block => 
      block.isFavorite && block.templateId && block.templateBlockId
    );

    if (favoriteBlocks.length > 0) {
      // Get current favorites from store
      const currentFavorites = getFavoriteBlocks(selectedAccountId);
      
      // Create a map of templateId + templateBlockId to new order
      const newFavoriteOrders = new Map();
      favoriteBlocks.forEach((block, index) => {
        const key = `${block.templateId}-${block.templateBlockId}`;
        newFavoriteOrders.set(key, index + 1);
      });

      // Update favorites with new order
      const updatedFavorites = currentFavorites.map(favorite => {
        const key = `${favorite.templateId}-${favorite.templateBlockId}`;
        const newOrder = newFavoriteOrders.get(key);
        if (newOrder !== undefined) {
          return { ...favorite, order: newOrder };
        }
        return favorite;
      });

      // Update the favorites order in the store
      updateFavoritesOrder(selectedAccountId, updatedFavorites);
      
      // Log for debugging if needed
      // console.log('🌟 Updated favorites order based on daily reflection reordering');
    }
  };

  const handleGenerateAITemplate = async () => {
    if (!selectedAccountId) return;
    
    console.log('🎯 AI Template Generation Debug:', {
      dateString: date,
      selectedAccountId,
      todayActual: new Date().toISOString().split('T')[0],
      isToday: date === new Date().toISOString().split('T')[0]
    });
    
    try {
      // Get day's trading data for context - fix timezone handling
      const dayStart = new Date(date + 'T00:00:00.000Z');
      const dayEnd = new Date(date + 'T23:59:59.999Z');
      
      console.log('📅 Date filtering debug:', {
        targetDate: date,
        dayStart: dayStart.toISOString(),
        dayEnd: dayEnd.toISOString(),
        selectedAccountId,
        totalTrades: trades.length,
        totalNotes: notes.length
      });
      
      const dayTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.entryTime);
        const dateMatches = tradeDate >= dayStart && tradeDate <= dayEnd;
        const accountMatches = !selectedAccountId || trade.accountId === selectedAccountId;
        
        console.log('🔍 Trade filter debug:', {
          symbol: trade.symbol,
          entryTime: trade.entryTime,
          tradeDate: tradeDate.toISOString(),
          accountId: trade.accountId,
          dateMatches,
          accountMatches,
          included: dateMatches && accountMatches
        });
        
        return dateMatches && accountMatches;
      });
      
      const dayNotes = notes.filter(note => {
        const noteDate = new Date(note.createdAt);
        const dateMatches = noteDate >= dayStart && noteDate <= dayEnd;
        const accountMatches = !selectedAccountId || note.accountId === selectedAccountId;
        
        console.log('📝 Note filter debug:', {
          content: note.content.substring(0, 50),
          createdAt: note.createdAt,
          noteDate: noteDate.toISOString(),
          accountId: note.accountId,
          dateMatches,
          accountMatches,
          included: dateMatches && accountMatches
        });
        
        return dateMatches && accountMatches;
      });

      const totalPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      const winningTrades = dayTrades.filter(t => (t.pnl || 0) > 0).length;
      const winRate = dayTrades.length > 0 ? (winningTrades / dayTrades.length) * 100 : 0;

      const context = {
        trades: dayTrades,
        notes: dayNotes,
        stats: {
          totalPnL,
          winRate,
          totalXP: dayTrades.length * 10 + dayNotes.length * 5,
          moodTrend: 'neutral',
          tradeCount: dayTrades.length,
        }
      };

      // Debug log to verify context
      console.log('🚀 AI Template Generation Started');
      console.log('📊 Full Context Being Sent:', {
        date,
        tradeCount: dayTrades.length,
        trades: dayTrades.map(t => ({ 
          symbol: t.symbol, 
          direction: t.direction,
          result: t.result, 
          pnl: t.pnl,
          entryTime: t.entryTime,
          tags: t.tags
        })),
        notes: dayNotes.map(n => ({
          content: n.content.substring(0, 100),
          tags: n.tags,
          mood: n.mood
        })),
        stats: {
          totalPnL,
          winRate,
          tradeCount: dayTrades.length
        }
      });
      console.log('💰 Financial Summary:', `${dayTrades.length} trades, $${totalPnL.toFixed(2)} P&L, ${winRate.toFixed(1)}% win rate`);

      const aiTemplate = await generateAITemplate(context);
      
      // Add blocks from AI template to current reflection
      let reflection = currentReflection;
      if (!reflection) {
        reflection = createOrUpdateReflection(date, selectedAccountId);
      }

      for (const templateBlock of aiTemplate.blocks) {
        handleAddInsightBlock(aiTemplate, templateBlock);
      }

      addActivity({
        type: 'reflection',
        title: 'AI Template Generated',
        description: `Generated ${aiTemplate.blocks.length} insight blocks using AI`,
        xpEarned: 20,
        relatedId: reflection.id,
        accountId: selectedAccountId,
      });

    } catch (error) {
      console.error('Failed to generate AI template:', error);
    }
  };

  const handleCompleteReflection = async () => {
    if (!currentReflection || !selectedAccountId || completionScore < 70) return;
    const totalXP = calculateTotalXP(currentReflection.insightBlocks);
    const bonusXP = completionScore >= 90 ? 25 : completionScore >= 80 ? 15 : 10;

    try {
      // Persist reflection completion state first
      createOrUpdateReflection(date, selectedAccountId, {
        completionScore,
        totalXP: totalXP + bonusXP,
      });

      // Log XP to activity feed
      addActivity({
        type: 'reflection',
        title: 'Reflection Complete',
        description: `Completed reflection with ${completionScore}% quality score`,
        xpEarned: totalXP + bonusXP,
        relatedId: currentReflection.id,
        accountId: selectedAccountId,
      });

      // Lightweight visual feedback
      alert(`Reflection completed! +${totalXP + bonusXP} XP awarded.`);
    } catch (e) {
      console.error('Failed to complete reflection:', e);
    }
  };

  const sortedBlocks = currentReflection?.insightBlocks
    .sort((a, b) => a.order - b.order) || [];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with stats and controls */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-border/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Insight Blocks</h3>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{sortedBlocks.length} blocks</span>
            <span>{totalWordCount} words</span>
            <div className="flex items-center gap-1">
              <div className="w-16 bg-muted rounded-full h-2">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                  style={{ width: `${completionScore}%` }}
                />
              </div>
              <span>{completionScore}%</span>
            </div>

          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Generate Button */}
          <motion.button
            onClick={handleGenerateAITemplate}
            disabled={isGeneratingAITemplate}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isGeneratingAITemplate ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            🪄 Generate Insights
          </motion.button>

          {/* Add Block Button */}
          <div className="relative">
            <motion.button
              onClick={() => setShowTemplateSelector(!showTemplateSelector)}
              className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4" />
              Add Block
              <ChevronDown className={cn("w-4 h-4 transition-transform", showTemplateSelector && "rotate-180")} />
            </motion.button>

            {/* Template Selector Dropdown */}
            <AnimatePresence>
              {showTemplateSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-72 bg-background border border-border rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto"
                >
                  <div className="p-3 border-b border-border">
                    <h4 className="font-semibold text-sm">Choose Template Block</h4>
                  </div>
                  
                  <div className="p-2 space-y-1">
                    {/* Quick Add Custom Block */}
                    <motion.button
                      onClick={() => {
                        handleAddInsightBlock();
                        setShowTemplateSelector(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-muted rounded-lg transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-primary" />
                        <div>
                          <div className="font-medium text-sm">Custom Block</div>
                          <div className="text-xs text-muted-foreground">Create your own insight block</div>
                        </div>
                      </div>
                    </motion.button>

                    {/* Built-in Template Blocks */}
                    {builtInTemplates.map((template) => (
                      <div key={template.id} className="space-y-1">
                        <div className="px-3 py-2 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <span>{template.emoji}</span>
                            <span>{template.name}</span>
                          </div>
                        </div>
                        {template.blocks.map((block) => {
                          const isBlockFavorite = selectedAccountId && isFavoriteBlock(template.id, block.id, selectedAccountId);
                          
                          return (
                            <div key={block.id} className="flex items-center gap-1">
                              <motion.button
                                onClick={() => {
                                  handleAddInsightBlock(template, block);
                                  setShowTemplateSelector(false);
                                }}
                                className="flex-1 text-left px-4 py-2 hover:bg-muted rounded-lg transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{block.emoji}</span>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{block.title}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                      {block.prompt}
                                    </div>
                                  </div>
                                </div>
                              </motion.button>
                              
                              {selectedAccountId && (
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isBlockFavorite) {
                                      const favoriteToRemove = getFavoriteBlocks(selectedAccountId).find(
                                        f => f.templateId === template.id && f.templateBlockId === block.id
                                      );
                                      if (favoriteToRemove) {
                                        const { removeFavoriteBlock } = useReflectionTemplateStore.getState();
                                        removeFavoriteBlock(favoriteToRemove.id);
                                      }
                                    } else {
                                      addFavoriteBlock(template.id, block.id, selectedAccountId);
                                    }
                                  }}
                                  className={cn(
                                    "p-1 rounded transition-colors",
                                    isBlockFavorite 
                                      ? "text-yellow-500 hover:text-yellow-600" 
                                      : "text-muted-foreground hover:text-yellow-500"
                                  )}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title={isBlockFavorite ? "Remove from favorites" : "Add to favorites"}
                                >
                                  {isBlockFavorite ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                                </motion.button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}

                    {/* Custom Template Blocks */}
                    {customTemplates.map((template) => (
                      <div key={template.id} className="space-y-1">
                        <div className="px-3 py-2 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <span>{template.emoji}</span>
                              <span>{template.name}</span>
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs">Custom</span>
                            </div>
                            {onEditTemplate && (
                              <div className="flex items-center gap-1">
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditTemplate(template);
                                    setShowTemplateSelector(false);
                                  }}
                                  className="p-1 hover:bg-muted rounded transition-colors"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title="Edit template"
                                >
                                  <Settings className="w-3 h-3" />
                                </motion.button>
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
                                      deleteCustomTemplate(template.id);
                                    }
                                  }}
                                  className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title="Delete template"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </div>
                        {template.blocks.map((block) => {
                          const isBlockFavorite = selectedAccountId && isFavoriteBlock(template.id, block.id, selectedAccountId);
                          
                          return (
                            <div key={block.id} className="flex items-center gap-1">
                              <motion.button
                                onClick={() => {
                                  handleAddInsightBlock(template, block);
                                  setShowTemplateSelector(false);
                                }}
                                className="flex-1 text-left px-4 py-2 hover:bg-muted rounded-lg transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{block.emoji}</span>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{block.title}</div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                      {block.prompt}
                                    </div>
                                  </div>
                                </div>
                              </motion.button>
                              
                              {selectedAccountId && (
                                <motion.button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isBlockFavorite) {
                                      const favoriteToRemove = getFavoriteBlocks(selectedAccountId).find(
                                        f => f.templateId === template.id && f.templateBlockId === block.id
                                      );
                                      if (favoriteToRemove) {
                                        const { removeFavoriteBlock } = useReflectionTemplateStore.getState();
                                        removeFavoriteBlock(favoriteToRemove.id);
                                      }
                                    } else {
                                      addFavoriteBlock(template.id, block.id, selectedAccountId);
                                    }
                                  }}
                                  className={cn(
                                    "p-1 rounded transition-colors",
                                    isBlockFavorite 
                                      ? "text-yellow-500 hover:text-yellow-600" 
                                      : "text-muted-foreground hover:text-yellow-500"
                                  )}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title={isBlockFavorite ? "Remove from favorites" : "Add to favorites"}
                                >
                                  {isBlockFavorite ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
                                </motion.button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}

                    {/* Manage Favorites Button */}
                    {selectedAccountId && getFavoriteBlocks(selectedAccountId).length > 0 && (
                      <div className="p-2 border-t border-border">
                        <motion.button
                          onClick={() => {
                            setShowFavoritesManager(true);
                            setShowTemplateSelector(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Star className="w-4 h-4" />
                          <span className="font-medium text-sm">Manage Favorites</span>
                          <span className="ml-auto text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded">
                            {getFavoriteBlocks(selectedAccountId).length}
                          </span>
                        </motion.button>
                      </div>
                    )}

                    {/* Create Template Button */}
                    {onEditTemplate && (
                      <div className={cn(
                        "p-2",
                        selectedAccountId && getFavoriteBlocks(selectedAccountId).length > 0 ? "" : "border-t border-border"
                      )}>
                        <motion.button
                          onClick={() => {
                            onEditTemplate(null as any); // null indicates creating new template
                            setShowTemplateSelector(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Plus className="w-4 h-4" />
                          <span className="font-medium text-sm">Create New Template</span>
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isInitializing && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {[1, 2, 3].map((i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-background border border-border rounded-xl overflow-hidden shadow-sm"
            >
              <div className="p-4 flex items-center gap-3 bg-muted/10">
                <div className="w-6 h-6 bg-muted/30 rounded animate-pulse"></div>
                <div className="w-8 h-8 bg-muted/30 rounded animate-pulse"></div>
                <div className="flex-1 h-4 bg-muted/30 rounded animate-pulse"></div>
                <div className="w-16 h-4 bg-muted/30 rounded animate-pulse"></div>
              </div>
              <div className="p-4">
                <div className="space-y-2">
                  <div className="h-3 bg-muted/20 rounded animate-pulse"></div>
                  <div className="h-3 bg-muted/20 rounded animate-pulse w-4/5"></div>
                  <div className="h-3 bg-muted/20 rounded animate-pulse w-3/5"></div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Insight Blocks */}
      <AnimatePresence mode="wait">
        {!isInitializing && sortedBlocks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Reorder.Group
              axis="y"
              values={sortedBlocks}
              onReorder={handleReorderBlocks}
              className="space-y-4"
            >
              {sortedBlocks.map((block, index) => (
                <Reorder.Item
                  key={block.id}
                  value={block}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <InsightBlockCard
                      block={block}
                      onUpdate={(updates) => handleUpdateInsightBlock(block.id, updates)}
                      onDelete={() => handleDeleteInsightBlock(block.id)}
                      onDuplicate={() => handleDuplicateInsightBlock(block.id)}
                      onToggleFavorite={() => {
                        if (currentReflection) {
                          toggleBlockFavorite(currentReflection.id, block.id);
                        }
                      }}
                    />
                  </motion.div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!isInitializing && sortedBlocks.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 px-6 bg-muted/20 rounded-xl border border-dashed border-border"
        >
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Start Your Reflection</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Add insight blocks to capture your thoughts, lessons, and reflections from today's trading session.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>Star your favorite blocks to auto-load them for new days</span>
          </div>
          <div className="flex items-center justify-center gap-3">
            <motion.button
              onClick={handleGenerateAITemplate}
              disabled={isGeneratingAITemplate}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-4 h-4" />
              🪄 AI Generate
            </motion.button>
            <motion.button
              onClick={() => handleAddInsightBlock()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4" />
              Add Block
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Completion Button */}
      {sortedBlocks.length > 0 && completionScore >= 70 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.button
            onClick={handleCompleteReflection}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <CheckCircle className="w-5 h-5" />
            Complete Reflection
            <span className="bg-white/20 px-2 py-1 rounded-lg text-sm">
              +{calculateTotalXP(sortedBlocks)} XP
            </span>
          </motion.button>
        </motion.div>
      )}

      {/* Favorites Manager Modal */}
      <FavoritesManager
        isOpen={showFavoritesManager}
        onClose={() => setShowFavoritesManager(false)}
      />
    </div>
  );
};

// Individual Insight Block Component
interface InsightBlockCardProps {
  block: InsightBlock;
  onUpdate: (updates: Partial<InsightBlock>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleFavorite?: () => void;
}

const InsightBlockCard: React.FC<InsightBlockCardProps> = ({
  block,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}) => {
  const [showActions, setShowActions] = useState(false);

  const handleContentChange = (content: string) => {
    onUpdate({ content });
  };

  const handleTitleChange = (title: string) => {
    onUpdate({ title });
  };

  const toggleExpanded = () => {
    console.log('🔄 Toggling expanded:', { 
      blockId: block.id, 
      currentExpanded: block.isExpanded, 
      newExpanded: !block.isExpanded 
    });
    onUpdate({ isExpanded: !block.isExpanded });
  };

  const wordCount = block.content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const xpEarned = wordCount >= 50 ? 25 : wordCount >= 20 ? 15 : wordCount >= 10 ? 5 : 0;

  return (
    <motion.div
      layout="position"
      className="bg-background border border-border rounded-xl shadow-sm hover:shadow-md transition-all"
    >
      {/* Block Header */}
      <div className="flex items-center gap-3 p-4 bg-muted/20 border-b border-border rounded-t-xl">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
          <span className="text-2xl">{block.emoji}</span>
        </div>
        
        <input
          type="text"
          value={block.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-lg font-semibold focus:ring-2 focus:ring-primary/20 rounded px-2 py-1"
        />
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{wordCount} words</span>
          {xpEarned > 0 && (
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-lg font-medium">
              +{xpEarned} XP
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Favorite Star */}
          {block.templateId && block.templateBlockId && (
            <motion.button
              onClick={onToggleFavorite}
              className={cn(
                "p-1 rounded transition-colors",
                block.isFavorite 
                  ? "text-yellow-500 hover:text-yellow-600" 
                  : "text-muted-foreground hover:text-yellow-500"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={block.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {block.isFavorite ? <Star className="w-4 h-4 fill-current" /> : <Star className="w-4 h-4" />}
            </motion.button>
          )}

          <motion.button
            onClick={toggleExpanded}
            className="p-1 hover:bg-muted rounded transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {block.isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </motion.button>
          
          <div className="relative">
            <motion.button
              onClick={() => setShowActions(!showActions)}
              className="p-1 hover:bg-muted rounded transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </motion.button>

            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute top-full right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 py-1 min-w-[120px]"
                >
                  <motion.button
                    onClick={() => {
                      onDuplicate();
                      setShowActions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Copy className="w-3 h-3" />
                    <span className="text-sm">Duplicate</span>
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      onDelete();
                      setShowActions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2 text-red-600"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="text-sm">Delete</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Block Content */}
      <AnimatePresence initial={false}>
        {block.isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4">
              <RichTextEditor
                content={block.content}
                onChange={handleContentChange}
                placeholder={`Write your thoughts about ${block.title.toLowerCase()}...`}
              />
              
              {/* Tags and additional metadata could go here */}
              {block.tags && block.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {block.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
              )}
    </AnimatePresence>
    </motion.div>
  );
};