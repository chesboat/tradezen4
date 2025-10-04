/**
 * Insight History View - Premium Feature
 * Shows all past daily insights with search and filters
 * Apple-style: Clean, searchable, beautiful
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Filter, History, Sparkles, Lock } from 'lucide-react';
import { useInsightHistoryStore } from '@/store/useInsightHistoryStore';
import { useSubscription } from '@/hooks/useSubscription';
import { getFeatureUpgradeCTA } from '@/lib/tierLimits';
import { UpgradeModal } from './UpgradeModal';
import { cn } from '@/lib/utils';
import type { StoredInsight } from '@/store/useInsightHistoryStore';

const InsightHistoryView: React.FC = () => {
  const { isPremium, tier } = useSubscription();
  const { insights, loading, loadHistory } = useInsightHistoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Load insights on mount (if premium)
  useEffect(() => {
    if (isPremium) {
      loadHistory();
    }
  }, [isPremium, loadHistory]);
  
  // Filter and search insights
  const filteredInsights = useMemo(() => {
    let result = insights;
    
    // Filter by type
    if (filterType) {
      result = result.filter(i => i.type === filterType);
    }
    
    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(query) ||
        i.message.toLowerCase().includes(query) ||
        i.suggestion?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [insights, filterType, searchQuery]);
  
  // Get unique insight types for filter
  const insightTypes = useMemo(() => {
    const types = new Set(insights.map(i => i.type));
    return Array.from(types);
  }, [insights]);
  
  // Premium gate
  if (!isPremium) {
    const upgradeCTA = getFeatureUpgradeCTA('hasInsightHistory');
    
    return (
      <div className="flex-1 overflow-hidden bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <History className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Insight History</h1>
                  <p className="text-sm text-muted-foreground">Never miss a discovery</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Premium</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Premium Gate Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center space-y-6"
          >
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-3xl blur-xl" />
              <div className="relative w-full h-full bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-3xl flex items-center justify-center border border-primary/20">
                <History className="w-12 h-12 text-primary" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{upgradeCTA.title}</h2>
              <p className="text-muted-foreground">{upgradeCTA.description}</p>
            </div>
            
            {/* Preview of what they'll see */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 bg-card border border-border rounded-xl blur-sm opacity-50"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-5/6" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Upgrade to Premium
            </button>
          </motion.div>
        </div>
        
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature={upgradeCTA.title}
        />
      </div>
    );
  }
  
  // Premium content
  return (
    <div className="flex-1 overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                <History className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Insight History</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredInsights.length} insights discovered
                </p>
              </div>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            
            {/* Type Filter */}
            {insightTypes.length > 0 && (
              <select
                value={filterType || ''}
                onChange={(e) => setFilterType(e.target.value || null)}
                className="px-4 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">All Types</option>
                {insightTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>
      
      {/* Insights List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Loading insights...</span>
              </div>
            </div>
          ) : filteredInsights.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="w-12 h-12 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No insights yet</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || filterType
                  ? 'Try adjusting your filters'
                  : 'Insights will appear here as they are discovered'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredInsights.map((insight, index) => (
                  <InsightCard key={insight.id} insight={insight} index={index} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Individual Insight Card
const InsightCard: React.FC<{ insight: StoredInsight; index: number }> = ({ insight, index }) => {
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400';
      case 'success':
        return 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400';
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'p-4 bg-card border rounded-xl hover:border-primary/50 transition-colors',
        getSeverityStyles(insight.severity)
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0',
          getSeverityStyles(insight.severity)
        )}>
          {insight.icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{insight.title}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(insight.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <span className={cn(
              'px-2 py-1 text-xs font-medium rounded-lg flex-shrink-0',
              getSeverityStyles(insight.severity)
            )}>
              {insight.type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </span>
          </div>
          
          {/* Message */}
          <p className="text-sm text-foreground">{insight.message}</p>
          
          {/* Suggestion */}
          {insight.suggestion && (
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">{insight.suggestion}</p>
            </div>
          )}
          
          {/* Metric */}
          {insight.metric && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <div>
                <div className="font-medium">{insight.metric.label}</div>
                <div>{insight.metric.value}</div>
                {insight.metric.comparison && (
                  <div className="text-xs">{insight.metric.comparison}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InsightHistoryView;

