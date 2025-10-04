/**
 * Habit Experiment View - Premium Feature
 * Structured A/B testing for habits with results visualization
 * Apple-style: Scientific, beautiful, actionable
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Plus, Lock, Sparkles, Calendar, TrendingUp, Activity, CheckCircle2, XCircle, MinusCircle, ChevronRight } from 'lucide-react';
import { useHabitExperimentStore, type HabitExperiment } from '@/store/useHabitExperimentStore';
import { useRuleTallyStore } from '@/store/useRuleTallyStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useSubscription } from '@/hooks/useSubscription';
import { getFeatureUpgradeCTA } from '@/lib/tierLimits';
import { UpgradeModal } from './UpgradeModal';
import { cn } from '@/lib/utils';

const HabitExperimentView: React.FC = () => {
  const { isPremium } = useSubscription();
  const { experiments, loadExperiments, loading } = useHabitExperimentStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<HabitExperiment | null>(null);
  
  // Load experiments on mount
  useEffect(() => {
    if (isPremium) {
      loadExperiments();
    }
  }, [isPremium, loadExperiments]);
  
  // Premium gate
  if (!isPremium) {
    const upgradeCTA = getFeatureUpgradeCTA('hasExperimentMode');
    
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Habit Experiments</h3>
              <p className="text-sm text-muted-foreground">A/B test your habits scientifically</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Premium</span>
          </div>
        </div>
        
        {/* Feature Showcase */}
        <div className="relative">
          <div className="blur-sm opacity-50 pointer-events-none space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-6 bg-card border border-border rounded-xl">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-3xl">🧪</div>
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-6 bg-muted rounded" />
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-6 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Lock Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 max-w-md p-6"
            >
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                <FlaskConical className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{upgradeCTA.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{upgradeCTA.description}</p>
                <ul className="text-left space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Create structured A/B tests for any habit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Compare habit days vs control days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Get statistical confidence scores</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Visual results with actionable insights</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
  const activeExperiments = experiments.filter(e => e.status === 'active');
  const completedExperiments = experiments.filter(e => e.status === 'completed');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Habit Experiments</h3>
            <p className="text-sm text-muted-foreground">
              {activeExperiments.length} active • {completedExperiments.length} completed
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Experiment
        </button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading experiments...</span>
          </div>
        </div>
      ) : experiments.length === 0 ? (
        <EmptyState onCreateClick={() => setShowCreateModal(true)} />
      ) : (
        <>
          {/* Active Experiments */}
          {activeExperiments.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Active Experiments</h4>
              {activeExperiments.map((experiment) => (
                <ExperimentCard
                  key={experiment.id}
                  experiment={experiment}
                  onClick={() => setSelectedExperiment(experiment)}
                />
              ))}
            </div>
          )}
          
          {/* Completed Experiments */}
          {completedExperiments.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground">Completed Experiments</h4>
              {completedExperiments.map((experiment) => (
                <ExperimentCard
                  key={experiment.id}
                  experiment={experiment}
                  onClick={() => setSelectedExperiment(experiment)}
                />
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Create Modal */}
      <CreateExperimentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      
      {/* Experiment Details Modal */}
      {selectedExperiment && (
        <ExperimentDetailsModal
          experiment={selectedExperiment}
          onClose={() => setSelectedExperiment(null)}
        />
      )}
    </div>
  );
};

// Empty State
const EmptyState: React.FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 mb-4 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
        <FlaskConical className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No experiments yet</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        Create your first experiment to scientifically test if a habit improves your trading performance.
      </p>
      <button
        onClick={onCreateClick}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" />
        Create Experiment
      </button>
    </div>
  );
};

// Experiment Card Component
interface ExperimentCardProps {
  experiment: HabitExperiment;
  onClick: () => void;
}

const ExperimentCard: React.FC<ExperimentCardProps> = ({ experiment, onClick }) => {
  const daysRemaining = experiment.status === 'active'
    ? Math.max(0, Math.ceil((new Date(experiment.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  
  const progress = experiment.status === 'active'
    ? (experiment.completedDays.length / experiment.duration) * 100
    : 100;
  
  const getStatusColor = () => {
    if (experiment.status === 'completed') {
      if (!experiment.results) return 'text-muted-foreground';
      if (experiment.results.conclusion === 'positive') return 'text-green-600 dark:text-green-400';
      if (experiment.results.conclusion === 'negative') return 'text-red-600 dark:text-red-400';
      return 'text-yellow-600 dark:text-yellow-400';
    }
    return 'text-blue-600 dark:text-blue-400';
  };
  
  const getStatusIcon = () => {
    if (experiment.status === 'completed') {
      if (!experiment.results) return <MinusCircle className="w-4 h-4" />;
      if (experiment.results.conclusion === 'positive') return <CheckCircle2 className="w-4 h-4" />;
      if (experiment.results.conclusion === 'negative') return <XCircle className="w-4 h-4" />;
      return <MinusCircle className="w-4 h-4" />;
    }
    return <Activity className="w-4 h-4 animate-pulse" />;
  };
  
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full p-4 bg-card border border-border rounded-xl text-left hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="text-3xl flex-shrink-0">{experiment.habitEmoji}</div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold truncate">{experiment.habitLabel}</h4>
            <div className={cn('flex items-center gap-1 text-xs font-medium', getStatusColor())}>
              {getStatusIcon()}
              <span className="capitalize">{experiment.status}</span>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-3">
            {experiment.duration} days • {experiment.method === 'alternate' ? 'Alternate days' : 'Custom schedule'}
          </p>
          
          {experiment.status === 'active' && (
            <>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {daysRemaining} days remaining • {experiment.completedDays.length}/{experiment.duration} days completed
              </p>
            </>
          )}
          
          {experiment.status === 'completed' && experiment.results && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Win Rate:</span>{' '}
                <span className={cn('font-semibold', getStatusColor())}>
                  {experiment.results.winRateImprovement > 0 ? '+' : ''}
                  {experiment.results.winRateImprovement.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Avg P&L:</span>{' '}
                <span className={cn('font-semibold', getStatusColor())}>
                  {experiment.results.avgPnLImprovement > 0 ? '+' : ''}
                  ${experiment.results.avgPnLImprovement.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </div>
    </motion.button>
  );
};

// Create Experiment Modal (simplified - just a placeholder for now)
const CreateExperimentModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { rules } = useRuleTallyStore();
  const { createExperiment } = useHabitExperimentStore();
  const [selectedHabit, setSelectedHabit] = useState('');
  const [duration, setDuration] = useState(14);
  const [method, setMethod] = useState<'alternate' | 'custom'>('alternate');
  
  const handleCreate = async () => {
    const habit = rules.find(r => r.id === selectedHabit);
    if (!habit) return;
    
    await createExperiment(
      habit.id,
      habit.label,
      habit.emoji || '💪',
      duration,
      method
    );
    
    onClose();
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4"
          >
            <h3 className="text-xl font-bold">Create New Experiment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Habit</label>
                <select
                  value={selectedHabit}
                  onChange={(e) => setSelectedHabit(e.target.value)}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                >
                  <option value="">Choose a habit...</option>
                  {rules.map(rule => (
                    <option key={rule.id} value={rule.id}>
                      {rule.emoji || '💪'} {rule.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Duration (days)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  min={7}
                  max={30}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as 'alternate' | 'custom')}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg"
                >
                  <option value="alternate">Alternate Days</option>
                  <option value="custom">Custom Schedule</option>
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  {method === 'alternate' 
                    ? '📅 You\'ll complete the habit every other day (Day 1, 3, 5, etc.)'
                    : '📋 Choose specific days to complete the habit (coming soon)'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!selectedHabit}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Create Experiment
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Experiment Details Modal (simplified placeholder)
const ExperimentDetailsModal: React.FC<{ experiment: HabitExperiment; onClose: () => void }> = ({ experiment, onClose }) => {
  const { trades } = useTradeStore();
  const { completeExperiment, cancelExperiment } = useHabitExperimentStore();
  
  const handleComplete = async () => {
    await completeExperiment(experiment.id, trades);
  };
  
  const handleCancel = async () => {
    await cancelExperiment(experiment.id);
    onClose();
  };
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        >
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="text-4xl">{experiment.habitEmoji}</div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1">{experiment.habitLabel}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(experiment.startDate).toLocaleDateString()} - {new Date(experiment.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {/* Results (if completed) */}
            {experiment.status === 'completed' && experiment.results && (
              <div className="space-y-4">
                <div className={cn(
                  'p-4 rounded-xl',
                  experiment.results.conclusion === 'positive' && 'bg-green-500/10 border border-green-500/20',
                  experiment.results.conclusion === 'negative' && 'bg-red-500/10 border border-red-500/20',
                  experiment.results.conclusion === 'neutral' && 'bg-yellow-500/10 border border-yellow-500/20'
                )}>
                  <p className="text-sm">{experiment.results.summary}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <h4 className="text-sm font-semibold mb-3 text-green-600 dark:text-green-400">With Habit</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-muted-foreground">Days:</span> <span className="font-semibold">{experiment.results.treatment.days}</span></div>
                      <div><span className="text-muted-foreground">Trades:</span> <span className="font-semibold">{experiment.results.treatment.trades}</span></div>
                      <div><span className="text-muted-foreground">Win Rate:</span> <span className="font-semibold">{experiment.results.treatment.winRate.toFixed(1)}%</span></div>
                      <div><span className="text-muted-foreground">Avg P&L:</span> <span className="font-semibold">${experiment.results.treatment.avgPnL.toFixed(2)}</span></div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <h4 className="text-sm font-semibold mb-3 text-red-600 dark:text-red-400">Without Habit</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-muted-foreground">Days:</span> <span className="font-semibold">{experiment.results.control.days}</span></div>
                      <div><span className="text-muted-foreground">Trades:</span> <span className="font-semibold">{experiment.results.control.trades}</span></div>
                      <div><span className="text-muted-foreground">Win Rate:</span> <span className="font-semibold">{experiment.results.control.winRate.toFixed(1)}%</span></div>
                      <div><span className="text-muted-foreground">Avg P&L:</span> <span className="font-semibold">${experiment.results.control.avgPnL.toFixed(2)}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Close
              </button>
              {experiment.status === 'active' && (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleComplete}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Complete Now
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default HabitExperimentView;

