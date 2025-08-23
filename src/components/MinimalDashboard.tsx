import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Target, 
  Trophy, 
  CheckCircle2, 
  Circle, 
  ChevronDown,
  ChevronUp,
  Sparkles,
  Flame,
  Brain,
  Calendar,
  Plus
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useRuleTallyStore } from '@/store/useRuleTallyStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';

// Minimal KPI Card Component
interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

const MinimalKPICard: React.FC<KPICardProps> = ({ title, value, change, changeType, icon: Icon }) => {
  return (
    <motion.div 
      className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 hover:border-border transition-all duration-200"
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        {change && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            changeType === 'positive' ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/10' :
            changeType === 'negative' ? 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/10' :
            'text-muted-foreground bg-muted'
          )}>
            {change}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{title}</div>
      </div>
    </motion.div>
  );
};

// Today's Focus Card Component
const TodaysFocusCard: React.FC = () => {
  const { selectedAccountId } = useAccountFilterStore();
  const { rules, getTallyCountForRule, addTally } = useRuleTallyStore();
  const { getReflectionByDate } = useDailyReflectionStore();
  
  const today = new Date().toISOString().split('T')[0];
  const todayReflection = getReflectionByDate(today);
  const accountRules = selectedAccountId ? rules.filter(r => r.accountId === selectedAccountId) : [];
  
  const handleRuleToggle = async (ruleId: string) => {
    if (selectedAccountId) {
      await addTally(ruleId, selectedAccountId, 1);
    }
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-card to-card/80 backdrop-blur-sm rounded-3xl p-8 border border-border/50 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Today's Focus</h2>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Daily Rules Checklist */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-foreground mb-4">Daily Rules</h3>
        <div className="space-y-3">
          {accountRules.slice(0, 4).map((rule) => {
            const isCompleted = getTallyCountForRule(rule.id, today) > 0;
            return (
              <motion.div
                key={rule.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => handleRuleToggle(rule.id)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  animate={{ 
                    scale: isCompleted ? [1, 1.2, 1] : 1,
                    rotate: isCompleted ? [0, 360] : 0
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </motion.div>
                <span className={cn(
                  "text-sm font-medium transition-colors",
                  isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                )}>
                  {rule.emoji} {rule.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Daily Intention */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-foreground mb-3">Daily Intention</h3>
        <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
          <p className="text-foreground italic">
            {todayReflection?.keyFocus || "Focus on quality setups, not quantity"}
          </p>
        </div>
      </div>

      {/* Reflection Status */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary" />
          <div>
            <p className="font-medium text-foreground">Reflection Status</p>
            <p className="text-sm text-muted-foreground">
              {todayReflection ? "✅ Complete" : "⚠️ Pending"}
            </p>
          </div>
        </div>
        {!todayReflection && (
          <motion.button
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Complete
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// Recent Activity Component
const RecentActivity: React.FC = () => {
  const { trades } = useTradeStore();
  const recentTrades = trades.slice(0, 5);

  return (
    <motion.div 
      className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Trades</h3>
      <div className="space-y-3">
        {recentTrades.map((trade, index) => (
          <motion.div
            key={trade.id}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex items-center gap-3">
              <span className="font-medium text-foreground">{trade.symbol}</span>
              <span className={cn(
                "text-sm font-medium",
                (trade.pnl || 0) > 0 ? "text-green-500" : "text-red-500"
              )}>
                {formatCurrency(trade.pnl || 0)}
              </span>
            </div>
            <div className="text-2xl">
              {(trade.pnl || 0) > 0 ? "✓" : "✗"}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Growth Corner Component
const GrowthCorner: React.FC = () => {
  const { trades } = useTradeStore();
  const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
  const currentLevel = Math.floor(winningTrades / 10) + 1;
  const xpProgress = (winningTrades % 10) / 10;
  const streak = 5; // Mock streak data

  return (
    <motion.div 
      className="bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm rounded-2xl p-6 border border-primary/20"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Growth Corner</h3>
      
      {/* Level Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Level {currentLevel} Trader</span>
          <span className="text-xs text-muted-foreground">{Math.round(xpProgress * 100)}%</span>
        </div>
        <div className="w-full bg-muted/30 rounded-full h-2">
          <motion.div 
            className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress * 100}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {winningTrades} / {currentLevel * 10} wins to next level
        </p>
      </div>

      {/* Streak & Quest */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-foreground">{streak}-day streak</span>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-foreground">Quest: 10 wins this week</span>
        </div>
      </div>
    </motion.div>
  );
};

// AI Insights Component
const AIInsights: React.FC = () => {
  const insights = [
    { type: 'positive', text: "You're 23% more profitable on morning trades" },
    { type: 'warning', text: "Avoid FOMO entries - 3 losses this week from this pattern" }
  ];

  return (
    <motion.div 
      className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 col-span-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">AI Insights</h3>
      </div>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            className="flex items-start gap-3 p-3 rounded-xl bg-muted/20"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
          >
            <span className="text-lg">
              {insight.type === 'positive' ? '💡' : '⚠️'}
            </span>
            <p className="text-sm text-foreground">{insight.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Main Minimal Dashboard Component
export const MinimalDashboard: React.FC = () => {
  const { trades } = useTradeStore();
  const [showBottomSection, setShowBottomSection] = useState(true);
  
  // Calculate KPIs
  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
  const avgWin = winningTrades > 0 ? trades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades : 0;
  const avgLoss = trades.length - winningTrades > 0 ? Math.abs(trades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0) / (trades.length - winningTrades)) : 0;
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Performance Overview */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-foreground mb-6">Performance Overview</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MinimalKPICard
              title="Total P&L"
              value={formatCurrency(totalPnL)}
              change={totalPnL >= 0 ? `+${Math.abs(totalPnL / 1000).toFixed(1)}k` : `-${Math.abs(totalPnL / 1000).toFixed(1)}k`}
              changeType={totalPnL > 0 ? 'positive' : totalPnL < 0 ? 'negative' : 'neutral'}
              icon={TrendingUp}
            />
            <MinimalKPICard
              title="Win Rate"
              value={`${winRate.toFixed(0)}%`}
              change={winRate > 60 ? 'Strong' : winRate > 40 ? 'Average' : 'Needs Work'}
              changeType={winRate > 60 ? 'positive' : winRate > 40 ? 'neutral' : 'negative'}
              icon={Target}
            />
            <MinimalKPICard
              title="Profit Factor"
              value={profitFactor.toFixed(1)}
              change={profitFactor > 1.5 ? 'Excellent' : profitFactor > 1 ? 'Good' : 'Poor'}
              changeType={profitFactor > 1.5 ? 'positive' : profitFactor > 1 ? 'neutral' : 'negative'}
              icon={Sparkles}
            />
            <MinimalKPICard
              title="Total Trades"
              value={trades.length.toString()}
              change={`${winningTrades} wins`}
              changeType={trades.length > 0 ? 'positive' : 'neutral'}
              icon={Trophy}
            />
          </div>
        </motion.section>

        {/* Today's Focus Card */}
        <section>
          <TodaysFocusCard />
        </section>

        {/* Bottom Section Toggle */}
        <motion.button
          className="w-full flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowBottomSection(!showBottomSection)}
          whileHover={{ scale: 1.02 }}
        >
          <span className="text-sm font-medium">
            {showBottomSection ? 'Hide' : 'Show'} Context & Growth
          </span>
          {showBottomSection ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </motion.button>

        {/* Context & Growth Section */}
        <AnimatePresence>
          {showBottomSection && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentActivity />
                <GrowthCorner />
              </div>
              <AIInsights />
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MinimalDashboard;
