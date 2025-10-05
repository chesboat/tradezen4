import React, { useState, useMemo, useEffect } from 'react';
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
  Plus,
  Info
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import type { Trade } from '@/types';
import { useRuleTallyStore } from '@/store/useRuleTallyStore';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { LevelBadge } from './xp/LevelBadge';
import { ProgressRing } from './xp/ProgressRing';
import { PrestigeModal } from './xp/PrestigeModal';
import { XpSystemModal } from './xp/XpSystemModal';
import { xpToNextLevel, getLevelProgress } from '@/lib/xp/math';
import { FEATURE_XP_PRESTIGE } from '@/lib/xp/constants';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useNavigationStore } from '@/store/useNavigationStore';
import { formatCurrency } from '@/lib/localStorageUtils';
import { cn, summarizeWinLossScratch, formatLocalDate } from '@/lib/utils';
import type { HabitCategory } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useDisciplineUser, useTodayDay, useWeekDays } from '@/lib/disciplineHooks';
import { todayInTZ, isAfterMarketClose } from '@/lib/time';
import { setDisciplineMode } from '@/lib/discipline';
import QuickLogButton from '@/components/discipline/QuickLogButton';
import TradesLeftWidget from '@/components/discipline/TradesLeftWidget';
import CheckInCard from '@/components/discipline/CheckInCard';
import OverrideModal from '@/components/discipline/OverrideModal';
import EndOfDayModalOn from '@/components/discipline/EndOfDayModalOn';
import EODPromptOff from '@/components/discipline/EODPromptOff';
import WeeklyReviewCard from '@/components/discipline/WeeklyReviewCard';
import DisciplineNudgeCard from '@/components/discipline/DisciplineNudgeCard';
import BulletMeter from '@/components/discipline/BulletMeter';
import BulletCounterSetupModal from '@/components/discipline/BulletCounterSetupModal';
import { useSWRConfig } from 'swr';
import { DailyInsightCard, DailyInsightEmptyState } from './DailyInsightCard';
import { DailyDisciplineRings } from './DailyDisciplineRings';
import { DailyDisciplineOnboarding } from './DailyDisciplineOnboarding';
import { generateDailyInsight } from '@/lib/dailyInsightEngine';
import { useTodoStore } from '@/store/useTodoStore';
import { useInsightHistoryStore } from '@/store/useInsightHistoryStore';
import {
  useAnalyticsFilterStore,
  createGoldenHourFilter,
  createRevengeTradesFilter,
  createFirstTradesFilter,
  createLastTradesFilter,
  createLossPatternFilter,
} from '@/store/useAnalyticsFilterStore';

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

// Hero P&L Card Component (Apple-style - 2x size, prominent)
const HeroPnLCard: React.FC<{ 
  todayPnL: number; 
  todayTrades: number; 
  todayWinRate: number;
  yesterdayPnL: number;
}> = ({ todayPnL, todayTrades, todayWinRate, yesterdayPnL }) => {
  const pnlChange = todayPnL - yesterdayPnL;
  const pnlChangePercent = yesterdayPnL !== 0 ? ((pnlChange / Math.abs(yesterdayPnL)) * 100) : 0;
  
  return (
    <motion.div
      className="col-span-full bg-background rounded-3xl p-6 sm:p-8 border border-border overflow-visible"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
    >
      {/* Top Section: P&L + Daily Rings */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
        {/* Left: P&L */}
        <div className="flex-1">
          <p className="text-sm sm:text-base text-muted-foreground mb-2">Today's Session</p>
          <div className={cn(
            "text-4xl sm:text-6xl font-bold tracking-tight mb-2",
            todayPnL > 0 ? "text-green-500" : todayPnL < 0 ? "text-red-500" : "text-muted-foreground"
          )}>
            {formatCurrency(todayPnL)}
          </div>
          {yesterdayPnL !== 0 && (
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-medium",
                pnlChange > 0 ? "text-green-500" : pnlChange < 0 ? "text-red-500" : "text-muted-foreground"
              )}>
                {pnlChange > 0 ? '↑' : pnlChange < 0 ? '↓' : '→'} {formatCurrency(Math.abs(pnlChange))} vs yesterday
              </span>
            </div>
          )}
        </div>

        {/* Right: Daily Discipline Rings (Compact) */}
        <div className="flex-shrink-0">
          <DailyDisciplineRings size="small" showLabels={false} showStreak={false} />
        </div>
      </div>
      
      {/* Bottom: Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 rounded-2xl bg-muted/20">
          <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{todayTrades}</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Trades</div>
        </div>
        <div className="text-center p-4 rounded-2xl bg-muted/20">
          <div className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{todayWinRate.toFixed(0)}%</div>
          <div className="text-xs sm:text-sm text-muted-foreground">Win Rate</div>
        </div>
        <div className="text-center p-4 rounded-2xl bg-muted/20">
          <div className={cn(
            "text-2xl sm:text-3xl font-bold mb-1",
            todayPnL / todayTrades > 0 ? "text-green-500" : "text-red-500"
          )}>
            {todayTrades > 0 ? formatCurrency(todayPnL / todayTrades) : '$0'}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">Avg P&L</div>
        </div>
      </div>
    </motion.div>
  );
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
      className="bg-background rounded-xl sm:rounded-2xl p-3 sm:p-6 border border-border hover:border-primary/30 transition-all duration-200"
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

// Daily Intent Card (Apple-style - single focus)
const DailyIntentCard: React.FC = () => {
  const { getReflectionByDate, upsertReflectionForSelection } = useDailyReflectionStore();
  const { selectedAccountId } = useAccountFilterStore();
  const today = formatLocalDate(new Date());
  const todayReflection = getReflectionByDate(today, selectedAccountId || undefined);
  const [isEditing, setIsEditing] = React.useState(false);
  const [focusText, setFocusText] = React.useState('');

  const handleSave = async () => {
    if (focusText.trim()) {
      await upsertReflectionForSelection(today, { keyFocus: focusText.trim() }, selectedAccountId || 'default');
      setIsEditing(false);
      setFocusText('');
    }
  };

  return (
    <motion.div
      className="bg-background rounded-2xl p-6 border border-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ y: -2 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Today's Edge</h2>
      </div>

      {!isEditing && todayReflection?.keyFocus ? (
        <motion.div 
          className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 cursor-pointer group hover:border-primary/30 transition-colors"
          onClick={() => {
            setFocusText(todayReflection.keyFocus || '');
            setIsEditing(true);
          }}
          whileHover={{ scale: 1.01 }}
        >
          <p className="text-foreground italic leading-relaxed group-hover:text-primary transition-colors">
            "{todayReflection.keyFocus}"
          </p>
          <p className="text-xs text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to edit
          </p>
        </motion.div>
      ) : isEditing ? (
        <div className="space-y-3">
          <textarea
            value={focusText}
            onChange={(e) => setFocusText(e.target.value)}
            placeholder="e.g., Wait for the 9:45 pullback. No FOMO on the open."
            className="w-full min-h-[100px] p-3 rounded-xl bg-muted/30 border border-border/50 focus:border-primary/50 focus:outline-none text-foreground placeholder:text-muted-foreground resize-none"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleSave}
              disabled={!focusText.trim()}
              className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Save
            </motion.button>
            <motion.button
              onClick={() => {
                setIsEditing(false);
                setFocusText('');
              }}
              className="py-2 px-4 bg-muted text-muted-foreground rounded-xl font-medium hover:bg-muted/80 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
          </div>
        </div>
      ) : (
        <motion.button
          onClick={() => setIsEditing(true)}
          className="w-full p-6 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 transition-all group"
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-muted-foreground mb-3">What's your edge today?</p>
          <div className="flex items-center justify-center gap-2 text-primary group-hover:text-primary/80">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Set Your Focus</span>
          </div>
        </motion.button>
      )}
    </motion.div>
  );
};

// Habits Card (Apple-style - focused on habits only)
const HabitsCard: React.FC = () => {
  const { selectedAccountId } = useAccountFilterStore();
  const { rules, getTallyCountForRule, getStreakForRule } = useRuleTallyStore();
  const { setCurrentView } = useNavigationStore();
  
  const today = formatLocalDate(new Date());
  // Include journal-wide habits (no accountId) and account-specific habits
  const accountRules = rules.filter(r => 
    (!r.accountId || r.accountId === selectedAccountId) && r.isActive !== false
  );
  
  const completedHabits = accountRules.filter(rule => getTallyCountForRule(rule.id, today) > 0).length;
  const activeStreaks = accountRules.filter(rule => {
    const streak = getStreakForRule(rule.id);
    return streak && streak.currentStreak > 0;
  }).length;

  return (
    <motion.div
      className="bg-background rounded-2xl p-6 border border-border"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Habits</h3>
        <motion.button
          onClick={() => setCurrentView('habits')}
          className="text-sm text-primary hover:text-primary/80 font-medium"
          whileHover={{ x: 2 }}
        >
          View All →
        </motion.button>
      </div>

      {accountRules.length > 0 ? (
        <>
          <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
            <span>{completedHabits} complete</span>
            <span>•</span>
            <span>{activeStreaks} active streak{activeStreaks !== 1 ? 's' : ''}</span>
          </div>

          <div className="space-y-2">
            {accountRules.slice(0, 3).map((rule) => {
              const tallyCount = getTallyCountForRule(rule.id, today);
              const streak = getStreakForRule(rule.id);
              return (
                <motion.div
                  key={rule.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/20 transition-colors"
                  whileHover={{ x: 2 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{rule.emoji}</span>
                    <div>
                      <div className="text-sm font-medium text-foreground">{rule.label}</div>
                      {streak && streak.currentStreak > 0 && (
                        <div className="flex items-center gap-1 text-xs text-orange-500">
                          <Flame className="w-3 h-3" />
                          <span>{streak.currentStreak} day streak</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <CheckCircle2 className={cn(
                    "w-5 h-5",
                    tallyCount > 0 ? "text-green-500" : "text-muted-foreground"
                  )} />
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        <motion.button
          onClick={() => setCurrentView('habits')}
          className="w-full p-6 rounded-xl border-2 border-dashed border-muted/50 hover:border-primary/50 hover:bg-muted/20 transition-all"
          whileHover={{ scale: 1.02 }}
        >
          <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2">No habits yet</p>
          <span className="text-sm text-primary font-medium">Create First Habit</span>
        </motion.button>
      )}
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
      className="bg-background rounded-2xl p-6 border border-border"
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

// Growth Corner Component (Simplified - Apple style)
const GrowthCorner: React.FC = () => {
  const { selectedAccountId } = useAccountFilterStore();
  const { getReflectionStreak } = useDailyReflectionStore();
  const { profile } = useUserProfileStore();
  const { setCurrentView } = useNavigationStore();
  
  // Use new prestige system with defensive null checks
  const currentLevel = profile?.xp?.level || 1;
  const seasonXp = profile?.xp?.seasonXp || 0;
  
  // Calculate XP progress for current level
  const xpToNext = xpToNextLevel(seasonXp);
  const progressPct = getLevelProgress(seasonXp);
  
  // Get reflection streak for the selected account
  const reflectionStreak = selectedAccountId ? getReflectionStreak(selectedAccountId) : 0;

  return (
    <motion.div 
      className="bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur-sm rounded-2xl p-6 border border-primary/20"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <h3 className="text-lg font-semibold text-foreground mb-6">Progress</h3>
      
      {/* Level Progress - Simplified */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">Level {currentLevel} Trader</span>
          <ProgressRing 
            progressPct={progressPct}
            size="sm"
            showPercentage={true}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {xpToNext.toLocaleString()} XP to next level
        </p>
      </div>

      {/* Streaks - Simplified */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-foreground">Reflection Streak</span>
          </div>
          <span className="text-sm font-bold text-foreground">{reflectionStreak} days</span>
        </div>
        
        <motion.button
          onClick={() => setCurrentView('quests')}
          className="w-full p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors text-primary font-medium text-sm"
          whileHover={{ scale: 1.02 }}
        >
          View Quests →
        </motion.button>
      </div>
    </motion.div>
  );
};

// AI Insights Component (Apple-style - actionable cards)
const AIInsights: React.FC = () => {
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { rules, getTallyCountForRule } = useRuleTallyStore();
  const { reflections } = useDailyReflectionStore();
  const { setCurrentView } = useNavigationStore();
  
  // Generate actionable insights based on real data
  const generateInsights = () => {
    const insights: Array<{ 
      type: 'positive' | 'warning' | 'neutral';
      title: string;
      text: string;
      action: string;
      actionFn: () => void;
    }> = [];
    
    // Filter data by account
    const accountTrades = selectedAccountId ? trades.filter(t => t.accountId === selectedAccountId) : trades;
    // Include journal-wide habits (no accountId) and account-specific habits
    const accountRules = rules.filter(r => 
      (!r.accountId || r.accountId === selectedAccountId) && r.isActive !== false
    );
    const accountReflections = selectedAccountId ? reflections.filter(r => r.accountId === selectedAccountId) : reflections;
    
    // Time-based analysis
    if (accountTrades.length > 5) {
      const morningTrades = accountTrades.filter(t => {
        const hour = new Date(t.entryTime).getHours();
        return hour >= 9 && hour <= 11;
      });
      
      if (morningTrades.length > 3) {
        const { winRateExclScratches: morningWinRate } = summarizeWinLossScratch(morningTrades);
        const { winRateExclScratches: overallWinRate } = summarizeWinLossScratch(accountTrades);
        
        if (morningWinRate > overallWinRate + 15) {
          insights.push({
            type: 'positive',
            title: 'Peak Performance Window',
            text: `You're ${(morningWinRate - overallWinRate).toFixed(0)}% more successful trading between 9:00-11:00 AM`,
            action: 'Review Trades',
            actionFn: () => setCurrentView('trades')
          });
        }
      }
      
      // Afternoon performance check
      const afternoonTrades = accountTrades.filter(t => {
        const hour = new Date(t.entryTime).getHours();
        return hour >= 14;
      });
      
      if (afternoonTrades.length > 3) {
        const afternoonLosses = afternoonTrades.filter(t => (t.pnl || 0) < 0).length;
        if (afternoonLosses / afternoonTrades.length > 0.6) {
          insights.push({
            type: 'warning',
            title: 'Afternoon Performance Alert',
            text: `${((afternoonLosses / afternoonTrades.length) * 100).toFixed(0)}% loss rate after 2PM. Consider setting a cutoff time.`,
            action: 'Review Pattern',
            actionFn: () => setCurrentView('trades')
          });
        }
      }
    }
    
    // Habit consistency check
    const today = formatLocalDate(new Date());
    const todayTallies = accountRules.reduce((sum, rule) => sum + getTallyCountForRule(rule.id, today), 0);
    
    if (todayTallies === 0 && accountRules.length > 0) {
      insights.push({
        type: 'warning',
        title: 'Habit Reminder',
        text: `No habits tracked today. Small consistent actions compound into mastery.`,
        action: 'Track Habits',
        actionFn: () => setCurrentView('habits')
      });
    }
    
    // Reflection consistency
    const recentReflections = accountReflections.filter(r => {
      const reflectionDate = new Date(r.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return reflectionDate >= weekAgo;
    });
    
    if (recentReflections.length < 3 && accountTrades.length > 5) {
      insights.push({
        type: 'warning',
        title: 'Reflection Gap',
        text: `Only ${recentReflections.length} reflections this week. Self-awareness is your edge.`,
        action: 'Add Reflection',
        actionFn: () => setCurrentView('journal')
      });
    }
    
    // Default insights if no data
    if (insights.length === 0 && accountTrades.length === 0) {
      insights.push({
        type: 'neutral',
        title: 'Getting Started',
        text: "Log your first trades to unlock personalized AI insights and pattern analysis.",
        action: 'Log Trade',
        actionFn: () => setCurrentView('trades')
      });
    }
    
    // Add a catch-all positive insight if we have trades but no specific insights
    if (insights.length === 0 && accountTrades.length > 0) {
      const { winRateExclScratches: winRate } = summarizeWinLossScratch(accountTrades);
      insights.push({
        type: 'positive',
        title: 'Trading Activity Detected',
        text: `You have ${accountTrades.length} trades logged with a ${winRate.toFixed(0)}% win rate. Keep tracking to unlock deeper insights.`,
        action: 'View Trades',
        actionFn: () => setCurrentView('trades')
      });
    }
    
    return insights.slice(0, 2); // Limit to top 2 most actionable
  };
  
  const insights = generateInsights();
  
  console.log('🧠 AI Insights Debug:', {
    totalTrades: trades.length,
    accountTrades: selectedAccountId ? trades.filter(t => t.accountId === selectedAccountId).length : trades.length,
    selectedAccountId,
    insightsGenerated: insights.length,
    insights: insights.map(i => i.title)
  });

  return (
    <motion.div 
      className="col-span-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">AI Insights</h3>
      </div>
      {insights.length > 0 ? (
        <div className={cn(
          "grid gap-4",
          insights.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        )}>
          {insights.map((insight, index) => (
          <motion.div
            key={index}
            className={cn(
              "p-6 rounded-2xl border-2 bg-background",
              insight.type === 'positive' ? "border-green-500/30 bg-green-500/5" :
              insight.type === 'warning' ? "border-orange-500/30 bg-orange-500/5" :
              "border-border/50"
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {insight.type === 'positive' ? '💡' : insight.type === 'warning' ? '⚠️' : '🔍'}
                </span>
                <h4 className="font-semibold text-foreground">{insight.title}</h4>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{insight.text}</p>
            <motion.button
              onClick={insight.actionFn}
              className={cn(
                "w-full py-2 px-4 rounded-xl font-medium transition-colors",
                insight.type === 'positive' ? "bg-green-500 text-white hover:bg-green-600" :
                insight.type === 'warning' ? "bg-orange-500 text-white hover:bg-orange-600" :
                "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {insight.action} →
            </motion.button>
          </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No insights available yet. Log more trades to unlock personalized analysis.</p>
        </div>
      )}
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
  const { currentUser } = useAuth();
  const { trades } = useTradeStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { setCurrentView } = useNavigationStore();
  const [showBottomSection, setShowBottomSection] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');
  const tz = (useUserProfileStore.getState().profile as any)?.timezone || 'America/New_York';
  const { mutate } = useSWRConfig();
  const todayStrTZ = todayInTZ(tz);
  const { data: userDoc } = useDisciplineUser(currentUser?.uid);
  const disciplineEnabled = !!userDoc?.settings?.disciplineMode?.enabled;
  const defaultMax = userDoc?.settings?.disciplineMode?.defaultMax as number | undefined;
  const { data: todayDay } = useTodayDay(currentUser?.uid, tz);
  const { data: weekDays } = useWeekDays(currentUser?.uid, tz);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [eodOnOpen, setEodOnOpen] = useState(false);
  const [eodOffOpen, setEodOffOpen] = useState(false);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  
  // Daily Discipline onboarding
  const [showDisciplineOnboarding, setShowDisciplineOnboarding] = useState(() => {
    const hasSeenOnboarding = localStorage.getItem('daily_discipline_onboarding_seen');
    return !hasSeenOnboarding;
  });

  const handleOnboardingComplete = () => {
    localStorage.setItem('daily_discipline_onboarding_seen', 'true');
    setShowDisciplineOnboarding(false);
  };
  
  // Expose mutate for onSnapshot to push cache updates
  (window as any).__disc_mutate = mutate;

  // Handle enabling discipline mode from the nudge card
  const handleEnableDiscipline = () => {
    setSetupModalOpen(true);
  };

  // Handle confirming the bullet count setup
  const handleConfirmBulletSetup = async (bulletCount: number) => {
    if (!currentUser) return;
    
    try {
      await setDisciplineMode({ uid: currentUser.uid, enabled: true, defaultMax: bulletCount });
      // Revalidate the discipline user data
      mutate(['disc-user', currentUser.uid]);
      setSetupModalOpen(false);
    } catch (error) {
      console.error('Failed to enable discipline mode:', error);
      // The error will be shown via the modal's UI
    }
  };

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
  
  // Calculate today's stats for Hero card
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const todayTrades = accountTrades.filter(t => {
    const tradeDate = new Date(t.entryTime);
    return tradeDate >= todayStart && tradeDate <= todayEnd;
  });
  const todayPnL = todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const { winRateExclScratches: todayWinRate } = summarizeWinLossScratch(todayTrades);
  
  // Calculate yesterday's P&L for comparison
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayStart);
  yesterdayEnd.setMilliseconds(-1);
  const yesterdayTrades = accountTrades.filter(t => {
    const tradeDate = new Date(t.entryTime);
    return tradeDate >= yesterdayStart && tradeDate <= yesterdayEnd;
  });
  const yesterdayPnL = yesterdayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);

  // Get habits data for correlation analysis
  const { rules, logs: habitLogs } = useRuleTallyStore();
  
  // Format habit data for insight engine
  const habitsForInsights = useMemo(() => {
    return rules.map(r => ({
      id: r.id,
      label: r.label,
      emoji: r.emoji || '⭐',
    }));
  }, [rules]);

  const habitDaysForInsights = useMemo(() => {
    return habitLogs.map(log => ({
      date: log.date,
      ruleId: log.ruleId,
      completed: log.tallyCount > 0,
    }));
  }, [habitLogs]);

  // Generate daily insight (Apple-style: one insight per day)
  const dailyInsight = useMemo(() => {
    return generateDailyInsight(accountTrades, habitsForInsights, habitDaysForInsights);
  }, [accountTrades, habitsForInsights, habitDaysForInsights]);

  const { saveInsight } = useInsightHistoryStore();
  
  // Auto-save insight to history (Premium feature)
  useEffect(() => {
    if (dailyInsight) {
      const today = new Date().toISOString().split('T')[0];
      saveInsight(dailyInsight, today);
    }
  }, [dailyInsight, saveInsight]);

  const [insightDismissed, setInsightDismissed] = useState(false);
  const { setFilter } = useAnalyticsFilterStore();

  const handleInsightAction = (action: string) => {
    console.log('Insight action:', action);
    
    switch (action) {
      case 'view-overtrade-days':
        // TODO: Implement overtrade days filter with day grouping
        setFilter(null); // Placeholder for now
        setCurrentView('analytics');
        showToast('View all analytics - overtrade filter coming soon!');
        break;
      
      case 'view-time-analysis': {
        // Find the golden hour from trades
        const hourMap = new Map<number, Trade[]>();
        accountTrades.forEach(t => {
          const hour = new Date(t.entryTime).getHours();
          if (!hourMap.has(hour)) hourMap.set(hour, []);
          hourMap.get(hour)!.push(t);
        });
        
        const hourStats = Array.from(hourMap.entries())
          .filter(([_, trades]) => trades.length >= 5)
          .map(([hour, trades]) => ({
            hour,
            winRate: (trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100,
          }))
          .sort((a, b) => b.winRate - a.winRate);
        
        if (hourStats.length > 0) {
          const filter = createGoldenHourFilter(hourStats[0].hour);
          setFilter(filter);
          setCurrentView('analytics');
        }
        break;
      }
      
      case 'view-revenge-trades': {
        const filter = createRevengeTradesFilter(accountTrades);
        setFilter(filter);
        setCurrentView('analytics');
        break;
      }
      
      case 'view-session-analysis': {
        // Show comparison of first vs last trades
        const firstFilter = createFirstTradesFilter(accountTrades);
        setFilter(firstFilter);
        setCurrentView('analytics');
        break;
      }
      
      case 'review-losses': {
        const filter = createLossPatternFilter();
        setFilter(filter);
        setCurrentView('analytics');
        break;
      }
      
      case 'view-habit-correlation': {
        // Filter analytics to show trades on habit days vs non-habit days
        if (dailyInsight?.habitId) {
          const habitId = dailyInsight.habitId;
          const habitDaysSet = new Set(
            habitDaysForInsights
              .filter(d => d.ruleId === habitId && d.completed)
              .map(d => d.date)
          );
          
          const habit = habitsForInsights.find(h => h.id === habitId);
          if (habit) {
            const filter = {
              type: 'habit-correlation' as const,
              label: `${habit.emoji} ${habit.label} Days`,
              description: `Trades on days you completed "${habit.label}"`,
              filterFn: (trade: Trade) => {
                const tradeDate = new Date(trade.entryTime).toISOString().split('T')[0];
                return habitDaysSet.has(tradeDate);
              },
              comparisonFilterFn: (trade: Trade) => {
                const tradeDate = new Date(trade.entryTime).toISOString().split('T')[0];
                return !habitDaysSet.has(tradeDate);
              },
            };
            setFilter(filter);
            setCurrentView('analytics');
          }
        }
        break;
      }
      
      case 'open-habits': {
        setCurrentView('habits');
        break;
      }
      
      case 'set-trade-limit':
      case 'set-daily-limit':
        // Show todo with suggestion to set a limit
        const { addTask } = useTodoStore.getState();
        addTask('Set daily trade limit to maintain quality', {
          priority: 'high',
          category: 'discipline',
          pinned: true,
        });
        // Show toast
        showToast('Added to your todos!');
        break;
      
      case 'set-time-reminder':
      case 'set-cooldown-timer':
        // Add reminder task
        const { addTask: addReminderTask } = useTodoStore.getState();
        addReminderTask('Set up trading time/cooldown reminders', {
          priority: 'med',
          category: 'discipline',
        });
        showToast('Added reminder to todos!');
        break;
      
      case 'log-break':
        // Navigate to journal
        setCurrentView('journal');
        showToast('Take a break and reflect on your trades');
        break;
      
      default:
        console.log('Unhandled action:', action);
    }
  };

  // Simple toast notification
  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 z-50 px-4 py-3 bg-card border border-border rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom';
    toast.innerHTML = `
      <div class="w-2 h-2 rounded-full bg-green-500"></div>
      <span class="text-sm font-medium text-foreground">${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Discipline Mode ON/OFF UI */}
        {disciplineEnabled ? (
          <div className="space-y-3">
            {!todayDay?.checkInAt && (
              <CheckInCard defaultMax={defaultMax} tz={tz} />
            )}
            {todayDay && (
              <div className="flex items-center gap-3">
                <QuickLogButton tz={tz} onMaxReached={() => setOverrideOpen(true)} />
                <TradesLeftWidget maxTrades={todayDay?.maxTrades || 0} usedTrades={todayDay?.usedTrades || 0} />
                <div className="ml-2">
                  <BulletMeter max={todayDay?.maxTrades || 0} used={todayDay?.usedTrades || 0} />
                </div>
                {/* dev reset button removed */}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <QuickLogButton tz={tz} />
            </div>
            <DisciplineNudgeCard onEnable={handleEnableDiscipline} />
          </div>
        )}
        
        {/* Hero P&L Card - Apple's "One Metric to Rule Them All" */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-1 gap-6">
            <HeroPnLCard 
              todayPnL={todayPnL}
              todayTrades={todayTrades.length}
              todayWinRate={todayWinRate}
              yesterdayPnL={yesterdayPnL}
            />
          </div>
        </motion.section>

        {/* Daily Insight - Apple-style personalized coaching */}
        {!insightDismissed && (
          <motion.section
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {dailyInsight ? (
              <DailyInsightCard
                insight={dailyInsight}
                onDismiss={() => setInsightDismissed(true)}
                onAction={handleInsightAction}
              />
            ) : accountTrades.length >= 5 && accountTrades.length < 10 ? (
              <DailyInsightEmptyState />
            ) : null}
          </motion.section>
        )}
        
        {/* Historical Performance - Secondary Metrics */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Historical Performance</h2>
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
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <MinimalKPICard
              title="Win Rate"
              value={`${winRate.toFixed(0)}%`}
              change={`${winCount}W / ${lossCount}L`}
              changeType={winRate > 60 ? 'positive' : winRate > 40 ? 'neutral' : 'negative'}
              icon={Target}
            />
            <MinimalKPICard
              title="Profit Factor"
              value={profitFactor > 0 ? profitFactor.toFixed(1) : '0.0'}
              change={profitFactor > 1.5 ? 'Excellent' : profitFactor > 1 ? 'Good' : 'Poor'}
              changeType={profitFactor > 1.5 ? 'positive' : profitFactor > 1 ? 'neutral' : 'negative'}
              icon={Sparkles}
            />
            <MinimalKPICard
              title="Total Trades"
              value={accountTrades.length.toString()}
              change={`${formatCurrency(totalPnL)}`}
              changeType={totalPnL > 0 ? 'positive' : totalPnL < 0 ? 'negative' : 'neutral'}
              icon={Trophy}
            />
          </div>
        </motion.section>

        {/* EOD Prompts */}
        {isAfterMarketClose(tz, 16, 10) && (
          disciplineEnabled ? (
            <EndOfDayModalOn open={eodOnOpen} onClose={() => setEodOnOpen(false)} tz={tz} loggedCount={todayDay?.usedTrades || 0} />
          ) : (
            <EODPromptOff open={eodOffOpen} onClose={() => setEodOffOpen(false)} tz={tz} />
          )
        )}

        {/* Daily Intent + Habits - Apple's focused cards */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <DailyIntentCard />
          <HabitsCard />
        </section>

        {/* AI Insights - Always visible */}
        <AIInsights />

        {/* Bottom Section Toggle */}
        <motion.button
          className="w-full flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowBottomSection(!showBottomSection)}
          whileHover={{ scale: 1.02 }}
        >
          <span className="text-sm font-medium">
            {showBottomSection ? 'Hide' : 'Show'} Recent Activity & Progress
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
              
              {/* Weekly Review - Only show if discipline mode is enabled */}
              {disciplineEnabled && weekDays && weekDays.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">This Week's Discipline</h3>
                  <WeeklyReviewCard days={(weekDays || []).map((d: any) => ({
                    date: d.date,
                    status: (d.status || 'open'),
                    respectedLimit: d.respectedLimit,
                    lateLogging: d.lateLogging,
                    disciplineEnabled: !!(d.checkInAt || d.status === 'broken' || d.respectedLimit),
                  }))} />
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
      <OverrideModal open={overrideOpen} onClose={() => setOverrideOpen(false)} tz={tz} />
      <BulletCounterSetupModal 
        isOpen={setupModalOpen} 
        onClose={() => setSetupModalOpen(false)} 
        onConfirm={handleConfirmBulletSetup}
      />
      
      {/* Daily Discipline Onboarding */}
      <DailyDisciplineOnboarding
        isOpen={showDisciplineOnboarding}
        onClose={handleOnboardingComplete}
      />
    </div>
  );
};

export default MinimalDashboard;
