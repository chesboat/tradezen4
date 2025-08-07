import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Brain, 
  Zap, 
  Wind, 
  Play,
  Pause,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  Activity,
  Coffee,
  Smile,
  Clock
} from 'lucide-react';
import { useTradeStore } from '@/store/useTradeStore';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useQuestStore } from '@/store/useQuestStore';
import { WellnessActionType, MoodType } from '@/types';
import { Timeout } from '@/types/utils';
import { getMoodColor, getMoodEmoji, localStorage, STORAGE_KEYS } from '@/lib/localStorageUtils';
import { cn } from '@/lib/utils';

interface WellnessActivity {
  id: WellnessActionType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  duration: number; // minutes
  xpReward: number;
  color: string;
  instructions: string[];
}

interface TiltAlert {
  level: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestions: string[];
  confidence: number;
}

interface BreathingSession {
  isActive: boolean;
  phase: 'inhale' | 'hold' | 'exhale' | 'rest';
  cycleCount: number;
  totalCycles: number;
  timeRemaining: number;
}

export const WellnessView: React.FC = () => {
  const trades = useTradeStore(state => state.trades);
  const { addActivity } = useActivityLogStore();
  const { selectedAccountId } = useAccountFilterStore();
  const { addMoodEntry } = useDailyReflectionStore();
  const { checkDailyFocusProgress, updateQuestProgress } = useQuestStore();
  
  // Initialize mood from localStorage
  const [currentMood, setCurrentMood] = useState<MoodType>(() => {
    return localStorage.getItem(STORAGE_KEYS.WELLNESS_MOOD, 'neutral');
  });
  const [tiltDetection, setTiltDetection] = useState<TiltAlert | null>(null);
  const [activeActivity, setActiveActivity] = useState<WellnessActionType | null>(null);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  // Initialize wellness stats from localStorage
  const [wellnessStats, setWellnessStats] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.WELLNESS_STATS, {
      sessionsToday: 0,
      wellnessXP: 0,
      streakDays: 0,
    });
  });
  const [breathingSession, setBreathingSession] = useState<BreathingSession>({
    isActive: false,
    phase: 'inhale',
    cycleCount: 0,
    totalCycles: 10,
    timeRemaining: 4000, // 4 seconds
  });

  const wellnessActivities: WellnessActivity[] = [
    {
      id: 'breathwork',
      title: 'Box Breathing',
      description: 'Calm your mind with 4-4-4-4 breathing',
      icon: Wind,
      duration: 5,
      xpReward: 25,
      color: 'bg-blue-500',
      instructions: [
        'Inhale for 4 seconds',
        'Hold for 4 seconds', 
        'Exhale for 4 seconds',
        'Rest for 4 seconds',
        'Repeat the cycle'
      ]
    },
    {
      id: 'meditation',
      title: 'Mindfulness',
      description: 'Center yourself with guided meditation',
      icon: Brain,
      duration: 10,
      xpReward: 50,
      color: 'bg-purple-500',
      instructions: [
        'Find a comfortable position',
        'Close your eyes gently',
        'Focus on your breath',
        'Notice thoughts without judgment',
        'Return focus to breathing'
      ]
    },
    {
      id: 'exercise',
      title: 'Quick Movement',
      description: 'Get your blood flowing with light exercise',
      icon: Activity,
      duration: 15,
      xpReward: 40,
      color: 'bg-green-500',
      instructions: [
        'Stand up and stretch',
        'Do 10 jumping jacks',
        'Stretch your arms overhead',
        'Touch your toes 5 times',
        'Take deep breaths'
      ]
    },
    {
      id: 'gratitude',
      title: 'Gratitude Practice',
      description: 'Reflect on three things you\'re grateful for',
      icon: Heart,
      duration: 5,
      xpReward: 30,
      color: 'bg-pink-500',
      instructions: [
        'Think of 3 things you\'re grateful for',
        'Write them down if possible',
        'Feel the positive emotions',
        'Appreciate the present moment',
        'Smile genuinely'
      ]
    },
    {
      id: 'break',
      title: 'Screen Break',
      description: 'Rest your eyes and mind',
      icon: Coffee,
      duration: 10,
      xpReward: 20,
      color: 'bg-yellow-500',
      instructions: [
        'Look away from screens',
        'Focus on something 20 feet away',
        'Blink slowly 10 times',
        'Stretch your neck and shoulders',
        'Drink some water'
      ]
    }
  ];

  // Tilt Detection Logic
  const recentTrades = useMemo(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    return trades.filter(trade => {
      const tradeDate = new Date(trade.entryTime);
      return tradeDate >= oneHourAgo;
    }).filter(trade => !selectedAccountId || trade.accountId === selectedAccountId);
  }, [trades, selectedAccountId]);

  useEffect(() => {
    // Detect potential tilt based on recent trading patterns
    if (recentTrades.length >= 3) {
      const recentLosses = recentTrades.filter(t => t.result === 'loss').length;
      const lossRate = recentLosses / recentTrades.length;
      const avgRisk = recentTrades.reduce((sum, t) => sum + t.riskAmount, 0) / recentTrades.length;
      const baselineRisk = 100; // Assumed baseline
      
      let tiltLevel: TiltAlert['level'] = 'low';
      let confidence = 0;
      let message = '';
      let suggestions: string[] = [];

      if (lossRate >= 0.8 && recentTrades.length >= 4) {
        tiltLevel = 'critical';
        confidence = 95;
        message = 'Critical tilt detected - 80%+ recent losses';
        suggestions = [
          'Stop trading immediately',
          'Take a 30-minute break',
          'Do breathing exercises',
          'Review your trading plan'
        ];
      } else if (lossRate >= 0.6 && avgRisk > baselineRisk * 1.5) {
        tiltLevel = 'high';
        confidence = 85;
        message = 'High tilt risk - increasing position sizes after losses';
        suggestions = [
          'Reduce position sizes',
          'Take a 15-minute break',
          'Practice mindfulness',
          'Review risk management rules'
        ];
      } else if (recentTrades.length >= 5 && lossRate >= 0.6) {
        tiltLevel = 'medium';
        confidence = 70;
        message = 'Possible overtrading detected';
        suggestions = [
          'Consider taking a break',
          'Review your trading plan',
          'Do a quick mindfulness exercise'
        ];
      }

      if (confidence > 0) {
        setTiltDetection({ level: tiltLevel, message, suggestions, confidence });
      } else {
        setTiltDetection(null);
      }
    }
  }, [recentTrades]);

  // Breathing Session Timer
  useEffect(() => {
    let interval: number;
    
    if (breathingSession.isActive) {
      interval = window.setInterval(() => {
        setBreathingSession(prev => {
          if (prev.timeRemaining <= 100) {
            // Move to next phase
            const phases = ['inhale', 'hold', 'exhale', 'rest'] as const;
            const currentIndex = phases.indexOf(prev.phase);
            const nextIndex = (currentIndex + 1) % phases.length;
            const nextPhase = phases[nextIndex];
            
            const newCycleCount = nextPhase === 'inhale' ? prev.cycleCount + 1 : prev.cycleCount;
            
            if (newCycleCount >= prev.totalCycles) {
              // Session complete
              return {
                ...prev,
                isActive: false,
                cycleCount: 0,
                phase: 'inhale'
              };
            }
            
            return {
              ...prev,
              phase: nextPhase,
              cycleCount: newCycleCount,
              timeRemaining: 4000
            };
          }
          
          return {
            ...prev,
            timeRemaining: prev.timeRemaining - 100
          };
        });
      }, 100);
    }
    
    return () => clearInterval(interval);
  }, [breathingSession.isActive]);

  // Session Timer
  useEffect(() => {
    let interval: number;
    
    if (isSessionActive && activeActivity) {
      interval = window.setInterval(() => {
        setSessionTimer(prev => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isSessionActive, activeActivity]);

  // Check if we need to reset daily stats for new day
  useEffect(() => {
    const lastStatsDate = localStorage.getItem('tradzen_wellness_last_date', '');
    const today = new Date().toDateString();
    
    if (lastStatsDate !== today) {
      // Reset daily stats for new day
      setWellnessStats(prev => {
        const newStats = {
          ...prev,
          sessionsToday: 0,
        };
        localStorage.setItem(STORAGE_KEYS.WELLNESS_STATS, newStats);
        localStorage.setItem('tradzen_wellness_last_date', today);
        return newStats;
      });
    }
  }, []);

  const startActivity = (activityId: WellnessActionType) => {
    setActiveActivity(activityId);
    setSessionTimer(0);
    setIsSessionActive(true);
    
    if (activityId === 'breathwork') {
      setBreathingSession({
        isActive: true,
        phase: 'inhale',
        cycleCount: 0,
        totalCycles: 10,
        timeRemaining: 4000
      });
    }
  };

  const completeActivity = (activityId: WellnessActionType) => {
    const activity = wellnessActivities.find(a => a.id === activityId);
    if (!activity) return;

    // Add XP and activity log
    addActivity({
      type: 'wellness',
      title: `Completed ${activity.title}`,
      description: `Practiced ${activity.title.toLowerCase()} for ${Math.floor(sessionTimer / 60)} minutes`,
      xpEarned: activity.xpReward,
      accountId: selectedAccountId || 'default',
    });

    // Add wellness activity completion to mood timeline
    const today = new Date().toISOString().split('T')[0];
    let activityMood: MoodType = 'good'; // Default positive mood for completing wellness activities
    
    // Determine mood based on activity type
    switch (activityId) {
      case 'breathwork':
      case 'meditation':
        activityMood = 'excellent'; // These typically improve mood significantly
        break;
      case 'exercise':
        activityMood = 'good'; // Exercise generally improves mood
        break;
      case 'gratitude':
        activityMood = 'excellent'; // Gratitude practice improves mood
        break;
      case 'break':
        activityMood = 'neutral'; // Taking a break is neutral to positive
        break;
    }
    
    const accountId = selectedAccountId || 'default';
    addMoodEntry(today, activityMood, `wellness-${activityId}`, `activity-${Date.now()}`, new Date(), accountId);

    // Update wellness stats
    setWellnessStats(prev => {
      const newStats = {
        ...prev,
        sessionsToday: prev.sessionsToday + 1,
        wellnessXP: prev.wellnessXP + activity.xpReward,
      };
      localStorage.setItem(STORAGE_KEYS.WELLNESS_STATS, newStats);
      return newStats;
    });

    // Check for "well-being" Daily Focus quests and update progress
    if (selectedAccountId) {
      const dailyFocusQuests = checkDailyFocusProgress(selectedAccountId);
      dailyFocusQuests.forEach(quest => {
        if (quest.description.toLowerCase().includes('well-being')) {
          updateQuestProgress(quest.id, 1);
        }
      });
    }

    // Reset states
    setActiveActivity(null);
    setIsSessionActive(false);
    setSessionTimer(0);
    setBreathingSession(prev => ({ ...prev, isActive: false }));
  };

  const handleMoodChange = (newMood: MoodType) => {
    const oldMood = currentMood;
    setCurrentMood(newMood);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.WELLNESS_MOOD, newMood);
    
    // Add activity log entry
    addActivity({
      type: 'wellness',
      title: 'Mood Updated',
      description: `Changed mood from ${oldMood} to ${newMood}`,
      xpEarned: 5, // Small XP reward for mood tracking
      accountId: selectedAccountId || 'default',
    });

    // Add to mood timeline
    const today = new Date().toISOString().split('T')[0];
    const accountId = selectedAccountId || 'default';
    addMoodEntry(today, newMood, 'wellness-mood', `wellness-${Date.now()}`, new Date(), accountId);

    // Update wellness stats
    setWellnessStats(prev => {
      const newStats = {
        ...prev,
        wellnessXP: prev.wellnessXP + 5,
      };
      localStorage.setItem(STORAGE_KEYS.WELLNESS_STATS, newStats);
      return newStats;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTiltColor = (level: TiltAlert['level']) => {
    switch (level) {
      case 'low': return 'border-yellow-500/50 bg-yellow-500/10';
      case 'medium': return 'border-orange-500/50 bg-orange-500/10';
      case 'high': return 'border-red-500/50 bg-red-500/10';
      case 'critical': return 'border-red-600/50 bg-red-600/10 animate-pulse';
    }
  };

  const getTiltIcon = (level: TiltAlert['level']) => {
    switch (level) {
      case 'low': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'medium': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'high': return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'critical': return <TrendingDown className="w-5 h-5 text-red-600" />;
    }
  };

  const moodOptions: { value: MoodType; emoji: string; label: string }[] = [
    { value: 'excellent', emoji: '🤩', label: 'Excellent' },
    { value: 'good', emoji: '😊', label: 'Good' },
    { value: 'neutral', emoji: '😐', label: 'Neutral' },
    { value: 'poor', emoji: '😕', label: 'Poor' },
    { value: 'terrible', emoji: '😢', label: 'Terrible' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Wellness Center</h1>
        <p className="text-muted-foreground">
          Stay centered and maintain peak trading performance
        </p>
      </div>

      {/* Tilt Detection Alert */}
      <AnimatePresence>
        {tiltDetection && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              'border rounded-xl p-4',
              getTiltColor(tiltDetection.level)
            )}
          >
            <div className="flex items-start gap-3">
              {getTiltIcon(tiltDetection.level)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-foreground">Tilt Detection</h3>
                  <span className="text-xs text-muted-foreground">
                    {tiltDetection.confidence}% confidence
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {tiltDetection.message}
                </p>
                <div className="space-y-1">
                  {tiltDetection.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Target className="w-3 h-3 text-primary" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setTiltDetection(null)}
                className="p-1 rounded hover:bg-muted/50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Mood */}
      <div className="bg-muted/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Smile className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Current Mood</h2>
        </div>
        <div className="flex gap-3">
          {moodOptions.map((mood) => (
            <motion.button
              key={mood.value}
              onClick={() => handleMoodChange(mood.value)}
              className={cn(
                'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                currentMood === mood.value
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : 'bg-muted/50 hover:bg-muted/70 text-muted-foreground'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl">{mood.emoji}</span>
              <span className="text-xs font-medium">{mood.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Active Session */}
      <AnimatePresence>
        {activeActivity && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 rounded-xl p-6"
          >
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="p-3 bg-primary/20 rounded-full">
                  {React.createElement(
                    wellnessActivities.find(a => a.id === activeActivity)?.icon || Heart,
                    { className: "w-6 h-6 text-primary" }
                  )}
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {wellnessActivities.find(a => a.id === activeActivity)?.title}
                </h3>
              </div>

              <div className="text-3xl font-bold text-primary">
                {formatTime(sessionTimer)}
              </div>

              {activeActivity === 'breathwork' && breathingSession.isActive && (
                <div className="space-y-4">
                  <div className="text-lg text-muted-foreground capitalize">
                    {breathingSession.phase}
                  </div>
                  <div className="w-32 h-32 mx-auto">
                    <motion.div
                      className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center"
                      animate={{
                        scale: breathingSession.phase === 'inhale' || breathingSession.phase === 'hold' ? 1.2 : 0.8
                      }}
                      transition={{
                        duration: 4,
                        ease: "easeInOut"
                      }}
                    >
                      <span className="text-white font-bold">
                        {breathingSession.cycleCount + 1}/{breathingSession.totalCycles}
                      </span>
                    </motion.div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <motion.button
                  onClick={() => setIsSessionActive(!isSessionActive)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSessionActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isSessionActive ? 'Pause' : 'Resume'}
                </motion.button>
                <motion.button
                  onClick={() => completeActivity(activeActivity)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wellness Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wellnessActivities.map((activity) => (
          <motion.div
            key={activity.id}
            className="bg-muted/30 border border-border rounded-xl p-6 hover:bg-muted/50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-3 rounded-full', activity.color)}>
                  <activity.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{activity.title}</h3>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {activity.duration} min
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-4 h-4" />
                  +{activity.xpReward} XP
                </div>
              </div>

              <button
                onClick={() => startActivity(activity.id)}
                disabled={!!activeActivity}
                className="w-full px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-xl transition-colors"
              >
                Start Session
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Daily Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{wellnessStats.sessionsToday}</div>
          <div className="text-sm text-muted-foreground">Sessions Today</div>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-500">+{wellnessStats.wellnessXP}</div>
          <div className="text-sm text-muted-foreground">Wellness XP</div>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-foreground">{wellnessStats.streakDays}</div>
          <div className="text-sm text-muted-foreground">Streak Days</div>
        </div>
        <div className="bg-muted/30 rounded-xl p-4 text-center">
          <div className={cn('text-2xl font-bold', getMoodColor(currentMood))}>
            {getMoodEmoji(currentMood)}
          </div>
          <div className="text-sm text-muted-foreground">Current Mood</div>
        </div>
      </div>
    </div>
  );
}; 