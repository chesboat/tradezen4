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
import { BookOpen, Target, Shield, Check, Flame, X } from 'lucide-react';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useActivityLogStore } from '@/store/useActivityLogStore';
import { UNIVERSAL_RULES } from '@/lib/tradingHealth/ruleEngine';
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
  const [hoveredRing, setHoveredRing] = useState<string | null>(null);

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
        UNIVERSAL_RULES.forEach(rule => {
          totalRules++;
          if (rule.check(trade, trades)) {
            rulesFollowed++;
          }
        });
      });
    }

    const ruleAdherenceRate = totalRules > 0 ? (rulesFollowed / totalRules) * 100 : 0;
    // Only complete if you HAVE trades AND followed 80%+ of rules
    const followedRules = todayTrades.length > 0 && ruleAdherenceRate >= 80;

    // Discipline Ring: No critical rule violations today
    const hasCriticalViolations = todayTrades.some(trade => {
      // Check for critical violations: risk not set, position size too large, revenge trading
      const riskAmountRule = UNIVERSAL_RULES.find(r => r.id === 'risk-amount-set');
      const positionSizeRule = UNIVERSAL_RULES.find(r => r.id === 'position-size-consistent');
      const revengeRule = UNIVERSAL_RULES.find(r => r.id === 'no-revenge-trading');

      return (
        (riskAmountRule && !riskAmountRule.check(trade, trades)) ||
        (positionSizeRule && !positionSizeRule.check(trade, trades)) ||
        (revengeRule && !revengeRule.check(trade, trades))
      );
    });
    // Only complete if you HAVE trades AND no violations
    const noDisciplineViolations = todayTrades.length > 0 && !hasCriticalViolations;

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
          <div key={ring.id} className="flex flex-col items-center gap-2 relative">
            {/* Ring */}
            <motion.div
              className="relative cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={(e) => {
                console.log('[Ring Tooltip] Mouse enter:', ring.id);
                setHoveredRing(ring.id);
              }}
              onMouseLeave={() => {
                console.log('[Ring Tooltip] Mouse leave');
                setHoveredRing(null);
              }}
              onClick={() => {
                setHoveredRing(hoveredRing === ring.id ? null : ring.id);
              }}
              id={`ring-${ring.id}`}
            >

            {/* Apple-style Tooltip - Positioned relative to ring */}
            <AnimatePresence>
              {hoveredRing === ring.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className={cn(
                    "absolute bottom-full mb-2 z-[100] pointer-events-none",
                    // Smart positioning: last ring aligns right to avoid overflow
                    index === rings.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2"
                  )}
                >
                  <div className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-4 min-w-[280px] max-w-[320px]">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${ring.color}22` }}
                      >
                        <ring.icon className="w-5 h-5" style={{ color: ring.color }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-foreground">{ring.name} Ring</h4>
                        <p className="text-xs text-muted-foreground">{ring.description}</p>
                      </div>
                      {ring.completed && (
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Detailed Status */}
                    <div className="space-y-2 text-xs">
                      {ring.id === 'journal' && (
                        <>
                          {ring.completed ? (
                            <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                              <p className="text-foreground font-medium">✓ Reflection complete</p>
                              <p className="text-muted-foreground mt-1">
                                You wrote today's reflection. Self-awareness is your edge.
                              </p>
                            </div>
                          ) : (
                            <div className="p-2 bg-muted/30 rounded-lg border border-border">
                              <p className="text-foreground font-medium">Write today's reflection</p>
                              <p className="text-muted-foreground mt-1">
                                Capture lessons, insights, and market observations.
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {ring.id === 'rules' && (
                        <>
                          {ring.completed ? (
                            <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                              <p className="text-foreground font-medium">✓ Following your process</p>
                              <p className="text-muted-foreground mt-1">
                                80%+ rule adherence today. Consistency compounds into mastery.
                              </p>
                            </div>
                          ) : (
                            <div className="p-2 bg-muted/30 rounded-lg border border-border">
                              <p className="text-foreground font-medium">Follow 80%+ of your rules</p>
                              <p className="text-muted-foreground mt-1">
                                Stop loss, position sizing, no revenge trading, etc.
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {ring.id === 'discipline' && (
                        <>
                          {ring.completed ? (
                            <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                              <p className="text-foreground font-medium">✓ Discipline maintained</p>
                              <p className="text-muted-foreground mt-1">
                                No critical violations today. Your risk management is intact.
                              </p>
                            </div>
                          ) : (
                            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                              <p className="text-foreground font-medium">⚠️ Critical violation detected</p>
                              <p className="text-muted-foreground mt-1">
                                Review your risk management, stop losses, or emotional control.
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Streak Info */}
                      {currentStreak > 0 && ring.completed && (
                        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="text-muted-foreground">
                            <span className="font-semibold text-orange-500">{currentStreak} day</span> streak
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pointer/Arrow */}
                  <div
                    className={cn(
                      "absolute w-3 h-3 bg-popover/95 border-r border-b border-border/50 rotate-45",
                      index === rings.length - 1 ? "right-4" : "left-1/2 -translate-x-1/2"
                    )}
                    style={{ bottom: '-6px' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
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
