import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelUpToastProps {
  isVisible: boolean;
  level: number;
  onClose: () => void;
  duration?: number;
}

// Particle component for floating animations
const Particle: React.FC<{ delay: number; duration: number }> = ({ delay, duration }) => (
  <motion.div
    className="absolute w-2 h-2 bg-yellow-300 rounded-full"
    initial={{ 
      opacity: 0,
      scale: 0,
      x: Math.random() * 400 - 200,
      y: Math.random() * 300 - 150
    }}
    animate={{ 
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      y: [0, -100, -200],
      rotate: [0, 180, 360]
    }}
    transition={{ 
      duration,
      delay,
      ease: "easeOut"
    }}
  />
);

export const LevelUpToast: React.FC<LevelUpToastProps> = ({
  isVisible,
  level,
  onClose,
  duration = 4000
}) => {
  const [showFullScreen, setShowFullScreen] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Show full screen animation first
      setShowFullScreen(true);
      
      // Hide full screen after 2 seconds, show toast for remaining time
      const fullScreenTimer = setTimeout(() => {
        setShowFullScreen(false);
      }, 2000);

      // Close everything after full duration
      const closeTimer = setTimeout(onClose, duration);
      
      return () => {
        clearTimeout(fullScreenTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Full Screen Level Up Animation */}
          {showFullScreen && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Particles */}
              {Array.from({ length: 20 }).map((_, i) => (
                <Particle key={i} delay={i * 0.1} duration={2} />
              ))}

              {/* Main Level Up Content */}
              <div className="text-center">
                {/* Level Up Text */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2
                  }}
                >
                  <div className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-4">
                    LEVEL UP!
                  </div>
                </motion.div>

                {/* Level Number with Glow Effect */}
                <motion.div
                  className="relative"
                  initial={{ scale: 0, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                    delay: 0.5
                  }}
                >
                  <div className="text-8xl md:text-9xl font-black text-white mb-6 relative">
                    <motion.div
                      className="absolute inset-0 text-8xl md:text-9xl font-black bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent blur-sm"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        opacity: [0.8, 1, 0.8]
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {level}
                    </motion.div>
                    <div className="relative z-10">{level}</div>
                  </div>
                </motion.div>

                {/* Animated Icons */}
                <div className="flex justify-center gap-8 mb-6">
                  {[Trophy, Star, Zap, Sparkles].map((Icon, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ 
                        scale: [0, 1.2, 1],
                        rotate: [0, 360, 720]
                      }}
                      transition={{ 
                        delay: 0.8 + i * 0.1,
                        duration: 0.8,
                        ease: "easeOut"
                      }}
                    >
                      <Icon className="w-12 h-12 text-yellow-400" />
                    </motion.div>
                  ))}
                </div>

                {/* Congratulations Text */}
                <motion.div
                  className="text-xl md:text-2xl text-white/90 font-medium"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                >
                  Outstanding progress! Keep crushing it! 🚀
                </motion.div>

                {/* Expanding Ring Effect */}
                <motion.div
                  className="absolute inset-0 border-4 border-yellow-400/30 rounded-full"
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 2, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}

          {/* Compact Toast (shows after full screen) */}
          {!showFullScreen && (
            <motion.div
              className="fixed top-4 right-4 z-50"
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 25 
              }}
            >
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-4 rounded-2xl shadow-2xl border border-yellow-300/20 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 0.6,
                      ease: "easeInOut",
                      repeat: 2
                    }}
                  >
                    <Trophy className="w-6 h-6" />
                  </motion.div>
                  
                  <div className="flex-1">
                    <div className="font-bold text-lg">
                      Level {level} achieved!
                    </div>
                    <div className="text-sm opacity-90">
                      Great progress, keep it up! 🎉
                    </div>
                  </div>
                  
                  <motion.div
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ 
                      duration: 1,
                      ease: "easeInOut",
                      repeat: 1
                    }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                </div>
                
                {/* Animated progress bar */}
                <motion.div
                  className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                >
                  <motion.div
                    className="h-full bg-white/60 rounded-full"
                    initial={{ width: '100%' }}
                    animate={{ width: 0 }}
                    transition={{ duration: (duration - 2000) / 1000, ease: "linear" }}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
