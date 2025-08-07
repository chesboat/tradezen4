import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CircularProgressProps {
  wins: number;
  losses: number;
  breakeven: number;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showPercentage?: boolean;
  showInlineNumbers?: boolean;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  wins,
  losses,
  breakeven,
  size = 'md',
  showLabels = true,
  showPercentage = true,
  showInlineNumbers = false,
  className
}) => {
  const total = wins + losses + breakeven;
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  const lossRate = total > 0 ? (losses / total) * 100 : 0;
  const breakEvenRate = total > 0 ? (breakeven / total) * 100 : 0;

  // Size configurations
  const sizeConfig = {
    sm: { 
      radius: 35, 
      strokeWidth: 6, 
      fontSize: 'text-xs', 
      containerSize: 'w-20 h-20',
      labelGap: 'gap-1'
    },
    md: { 
      radius: 45, 
      strokeWidth: 8, 
      fontSize: 'text-sm', 
      containerSize: 'w-28 h-28',
      labelGap: 'gap-2'
    },
    lg: { 
      radius: 60, 
      strokeWidth: 10, 
      fontSize: 'text-base', 
      containerSize: 'w-36 h-36',
      labelGap: 'gap-3'
    }
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  
  // Calculate stroke dash arrays for each segment
  const winStroke = (winRate / 100) * circumference;
  const lossStroke = (lossRate / 100) * circumference;
  const breakEvenStroke = (breakEvenRate / 100) * circumference;

  return (
    <div className={cn(
      showInlineNumbers ? "flex items-center gap-3" : "flex flex-col items-center",
      !showInlineNumbers && config.labelGap,
      className
    )}>
      {/* Circular Progress */}
      <div className={cn("relative", config.containerSize)}>
        <svg 
          className="w-full h-full transform -rotate-90" 
          viewBox={`0 0 ${(config.radius + config.strokeWidth) * 2} ${(config.radius + config.strokeWidth) * 2}`}
        >
          {/* Background circle */}
          <circle
            cx={config.radius + config.strokeWidth}
            cy={config.radius + config.strokeWidth}
            r={config.radius}
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            fill="transparent"
            className="text-border opacity-20"
          />
          
          {/* Win segment */}
          {wins > 0 && (
            <motion.circle
              cx={config.radius + config.strokeWidth}
              cy={config.radius + config.strokeWidth}
              r={config.radius}
              stroke="#10b981" // green-500
              strokeWidth={config.strokeWidth}
              fill="transparent"
              strokeDasharray={`${winStroke} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${winStroke} ${circumference}` }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            />
          )}
          
          {/* Loss segment */}
          {losses > 0 && (
            <motion.circle
              cx={config.radius + config.strokeWidth}
              cy={config.radius + config.strokeWidth}
              r={config.radius}
              stroke="#ef4444" // red-500
              strokeWidth={config.strokeWidth}
              fill="transparent"
              strokeDasharray={`${lossStroke} ${circumference}`}
              strokeDashoffset={-winStroke}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${lossStroke} ${circumference}` }}
              transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
            />
          )}
          
          {/* Breakeven segment */}
          {breakeven > 0 && (
            <motion.circle
              cx={config.radius + config.strokeWidth}
              cy={config.radius + config.strokeWidth}
              r={config.radius}
              stroke="#6b7280" // gray-500
              strokeWidth={config.strokeWidth}
              fill="transparent"
              strokeDasharray={`${breakEvenStroke} ${circumference}`}
              strokeDashoffset={-(winStroke + lossStroke)}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${breakEvenStroke} ${circumference}` }}
              transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
            />
          )}
        </svg>
        
        {/* Center text */}
        {showPercentage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className={cn("font-bold text-foreground", config.fontSize)}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              {winRate.toFixed(0)}%
            </motion.span>
            <span className="text-xs text-muted-foreground">Win Rate</span>
          </div>
        )}
      </div>
      
      {/* Inline Numbers */}
      {showInlineNumbers && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className={cn("font-medium text-foreground", config.fontSize)}>
              {wins}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className={cn("font-medium text-foreground", config.fontSize)}>
              {losses}
            </span>
          </div>
          {breakeven > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className={cn("font-medium text-foreground", config.fontSize)}>
                {breakeven}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Labels */}
      {showLabels && !showInlineNumbers && (
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-muted-foreground">{wins} Wins</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-muted-foreground">{losses} Losses</span>
          </div>
          {breakeven > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className="text-muted-foreground">{breakeven} BE</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};