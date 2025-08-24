import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelUpToastProps {
  isVisible: boolean;
  level: number;
  onClose: () => void;
  duration?: number;
}

export const LevelUpToast: React.FC<LevelUpToastProps> = ({
  isVisible,
  level,
  onClose,
  duration = 3000
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
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
                transition={{ duration: duration / 1000, ease: "linear" }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
