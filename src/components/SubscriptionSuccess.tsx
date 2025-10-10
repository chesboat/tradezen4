import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigationStore } from '@/store/useNavigationStore';

export const SubscriptionSuccess = () => {
  const { setCurrentView } = useNavigationStore();
  const sessionId = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('session_id')
    : null;

  useEffect(() => {
    // Trigger confetti celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Log the successful checkout
    if (sessionId) {
      console.log('Checkout session completed:', sessionId);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-500" />
        </motion.div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold mb-4">
          Welcome to TradZen! 🎉
        </h1>
        <p className="text-lg text-[var(--text-secondary)] mb-8">
          Your 7-day free trial has started. You have full access to all premium features!
        </p>

        {/* What's Next */}
        <div className="bg-[var(--background-secondary)] rounded-xl p-6 mb-8 text-left">
          <h2 className="font-semibold mb-4 text-[var(--text-primary)]">
            What's next?
          </h2>
          <ul className="space-y-3 text-sm text-[var(--text-secondary)]">
            <li className="flex items-start gap-3">
              <span className="text-[var(--accent-color)] font-bold">1.</span>
              <span>Start journaling your trades and build your routine</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[var(--accent-color)] font-bold">2.</span>
              <span>Set up your habits and track your discipline</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[var(--accent-color)] font-bold">3.</span>
              <span>Try the AI Coach for personalized insights</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[var(--accent-color)] font-bold">4.</span>
              <span>Your trial lasts 7 days - no charge until then</span>
            </li>
          </ul>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => setCurrentView('dashboard')}
          className="w-full py-3 px-6 bg-[var(--accent-color)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Manage Subscription Link */}
        <button
          onClick={() => setCurrentView('settings')}
          className="mt-4 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Manage subscription settings →
        </button>
      </motion.div>
    </div>
  );
};

