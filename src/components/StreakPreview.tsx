import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { getStreakStyling, getStreakAnimation } from '@/lib/streakStyling';
import { cn } from '@/lib/utils';

/**
 * Temporary dev page to preview all streak tiers side-by-side
 * Use this to tweak the visual progression
 */
export const StreakPreview: React.FC = () => {
  const streakLevels = [
    { streak: 1, label: 'Day 1', description: 'Starting out' },
    { streak: 2, label: 'Day 2', description: 'Second day' },
    { streak: 3, label: 'Day 3', description: 'Small glow appears' },
    { streak: 4, label: 'Day 4', description: 'Building momentum' },
    { streak: 5, label: 'Day 5', description: 'Heating up!' },
    { streak: 6, label: 'Day 6', description: 'Getting hotter' },
    { streak: 7, label: 'Day 7', description: 'Week - Pulse starts' },
    { streak: 10, label: 'Day 10', description: 'Week warrior' },
    { streak: 14, label: 'Day 14', description: 'Red flame - Burning hot!' },
    { streak: 21, label: 'Day 21', description: 'Still burning!' },
    { streak: 30, label: 'Day 30', description: 'Yellow - Very hot!' },
    { streak: 45, label: 'Day 45', description: 'LEGENDARY gold' },
    { streak: 60, label: 'Day 60', description: 'BLUE FLAME - Hottest!' },
    { streak: 90, label: 'Day 90', description: 'ULTRA LEGENDARY' },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-3">
            🔥 Streak Progression Preview
          </h1>
          <p className="text-muted-foreground text-lg">
            Visual progression test - All streak tiers side-by-side
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Compare the differences: color intensity, glow size, and animations
          </p>
        </div>

        {/* Streak Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {streakLevels.map(({ streak, label, description }) => {
            const streakStyle = getStreakStyling(streak, 0);
            const animation = getStreakAnimation(streakStyle.animationType);

            return (
              <div
                key={streak}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-4 hover:border-primary/50 transition-colors"
              >
                {/* Flame Icon */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  {animation ? (
                    <motion.div {...animation}>
                      <Flame
                        className={cn(
                          'w-16 h-16',
                          streakStyle.className,
                          streakStyle.glowClass
                        )}
                      />
                    </motion.div>
                  ) : (
                    <Flame
                      className={cn(
                        'w-16 h-16',
                        streakStyle.className,
                        streakStyle.glowClass
                      )}
                    />
                  )}

                  {/* Background glow effects */}
                  {streakStyle.animationType === 'pulse-soft' && (
                    <motion.div
                      className="absolute inset-0 bg-orange-500/20 rounded-full blur-sm"
                      animate={{ opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  {streakStyle.animationType === 'pulse-strong' && (
                    <motion.div
                      className="absolute inset-0 bg-orange-600/30 rounded-full blur-sm"
                      animate={{ opacity: [0.5, 0.9, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  {streakStyle.animationType === 'shimmer' && (
                    <motion.div
                      className="absolute inset-0 bg-yellow-500/40 rounded-full blur-md"
                      animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.1, 1] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                </div>

                {/* Info */}
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {label}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {description}
                  </div>
                  {streakStyle.badge && (
                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {streakStyle.badge}
                    </div>
                  )}
                </div>

                {/* Technical Details */}
                <div className="mt-2 pt-3 border-t border-border w-full text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Color:</span>
                    <span className="font-mono">
                      {streakStyle.className.includes('cyan') ? 'cyan-400 💙' :
                       streakStyle.className.includes('yellow') ? 'yellow-400 💛' :
                       streakStyle.className.includes('red') ? 'red-500 ❤️' :
                       streakStyle.className.includes('orange-600') ? 'orange-600 🔥' :
                       streakStyle.className.includes('orange-500') ? 'orange-500 🧡' :
                       streakStyle.className.includes('orange-400') ? 'orange-400 🧡' : 'gray'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Glow:</span>
                    <span className="font-mono">
                      {streakStyle.glowClass
                        ? streakStyle.glowClass.match(/\d+px/)?.[0] || 'Yes'
                        : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Animation:</span>
                    <span className="font-mono capitalize">
                      {streakStyle.animationType}
                    </span>
                  </div>
                </div>

                {/* Tooltip Preview */}
                <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-center w-full">
                  "{streakStyle.tooltip}"
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-12 bg-muted/30 border border-border rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            🔥 Flame Temperature Physics - Design Tiers
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            As your streak grows, your flame gets hotter and changes color - just like real fire!
          </p>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold text-foreground mb-2">Days 1-2: Warm-up 🧡</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Orange-400 (cool flame)</li>
                <li>• No glow</li>
                <li>• No animation</li>
                <li>• Just getting started</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-foreground mb-2">Days 3-4: Building Momentum 🧡</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Orange-500 (warming up)</li>
                <li>• 3px glow appears</li>
                <li>• No animation</li>
                <li>• First visual upgrade</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-foreground mb-2">Days 5-6: Heating Up 🔥</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Orange-500 (same color)</li>
                <li>• 5px glow (bigger)</li>
                <li>• No animation</li>
                <li>• Intensity building</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-foreground mb-2">Days 7-13: Week Warrior 🔥</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Orange-600 (hot flame)</li>
                <li>• 6px glow</li>
                <li>• Soft pulse animation</li>
                <li>• First animation milestone</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-foreground mb-2">Days 14-29: Burning Hot ❤️</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Red-500 (very hot!)</li>
                <li>• 8px glow (intense)</li>
                <li>• Strong pulse animation</li>
                <li>• Flame turns red!</li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-foreground mb-2">Days 30-59: LEGENDARY Gold 🏆</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Yellow-400 (extremely hot)</li>
                <li>• 10px glow (epic)</li>
                <li>• Shimmer animation</li>
                <li>• Golden flame achieved!</li>
              </ul>
            </div>
            <div className="md:col-span-2">
              <div className="font-semibold text-foreground mb-2">Days 60+: ULTRA Blue Flame 💙💎</div>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Cyan-400 (HOTTEST possible flame)</li>
                <li>• 12px glow (maximum)</li>
                <li>• Shimmer animation</li>
                <li>• Ultimate achievement - The hottest flame in physics! Ultra rare.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            ← Back to Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

