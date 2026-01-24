/**
 * ClassificationManager - Settings UI for managing classification categories
 * Allows users to create, edit, reorder, and delete categories and their options
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  MoreVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClassificationStore } from '@/store/useClassificationStore';
import { ClassificationCategory, ClassificationOption } from '@/types';

interface ClassificationManagerProps {
  className?: string;
}

// Common emojis for quick selection
const COMMON_EMOJIS = ['📅', '📊', '📈', '🕯️', '⏰', '🎯', '💰', '🔥', '⚡', '🌙', '☀️', '🌤️'];

export const ClassificationManager: React.FC<ClassificationManagerProps> = ({ className }) => {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    addOption,
    updateOption,
    deleteOption,
  } = useClassificationStore();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order);

  const toggleExpand = useCallback((categoryId: string) => {
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

  const handleAddCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;

    await addCategory({
      name: newCategoryName.trim(),
      emoji: '📊',
      options: [],
      isActive: true,
    });

    setNewCategoryName('');
    setShowNewCategoryForm(false);
  }, [newCategoryName, addCategory]);

  const handleReorder = useCallback((newOrder: ClassificationCategory[]) => {
    reorderCategories(newOrder.map(c => c.id));
  }, [reorderCategories]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Classification Categories</h3>
          <p className="text-sm text-muted-foreground">
            Organize your trades by custom categories
          </p>
        </div>
        <button
          onClick={() => setShowNewCategoryForm(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
                   bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* New Category Form */}
      <AnimatePresence>
        {showNewCategoryForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Category name..."
                  autoFocus
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background
                           text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCategory();
                    if (e.key === 'Escape') setShowNewCategoryForm(false);
                  }}
                />
                <button
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowNewCategoryForm(false);
                    setNewCategoryName('');
                  }}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category List */}
      <Reorder.Group
        axis="y"
        values={sortedCategories}
        onReorder={handleReorder}
        className="space-y-2"
      >
        {sortedCategories.map((category) => (
          <CategoryItem
            key={category.id}
            category={category}
            isExpanded={expandedCategories.has(category.id)}
            onToggleExpand={() => toggleExpand(category.id)}
            isEditing={editingCategoryId === category.id}
            onEdit={() => setEditingCategoryId(category.id)}
            onSaveEdit={() => setEditingCategoryId(null)}
            onDelete={() => deleteCategory(category.id)}
            onUpdateCategory={updateCategory}
            onAddOption={addOption}
            onUpdateOption={updateOption}
            onDeleteOption={deleteOption}
            editingOptionId={editingOptionId}
            onEditOption={setEditingOptionId}
          />
        ))}
      </Reorder.Group>

      {/* Empty State */}
      {categories.length === 0 && !showNewCategoryForm && (
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h4 className="font-semibold mb-2">No Categories Yet</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Create categories to classify your trades by setup, time, or any criteria.
          </p>
          <button
            onClick={() => setShowNewCategoryForm(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg
                     bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Create First Category
          </button>
        </div>
      )}
    </div>
  );
};

// Individual category item
interface CategoryItemProps {
  category: ClassificationCategory;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isEditing: boolean;
  onEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onUpdateCategory: (id: string, updates: Partial<ClassificationCategory>) => void;
  onAddOption: (categoryId: string, option: Omit<ClassificationOption, 'id' | 'order'>) => void;
  onUpdateOption: (categoryId: string, optionId: string, updates: Partial<ClassificationOption>) => void;
  onDeleteOption: (categoryId: string, optionId: string) => void;
  editingOptionId: string | null;
  onEditOption: (optionId: string | null) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  isExpanded,
  onToggleExpand,
  isEditing,
  onEdit,
  onSaveEdit,
  onDelete,
  onUpdateCategory,
  onAddOption,
  onUpdateOption,
  onDeleteOption,
  editingOptionId,
  onEditOption,
}) => {
  const [editName, setEditName] = useState(category.name);
  const [editEmoji, setEditEmoji] = useState(category.emoji || '');
  const [newOptionName, setNewOptionName] = useState('');
  const [showNewOption, setShowNewOption] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleSave = useCallback(() => {
    onUpdateCategory(category.id, {
      name: editName,
      emoji: editEmoji,
    });
    onSaveEdit();
  }, [category.id, editName, editEmoji, onUpdateCategory, onSaveEdit]);

  const handleAddOption = useCallback(() => {
    if (!newOptionName.trim()) return;
    onAddOption(category.id, {
      name: newOptionName.trim(),
      emoji: '',
    });
    setNewOptionName('');
    setShowNewOption(false);
  }, [category.id, newOptionName, onAddOption]);

  return (
    <Reorder.Item
      value={category}
      className="list-none"
    >
      <div className={cn(
        "rounded-xl border transition-colors",
        isExpanded ? "border-primary/30 bg-card" : "border-border bg-card/50 hover:bg-card"
      )}>
        {/* Category Header */}
        <div className="flex items-center gap-2 p-3">
          {/* Drag Handle */}
          <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Emoji & Name */}
          {isEditing ? (
            <div className="flex-1 flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg
                           hover:bg-muted/80 transition-colors"
                >
                  {editEmoji || '📊'}
                </button>
                {showEmojiPicker && (
                  <div className="absolute top-full mt-1 left-0 z-50 p-2 rounded-lg border border-border bg-popover shadow-lg">
                    <div className="grid grid-cols-6 gap-1">
                      {COMMON_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setEditEmoji(emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="w-8 h-8 rounded hover:bg-muted transition-colors text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
                className="flex-1 px-2 py-1 rounded-lg border border-border bg-background text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') onSaveEdit();
                }}
              />
              <button
                onClick={handleSave}
                className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={onSaveEdit}
                className="p-1.5 rounded-lg hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={onToggleExpand}
                className="flex-1 flex items-center gap-2 text-left"
              >
                <span className="text-xl">{category.emoji}</span>
                <span className="font-medium">{category.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({category.options.length} options)
                </span>
              </button>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateCategory(category.id, { isActive: !category.isActive })}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    category.isActive ? "text-primary hover:bg-muted" : "text-muted-foreground hover:bg-muted"
                  )}
                  title={category.isActive ? "Active" : "Inactive"}
                >
                  {category.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={onEdit}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onToggleExpand}
                  className="p-1.5 rounded-lg hover:bg-muted"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Options List */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-1 border-t border-border/50">
                <div className="space-y-1">
                  {category.options
                    .sort((a, b) => a.order - b.order)
                    .map((option) => (
                      <OptionItem
                        key={option.id}
                        option={option}
                        categoryId={category.id}
                        isEditing={editingOptionId === option.id}
                        onEdit={() => onEditOption(option.id)}
                        onSaveEdit={() => onEditOption(null)}
                        onUpdate={(updates) => onUpdateOption(category.id, option.id, updates)}
                        onDelete={() => onDeleteOption(category.id, option.id)}
                      />
                    ))}
                </div>

                {/* Add Option */}
                {showNewOption ? (
                  <div className="flex items-center gap-2 mt-2 pl-6">
                    <input
                      type="text"
                      value={newOptionName}
                      onChange={(e) => setNewOptionName(e.target.value)}
                      placeholder="Option name..."
                      autoFocus
                      className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-sm
                               focus:outline-none focus:ring-2 focus:ring-primary/50"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddOption();
                        if (e.key === 'Escape') {
                          setShowNewOption(false);
                          setNewOptionName('');
                        }
                      }}
                    />
                    <button
                      onClick={handleAddOption}
                      disabled={!newOptionName.trim()}
                      className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setShowNewOption(false);
                        setNewOptionName('');
                      }}
                      className="p-1.5 rounded-lg hover:bg-muted"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewOption(true)}
                    className="flex items-center gap-1.5 mt-2 px-2 py-1.5 text-sm text-muted-foreground
                             hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add option
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reorder.Item>
  );
};

// Individual option item
interface OptionItemProps {
  option: ClassificationOption;
  categoryId: string;
  isEditing: boolean;
  onEdit: () => void;
  onSaveEdit: () => void;
  onUpdate: (updates: Partial<ClassificationOption>) => void;
  onDelete: () => void;
}

const OptionItem: React.FC<OptionItemProps> = ({
  option,
  categoryId,
  isEditing,
  onEdit,
  onSaveEdit,
  onUpdate,
  onDelete,
}) => {
  const [editName, setEditName] = useState(option.name);
  const [editEmoji, setEditEmoji] = useState(option.emoji || '');

  const handleSave = useCallback(() => {
    onUpdate({
      name: editName,
      emoji: editEmoji,
    });
    onSaveEdit();
  }, [editName, editEmoji, onUpdate, onSaveEdit]);

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 py-1 pl-6">
        <input
          type="text"
          value={editEmoji}
          onChange={(e) => setEditEmoji(e.target.value)}
          placeholder="🔹"
          className="w-10 px-2 py-1 rounded-lg border border-border bg-background text-sm text-center
                   focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          autoFocus
          className="flex-1 px-2 py-1 rounded-lg border border-border bg-background text-sm
                   focus:outline-none focus:ring-2 focus:ring-primary/50"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') onSaveEdit();
          }}
        />
        <button
          onClick={handleSave}
          className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={onSaveEdit} className="p-1 rounded hover:bg-muted">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 py-1.5 pl-6 hover:bg-muted/50 rounded-lg transition-colors">
      <span className="text-sm">{option.emoji || '•'}</span>
      <span className="flex-1 text-sm">{option.name}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default ClassificationManager;
