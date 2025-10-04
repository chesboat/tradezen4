import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, X } from 'lucide-react';

interface BulletCounterSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (count: number) => void;
}

export const BulletCounterSetupModal: React.FC<BulletCounterSetupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [bulletCount, setBulletCount] = useState<string>('3');
  const [error, setError] = useState<string>('');

  const handleConfirm = () => {
    const parsed = parseInt(bulletCount, 10);
    
    if (!bulletCount || bulletCount.trim() === '') {
      setError('Please enter a number');
      return;
    }
    
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 10) {
      setError('Please enter a number between 1 and 10');
      return;
    }
    
    onConfirm(parsed);
    setBulletCount('3'); // Reset for next time
    setError('');
  };

  const handleCancel = () => {
    setBulletCount('3');
    setError('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCancel}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Enable Discipline Mode</h2>
                  <p className="text-sm text-muted-foreground">Set your daily bullet limit</p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Each trade will burn one bullet. This helps control impulse trading while still allowing you to override when needed.
                </p>
                
                <label className="block text-sm font-medium mb-2">
                  Daily Bullets (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={bulletCount}
                  onChange={(e) => {
                    setBulletCount(e.target.value);
                    setError('');
                  }}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-lg font-semibold text-center"
                  placeholder="3"
                />
                
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 mt-2"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              {/* Quick select buttons */}
              <div className="flex gap-2">
                {[3, 5, 8, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setBulletCount(String(num));
                      setError('');
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-all ${
                      bulletCount === String(num)
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-border bg-muted/20">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 rounded-xl border border-border hover:bg-accent transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold shadow-lg shadow-primary/20"
              >
                Enable
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BulletCounterSetupModal;

