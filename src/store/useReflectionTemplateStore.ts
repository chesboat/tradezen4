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
}

export const useReflectionTemplateStore = create<ReflectionTemplateState>()(
  devtools(
    (set, get) => ({
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
        // Check if reflection already exists for this date
        const existingReflection = get().getReflectionByDate(date, accountId);
        if (existingReflection && existingReflection.insightBlocks.length > 0) {
          return existingReflection;
        }

        // Get user's favorite blocks
        const favorites = get().getFavoriteBlocks(accountId);
        
        if (favorites.length === 0) {
          // No favorites, just return empty reflection
          return get().createOrUpdateReflection(date, accountId);
        }

        // Create or get the reflection
        const reflection = get().createOrUpdateReflection(date, accountId);

        // Add favorite blocks as insight blocks
        favorites.forEach((favorite, index) => {
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
            set({ reflectionData: parsedReflectionData });
          }

          if (storedFavoriteBlocks.length > 0) {
            const parsedFavoriteBlocks = storedFavoriteBlocks.map((favorite: any) => ({
              ...favorite,
              createdAt: new Date(favorite.createdAt),
              updatedAt: new Date(favorite.updatedAt),
            }));
            set({ favoriteBlocks: parsedFavoriteBlocks });
          }
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