import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Layers, // Used for Insight Blocks icon
  Settings,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';

import { ReflectionTemplateManager } from './ReflectionTemplateManager';
import { CustomTemplateEditor } from './CustomTemplateEditor';
import { CustomTemplate } from '@/types';
import { useReflectionTemplateStore } from '@/store/useReflectionTemplateStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';
import { cn } from '@/lib/utils';
import TipTapEditor from './TipTapEditor';

interface ReflectionHubProps {
  date: string; // YYYY-MM-DD format
  className?: string;
}

export const ReflectionHub: React.FC<ReflectionHubProps> = ({ date, className }) => {
  const { selectedAccountId } = useAccountFilterStore();
  const { reflectionData } = useReflectionTemplateStore();
  const { getReflectionByDate, upsertReflectionForSelection } = useDailyReflectionStore();
  
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null);
  const [generalThoughts, setGeneralThoughts] = useState<string>('');
  const [isSavingThoughts, setIsSavingThoughts] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  // Check if user has any reflection data for this date
  const hasReflectionData = reflectionData.some(
    r => r.date === date && r.accountId === selectedAccountId && r.insightBlocks.length > 0
  );

  // Load existing general thoughts
  React.useEffect(() => {
    if (!selectedAccountId) return;
    const existing = getReflectionByDate(date, selectedAccountId);
    setGeneralThoughts(existing?.reflection || '');
  }, [date, selectedAccountId, getReflectionByDate]);

  // Debounced save for general thoughts (persist both plain text and rich JSON placeholder when added)
  const saveThoughts = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleThoughtsChange = (value: string) => {
    setGeneralThoughts(value);
    if (saveThoughts.current) clearTimeout(saveThoughts.current);
    setIsSavingThoughts(true);
    saveThoughts.current = setTimeout(async () => {
      if (!selectedAccountId) return;
      try {
        await upsertReflectionForSelection(date, { reflection: value }, selectedAccountId);
        setLastSavedAt(new Date());
      } finally {
        setIsSavingThoughts(false);
      }
    }, 500);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Insight Blocks Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              Insight Blocks
              <span className="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-bold">
                2.0
              </span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Multi-block reflection system with AI suggestions
            </p>
          </div>
        </div>

        {/* Template Editor Button */}
        <motion.button
          onClick={() => setShowTemplateEditor(true)}
          className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Settings className="w-4 h-4" />
          Templates
        </motion.button>
      </div>

      {/* Welcome Notice for new users */}
      {!hasReflectionData && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg mt-0.5">
              <Sparkles className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-700 dark:text-blue-300 mb-1">
                Welcome to Insight Blocks 2.0!
              </h4>
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-3">
                Experience a powerful and flexible reflection system designed for serious traders.
                Build your daily insights with multiple blocks, AI suggestions, and rich formatting.
              </p>
              <div className="flex items-center gap-3 text-xs text-blue-500">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  <span>AI-powered insights</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>Multiple blocks per day</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Rich text editing</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Insight Blocks Content */}
      <ReflectionTemplateManager 
        date={date} 
        onEditTemplate={(template) => {
          setEditingTemplate(template || null);
          setShowTemplateEditor(true);
        }}
      />

      {/* General Thoughts (TipTap editor) */}
      <div className="space-y-3 p-4 bg-gradient-to-br from-card to-muted/20 rounded-xl border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/20 rounded-lg">
              <Layers className="w-4 h-4 text-secondary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">General Thoughts</h3>
              <p className="text-xs text-muted-foreground">Free-form notes to supplement your insight blocks</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {isSavingThoughts ? 'Saving…' : lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString()}` : ''}
          </div>
        </div>
        <TipTapEditor
          initialJSON={getReflectionByDate(date, selectedAccountId!)?.reflectionRich}
          onUpdateJSON={(json, plain) => {
            handleThoughtsChange(plain);
            // Save rich JSON as well
            if (selectedAccountId) {
              upsertReflectionForSelection(date, { reflectionRich: json }, selectedAccountId);
            }
          }}
          placeholder="Write anything that's on your mind today… Use / for commands, **bold**, *italic*, and checklists."
          onConvertSelectionToInsight={(text) => {
            if (!selectedAccountId) return;
            const existing = getReflectionByDate(date, selectedAccountId);
            if (!existing) return;
            // Create an Insight Block with selected text
            // Defer to the template store
            // Import store lazily to avoid circular imports
            import('@/store/useReflectionTemplateStore').then(({ useReflectionTemplateStore }) => {
              const { addInsightBlock } = useReflectionTemplateStore.getState();
              addInsightBlock(existing.id, {
                title: 'Insight',
                content: text,
                tags: [],
                order: existing.insightBlocks?.length || 0,
                isExpanded: true,
              } as any);
            });
          }}
          onPinSelectionAsQuest={(text) => {
            // Pin a quest from selected text
            import('@/store/useQuestStore').then(({ useQuestStore }) => {
              const { addQuest, pinQuest } = useQuestStore.getState();
              addQuest({
                title: 'Journal Task',
                description: text,
                type: 'daily',
                status: 'pending',
                progress: 0,
                maxProgress: 1,
                xpReward: 25,
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
                accountId: selectedAccountId || 'all',
              }).then(q => pinQuest(q.id));
            });
          }}
        />
      </div>

      {/* Custom Template Editor Modal */}
      <CustomTemplateEditor
        isOpen={showTemplateEditor}
        onClose={() => {
          setShowTemplateEditor(false);
          setEditingTemplate(null);
        }}
        editingTemplate={editingTemplate}
      />
    </div>
  );
};