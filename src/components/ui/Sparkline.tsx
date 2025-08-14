import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  showDots?: boolean;
  animate?: boolean;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 60,
  height = 20,
  color = 'currentColor',
  strokeWidth = 1.5,
  showDots = false,
  animate = true,
  className
}) => {
  if (!data || data.length < 2) {
    return (
      <div 
        className={cn("flex items-center justify-center", className)}
        style={{ width, height }}
      >
        <div className="w-full h-px bg-muted-foreground/20"></div>
      </div>
    );
  }

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1; // Avoid division by zero
  
  // Create SVG path points
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - minValue) / range) * height;
    return { x, y };
  });
  
  // Create SVG path string
  const pathData = points.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path} ${command} ${point.x} ${point.y}`;
  }, '').trim();

  // Determine trend direction for color
  const isPositiveTrend = data[data.length - 1] >= data[0];
  const trendColor = color === 'auto' 
    ? isPositiveTrend ? '#10b981' : '#ef4444'  // green-500 : red-500
    : color;

  return (
    <div className={cn("relative", className)} style={{ width, height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Sparkline path */}
        {animate ? (
          <motion.path
            d={pathData}
            stroke={trendColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        ) : (
          <path
            d={pathData}
            stroke={trendColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {/* Optional dots at data points */}
        {showDots && points.map((point, index) => (
          <motion.circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={1.5}
            fill={trendColor}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.3, 
              delay: animate ? 0.8 + (index * 0.1) : 0,
              ease: "easeOut" 
            }}
          />
        ))}
        
        {/* Gradient fill area (optional) */}
        <defs>
          <linearGradient id={`gradient-${Math.random()}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trendColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// Helper component for trend indicator
interface TrendIndicatorProps {
  data: number[];
  className?: string;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({ data, className }) => {
  if (!data || data.length < 2) return null;
  
  // Robust baseline to avoid absurd percentages when the first value is near zero
  const firstNonZero = data.find(val => val !== 0) ?? 0;
  const last = data[data.length - 1];
  const change = last - firstNonZero;
  // Use the max absolute magnitude across the series as baseline
  const baseline = Math.max(1, ...data.map(v => Math.abs(v)));
  let changePercent = (change / baseline) * 100;
  // Clamp to a sane range
  if (!Number.isFinite(changePercent)) changePercent = 0;
  changePercent = Math.max(-999, Math.min(999, changePercent));
  
  // Don't show if change is too small to be meaningful
  if (Math.abs(changePercent) < 0.1 && Math.abs(change) < 1) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        No change
      </span>
    );
  }
  
  const isPositive = change >= 0;
  const arrow = isPositive ? '↗' : '↘';
  const color = isPositive ? 'text-green-500' : 'text-red-500';
  
  return (
    <span className={cn("text-xs font-medium", color, className)}>
      {arrow} {Math.abs(changePercent).toFixed(1)}%
    </span>
  );
};