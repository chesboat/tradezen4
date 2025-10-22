import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Flame, 
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Edit3,
  Trash2,
  ChevronDown,
  Calendar
} from 'lucide-react';
import { useRuleTallyStore } from '@/store/useRuleTallyStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { cn, formatLocalDate, parseLocalDateString } from '@/lib/utils';
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

// Apple-style Habit Creation Modal Component
interface HabitCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateHabit: (label: string, emoji: string, category: HabitCategory) => Promise<void>;
  editingHabit?: any;
  onEditHabit?: (label: string, emoji: string, category: HabitCategory) => Promise<void>;
}

const AppleHabitCreationModal: React.FC<HabitCreationModalProps> = ({ 
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
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

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
    '🏆', '🎪', '🎭', '🍎', '🎲', '🎳', '🎸', '🥤',
    '📊', '📈', '💼', '🖥️', '📱', '⌚', '🎧', '📷'
  ];

  const categoryOptions = [
    {
      value: 'daily' as HabitCategory,
      label: 'Daily',
      description: 'Every day',
      icon: '🔄',
    },
    {
      value: 'trading' as HabitCategory,
      label: 'Trading',
      description: 'Market days only',
      icon: '📊',
    },
    {
      value: 'weekdays' as HabitCategory,
      label: 'Weekdays',
      description: 'Mon - Fri',
      icon: '💼',
    },
    {
      value: 'custom' as HabitCategory,
      label: 'Custom',
      description: 'Specific days',
      icon: '⚙️',
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
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        {/* Mobile: Bottom Sheet, Desktop: Centered Modal */}
        <motion.div
          className="bg-background w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl border border-border shadow-2xl overflow-hidden"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              {isEditMode ? 'Edit Habit' : 'New Habit'}
            </h2>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              disabled={isCreating}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Habit Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Name
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Review my trades"
                className="w-full px-4 py-2.5 rounded-lg bg-muted/30 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                maxLength={50}
                disabled={isCreating}
                autoFocus
              />
            </div>

            {/* Emoji Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Icon
              </label>
              <div className="grid grid-cols-10 gap-1.5 max-h-32 overflow-y-auto p-2 bg-muted/30 rounded-lg border border-border">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all",
                      selectedEmoji === emoji
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "hover:bg-muted/50"
                    )}
                    disabled={isCreating}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Selection - iOS Picker Style */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Frequency
              </label>
              <button
                type="button"
                onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg bg-muted/30 border border-border text-foreground hover:bg-muted/50 transition-colors"
                disabled={isCreating}
              >
                <div className="flex items-center gap-2">
                  <span>{categoryOptions.find(c => c.value === selectedCategory)?.icon}</span>
                  <span>{categoryOptions.find(c => c.value === selectedCategory)?.label}</span>
                  <span className="text-xs text-muted-foreground">
                    · {categoryOptions.find(c => c.value === selectedCategory)?.description}
                  </span>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  showCategoryPicker && "rotate-180"
                )} />
              </button>

              <AnimatePresence>
                {showCategoryPicker && (
                  <motion.div
                    className="mt-2 bg-muted/30 rounded-lg border border-border overflow-hidden"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {categoryOptions.map((category, index) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(category.value);
                          setShowCategoryPicker(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors",
                          index !== categoryOptions.length - 1 && "border-b border-border"
                        )}
                        disabled={isCreating}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{category.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-foreground">{category.label}</div>
                            <div className="text-xs text-muted-foreground">{category.description}</div>
                          </div>
                        </div>
                        {selectedCategory === category.value && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 rounded-lg bg-muted/30 text-foreground font-medium hover:bg-muted/50 transition-colors"
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!label.trim() || isCreating}
              >
                {isCreating 
                  ? (isEditMode ? 'Saving...' : 'Creating...') 
                  : (isEditMode ? 'Save' : 'Add Habit')
                }
              </button>
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
        className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-background rounded-2xl p-6 border border-border shadow-2xl max-w-md w-full"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Delete Habit?</h2>
            <p className="text-sm text-muted-foreground">
              This will delete <strong>"{habitName}"</strong> and all its history. This action cannot be undone.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg bg-muted/30 text-foreground font-medium hover:bg-muted/50 transition-colors"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Apple-style Checkbox Button (iOS Reminders style)
interface CheckboxButtonProps {
  onCheck: (event: React.MouseEvent) => void;
  isChecked: boolean;
  isToday?: boolean;
}

const CheckboxButton: React.FC<CheckboxButtonProps> = ({ onCheck, isChecked, isToday = false }) => {
  return (
    <motion.button
      onClick={onCheck}
      className={cn(
        "relative w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center",
        isChecked 
          ? "bg-primary border-primary" 
          : isToday 
            ? "border-primary/60 hover:border-primary" 
            : "border-border hover:border-primary/40"
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <AnimatePresence>
        {isChecked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Apple-style Progress Dots (iOS Health style)
interface ProgressDotsProps {
  completed: number;
  total: number;
}

const ProgressDots: React.FC<ProgressDotsProps> = ({ completed, total }) => {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            i < completed ? "bg-primary" : "bg-border"
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.05 }}
        />
      ))}
    </div>
  );
};

// Apple-style Habit Card Component
interface AppleHabitCardProps {
  rule: any;
  tallyCount: number;
  streak: any;
  onTally: (event: React.MouseEvent, dateOverride?: string) => void;
  onEdit: (rule: any) => void;
  onDelete: (ruleId: string) => void;
  viewMode: ViewMode;
  weeklyData?: { date: string; count: number }[];
  monthlyData?: { date: string; count: number }[];
}

const AppleHabitCard: React.FC<AppleHabitCardProps> = ({ 
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
  const [showMenu, setShowMenu] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const todayStr = formatLocalDate(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const isToday = selectedDate === todayStr;

  // Generate last 30 days for date picker (needed early for keyboard shortcuts)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return formatLocalDate(date);
  });

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMenu(false);
      setShowDatePicker(false);
    };
    if (showMenu || showDatePicker) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu, showDatePicker]);

  // Keyboard shortcuts - Extra Polish
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // 'c' for calendar picker
      if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
        setShowDatePicker(prev => !prev);
      }
      // Escape to close pickers
      if (e.key === 'Escape') {
        setShowDatePicker(false);
        if (!isToday) setSelectedDate(todayStr);
      }
      // Arrow keys to navigate days
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const date = new Date(parseLocalDateString(selectedDate));
        date.setDate(date.getDate() - 1);
        const newDate = formatLocalDate(date);
        // Don't go beyond 30 days
        if (last30Days.includes(newDate)) {
          setSelectedDate(newDate);
        }
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const date = new Date(parseLocalDateString(selectedDate));
        date.setDate(date.getDate() + 1);
        const newDate = formatLocalDate(date);
        // Don't go into future
        if (parseLocalDateString(newDate) <= parseLocalDateString(todayStr)) {
          setSelectedDate(newDate);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [selectedDate, todayStr, isToday, last30Days]);

  // Reduced motion support - Extra Polish
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const data = viewMode === 'week' ? weeklyData : monthlyData;
  const selectedEntry = data?.find(d => d.date === selectedDate);
  
  const singleDayCount = selectedEntry ? selectedEntry.count : (isToday ? tallyCount : 0);
  const isChecked = singleDayCount > 0;
  const totalPeriodCount = data?.reduce((sum, d) => sum + d.count, 0) || 0;
  const maxCount = Math.max(...(data?.map(d => d.count) || []), 1);
  
  const completedDays = data?.filter(d => d.count > 0).length || 0;
  const totalDays = data?.length || 7;

  const handleCheck = (event: React.MouseEvent) => {
    onTally(event, selectedDate);
    // Show toast feedback
    if (!isToday) {
      const dateObj = parseLocalDateString(selectedDate);
      const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      displayToast(`✓ Logged for ${formatted}`);
    }
  };

  const displayToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Check if yesterday was missed
  const yesterdayStr = formatLocalDate(new Date(Date.now() - 86400000));
  const yesterdayData = data?.find(d => d.date === yesterdayStr);
  const missedYesterday = !yesterdayData || yesterdayData.count === 0;

  return (
    <motion.div
      className="bg-background rounded-2xl p-5 border border-border hover:border-primary/30 transition-all"
      whileHover={{ y: -1 }}
      layout
    >
      {/* Date Context Banner - Phase 3 */}
      <AnimatePresence>
        {!isToday && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-2 bg-primary/10 rounded-lg flex items-center justify-between"
          >
            <span className="text-xs text-primary font-medium">
              📅 Logging for: {parseLocalDateString(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button 
              onClick={() => setSelectedDate(todayStr)}
              className="text-xs text-primary hover:underline font-medium"
            >
              Back to Today
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1">
          <CheckboxButton 
            onCheck={handleCheck} 
            isChecked={isChecked} 
            isToday={isToday}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{rule.emoji}</span>
              <h3 className="font-medium text-foreground">{rule.label}</h3>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">
                {categoryOptions.find(c => c.value === rule.category)?.description || 'Daily'}
              </span>
              {streak && streak.currentStreak > 0 && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <div className="flex items-center gap-1 text-xs text-orange-500">
                    <Flame className="w-3 h-3" />
                    <span>{streak.currentStreak} {getStreakText(rule.category)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Calendar & Edit Menu - Phase 3 */}
        <div className="flex items-center gap-1">
          {/* Calendar button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDatePicker(!showDatePicker);
            }}
            className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors text-muted-foreground"
            title="Log for a different date"
          >
            <Calendar className="w-4 h-4" />
          </button>

          {/* Edit Menu */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors text-muted-foreground"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div
                className="absolute right-0 top-full mt-1 bg-background rounded-lg border border-border shadow-lg z-50 min-w-[140px] overflow-hidden"
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    onEdit(rule);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/30 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    onDelete(rule.id);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors border-t border-border"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Date Picker Dropdown - Phase 3 */}
          <AnimatePresence>
            {showDatePicker && (
              <motion.div
                className="absolute right-0 top-full mt-1 bg-background rounded-lg border border-border shadow-lg z-50 w-48 max-h-64 overflow-y-auto"
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2">
                  <div className="text-xs font-semibold text-muted-foreground px-2 py-1 mb-1">
                    Select Date
                  </div>
                  {last30Days.map((date) => {
                    const dateObj = parseLocalDateString(date);
                    const isSelected = date === selectedDate;
                    const isCurrentDay = date === todayStr;
                    const dayData = data?.find(d => d.date === date);
                    const isLogged = dayData && dayData.count > 0;
                    
                    let label = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
                    if (isCurrentDay) label = 'Today';
                    else if (date === yesterdayStr) label = 'Yesterday';
                    
                    return (
                      <button
                        key={date}
                        onClick={() => {
                          setSelectedDate(date);
                          setShowDatePicker(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded transition-colors",
                          isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted/50 text-foreground"
                        )}
                      >
                        <span>{label}</span>
                        {isLogged && <Check className="w-3 h-3 text-green-500" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="mb-4">
        <ProgressDots completed={completedDays} total={totalDays} />
      </div>

      {/* Bar Chart - Phase 1: Enhanced Interaction */}
      {data && data.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{viewMode === 'week' ? 'This Week' : 'This Month'}</span>
            <span>{completedDays}/{totalDays} days</span>
          </div>
          
          <div className="flex items-end gap-0.5 h-12 relative">
            {data.map((d, index) => {
              const isFuture = parseLocalDateString(d.date) > parseLocalDateString(todayStr);
              const isSelectedBar = d.date === selectedDate;
              
              return (
                <div key={index} className="flex-1 relative group">
                  {/* Clickable overlay - Apple's solution for small targets */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isFuture) return;
                      setSelectedDate(d.date);
                      if (d.date !== todayStr) {
                        const dateObj = parseLocalDateString(d.date);
                        const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        displayToast(`Selected ${formatted}`);
                      }
                    }}
                    disabled={isFuture}
                    className={cn(
                      "absolute inset-0 -inset-y-2 z-10",
                      !isFuture && "cursor-pointer",
                      isFuture && "cursor-not-allowed"
                    )}
                    title={!isFuture ? parseLocalDateString(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : undefined}
                    aria-label={`Log habit for ${parseLocalDateString(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                  />
                  
                  {/* Visual bar */}
                  <motion.div
                    className={cn(
                      "relative bg-primary rounded-sm min-h-[2px] transition-all pointer-events-none",
                      d.count === 0 && "opacity-10",
                      isSelectedBar && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                      // Hover effect on parent group
                      !isFuture && "group-hover:opacity-100 group-hover:scale-y-110"
                    )}
                    style={{ 
                      height: d.count > 0 ? `${(d.count / maxCount) * 100}%` : '2px'
                    }}
                    initial={prefersReducedMotion ? {} : { height: 0 }}
                    animate={{ 
                      height: d.count > 0 ? `${(d.count / maxCount) * 100}%` : '2px'
                    }}
                    transition={prefersReducedMotion ? {} : { delay: index * 0.03, duration: 0.3 }}
                  />
                  
                  {/* Hover indicator - shows full height on hover for empty bars */}
                  {d.count === 0 && !isFuture && (
                    <div className="absolute inset-x-0 bottom-0 h-full bg-primary/20 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-0.5 text-[10px] text-center text-muted-foreground">
            {data.slice(0, 7).map((d, idx) => {
              const [yy, mm, dd] = d.date.split('-').map(Number);
              const day = new Date(yy, (mm || 1) - 1, dd || 1).getDay();
              const label = ['S','M','T','W','T','F','S'][day];
              return <div key={idx}>{label}</div>;
            })}
          </div>

          {/* Hint text with keyboard shortcut - Phase 1 + Extra Polish */}
          <div className="flex items-center justify-center gap-2 mt-1">
            <p className="text-[10px] text-muted-foreground text-center">
              Tap any day to log
            </p>
            <span className="text-[10px] text-muted-foreground">•</span>
            <p className="text-[10px] text-muted-foreground">
              Press <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">C</kbd> for calendar
            </p>
          </div>
        </div>
      )}

      {/* Yesterday Quick Action - Phase 2 */}
      <AnimatePresence>
        {missedYesterday && isToday && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                Missed yesterday?
              </span>
              <button
                onClick={(e) => {
                  onTally(e, yesterdayStr);
                  displayToast('✓ Logged for yesterday');
                }}
                className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors whitespace-nowrap"
              >
                ✓ Log it now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification - Extra Polish with sound effect */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-lg shadow-lg text-sm font-medium z-50 flex items-center gap-2"
            role="status"
            aria-live="polite"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Category options for frequency picker
const categoryOptions = [
  {
    value: 'daily' as HabitCategory,
    label: 'Daily',
    description: 'Every day',
    icon: '🔄',
  },
  {
    value: 'trading' as HabitCategory,
    label: 'Trading',
    description: 'Market days only',
    icon: '📊',
  },
  {
    value: 'weekdays' as HabitCategory,
    label: 'Weekdays',
    description: 'Mon - Fri',
    icon: '💼',
  },
  {
    value: 'custom' as HabitCategory,
    label: 'Custom',
    description: 'Specific days',
    icon: '⚙️',
  }
];

// Main Apple Habit Tracker Component
export const AppleHabitTracker: React.FC = () => {
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

  const today = formatLocalDate(new Date());
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
      let schedule;
      switch (category) {
        case 'trading':
        case 'weekdays':
          schedule = { days: [1, 2, 3, 4, 5] };
          break;
        case 'daily':
          schedule = { days: [0, 1, 2, 3, 4, 5, 6] };
          break;
        case 'custom':
          schedule = { days: [1, 2, 3, 4, 5] };
          break;
      }

      await addRule({
        label,
        emoji,
        accountId: selectedAccountId,
        isActive: true,
        category,
        schedule,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to create habit:', error);
      throw error;
    }
  };

  const handleEditHabit = async (label: string, emoji: string, category: HabitCategory) => {
    if (!editingHabit) return;
    
    try {
      let schedule;
      switch (category) {
        case 'trading':
        case 'weekdays':
          schedule = { days: [1, 2, 3, 4, 5] };
          break;
        case 'daily':
          schedule = { days: [0, 1, 2, 3, 4, 5, 6] };
          break;
        case 'custom':
          schedule = { days: [1, 2, 3, 4, 5] };
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

  const handleAddTally = async (ruleId: string, event: React.MouseEvent, dateOverride?: string) => {
    if (!selectedAccountId) return;
    
    try {
      await addTally(ruleId, selectedAccountId, dateOverride);
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

  const completedToday = accountRules.filter(rule => getTallyCountForRule(rule.id, today) > 0).length;
  const activeStreaks = accountRules.filter(rule => {
    const streak = getStreakForRule(rule.id);
    return streak && streak.currentStreak > 0;
  }).length;

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-1">Habits</h1>
          <p className="text-sm text-muted-foreground">Build consistency through daily actions</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Habit
        </button>
      </div>

      {/* Stats & View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-2xl font-semibold text-foreground">{completedToday}</div>
            <div className="text-xs text-muted-foreground">Today</div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-orange-500">{activeStreaks}</div>
            <div className="text-xs text-muted-foreground">Streaks</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              viewMode === 'week' 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
              viewMode === 'month' 
                ? "bg-primary text-primary-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Month
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => navigateDate('prev')}
          className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-base font-medium text-foreground min-w-[200px] text-center">
          {getDateRangeText()}
        </div>
        
        <button
          onClick={() => navigateDate('next')}
          className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Habit Cards */}
      {accountRules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountRules.map((rule) => {
            const tallyCount = getTallyCountForRule(rule.id, today);
            const streak = getStreakForRule(rule.id);
            
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
            const weekStartDate = formatLocalDate(startOfWeek);
            
            const weeklyData = getWeeklyTallies(rule.id, weekStartDate);
            const monthlyData = getMonthlyTallies(rule.id, currentDate.getFullYear(), currentDate.getMonth());
            
            return (
              <AppleHabitCard
                key={rule.id}
                rule={rule}
                tallyCount={tallyCount}
                streak={streak}
                onTally={(event, dateOverride) => handleAddTally(rule.id, event, dateOverride)}
                onEdit={(rule) => setEditingHabit(rule)}
                onDelete={(ruleId) => setDeletingHabitId(ruleId)}
                viewMode={viewMode}
                weeklyData={weeklyData}
                monthlyData={monthlyData}
              />
            );
          })}
        </div>
      ) : (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No habits yet</h3>
          <p className="text-sm text-muted-foreground mb-6">Create your first habit to start tracking</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Add Habit
          </button>
        </motion.div>
      )}

      {/* Modals */}
      <AppleHabitCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateHabit={handleCreateHabit}
      />

      <AppleHabitCreationModal
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        onCreateHabit={handleCreateHabit}
        editingHabit={editingHabit}
        onEditHabit={handleEditHabit}
      />

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

export default AppleHabitTracker;

