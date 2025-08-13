import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, AlertTriangle, Info } from 'lucide-react';
import { useNudgeStore } from '@/store/useNudgeStore';

export const NudgeToast: React.FC = () => {
  const { nudge, dismiss } = useNudgeStore();

  const toneStyles = nudge?.tone === 'warning'
    ? 'bg-red-500/15 border-red-500/30 text-red-300'
    : nudge?.tone === 'neutral'
    ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
    : 'bg-green-500/15 border-green-500/30 text-green-300';

  const Icon = nudge?.tone === 'warning' ? AlertTriangle : nudge?.tone === 'neutral' ? Info : ThumbsUp;

  return (
    <AnimatePresence>
      {nudge && (
        <motion.div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border shadow-2xl ${toneStyles}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <div className="text-sm">{nudge.message}</div>
            <button className="text-xs underline ml-2" onClick={dismiss}>Dismiss</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


