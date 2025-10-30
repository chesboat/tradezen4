/**
 * AI Insights Frame - Marketing Preview
 * Shows AI-powered insights (premium feature) for homepage
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Target, AlertTriangle, Crown } from 'lucide-react';
import { DEMO_AI_INSIGHTS } from '@/lib/demoData';
import { cn } from '@/lib/utils';

interface AIInsightsFrameProps {
  theme: 'light' | 'dark';
}

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'pattern':
      return TrendingUp;
    case 'habit':
      return Target;
    case 'risk':
      return AlertTriangle;
    default:
      return Sparkles;
  }
};

const getInsightColor = (type: string) => {
  switch (type) {
    case 'pattern':
      return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
    case 'habit':
      return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
    case 'risk':
      return 'from-amber-500/20 to-orange-500/20 border-amber-500/30';
    default:
      return 'from-primary/20 to-purple-500/20 border-primary/30';
  }
};

const getInsightIconColor = (type: string) => {
  switch (type) {
    case 'pattern':
      return 'text-blue-500';
    case 'habit':
      return 'text-green-500';
    case 'risk':
      return 'text-amber-500';
    default:
      return 'text-primary';
  }
};

export const AIInsightsFrame: React.FC<AIInsightsFrameProps> = ({ theme }) => {
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
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-6 h-6 text-primary" />
            </motion.div>
            <h2 className="text-3xl font-bold text-foreground">
              Trading Intelligence
            </h2>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30 rounded-full"
          >
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground">
              Premium
            </span>
          </motion.div>
        </motion.div>

        {/* AI Insight Cards */}
        <div className="space-y-4">
          {DEMO_AI_INSIGHTS.map((insight, index) => {
            const Icon = getInsightIcon(insight.type);
            const colorClass = getInsightColor(insight.type);
            const iconColorClass = getInsightIconColor(insight.type);
            
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.2 }}
                className={cn(
                  'bg-gradient-to-r border rounded-2xl p-6',
                  colorClass
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    'p-3 rounded-xl bg-background/50 backdrop-blur-sm flex-shrink-0',
                    'border border-border'
                  )}>
                    <Icon className={cn('w-6 h-6', iconColorClass)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    {/* Title */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        {insight.icon} {insight.title}
                      </h3>
                      {insight.confidence === 'high' && (
                        <span className="text-xs px-2 py-1 bg-background/50 backdrop-blur-sm border border-border rounded-full text-muted-foreground">
                          High Confidence
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {insight.description}
                    </p>

                    {/* Recommendation */}
                    <div className="bg-background/30 backdrop-blur-sm border border-border/50 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">
                          💡 Recommendation
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 mt-1">
                        {insight.recommendation}
                      </p>
                    </div>

                    {/* Impact */}
                    {insight.impact && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Potential Impact:
                        </span>
                        <span className={cn(
                          'text-xs font-bold',
                          insight.type === 'risk' ? 'text-amber-500' : 'text-green-500'
                        )}>
                          {insight.impact}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="text-center"
        >
          <button className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto">
            <Sparkles className="w-4 h-4" />
            Unlock Premium Insights
          </button>
        </motion.div>
      </div>
    </div>
  );
};

