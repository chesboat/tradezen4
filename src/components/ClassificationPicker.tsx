/**
 * ClassificationPicker - Structured category selection for trades
 * Shows all categories with their options in a clean, compact grid
 * Used in trade entry modals for classifying trades by various criteria
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClassificationStore } from '@/store/useClassificationStore';
import { TradeClassifications, ClassificationCategory, ClassificationOption } from '@/types';

interface ClassificationPickerProps {
  value: TradeClassifications;
  onChange: (classifications: TradeClassifications) => void;
  compact?: boolean; // Compact mode for inline entry
  className?: string;
}

// Color palette for categories (if no color specified)
const CATEGORY_COLORS = [
  { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-600', active: 'bg-blue-500' },
  { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-600', active: 'bg-purple-500' },
  { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-600', active: 'bg-green-500' },
  { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-600', active: 'bg-orange-500' },
  { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-600', active: 'bg-pink-500' },
  { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-600', active: 'bg-cyan-500' },
];

export const ClassificationPicker: React.FC<ClassificationPickerProps> = ({
  value,
  onChange,
  compact = false,
  className,
}) => {
  const { getActiveCategories } = useClassificationStore();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const categories = getActiveCategories();

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const selectOption = useCallback((categoryId: string, optionId: string) => {
    const newValue = { ...value };
    if (newValue[categoryId] === optionId) {
      // Deselect if already selected
      delete newValue[categoryId];
    } else {
      newValue[categoryId] = optionId;
    }
    onChange(newValue);
  }, [value, onChange]);

  const clearCategory = useCallback((categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = { ...value };
    delete newValue[categoryId];
    onChange(newValue);
  }, [value, onChange]);

  const getColorScheme = (index: number) => CATEGORY_COLORS[index % CATEGORY_COLORS.length];

  // Compact mode - all categories in a horizontal scrollable row
  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {categories.map((category, idx) => {
          const selectedOptionId = value[category.id];
          const selectedOption = category.options.find(o => o.id === selectedOptionId);
          const colors = getColorScheme(idx);

          return (
            <CompactCategoryPicker
              key={category.id}
              category={category}
              selectedOption={selectedOption}
              colors={colors}
              onSelect={(optionId) => selectOption(category.id, optionId)}
              onClear={() => {
                const newValue = { ...value };
                delete newValue[category.id];
                onChange(newValue);
              }}
            />
          );
        })}
      </div>
    );
  }

  // Full mode - accordion style
  return (
    <div className={cn("space-y-2", className)}>
      {categories.map((category, idx) => {
        const isExpanded = expandedCategories.has(category.id);
        const selectedOptionId = value[category.id];
        const selectedOption = category.options.find(o => o.id === selectedOptionId);
        const colors = getColorScheme(idx);

        return (
          <div
            key={category.id}
            className={cn(
              "rounded-xl border transition-all",
              colors.border,
              isExpanded ? colors.bg : "bg-card/50"
            )}
          >
            {/* Category Header */}
            <button
              type="button"
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <div className="flex items-center gap-2">
                {category.emoji && <span className="text-lg">{category.emoji}</span>}
                <span className="font-medium text-sm">{category.name}</span>
                {selectedOption && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    colors.bg,
                    colors.text
                  )}>
                    {selectedOption.emoji} {selectedOption.name}
                    <button
                      type="button"
                      onClick={(e) => clearCategory(category.id, e)}
                      className="ml-1 hover:text-foreground"
                    >
                      <X className="w-3 h-3 inline" />
                    </button>
                  </span>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {/* Options */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 flex flex-wrap gap-2">
                    {category.options.sort((a, b) => a.order - b.order).map((option) => {
                      const isSelected = selectedOptionId === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => selectOption(category.id, option.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                            "border flex items-center gap-1.5",
                            isSelected
                              ? cn(colors.active, "text-white border-transparent")
                              : cn("bg-background border-border hover:border-foreground/30")
                          )}
                        >
                          {option.emoji && <span>{option.emoji}</span>}
                          {option.name}
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

// Compact dropdown for single category
interface CompactCategoryPickerProps {
  category: ClassificationCategory;
  selectedOption?: ClassificationOption;
  colors: typeof CATEGORY_COLORS[0];
  onSelect: (optionId: string) => void;
  onClear: () => void;
}

const CompactCategoryPicker: React.FC<CompactCategoryPickerProps> = ({
  category,
  selectedOption,
  colors,
  onSelect,
  onClear,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
          "border",
          selectedOption
            ? cn(colors.bg, colors.border, colors.text)
            : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
        )}
      >
        {category.emoji && <span>{category.emoji}</span>}
        <span className="max-w-[80px] truncate">
          {selectedOption ? selectedOption.name : category.name}
        </span>
        {selectedOption ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute z-50 mt-1 py-1 rounded-lg border shadow-lg",
                "bg-popover border-border min-w-[140px]",
                // Open upward if near bottom
                "bottom-full mb-1"
              )}
            >
              {category.options.sort((a, b) => a.order - b.order).map((option) => {
                const isSelected = selectedOption?.id === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      onSelect(option.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left",
                      "hover:bg-muted transition-colors",
                      isSelected && "bg-primary/10"
                    )}
                  >
                    {option.emoji && <span>{option.emoji}</span>}
                    <span className="flex-1">{option.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-primary" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Read-only display of classifications (for trade cards)
interface ClassificationBadgesProps {
  classifications?: TradeClassifications;
  className?: string;
  maxShow?: number;
}

export const ClassificationBadges: React.FC<ClassificationBadgesProps> = ({
  classifications,
  className,
  maxShow = 4,
}) => {
  const { getCategory, getOption } = useClassificationStore();

  if (!classifications || Object.keys(classifications).length === 0) {
    return null;
  }

  const entries = Object.entries(classifications).slice(0, maxShow);
  const remaining = Object.keys(classifications).length - maxShow;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {entries.map(([categoryId, optionId], idx) => {
        const category = getCategory(categoryId);
        const option = getOption(categoryId, optionId);
        if (!category || !option) return null;
        
        const colors = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];

        return (
          <span
            key={categoryId}
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
              colors.bg,
              colors.text
            )}
            title={`${category.name}: ${option.name}`}
          >
            {option.emoji || category.emoji}
            <span className="max-w-[60px] truncate">{option.name}</span>
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="text-[10px] text-muted-foreground px-1">
          +{remaining}
        </span>
      )}
    </div>
  );
};

export default ClassificationPicker;
