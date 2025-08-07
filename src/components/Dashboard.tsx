import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target,
  Trophy,
  Heart,
  Brain,
  Zap,
  PlusCircle,
  BookOpen,
  Database,
  Calendar,
  Clock
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useAccountFilterStore, getAccountIdsForSelection } from '@/store/useAccountFilterStore';
import { useQuestStore } from '@/store/useQuestStore';
import { addDemoTradesToAccount } from '@/utils/demoDataGenerator';
import { formatCurrency } from '@/lib/localStorageUtils';
import { CircularProgress } from './ui/CircularProgress';
import { Sparkline, TrendIndicator } from './ui/Sparkline';

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  trendData?: number[];
  showSparkline?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  trendData = [],
  showSparkline = true 
}) => {
  const changeColor = changeType === 'positive' ? 'text-green-500' : 
                     changeType === 'negative' ? 'text-red-500' : 'text-muted-foreground';
  
  return (
    <motion.div
      className="bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-glow-sm"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl bg-muted">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 ${changeColor}`}>
            {changeType === 'positive' && <TrendingUp className="w-4 h-4" />}
            {changeType === 'negative' && <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-medium">{change}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-2xl font-bold text-card-foreground mb-1">{value}</h3>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        {showSparkline && trendData.length > 0 && trendData.some(val => val !== 0) && (
          <div className="flex flex-col items-end gap-1">
            <Sparkline 
              data={trendData} 
              width={50} 
              height={16} 
              color="auto"
              strokeWidth={2}
            />
            <TrendIndicator data={trendData} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const Dashboard: React.FC = () => {
  const { trades } = useTradeStore();
  const { accounts, selectedAccountId } = useAccountFilterStore();
  const { quests, pinnedQuests, cleanupPinnedQuests } = useQuestStore();
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  // Clean up pinned quests on dashboard load
  useEffect(() => {
    // Run cleanup immediately and add a small delay to catch any async quest updates
    cleanupPinnedQuests();
    setTimeout(() => {
      cleanupPinnedQuests();
    }, 500);
  }, [cleanupPinnedQuests]);

  // Find Demo Account
  const demoAccount = accounts.find(acc => acc.name === 'Demo Account');

  // Get pinned quests data - filter out completed, cancelled, failed, and fully progressed quests
  const pinnedQuestsList = quests.filter(q => {
    if (!pinnedQuests.includes(q.id)) return false;
    if (q.status === 'completed' || q.status === 'cancelled' || q.status === 'failed') return false;
    if (q.progress >= q.maxProgress) return false; // Also filter out quests that are fully progressed but not marked complete
    return true;
  });

  // Calculate real KPIs (respect group selection)
  const filteredTrades = React.useMemo(() => {
    if (!selectedAccountId) return trades;
    const ids = getAccountIdsForSelection(selectedAccountId);
    return trades.filter(trade => ids.includes(trade.accountId));
  }, [trades, selectedAccountId]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayTrades = filteredTrades.filter(trade => {
    const tradeDate = new Date(trade.entryTime);
    tradeDate.setHours(0, 0, 0, 0);
    return tradeDate.getTime() === today.getTime();
  });

  const totalPnL = filteredTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const todayPnL = todayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winningTrades = filteredTrades.filter(t => (t.pnl || 0) > 0).length;
  const losingTrades = filteredTrades.filter(t => (t.pnl || 0) < 0).length;
  const breakEvenTrades = filteredTrades.filter(t => (t.pnl || 0) === 0).length;
  const winRate = filteredTrades.length > 0 ? (winningTrades / filteredTrades.length) * 100 : 0;

  // Generate trend data for sparklines
  const generateDailyPnLTrend = (): number[] => {
    const days: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayTrades = filteredTrades.filter(trade => {
        const tradeDate = new Date(trade.entryTime);
        tradeDate.setHours(0, 0, 0, 0);
        return tradeDate.getTime() === date.getTime();
      });
      
      const dayPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      days.push(dayPnL as number);
    }
    return days;
  };

  const generateWeeklyPnLTrend = (): number[] => {
    const weeks: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - (i * 7));
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      
      const weekTrades = filteredTrades.filter(trade => {
        const tradeDate = new Date(trade.entryTime);
        return tradeDate >= startDate && tradeDate <= endDate;
      });
      
      const weekPnL = weekTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      weeks.push(weekPnL as number);
    }
    return weeks;
  };

  const generateTradeCountTrend = (): number[] => {
    const days: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayTrades = filteredTrades.filter(trade => {
        const tradeDate = new Date(trade.entryTime);
        tradeDate.setHours(0, 0, 0, 0);
        return tradeDate.getTime() === date.getTime();
      });
      
      days.push(dayTrades.length as number);
    }
    return days;
  };

  const dailyPnLTrend = generateDailyPnLTrend();
  const weeklyPnLTrend = generateWeeklyPnLTrend();
  const tradeCountTrend = generateTradeCountTrend();

  const handleAddDemoData = async () => {
    if (!demoAccount) {
      alert('Demo Account not found. Please create a Demo Account first.');
      return;
    }

    setIsLoadingDemo(true);
    try {
      const tradesAdded = await addDemoTradesToAccount(demoAccount.id);
      alert(`Successfully added ${tradesAdded} demo trades to Demo Account! 🎉\n\nNow you can:\n• View them in the Trades section\n• Analyze performance in Analytics\n• See them on the Calendar`);
    } catch (error) {
      console.error('Error adding demo trades:', error);
      alert('Error adding demo trades. Please try again.');
    } finally {
      setIsLoadingDemo(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-grid">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, Trader! 👋
          </h1>
          <p className="text-muted-foreground">
            {filteredTrades.length === 0 
              ? 'Ready to start your trading journey?' 
              : `You have ${filteredTrades.length} trades tracked${todayTrades.length > 0 ? `, ${todayTrades.length} today` : ''}`
            }
          </p>
        </motion.div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="P&L Today"
          value={todayTrades.length > 0 ? formatCurrency(todayPnL) : '$0.00'}
          change={todayTrades.length > 0 ? (todayPnL >= 0 ? '+' : '') + Math.abs(todayPnL).toFixed(0) : undefined}
          changeType={todayPnL > 0 ? 'positive' : todayPnL < 0 ? 'negative' : 'neutral'}
          icon={DollarSign}
          trendData={dailyPnLTrend}
        />
        
        {/* Win Rate with Circular Progress */}
        <motion.div
          className="bg-card rounded-2xl p-6 border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-glow-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-muted">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredTrades.length} trades
            </div>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Win Rate</h3>
          
          {filteredTrades.length > 0 ? (
            <CircularProgress
              wins={winningTrades}
              losses={losingTrades}
              breakeven={breakEvenTrades}
              size="sm"
              showLabels={false}
              showInlineNumbers={true}
              className="mx-auto"
            />
          ) : (
            <div className="text-center py-4">
              <div className="text-2xl font-bold text-foreground mb-1">0%</div>
              <div className="text-xs text-muted-foreground">No trades yet</div>
            </div>
          )}
        </motion.div>
        
        <KPICard
          title="Total P&L"
          value={filteredTrades.length > 0 ? formatCurrency(totalPnL) : '$0.00'}
          change={filteredTrades.length > 0 ? (totalPnL >= 0 ? 'Profitable' : 'Drawdown') : undefined}
          changeType={totalPnL > 0 ? 'positive' : totalPnL < 0 ? 'negative' : 'neutral'}
          icon={TrendingUp}
          trendData={weeklyPnLTrend}
        />
        <KPICard
          title="Total Trades"
          value={filteredTrades.length.toString()}
          change={filteredTrades.length === 0 ? 'Get started!' : `${winningTrades} wins`}
          changeType={filteredTrades.length > 0 ? 'positive' : 'neutral'}
          icon={Trophy}
          trendData={tradeCountTrend}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          className="bg-card rounded-2xl p-6 border border-border"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-card-foreground">Pinned Quests</h2>
          </div>
          
          <div className="space-y-3">
            {pinnedQuestsList.length > 0 ? (
              pinnedQuestsList.map((quest) => (
                <div key={quest.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-card-foreground">{quest.title}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        quest.type === 'daily' ? 'bg-blue-500/20 text-blue-500' :
                        quest.type === 'weekly' ? 'bg-green-500/20 text-green-500' :
                        quest.type === 'monthly' ? 'bg-purple-500/20 text-purple-500' :
                        'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {quest.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{quest.description}</p>
                    
                    <div className="flex items-center gap-3">
                      {quest.progress > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-muted-foreground/20 rounded-full h-1.5">
                            <div 
                              className="bg-primary h-1.5 rounded-full transition-all" 
                              style={{ width: `${(quest.progress / quest.maxProgress) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {quest.progress}/{quest.maxProgress}
                          </span>
                        </div>
                      )}
                      
                      {quest.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(quest.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-orange-500 font-bold">+{quest.xpReward} XP</div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No pinned quests yet</p>
                <p className="text-xs text-muted-foreground">
                  Pin daily focus goals from your journal reflections
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          className="bg-card rounded-2xl p-6 border border-border"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-card-foreground">GPT-4o Insights</h2>
          </div>
          
          <div className="space-y-3">
            {filteredTrades.length === 0 && demoAccount ? (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">🎯 Get Started</p>
                <p className="text-xs text-blue-600 dark:text-blue-300 mb-2">
                  Click the database icon below to add 20 realistic demo trades and test all features!
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400">
                  Includes: Tech stocks, ETFs, different outcomes, notes, and tags
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-card-foreground mb-2">💡 Pattern Recognition</p>
                  <p className="text-xs text-muted-foreground">
                    {filteredTrades.length > 0 
                      ? `Your win rate is ${winRate.toFixed(1)}% across ${filteredTrades.length} trades`
                      : 'Add trades to see personalized insights'
                    }
                  </p>
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-card-foreground mb-2">📊 Performance</p>
                  <p className="text-xs text-muted-foreground">
                    {filteredTrades.length > 0 
                      ? `Total P&L: ${formatCurrency(totalPnL)} across all trades`
                      : 'Track your performance with the analytics dashboard'
                    }
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-4">
        {demoAccount && (
          <motion.button
            onClick={handleAddDemoData}
            disabled={isLoadingDemo}
            className="bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-glow transition-all duration-200 disabled:opacity-50"
            whileHover={{ scale: isLoadingDemo ? 1 : 1.1 }}
            whileTap={{ scale: isLoadingDemo ? 1 : 0.9 }}
            title="Add Demo Trades"
          >
            {isLoadingDemo ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Database className="w-6 h-6" />
            )}
          </motion.button>
        )}
        
        <motion.button
          className="bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-full shadow-lg hover:shadow-glow transition-all duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <PlusCircle className="w-6 h-6" />
        </motion.button>
        
        <motion.button
          className="bg-muted hover:bg-muted/80 text-muted-foreground p-4 rounded-full shadow-lg transition-all duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <BookOpen className="w-6 h-6" />
        </motion.button>
      </div>
    </div>
  );
}; 