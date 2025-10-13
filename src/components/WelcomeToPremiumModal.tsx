import { motion, AnimatePresence } from 'framer-motion';
import { Check, Sparkles, X } from 'lucide-react';

interface WelcomeToPremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  proratedAmount?: number;
  nextBillingAmount?: number;
  nextBillingDate?: string;
  billingPeriod: 'monthly' | 'annual';
}

export const WelcomeToPremiumModal = ({
  isOpen,
  onClose,
  proratedAmount,
  nextBillingAmount,
  nextBillingDate,
  billingPeriod,
}: WelcomeToPremiumModalProps) => {
  const premiumFeatures = [
    'Unlimited AI Coach conversations',
    'Advanced analytics & insights',
    'Unlimited trading accounts',
    'Priority support',
    'All future premium features',
  ];

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-800">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8 text-white">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4"
                >
                  <Sparkles className="w-8 h-8" />
                </motion.div>

                <h2 className="text-3xl font-bold mb-2">
                  Welcome to Premium! 🎉
                </h2>
                <p className="text-white/90 text-lg">
                  You now have access to all premium features
                </p>
              </div>

              {/* Content */}
              <div className="p-8">
                {/* Premium Features */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    What You Get
                  </h3>
                  <div className="space-y-2">
                    {premiumFeatures.map((feature, index) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center gap-3"
                      >
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-600 dark:text-green-400" strokeWidth={3} />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Billing Info */}
                {proratedAmount !== undefined && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Billing Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Charged today (prorated):</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice(proratedAmount)}
                        </span>
                      </div>
                      {nextBillingAmount !== undefined && (
                        <>
                          <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Next billing date:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {formatDate(nextBillingDate)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">
                              Next {billingPeriod === 'annual' ? 'annual' : 'monthly'} charge:
                            </span>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatPrice(nextBillingAmount)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg"
                >
                  Start Exploring Premium
                </button>

                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Manage your subscription anytime in Settings
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

