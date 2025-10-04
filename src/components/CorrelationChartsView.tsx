/**
 * Correlation Charts View - Premium Feature
 * Visual charts showing habit impact on trading performance
 * Apple-style: Beautiful, interactive, insightful
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Sparkles, Lock, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { findTopHabitCorrelations, type HabitCorrelation } from '@/lib/habitCorrelation';
import { useSubscription } from '@/hooks/useSubscription';
import { getFeatureUpgradeCTA } from '@/lib/tierLimits';
import { UpgradeModal } from './UpgradeModal';
import { cn } from '@/lib/utils';

interface CorrelationChartsViewProps {
  habits: Array<{ id: string; label: string; emoji: string }>;
  habitDays: Array<{ date: string; ruleId: string; completed: boolean }>;
  trades: any[];
}

const CorrelationChartsView: React.FC<CorrelationChartsViewProps> = ({
  habits,
  habitDays,
  trades,
}) => {
  const { isPremium } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedHabitIndex, setSelectedHabitIndex] = useState(0);
  
  // Calculate top 3 correlations
  const topCorrelations = useMemo(() => {
    return findTopHabitCorrelations(habits, habitDays, trades, 3);
  }, [habits, habitDays, trades]);
  
  if (topCorrelations.length === 0) {
    return null; // No correlations to show
  }
  
  // Premium gate
  if (!isPremium) {
    const upgradeCTA = getFeatureUpgradeCTA('hasCorrelationCharts');
    
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Performance Charts</h3>
              <p className="text-sm text-muted-foreground">Visualize habit impact</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Premium</span>
          </div>
        </div>
        
        {/* Blurred Preview */}
        <div className="relative">
          <div className="blur-md opacity-50 pointer-events-none">
            <div className="h-80 bg-card border border-border rounded-xl p-6">
              <div className="h-full flex items-center justify-center">
                <div className="space-y-4 w-full">
                  <div className="h-6 bg-muted rounded w-1/3" />
                  <div className="grid grid-cols-2 gap-4 h-48">
                    <div className="bg-muted rounded" />
                    <div className="bg-muted rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Lock Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 max-w-md p-6"
            >
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{upgradeCTA.title}</h3>
                <p className="text-sm text-muted-foreground">{upgradeCTA.description}</p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mx-auto"
              >
                <Sparkles className="w-5 h-5" />
                Upgrade to Premium
              </button>
            </motion.div>
          </div>
        </div>
        
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature={upgradeCTA.title}
        />
      </div>
    );
  }
  
  // Premium content
  const selectedCorrelation = topCorrelations[selectedHabitIndex];
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Performance Charts</h3>
            <p className="text-sm text-muted-foreground">Habit impact visualization</p>
          </div>
        </div>
      </div>
      
      {/* Habit Selector */}
      {topCorrelations.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {topCorrelations.map((correlation, index) => (
            <button
              key={correlation.habitId}
              onClick={() => setSelectedHabitIndex(index)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all flex-shrink-0',
                selectedHabitIndex === index
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:border-primary/50'
              )}
            >
              <span className="text-xl">{correlation.habitEmoji}</span>
              <span className="font-medium text-sm">{correlation.habitLabel}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* Charts */}
      <motion.div
        key={selectedCorrelation.habitId}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Win Rate Chart */}
        <WinRateChart correlation={selectedCorrelation} />
        
        {/* P&L Chart */}
        <PnLChart correlation={selectedCorrelation} />
      </motion.div>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Sample Size"
          value={`${selectedCorrelation.sampleSize} days`}
          icon={Activity}
        />
        <StatCard
          label="Confidence"
          value={`${selectedCorrelation.confidence}%`}
          icon={TrendingUp}
        />
        <StatCard
          label="Trades (With)"
          value={selectedCorrelation.withHabit.count.toString()}
          icon={BarChart3}
        />
        <StatCard
          label="Trades (Without)"
          value={selectedCorrelation.withoutHabit.count.toString()}
          icon={BarChart3}
        />
      </div>
    </div>
  );
};

// Win Rate Comparison Chart
const WinRateChart: React.FC<{ correlation: HabitCorrelation }> = ({ correlation }) => {
  const data = [
    {
      name: 'With Habit',
      value: correlation.withHabit.winRate,
      fill: '#10b981', // green-500
    },
    {
      name: 'Without Habit',
      value: correlation.withoutHabit.winRate,
      fill: '#ef4444', // red-500
    },
  ];
  
  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        Win Rate Comparison
      </h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: any) => [`${value.toFixed(1)}%`, 'Win Rate']}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 text-center">
        <span className={cn(
          'text-sm font-semibold',
          correlation.winRateImprovement > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        )}>
          {correlation.winRateImprovement > 0 ? '+' : ''}{correlation.winRateImprovement.toFixed(1)}% improvement
        </span>
      </div>
    </div>
  );
};

// P&L Comparison Chart
const PnLChart: React.FC<{ correlation: HabitCorrelation }> = ({ correlation }) => {
  const data = [
    {
      name: 'With Habit',
      value: correlation.withHabit.avgPnL,
      fill: correlation.withHabit.avgPnL >= 0 ? '#10b981' : '#ef4444',
    },
    {
      name: 'Without Habit',
      value: correlation.withoutHabit.avgPnL,
      fill: correlation.withoutHabit.avgPnL >= 0 ? '#10b981' : '#ef4444',
    },
  ];
  
  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4 text-primary" />
        Average P&L Comparison
      </h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: any) => [`$${value.toFixed(2)}`, 'Avg P&L']}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 text-center">
        <span className={cn(
          'text-sm font-semibold',
          correlation.avgPnLImprovement > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        )}>
          {correlation.avgPnLImprovement > 0 ? '+' : ''}${correlation.avgPnLImprovement.toFixed(2)} improvement
        </span>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{ label: string; value: string; icon: React.ElementType }> = ({ 
  label, 
  value, 
  icon: Icon 
}) => {
  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-lg font-bold text-foreground">{value}</div>
    </div>
  );
};

export default CorrelationChartsView;

