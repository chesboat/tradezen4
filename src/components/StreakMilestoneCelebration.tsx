import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import type { MilestoneCelebration } from '@/lib/streakMilestones';

interface StreakMilestoneCelebrationProps {
  milestone: MilestoneCelebration | null;
  onDismiss: () => void;
}

/**
 * Apple-style celebration for streak milestones
 * Brief, beautiful, and delightful - no over-explaining
 */
export const StreakMilestoneCelebration: React.FC<StreakMilestoneCelebrationProps> = ({
  milestone,
  onDismiss,
}) => {
  useEffect(() => {
    if (milestone) {
      // Auto-dismiss after 4 seconds
      const timer = setTimeout(onDismiss, 4000);
      return () => clearTimeout(timer);
    }
  }, [milestone, onDismiss]);

  return (
    <AnimatePresence>
      {milestone && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-sm"
            onClick={onDismiss}
          />
          
          {/* Celebration Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: {
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.9,
              transition: { duration: 0.2 }
            }}
            className="fixed top-1/3 left-1/2 -translate-x-1/2 z-[201] pointer-events-none"
          >
            <div className="relative">
              {/* Glow effect */}
              <motion.div
                animate={{
                  opacity: [0.5, 0.8, 0.5],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 rounded-3xl blur-2xl"
                style={{
                  background: `radial-gradient(circle, ${milestone.glowColor}, transparent)`,
                }}
              />
              
              {/* Card */}
              <div className="relative bg-background/95 backdrop-blur-xl border-2 border-border rounded-3xl p-8 shadow-2xl min-w-[320px] text-center">
                {/* Emoji/Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: 1,
                    rotate: [0, -10, 10, -5, 5, 0],
                  }}
                  transition={{
                    scale: { 
                      type: 'spring',
                      stiffness: 300,
                      damping: 15,
                      delay: 0.1,
                    },
                    rotate: {
                      duration: 0.5,
                      delay: 0.3,
                    }
                  }}
                  className="mb-4"
                >
                  <div 
                    className={`inline-flex w-20 h-20 rounded-2xl bg-gradient-to-br ${milestone.color} items-center justify-center text-4xl shadow-xl`}
                    style={{
                      boxShadow: `0 0 30px ${milestone.glowColor}`,
                    }}
                  >
                    {milestone.emoji === '🔥' ? (
                      <Flame className="w-10 h-10 text-white fill-white" />
                    ) : (
                      <span>{milestone.emoji}</span>
                    )}
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`text-2xl font-bold mb-2 bg-gradient-to-r ${milestone.color} bg-clip-text text-transparent`}
                >
                  {milestone.title}
                </motion.h2>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-muted-foreground"
                >
                  {milestone.message}
                </motion.p>

                {/* Streak count */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full"
                >
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium">
                    {milestone.streak} day streak
                  </span>
                </motion.div>

                {/* Tap to dismiss hint */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="mt-4 text-xs text-muted-foreground/60"
                >
                  Tap anywhere to continue
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

