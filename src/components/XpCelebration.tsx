import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Award } from 'lucide-react';

interface XpCelebrationProps {
  xpAmount: number;
  onComplete?: () => void;
  message?: string;
  variant?: 'default' | 'big' | 'mega';
}

/**
 * Sleek, Apple-inspired XP celebration notification
 * Designed to give a dopamine hit while maintaining clean aesthetics
 */
export const XpCelebration: React.FC<XpCelebrationProps> = ({
  xpAmount,
  onComplete,
  message,
  variant = 'default'
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after animation
    const duration = variant === 'mega' ? 2500 : variant === 'big' ? 2000 : 1600;
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onComplete?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [variant, onComplete]);

  // Determine celebration intensity based on XP amount
  const intensity = variant === 'mega' ? 'mega' : 
                   variant === 'big' ? 'big' :
                   xpAmount >= 100 ? 'big' : 
                   xpAmount >= 50 ? 'medium' : 'default';

  // Particle count based on intensity
  const particleCount = intensity === 'mega' ? 40 : 
                       intensity === 'big' ? 30 : 
                       intensity === 'medium' ? 20 : 15;

  // Generate particles
  const particles = Array.from({ length: particleCount }).map((_, i) => ({
    id: i,
    x: Math.random() * 100 - 50, // -50 to 50
    y: Math.random() * -100 - 20, // -120 to -20
    rotation: Math.random() * 360,
    delay: Math.random() * 0.3,
    color: [
      '#22c55e', '#10b981', '#3b82f6', '#8b5cf6', 
      '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'
    ][Math.floor(Math.random() * 8)],
    size: Math.random() * 6 + 4
  }));

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          {/* Backdrop blur pulse (subtle) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
          />

          {/* Main XP Badge */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, y: 20 }}
            animate={{ 
              scale: [0.3, 1.15, 1],
              opacity: 1,
              y: 0
            }}
            exit={{ 
              scale: 0.9,
              opacity: 0,
              y: -20
            }}
            transition={{
              duration: 0.5,
              ease: [0.34, 1.56, 0.64, 1], // Bouncy ease
            }}
            className="relative"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-emerald-500/30 rounded-3xl blur-2xl scale-110" />
            
            {/* Main card */}
            <div className="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-2xl border border-green-500/20 overflow-hidden">
              {/* Shimmer effect */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{
                  duration: 1.5,
                  ease: 'easeInOut',
                  delay: 0.2
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{ width: '50%' }}
              />

              <div className="relative px-8 py-6 flex flex-col items-center gap-3">
                {/* Icon */}
                <motion.div
                  initial={{ rotate: -90, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ 
                    delay: 0.2,
                    type: 'spring',
                    stiffness: 200,
                    damping: 15
                  }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg"
                >
                  {intensity === 'mega' ? (
                    <Award className="w-8 h-8 text-white" />
                  ) : intensity === 'big' ? (
                    <TrendingUp className="w-7 h-7 text-white" />
                  ) : (
                    <Sparkles className="w-7 h-7 text-white" />
                  )}
                </motion.div>

                {/* XP Amount */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-baseline gap-2"
                >
                  <span className="text-5xl font-bold bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    +{xpAmount}
                  </span>
                  <span className="text-2xl font-semibold text-muted-foreground">
                    XP
                  </span>
                </motion.div>

                {/* Message */}
                {message && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm font-medium text-muted-foreground"
                  >
                    {message}
                  </motion.p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Confetti particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: '50vw',
                y: '50vh',
                scale: 0,
                rotate: 0,
                opacity: 0
              }}
              animate={{
                x: `calc(50vw + ${particle.x}vw)`,
                y: `calc(50vh + ${particle.y}vh)`,
                scale: 1,
                rotate: particle.rotation,
                opacity: [0, 1, 1, 0]
              }}
              transition={{
                duration: 1.2,
                delay: particle.delay,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              style={{
                position: 'absolute',
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                borderRadius: particle.size < 8 ? '50%' : '2px',
              }}
            />
          ))}

          {/* Circular ripple effect */}
          {intensity !== 'default' && (
            <>
              <motion.div
                initial={{ scale: 0.5, opacity: 0.5 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute w-32 h-32 rounded-full border-4 border-green-500/30"
              />
              <motion.div
                initial={{ scale: 0.5, opacity: 0.5 }}
                animate={{ scale: 3.5, opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
                className="absolute w-32 h-32 rounded-full border-4 border-emerald-500/20"
              />
            </>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};

