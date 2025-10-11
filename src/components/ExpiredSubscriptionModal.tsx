import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Crown, CreditCard, Clock, X } from 'lucide-react';
import { useNavigationStore } from '@/store/useNavigationStore';
import { useAuth } from '@/contexts/AuthContext';

interface ExpiredSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpiredSubscriptionModal: React.FC<ExpiredSubscriptionModalProps> = ({ isOpen, onClose }) => {
  const { setCurrentView } = useNavigationStore();
  const { logout } = useAuth();

  const handleReactivate = () => {
    onClose();
    setCurrentView('pricing');
  };

  const handleLogout = async () => {
    await logout();
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative p-6 pb-4">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
                
                <div className="flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-orange-500" />
                  </div>
                  
                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Subscription Expired
                  </h2>
                  
                  {/* Subtitle */}
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Your access to Refine has ended
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 pb-6 space-y-4">
                {/* Warning Message */}
                <div className="p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                        Your data is safe — for now
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        We'll keep your journal, trades, and analytics for <strong>30 days</strong>. 
                        After that, your data will be permanently deleted.
                      </p>
                    </div>
                  </div>
                </div>

                {/* What You'll Get Back */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">
                    Reactivate to restore access:
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      All your trades and journal entries
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      Trading Health analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      AI Coach insights
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      Habit tracking & progress
                    </li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                  {/* Primary CTA */}
                  <button
                    onClick={handleReactivate}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                  >
                    <Crown className="w-5 h-5" />
                    Reactivate Subscription
                  </button>

                  {/* Secondary Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full px-6 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors text-sm"
                  >
                    Log Out
                  </button>
                </div>

                {/* Footer Note */}
                <p className="text-xs text-center text-gray-500 dark:text-gray-500 pt-2">
                  Questions? Email us at <a href="mailto:support@refine.trading" className="text-blue-600 dark:text-blue-400 hover:underline">support@refine.trading</a>
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};


