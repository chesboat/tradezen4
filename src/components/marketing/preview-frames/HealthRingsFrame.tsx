/**
 * Health Rings Frame - Marketing Preview
 * Shows Trading Health rings with demo data for homepage
 */

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { HealthRings } from '@/components/tradingHealth/HealthRings';
import { DEMO_HEALTH_METRICS, DEMO_CHECKLIST } from '@/lib/demoData';
import { cn } from '@/lib/utils';

interface HealthRingsFrameProps {
  theme: 'light' | 'dark';
}

export const HealthRingsFrame: React.FC<HealthRingsFrameProps> = ({ theme }) => {
  return (
    <div className={cn(
      'w-full h-full flex items-center justify-center p-8',
      theme === 'dark' ? 'dark bg-background' : 'bg-white'
    )}>
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Trading Health
          </h2>
          <p className="text-muted-foreground">
            Today • October 28, 2025
          </p>
        </motion.div>

        {/* Health Rings */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center"
        >
          <HealthRings
            metrics={DEMO_HEALTH_METRICS}
            size="large"
            showLabels={true}
          />
        </motion.div>

        {/* Today's Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Today's Checklist
          </h3>
          <div className="space-y-3">
            {DEMO_CHECKLIST.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-colors',
                  item.checked 
                    ? 'bg-green-500/10' 
                    : item.warning 
                    ? 'bg-amber-500/10' 
                    : 'bg-muted/30'
                )}
              >
                {item.checked ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : item.warning ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                )}
                <span className={cn(
                  'text-sm',
                  item.checked 
                    ? 'text-foreground' 
                    : item.warning 
                    ? 'text-amber-600 dark:text-amber-400' 
                    : 'text-muted-foreground'
                )}>
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

