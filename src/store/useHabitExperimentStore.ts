/**
 * Habit Experiment Store - Premium Feature
 * Structured A/B testing for habits
 * Apple-style: Scientific, simple, insightful
 */

import { create } from 'zustand';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Trade } from '@/types';

export interface HabitExperiment {
  id: string;
  userId: string;
  habitId: string;
  habitLabel: string;
  habitEmoji: string;
  
  // Experiment configuration
  duration: number; // days
  method: 'alternate' | 'custom';
  customSchedule?: string[]; // Array of dates to complete habit
  
  // Status
  status: 'active' | 'completed' | 'cancelled';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  completedDays: string[]; // Array of dates habit was completed
  
  // Results (calculated at end)
  results?: ExperimentResults;
  
  // Metadata
  createdAt: Date;
  completedAt?: Date;
}

export interface ExperimentResults {
  // Control group (no habit)
  control: {
    days: number;
    trades: number;
    winRate: number;
    avgPnL: number;
    totalPnL: number;
  };
  
  // Treatment group (with habit)
  treatment: {
    days: number;
    trades: number;
    winRate: number;
    avgPnL: number;
    totalPnL: number;
  };
  
  // Improvements
  winRateImprovement: number; // percentage points
  avgPnLImprovement: number; // dollar amount
  confidence: number; // 0-100
  
  // Conclusion
  conclusion: 'positive' | 'negative' | 'neutral';
  summary: string;
}

interface HabitExperimentState {
  experiments: HabitExperiment[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadExperiments: () => Promise<void>;
  createExperiment: (
    habitId: string,
    habitLabel: string,
    habitEmoji: string,
    duration: number,
    method: 'alternate' | 'custom',
    customSchedule?: string[]
  ) => Promise<HabitExperiment>;
  completeExperiment: (experimentId: string, trades: Trade[]) => Promise<void>;
  cancelExperiment: (experimentId: string) => Promise<void>;
  markDayCompleted: (experimentId: string, date: string) => Promise<void>;
}

export const useHabitExperimentStore = create<HabitExperimentState>((set, get) => ({
  experiments: [],
  loading: false,
  error: null,
  
  loadExperiments: async () => {
    try {
      set({ loading: true, error: null });
      
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) {
        set({ loading: false });
        return;
      }
      
      const q = query(
        collection(db, 'habitExperiments'),
        where('userId', '==', currentUser.uid)
      );
      
      const snapshot = await getDocs(q);
      const experiments: HabitExperiment[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        experiments.push({
          id: doc.id,
          userId: data.userId,
          habitId: data.habitId,
          habitLabel: data.habitLabel,
          habitEmoji: data.habitEmoji,
          duration: data.duration,
          method: data.method,
          customSchedule: data.customSchedule,
          status: data.status,
          startDate: data.startDate,
          endDate: data.endDate,
          completedDays: data.completedDays || [],
          results: data.results,
          createdAt: data.createdAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate(),
        });
      });
      
      // Sort by creation date (newest first)
      experiments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      set({ experiments, loading: false });
      console.log(`✅ Loaded ${experiments.length} experiments`);
    } catch (error) {
      console.error('Failed to load experiments:', error);
      set({ error: 'Failed to load experiments', loading: false });
    }
  },
  
  createExperiment: async (habitId, habitLabel, habitEmoji, duration, method, customSchedule) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) throw new Error('Not authenticated');
      
      const startDate = new Date().toISOString().split('T')[0];
      const endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const experiment: Omit<HabitExperiment, 'id'> = {
        userId: currentUser.uid,
        habitId,
        habitLabel,
        habitEmoji,
        duration,
        method,
        customSchedule,
        status: 'active',
        startDate,
        endDate,
        completedDays: [],
        createdAt: new Date(),
      };
      
      const docRef = await addDoc(collection(db, 'habitExperiments'), {
        ...experiment,
        createdAt: Timestamp.now(),
      });
      
      const newExperiment: HabitExperiment = {
        ...experiment,
        id: docRef.id,
      };
      
      set(state => ({
        experiments: [newExperiment, ...state.experiments],
      }));
      
      console.log('✅ Experiment created:', habitLabel);
      return newExperiment;
    } catch (error) {
      console.error('Failed to create experiment:', error);
      set({ error: 'Failed to create experiment' });
      throw error;
    }
  },
  
  completeExperiment: async (experimentId, trades) => {
    try {
      const experiment = get().experiments.find(e => e.id === experimentId);
      if (!experiment) throw new Error('Experiment not found');
      
      // Calculate results
      const results = calculateExperimentResults(experiment, trades);
      
      // Update in Firestore
      const docRef = doc(db, 'habitExperiments', experimentId);
      await updateDoc(docRef, {
        status: 'completed',
        results,
        completedAt: Timestamp.now(),
      });
      
      // Update local state
      set(state => ({
        experiments: state.experiments.map(e =>
          e.id === experimentId
            ? { ...e, status: 'completed', results, completedAt: new Date() }
            : e
        ),
      }));
      
      console.log('✅ Experiment completed:', experiment.habitLabel);
    } catch (error) {
      console.error('Failed to complete experiment:', error);
      set({ error: 'Failed to complete experiment' });
    }
  },
  
  cancelExperiment: async (experimentId) => {
    try {
      const docRef = doc(db, 'habitExperiments', experimentId);
      await updateDoc(docRef, {
        status: 'cancelled',
      });
      
      set(state => ({
        experiments: state.experiments.map(e =>
          e.id === experimentId ? { ...e, status: 'cancelled' } : e
        ),
      }));
      
      console.log('✅ Experiment cancelled');
    } catch (error) {
      console.error('Failed to cancel experiment:', error);
      set({ error: 'Failed to cancel experiment' });
    }
  },
  
  markDayCompleted: async (experimentId, date) => {
    try {
      const experiment = get().experiments.find(e => e.id === experimentId);
      if (!experiment) return;
      
      const completedDays = [...experiment.completedDays, date];
      
      const docRef = doc(db, 'habitExperiments', experimentId);
      await updateDoc(docRef, { completedDays });
      
      set(state => ({
        experiments: state.experiments.map(e =>
          e.id === experimentId ? { ...e, completedDays } : e
        ),
      }));
    } catch (error) {
      console.error('Failed to mark day completed:', error);
    }
  },
}));

// Helper function to calculate experiment results
function calculateExperimentResults(
  experiment: HabitExperiment,
  allTrades: Trade[]
): ExperimentResults {
  // Filter trades within experiment date range
  const trades = allTrades.filter(t => {
    const tradeDate = new Date(t.entryTime).toISOString().split('T')[0];
    return tradeDate >= experiment.startDate && tradeDate <= experiment.endDate;
  });
  
  // Separate trades into control and treatment groups
  const treatmentTrades = trades.filter(t => {
    const tradeDate = new Date(t.entryTime).toISOString().split('T')[0];
    return experiment.completedDays.includes(tradeDate);
  });
  
  const controlTrades = trades.filter(t => {
    const tradeDate = new Date(t.entryTime).toISOString().split('T')[0];
    return !experiment.completedDays.includes(tradeDate);
  });
  
  // Calculate metrics for each group
  const treatmentMetrics = calculateGroupMetrics(treatmentTrades);
  const controlMetrics = calculateGroupMetrics(controlTrades);
  
  // Calculate improvements
  const winRateImprovement = treatmentMetrics.winRate - controlMetrics.winRate;
  const avgPnLImprovement = treatmentMetrics.avgPnL - controlMetrics.avgPnL;
  
  // Simple confidence calculation
  const minSample = Math.min(experiment.completedDays.length, experiment.duration - experiment.completedDays.length);
  const confidence = Math.min(100, (minSample / 10) * 50 + Math.abs(winRateImprovement));
  
  // Determine conclusion
  let conclusion: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (winRateImprovement >= 10 || avgPnLImprovement >= 50) {
    conclusion = 'positive';
  } else if (winRateImprovement <= -10 || avgPnLImprovement <= -50) {
    conclusion = 'negative';
  }
  
  // Generate summary
  const summary = generateSummary(experiment, winRateImprovement, avgPnLImprovement, conclusion);
  
  return {
    control: {
      days: experiment.duration - experiment.completedDays.length,
      ...controlMetrics,
    },
    treatment: {
      days: experiment.completedDays.length,
      ...treatmentMetrics,
    },
    winRateImprovement,
    avgPnLImprovement,
    confidence,
    conclusion,
    summary,
  };
}

function calculateGroupMetrics(trades: Trade[]) {
  if (trades.length === 0) {
    return {
      trades: 0,
      winRate: 0,
      avgPnL: 0,
      totalPnL: 0,
    };
  }
  
  const wins = trades.filter(t => (t.pnl || 0) > 0).length;
  const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  
  return {
    trades: trades.length,
    winRate: (wins / trades.length) * 100,
    avgPnL: totalPnL / trades.length,
    totalPnL,
  };
}

function generateSummary(
  experiment: HabitExperiment,
  winRateImprovement: number,
  avgPnLImprovement: number,
  conclusion: 'positive' | 'negative' | 'neutral'
): string {
  if (conclusion === 'positive') {
    return `${experiment.habitLabel} appears to improve your trading. On days you completed this habit, your win rate was ${Math.abs(winRateImprovement).toFixed(1)}% higher and you averaged $${Math.abs(avgPnLImprovement).toFixed(2)} more per trade.`;
  } else if (conclusion === 'negative') {
    return `${experiment.habitLabel} may be hurting your trading. On days you completed this habit, your performance was ${Math.abs(winRateImprovement).toFixed(1)}% worse. Consider stopping or modifying this habit.`;
  } else {
    return `${experiment.habitLabel} shows no clear impact on your trading performance. The difference was not statistically significant. Try a longer experiment or different habit.`;
  }
}

