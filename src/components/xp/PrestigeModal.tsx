import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Sparkles } from 'lucide-react';
import { PrestigeIcon } from './PrestigeIcon';
import { getPrestigeTheme } from '@/lib/xp/prestige';
import { useUserProfileStore } from '@/store/useUserProfileStore';
import { cn } from '@/lib/utils';

interface PrestigeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrestigeModal: React.FC<PrestigeModalProps> = ({
  isOpen,
  onClose
}) => {
  const { profile, prestige } = useUserProfileStore();
  const [isLoading, setIsLoading] = useState(false);

  if (!profile?.xp.canPrestige) {
    return null;
  }

  const nextPrestige = profile.xp.prestige + 1;
  const nextTheme = getPrestigeTheme(nextPrestige);

  const handlePrestige = async () => {
    setIsLoading(true);
    try {
      await prestige();
      onClose();
    } catch (error) {
      console.error('Failed to prestige:', error);
      // You could add toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div 
              className="relative p-6 text-center"
              style={{
                background: `linear-gradient(135deg, ${nextTheme.colors.gradient.from}20, ${nextTheme.colors.gradient.to}20)`
              }}
            >
              <motion.button
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
                onClick={onClose}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4" />
              </motion.button>

              <motion.div
                className="flex justify-center mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <div className="relative">
                  <PrestigeIcon theme={nextTheme} size="lg" />
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                  </motion.div>
                </div>
              </motion.div>

              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                <Crown className="w-6 h-6 text-yellow-500" />
                Prestige Available
              </h2>
              
              <p className="text-muted-foreground">
                Congratulations! You've reached Level 30.
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="text-center space-y-4">
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-foreground">
                    Prestige to <span style={{ color: nextTheme.colors.border }}>
                      {nextTheme.label}
                    </span>
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Reset to Level 1 and unlock the prestigious {nextTheme.label} status.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <div className="font-medium text-green-600 dark:text-green-400">
                      You Keep
                    </div>
                    <ul className="text-green-700 dark:text-green-300 mt-1 space-y-1">
                      <li>• Lifetime XP</li>
                      <li>• All achievements</li>
                      <li>• Prestige status</li>
                    </ul>
                  </div>
                  
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                    <div className="font-medium text-orange-600 dark:text-orange-400">
                      Resets
                    </div>
                    <ul className="text-orange-700 dark:text-orange-300 mt-1 space-y-1">
                      <li>• Season XP to 0</li>
                      <li>• Level to 1</li>
                      <li>• Progress bar</li>
                    </ul>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
                  <strong>Current Stats:</strong> Level {profile.xp.level} • {profile.xp.seasonXp.toLocaleString()} Season XP • {profile.xp.total.toLocaleString()} Lifetime XP
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <motion.button
                  className="flex-1 py-3 px-4 bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground rounded-xl transition-colors font-medium"
                  onClick={onClose}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  Cancel
                </motion.button>
                
                <motion.button
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all duration-300",
                    "bg-gradient-to-r shadow-lg",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${nextTheme.colors.gradient.from}, ${nextTheme.colors.gradient.to})`,
                    boxShadow: `0 4px 20px ${nextTheme.colors.glow}40`
                  }}
                  onClick={handlePrestige}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ 
                    boxShadow: `0 6px 25px ${nextTheme.colors.glow}60`
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Prestiging...' : `Prestige to ${nextTheme.label}`}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
