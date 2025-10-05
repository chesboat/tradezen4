/**
 * Daily Discipline Rings
 * 
 * Apple Watch-style daily completion rings
 * Simple, binary, achievable daily habits
 * 
 * 3 Rings:
 * - Journal (Green): Wrote reflection today
 * - Rules (Red): Followed 80%+ of trading rules
 * - Discipline (Blue): No critical violations
 */

import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Target, Shield, Check, Flame } from 'lucide-react';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { UNIVERSAL_TRADING_RULES } from '@/lib/tradingHealth/ruleEngine';
import { cn } from '@/lib/utils';

interface DailyRing {
  id: 'journal' | 'rules' | 'discipline';
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  glowColor: string;
  completed: boolean;
  description: string;
}

interface DailyDisciplineRingsProps {
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  showStreak?: boolean;
  className?: string;
}

export const DailyDisciplineRings: React.FC<DailyDisciplineRingsProps> = ({
  size = 'medium',
  showLabels = true,
  showStreak = true,
  className,
}) => {
  const { reflections } = useDailyReflectionStore();
  const { trades } = useTradeStore();
  const { addActivity } = useActivityLogStore();
  const [previousCompletions, setPreviousCompletions] = useState<Set<string>>(new Set());

  // Get today's date string
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate ring completions for today
  const rings: DailyRing[] = useMemo(() => {
    // Journal Ring: Did user write a reflection today?
    const todayReflection = reflections.find(r => {
      const refDate = typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().split('T')[0];
      return refDate === todayStr;
    });
    const hasJournaled = !!todayReflection && (
      (todayReflection.insights && todayReflection.insights.length > 0) ||
      (todayReflection.quickNotes && todayReflection.quickNotes.length > 0) ||
      todayReflection.keyFocus ||
      todayReflection.lessonsLearned ||
      todayReflection.improvementAreas
    );

    // Rules Ring: Check today's trades for rule adherence
    const todayTrades = trades.filter(t => {
      const tradeDate = new Date(t.entryTime).toISOString().split('T')[0];
      return tradeDate === todayStr;
    });

    let rulesFollowed = 0;
    let totalRules = 0;

    if (todayTrades.length > 0) {
      // Check each rule for each trade
      todayTrades.forEach(trade => {
        UNIVERSAL_TRADING_RULES.forEach(rule => {
          totalRules++;
          if (rule.check(trade, trades)) {
            rulesFollowed++;
          }
        });
      });
    }

    const ruleAdherenceRate = totalRules > 0 ? (rulesFollowed / totalRules) * 100 : 100;
    const followedRules = todayTrades.length === 0 || ruleAdherenceRate >= 80;

    // Discipline Ring: No critical rule violations today
    const hasCriticalViolations = todayTrades.some(trade => {
      // Check for critical violations: risk > 3%, no stop loss, revenge trading
      const riskManagementRule = UNIVERSAL_TRADING_RULES.find(r => r.id === 'risk-management');
      const stopLossRule = UNIVERSAL_TRADING_RULES.find(r => r.id === 'stop-loss-set');
      const revengeRule = UNIVERSAL_TRADING_RULES.find(r => r.id === 'no-revenge-trading');

      return (
        (riskManagementRule && !riskManagementRule.check(trade, trades)) ||
        (stopLossRule && !stopLossRule.check(trade, trades)) ||
        (revengeRule && !revengeRule.check(trade, trades))
      );
    });
    const noDisciplineViolations = !hasCriticalViolations;

    return [
      {
        id: 'journal',
        name: 'Journal',
        icon: BookOpen,
        color: 'rgb(158, 255, 145)', // Apple Watch green
        glowColor: 'rgba(158, 255, 145, 0.4)',
        completed: hasJournaled,
        description: hasJournaled ? 'Reflection complete' : 'Write today\'s reflection',
      },
      {
        id: 'rules',
        name: 'Rules',
        icon: Target,
        color: 'rgb(255, 55, 95)', // Apple Watch red
        glowColor: 'rgba(255, 55, 95, 0.4)',
        completed: followedRules,
        description: followedRules 
          ? `${Math.round(ruleAdherenceRate)}% adherence` 
          : 'Follow your trading rules',
      },
      {
        id: 'discipline',
        name: 'Discipline',
        icon: Shield,
        color: 'rgb(10, 255, 254)', // Apple Watch blue
        glowColor: 'rgba(10, 255, 254, 0.4)',
        completed: noDisciplineViolations,
        description: noDisciplineViolations ? 'No violations today' : 'Critical rule violated',
      },
    ];
  }, [reflections, trades, todayStr]);

  // Log to Activity Log when a ring closes (only once per day per ring)
  useEffect(() => {
    rings.forEach(ring => {
      const ringKey = `${todayStr}-${ring.id}`;
      const wasCompleted = previousCompletions.has(ringKey);
      const isNowCompleted = ring.completed;

      if (!wasCompleted && isNowCompleted) {
        // Ring just closed! Log it
        console.log(`[Daily Discipline] ${ring.name} ring closed!`);
        
        const titles = {
          journal: '📝 Journal Ring Closed',
          rules: '🎯 Rules Ring Closed',
          discipline: '⚖️ Discipline Ring Closed',
        };

        const descriptions = {
          journal: 'Completed your daily reflection. Keep the streak going!',
          rules: 'Followed 80%+ of your trading rules today. Consistency is key.',
          discipline: 'No critical rule violations today. Discipline maintained.',
        };

        addActivity({
          type: 'habit',
          title: titles[ring.id],
          description: descriptions[ring.id],
          priority: 'medium',
          xpEarned: 10,
          metadata: {
            deepLink: '/journal',
          },
        }).catch(err => console.error('Failed to log ring completion:', err));

        // Update previous completions
        setPreviousCompletions(prev => new Set([...prev, ringKey]));
      }
    });
  }, [rings, previousCompletions, todayStr, addActivity]);

  // Calculate current streak (consecutive days with all rings closed)
  const currentStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];

      // Check if all rings were closed on this day
      const dayReflection = reflections.find(r => {
        const refDate = typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().split('T')[0];
        return refDate === dateStr;
      });

      const hasJournaled = !!dayReflection && (
        (dayReflection.insights && dayReflection.insights.length > 0) ||
        (dayReflection.quickNotes && dayReflection.quickNotes.length > 0) ||
        dayReflection.keyFocus
      );

      if (hasJournaled) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }, [reflections]);

  const allComplete = rings.every(r => r.completed);

  // Size configurations
  const sizeConfig = {
    small: {
      ringSize: 60,
      strokeWidth: 4,
      iconSize: 'w-3 h-3',
      spacing: 'gap-2',
      textSize: 'text-xs',
    },
    medium: {
      ringSize: 80,
      strokeWidth: 5,
      iconSize: 'w-4 h-4',
      spacing: 'gap-3',
      textSize: 'text-sm',
    },
    large: {
      ringSize: 100,
      strokeWidth: 6,
      iconSize: 'w-5 h-5',
      spacing: 'gap-4',
      textSize: 'text-base',
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={cn('flex flex-col items-center', className)}>
      {/* Streak Display */}
      {showStreak && currentStreak > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20"
        >
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-orange-500">
            {currentStreak} Day Streak
          </span>
        </motion.div>
      )}

      {/* Rings */}
      <div className={cn('flex items-center justify-center', config.spacing)}>
        {rings.map((ring, index) => (
          <div key={ring.id} className="flex flex-col items-center gap-2">
            {/* Ring */}
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                width={config.ringSize}
                height={config.ringSize}
                className="transform -rotate-90"
              >
                {/* Background circle */}
                <circle
                  cx={config.ringSize / 2}
                  cy={config.ringSize / 2}
                  r={(config.ringSize - config.strokeWidth) / 2}
                  stroke="currentColor"
                  strokeWidth={config.strokeWidth}
                  fill="none"
                  className="text-muted/20"
                />
                
                {/* Progress circle */}
                <motion.circle
                  cx={config.ringSize / 2}
                  cy={config.ringSize / 2}
                  r={(config.ringSize - config.strokeWidth) / 2}
                  stroke={ring.color}
                  strokeWidth={config.strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: ring.completed ? 1 : 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    strokeDasharray: '1 1',
                    filter: ring.completed ? `drop-shadow(0 0 8px ${ring.glowColor})` : 'none',
                  }}
                />
              </svg>

              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <ring.icon
                  className={cn(
                    config.iconSize,
                    ring.completed ? 'text-foreground' : 'text-muted-foreground/50'
                  )}
                />
              </div>

              {/* Check mark when complete */}
              <AnimatePresence>
                {ring.completed && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Label */}
            {showLabels && (
              <div className="text-center">
                <p className={cn('font-medium', config.textSize, ring.completed ? 'text-foreground' : 'text-muted-foreground')}>
                  {ring.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {ring.description}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* All Complete Celebration */}
      <AnimatePresence>
        {allComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 via-red-500/20 to-blue-500/20 border border-green-500/30"
          >
            <p className="text-sm font-semibold text-foreground">
              🎉 All rings closed today!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
