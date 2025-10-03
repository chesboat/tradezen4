import React, { useState, useEffect } from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Apple-style navigation for public share pages
 * Shows a subtle "Back to Journal" button for logged-in users
 * Non-intrusive for public viewers
 */
export const PublicShareNav: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Don't render anything while checking auth or if not logged in
  if (loading || !isLoggedIn) return null;

  const handleBackToJournal = () => {
    window.location.href = '/';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed top-4 left-4 z-50"
      >
        <button
          onClick={handleBackToJournal}
          className="flex items-center gap-2 px-4 py-2 bg-background/80 hover:bg-background border border-border/50 rounded-xl shadow-lg backdrop-blur-sm transition-all hover:scale-105 active:scale-95 group"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="text-sm font-medium text-foreground">Back to Journal</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Alternative: Header bar with branding and navigation
 * Use this for a more prominent header approach
 */
export const PublicShareHeader: React.FC<{ title?: string }> = ({ title }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleBackToJournal = () => {
    window.location.href = '/';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50"
    >
      <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Left: Logo/Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Home className="w-4 h-4 text-white" />
          </div>
          {title && (
            <span className="text-sm font-semibold text-foreground hidden sm:block">
              {title}
            </span>
          )}
        </div>

        {/* Right: Back button (only for logged-in users) */}
        {!loading && isLoggedIn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleBackToJournal}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Journal</span>
            <span className="sm:hidden">Back</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

