import { motion } from 'framer-motion';
import { XCircle, ArrowLeft } from 'lucide-react';

export const SubscriptionCanceled = () => {

  return (
    <div className="min-h-screen bg-[var(--background-primary)] text-[var(--text-primary)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        {/* Cancel Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="inline-flex items-center justify-center w-20 h-20 bg-orange-500/20 rounded-full mb-6"
        >
          <XCircle className="w-12 h-12 text-orange-500" />
        </motion.div>

        {/* Cancel Message */}
        <h1 className="text-3xl font-bold mb-4">
          Checkout Canceled
        </h1>
        <p className="text-lg text-[var(--text-secondary)] mb-8">
          No worries! Your subscription wasn't created. You can try again anytime.
        </p>

        {/* Why Subscribe Box */}
        <div className="bg-[var(--background-secondary)] rounded-xl p-6 mb-8 text-left">
          <h2 className="font-semibold mb-4 text-[var(--text-primary)]">
            Why subscribe to TradZen?
          </h2>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li>🧠 AI-powered insights on your trading psychology</li>
            <li>📊 Advanced analytics and custom reports</li>
            <li>🎯 Habit tracking to build discipline</li>
            <li>💬 AI Coach for personalized guidance</li>
            <li>🎁 7-day free trial - cancel anytime</li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/?view=pricing'}
            className="w-full py-3 px-6 bg-[var(--accent-color)] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            View Pricing Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 px-6 bg-[var(--background-secondary)] text-[var(--text-primary)] rounded-xl font-medium hover:bg-[var(--background-tertiary)] transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};

