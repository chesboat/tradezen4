/**
 * Analytics Frame - Marketing Preview
 * Shows analytics dashboard with demo data for homepage
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Activity } from 'lucide-react';
import { DEMO_ANALYTICS, DEMO_KPI_CARDS, formatDemoCurrency } from '@/lib/demoData';
import { cn } from '@/lib/utils';

interface AnalyticsFrameProps {
  theme: 'light' | 'dark';
}

export const AnalyticsFrame: React.FC<AnalyticsFrameProps> = ({ theme }) => {
  // Calculate SVG path for equity curve
  const equityCurve = DEMO_ANALYTICS.equityCurve;
  const maxValue = Math.max(...equityCurve.map(d => d.value));
  const minValue = Math.min(...equityCurve.map(d => d.value));
  const range = maxValue - minValue;
  
  const width = 600;
  const height = 200;
  const padding = 20;
  
  const points = equityCurve.map((d, i) => {
    const x = padding + (i / (equityCurve.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((d.value - minValue) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');
  
  const pathD = `M ${points.split(' ').join(' L ')}`;

  return (
    <div className={cn(
      'w-full h-full flex items-center justify-center p-8',
      theme === 'dark' ? 'dark bg-background' : 'bg-white'
    )}>
      <div className="max-w-4xl w-full space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <h2 className="text-3xl font-bold text-foreground">
            Performance Analytics
          </h2>
          <span className="text-sm text-muted-foreground">
            30 Days
          </span>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-4 gap-4"
        >
          {DEMO_KPI_CARDS.map((kpi, index) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4"
            >
              <div className="text-xs text-muted-foreground mb-1">
                {kpi.label}
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {kpi.value}
              </div>
              <div className="flex items-center gap-1">
                {kpi.trend === 'up' && (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                )}
                {kpi.trendValue && (
                  <span className={cn(
                    'text-xs font-medium',
                    kpi.trend === 'up' ? 'text-green-500' : 'text-muted-foreground'
                  )}>
                    {kpi.trendValue}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Equity Curve */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">
                Equity Curve
              </h3>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-green-500">
                {formatDemoCurrency(DEMO_ANALYTICS.biggestWin)}
              </span>
              {' '}biggest win
            </div>
          </div>
          
          <div className="relative w-full" style={{ height: '200px' }}>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              <g opacity="0.1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={i}
                    x1={padding}
                    y1={padding + (i * (height - 2 * padding)) / 4}
                    x2={width - padding}
                    y2={padding + (i * (height - 2 * padding)) / 4}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="text-muted-foreground"
                  />
                ))}
              </g>
              
              {/* Gradient fill */}
              <defs>
                <linearGradient id="equityGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Fill area */}
              <motion.path
                d={`${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
                fill="url(#equityGradient)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.9 }}
              />
              
              {/* Line */}
              <motion.path
                d={pathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
              
              {/* Data points */}
              {equityCurve.map((d, i) => {
                const x = padding + (i / (equityCurve.length - 1)) * (width - 2 * padding);
                const y = height - padding - ((d.value - minValue) / range) * (height - 2 * padding);
                
                return (
                  <motion.circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#10b981"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.9 + i * 0.05 }}
                  />
                );
              })}
            </svg>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

