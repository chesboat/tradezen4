/**
 * Daily Discipline Onboarding
 * Apple WWDC-style presentation for the dual-system approach
 * Premium feel matching Trading Health onboarding
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, BookOpen, Target, Shield, Zap, Sparkles, Flame } from 'lucide-react';

interface DailyDisciplineOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

interface OnboardingScreen {
  title: string;
  subtitle: string;
  description: string;
  visual: React.ReactNode;
  accentColor: string;
}

const screens: OnboardingScreen[] = [
  // Screen 1: Introduction - The Philosophy
  {
    title: 'Two Systems, One Goal',
    subtitle: 'Daily habits meet long-term tracking',
    description: 'Close rings daily. Track performance over time. Win consistently. Apple Watch meets professional trading.',
    accentColor: 'from-green-500 via-red-500 to-blue-500',
    visual: (
      <div className="relative w-full h-64 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-red-500/10 to-blue-500/10 rounded-3xl blur-3xl" />
        
        {/* Left side: Daily Discipline Rings (small) */}
        <motion.div
          className="absolute left-12"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {[
                { color: '#9EFF91', icon: BookOpen },
                { color: '#FF375F', icon: Target },
                { color: '#0AFFFE', icon: Shield }
              ].map((ring, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="relative"
                >
                  <svg width="50" height="50" className="transform -rotate-90">
                    <circle
                      cx="25"
                      cy="25"
                      r="20"
                      fill="none"
                      stroke={`${ring.color}33`}
                      strokeWidth="4"
                    />
                    <motion.circle
                      cx="25"
                      cy="25"
                      r="20"
                      fill="none"
                      stroke={ring.color}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="125.66"
                      initial={{ strokeDashoffset: 125.66 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{ delay: 0.8 + i * 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </svg>
                  <ring.icon className="absolute inset-0 m-auto w-4 h-4 text-foreground" />
                </motion.div>
              ))}
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-xs font-medium text-muted-foreground"
            >
              Daily Focus
            </motion.p>
          </div>
        </motion.div>

        {/* Center: Plus sign */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.4 }}
          className="text-4xl font-light text-muted-foreground"
        >
          +
        </motion.div>

        {/* Right side: Trading Health Rings (large) */}
        <motion.div
          className="absolute right-12"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col items-center gap-2">
            <svg width="140" height="140" viewBox="0 0 140 140" className="transform -rotate-90">
              {/* Three concentric rings */}
              {[
                { r: 60, color: '#FF375F', delay: 0.6 },
                { r: 48, color: '#7AFF45', delay: 0.7 },
                { r: 36, color: '#0AFFFE', delay: 0.8 }
              ].map((ring, i) => (
                <React.Fragment key={i}>
                  <circle
                    cx="70"
                    cy="70"
                    r={ring.r}
                    fill="none"
                    stroke={`${ring.color}33`}
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="70"
                    cy="70"
                    r={ring.r}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * ring.r}
                    initial={{ strokeDashoffset: 2 * Math.PI * ring.r }}
                    animate={{ strokeDashoffset: 2 * Math.PI * ring.r * 0.3 }}
                    transition={{ delay: ring.delay, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                </React.Fragment>
              ))}
            </svg>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-xs font-medium text-muted-foreground"
            >
              Long-term Tracker
            </motion.p>
          </div>
        </motion.div>
      </div>
    ),
  },

  // Screen 2: Daily Discipline Rings
  {
    title: 'Daily Discipline',
    subtitle: 'Three rings. Close every day.',
    description: 'Simple, achievable habits that compound into mastery. Build your streak.',
    accentColor: 'from-green-500 to-lime-500',
    visual: (
      <div className="relative w-full h-64 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-red-500/5 to-blue-500/5 rounded-3xl" />
        
        <div className="flex gap-8">
          {[
            { icon: BookOpen, color: '#9EFF91', label: 'Journal', emoji: '📝' },
            { icon: Target, color: '#FF375F', label: 'Rules', emoji: '🎯' },
            { icon: Shield, color: '#0AFFFE', label: 'Discipline', emoji: '⚖️' }
          ].map((ring, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative">
                <svg width="80" height="80" className="transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="none"
                    stroke={`${ring.color}33`}
                    strokeWidth="5"
                  />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="none"
                    stroke={ring.color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray="201.06"
                    initial={{ strokeDashoffset: 201.06 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ delay: 0.6 + i * 0.15, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      filter: `drop-shadow(0 0 12px ${ring.color}88)`
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                  {ring.emoji}
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{ring.label}</p>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.2 + i * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                  className="mt-1 w-6 h-6 mx-auto rounded-full bg-green-500 flex items-center justify-center"
                >
                  <motion.svg
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 1.3 + i * 0.1, duration: 0.3 }}
                    className="w-4 h-4 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <motion.path d="M5 13l4 4L19 7" />
                  </motion.svg>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Streak indicator */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.6 }}
          className="absolute bottom-0 flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-full border border-orange-500/20"
        >
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-orange-500">Build your streak</span>
        </motion.div>
      </div>
    ),
  },

  // Screen 3: Journal Ring Detail
  {
    title: 'Journal Ring',
    subtitle: 'Capture today\'s lessons',
    description: 'Write reflections, market observations, and trading insights. Self-awareness is your edge.',
    accentColor: 'from-green-400 to-emerald-500',
    visual: (
      <div className="relative w-full h-64 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl blur-2xl" />
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <svg width="200" height="200" className="transform -rotate-90">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="rgba(158, 255, 145, 0.2)"
              strokeWidth="16"
            />
            <motion.circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="#9EFF91"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray="502.65"
              initial={{ strokeDashoffset: 502.65 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ delay: 0.5, duration: 2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                filter: 'drop-shadow(0 0 20px rgba(158, 255, 145, 0.6))'
              }}
            />
          </svg>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>
        </motion.div>

        {/* Completion checkmark */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 2, type: 'spring', stiffness: 300, damping: 20 }}
          className="absolute top-8 right-12 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-2xl"
        >
          <motion.svg
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 2.2, duration: 0.4 }}
            className="w-7 h-7 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <motion.path d="M5 13l4 4L19 7" />
          </motion.svg>
        </motion.div>
      </div>
    ),
  },

  // Screen 4: Rules + Discipline Rings
  {
    title: 'Rules & Discipline',
    subtitle: 'Follow your process. Stay disciplined.',
    description: 'The system tracks 8 automatic trading rules. No setup required. Just trade and the rings update in real-time.',
    accentColor: 'from-red-500 to-cyan-500',
    visual: (
      <div className="relative w-full h-64 flex items-center justify-center gap-12">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-cyan-500/5 rounded-3xl" />
        
        {/* Rules Ring (Red) */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col items-center gap-3"
        >
          <svg width="140" height="140" className="transform -rotate-90">
            <circle
              cx="70"
              cy="70"
              r="56"
              fill="none"
              stroke="rgba(255, 55, 95, 0.2)"
              strokeWidth="12"
            />
            <motion.circle
              cx="70"
              cy="70"
              r="56"
              fill="none"
              stroke="#FF375F"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="351.86"
              initial={{ strokeDashoffset: 351.86 }}
              animate={{ strokeDashoffset: 351.86 * 0.2 }}
              transition={{ delay: 0.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                filter: 'drop-shadow(0 0 16px rgba(255, 55, 95, 0.5))'
              }}
            />
          </svg>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="absolute top-12 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center"
          >
            <Target className="w-6 h-6 text-red-500" />
          </motion.div>
          <p className="text-sm font-semibold text-foreground">Rules</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-xs text-muted-foreground"
          >
            80% adherence
          </motion.p>
        </motion.div>

        {/* Discipline Ring (Cyan) */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col items-center gap-3"
        >
          <svg width="140" height="140" className="transform -rotate-90">
            <circle
              cx="70"
              cy="70"
              r="56"
              fill="none"
              stroke="rgba(10, 255, 254, 0.2)"
              strokeWidth="12"
            />
            <motion.circle
              cx="70"
              cy="70"
              r="56"
              fill="none"
              stroke="#0AFFFE"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray="351.86"
              initial={{ strokeDashoffset: 351.86 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ delay: 0.7, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              style={{
                filter: 'drop-shadow(0 0 16px rgba(10, 255, 254, 0.5))'
              }}
            />
          </svg>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="absolute top-12 w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center"
          >
            <Shield className="w-6 h-6 text-cyan-500" />
          </motion.div>
          <p className="text-sm font-semibold text-foreground">Discipline</p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-xs text-muted-foreground"
          >
            No violations
          </motion.p>
        </motion.div>
      </div>
    ),
  },

  // Screen 5: Trading Health (Long-term)
  {
    title: 'Trading Health',
    subtitle: 'Your 30-day performance tracker',
    description: 'Watch your Edge, Consistency, and Risk Control improve as you follow your daily discipline. Check weekly, adjust monthly.',
    accentColor: 'from-orange-500 via-lime-500 to-cyan-500',
    visual: (
      <div className="relative w-full h-64 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-lime-500/5 to-cyan-500/5 rounded-3xl blur-2xl" />
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <svg width="240" height="240" viewBox="0 0 240 240" className="transform -rotate-90">
            {/* Three concentric rings with different progress */}
            {[
              { r: 100, color: '#FF375F', progress: 0.65, label: 'Edge' },
              { r: 80, color: '#7AFF45', progress: 0.85, label: 'Consistency' },
              { r: 60, color: '#0AFFFE', progress: 1.0, label: 'Risk Control' }
            ].map((ring, i) => (
              <React.Fragment key={i}>
                <circle
                  cx="120"
                  cy="120"
                  r={ring.r}
                  fill="none"
                  stroke={`${ring.color}22`}
                  strokeWidth="14"
                />
                <motion.circle
                  cx="120"
                  cy="120"
                  r={ring.r}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * ring.r}
                  initial={{ strokeDashoffset: 2 * Math.PI * ring.r }}
                  animate={{ strokeDashoffset: 2 * Math.PI * ring.r * (1 - ring.progress) }}
                  transition={{ delay: 0.5 + i * 0.2, duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    filter: `drop-shadow(0 0 12px ${ring.color}88)`
                  }}
                />
              </React.Fragment>
            ))}
          </svg>

          {/* Center icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.5, type: 'spring', stiffness: 200, damping: 15 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-orange-500/20 flex items-center justify-center">
              <Zap className="w-10 h-10 text-primary" />
            </div>
          </motion.div>
        </motion.div>

        {/* 30d label */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="absolute bottom-2 px-4 py-2 bg-primary/20 backdrop-blur-sm rounded-full border border-primary/30 shadow-lg"
        >
          <span className="text-sm font-bold text-foreground">30-day rolling average</span>
        </motion.div>
      </div>
    ),
  },

  // Screen 6: How They Work Together
  {
    title: 'Daily → Weekly → Monthly',
    subtitle: 'Small actions compound into mastery',
    description: 'Close your rings daily. Build your streak. Check Trading Health weekly. Adjust strategy monthly. Win consistently.',
    accentColor: 'from-primary to-orange-500',
    visual: (
      <div className="relative w-full h-64 flex flex-col items-center justify-center gap-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-orange-500/5 rounded-3xl" />
        
        {/* Flow diagram */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-col items-center gap-3"
        >
          {/* Daily */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1">
              {['#9EFF91', '#FF375F', '#0AFFFE'].map((color, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <svg width="40" height="40" className="transform -rotate-90">
                    <circle cx="20" cy="20" r="16" fill="none" stroke={`${color}33`} strokeWidth="4" />
                    <motion.circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke={color}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="100.53"
                      initial={{ strokeDashoffset: 100.53 }}
                      animate={{ strokeDashoffset: 0 }}
                      transition={{ delay: 0.7 + i * 0.1, duration: 0.8 }}
                    />
                  </svg>
                </motion.div>
              ))}
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="text-sm font-semibold text-foreground"
            >
              Daily: Close rings
            </motion.p>
          </div>

          {/* Arrow */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 1.4, duration: 0.4 }}
            className="w-px h-8 bg-gradient-to-b from-muted-foreground/50 to-transparent"
          />

          {/* Weekly */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.6 }}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20"
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Weekly: Check Trading Health</span>
          </motion.div>

          {/* Arrow */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 1.8, duration: 0.4 }}
            className="w-px h-8 bg-gradient-to-b from-muted-foreground/50 to-transparent"
          />

          {/* Result */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 2, type: 'spring', stiffness: 200, damping: 15 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/30"
          >
            <Sparkles className="w-4 h-4 text-green-500" />
            <span className="text-sm font-semibold text-foreground">Win Consistently</span>
          </motion.div>
        </motion.div>
      </div>
    ),
  },
];

export const DailyDisciplineOnboarding: React.FC<DailyDisciplineOnboardingProps> = ({ isOpen, onClose }) => {
  const [currentScreen, setCurrentScreen] = useState(0);

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
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[200] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden"
          >
            {/* Progress bar */}
            <div className="h-1 bg-muted/30">
              <motion.div
                className={`h-full bg-gradient-to-r ${screens[currentScreen].accentColor}`}
                initial={{ width: 0 }}
                animate={{ width: `${((currentScreen + 1) / screens.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex-1">
                <motion.h2
                  key={currentScreen}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl font-bold text-foreground mb-1"
                >
                  {screens[currentScreen].title}
                </motion.h2>
                <motion.p
                  key={`subtitle-${currentScreen}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-muted-foreground"
                >
                  {screens[currentScreen].subtitle}
                </motion.p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted/50 transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentScreen}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-6"
                >
                  {/* Visual */}
                  <div className="relative w-full">
                    {screens[currentScreen].visual}
                  </div>

                  {/* Description */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center text-base text-muted-foreground leading-relaxed max-w-xl mx-auto"
                  >
                    {screens[currentScreen].description}
                  </motion.p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-border/50 bg-muted/5">
              <button
                onClick={handlePrevious}
                disabled={currentScreen === 0}
                className={cn(
                  'px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2',
                  currentScreen === 0
                    ? 'opacity-0 pointer-events-none'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
                      'h-2 rounded-full transition-all duration-300',
                      index === currentScreen
                        ? 'w-8 bg-gradient-to-r ' + screens[currentScreen].accentColor
                        : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    )}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className={cn(
                  'px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg',
                  'bg-gradient-to-r',
                  screens[currentScreen].accentColor,
                  'text-white hover:shadow-xl hover:scale-105'
                )}
              >
                {currentScreen === screens.length - 1 ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Start Trading
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
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