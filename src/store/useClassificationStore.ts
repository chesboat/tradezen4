/**
 * Classification Store - Manages trade classification categories and options
 * Uses localStorage for persistence (Firestore sync disabled until rules configured)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  ClassificationCategory, 
  ClassificationOption,
  DEFAULT_CLASSIFICATION_CATEGORIES 
} from '@/types';

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

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// Seed default categories with IDs
const seedDefaultCategories = (): ClassificationCategory[] => {
  return DEFAULT_CLASSIFICATION_CATEGORIES.map((cat, index) => ({
    ...cat,
    id: generateId(),
    order: index,
    options: cat.options.map(opt => ({
      ...opt,
      id: opt.id, // Keep the predefined IDs for consistency
    })),
  }));
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
        // Seed defaults if no categories exist
        const stored = get().categories;
        if (stored.length === 0) {
          set({ categories: seedDefaultCategories() });
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
