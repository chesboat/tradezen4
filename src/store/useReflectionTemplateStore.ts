import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  CustomTemplate, 
  TemplateBlock, 
  InsightBlock, 
  ReflectionTemplateData,
  DailyJournalData,
  FavoriteBlock
} from '@/types';
import { localStorage, STORAGE_KEYS, generateId } from '@/lib/localStorageUtils';
import { FirestoreService } from '@/lib/firestore';
import insightTemplatesData from '@/lib/insightTemplates.json';

interface ReflectionTemplateState {
  // Template management
  customTemplates: CustomTemplate[];
  builtInTemplates: CustomTemplate[];
  
  // Active reflection data
  reflectionData: ReflectionTemplateData[];
  
  // Favorite blocks
  favoriteBlocks: FavoriteBlock[];
  
  // UI state
  selectedTemplateId: string | null;
  isGeneratingAITemplate: boolean;
  
  // Template CRUD actions
  createCustomTemplate: (template: Omit<CustomTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => CustomTemplate;
  updateCustomTemplate: (id: string, updates: Partial<CustomTemplate>) => void;
  deleteCustomTemplate: (id: string) => void;
  duplicateTemplate: (templateId: string, newName: string) => CustomTemplate;
  
  // Template block management
  addBlockToTemplate: (templateId: string, block: Omit<TemplateBlock, 'id'>) => void;
  updateTemplateBlock: (templateId: string, blockId: string, updates: Partial<TemplateBlock>) => void;
  deleteTemplateBlock: (templateId: string, blockId: string) => void;
  reorderTemplateBlocks: (templateId: string, fromIndex: number, toIndex: number) => void;
  
  // Reflection data management
  getReflectionByDate: (date: string, accountId: string) => ReflectionTemplateData | undefined;
  createOrUpdateReflection: (date: string, accountId: string, updates?: Partial<ReflectionTemplateData>) => ReflectionTemplateData;
  
  // Insight block management
  addInsightBlock: (reflectionId: string, block: Omit<InsightBlock, 'id' | 'createdAt' | 'updatedAt'>) => InsightBlock;
  updateInsightBlock: (reflectionId: string, blockId: string, updates: Partial<InsightBlock>) => void;
  deleteInsightBlock: (reflectionId: string, blockId: string) => void;
  reorderInsightBlocks: (reflectionId: string, fromIndex: number, toIndex: number) => void;
  duplicateInsightBlock: (reflectionId: string, blockId: string) => InsightBlock;
  
  // Image management for insight blocks
  addImageToBlock: (reflectionId: string, blockId: string, imageUrl: string) => void;
  removeImageFromBlock: (reflectionId: string, blockId: string, imageIndex: number) => void;
  
  // Tag management for insight blocks
  getAllInsightBlockTags: (accountId?: string) => string[];
  getInsightBlockTagFrequency: (tag: string, accountId?: string) => number;
  
  // Template usage and analytics
  incrementTemplateUsage: (templateId: string) => void;
  getPopularTemplates: (accountId?: string) => CustomTemplate[];
  getTemplateById: (templateId: string) => CustomTemplate | undefined;
  
  // AI template generation
  generateAITemplate: (context: DailyJournalData, customPrompt?: string) => Promise<CustomTemplate>;
  
  // Favorite block management
  addFavoriteBlock: (templateId: string, templateBlockId: string, accountId: string) => void;
  removeFavoriteBlock: (favoriteId: string) => void;
  reorderFavoriteBlocks: (accountId: string, fromIndex: number, toIndex: number) => void;
  updateFavoritesOrder: (accountId: string, orderedFavorites: FavoriteBlock[]) => void;
  getFavoriteBlocks: (accountId: string) => FavoriteBlock[];
  isFavoriteBlock: (templateId: string, templateBlockId: string, accountId: string) => boolean;
  toggleBlockFavorite: (reflectionId: string, blockId: string) => void;
  autoPopulateFavorites: (date: string, accountId: string) => ReflectionTemplateData;
  
  // Built-in template loading
  loadBuiltInTemplates: () => void;
  
  // Storage management
  loadFromStorage: () => void;
  saveToStorage: () => void;

  // Internal helpers (not part of public API but kept here for typing simplicity)
  _reflectionService?: any;
  _safeSync?: (reflection?: ReflectionTemplateData) => Promise<void>;
  _loadRemote?: () => Promise<void>;
}

export const useReflectionTemplateStore = create<ReflectionTemplateState>()(
  devtools(
    (set, get) => ({
      // --- Remote persistence helpers ---
      _reflectionService: new FirestoreService<ReflectionTemplateData>('reflections'),
      _safeSync: async (reflection?: ReflectionTemplateData) => {
        try {
          if (!reflection) return;
          // Upsert reflection document remotely; Firestore offline persistence will queue if offline
          // @ts-ignore - access private helper via any to keep file small
          const svc: FirestoreService<ReflectionTemplateData> = (get() as any)._reflectionService;
          await svc.setWithId(reflection.id, {
            ...reflection,
            // Serialize dates for Firestore
            createdAt: (reflection.createdAt as any)?.toISOString?.() || reflection.createdAt,
            updatedAt: (reflection.updatedAt as any)?.toISOString?.() || reflection.updatedAt,
            insightBlocks: reflection.insightBlocks.map((b) => ({
              ...b,
              createdAt: (b.createdAt as any)?.toISOString?.() || b.createdAt,
              updatedAt: (b.updatedAt as any)?.toISOString?.() || b.updatedAt,
            })),
          } as any);
        } catch (e) {
          // Auth not ready or user offline; Firestore SDK will retry when possible
          console.warn('[reflections] remote sync deferred:', e);
        }
      },
      _loadRemote: async () => {
        try {
          // @ts-ignore
          const svc: FirestoreService<ReflectionTemplateData> = (get() as any)._reflectionService;
          const remote = await svc.getAll();
          const parsed = remote.map((r) => ({
            ...r,
            createdAt: new Date(r.createdAt),
            updatedAt: new Date(r.updatedAt),
            insightBlocks: (r.insightBlocks || []).map((b: any) => ({
              ...b,
              createdAt: new Date(b.createdAt),
              updatedAt: new Date(b.updatedAt),
            })),
          }));
          set((state) => {
            const byId = new Map<string, any>();
            [...state.reflectionData, ...parsed].forEach((r) => byId.set(r.id, r));
            return { reflectionData: Array.from(byId.values()) };
          });
          get().saveToStorage();
        } catch (e) {
          console.warn('[reflections] failed to load remote (likely unauthenticated):', e);
        }
      },
      customTemplates: [],
      builtInTemplates: [],
      reflectionData: [],
      favoriteBlocks: [],
      selectedTemplateId: null,
      isGeneratingAITemplate: false,

      // Template CRUD
      createCustomTemplate: (templateData) => {
        const newTemplate: CustomTemplate = {
          ...templateData,
          id: generateId(),
          usageCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          customTemplates: [newTemplate, ...state.customTemplates],
        }));

        get().saveToStorage();
        return newTemplate;
      },

      updateCustomTemplate: (id, updates) => {
        set((state) => ({
          customTemplates: state.customTemplates.map((template) =>
            template.id === id
              ? { ...template, ...updates, updatedAt: new Date() }
              : template
          ),
        }));
        get().saveToStorage();
      },

      deleteCustomTemplate: (id) => {
        set((state) => ({
          customTemplates: state.customTemplates.filter((template) => template.id !== id),
        }));
        get().saveToStorage();
      },

      duplicateTemplate: (templateId, newName) => {
        const originalTemplate = get().getTemplateById(templateId);
        if (!originalTemplate) throw new Error('Template not found');

        const duplicatedTemplate = get().createCustomTemplate({
          ...originalTemplate,
          name: newName,
          isDefault: false,
          accountId: originalTemplate.accountId,
          blocks: originalTemplate.blocks.map(block => ({
            ...block,
            id: generateId(),
          })),
        });

        return duplicatedTemplate;
      },

      // Template block management
      addBlockToTemplate: (templateId, blockData) => {
        const newBlock: TemplateBlock = {
          ...blockData,
          id: generateId(),
        };

        set((state) => ({
          customTemplates: state.customTemplates.map((template) =>
            template.id === templateId
              ? {
                  ...template,
                  blocks: [...template.blocks, newBlock],
                  updatedAt: new Date(),
                }
              : template
          ),
        }));
        get().saveToStorage();
      },

      updateTemplateBlock: (templateId, blockId, updates) => {
        set((state) => ({
          customTemplates: state.customTemplates.map((template) =>
            template.id === templateId
              ? {
                  ...template,
                  blocks: template.blocks.map((block) =>
                    block.id === blockId ? { ...block, ...updates } : block
                  ),
                  updatedAt: new Date(),
                }
              : template
          ),
        }));
        get().saveToStorage();
      },

      deleteTemplateBlock: (templateId, blockId) => {
        set((state) => ({
          customTemplates: state.customTemplates.map((template) =>
            template.id === templateId
              ? {
                  ...template,
                  blocks: template.blocks.filter((block) => block.id !== blockId),
                  updatedAt: new Date(),
                }
              : template
          ),
        }));
        get().saveToStorage();
      },

      reorderTemplateBlocks: (templateId, fromIndex, toIndex) => {
        set((state) => ({
          customTemplates: state.customTemplates.map((template) => {
            if (template.id !== templateId) return template;

            const blocks = [...template.blocks];
            const [removed] = blocks.splice(fromIndex, 1);
            blocks.splice(toIndex, 0, removed);

            // Update order values
            const reorderedBlocks = blocks.map((block, index) => ({
              ...block,
              order: index + 1,
            }));

            return {
              ...template,
              blocks: reorderedBlocks,
              updatedAt: new Date(),
            };
          }),
        }));
        get().saveToStorage();
      },

      // Reflection data management
      getReflectionByDate: (date, accountId) => {
        const { reflectionData } = get();
        return reflectionData.find(
          (reflection) => reflection.date === date && reflection.accountId === accountId
        );
      },

      createOrUpdateReflection: (date, accountId, updates = {}) => {
        let reflection = get().getReflectionByDate(date, accountId);

        if (reflection) {
          // Update existing reflection
          set((state) => ({
            reflectionData: state.reflectionData.map((r) =>
              r.id === reflection!.id
                ? { ...r, ...updates, updatedAt: new Date() }
                : r
            ),
          }));
          reflection = { ...reflection, ...updates, updatedAt: new Date() };
        } else {
          // Create new reflection
          reflection = {
            id: generateId(),
            date,
            accountId,
            insightBlocks: [],
            completionScore: 0,
            totalXP: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...updates,
          };

          set((state) => ({
            reflectionData: [reflection!, ...state.reflectionData],
          }));
        }

        get().saveToStorage();
        // Best-effort remote sync
        if (get()._safeSync) {
          get()._safeSync!(reflection);
        }
        return reflection;
      },

      // Insight block management
      addInsightBlock: (reflectionId, blockData) => {
        const newBlock: InsightBlock = {
          ...blockData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          reflectionData: state.reflectionData.map((reflection) =>
            reflection.id === reflectionId
              ? {
                  ...reflection,
                  insightBlocks: [...reflection.insightBlocks, newBlock],
                  updatedAt: new Date(),
                }
              : reflection
          ),
        }));

        get().saveToStorage();
        const updated = get().reflectionData.find((r) => r.id === reflectionId);
        if (get()._safeSync) {
          get()._safeSync!(updated);
        }
        return newBlock;
      },

      updateInsightBlock: (reflectionId, blockId, updates) => {
        set((state) => ({
          reflectionData: state.reflectionData.map((reflection) =>
            reflection.id === reflectionId
              ? {
                  ...reflection,
                  insightBlocks: reflection.insightBlocks.map((block) =>
                    block.id === blockId
                      ? { ...block, ...updates, updatedAt: new Date() }
                      : block
                  ),
                  updatedAt: new Date(),
                }
              : reflection
          ),
        }));
        get().saveToStorage();
        const updated = get().reflectionData.find((r) => r.id === reflectionId);
        if (get()._safeSync) {
          get()._safeSync!(updated);
        }
      },

      deleteInsightBlock: (reflectionId, blockId) => {
        set((state) => ({
          reflectionData: state.reflectionData.map((reflection) =>
            reflection.id === reflectionId
              ? {
                  ...reflection,
                  insightBlocks: reflection.insightBlocks.filter((block) => block.id !== blockId),
                  updatedAt: new Date(),
                }
              : reflection
          ),
        }));
        get().saveToStorage();
        const updated = get().reflectionData.find((r) => r.id === reflectionId);
        if (get()._safeSync) {
          get()._safeSync!(updated);
        }
      },

      reorderInsightBlocks: (reflectionId, fromIndex, toIndex) => {
        set((state) => ({
          reflectionData: state.reflectionData.map((reflection) => {
            if (reflection.id !== reflectionId) return reflection;

            const blocks = [...reflection.insightBlocks];
            const [removed] = blocks.splice(fromIndex, 1);
            blocks.splice(toIndex, 0, removed);

            // Update order values
            const reorderedBlocks = blocks.map((block, index) => ({
              ...block,
              order: index + 1,
            }));

            return {
              ...reflection,
              insightBlocks: reorderedBlocks,
              updatedAt: new Date(),
            };
          }),
        }));
        get().saveToStorage();
      },

      duplicateInsightBlock: (reflectionId, blockId) => {
        const reflection = get().reflectionData.find(r => r.id === reflectionId);
        const originalBlock = reflection?.insightBlocks.find(b => b.id === blockId);
        
        if (!originalBlock) throw new Error('Block not found');

        const duplicatedBlock = get().addInsightBlock(reflectionId, {
          ...originalBlock,
          title: `${originalBlock.title} (Copy)`,
          order: originalBlock.order + 1,
        });

        return duplicatedBlock;
      },

      // Image management for insight blocks
      addImageToBlock: (reflectionId, blockId, imageUrl) => {
        set((state) => ({
          reflectionData: state.reflectionData.map((reflection) =>
            reflection.id === reflectionId
              ? {
                  ...reflection,
                  insightBlocks: reflection.insightBlocks.map((block) =>
                    block.id === blockId
                      ? { 
                          ...block, 
                          images: [...(block.images || []), imageUrl],
                          updatedAt: new Date() 
                        }
                      : block
                  ),
                  updatedAt: new Date(),
                }
              : reflection
          ),
        }));
        get().saveToStorage();
      },

      removeImageFromBlock: (reflectionId, blockId, imageIndex) => {
        set((state) => ({
          reflectionData: state.reflectionData.map((reflection) =>
            reflection.id === reflectionId
              ? {
                  ...reflection,
                  insightBlocks: reflection.insightBlocks.map((block) =>
                    block.id === blockId
                      ? { 
                          ...block, 
                          images: (block.images || []).filter((_, index) => index !== imageIndex),
                          updatedAt: new Date() 
                        }
                      : block
                  ),
                  updatedAt: new Date(),
                }
              : reflection
          ),
        }));
        get().saveToStorage();
      },

      // Tag management for insight blocks
      getAllInsightBlockTags: (accountId) => {
        const { reflectionData } = get();
        const filteredReflections = accountId 
          ? reflectionData.filter(r => r.accountId === accountId)
          : reflectionData;

        const allTags = filteredReflections
          .flatMap(r => r.insightBlocks || [])
          .flatMap(block => block.tags || [])
          .filter(Boolean);

        return [...new Set(allTags)].sort();
      },

      getInsightBlockTagFrequency: (tag, accountId) => {
        const { reflectionData } = get();
        const filteredReflections = accountId 
          ? reflectionData.filter(r => r.accountId === accountId)
          : reflectionData;

        return filteredReflections
          .flatMap(r => r.insightBlocks || [])
          .flatMap(block => block.tags || [])
          .filter(blockTag => blockTag === tag)
          .length;
      },

      // Template analytics
      incrementTemplateUsage: (templateId) => {
        set((state) => ({
          customTemplates: state.customTemplates.map((template) =>
            template.id === templateId
              ? { ...template, usageCount: template.usageCount + 1 }
              : template
          ),
          builtInTemplates: state.builtInTemplates.map((template) =>
            template.id === templateId
              ? { ...template, usageCount: template.usageCount + 1 }
              : template
          ),
        }));
        get().saveToStorage();
      },

      getPopularTemplates: (accountId) => {
        const { customTemplates, builtInTemplates } = get();
        const allTemplates = [...customTemplates, ...builtInTemplates];
        
        return allTemplates
          .filter(template => !accountId || template.accountId === accountId || template.isDefault)
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, 5);
      },

      getTemplateById: (templateId) => {
        const { customTemplates, builtInTemplates } = get();
        return [...customTemplates, ...builtInTemplates].find(t => t.id === templateId);
      },

        // AI template generation
  generateAITemplate: async (context, customPrompt) => {
    set({ isGeneratingAITemplate: true });
    
    try {
      // Import the AI generation function dynamically to avoid circular imports
      const { generateInsightTemplate } = await import('@/lib/ai/generateInsightTemplate');
      const aiTemplate = await generateInsightTemplate(context, customPrompt);

      // Store the generated template as a custom template
      const storedTemplate = get().createCustomTemplate({
        name: aiTemplate.name,
        description: aiTemplate.description,
        emoji: aiTemplate.emoji,
        category: aiTemplate.category,
        accountId: aiTemplate.accountId,
        isDefault: false,
        blocks: aiTemplate.blocks,
      });

      return storedTemplate;
    } catch (error) {
      console.error('Failed to generate AI template:', error);
      throw error;
    } finally {
      set({ isGeneratingAITemplate: false });
    }
  },

      // Favorite block management
      addFavoriteBlock: (templateId, templateBlockId, accountId) => {
        const template = get().getTemplateById(templateId);
        const block = template?.blocks.find(b => b.id === templateBlockId);
        
        if (!template || !block) return;

        // Check if already favorited
        const existingFavorite = get().favoriteBlocks.find(
          f => f.templateId === templateId && f.templateBlockId === templateBlockId && f.accountId === accountId
        );
        
        if (existingFavorite) return;

        const newFavorite: FavoriteBlock = {
          id: generateId(),
          templateId,
          templateBlockId,
          title: block.title,
          prompt: block.prompt,
          emoji: block.emoji,
          order: get().favoriteBlocks.filter(f => f.accountId === accountId).length + 1,
          accountId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          favoriteBlocks: [...state.favoriteBlocks, newFavorite],
        }));

        get().saveToStorage();
      },

      removeFavoriteBlock: (favoriteId) => {
        set((state) => ({
          favoriteBlocks: state.favoriteBlocks.filter(f => f.id !== favoriteId),
        }));
        get().saveToStorage();
      },

      reorderFavoriteBlocks: (accountId, fromIndex, toIndex) => {
        const accountFavorites = get().favoriteBlocks.filter(f => f.accountId === accountId);
        const otherFavorites = get().favoriteBlocks.filter(f => f.accountId !== accountId);
        
        const reorderedFavorites = [...accountFavorites];
        const [removed] = reorderedFavorites.splice(fromIndex, 1);
        reorderedFavorites.splice(toIndex, 0, removed);

        // Update order values
        const updatedFavorites = reorderedFavorites.map((fav, index) => ({
          ...fav,
          order: index + 1,
        }));

        set({
          favoriteBlocks: [...otherFavorites, ...updatedFavorites].sort((a, b) => 
            a.accountId.localeCompare(b.accountId) || a.order - b.order
          ),
        });

        get().saveToStorage();
      },

      updateFavoritesOrder: (accountId, orderedFavorites) => {
        const otherFavorites = get().favoriteBlocks.filter(f => f.accountId !== accountId);
        
        // Update order values for the reordered favorites
        const updatedFavorites = orderedFavorites.map((fav, index) => ({
          ...fav,
          order: index + 1,
        }));

        set({
          favoriteBlocks: [...otherFavorites, ...updatedFavorites].sort((a, b) => 
            a.accountId.localeCompare(b.accountId) || a.order - b.order
          ),
        });

        get().saveToStorage();
      },

      getFavoriteBlocks: (accountId) => {
        return get().favoriteBlocks
          .filter(f => f.accountId === accountId)
          .sort((a, b) => a.order - b.order);
      },

      isFavoriteBlock: (templateId, templateBlockId, accountId) => {
        return get().favoriteBlocks.some(
          f => f.templateId === templateId && f.templateBlockId === templateBlockId && f.accountId === accountId
        );
      },

      toggleBlockFavorite: (reflectionId, blockId) => {
        const reflection = get().reflectionData.find(r => r.id === reflectionId);
        const block = reflection?.insightBlocks.find(b => b.id === blockId);
        
        if (!reflection || !block || !block.templateId || !block.templateBlockId) return;

        const isFavorite = get().isFavoriteBlock(block.templateId, block.templateBlockId, reflection.accountId);
        
        if (isFavorite) {
          // Remove from favorites
          const favoriteToRemove = get().favoriteBlocks.find(
            f => f.templateId === block.templateId && 
                 f.templateBlockId === block.templateBlockId && 
                 f.accountId === reflection.accountId
          );
          if (favoriteToRemove) {
            get().removeFavoriteBlock(favoriteToRemove.id);
          }
        } else {
          // Add to favorites
          get().addFavoriteBlock(block.templateId, block.templateBlockId, reflection.accountId);
        }

        // Update the block's favorite status
        get().updateInsightBlock(reflectionId, blockId, { isFavorite: !isFavorite });
      },

      autoPopulateFavorites: (date, accountId) => {
        const getLocalDayOfWeek = (dateStr: string): number => {
          try {
            const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
            const localDate = new Date(y, (m || 1) - 1, d || 1);
            return localDate.getDay();
          } catch {
            // Fallback to JS parsing if anything goes wrong
            return new Date(dateStr).getDay();
          }
        };
        // Check if reflection already exists for this date
        const existingReflection = get().getReflectionByDate(date, accountId);
        if (existingReflection && existingReflection.insightBlocks.length > 0) {
          // Filter existing blocks based on day type
          const dayOfWeek = getLocalDayOfWeek(date);
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
          
          const filteredBlocks = existingReflection.insightBlocks.filter(block => {
            // If block has no category, keep it on weekdays only (legacy behavior)
            if (!block.category) {
              return !isWeekend;
            }
            
            if (isWeekend) {
              // On weekends, show only 'weekend' and 'general' categories
              return block.category === 'weekend' || block.category === 'general';
            } else {
              // On weekdays, show 'trading' and 'general' categories
              return block.category === 'trading' || block.category === 'general';
            }
          });
          
          // If filtering removed blocks, update the reflection
          if (filteredBlocks.length !== existingReflection.insightBlocks.length) {
            set((state) => ({
              reflectionData: state.reflectionData.map((reflection) =>
                reflection.id === existingReflection.id
                  ? { ...reflection, insightBlocks: filteredBlocks, updatedAt: new Date() }
                  : reflection
              ),
            }));
            get().saveToStorage();
          }

          // If after filtering nothing remains, seed from weekend/weekday favorites
          const allFavorites = get().getFavoriteBlocks(accountId);
          const filteredFavorites = allFavorites.filter(fav => {
            const t = get().getTemplateById(fav.templateId);
            const tb = t?.blocks.find(b => b.id === fav.templateBlockId);
            if (!tb || !tb.category) return !isWeekend; // legacy: weekdays only
            return isWeekend
              ? (tb.category === 'weekend' || tb.category === 'general')
              : (tb.category === 'trading' || tb.category === 'general');
          });

          if (filteredBlocks.length === 0 && filteredFavorites.length > 0) {
            filteredFavorites.forEach((favorite, index) => {
              const t = get().getTemplateById(favorite.templateId);
              const tb = t?.blocks.find(b => b.id === favorite.templateBlockId);
              if (t && tb) {
                get().addInsightBlock(existingReflection.id, {
                  title: favorite.title,
                  content: '',
                  tags: [],
                  emoji: favorite.emoji,
                  xpEarned: 0,
                  order: index + 1,
                  isExpanded: index === 0,
                  templateId: favorite.templateId,
                  templateBlockId: favorite.templateBlockId,
                  isFavorite: true,
                  category: tb.category,
                });
              }
            });
            get().saveToStorage();
            return get().getReflectionByDate(date, accountId)!;
          }

          return { ...existingReflection, insightBlocks: filteredBlocks };
        }

        // Determine if this is a weekend day
        const dayOfWeek = getLocalDayOfWeek(date);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

        // Get user's favorite blocks
        let allFavorites = get().getFavoriteBlocks(accountId);
        
        // If it's weekend and user has no favorites yet, seed a sensible default set
        if (isWeekend && allFavorites.length === 0) {
          const defaultSeedPairs: Array<[string, string]> = [
            ['week-planning', 'week-review'],
            ['week-planning', 'next-week-focus'],
            ['learning-development', 'study-session'],
            ['personal-wellness', 'wellness-check'],
          ];
          defaultSeedPairs.forEach(([templateId, blockId]) => {
            const tpl = get().getTemplateById(templateId as any);
            const has = tpl?.blocks.find(b => b.id === blockId);
            if (has) {
              get().addFavoriteBlock(templateId as any, blockId as any, accountId);
            }
          });
          allFavorites = get().getFavoriteBlocks(accountId);
        }
        
        // Filter favorites based on day type
        const filteredFavorites = allFavorites.filter(favorite => {
          const template = get().getTemplateById(favorite.templateId);
          const templateBlock = template?.blocks.find(b => b.id === favorite.templateBlockId);
          
          if (!templateBlock || !templateBlock.category) {
            // If no category is specified, show on weekdays only (legacy behavior)
            return !isWeekend;
          }
          
          if (isWeekend) {
            // On weekends, show only 'weekend' and 'general' categories
            return templateBlock.category === 'weekend' || templateBlock.category === 'general';
          } else {
            // On weekdays, show 'trading' and 'general' categories
            return templateBlock.category === 'trading' || templateBlock.category === 'general';
          }
        });
        
        if (filteredFavorites.length === 0) {
          // No applicable favorites, just return empty reflection
          return get().createOrUpdateReflection(date, accountId);
        }

        // Create or get the reflection
        const reflection = get().createOrUpdateReflection(date, accountId);

        // Add filtered favorite blocks as insight blocks
        filteredFavorites.forEach((favorite, index) => {
          const template = get().getTemplateById(favorite.templateId);
          const templateBlock = template?.blocks.find(b => b.id === favorite.templateBlockId);
          
          if (template && templateBlock) {
            get().addInsightBlock(reflection.id, {
              title: favorite.title,
              content: '',
              tags: [],
              emoji: favorite.emoji,
              xpEarned: 0,
              order: index + 1,
              isExpanded: index === 0, // Expand first block by default
              templateId: favorite.templateId,
              templateBlockId: favorite.templateBlockId,
              isFavorite: true,
              category: templateBlock.category, // Include category in the insight block
            });
          }
        });

        return get().getReflectionByDate(date, accountId)!;
      },

      // Built-in templates
      loadBuiltInTemplates: () => {
        try {
          const templates = insightTemplatesData.builtInTemplates.map((template: any) => ({
            ...template,
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            accountId: 'default', // Built-in templates are global
          }));
          
          set({ builtInTemplates: templates });
        } catch (error) {
          console.error('Failed to load built-in templates:', error);
        }
      },

      // Storage management
      loadFromStorage: () => {
        try {
          const storedCustomTemplates = localStorage.getItem(`${STORAGE_KEYS.DAILY_REFLECTIONS}_custom_templates`, []);
          const storedReflectionData = localStorage.getItem(`${STORAGE_KEYS.DAILY_REFLECTIONS}_template_data`, []);
          const storedFavoriteBlocks = localStorage.getItem(`${STORAGE_KEYS.DAILY_REFLECTIONS}_favorite_blocks`, []);
          
          if (storedCustomTemplates.length > 0) {
            const parsedTemplates = storedCustomTemplates.map((template: any) => ({
              ...template,
              createdAt: new Date(template.createdAt),
              updatedAt: new Date(template.updatedAt),
            }));
            set({ customTemplates: parsedTemplates });
          }

          if (storedReflectionData.length > 0) {
            const parsedReflectionData = storedReflectionData.map((reflection: any) => ({
              ...reflection,
              createdAt: new Date(reflection.createdAt),
              updatedAt: new Date(reflection.updatedAt),
              insightBlocks: reflection.insightBlocks.map((block: any) => ({
                ...block,
                createdAt: new Date(block.createdAt),
                updatedAt: new Date(block.updatedAt),
              })),
            }));
            // Merge with any in-memory data (e.g., preloaded from server) by id to avoid overwrites
            set((state) => {
              const byId = new Map<string, any>();
              [...parsedReflectionData, ...state.reflectionData].forEach((r) => byId.set(r.id, r));
              return { reflectionData: Array.from(byId.values()) };
            });
          }

          if (storedFavoriteBlocks.length > 0) {
            const parsedFavoriteBlocks = storedFavoriteBlocks.map((favorite: any) => ({
              ...favorite,
              createdAt: new Date(favorite.createdAt),
              updatedAt: new Date(favorite.updatedAt),
            }));
            set({ favoriteBlocks: parsedFavoriteBlocks });
          }
          // Kick off best-effort remote fetch to merge any existing cloud data
          // @ts-ignore
          get()._loadRemote?.();
        } catch (error) {
          console.error('Failed to load reflection template data from storage:', error);
        }
      },

      saveToStorage: () => {
        try {
          const { customTemplates, reflectionData, favoriteBlocks } = get();
          localStorage.setItem(`${STORAGE_KEYS.DAILY_REFLECTIONS}_custom_templates`, customTemplates);
          localStorage.setItem(`${STORAGE_KEYS.DAILY_REFLECTIONS}_template_data`, reflectionData);
          localStorage.setItem(`${STORAGE_KEYS.DAILY_REFLECTIONS}_favorite_blocks`, favoriteBlocks);
        } catch (error) {
          console.error('Failed to save reflection template data to storage:', error);
        }
      },
    }),
    {
      name: 'reflection-template-store',
    }
  )
);

// Initialize built-in templates and load from storage on store creation
useReflectionTemplateStore.getState().loadBuiltInTemplates();
useReflectionTemplateStore.getState().loadFromStorage();