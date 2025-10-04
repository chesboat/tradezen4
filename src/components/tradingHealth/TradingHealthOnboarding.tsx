/**
 * Trading Health Onboarding
 * Apple-style 6-screen explainer for the flagship feature
 * WWDC-worthy presentation
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, Zap, Target, Shield, Sparkles, TrendingUp, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradingHealthOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface OnboardingScreen {
  title: string;
  subtitle: string;
  description: string;
  visual: React.ReactNode;
  accentColor: string;
}

const screens: OnboardingScreen[] = [
  // Screen 1: Introduction
  {
    title: 'Trading Health',
    subtitle: 'Your complete performance in three rings',
    description: 'Close all three rings every day to build a consistently profitable edge. Like Apple Watch for trading.',
    accentColor: '#FF375F',
    visual: (
      <div className="relative w-full h-full flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* Three concentric rings */}
          <svg width="280" height="280" viewBox="0 0 280 280" className="transform -rotate-90">
            {/* Outer ring - Edge */}
            <circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke="rgba(255, 55, 95, 0.2)"
              strokeWidth="12"
            />
            <motion.circle
              cx="140"
              cy="140"
              r="120"
              fill="none"
              stroke="#FF375F"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="753.98"
              initial={{ strokeDashoffset: 753.98 }}
              animate={{ strokeDashoffset: 753.98 * 0.25 }}
              transition={{ delay: 0.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            />
            
            {/* Middle ring - Consistency */}
            <circle
              cx="140"
              cy="140"
              r="95"
              fill="none"
              stroke="rgba(122, 255, 69, 0.2)"
              strokeWidth="12"
            />
            <motion.circle
              cx="140"
              cy="140"
              r="95"
              fill="none"
              stroke="#7AFF45"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="596.90"
              initial={{ strokeDashoffset: 596.90 }}
              animate={{ strokeDashoffset: 596.90 * 0.15 }}
              transition={{ delay: 0.7, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            />
            
            {/* Inner ring - Risk Control */}
            <circle
              cx="140"
              cy="140"
              r="70"
              fill="none"
              stroke="rgba(10, 255, 254, 0.2)"
              strokeWidth="12"
            />
            <motion.circle
              cx="140"
              cy="140"
              r="70"
              fill="none"
              stroke="#0AFFFE"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="439.82"
              initial={{ strokeDashoffset: 439.82 }}
              animate={{ strokeDashoffset: 439.82 * 0.05 }}
              transition={{ delay: 0.9, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="text-center"
            >
              <Sparkles className="w-12 h-12 text-primary mx-auto mb-2" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    ),
  },
  
  // Screen 2: Edge Ring
  {
    title: '💰 Edge Ring',
    subtitle: 'Your profit potential',
    description: 'Based on expectancy - how much you make per trade on average. Positive expectancy = profitable system.',
    accentColor: '#FF375F',
    visual: (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-32 h-32 rounded-full bg-[#FF375F]/10 flex items-center justify-center"
        >
          <Zap className="w-16 h-16" style={{ color: '#FF375F' }} />
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-2 px-6"
        >
          <div className="text-3xl font-bold" style={{ color: '#FF375F' }}>
            $15.40
          </div>
          <div className="text-sm text-muted-foreground">
            Expectancy per trade
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-2 text-green-500"
        >
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">Improving</span>
        </motion.div>
      </div>
    ),
  },
  
  // Screen 3: Consistency Ring
  {
    title: '🎯 Consistency Ring',
    subtitle: 'Following your process',
    description: '8 automatic rules tracked on every trade. No setup required. The more consistent you are, the better your results.',
    accentColor: '#7AFF45',
    visual: (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-32 h-32 rounded-full bg-[#7AFF45]/10 flex items-center justify-center"
        >
          <Target className="w-16 h-16" style={{ color: '#7AFF45' }} />
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-2 px-6"
        >
          <div className="text-3xl font-bold" style={{ color: '#7AFF45' }}>
            7/8
          </div>
          <div className="text-sm text-muted-foreground">
            Rules followed
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-2 px-6 w-full max-w-xs"
        >
          {['✓ Set risk amount', '✓ Added notes', '✗ Minimum R:R'].map((rule, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.9 + i * 0.1 }}
              className={cn(
                'text-xs px-3 py-2 rounded-lg',
                rule.startsWith('✓') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              )}
            >
              {rule}
            </motion.div>
          ))}
        </motion.div>
      </div>
    ),
  },
  
  // Screen 4: Risk Control Ring
  {
    title: '⚠️ Risk Control Ring',
    subtitle: 'Protecting your capital',
    description: 'Based on 30-day drawdown from your peak. Always improvable - every new peak resets the metric.',
    accentColor: '#0AFFFE',
    visual: (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-32 h-32 rounded-full bg-[#0AFFFE]/10 flex items-center justify-center"
        >
          <Shield className="w-16 h-16" style={{ color: '#0AFFFE' }} />
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-2 px-6"
        >
          <div className="text-3xl font-bold" style={{ color: '#0AFFFE' }}>
            4.2%
          </div>
          <div className="text-sm text-muted-foreground">
            Max drawdown (30d)
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center px-6"
        >
          <div className="text-xs text-muted-foreground">
            Peak equity: <span className="font-semibold text-foreground">$12,450</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Current: <span className="font-semibold text-foreground">$11,925</span>
          </div>
        </motion.div>
      </div>
    ),
  },
  
  // Screen 5: 30-Day Window
  {
    title: 'Always Improvable',
    subtitle: '30-day rolling window',
    description: 'Your scores update every day based on the last 30 days. Old mistakes fade away. Recent wins matter most.',
    accentColor: '#007AFF',
    visual: (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="w-full max-w-sm"
        >
          <div className="bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20 rounded-2xl p-6 backdrop-blur-sm border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs text-muted-foreground">30 days ago</div>
              <div className="text-xs font-semibold text-foreground">Today</div>
            </div>
            
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.6, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
              />
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Week 1</span>
                <span className="text-red-500">Bad trades fade</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Week 2-3</span>
                <span className="text-yellow-500">Building better</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Week 4</span>
                <span className="text-green-500">Recent wins count</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    ),
  },
  
  // Screen 6: Streaks & Motivation
  {
    title: 'Build Your Streak',
    subtitle: 'Close all rings consistently',
    description: 'Follow your rules every day. Build a streak. Watch your trading transform from gambling to a professional edge.',
    accentColor: '#FF9500',
    visual: (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <Award className="w-16 h-16 text-white" />
          </div>
          
          {/* Sparkles around */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ delay: 0.8, duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </motion.div>
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-2"
        >
          <div className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            7-Day Streak!
          </div>
          <div className="text-sm text-muted-foreground">
            You're building discipline
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-3"
        >
          {[3, 7, 14, 30, 90].map((days, i) => (
            <motion.div
              key={days}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1 + i * 0.1, type: 'spring', stiffness: 200 }}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold',
                i < 2 ? 'bg-green-500/20 text-green-500' : 'bg-muted text-muted-foreground'
              )}
            >
              {days}
            </motion.div>
          ))}
        </motion.div>
      </div>
    ),
  },
];

export const TradingHealthOnboarding: React.FC<TradingHealthOnboardingProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const isLastScreen = currentScreen === screens.length - 1;
  const screen = screens[currentScreen];

  const handleNext = () => {
    if (isLastScreen) {
      onComplete();
    } else {
      setCurrentScreen(currentScreen + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-background"
        >
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="flex flex-col h-full overflow-hidden">
            {/* Visual Area */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentScreen}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-full max-w-md"
                >
                  {screen.visual}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Text Content */}
            <div className="flex-shrink-0 bg-card/50 backdrop-blur-xl border-t border-border p-6 sm:p-8 space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentScreen}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center max-w-lg mx-auto"
                >
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    {screen.title}
                  </h2>
                  <p className="text-base sm:text-lg font-medium text-muted-foreground mb-4">
                    {screen.subtitle}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {screen.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-2">
                {screens.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentScreen(index)}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      index === currentScreen
                        ? 'w-8 bg-primary'
                        : 'w-2 bg-muted hover:bg-muted-foreground/50'
                    )}
                  />
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-4">
                {!isLastScreen && (
                  <button
                    onClick={handleSkip}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip
                  </button>
                )}
                
                <button
                  onClick={handleNext}
                  className={cn(
                    'flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold transition-all',
                    'bg-primary text-primary-foreground hover:bg-primary/90',
                    'shadow-lg hover:shadow-xl',
                    isLastScreen ? 'ml-auto' : 'ml-auto'
                  )}
                >
                  <span>{isLastScreen ? 'Get Started' : 'Next'}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TradingHealthOnboarding;
