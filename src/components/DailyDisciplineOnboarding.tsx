/**
 * Daily Discipline Onboarding
 * 
 * Explains the dual-system approach:
 * 1. Daily Discipline Rings (Apple Watch style - daily habits)
 * 2. Trading Health Rings (Apple Watch app style - long-term performance)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, BookOpen, Target, Shield, Zap } from 'lucide-react';

interface DailyDisciplineOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyDisciplineOnboarding: React.FC<DailyDisciplineOnboardingProps> = ({ isOpen, onClose }) => {
  const [currentScreen, setCurrentScreen] = useState(0);

  const screens = [
    {
      title: 'Two Systems Work Together',
      description: 'Daily habits + Long-term tracking = Consistent profitability',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-500/10 via-red-500/10 to-blue-500/10 rounded-2xl p-6 border border-green-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Daily Discipline</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Simple rings you close <span className="font-semibold text-foreground">every day</span>. Journal, follow rules, stay disciplined. Build your streak.
            </p>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-3xl">+</div>
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-orange-500/10 rounded-2xl p-6 border border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Trading Health</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              30-day performance tracker. Watch your Edge, Consistency, and Risk Control <span className="font-semibold text-foreground">improve over time</span>.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Daily Discipline Rings',
      description: 'Close these 3 rings every day to build consistency',
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full border-4 border-green-500 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Journal Ring</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Write today's reflection. Captures lessons, insights, and market observations.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full border-4 border-red-500 flex items-center justify-center">
                <Target className="w-6 h-6 text-red-500" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Rules Ring</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Follow 80%+ of your 8 trading rules. Stop loss, position sizing, no revenge trading, etc.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full border-4 border-cyan-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-cyan-500" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Discipline Ring</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No critical violations today. Risk management, stop losses, and emotional control intact.
              </p>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Close all 3 daily → Build your streak 🔥</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Trading Health Rings',
      description: '30-day performance tracker (7 days for basic)',
      content: (
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
            <div className="flex-shrink-0 text-3xl">💰</div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Edge Ring (0-80)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your profit potential per trade. Based on expectancy and profit factor.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-500/10 to-lime-500/10 rounded-xl border border-green-500/20">
            <div className="flex-shrink-0 text-3xl">🎯</div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Consistency Ring (0-80)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Following your process. Tracks adherence to 8 automatic trading rules.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/20">
            <div className="flex-shrink-0 text-3xl">⚠️</div>
            <div>
              <h3 className="text-lg font-bold text-foreground mb-1">Risk Control Ring (0-80)</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Protecting your capital. Tracks drawdown, losing streaks, and position sizing.
              </p>
            </div>
          </div>

          <div className="bg-muted/30 rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Watch these improve as you follow your daily discipline</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'How They Work Together',
      description: 'Daily focus → Long-term results',
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-500/5 via-red-500/5 to-blue-500/5 rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">Daily Focus</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Close your 3 Daily Discipline rings every day</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Build your streak (3, 7, 14, 30+ days)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500">✓</span>
                <span>Focus on the process, not the outcome</span>
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-center">
            <ChevronRight className="w-8 h-8 text-muted-foreground" />
          </div>

          <div className="bg-gradient-to-br from-primary/5 to-orange-500/5 rounded-2xl p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Weekly Check</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">↗</span>
                <span>Review your Trading Health rings (30-day view)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">↗</span>
                <span>See if your discipline is paying off</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">↗</span>
                <span>Adjust strategy based on trends</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-4 text-center border border-green-500/20">
            <p className="text-sm font-semibold text-foreground">
              Daily Discipline → Improves Trading Health → Consistent Profits 🎯
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-border/50">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{screens[currentScreen].title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{screens[currentScreen].description}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentScreen}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {screens[currentScreen].content}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-border/50">
              <button
                onClick={handlePrevious}
                disabled={currentScreen === 0}
                className={cn(
                  'px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2',
                  currentScreen === 0
                    ? 'opacity-0 pointer-events-none'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center gap-2">
                {screens.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentScreen(index)}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      index === currentScreen
                        ? 'w-8 bg-primary'
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    )}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                {currentScreen === screens.length - 1 ? 'Get Started' : 'Next'}
                {currentScreen < screens.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Helper function for cn
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
