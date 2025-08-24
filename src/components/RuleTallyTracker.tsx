import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Settings, 
  Target, 
  Flame, 
  Calendar,
  CalendarDays,
  Trophy,
  Sparkles,
  Edit2,
  Trash2,
  X,
  Star,
  Zap
} from 'lucide-react';
import { useRuleTallyStore } from '@/store/useRuleTallyStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { Tooltip } from './ui/Tooltip';
import { cn } from '@/lib/utils';

type ViewMode = 'week' | 'month';

interface FloatingXPProps {
  x: number;
  y: number;
  amount: number;
  onComplete: () => void;
}

const FloatingXP: React.FC<FloatingXPProps> = ({ x, y, amount, onComplete }) => {
  return (
    <motion.div
      initial={{ x, y, opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{ 
        x: x + (Math.random() - 0.5) * 120,
        y: y - 100,
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.3, 1.1, 0.8],
        rotate: [10, -5, 0]
      }}
      transition={{ 
        duration: 2,
        ease: [0.25, 0.46, 0.45, 0.94],
        times: [0, 0.2, 0.8, 1]
      }}
      onAnimationComplete={onComplete}
      className="fixed pointer-events-none z-50 flex items-center gap-1 text-green-400 font-bold text-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 py-2 rounded-full border border-green-400/40 shadow-lg backdrop-blur-sm"
      style={{ left: x, top: y }}
    >
      <Zap className="w-5 h-5 text-yellow-400" />
      +{amount} XP
    </motion.div>
  );
};

interface ConfettiPiece {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocity: { x: number; y: number };
}

interface ConfettiProps {
  trigger: boolean;
  onComplete: () => void;
}

const Confetti: React.FC<ConfettiProps> = ({ trigger, onComplete }) => {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (trigger) {
      const colors = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7', '#06b6d4', '#f97316'];
      const newPieces: ConfettiPiece[] = [];
      
      for (let i = 0; i < 30; i++) {
        newPieces.push({
          id: `confetti-${i}`,
          x: Math.random() * window.innerWidth,
          y: -20,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          rotation: Math.random() * 360,
          velocity: {
            x: (Math.random() - 0.5) * 4,
            y: Math.random() * 3 + 2
          }
        });
      }
      
      setPieces(newPieces);
      setTimeout(() => {
        setPieces([]);
        onComplete();
      }, 3000);
    }
  }, [trigger, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{ 
              x: piece.x, 
              y: piece.y, 
              rotate: piece.rotation,
              opacity: 1 
            }}
            animate={{ 
              x: piece.x + piece.velocity.x * 100,
              y: window.innerHeight + 50,
              rotate: piece.rotation + 720,
              opacity: [1, 1, 0]
            }}
            transition={{ 
              duration: 3,
              ease: "easeOut"
            }}
            className="absolute w-2 h-2 rounded-sm"
            style={{ 
              backgroundColor: piece.color,
              width: piece.size,
              height: piece.size
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface TallyMarkProps {
  count: number;
  maxVisible?: number;
  onClick?: () => void;
  className?: string;
}

const TallyMarks: React.FC<TallyMarkProps> = ({ 
  count, 
  maxVisible = 25, 
  onClick,
  className 
}) => {
  const groups = Math.floor(count / 5);
  const remainder = count % 5;
  const totalVisible = Math.min(count, maxVisible);
  const showOverflow = count > maxVisible;

  const renderGroup = (groupIndex: number) => {
    const marks: JSX.Element[] = [];
    
    // Four vertical lines
    for (let i = 0; i < 4; i++) {
      marks.push(
        <div
          key={`${groupIndex}-${i}`}
          className="w-0.5 h-6 bg-primary"
        />
      );
    }
    
    // Diagonal line
    marks.push(
      <div
        key={`${groupIndex}-diagonal`}
        className="absolute w-8 h-0.5 bg-primary transform rotate-45 top-3 left-0"
      />
    );
    
    return (
      <div key={groupIndex} className="relative flex gap-1 mr-3">
        {marks}
      </div>
    );
  };

  const renderRemainder = () => {
    const marks: JSX.Element[] = [];
    for (let i = 0; i < remainder; i++) {
      marks.push(
        <div
          key={`remainder-${i}`}
          className="w-0.5 h-6 bg-primary"
        />
      );
    }
    return (
      <div className="flex gap-1">
        {marks}
      </div>
    );
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors min-h-[40px]",
        className
      )}
    >
      <div className="flex items-center">
        {/* Render complete groups */}
        {Array.from({ length: Math.min(groups, Math.floor(maxVisible / 5)) }).map((_, i) => 
          renderGroup(i)
        )}
        
        {/* Render remainder if we haven't hit the limit */}
        {remainder > 0 && totalVisible > groups * 5 && renderRemainder()}
        
        {/* Show overflow indicator */}
        {showOverflow && (
          <div className="text-xs text-muted-foreground ml-2">
            +{count - maxVisible}
          </div>
        )}
        
        {/* Show total count */}
        <div className="text-xs text-muted-foreground ml-2 font-medium">
          {count}
        </div>
      </div>
    </button>
  );
};

interface RuleRowProps {
  rule: any;
  tallyCount: number;
  streak: any;
  onTally: (e: React.MouseEvent) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const RuleRow: React.FC<RuleRowProps> = ({ 
  rule, 
  tallyCount, 
  streak, 
  onTally, 
  onEdit, 
  onDelete 
}) => {
  const showReward = tallyCount > 0 && tallyCount % 5 === 0;
  const rewardEmoji = tallyCount % 10 === 0 ? '🌟' : '🎯';

  return (
    <div className="group flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{rule.emoji}</span>
          <div>
            <div className="font-medium text-sm">{rule.label}</div>
            {streak && streak.currentStreak > 0 && (
              <div className="flex items-center gap-1 text-xs text-orange-500">
                <Flame className="w-3 h-3" />
                <span>{streak.currentStreak} day streak</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <TallyMarks count={tallyCount} />
        </div>
        
        {showReward && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="text-lg"
          >
            {rewardEmoji}
          </motion.div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Tooltip content={`Add tally for "${rule.label}"`}>
          <motion.button
            onClick={onTally}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/20 hover:from-primary/20 hover:to-primary/30 text-primary transition-all duration-200 shadow-sm hover:shadow-md border border-primary/20"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.3 }}
            >
              <Plus className="w-5 h-5" />
            </motion.div>
            
            {/* Pulse effect on hover */}
            <motion.div
              className="absolute inset-0 rounded-xl bg-primary/20"
              initial={{ scale: 1, opacity: 0 }}
              whileHover={{ scale: 1.2, opacity: 0.3 }}
              transition={{ duration: 0.2 }}
            />
          </motion.button>
        </Tooltip>
        
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface RuleFormProps {
  rule?: any;
  onSave: (data: { label: string; emoji: string }) => void;
  onCancel: () => void;
}

const RuleForm: React.FC<RuleFormProps> = ({ rule, onSave, onCancel }) => {
  const [label, setLabel] = useState(rule?.label || '');
  const [emoji, setEmoji] = useState(rule?.emoji || '🎯');
  
  const commonEmojis = ['🎯', '🚀', '💎', '⚡', '🔥', '✨', '🎪', '🏆', '💪', '🧠'];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (label.trim()) {
      onSave({ label: label.trim(), emoji });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-4 bg-card border border-border rounded-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Rule Name</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g., Set and forget, No FOMO trades"
            className="w-full px-3 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoFocus
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Emoji</label>
          <div className="flex gap-2 mb-2">
            {commonEmojis.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={cn(
                  "p-2 rounded-lg border transition-colors",
                  emoji === e 
                    ? "border-primary bg-primary/10" 
                    : "border-border hover:border-primary/50"
                )}
              >
                {e}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-20 px-2 py-1 bg-muted/50 border border-border rounded text-center"
            maxLength={2}
          />
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!label.trim()}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {rule ? 'Update Rule' : 'Add Rule'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80"
          >
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export const RuleTallyTracker: React.FC = () => {
  const { selectedAccountId } = useAccountFilterStore();
  const {
    rules,
    logs,
    addRule,
    updateRule,
    deleteRule,
    addTally,
    getRulesByAccount,
    getTallyCountForRule,
    getStreakForRule,
    loadRules,
    loadLogs,
    getWeeklyTallies,
    getMonthlyTallies,
  } = useRuleTallyStore();

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [floatingXPs, setFloatingXPs] = useState<Array<{
    id: string;
    x: number;
    y: number;
    amount: number;
  }>>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const accountRules = selectedAccountId ? getRulesByAccount(selectedAccountId) : [];

  // Load data on mount and account change
  useEffect(() => {
    if (selectedAccountId) {
      loadRules(selectedAccountId);
      loadLogs(selectedAccountId);
    }
  }, [selectedAccountId, loadRules, loadLogs]);

  const handleAddTally = async (ruleId: string, event: React.MouseEvent) => {
    if (!selectedAccountId) return;
    
    try {
      // Haptic feedback for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      await addTally(ruleId, selectedAccountId);
      
      // Create floating XP animation
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const newXP = {
        id: crypto.randomUUID(),
        x: rect.left + rect.width / 2,
        y: rect.top,
        amount: 5,
      };
      
      setFloatingXPs(prev => [...prev, newXP]);
      
      // Check for milestones and celebrations
      const currentCount = getTallyCountForRule(ruleId, today);
      const rule = accountRules.find(r => r.id === ruleId);
      const streak = getStreakForRule(ruleId);
      
      // Milestone celebrations
      if (currentCount > 0 && currentCount % 10 === 0) {
        // Major milestone - confetti!
        setShowConfetti(true);
        setCelebrationMessage(`🌟 ${currentCount} ${rule?.label} tallies today! Amazing streak!`);
        setShowCelebration(true);
        
        // Stronger haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        
        setTimeout(() => setShowCelebration(false), 3000);
      } else if (currentCount > 0 && currentCount % 5 === 0) {
        // Minor milestone
        setCelebrationMessage(`🎯 ${currentCount} ${rule?.label} tallies! Keep it up!`);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }
      
      // Streak celebrations
      if (streak && streak.currentStreak > 0 && streak.currentStreak % 7 === 0) {
        setShowConfetti(true);
        setCelebrationMessage(`🔥 ${streak.currentStreak} day streak! You're on fire!`);
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
      
    } catch (error) {
      console.error('Failed to add tally:', error);
    }
  };

  const handleSaveRule = async (data: { label: string; emoji: string }) => {
    if (!selectedAccountId) return;
    
    try {
      if (editingRule) {
        await updateRule(editingRule.id, data);
      } else {
        await addRule({
          ...data,
          accountId: selectedAccountId,
          isActive: true,
          updatedAt: new Date(),
        } as any);
      }
      setShowForm(false);
      setEditingRule(null);
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this rule? All tally history will be lost.')) {
      try {
        await deleteRule(ruleId);
      } catch (error) {
        console.error('Failed to delete rule:', error);
      }
    }
  };

  const removeFloatingXP = (id: string) => {
    setFloatingXPs(prev => prev.filter(xp => xp.id !== id));
  };

  // Get current week start (Monday)
  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(now.setDate(diff));
  };

  const weekStart = getWeekStart();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold">Rule Tracker</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                "px-3 py-1 rounded text-sm transition-colors",
                viewMode === 'week' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Calendar className="w-4 h-4 mr-1 inline" />
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                "px-3 py-1 rounded text-sm transition-colors",
                viewMode === 'month' 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarDays className="w-4 h-4 mr-1 inline" />
              Month
            </button>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        <AnimatePresence>
          {showForm && (
            <RuleForm
              rule={editingRule}
              onSave={handleSaveRule}
              onCancel={() => {
                setShowForm(false);
                setEditingRule(null);
              }}
            />
          )}
        </AnimatePresence>

        {accountRules.length === 0 && !showForm ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="mb-6"
            >
              <Target className="w-16 h-16 mx-auto text-primary/60" />
            </motion.div>
            
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ready to build discipline? 🎯
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Create up to 3 trading rules and track your daily adherence. 
              Earn XP, build streaks, and stay disciplined!
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-muted-foreground mb-6 max-w-lg mx-auto">
              <div className="flex items-center gap-2 justify-center">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>+5 XP per tally</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Streak tracking</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <Trophy className="w-4 h-4 text-purple-500" />
                <span>Milestone rewards</span>
              </div>
            </div>
            
            <motion.button
              onClick={() => setShowForm(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2 inline" />
              Add Your First Rule
            </motion.button>
            
            <div className="mt-6 text-xs text-muted-foreground">
              <p>💡 Popular rules: "Set and forget" • "No FOMO trades" • "Follow risk management"</p>
            </div>
          </motion.div>
        ) : (
          accountRules.slice(0, 3).map((rule) => {
            const tallyCount = getTallyCountForRule(rule.id, today);
            const streak = getStreakForRule(rule.id);
            
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <RuleRow
                  rule={rule}
                  tallyCount={tallyCount}
                  streak={streak}
                  onTally={(e) => handleAddTally(rule.id, e)}
                  onEdit={() => {
                    setEditingRule(rule);
                    setShowForm(true);
                  }}
                  onDelete={() => handleDeleteRule(rule.id)}
                />
              </motion.div>
            );
          })
        )}
      </div>

      {/* Week/Month View */}
      {accountRules.length > 0 && viewMode === 'week' && (
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            This Week
          </h3>
          <div className="grid grid-cols-7 gap-2 text-xs">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={day} className="text-center">
                <div className="text-muted-foreground mb-1">{day}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(weekDays[i]).getDate()}
                </div>
                <div className="mt-1 space-y-1">
                  {accountRules.slice(0, 3).map((rule) => {
                    const count = getTallyCountForRule(rule.id, weekDays[i]);
                    return (
                      <div
                        key={rule.id}
                        className={cn(
                          "w-full h-1 rounded-full",
                          count > 0 ? "bg-primary" : "bg-muted"
                        )}
                        title={`${rule.label}: ${count} tallies`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating XP Animations */}
      <AnimatePresence>
        {floatingXPs.map((xp) => (
          <FloatingXP
            key={xp.id}
            x={xp.x}
            y={xp.y}
            amount={xp.amount}
            onComplete={() => removeFloatingXP(xp.id)}
          />
        ))}
      </AnimatePresence>

      {/* Confetti */}
      <Confetti 
        trigger={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />

      {/* Celebration Message */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-primary/90 to-primary text-primary-foreground px-6 py-4 rounded-2xl shadow-2xl border border-primary/20 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Star className="w-6 h-6 text-yellow-300" />
              </motion.div>
              <span className="font-semibold text-lg">{celebrationMessage}</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Trophy className="w-6 h-6 text-yellow-300" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
