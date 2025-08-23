import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Flame, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Target,
  Zap,
  Star,
  TrendingUp,
  Award,
  X,
  MoreVertical,
  Edit3,
  Trash2
} from 'lucide-react';
import { useRuleTallyStore } from '@/store/useRuleTallyStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { cn } from '@/lib/utils';
import type { HabitCategory } from '@/types';

type ViewMode = 'week' | 'month';

// Helper function to get appropriate streak text based on habit category
const getStreakText = (category: HabitCategory): string => {
  switch (category) {
    case 'trading':
      return 'market day';
    case 'weekdays':
      return 'weekday';
    case 'daily':
      return 'day';
    case 'custom':
      return 'day';
    default:
      return 'day';
  }
};

// Helper function to get category icon and description
const getCategoryInfo = (category: HabitCategory) => {
  switch (category) {
    case 'trading':
      return { icon: '📊', description: 'Market days' };
    case 'weekdays':
      return { icon: '💼', description: 'Weekdays' };
    case 'daily':
      return { icon: '🔄', description: 'Daily' };
    case 'custom':
      return { icon: '⚙️', description: 'Custom' };
    default:
      return { icon: '🔄', description: 'Daily' };
  }
};

// Habit Creation Modal Component
interface HabitCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateHabit: (label: string, emoji: string, category: HabitCategory) => Promise<void>;
  editingHabit?: any;
  onEditHabit?: (label: string, emoji: string, category: HabitCategory) => Promise<void>;
}

const HabitCreationModal: React.FC<HabitCreationModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreateHabit, 
  editingHabit,
  onEditHabit 
}) => {
  const [label, setLabel] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory>('daily');
  const [isCreating, setIsCreating] = useState(false);

  const isEditMode = !!editingHabit;

  // Populate form when editing
  useEffect(() => {
    if (editingHabit) {
      setLabel(editingHabit.label || '');
      setSelectedEmoji(editingHabit.emoji || '🎯');
      setSelectedCategory(editingHabit.category || 'daily');
    } else {
      setLabel('');
      setSelectedEmoji('🎯');
      setSelectedCategory('daily');
    }
  }, [editingHabit]);

  const commonEmojis = [
    '🎯', '💪', '📚', '🏃‍♂️', '🧘‍♀️', '💧', '🥗', '😴', 
    '📝', '🎨', '🎵', '🌱', '💡', '🔥', '⚡', '🌟',
    '🏆', '🎪', '🎭', '🍎', '🎲', '🎳', '🎸', '🥤'
  ];

  const categoryOptions = [
    {
      value: 'daily' as HabitCategory,
      label: 'Daily',
      description: 'Every day (7 days/week)',
      icon: '🔄',
      examples: 'Drink water, exercise, meditate'
    },
    {
      value: 'trading' as HabitCategory,
      label: 'Trading',
      description: 'Market days only (Mon-Fri)',
      icon: '📊',
      examples: 'Review charts, log trades, follow rules'
    },
    {
      value: 'weekdays' as HabitCategory,
      label: 'Weekdays',
      description: 'Monday through Friday',
      icon: '💼',
      examples: 'Work tasks, professional development'
    },
    {
      value: 'custom' as HabitCategory,
      label: 'Custom',
      description: 'Specific days of the week',
      icon: '⚙️',
      examples: 'Gym (Mon/Wed/Fri), meal prep (Sunday)'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    setIsCreating(true);
    try {
      if (isEditMode && onEditHabit) {
        await onEditHabit(label.trim(), selectedEmoji, selectedCategory);
      } else {
        await onCreateHabit(label.trim(), selectedEmoji, selectedCategory);
      }
      setLabel('');
      setSelectedEmoji('🎯');
      setSelectedCategory('daily');
      onClose();
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} habit:`, error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setLabel('');
      setSelectedEmoji('🎯');
      setSelectedCategory('daily');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="bg-card/95 backdrop-blur-sm rounded-3xl p-8 border border-border/50 shadow-2xl max-w-md w-full"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {isEditMode ? 'Edit Habit' : 'Create New Habit'}
            </h2>
            <motion.button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isCreating}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Emoji Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Choose an emoji
              </label>
              <div className="grid grid-cols-8 gap-2">
                {commonEmojis.map((emoji) => (
                  <motion.button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all",
                      selectedEmoji === emoji
                        ? "bg-primary/20 border-2 border-primary shadow-lg"
                        : "bg-muted/30 hover:bg-muted/50 border-2 border-transparent"
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={isCreating}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Habit type
              </label>
              <div className="grid grid-cols-1 gap-3">
                {categoryOptions.map((category) => (
                  <motion.button
                    key={category.value}
                    type="button"
                    onClick={() => setSelectedCategory(category.value)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      selectedCategory === category.value
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-border/30 bg-muted/20 hover:border-primary/30 hover:bg-primary/5"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isCreating}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{category.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">{category.label}</span>
                          <span className="text-xs text-muted-foreground">{category.description}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {category.examples}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Habit Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Habit name
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Drink 8 glasses of water"
                className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                maxLength={50}
                disabled={isCreating}
                autoFocus
              />
              <div className="text-xs text-muted-foreground mt-2">
                {label.length}/50 characters
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
              <div className="text-sm text-muted-foreground mb-2">Preview:</div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-xl">
                  {selectedEmoji}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">
                    {label || 'Your habit name'}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>{categoryOptions.find(c => c.value === selectedCategory)?.icon}</span>
                    <span>{categoryOptions.find(c => c.value === selectedCategory)?.description}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <motion.button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 rounded-xl bg-muted/30 text-muted-foreground font-medium hover:bg-muted/50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isCreating}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!label.trim() || isCreating}
              >
                {isCreating 
                  ? (isEditMode ? 'Updating...' : 'Creating...') 
                  : (isEditMode ? 'Update Habit' : 'Create Habit')
                }
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Delete Confirmation Dialog Component
interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  habitName: string;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  habitName 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Failed to delete habit:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-card/95 backdrop-blur-sm rounded-3xl p-8 border border-border/50 shadow-2xl max-w-md w-full"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Delete Habit</h2>
            <p className="text-muted-foreground">
              Are you sure you want to delete <strong>"{habitName}"</strong>? 
              This will also remove all tally history and cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <motion.button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-muted/30 text-muted-foreground font-medium hover:bg-muted/50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isDeleting}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleConfirm}
              className="flex-1 px-4 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Habit'}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Dopamine-driven Tally Button Component
interface TallyButtonProps {
  onTally: (event: React.MouseEvent) => void;
  count: number;
  isToday?: boolean;
}

const TallyButton: React.FC<TallyButtonProps> = ({ onTally, count, isToday = false }) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showBurst, setShowBurst] = useState(false);

  const handleClick = (event: React.MouseEvent) => {
    setIsPressed(true);
    setShowBurst(true);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    onTally(event);
    
    setTimeout(() => {
      setIsPressed(false);
      setShowBurst(false);
    }, 600);
  };

  return (
    <motion.button
      onClick={handleClick}
      className={cn(
        "relative w-12 h-12 rounded-2xl border-2 transition-all duration-200 overflow-hidden",
        isToday 
          ? "bg-gradient-to-br from-primary/20 to-primary/30 border-primary/40 shadow-lg shadow-primary/20" 
          : "bg-muted/30 border-border hover:border-primary/30 hover:bg-primary/10"
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      animate={isPressed ? { 
        scale: [1, 1.2, 1],
        rotate: [0, -5, 5, 0]
      } : {}}
      transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
    >
      {/* Burst Animation */}
      <AnimatePresence>
        {showBurst && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/40 to-primary/60"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </AnimatePresence>

      {/* Count Display */}
      <div className="relative z-10 flex items-center justify-center h-full">
        {count === 0 ? (
          <Plus className={cn(
            "w-5 h-5 transition-colors",
            isToday ? "text-primary" : "text-muted-foreground"
          )} />
        ) : (
          <motion.span
            key={count}
            className={cn(
              "text-sm font-bold",
              isToday ? "text-primary" : "text-foreground"
            )}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
          >
            {count}
          </motion.span>
        )}
      </div>

      {/* Milestone Glow */}
      {count > 0 && count % 5 === 0 && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-2xl"
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
};

// Enhanced Tally Marks with Animation
interface AnimatedTallyMarksProps {
  count: number;
  maxVisible?: number;
}

const AnimatedTallyMarks: React.FC<AnimatedTallyMarksProps> = ({ count, maxVisible = 15 }) => {
  const groups = Math.floor(count / 5);
  const remainder = count % 5;
  const showOverflow = count > maxVisible;

  const renderGroup = (groupIndex: number) => (
    <motion.div
      key={groupIndex}
      className="relative flex gap-1 mr-3"
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ delay: groupIndex * 0.1, type: "spring", stiffness: 300 }}
    >
      {/* Four vertical lines */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-0.5 h-6 bg-primary rounded-full"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: (groupIndex * 0.1) + (i * 0.05) }}
        />
      ))}
      {/* Diagonal line */}
      <motion.div
        className="absolute w-8 h-0.5 bg-primary rounded-full transform rotate-45 top-3 left-0"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: (groupIndex * 0.1) + 0.2 }}
      />
    </motion.div>
  );

  const renderRemainder = () => (
    <div className="flex gap-1">
      {Array.from({ length: remainder }).map((_, i) => (
        <motion.div
          key={i}
          className="w-0.5 h-6 bg-primary rounded-full"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: groups * 0.1 + i * 0.05 }}
        />
      ))}
    </div>
  );

  return (
    <div className="flex items-center gap-2 min-h-[32px]">
      <div className="flex items-center">
        {/* Complete groups */}
        {Array.from({ length: Math.min(groups, Math.floor(maxVisible / 5)) }).map((_, i) => 
          renderGroup(i)
        )}
        
        {/* Remainder marks */}
        {remainder > 0 && !showOverflow && renderRemainder()}
        
        {/* Overflow indicator */}
        {showOverflow && (
          <motion.div
            className="text-xs text-muted-foreground ml-2 px-2 py-1 bg-muted/50 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            +{count - maxVisible}
          </motion.div>
        )}
      </div>
      
      {/* Total count with celebration */}
      <motion.div
        className={cn(
          "text-sm font-bold px-2 py-1 rounded-full transition-colors",
          count === 0 ? "text-muted-foreground" :
          count % 10 === 0 ? "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-500/10" :
          count % 5 === 0 ? "text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-500/10" :
          "text-primary bg-primary/10"
        )}
        animate={count % 5 === 0 ? { 
          scale: [1, 1.1, 1],
          rotate: [0, -2, 2, 0]
        } : {}}
        transition={{ duration: 0.5 }}
      >
        {count}
      </motion.div>
    </div>
  );
};

// Habit Rule Card Component
interface HabitRuleCardProps {
  rule: any;
  tallyCount: number;
  streak: any;
  onTally: (event: React.MouseEvent) => void;
  onEdit: (rule: any) => void;
  onDelete: (ruleId: string) => void;
  viewMode: ViewMode;
  weeklyData?: number[];
  monthlyData?: number[];
}

const HabitRuleCard: React.FC<HabitRuleCardProps> = ({ 
  rule, 
  tallyCount, 
  streak, 
  onTally, 
  onEdit,
  onDelete,
  viewMode,
  weeklyData = [],
  monthlyData = []
}) => {
  const [showCelebration, setShowCelebration] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isToday = true; // You might want to pass this as a prop

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowMenu(false);
    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  const handleTally = (event: React.MouseEvent) => {
    onTally(event);
    
    // Show celebration for milestones
    if ((tallyCount + 1) % 5 === 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  };

  const data = viewMode === 'week' ? weeklyData : monthlyData;
  const maxCount = Math.max(...data, tallyCount);

  return (
    <motion.div
      className="relative bg-card/50 backdrop-blur-sm rounded-3xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 overflow-hidden"
      whileHover={{ y: -2, scale: 1.01 }}
      layout
    >
      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/30 rounded-3xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-2xl">
            {rule.emoji}
          </div>
          
          <div className="flex-1 flex justify-center px-3">
            <h3 className="font-semibold text-foreground text-center">{rule.label}</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <TallyButton 
              onTally={handleTally} 
              count={tallyCount} 
              isToday={isToday}
            />
            
            {/* Management Menu */}
            <div className="relative">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-2 rounded-xl hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MoreVertical className="w-4 h-4" />
              </motion.button>
              
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    className="absolute right-0 top-full mt-2 bg-card/95 backdrop-blur-sm rounded-xl border border-border/50 shadow-lg z-50 min-w-[140px]"
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <motion.button
                      onClick={() => {
                        onEdit(rule);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/30 transition-colors rounded-t-xl"
                      whileHover={{ x: 2 }}
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Habit
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        onDelete(rule.id);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors rounded-b-xl"
                      whileHover={{ x: 2 }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Habit
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Tally Marks */}
        <div className="mb-6">
          <AnimatedTallyMarks count={tallyCount} />
        </div>

        {/* Progress Visualization */}
        {data.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {viewMode === 'week' ? 'This Week' : 'This Month'}
              </span>
              <span className="text-xs text-muted-foreground">
                Total: {data.reduce((sum, count) => sum + count, 0)}
              </span>
            </div>
            
            <div className="flex items-end gap-1 h-16">
              {data.map((count, index) => (
                <motion.div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-primary/20 to-primary/40 rounded-t-lg min-h-[4px]"
                  style={{ 
                    height: maxCount > 0 ? `${(count / maxCount) * 100}%` : '4px'
                  }}
                  initial={{ height: 0 }}
                  animate={{ 
                    height: maxCount > 0 ? `${(count / maxCount) * 100}%` : '4px'
                  }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Milestone Badges */}
        {tallyCount > 0 && (
          <div className="flex items-center gap-2 mt-4">
            {tallyCount >= 5 && (
              <motion.div
                className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-xs font-medium"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Target className="w-3 h-3" />
                Consistent
              </motion.div>
            )}
            {tallyCount >= 10 && (
              <motion.div
                className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full text-xs font-medium"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Star className="w-3 h-3" />
                Milestone
              </motion.div>
            )}
            {streak && streak.currentStreak >= 7 && (
              <motion.div
                className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full text-xs font-medium"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Flame className="w-3 h-3" />
                On Fire
              </motion.div>
            )}
          </div>
        )}

        {/* Category and Streak Info */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/20">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/30 text-xs text-muted-foreground">
            <span>{getCategoryInfo(rule.category).icon}</span>
            <span>{getCategoryInfo(rule.category).description}</span>
          </div>
          {streak && streak.currentStreak > 0 && (
            <div className="flex items-center gap-1 text-xs text-orange-500">
              <Flame className="w-3 h-3" />
              <span>
                {streak.currentStreak} {getStreakText(rule.category)} streak
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Main Minimal Habit Tracker Component
export const MinimalHabitTracker: React.FC = () => {
  const { selectedAccountId } = useAccountFilterStore();
  const {
    rules,
    addTally,
    addRule,
    updateRule,
    deleteRule,
    getRulesByAccount,
    getTallyCountForRule,
    getStreakForRule,
    loadRules,
    loadLogs,
    getWeeklyTallies,
    getMonthlyTallies,
  } = useRuleTallyStore();

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
  const [floatingRewards, setFloatingRewards] = useState<Array<{
    id: string;
    x: number;
    y: number;
    emoji: string;
  }>>([]);

  const today = new Date().toISOString().split('T')[0];
  const accountRules = selectedAccountId ? getRulesByAccount(selectedAccountId) : [];

  // Load data
  useEffect(() => {
    if (selectedAccountId) {
      loadRules(selectedAccountId);
      loadLogs(selectedAccountId);
    }
  }, [selectedAccountId, loadRules, loadLogs]);

  const handleCreateHabit = async (label: string, emoji: string, category: HabitCategory) => {
    if (!selectedAccountId) return;
    
    try {
      // Define default schedules for each category
      let schedule;
      switch (category) {
        case 'trading':
          schedule = { days: [1, 2, 3, 4, 5] }; // Monday to Friday
          break;
        case 'weekdays':
          schedule = { days: [1, 2, 3, 4, 5] }; // Monday to Friday
          break;
        case 'daily':
          schedule = { days: [0, 1, 2, 3, 4, 5, 6] }; // All days
          break;
        case 'custom':
          schedule = { days: [1, 2, 3, 4, 5] }; // Default to weekdays, user can customize later
          break;
      }

      await addRule({
        label,
        emoji,
        accountId: selectedAccountId,
        isActive: true,
        category,
        schedule,
      });
    } catch (error) {
      console.error('Failed to create habit:', error);
      throw error;
    }
  };

  const handleEditHabit = async (label: string, emoji: string, category: HabitCategory) => {
    if (!editingHabit) return;
    
    try {
      // Define default schedules for each category
      let schedule;
      switch (category) {
        case 'trading':
          schedule = { days: [1, 2, 3, 4, 5] }; // Monday to Friday
          break;
        case 'weekdays':
          schedule = { days: [1, 2, 3, 4, 5] }; // Monday to Friday
          break;
        case 'daily':
          schedule = { days: [0, 1, 2, 3, 4, 5, 6] }; // All days
          break;
        case 'custom':
          schedule = { days: [1, 2, 3, 4, 5] }; // Default to weekdays, user can customize later
          break;
      }

      await updateRule(editingHabit.id, {
        label,
        emoji,
        category,
        schedule,
      });
      setEditingHabit(null);
    } catch (error) {
      console.error('Failed to update habit:', error);
      throw error;
    }
  };

  const handleDeleteHabit = async () => {
    if (!deletingHabitId) return;
    
    try {
      await deleteRule(deletingHabitId);
      setDeletingHabitId(null);
    } catch (error) {
      console.error('Failed to delete habit:', error);
    }
  };

  const handleAddTally = async (ruleId: string, event: React.MouseEvent) => {
    if (!selectedAccountId) return;
    
    try {
      await addTally(ruleId, selectedAccountId, 1);
      
      // Create floating reward animation
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const newReward = {
        id: crypto.randomUUID(),
        x: rect.left + rect.width / 2,
        y: rect.top,
        emoji: '🎯',
      };
      
      setFloatingRewards(prev => [...prev, newReward]);
      
      // Remove after animation
      setTimeout(() => {
        setFloatingRewards(prev => prev.filter(r => r.id !== newReward.id));
      }, 2000);
      
    } catch (error) {
      console.error('Failed to add tally:', error);
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getDateRangeText = () => {
    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Calculate summary stats
  const totalTallies = accountRules.reduce((sum, rule) => sum + getTallyCountForRule(rule.id, today), 0);
  const activeStreaks = accountRules.filter(rule => {
    const streak = getStreakForRule(rule.id);
    return streak && streak.currentStreak > 0;
  }).length;

  return (
    <div className="space-y-8 p-6 2xl:p-8 3xl:p-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Habit Tracker</h1>
          <p className="text-muted-foreground">Build discipline through consistent daily actions</p>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Summary Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalTallies}</div>
              <div className="text-xs text-muted-foreground">Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{activeStreaks}</div>
              <div className="text-xs text-muted-foreground">Streaks</div>
            </div>
          </div>

          {/* Create Habit Button */}
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            New Habit
          </motion.button>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={cn(
              "px-4 py-2 rounded-xl font-medium transition-all",
              viewMode === 'week' 
                ? "bg-primary text-primary-foreground shadow-lg" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={cn(
              "px-4 py-2 rounded-xl font-medium transition-all",
              viewMode === 'month' 
                ? "bg-primary text-primary-foreground shadow-lg" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            Month
          </button>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-lg font-semibold text-foreground min-w-[200px] text-center">
            {getDateRangeText()}
          </div>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Habit Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accountRules.map((rule) => {
          const tallyCount = getTallyCountForRule(rule.id, today);
          const streak = getStreakForRule(rule.id);
          
          // Calculate start of week for weekly data
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
          const weekStartDate = startOfWeek.toISOString().split('T')[0];
          
          const weeklyData = getWeeklyTallies(rule.id, weekStartDate);
          const monthlyData = getMonthlyTallies(rule.id, currentDate.getFullYear(), currentDate.getMonth());
          
          return (
            <HabitRuleCard
              key={rule.id}
              rule={rule}
              tallyCount={tallyCount}
              streak={streak}
              onTally={(event) => handleAddTally(rule.id, event)}
              onEdit={(rule) => setEditingHabit(rule)}
              onDelete={(ruleId) => setDeletingHabitId(ruleId)}
              viewMode={viewMode}
              weeklyData={weeklyData.map(d => d.count)}
              monthlyData={monthlyData.map(d => d.count)}
            />
          );
        })}
      </div>

      {/* Floating Rewards */}
      <AnimatePresence>
        {floatingRewards.map((reward) => (
          <motion.div
            key={reward.id}
            className="fixed pointer-events-none z-50 text-2xl"
            style={{ left: reward.x, top: reward.y }}
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.2, 1, 0.8],
              y: -100,
              x: (Math.random() - 0.5) * 100
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
          >
            {reward.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Empty State */}
      {accountRules.length === 0 && (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-3xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No habits yet</h3>
          <p className="text-muted-foreground mb-6">Create your first habit to start building discipline</p>
          <motion.button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Add First Habit
          </motion.button>
        </motion.div>
      )}

      {/* Habit Creation Modal */}
      <HabitCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateHabit={handleCreateHabit}
      />

      {/* Habit Edit Modal */}
      <HabitCreationModal
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        onCreateHabit={handleCreateHabit}
        editingHabit={editingHabit}
        onEditHabit={handleEditHabit}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={!!deletingHabitId}
        onClose={() => setDeletingHabitId(null)}
        onConfirm={handleDeleteHabit}
        habitName={
          deletingHabitId 
            ? accountRules.find(r => r.id === deletingHabitId)?.label || 'Unknown Habit'
            : ''
        }
      />
    </div>
  );
};

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export default MinimalHabitTracker;
