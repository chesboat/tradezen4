import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const TradesLeftWidget: React.FC<{ maxTrades: number; usedTrades: number }> = ({ maxTrades, usedTrades }) => {
  const left = Math.max(0, (maxTrades || 0) - (usedTrades || 0));
  const isMax = left === 0;
  const [flash, setFlash] = React.useState(false);
  const prevLeftRef = React.useRef<number>(left);

  React.useEffect(() => {
    if (left < prevLeftRef.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 250);
      return () => clearTimeout(t);
    }
    prevLeftRef.current = left;
  }, [left]);

  return (
    <>
      {/* Desktop: Inline pill (as before, but not fixed) */}
      <motion.div
        className={`hidden lg:block px-3 py-1.5 rounded-full border text-xs ${isMax ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-muted text-muted-foreground border-border'}`}
        animate={{ scale: flash ? 1.08 : 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      >
        <div className="relative">
          {isMax ? 'MAX REACHED' : `Trades Left: ${left}`}
          <AnimatePresence>
            {flash && !isMax && (
              <motion.span
                key="flash"
                className="absolute -top-3 -right-2 text-[10px] text-primary"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >−1</motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Mobile: Compact badge next to header */}
      <motion.div
        className={`lg:hidden px-2.5 py-1 rounded-full border text-[11px] font-medium ${isMax ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-primary/10 text-primary border-primary/20'}`}
        animate={{ scale: flash ? 1.08 : 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      >
        {isMax ? '0' : left}
      </motion.div>
    </>
  );
};

export default TradesLeftWidget;


