import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Tag colors - Apple Calendar style
 */
export const TAG_COLORS = {
  blue: { bg: 'bg-blue-500/15', text: 'text-blue-600', border: 'border-blue-500/30', hex: '#3B82F6' },
  purple: { bg: 'bg-purple-500/15', text: 'text-purple-600', border: 'border-purple-500/30', hex: '#A855F7' },
  green: { bg: 'bg-green-500/15', text: 'text-green-600', border: 'border-green-500/30', hex: '#22C55E' },
  orange: { bg: 'bg-orange-500/15', text: 'text-orange-600', border: 'border-orange-500/30', hex: '#F97316' },
  red: { bg: 'bg-red-500/15', text: 'text-red-600', border: 'border-red-500/30', hex: '#EF4444' },
  pink: { bg: 'bg-pink-500/15', text: 'text-pink-600', border: 'border-pink-500/30', hex: '#EC4899' },
  yellow: { bg: 'bg-yellow-500/15', text: 'text-yellow-600', border: 'border-yellow-500/30', hex: '#EAB308' },
  gray: { bg: 'bg-gray-500/15', text: 'text-gray-600', border: 'border-gray-500/30', hex: '#6B7280' },
} as const;

export type TagColor = keyof typeof TAG_COLORS;

export interface TagMetadata {
  name: string; // lowercase, normalized
  displayName: string; // original case
  color: TagColor;
  createdAt: string;
  usageCount: number;
}

interface TagState {
  tags: Record<string, TagMetadata>; // key is normalized lowercase name
  
  // Actions
  getOrCreateTag: (tagName: string, color?: TagColor) => TagMetadata;
  updateTagColor: (tagName: string, color: TagColor) => void;
  renameTag: (oldName: string, newName: string) => void;
  deleteTag: (tagName: string) => void;
  incrementUsage: (tagName: string) => void;
  getAllTags: () => TagMetadata[];
  getTagsByUsage: () => TagMetadata[];
  getTagColor: (tagName: string) => TagColor;
  suggestTags: (query: string, limit?: number) => TagMetadata[];
}

/**
 * Normalize tag name (lowercase, trim, remove #)
 */
const normalizeTagName = (name: string): string => {
  return name.toLowerCase().trim().replace(/^#/, '');
};

/**
 * Auto-assign color based on tag name (common patterns)
 */
const autoAssignColor = (tagName: string): TagColor => {
  const normalized = normalizeTagName(tagName);
  
  // Common setup patterns
  if (normalized.includes('breakout') || normalized.includes('break')) return 'blue';
  if (normalized.includes('reversal') || normalized.includes('bounce')) return 'purple';
  if (normalized.includes('momentum') || normalized.includes('trend')) return 'green';
  if (normalized.includes('scalp') || normalized.includes('quick')) return 'orange';
  if (normalized.includes('swing') || normalized.includes('hold')) return 'pink';
  if (normalized.includes('gap') || normalized.includes('open')) return 'yellow';
  
  // Default colors by first letter (for variety)
  const firstChar = normalized.charCodeAt(0);
  const colors: TagColor[] = ['blue', 'purple', 'green', 'orange', 'red', 'pink', 'yellow', 'gray'];
  return colors[firstChar % colors.length];
};

export const useTagStore = create<TagState>()(
  persist(
    (set, get) => ({
      tags: {},

      getOrCreateTag: (tagName: string, color?: TagColor) => {
        const normalized = normalizeTagName(tagName);
        const existing = get().tags[normalized];
        
        if (existing) {
          return existing;
        }
        
        // Create new tag
        const newTag: TagMetadata = {
          name: normalized,
          displayName: tagName.trim().replace(/^#/, ''),
          color: color || autoAssignColor(tagName),
          createdAt: new Date().toISOString(),
          usageCount: 0,
        };
        
        set((state) => ({
          tags: { ...state.tags, [normalized]: newTag },
        }));
        
        return newTag;
      },

      updateTagColor: (tagName: string, color: TagColor) => {
        const normalized = normalizeTagName(tagName);
        const tag = get().tags[normalized];
        
        if (tag) {
          set((state) => ({
            tags: {
              ...state.tags,
              [normalized]: { ...tag, color },
            },
          }));
        }
      },

      renameTag: (oldName: string, newName: string) => {
        const oldNormalized = normalizeTagName(oldName);
        const newNormalized = normalizeTagName(newName);
        const tag = get().tags[oldNormalized];
        
        if (tag && oldNormalized !== newNormalized) {
          const updatedTag = {
            ...tag,
            name: newNormalized,
            displayName: newName.trim().replace(/^#/, ''),
          };
          
          set((state) => {
            const { [oldNormalized]: removed, ...rest } = state.tags;
            return {
              tags: { ...rest, [newNormalized]: updatedTag },
            };
          });
        }
      },

      deleteTag: (tagName: string) => {
        const normalized = normalizeTagName(tagName);
        
        set((state) => {
          const { [normalized]: removed, ...rest } = state.tags;
          return { tags: rest };
        });
      },

      incrementUsage: (tagName: string) => {
        const normalized = normalizeTagName(tagName);
        const tag = get().tags[normalized];
        
        if (tag) {
          set((state) => ({
            tags: {
              ...state.tags,
              [normalized]: {
                ...tag,
                usageCount: tag.usageCount + 1,
              },
            },
          }));
        }
      },

      getAllTags: () => {
        return Object.values(get().tags).sort((a, b) => 
          a.displayName.localeCompare(b.displayName)
        );
      },

      getTagsByUsage: () => {
        return Object.values(get().tags).sort((a, b) => 
          b.usageCount - a.usageCount
        );
      },

      getTagColor: (tagName: string) => {
        const normalized = normalizeTagName(tagName);
        const tag = get().tags[normalized];
        return tag?.color || 'gray';
      },

      suggestTags: (query: string, limit = 5) => {
        const normalized = normalizeTagName(query);
        
        if (!normalized) {
          // No query - return most used tags
          return get().getTagsByUsage().slice(0, limit);
        }
        
        // Fuzzy match on tag names
        const allTags = get().getAllTags();
        const matches = allTags.filter(tag => 
          tag.name.includes(normalized) || 
          tag.displayName.toLowerCase().includes(normalized)
        );
        
        // Sort by usage count
        return matches
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, limit);
      },
    }),
    {
      name: 'tag-store',
    }
  )
);

