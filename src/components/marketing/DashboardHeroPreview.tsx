/**
 * Dashboard Hero Preview - Marketing Component
 * Apple-quality animated preview with REAL SCREENSHOTS
 * Shows authentic interface with full context (sidebar + main content)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Screenshot configuration - ordered by importance for conversion
// Each screenshot should show: Full sidebar + main content area + aspirational data
const frames = [
  // LIGHT MODE SEQUENCE - Show core value proposition
  { 
    id: 'trading-health', 
    duration: 3500, 
    theme: 'light' as const,
    screenshot: '/images/screenshots/01-trading-health-light.png',
    alt: 'Trading Health Dashboard with daily rings and discipline tracking'
  },
  { 
    id: 'analytics', 
    duration: 3500, 
    theme: 'light' as const,
    screenshot: '/images/screenshots/02-analytics-light.png',
    alt: 'Analytics overview with performance charts and key metrics'
  },
  { 
    id: 'journal', 
    duration: 3500, 
    theme: 'light' as const,
    screenshot: '/images/screenshots/03-journal-light.png',
    alt: 'Trading journal with detailed trade notes and templates'
  },
  
  // THEME TRANSITION
  { 
    id: 'theme-transition', 
    duration: 1200, 
    theme: 'transition' as const,
    screenshot: null,
    alt: 'Theme transition animation'
  },
  
  // DARK MODE SEQUENCE - Show gamification and habit features
  { 
    id: 'calendar', 
    duration: 3500, 
    theme: 'dark' as const,
    screenshot: '/images/screenshots/04-calendar-dark.png',
    alt: 'Calendar view with trading streaks and monthly P&L'
  },
  { 
    id: 'habits', 
    duration: 3500, 
    theme: 'dark' as const,
    screenshot: '/images/screenshots/05-habits-dark.png',
    alt: 'Habit tracking with daily routines and streak building'
  },
  { 
    id: 'wellness', 
    duration: 3500, 
    theme: 'dark' as const,
    screenshot: '/images/screenshots/06-wellness-dark.png',
    alt: 'Wellness tracking for mental and physical health'
  },
  { 
    id: 'quests', 
    duration: 3500, 
    theme: 'dark' as const,
    screenshot: '/images/screenshots/07-quests-dark.png',
    alt: 'Trading quests and challenges with XP rewards'
  },
  { 
    id: 'todo', 
    duration: 3500, 
    theme: 'dark' as const,
    screenshot: '/images/screenshots/08-todo-dark.png',
    alt: 'Todo list with trading tasks and daily routines'
  },
  { 
    id: 'journal-entry', 
    duration: 3500, 
    theme: 'dark' as const,
    screenshot: '/images/screenshots/10-journal-entry-dark.png',
    alt: 'Detailed journal entry with trade analysis and notes'
  },
  { 
    id: 'ai-coach', 
    duration: 3500, 
    theme: 'dark' as const,
    screenshot: '/images/screenshots/09-ai-coach-dark.png',
    alt: 'AI Coach providing personalized trading insights'
  },
];

export const DashboardHeroPreview: React.FC = () => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Intersection observer - only animate when visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );
    const element = document.getElementById('dashboard-preview');
    if (element) observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isVisible || isPaused) return;
    
    const timeout = setTimeout(() => {
      setCurrentFrame((prev) => (prev + 1) % frames.length);
    }, frames[currentFrame].duration);
    
    return () => clearTimeout(timeout);
  }, [currentFrame, isVisible, isPaused]);

  const currentTheme = frames[currentFrame].theme;
  const currentScreenshot = frames[currentFrame].screenshot;

  return (
    <div 
      id="dashboard-preview"
      className="relative max-w-6xl mx-auto"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Browser Chrome */}
      <div className="bg-[#e8e8e8] dark:bg-[#2a2a2a] rounded-t-xl px-4 py-3 flex items-center gap-2 shadow-sm">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 mx-4 px-3 py-1 bg-white dark:bg-[#1a1a1a] rounded-md text-xs text-muted-foreground flex items-center gap-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          refine.trading/dashboard
        </div>
      </div>

      {/* Dashboard Content - REAL SCREENSHOTS */}
      <motion.div
        className={cn(
          'relative rounded-b-xl overflow-hidden shadow-2xl transition-colors duration-800',
          currentTheme === 'dark' ? 'bg-background dark' : 'bg-white'
        )}
        style={{ aspectRatio: '16/9', minHeight: '500px' }}
      >
        <AnimatePresence mode="wait">
          {currentScreenshot ? (
            <motion.div
              key={frames[currentFrame].id}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ 
                duration: 1.0,
                ease: [0.4, 0, 0.2, 1] // Smooth easing with subtle parallax
              }}
              className="absolute inset-0"
            >
              <img
                src={currentScreenshot}
                alt={frames[currentFrame].alt}
                className="w-full h-full object-cover object-top"
                loading="eager"
                onError={(e) => {
                  // Fallback to placeholder if image not found
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-orange-500/10">
                        <div class="text-center space-y-4 p-8">
                          <div class="text-6xl">📸</div>
                          <div class="text-lg font-semibold text-foreground">${frames[currentFrame].alt}</div>
                          <div class="text-sm text-muted-foreground">Screenshot placeholder</div>
                          <div class="text-xs text-muted-foreground font-mono">${currentScreenshot}</div>
                        </div>
                      </div>
                    `;
                  }
                }}
              />
            </motion.div>
          ) : (
            // Theme transition frame
            <motion.div
              key="transition"
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: 'linear-gradient(to bottom, #ffffff, #0a0a0a)'
              }}
            >
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: [0, 1.2, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <Sparkles className="w-16 h-16 text-primary" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {frames.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentFrame(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === currentFrame 
                  ? 'w-8 bg-primary' 
                  : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
              aria-label={`Go to frame ${i + 1}`}
            />
          ))}
        </div>

        {/* Pause Indicator */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 right-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-medium z-10"
            >
              Paused
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Subtle hint text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="text-center text-xs text-muted-foreground mt-4"
      >
        Hover to pause • Click dots to navigate
      </motion.p>
    </div>
  );
};

