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
  ChevronRight,
  Sparkles,
  Flame,
  Brain,
  Calendar,
  Plus
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useRuleTallyStore } from '@/store/useRuleTallyStore';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn, summarizeWinLossScratch } from '@/lib/utils';
import type { HabitCategory } from '@/types';

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
      className="bg-card/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-border/50 hover:border-border transition-all duration-200"
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        {change && (
          <span className={cn(
            "text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full",
            changeType === 'positive' ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/10' :
            changeType === 'negative' ? 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/10' :
            'text-muted-foreground bg-muted'
          )}>
            {change}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-lg sm:text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs sm:text-sm text-muted-foreground">{title}</div>
      </div>
    </motion.div>
  );
};

// Today's Focus Card Component
const TodaysFocusCard: React.FC = () => {
  const { selectedAccountId } = useAccountFilterStore();
  const { rules, getTallyCountForRule, getStreakForRule } = useRuleTallyStore();
  const { getReflectionByDate } = useDailyReflectionStore();
  const { setCurrentView } = useNavigationStore();
  
  const today = new Date().toISOString().split('T')[0];
  const todayReflection = getReflectionByDate(today);
  const accountRules = selectedAccountId ? rules.filter(r => r.accountId === selectedAccountId) : [];
  
  // Calculate habit overview stats
  const totalTallies = accountRules.reduce((sum, rule) => sum + getTallyCountForRule(rule.id, today), 0);
  const activeStreaks = accountRules.filter(rule => {
    const streak = getStreakForRule(rule.id);
    return streak && streak.currentStreak > 0;
  }).length;
  const completedHabits = accountRules.filter(rule => getTallyCountForRule(rule.id, today) > 0).length;

  return (
    <motion.div 
      className="bg-gradient-to-br from-card to-card/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-border/50 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Today's Focus</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Habit Overview */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-medium text-foreground">Today's Habits</h3>
          <motion.button
            onClick={() => setCurrentView('habits')}
            className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            whileHover={{ x: 2 }}
          >
            View All <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </motion.button>
        </div>
        
        {/* Habit Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <motion.div
            className="text-center p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-lg sm:text-2xl font-bold text-primary mb-0.5 sm:mb-1">{totalTallies}</div>
            <div className="text-xs text-muted-foreground">Tallies Today</div>
          </motion.div>
          
          <motion.div
            className="text-center p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500/5 to-orange-500/10 border border-orange-500/20"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-lg sm:text-2xl font-bold text-orange-500 mb-0.5 sm:mb-1">{activeStreaks}</div>
            <div className="text-xs text-muted-foreground">Active Streaks</div>
          </motion.div>
          
          <motion.div
            className="text-center p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-500/20"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-lg sm:text-2xl font-bold text-green-500 mb-0.5 sm:mb-1">{completedHabits}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </motion.div>
        </div>

        {/* Quick Habit Preview */}
        {accountRules.length > 0 ? (
          <div className="space-y-2">
            {accountRules.slice(0, 3).map((rule) => {
              const tallyCount = getTallyCountForRule(rule.id, today);
              const streak = getStreakForRule(rule.id);
              return (
                <motion.div
                  key={rule.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors"
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{rule.emoji}</span>
                    <div>
                      <div className="text-sm font-medium text-foreground">{rule.label}</div>
                      {streak && streak.currentStreak > 0 && (
                        <div className="flex items-center gap-1 text-xs text-orange-500">
                          <Flame className="w-3 h-3" />
                          <span>{streak.currentStreak} {getStreakText(rule.category)} streak</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tallyCount > 0 && (
                      <div className="text-sm font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                        {tallyCount}
                      </div>
                    )}
                    <CheckCircle2 className={cn(
                      "w-5 h-5 transition-colors",
                      tallyCount > 0 ? "text-green-500" : "text-muted-foreground"
                    )} />
                  </div>
                </motion.div>
              );
            })}
            
            {accountRules.length > 3 && (
              <motion.button
                onClick={() => setCurrentView('habits')}
                className="w-full p-3 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:border-primary/50 hover:bg-primary/5 transition-all text-sm font-medium"
                whileHover={{ scale: 1.01 }}
              >
                +{accountRules.length - 3} more habits • View all in Habits
              </motion.button>
            )}
          </div>
        ) : (
          <motion.div
            className="text-center py-6 rounded-2xl border-2 border-dashed border-muted/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">No habits yet</p>
            <motion.button
              onClick={() => setCurrentView('habits')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Create First Habit
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Daily Intention */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-foreground mb-3">Daily Intention</h3>
        <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
          {todayReflection?.keyFocus ? (
            <p className="text-foreground italic">
              {todayReflection.keyFocus}
            </p>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground italic">
                Set your daily trading intention
              </p>
              <motion.button
                onClick={() => setCurrentView('journal')}
                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                whileHover={{ x: 2 }}
              >
                <Plus className="w-4 h-4" />
                Add Focus
              </motion.button>
            </div>
          )}
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
            onClick={() => setCurrentView('journal')}
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
  const { trades, getRecentTrades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { setCurrentView } = useNavigationStore();
  
  // Get recent trades for the selected account
  const recentTrades = getRecentTrades()
    .filter(trade => !selectedAccountId || trade.accountId === selectedAccountId)
    .slice(0, 5);

  return (
    <motion.div 
      className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Trades</h3>
        <motion.button
          onClick={() => setCurrentView('trades')}
          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
          whileHover={{ x: 2 }}
        >
          View All <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
      
      <div className="space-y-3">
        {recentTrades.length > 0 ? (
          recentTrades.map((trade, index) => (
            <motion.div
              key={trade.id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => setCurrentView('trades')}
              whileHover={{ x: 2 }}
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-foreground">{trade.symbol}</span>
                <span className={cn(
                  "text-sm font-medium",
                  (trade.pnl || 0) > 0 ? "text-green-500" : "text-red-500"
                )}>
                  {formatCurrency(trade.pnl || 0)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(trade.entryTime).toLocaleDateString()}
                </span>
              </div>
              <div className="text-2xl">
                {(trade.pnl || 0) > 0 ? "✓" : "✗"}
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div
            className="text-center py-6 rounded-2xl border-2 border-dashed border-muted/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <TrendingUp className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">No trades yet</p>
            <motion.button
              onClick={() => setCurrentView('trades')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              Log First Trade
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Growth Corner Component
const GrowthCorner: React.FC = () => {
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { getReflectionStreak } = useDailyReflectionStore();
  const { profile, calculateTotalXP, calculateLevel } = useUserProfileStore();
  const { setCurrentView } = useNavigationStore();
  
  // Filter trades by account
  const accountTrades = selectedAccountId ? trades.filter(t => t.accountId === selectedAccountId) : trades;
  const { wins: winningTrades } = summarizeWinLossScratch(accountTrades);
  
  // Use stored profile level for consistency with journal (Level 12)
  const currentLevel = profile?.level || 1;
  const totalXP = profile?.totalXP || 0;
  const xpToNextLevel = profile?.xpToNextLevel || 100;
  
  // Calculate XP progress percentage for current level
  const XP_PER_LEVEL = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450, 11500, 12600, 13750, 14950, 16200, 17500, 18850, 20250, 21700, 23200];
  const getXPForLevel = (level: number) => level < XP_PER_LEVEL.length ? XP_PER_LEVEL[level] : 23200 + ((level - 29) * 1000);
  
  const prevLevelXP = currentLevel > 1 ? getXPForLevel(currentLevel - 1) : 0;
  const nextLevelXP = getXPForLevel(currentLevel);
  const currentLevelXP = totalXP - prevLevelXP;
  const xpForThisLevel = nextLevelXP - prevLevelXP;
  const xpProgress = xpForThisLevel > 0 ? currentLevelXP / xpForThisLevel : 0;
  
  // Get reflection streak for the selected account
  const reflectionStreak = selectedAccountId ? getReflectionStreak(selectedAccountId) : 0;
  
  // Calculate recent activity streak (trades in last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentTrades = accountTrades.filter(t => new Date(t.entryTime) >= weekAgo);
  const activeDaysThisWeek = new Set(recentTrades.map(t => new Date(t.entryTime).toDateString())).size;

  return (
    <motion.div 
      className="bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm rounded-2xl p-6 border border-primary/20"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Growth Corner</h3>
        <motion.button
          onClick={() => setCurrentView('quests')}
          className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
          whileHover={{ x: 2 }}
        >
          Quests <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
      
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
          {totalXP.toLocaleString()} XP • {xpToNextLevel} XP to next level
        </p>
      </div>

      {/* Streaks & Activity */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-foreground">
            {reflectionStreak}-day reflection streak
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-medium text-foreground">
            {activeDaysThisWeek} active trading days this week
          </span>
        </div>
        <motion.button
          onClick={() => setCurrentView('quests')}
          className="flex items-center gap-2 w-full p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
          whileHover={{ scale: 1.02 }}
        >
          <Trophy className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-foreground">View Active Quests</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

// AI Insights Component
const AIInsights: React.FC = () => {
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { rules, getTallyCountForRule } = useRuleTallyStore();
  const { reflections } = useDailyReflectionStore();
  
  // Generate insights based on real data
  const generateInsights = () => {
    const insights: Array<{ type: 'positive' | 'warning' | 'neutral', text: string }> = [];
    
    // Filter data by account
    const accountTrades = selectedAccountId ? trades.filter(t => t.accountId === selectedAccountId) : trades;
    const accountRules = selectedAccountId ? rules.filter(r => r.accountId === selectedAccountId) : rules;
    const accountReflections = selectedAccountId ? reflections.filter(r => r.accountId === selectedAccountId) : reflections;
    
    // Trading performance insights
    if (accountTrades.length > 5) {
      const { winRateExclScratches: winRate } = summarizeWinLossScratch(accountTrades);
      
      if (winRate > 60) {
        insights.push({
          type: 'positive',
          text: `Strong ${winRate.toFixed(0)}% win rate across ${accountTrades.length} trades - keep following your process!`
        });
      } else if (winRate < 40) {
        insights.push({
          type: 'warning',
          text: `Win rate at ${winRate.toFixed(0)}% - consider reviewing entry criteria and risk management`
        });
      }
      
      // Time-based analysis
      const morningTrades = accountTrades.filter(t => {
        const hour = new Date(t.entryTime).getHours();
        return hour >= 9 && hour <= 11;
      });
      
      if (morningTrades.length > 3) {
        const { winRateExclScratches: morningWinRate } = summarizeWinLossScratch(morningTrades);
        const overallWinRate = winRate;
        
        if (morningWinRate > overallWinRate + 10) {
          insights.push({
            type: 'positive',
            text: `You're ${(morningWinRate - overallWinRate).toFixed(0)}% more successful in morning sessions (9-11 AM)`
          });
        }
      }
    }
    
    // Habit tracking insights
    const today = new Date().toISOString().split('T')[0];
    const todayTallies = accountRules.reduce((sum, rule) => sum + getTallyCountForRule(rule.id, today), 0);
    
    if (todayTallies > 0) {
      insights.push({
        type: 'positive',
        text: `${todayTallies} habits completed today - consistency builds excellence!`
      });
    } else if (accountRules.length > 0) {
      insights.push({
        type: 'warning',
        text: `No habits tracked today - small consistent actions lead to big results`
      });
    }
    
    // Reflection insights
    const recentReflections = accountReflections.filter(r => {
      const reflectionDate = new Date(r.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return reflectionDate >= weekAgo;
    });
    
    if (recentReflections.length >= 5) {
      insights.push({
        type: 'positive',
        text: `${recentReflections.length} reflections this week - self-awareness is your trading edge`
      });
    }
    
    // Default insights if no data
    if (insights.length === 0) {
      insights.push({
        type: 'neutral',
        text: "Start logging trades and habits to unlock personalized AI insights"
      });
    }
    
    return insights.slice(0, 3); // Limit to 3 insights
  };
  
  const insights = generateInsights();

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
              {insight.type === 'positive' ? '💡' : insight.type === 'warning' ? '⚠️' : '🔍'}
            </span>
            <p className="text-sm text-foreground">{insight.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Time period options for analytics
type TimePeriod = '7d' | '30d' | '90d' | 'lifetime';

const TIME_PERIODS: Array<{ value: TimePeriod; label: string }> = [
  { value: '7d', label: 'Last 7d' },
  { value: '30d', label: 'Last 30d' },
  { value: '90d', label: 'Last 90d' },
  { value: 'lifetime', label: 'Lifetime' },
];

// Main Minimal Dashboard Component
export const MinimalDashboard: React.FC = () => {
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const [showBottomSection, setShowBottomSection] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');
  
  // Filter trades by selected account and time period
  const filteredTrades = useMemo(() => {
    let filtered = selectedAccountId ? trades.filter(t => t.accountId === selectedAccountId) : trades;
    
    if (selectedPeriod !== 'lifetime') {
      const now = new Date();
      const daysBack = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
      const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
      
      filtered = filtered.filter(trade => {
        const tradeDate = new Date(trade.entryTime);
        return tradeDate >= cutoffDate;
      });
    }
    
    return filtered.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
  }, [trades, selectedAccountId, selectedPeriod]);
  
  const accountTrades = filteredTrades;
  
  // Calculate KPIs using the same method as other dashboards
  const totalPnL = accountTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  
  // Use the sophisticated win/loss classification system
  const { wins: winCount, losses: lossCount, scratches: scratchCount, winRateExclScratches } = summarizeWinLossScratch(accountTrades);
  const winRate = winRateExclScratches;
  
  // Calculate averages using the classified trades (matching other dashboards)
  const winTrades = accountTrades.filter(t => (t.pnl || 0) > 0);
  const lossTrades = accountTrades.filter(t => (t.pnl || 0) < 0);
  
  const avgWin = winTrades.length > 0 ? winTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winTrades.length : 0;
  const avgLoss = lossTrades.length > 0 ? Math.abs(lossTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)) / lossTrades.length : 0;
  
  // Profit factor calculation matching other dashboards
  const profitFactor = avgLoss > 0 ? Math.abs(avgWin * winTrades.length) / Math.abs(avgLoss * lossTrades.length) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        
        {/* Performance Overview */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Performance Overview</h1>
            
            {/* Time Period Filter */}
            <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl overflow-x-auto">
              {TIME_PERIODS.map((period) => (
                <motion.button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  className={cn(
                    "px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap",
                    selectedPeriod === period.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {period.label}
                </motion.button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <MinimalKPICard
              title="Total P&L"
              value={formatCurrency(totalPnL)}
              change={selectedPeriod === 'lifetime' ? 'All time' : `${TIME_PERIODS.find(p => p.value === selectedPeriod)?.label}`}
              changeType={totalPnL > 0 ? 'positive' : totalPnL < 0 ? 'negative' : 'neutral'}
              icon={TrendingUp}
            />
            <MinimalKPICard
              title="Win Rate"
              value={`${winRate.toFixed(0)}%`}
              change={`${winCount}W / ${lossCount}L`}
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
              value={accountTrades.length.toString()}
              change={scratchCount > 0 ? `${scratchCount} scratches` : `${winCount} wins`}
              changeType={accountTrades.length > 0 ? 'positive' : 'neutral'}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
