import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  progressPct: number;
  size?: 'sm' | 'md' | 'lg';
  thickness?: number;
  className?: string;
  showPercentage?: boolean;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progressPct,
  size = 'md',
  thickness = 4,
  className = '',
  showPercentage = false,
  children
}) => {
  const sizeConfig = {
    sm: { diameter: 40, fontSize: 'text-xs' },
    md: { diameter: 60, fontSize: 'text-sm' },
    lg: { diameter: 80, fontSize: 'text-base' }
  };

  const config = sizeConfig[size];
  const radius = (config.diameter - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={config.diameter}
        height={config.diameter}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.diameter / 2}
          cy={config.diameter / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={thickness}
          fill="none"
          className="text-muted/30"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={config.diameter / 2}
          cy={config.diameter / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={thickness}
          fill="none"
          strokeLinecap="round"
          className="text-primary"
          style={{
            strokeDasharray: circumference,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ 
            duration: 1.2, 
            ease: "easeInOut",
            delay: 0.2
          }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showPercentage && (
          <span className={cn('font-semibold text-foreground', config.fontSize)}>
            {Math.round(progressPct)}%
          </span>
        ))}
      </div>
    </div>
  );
};
