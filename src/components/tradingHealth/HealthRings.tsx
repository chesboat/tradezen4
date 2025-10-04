/**
 * Trading Health Rings
 * Apple Watch-style 3-ring visualization
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Zap, Target, Shield } from 'lucide-react';
import type { TradingHealthMetrics } from '@/lib/tradingHealth/types';
import { cn } from '@/lib/utils';

interface HealthRingsProps {
  metrics: TradingHealthMetrics;
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  onRingClick?: (ring: 'edge' | 'consistency' | 'riskControl') => void;
}

export const HealthRings: React.FC<HealthRingsProps> = ({
  metrics,
  size = 'large',
  showLabels = true,
  onRingClick,
}) => {
  const sizeConfig = {
    small: { radius: 40, strokeWidth: 6, gap: 8 },
    medium: { radius: 60, strokeWidth: 8, gap: 10 },
    large: { radius: 80, strokeWidth: 10, gap: 12 },
  };

  const { radius, strokeWidth, gap } = sizeConfig[size];

  // Calculate ring positions (from outer to inner)
  const rings = useMemo(() => [
    {
      key: 'edge',
      label: 'Edge',
      icon: Zap,
      value: metrics.edge.value,
      goal: metrics.edge.goal,
      radius: radius,
      color: '#FF375F', // Apple Watch Move ring (red/pink)
      bgColor: 'rgba(255, 55, 95, 0.1)',
      metric: metrics.edge,
    },
    {
      key: 'consistency',
      label: 'Consistency',
      icon: Target,
      value: metrics.consistency.value,
      goal: metrics.consistency.goal,
      radius: radius - strokeWidth - gap,
      color: '#7AFF45', // Apple Watch Exercise ring (green)
      bgColor: 'rgba(122, 255, 69, 0.1)',
      metric: metrics.consistency,
    },
    {
      key: 'riskControl',
      label: 'Risk Control',
      icon: Shield,
      value: metrics.riskControl.value,
      goal: metrics.riskControl.goal,
      radius: radius - (strokeWidth + gap) * 2,
      color: '#0AFFFE', // Apple Watch Stand ring (cyan)
      bgColor: 'rgba(10, 255, 254, 0.1)',
      metric: metrics.riskControl,
    },
  ], [metrics, radius, strokeWidth, gap]);

  const svgSize = (radius + strokeWidth) * 2;
  const center = svgSize / 2;

  const getArcPath = (r: number, percentage: number) => {
    const angle = (percentage / 100) * 360;
    const radians = (angle - 90) * (Math.PI / 180);
    const x = center + r * Math.cos(radians);
    const y = center + r * Math.sin(radians);
    const largeArcFlag = angle > 180 ? 1 : 0;

    return `
      M ${center} ${center - r}
      A ${r} ${r} 0 ${largeArcFlag} 1 ${x} ${y}
    `;
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />;
      default:
        return <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'needs-work': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 sm:gap-8">
      {/* Rings */}
      <div className="relative">
        <svg width={svgSize} height={svgSize} className="transform -rotate-90">
          {rings.map((ring, index) => {
            const percentage = Math.min((ring.value / ring.goal) * 100, 100);
            const arcPath = getArcPath(ring.radius, percentage);

            return (
              <g key={ring.key}>
                {/* Background circle */}
                <circle
                  cx={center}
                  cy={center}
                  r={ring.radius}
                  fill="none"
                  stroke={ring.bgColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
                
                {/* Progress arc */}
                <motion.path
                  d={arcPath}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{
                    duration: 1.5,
                    delay: index * 0.2,
                    ease: [0.16, 1, 0.3, 1], // Apple's ease curve
                  }}
                  className={cn(
                    'cursor-pointer transition-opacity hover:opacity-80',
                    onRingClick && 'drop-shadow-lg'
                  )}
                  onClick={() => onRingClick?.(ring.key as any)}
                  style={{
                    filter: `drop-shadow(0 0 8px ${ring.color}40)`,
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Center score */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground"
            >
              {Math.round((metrics.edge.value + metrics.consistency.value + metrics.riskControl.value) / 3)}
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-xs sm:text-sm text-muted-foreground"
            >
              Overall
            </motion.div>
          </div>
        </div>
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          {rings.map((ring) => {
            const Icon = ring.icon;
            const percentage = Math.min((ring.value / ring.goal) * 100, 100);
            
            return (
              <motion.button
                key={ring.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => onRingClick?.(ring.key as any)}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-2xl transition-all',
                  'bg-card/50 backdrop-blur-sm border border-border/50',
                  onRingClick && 'hover:bg-card hover:border-border hover:scale-[1.02] cursor-pointer',
                  'group'
                )}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: ring.bgColor }}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: ring.color }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {ring.label}
                    </span>
                    {getTrendIcon(ring.metric.trend)}
                  </div>
                  
                  <div className="flex items-baseline gap-2">
                    <span className={cn('text-lg sm:text-xl font-bold', getStatusColor(ring.metric.status))}>
                      {ring.value}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / {ring.goal}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: ring.color }}
                    />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HealthRings;
