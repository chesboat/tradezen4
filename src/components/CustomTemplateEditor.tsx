import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Plus,
  Save,
  X,
  GripVertical,
  Trash2,
  Copy,
  Settings,
  FileText,
  Lightbulb,
  Star,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Wand2,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useReflectionTemplateStore } from '@/store/useReflectionTemplateStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { CustomTemplate, TemplateBlock } from '@/types';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/localStorageUtils';

interface CustomTemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  editingTemplate?: CustomTemplate | null;
  className?: string;
}

interface TemplateFormData {
  name: string;
  description: string;
  emoji: string;
  category: 'mindset' | 'performance' | 'learning' | 'custom';
  isDefault: boolean;
  blocks: TemplateBlock[];
}

const DEFAULT_FORM_DATA: TemplateFormData = {
  name: '',
  description: '',
  emoji: '📝',
  category: 'custom',
  isDefault: false,
  blocks: [],
};

const CATEGORY_OPTIONS = [
  { value: 'mindset', label: 'Mindset & Psychology', emoji: '🧠' },
  { value: 'performance', label: 'Performance Analysis', emoji: '📊' },
  { value: 'learning', label: 'Learning & Growth', emoji: '📚' },
  { value: 'custom', label: 'Custom Category', emoji: '⚙️' },
];

const EMOJI_SUGGESTIONS = [
  '📝', '🎯', '🧠', '💡', '📊', '🔍', '⭐', '🚀', '💪', '🏆',
  '📚', '⚡', '🎭', '🔄', '📈', '💰', '🛡️', '🎨', '🌟', '🔥',
  '💎', '🎪', '🌈', '🎲', '🎵', '🎸', '🎨', '🎭', '🎪', '🎯'
];

export const CustomTemplateEditor: React.FC<CustomTemplateEditorProps> = ({
  isOpen,
  onClose,
  editingTemplate,
  className,
}) => {
  const { selectedAccountId } = useAccountFilterStore();
  const {
    createCustomTemplate,
    updateCustomTemplate,
    duplicateTemplate,
  } = useReflectionTemplateStore();

  const [formData, setFormData] = useState<TemplateFormData>(DEFAULT_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize form data when editing template changes
  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        name: editingTemplate.name || '',
        description: editingTemplate.description || '',
        emoji: editingTemplate.emoji || '📝',
        category: editingTemplate.category || 'trading',
        isDefault: editingTemplate.isDefault || false,
        blocks: editingTemplate.blocks ? [...editingTemplate.blocks] : [],
      });
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
    setErrors({});
    setIsDirty(false);
  }, [editingTemplate, isOpen]);

  // Track form changes
  useEffect(() => {
    if (isOpen) {
      setIsDirty(true);
    }
  }, [formData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (formData.blocks.length === 0) {
      newErrors.blocks = 'At least one block is required';
    }

    formData.blocks.forEach((block, index) => {
      if (!block.title.trim()) {
        newErrors[`block_${index}_title`] = 'Block title is required';
      }
      if (!block.prompt.trim()) {
        newErrors[`block_${index}_prompt`] = 'Block prompt is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !selectedAccountId) return;

    setIsSaving(true);
    try {
      const templateData = {
        ...formData,
        accountId: selectedAccountId,
        blocks: formData.blocks.map((block, index) => ({
          ...block,
          order: index + 1,
        })),
      };

      if (editingTemplate) {
        updateCustomTemplate(editingTemplate.id, templateData);
      } else {
        createCustomTemplate(templateData);
      }

      setIsDirty(false);
      onClose();
    } catch (error) {
      console.error('Failed to save template:', error);
      setErrors({ general: 'Failed to save template. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!editingTemplate || !selectedAccountId) return;

    try {
      const duplicatedTemplate = duplicateTemplate(
        editingTemplate.id,
        `${editingTemplate.name} (Copy)`
      );
      
      // Switch to editing the duplicated template
      setFormData({
        name: duplicatedTemplate.name,
        description: duplicatedTemplate.description || '',
        emoji: duplicatedTemplate.emoji || '📝',
        category: duplicatedTemplate.category,
        isDefault: duplicatedTemplate.isDefault,
        blocks: [...duplicatedTemplate.blocks],
      });
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const addBlock = () => {
    const newBlock: TemplateBlock = {
      id: generateId(),
      title: 'New Block',
      prompt: 'What insights can you capture here?',
      emoji: '💭',
      order: formData.blocks.length + 1,
      isRequired: false,
      placeholder: 'Enter your thoughts...',
    };

    setFormData(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
  };

  const updateBlock = (blockId: string, updates: Partial<TemplateBlock>) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      ),
    }));
  };

  const deleteBlock = (blockId: string) => {
    setFormData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(block => block.id !== blockId),
    }));
  };

  const reorderBlocks = (newOrder: TemplateBlock[]) => {
    setFormData(prev => ({
      ...prev,
      blocks: newOrder.map((block, index) => ({
        ...block,
        order: index + 1,
      })),
    }));
  };

  const duplicateBlock = (blockId: string) => {
    const originalBlock = formData.blocks.find(b => b.id === blockId);
    if (!originalBlock) return;

    const duplicatedBlock: TemplateBlock = {
      ...originalBlock,
      id: generateId(),
      title: `${originalBlock.title} (Copy)`,
      order: originalBlock.order + 1,
    };

    setFormData(prev => ({
      ...prev,
      blocks: [
        ...prev.blocks.slice(0, originalBlock.order),
        duplicatedBlock,
        ...prev.blocks.slice(originalBlock.order),
      ].map((block, index) => ({ ...block, order: index + 1 })),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn(
          "bg-background border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Design custom reflection templates for different scenarios
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {editingTemplate && (
              <motion.button
                onClick={handleDuplicate}
                className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </motion.button>
            )}
            
            <motion.button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              Preview
            </motion.button>

            <motion.button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 min-h-0">
          {/* Form Panel */}
          <div className={cn(
            "flex-1 overflow-y-auto",
            showPreview && "border-r border-border"
          )}>
            <div className="p-6 space-y-6 pb-8">
              {/* General Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Template Information
                </h3>

                {/* Name and Emoji */}
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-2">Emoji</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.emoji}
                        onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
                        className="w-full text-center text-2xl bg-background border border-border rounded-lg p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        maxLength={2}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {EMOJI_SUGGESTIONS.slice(0, 6).map((emoji) => (
                        <motion.button
                          key={emoji}
                          onClick={() => setFormData(prev => ({ ...prev, emoji }))}
                          className="w-8 h-8 text-lg hover:bg-muted rounded transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {emoji}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-10">
                    <label className="block text-sm font-medium mb-2">Template Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Daily Win Analysis, Loss Recovery Session"
                      className={cn(
                        "w-full bg-background border border-border rounded-lg p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                        errors.name && "border-red-500"
                      )}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of when to use this template..."
                    className="w-full bg-background border border-border rounded-lg p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    rows={2}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORY_OPTIONS.map((option) => (
                      <motion.button
                        key={option.value}
                        onClick={() => setFormData(prev => ({ ...prev, category: option.value as any }))}
                        className={cn(
                          "flex items-center gap-3 p-3 border rounded-lg transition-all text-left",
                          formData.category === option.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-muted-foreground hover:bg-muted/50"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-lg">{option.emoji}</span>
                        <span className="font-medium text-sm">{option.label}</span>
                        {formData.category === option.value && (
                          <Check className="w-4 h-4 ml-auto" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Template Blocks */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Template Blocks
                  </h3>
                  <motion.button
                    onClick={addBlock}
                    className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Block
                  </motion.button>
                </div>

                {errors.blocks && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.blocks}
                  </p>
                )}

                <Reorder.Group
                  axis="y"
                  values={formData.blocks}
                  onReorder={reorderBlocks}
                  className="space-y-3"
                >
                  {formData.blocks.map((block, index) => (
                    <Reorder.Item
                      key={block.id}
                      value={block}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <TemplateBlockEditor
                        block={block}
                        index={index}
                        onUpdate={(updates) => updateBlock(block.id, updates)}
                        onDelete={() => deleteBlock(block.id)}
                        onDuplicate={() => duplicateBlock(block.id)}
                        errors={errors}
                      />
                    </Reorder.Item>
                  ))}
                </Reorder.Group>

                {formData.blocks.length === 0 && (
                  <div className="text-center py-8 px-6 bg-muted/20 rounded-lg border border-dashed border-border">
                    <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No blocks added yet</p>
                    <motion.button
                      onClick={addBlock}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors mx-auto"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Your First Block
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: '50%', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="bg-muted/10 overflow-y-auto"
              >
                <div className="p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Template Preview
                  </h4>
                  <TemplatePreview formData={formData} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isDirty && (
              <>
                <div className="w-2 h-2 bg-orange-400 rounded-full" />
                <span>Unsaved changes</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={handleSave}
              disabled={isSaving || !formData.name.trim() || formData.blocks.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isSaving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Settings className="w-4 h-4" />
                </motion.div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Template Block Editor Component
interface TemplateBlockEditorProps {
  block: TemplateBlock;
  index: number;
  onUpdate: (updates: Partial<TemplateBlock>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  errors: Record<string, string>;
}

const TemplateBlockEditor: React.FC<TemplateBlockEditorProps> = ({
  block,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  errors,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      layout
      className="bg-background border border-border rounded-lg overflow-hidden"
    >
      {/* Block Header */}
      <div className="flex items-center gap-3 p-4 bg-muted/20 border-b border-border">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
        
        <div className="flex items-center gap-2 flex-1">
          <input
            type="text"
            value={block.emoji}
            onChange={(e) => onUpdate({ emoji: e.target.value })}
            className="w-8 text-center bg-transparent border-none outline-none text-lg"
            maxLength={2}
          />
          <input
            type="text"
            value={block.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            placeholder="Block title"
            className={cn(
              "flex-1 bg-transparent border-none outline-none font-medium focus:ring-2 focus:ring-primary/20 rounded px-2 py-1",
              errors[`block_${index}_title`] && "bg-red-50 border border-red-200"
            )}
          />
        </div>

        <div className="flex items-center gap-1">
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-muted rounded transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isExpanded ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          </motion.button>
          
          <motion.button
            onClick={onDuplicate}
            className="p-1 hover:bg-muted rounded transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Copy className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            onClick={onDelete}
            className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Block Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium mb-2">Reflection Prompt</label>
                <textarea
                  value={block.prompt}
                  onChange={(e) => onUpdate({ prompt: e.target.value })}
                  placeholder="What question or prompt will guide this reflection?"
                  className={cn(
                    "w-full bg-background border border-border rounded-lg p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none",
                    errors[`block_${index}_prompt`] && "border-red-500"
                  )}
                  rows={3}
                />
                {errors[`block_${index}_prompt`] && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors[`block_${index}_prompt`]}
                  </p>
                )}
              </div>

              {/* Placeholder */}
              <div>
                <label className="block text-sm font-medium mb-2">Placeholder Text (Optional)</label>
                <input
                  type="text"
                  value={block.placeholder || ''}
                  onChange={(e) => onUpdate({ placeholder: e.target.value })}
                  placeholder="Hint text to help users get started..."
                  className="w-full bg-background border border-border rounded-lg p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Options */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={block.isRequired}
                    onChange={(e) => onUpdate({ isRequired: e.target.checked })}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary/20"
                  />
                  <span className="text-sm font-medium">Required Block</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Template Preview Component
interface TemplatePreviewProps {
  formData: TemplateFormData;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ formData }) => {
  return (
    <div className="space-y-4">
      {/* Template Header */}
      <div className="p-4 bg-background border border-border rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{formData.emoji}</span>
          <h3 className="font-semibold text-lg">{formData.name || 'Untitled Template'}</h3>
        </div>
        {formData.description && (
          <p className="text-sm text-muted-foreground">{formData.description}</p>
        )}
        <div className="mt-2 flex items-center gap-2">
          <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
            {CATEGORY_OPTIONS.find(c => c.value === formData.category)?.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {formData.blocks.length} block{formData.blocks.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Template Blocks Preview */}
      <div className="space-y-3">
        {formData.blocks.map((block, index) => (
          <div key={block.id} className="p-3 bg-background border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{block.emoji}</span>
              <h4 className="font-medium">{block.title}</h4>
              {block.isRequired && (
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Required</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{block.prompt}</p>
            <div className="w-full h-16 bg-muted/30 rounded border border-dashed border-border flex items-center justify-center">
              <span className="text-xs text-muted-foreground">
                {block.placeholder || 'Reflection content will appear here...'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {formData.blocks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Add blocks to see the template preview</p>
        </div>
      )}
    </div>
  );
};