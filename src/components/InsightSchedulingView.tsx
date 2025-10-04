/**
 * Insight Scheduling View - Premium Feature
 * Drag-and-drop interface to prioritize and enable/disable insights
 * Apple-style: Simple, powerful, beautiful
 */

import React, { useState, useEffect } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { GripVertical, Eye, EyeOff, Lock, Sparkles, RotateCcw, Settings } from 'lucide-react';
import { useInsightPreferencesStore, type InsightPreference } from '@/store/useInsightPreferencesStore';
import { useSubscription } from '@/hooks/useSubscription';
import { getFeatureUpgradeCTA } from '@/lib/tierLimits';
import { UpgradeModal } from './UpgradeModal';
import { cn } from '@/lib/utils';

const InsightSchedulingView: React.FC = () => {
  const { isPremium } = useSubscription();
  const { preferences, loadPreferences, reorderPreferences, toggleInsight, resetToDefaults, loading } = useInsightPreferencesStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [items, setItems] = useState(preferences);
  
  // Load preferences on mount
  useEffect(() => {
    if (isPremium) {
      loadPreferences();
    }
  }, [isPremium, loadPreferences]);
  
  // Sync with store
  useEffect(() => {
    setItems(preferences);
  }, [preferences]);
  
  const handleReorder = (newOrder: InsightPreference[]) => {
    setItems(newOrder);
  };
  
  const handleSave = () => {
    reorderPreferences(items);
  };
  
  // Premium gate
  if (!isPremium) {
    const upgradeCTA = getFeatureUpgradeCTA('hasInsightScheduling');
    
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Insight Priorities</h3>
              <p className="text-sm text-muted-foreground">Customize your daily insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Premium</span>
          </div>
        </div>
        
        {/* Blurred Preview */}
        <div className="relative">
          <div className="blur-sm opacity-50 pointer-events-none space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 bg-card border border-border rounded-xl flex items-center gap-4">
                <GripVertical className="w-5 h-5 text-muted-foreground" />
                <div className="text-2xl">💪</div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
                <div className="w-10 h-6 bg-muted rounded" />
              </div>
            ))}
          </div>
          
          {/* Lock Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 max-w-md p-6"
            >
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                <Settings className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">{upgradeCTA.title}</h3>
                <p className="text-sm text-muted-foreground">{upgradeCTA.description}</p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mx-auto"
              >
                <Sparkles className="w-5 h-5" />
                Upgrade to Premium
              </button>
            </motion.div>
          </div>
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
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading preferences...</span>
        </div>
      </div>
    );
  }
  
  const hasChanges = JSON.stringify(items) !== JSON.stringify(preferences);
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Insight Priorities</h3>
            <p className="text-sm text-muted-foreground">Drag to reorder • Toggle to enable/disable</p>
          </div>
        </div>
        <button
          onClick={resetToDefaults}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:border-primary/50 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
      
      {/* Info Banner */}
      <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
        <p className="text-sm text-foreground">
          <strong>Top priority insight</strong> will show on your dashboard each day. 
          Disabled insights won't appear.
        </p>
      </div>
      
      {/* Draggable List */}
      <Reorder.Group
        axis="y"
        values={items}
        onReorder={handleReorder}
        className="space-y-2"
      >
        <AnimatePresence>
          {items.map((item, index) => (
            <InsightPreferenceCard
              key={item.type}
              item={item}
              index={index}
              onToggle={() => toggleInsight(item.type)}
            />
          ))}
        </AnimatePresence>
      </Reorder.Group>
      
      {/* Save Button */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="sticky bottom-4 flex justify-center"
        >
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg"
          >
            Save Changes
          </button>
        </motion.div>
      )}
    </div>
  );
};

// Individual Preference Card
interface InsightPreferenceCardProps {
  item: InsightPreference;
  index: number;
  onToggle: () => void;
}

const InsightPreferenceCard: React.FC<InsightPreferenceCardProps> = ({ item, index, onToggle }) => {
  return (
    <Reorder.Item
      value={item}
      id={item.type}
      className={cn(
        'p-4 bg-card border rounded-xl cursor-move transition-all',
        item.enabled
          ? 'border-border hover:border-primary/50'
          : 'border-border/50 opacity-50'
      )}
      whileDrag={{
        scale: 1.05,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        zIndex: 50,
      }}
    >
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
        
        {/* Priority Number */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-foreground">
          {index + 1}
        </div>
        
        {/* Icon */}
        <div className="text-2xl flex-shrink-0">{item.icon}</div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate">{item.label}</h4>
          <p className="text-sm text-muted-foreground truncate">{item.description}</p>
        </div>
        
        {/* Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={cn(
            'flex-shrink-0 p-2 rounded-lg transition-colors',
            item.enabled
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {item.enabled ? (
            <Eye className="w-5 h-5" />
          ) : (
            <EyeOff className="w-5 h-5" />
          )}
        </button>
      </div>
    </Reorder.Item>
  );
};

export default InsightSchedulingView;

