import { motion } from 'framer-motion';
import { XCircle, ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';

export const SubscriptionCanceled = () => {
  useEffect(() => {
    // Clear post-signup pricing flag on cancel page
    try { sessionStorage.removeItem('show_pricing_after_auth'); } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-900 flex items-center justify-center px-4">
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
          className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6"
        >
          <XCircle className="w-12 h-12 text-orange-600" />
        </motion.div>

        {/* Cancel Message */}
        <h1 className="text-3xl font-bold mb-4 text-gray-900">
          Checkout Canceled
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          No worries! Your subscription wasn't created. You can try again anytime.
        </p>

        {/* Why Subscribe Box */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 text-left shadow-sm">
          <h2 className="font-semibold mb-4 text-gray-900">
            Why subscribe to Refine?
          </h2>
          <ul className="space-y-2 text-sm text-gray-700">
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
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            View Pricing Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 px-6 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};

