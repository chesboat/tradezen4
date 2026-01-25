/**
 * Classification Store - Manages trade classification categories and options
 * Uses localStorage for persistence with stable IDs for cross-device sync
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  ClassificationCategory, 
  ClassificationOption,
  DEFAULT_CLASSIFICATION_CATEGORIES 
} from '@/types';
import { setClassificationMigrationMap } from './useTradeStore';

interface ClassificationState {
  categories: ClassificationCategory[];
  isLoading: boolean;
  userId: string | null;

  // Actions
  initialize: (userId: string) => Promise<void>;
  cleanup: () => void;
  
  // Category CRUD
  addCategory: (category: Omit<ClassificationCategory, 'id' | 'order'>) => Promise<void>;
  updateCategory: (categoryId: string, updates: Partial<ClassificationCategory>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  reorderCategories: (categoryIds: string[]) => Promise<void>;
  
  // Option CRUD
  addOption: (categoryId: string, option: Omit<ClassificationOption, 'id' | 'order'>) => Promise<void>;
  updateOption: (categoryId: string, optionId: string, updates: Partial<ClassificationOption>) => Promise<void>;
  deleteOption: (categoryId: string, optionId: string) => Promise<void>;
  reorderOptions: (categoryId: string, optionIds: string[]) => Promise<void>;
  
  // Getters
  getCategory: (categoryId: string) => ClassificationCategory | undefined;
  getOption: (categoryId: string, optionId: string) => ClassificationOption | undefined;
  getActiveCategories: () => ClassificationCategory[];
}

// Generate unique ID (only for user-created categories)
const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Get default categories with stable IDs (already defined in types)
const getDefaultCategories = (): ClassificationCategory[] => {
  return DEFAULT_CLASSIFICATION_CATEGORIES.map(cat => ({ ...cat }));
};

// Migration: Check if stored categories use old random IDs and need migration
// Also builds a migration map for trade classifications
const migrateToStableIds = (stored: ClassificationCategory[]): { categories: ClassificationCategory[], migrationMap: Record<string, string> } => {
  // Map old category names to new stable IDs
  const nameToStableId: Record<string, string> = {
    'Day of Week': 'cat_day_of_week',
    'Daily Candle': 'cat_daily_candle',
    'Daily Profile': 'cat_daily_profile',
    'H4 Level': 'cat_h4_level',
    'H4 Candle': 'cat_h4_candle',
    'H4 Profile': 'cat_h4_profile',
  };
  
  const migrationMap: Record<string, string> = {};
  
  // Build migration map for all default categories (old ID -> new stable ID)
  stored.forEach(cat => {
    const stableId = nameToStableId[cat.name];
    if (stableId && cat.id !== stableId) {
      migrationMap[cat.id] = stableId;
    }
  });
  
  // Check if any default category has an old-style ID (timestamp-based)
  const needsMigration = Object.keys(migrationMap).length > 0;
  
  if (needsMigration) {
    const migratedCategories = stored.map(cat => {
      const stableId = nameToStableId[cat.name];
      if (stableId && cat.id !== stableId) {
        return { ...cat, id: stableId };
      }
      return cat;
    });
    return { categories: migratedCategories, migrationMap };
  }
  
  return { categories: stored, migrationMap };
};

export const useClassificationStore = create<ClassificationState>()(
  persist(
    (set, get) => ({
      categories: [],
      isLoading: false,
      userId: null,

      initialize: async (userId: string) => {
        set({ isLoading: true, userId });

        // Use localStorage persistence (handled by zustand persist middleware)
        const stored = get().categories;
        
        if (stored.length === 0) {
          // Seed with default categories using stable IDs
          set({ categories: getDefaultCategories() });
          // No migration needed for fresh install
        } else {
          // Migrate existing categories to stable IDs if needed
          const { categories: migrated, migrationMap } = migrateToStableIds(stored);
          
          // Set the migration map for trade classifications
          if (Object.keys(migrationMap).length > 0) {
            setClassificationMigrationMap(migrationMap);
          }
          
          if (migrated !== stored) {
            set({ categories: migrated });
          }
          
          // Ensure all default categories exist (in case new ones were added)
          const defaults = getDefaultCategories();
          const existingIds = new Set(migrated.map(c => c.id));
          const missing = defaults.filter(d => !existingIds.has(d.id));
          if (missing.length > 0) {
            set({ categories: [...migrated, ...missing] });
          }
        }
        
        set({ isLoading: false });
      },

      cleanup: () => {
        set({ userId: null });
      },

      addCategory: async (category) => {
        const { categories } = get();
        const newCategory: ClassificationCategory = {
          ...category,
          id: generateId(),
          order: categories.length,
          options: category.options || [],
          isActive: category.isActive ?? true,
        };

        set({ categories: [...categories, newCategory] });
      },

      updateCategory: async (categoryId, updates) => {
        const { categories } = get();
        const updated = categories.map(cat =>
          cat.id === categoryId ? { ...cat, ...updates } : cat
        );
        set({ categories: updated });
      },

      deleteCategory: async (categoryId) => {
        const { categories } = get();
        const filtered = categories.filter(cat => cat.id !== categoryId);
        // Reorder remaining
        const reordered = filtered.map((cat, idx) => ({ ...cat, order: idx }));
        set({ categories: reordered });
      },

      reorderCategories: async (categoryIds) => {
        const { categories } = get();
        const reordered = categoryIds.map((id, idx) => {
          const cat = categories.find(c => c.id === id);
          return cat ? { ...cat, order: idx } : null;
        }).filter(Boolean) as ClassificationCategory[];
        set({ categories: reordered });
      },

      addOption: async (categoryId, option) => {
        const { categories } = get();
        const updated = categories.map(cat => {
          if (cat.id === categoryId) {
            const newOption: ClassificationOption = {
              ...option,
              id: generateId(),
              order: cat.options.length,
            };
            return { ...cat, options: [...cat.options, newOption] };
          }
          return cat;
        });
        set({ categories: updated });
      },

      updateOption: async (categoryId, optionId, updates) => {
        const { categories } = get();
        const updated = categories.map(cat => {
          if (cat.id === categoryId) {
            const updatedOptions = cat.options.map(opt =>
              opt.id === optionId ? { ...opt, ...updates } : opt
            );
            return { ...cat, options: updatedOptions };
          }
          return cat;
        });
        set({ categories: updated });
      },

      deleteOption: async (categoryId, optionId) => {
        const { categories } = get();
        const updated = categories.map(cat => {
          if (cat.id === categoryId) {
            const filtered = cat.options.filter(opt => opt.id !== optionId);
            const reordered = filtered.map((opt, idx) => ({ ...opt, order: idx }));
            return { ...cat, options: reordered };
          }
          return cat;
        });
        set({ categories: updated });
      },

      reorderOptions: async (categoryId, optionIds) => {
        const { categories } = get();
        const updated = categories.map(cat => {
          if (cat.id === categoryId) {
            const reordered = optionIds.map((id, idx) => {
              const opt = cat.options.find(o => o.id === id);
              return opt ? { ...opt, order: idx } : null;
            }).filter(Boolean) as ClassificationOption[];
            return { ...cat, options: reordered };
          }
          return cat;
        });
        set({ categories: updated });
      },

      getCategory: (categoryId) => {
        return get().categories.find(cat => cat.id === categoryId);
      },

      getOption: (categoryId, optionId) => {
        const category = get().getCategory(categoryId);
        return category?.options.find(opt => opt.id === optionId);
      },

      getActiveCategories: () => {
        return get().categories
          .filter(cat => cat.isActive)
          .sort((a, b) => a.order - b.order);
      },
    }),
    {
      name: 'classification-store',
      partialize: (state) => ({
        categories: state.categories,
      }),
    }
  )
);
