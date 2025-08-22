import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  Calendar, 
  Clock, 
  Zap, 
  CheckCircle, 
  Crown,
  Pin,
  PinOff,
  Filter,
  BarChart3,
  Sparkles,
  Gift,
  Medal,
  RefreshCw,
  X,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { useQuestStore } from '@/store/useQuestStore';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useQuickNoteStore } from '@/store/useQuickNoteStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { Quest } from '@/types';
import { cn } from '@/lib/utils';

interface QuestCardProps {
  quest: Quest;
  isPinned: boolean;
  onPin: () => void;
  onUnpin: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, isPinned, onPin, onUnpin, onComplete, onCancel }) => {
  const progressPercentage = (quest.progress / quest.maxProgress) * 100;
  const isCompleted = quest.status === 'completed';
  const isCancelled = quest.status === 'cancelled';
  const isFailed = quest.status === 'failed';
  const isOverdue = quest.dueDate && new Date() > new Date(quest.dueDate) && !isCompleted && !isCancelled && !isFailed;

  const getTypeColor = (type: Quest['type']) => {
    switch (type) {
      case 'daily': return 'bg-blue-500';
      case 'weekly': return 'bg-green-500';
      case 'monthly': return 'bg-purple-500';
      case 'achievement': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: Quest['type']) => {
    switch (type) {
      case 'daily': return <Calendar className="w-4 h-4" />;
      case 'weekly': return <BarChart3 className="w-4 h-4" />;
      case 'monthly': return <Crown className="w-4 h-4" />;
      case 'achievement': return <Trophy className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getTimeRemaining = () => {
    if (!quest.dueDate) return null;
    const now = new Date();
    const due = new Date(quest.dueDate);
    const diff = due.getTime() - now.getTime();
    
    if (diff < 0) return 'Overdue';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  const getCompletionInstructions = (quest: Quest) => {
    // Achievement quest instructions
    if (quest.title === 'First Steps' || quest.description.toLowerCase().includes('first trade')) {
      return 'Use the Trade Logger to log your first trade. Any trade (win/loss/breakeven) counts!';
    }
    
    if (quest.title === 'Consistency Builder' || quest.description.toLowerCase().includes('consecutive')) {
      return 'Log trades on consecutive days. Progress updates automatically as you maintain your trading routine.';
    }
    
    if (quest.title === 'Risk Manager' || (quest.description.toLowerCase().includes('risk') && quest.description.toLowerCase().includes('exceeding'))) {
      return 'Keep your risk amount at $200 or less per trade to demonstrate good risk management.';
    }

    // Daily Focus quest instructions
    if (quest.title === 'Daily Focus') {
      if (quest.description.toLowerCase().includes('quality over quantity')) {
        return 'Make 3 or fewer high-quality trades with good risk-reward ratios (2:1 or better)';
      }
      if (quest.description.toLowerCase().includes('well-being')) {
        return 'Complete a wellness activity (meditation, breathwork, etc.) before opening any new trades';
      }
      if (quest.description.toLowerCase().includes('risk management')) {
        return 'Set stop losses on all trades and stick to your position sizing rules';
      }
      if (quest.description.toLowerCase().includes('patience')) {
        return 'Wait for proper setups and avoid revenge trading or FOMO entries';
      }
    }
    
    // Generic trade counting quests
    if (quest.description.toLowerCase().includes('trade') && 
        !quest.description.toLowerCase().includes('first') &&
        !quest.description.toLowerCase().includes('risk') &&
        !quest.description.toLowerCase().includes('consecutive')) {
      return 'Progress updates automatically each time you log a trade using the Trade Logger.';
    }
    
    // Default instruction based on quest type
    switch (quest.type) {
      case 'daily':
        return 'Complete the specified daily activity to earn progress toward this goal';
      case 'weekly':
        return 'Work on this goal throughout the week and track your progress';
      case 'monthly':
        return 'Focus on this long-term objective over the course of the month';
      default:
        return 'Progress updates automatically based on your trading activity. Check the description for specific requirements.';
    }
  };

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-2xl p-6 hover:shadow-glow-sm',
        isCompleted && 'opacity-75 bg-green-500/10 border-green-500/20',
        isOverdue && 'border-red-500/50 bg-red-500/10',
        isPinned && 'ring-2 ring-primary/50 border-primary/50'
      )}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg text-white', getTypeColor(quest.type))}>
              {getTypeIcon(quest.type)}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{quest.title}</h3>
              <p className="text-sm text-muted-foreground">{quest.description}</p>
              
              {/* Completion Instructions */}
              {!isCompleted && (
                <div className="bg-muted/30 rounded-lg p-3 mt-3">
                  <div className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">How to complete:</p>
                      <p className="text-xs text-muted-foreground">
                        {getCompletionInstructions(quest)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={isPinned ? onUnpin : onPin}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isPinned 
                  ? 'text-primary bg-primary/20 hover:bg-primary/30' 
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/20'
              )}
            >
              {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Progress: {quest.progress}/{quest.maxProgress}
            </span>
            <span className={cn(
              'font-medium',
              isCompleted ? 'text-green-500' : 'text-foreground'
            )}>
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full will-change-transform',
                isCompleted ? 'bg-green-500' : 'bg-primary'
              )}
              initial={{ width: 0, scaleX: 0 }}
              animate={{ 
                width: `${progressPercentage}%`,
                scaleX: 1,
                transition: {
                  width: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    duration: 0.8
                  },
                  scaleX: {
                    duration: 0.3,
                    ease: "easeOut"
                  }
                }
              }}
              style={{
                transformOrigin: 'left center'
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              <span>+{quest.xpReward} XP</span>
            </div>
            {quest.dueDate && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className={cn(
                  isOverdue && 'text-red-500 font-medium'
                )}>
                  {getTimeRemaining()}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!isCompleted && !isCancelled && !isFailed && quest.progress >= quest.maxProgress && (
              <motion.button
                onClick={onComplete}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <CheckCircle className="w-4 h-4" />
                Complete
              </motion.button>
            )}
            
            {!isCompleted && !isCancelled && !isFailed && quest.progress < quest.maxProgress && (
              <motion.button
                onClick={onComplete}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 border border-blue-500/30 rounded-lg transition-colors text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Manually mark this quest as complete"
              >
                <CheckCircle className="w-3 h-3" />
                Mark Complete
              </motion.button>
            )}

            {/* Cancel button for overdue or unwanted quests */}
            {!isCompleted && !isCancelled && !isFailed && (
              <motion.button
                onClick={onCancel}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm',
                  isOverdue 
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-600 border border-red-500/30'
                    : 'bg-gray-500/20 hover:bg-gray-500/30 text-gray-600 border border-gray-500/30'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={isOverdue ? "Cancel overdue quest" : "Cancel quest"}
              >
                <X className="w-3 h-3" />
                Cancel
              </motion.button>
            )}

            {/* Status indicators for completed/cancelled/failed quests */}
            {isCompleted && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-600 rounded-lg text-sm">
                <CheckCircle className="w-3 h-3" />
                Completed
              </div>
            )}
            
            {isCancelled && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-500/20 text-gray-600 rounded-lg text-sm">
                <X className="w-3 h-3" />
                Cancelled
              </div>
            )}
            
            {isFailed && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-600 rounded-lg text-sm">
                <AlertCircle className="w-3 h-3" />
                Failed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const QuestsView: React.FC = () => {
  const { 
    quests, 
    pinnedQuests, 
    completeQuest, 
    cancelQuest,
    cleanupOldQuests,
    cleanupPinnedQuests,
    pinQuest, 
    unpinQuest, 
    generateDailyQuests,
    updateQuestProgress,
    updateConsistencyProgress
  } = useQuestStore();
  const { addActivity } = useActivityLogStore();
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { notes } = useQuickNoteStore();
  const { getMoodTimeline } = useDailyReflectionStore();
  
  const [selectedTab, setSelectedTab] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'achievements'>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [isGeneratingQuests, setIsGeneratingQuests] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [questsStable, setQuestsStable] = useState(false);
  const [banner, setBanner] = useState<string>('');
  
  // Initialize component and handle quest progress updates
  useEffect(() => {
    const initializeComponent = async () => {
      if (!hasInitialized) {
        // Clean up any stale pinned quests
        cleanupPinnedQuests();
        
        // Small delay to prevent initial flicker
        await new Promise(resolve => setTimeout(resolve, 100));
        setHasInitialized(true);
        // Additional delay for quest updates to settle
        await new Promise(resolve => setTimeout(resolve, 200));
        setQuestsStable(true);
      }
      setIsInitializing(false);
    };

    initializeComponent();
  }, [hasInitialized, cleanupPinnedQuests]);

  // Check and update quest progress for existing trades when component mounts
  useEffect(() => {
    if (!selectedAccountId || isInitializing || !questsStable) return;
    
    const accountTrades = trades.filter(t => t.accountId === selectedAccountId);
    if (accountTrades.length === 0) return;
    
    // Only auto-update progress for achievement-type quests.
    // Daily/weekly/monthly quests should not instantly complete from historical data.
    const activeQuests = quests.filter(q => 
      (q.accountId === selectedAccountId || q.accountId === 'all') && 
      q.type === 'achievement' &&
      q.status !== 'completed' && 
      q.status !== 'cancelled' && 
      q.status !== 'failed'
    );
    
    // Batch the quest updates to reduce re-renders
    const questUpdates: Array<{ id: string; increment: number }> = [];
    
    activeQuests.forEach(quest => {
      const createdAt = new Date(quest.createdAt as any);
      const tradesSinceCreated = accountTrades.filter(trade => new Date(trade.entryTime) >= createdAt);
      // First Steps quest - should be completed if any trades exist since creation
      if (quest.title === 'First Steps' || quest.description.toLowerCase().includes('first trade')) {
        if (tradesSinceCreated.length > 0 && quest.progress === 0) {
          questUpdates.push({ id: quest.id, increment: 1 });
        }
      }
      
      // Risk Manager quest - count trades with good risk management
      if (quest.title === 'Risk Manager' || quest.description.toLowerCase().includes('risk')) {
        const goodRiskTrades = tradesSinceCreated.filter(trade => (trade as any).riskAmount <= 200);
        if (goodRiskTrades.length > quest.progress) {
          questUpdates.push({ id: quest.id, increment: goodRiskTrades.length - quest.progress });
        }
      }
      
      // Generic trade counting quests
      if (quest.description.toLowerCase().includes('trade') && 
          !quest.description.toLowerCase().includes('first') &&
          !quest.description.toLowerCase().includes('risk') &&
          !quest.description.toLowerCase().includes('consecutive')) {
        if (tradesSinceCreated.length > quest.progress) {
          questUpdates.push({ id: quest.id, increment: tradesSinceCreated.length - quest.progress });
        }
      }
    });
    
    // Apply all updates in a batch
    questUpdates.forEach(({ id, increment }) => {
      updateQuestProgress(id, increment);
    });
    
    // Update consistency progress
    updateConsistencyProgress(selectedAccountId, accountTrades);
  }, [selectedAccountId, trades, quests, updateQuestProgress, updateConsistencyProgress, isInitializing, questsStable]);

  const filteredQuests = useMemo(() => {
    let filtered = quests;

    // Filter by tab
    if (selectedTab !== 'all') {
      const typeMap = {
        daily: 'daily',
        weekly: 'weekly', 
        monthly: 'monthly',
        achievements: 'achievement'
      };
      filtered = filtered.filter(q => q.type === typeMap[selectedTab as keyof typeof typeMap]);
    }

    // Filter by completion status
    if (!showCompleted) {
      filtered = filtered.filter(q => q.status !== 'completed');
    }
    
    // Filter by cancelled/failed status
    if (!showCancelled) {
      filtered = filtered.filter(q => q.status !== 'cancelled' && q.status !== 'failed');
    }

    return filtered;
  }, [quests, selectedTab, showCompleted, showCancelled]);

  const pinnedQuestsList = useMemo(() => {
    const pinned = quests.filter(q => 
      pinnedQuests.includes(q.id) && 
      q.status !== 'completed' && 
      q.status !== 'cancelled' && 
      q.status !== 'failed'
    );
    
    return pinned;
  }, [quests, pinnedQuests]);

  const questStats = useMemo(() => {
    const total = quests.filter(q => q.status !== 'cancelled' && q.status !== 'failed').length;
    const completed = quests.filter(q => q.status === 'completed').length;
    const active = quests.filter(q => q.status === 'in_progress' || q.status === 'pending').length;
    const overdue = quests.filter(q => {
      const isOverdue = q.dueDate && new Date(q.dueDate) < new Date();
      return isOverdue && q.status !== 'completed' && q.status !== 'cancelled' && q.status !== 'failed';
    }).length;
    const totalXP = quests.filter(q => q.status === 'completed').reduce((sum, q) => sum + q.xpReward, 0);
    
    return { total, completed, active, overdue, totalXP };
  }, [quests]);

  const handleCompleteQuest = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    // Automatically unpin completed quests
    if (pinnedQuests.includes(questId)) {
      unpinQuest(questId);
    }

    completeQuest(questId);
    
    // Add activity log entry
    addActivity({
      type: 'quest',
      title: `Completed Quest: ${quest.title}`,
      description: `Earned ${quest.xpReward} XP`,
      xpEarned: quest.xpReward,
      accountId: quest.accountId,
    });
  };

  const handleCancelQuest = (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    cancelQuest(questId);
    
    // Add activity log entry
    addActivity({
      type: 'quest',
      title: `Cancelled Quest: ${quest.title}`,
      description: 'Quest cancelled by user',
      xpEarned: 0,
      accountId: quest.accountId,
    });
  };

  const handleCleanupOldQuests = () => {
    const cleanedCount = cleanupOldQuests(7); // Clean quests older than 7 days
    if (cleanedCount > 0) {
      addActivity({
        type: 'quest',
        title: 'Quest Cleanup',
        description: `Cleaned up ${cleanedCount} old overdue quest${cleanedCount > 1 ? 's' : ''}`,
        xpEarned: 0,
        accountId: 'all',
      });
    }
  };

  const tabs = [
    { id: 'all', label: 'All Quests', icon: Trophy },
    { id: 'daily', label: 'Daily', icon: Calendar },
    { id: 'weekly', label: 'Weekly', icon: BarChart3 },
    { id: 'monthly', label: 'Monthly', icon: Crown },
    { id: 'achievements', label: 'Achievements', icon: Medal },
  ];

  return (
    <div className="p-8 max-w-6xl 2xl:max-w-[1400px] 3xl:max-w-[1600px] 4xl:max-w-[1800px] mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Quest Hub</h1>
        <p className="text-muted-foreground">
          Complete challenges and earn XP to level up your trading game
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{questStats.total}</div>
          <div className="text-sm text-muted-foreground">Total Quests</div>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{questStats.completed}</div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">{questStats.active}</div>
          <div className="text-sm text-muted-foreground">Active</div>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-500">{questStats.totalXP}</div>
          <div className="text-sm text-muted-foreground">Total XP</div>
        </div>
      </div>

      {/* Pinned Quests */}
      {pinnedQuestsList.length > 0 && !isInitializing && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Pin className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Pinned Quests</h2>
          </div>
          <div className="grid gap-4">
            {pinnedQuestsList.map((quest) => (
              <div key={`p-${quest.id}`} className="[transition:none]">
                <QuestCard
                  quest={quest}
                  isPinned={true}
                  onPin={() => pinQuest(quest.id)}
                  onUnpin={() => unpinQuest(quest.id)}
                  onComplete={() => handleCompleteQuest(quest.id)}
                  onCancel={() => handleCancelQuest(quest.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 p-1 bg-muted/30 rounded-xl">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
              selectedTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </motion.button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
              showCompleted 
                ? 'bg-primary/20 text-primary' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <Filter className="w-4 h-4" />
{showCompleted ? 'Hide' : 'Show'} Completed ({questStats.completed})
          </button>
          
          <button
            onClick={() => setShowCancelled(!showCancelled)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
              showCancelled 
                ? 'bg-gray-500/20 text-gray-600' 
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <X className="w-4 h-4" />
{showCancelled ? 'Hide' : 'Show'} Cancelled
          </button>

          {questStats.overdue > 0 && (
            <div className="flex items-center gap-1 px-3 py-2 bg-red-500/10 text-red-600 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4" />
              {questStats.overdue} Overdue
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {questStats.overdue > 0 && (
            <motion.button
              onClick={handleCleanupOldQuests}
              className="flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 border border-red-500/30 rounded-lg transition-colors text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Clean up old overdue quests (7+ days)"
            >
              <Trash2 className="w-4 h-4" />
              Cleanup Old
            </motion.button>
          )}
          
          <motion.button
            onClick={async () => {
              setIsGeneratingQuests(true);
              try {
                // Get current mood from recent mood timeline
                const todayMood = getMoodTimeline(new Date().toISOString().split('T')[0]);
                const currentMood = todayMood.length > 0 ? todayMood[todayMood.length - 1].mood : 'neutral';
                
                // Generate AI-powered quests with current data (force regenerate)
                const before = useQuestStore.getState().quests.length;
                await generateDailyQuests(trades, notes, currentMood, true);
                setTimeout(() => {
                  const after = useQuestStore.getState().quests.length;
                  const diff = Math.max(after - before, 0);
                  setBanner(diff > 0 ? `Generated ${diff} quest${diff > 1 ? 's' : ''}` : 'No new quests generated');
                  setTimeout(() => setBanner(''), 2500);
                }, 50);
              } catch (error) {
                console.error('❌ Error in quest generation:', error);
              } finally {
                setIsGeneratingQuests(false);
              }
            }}
            disabled={isGeneratingQuests}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={cn("w-4 h-4", isGeneratingQuests && "animate-spin")} />
            {isGeneratingQuests ? 'Generating...' : 'Generate Smart Quests'}
          </motion.button>
        </div>
      </div>

      {banner && (
        <div className="px-3 py-2 bg-primary/10 text-primary rounded-lg text-sm inline-flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          {banner}
        </div>
      )}

      {/* Quests Grid */}
      <div className="space-y-4">
          {isInitializing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Loading quests...</h3>
              <p className="text-muted-foreground">Preparing your quest hub</p>
            </motion.div>
        ) : filteredQuests.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { delay: 0.1 }
              }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <Trophy className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No quests found</h3>
              <p className="text-muted-foreground">
                {selectedTab === 'all' 
                  ? 'Start your journey by generating daily quests!'
                  : `No ${selectedTab} quests available. Try a different category.`
                }
              </p>
            </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredQuests.map((quest) => (
              <div key={`l-${quest.id}`} className="[transition:none]">
                <QuestCard
                  quest={quest}
                  isPinned={pinnedQuests.includes(quest.id)}
                  onPin={() => pinQuest(quest.id)}
                  onUnpin={() => unpinQuest(quest.id)}
                  onComplete={() => handleCompleteQuest(quest.id)}
                  onCancel={() => handleCancelQuest(quest.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievement Showcase */}
      {selectedTab === 'achievements' && (
        <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl font-semibold text-foreground">Achievement Showcase</h3>
            </div>
            <p className="text-muted-foreground">
              Complete trading milestones to unlock exclusive achievements and earn bonus XP!
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Medal className="w-4 h-4" />
                <span>Permanent Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                <span>Exclusive Rewards</span>
              </div>
              <div className="flex items-center gap-1">
                <Gift className="w-4 h-4" />
                <span>Bonus XP</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 