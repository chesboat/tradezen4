import React from 'react';
import { motion } from 'framer-motion';

export const BulletMeter: React.FC<{ max: number; used: number }> = ({ max, used }) => {
  const items = Array.from({ length: Math.max(0, max || 0) }).map((_, i) => i);
  return (
    <div className="flex items-center gap-2">
      {items.map((i) => {
        const filled = i < used;
        return (
          <motion.div
            key={i}
            className={`w-3 h-3 rounded-full border ${filled ? 'bg-primary border-primary/60' : 'bg-muted border-border'}`}
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: filled ? 1.05 : 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          />
        );
      })}
    </div>
  );
};

export default BulletMeter;


