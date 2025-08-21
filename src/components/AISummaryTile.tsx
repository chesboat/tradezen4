import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit3, Save, X, RefreshCw, Sparkles, Bold, Italic, AlignLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AISummaryTileProps {
  initialContent?: string;
  onSave?: (content: string) => void;
  onRegenerate?: () => Promise<string>;
  isLoading?: boolean;
}

export const AISummaryTile: React.FC<AISummaryTileProps> = ({
  initialContent = "Your AI-generated trading summary will appear here. Click the regenerate button to create a new summary based on your recent trades.",
  onSave,
  onRegenerate,
  isLoading = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [editContent, setEditContent] = useState(initialContent);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleSave = () => {
    setContent(editContent);
    setIsEditing(false);
    onSave?.(editContent);
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    
    setIsRegenerating(true);
    try {
      const newContent = await onRegenerate();
      setContent(newContent);
      setEditContent(newContent);
    } catch (error) {
      console.error('Failed to regenerate summary:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const applyFormatting = (format: 'bold' | 'italic') => {
    const textarea = document.getElementById('ai-summary-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editContent.substring(start, end);
    
    if (selectedText) {
      const marker = format === 'bold' ? '**' : '*';
      const formattedText = `${marker}${selectedText}${marker}`;
      const newContent = editContent.substring(0, start) + formattedText + editContent.substring(end);
      setEditContent(newContent);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + marker.length, start + marker.length + selectedText.length);
      }, 0);
    }
  };

  const renderContent = (text: string) => {
    // Simple markdown-like rendering for bold and italic
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  return (
    <motion.div 
      className="h-full w-full rounded-2xl border border-border bg-card dark:bg-card"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div className="px-4 h-11 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">AI Trading Summary</span>
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <div className="flex items-center gap-1 mr-2">
                <button
                  onClick={() => applyFormatting('bold')}
                  className="p-1 rounded hover:bg-muted transition-colors"
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => applyFormatting('italic')}
                  className="p-1 rounded hover:bg-muted transition-colors"
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              <button
                onClick={handleSave}
                className="p-1 rounded hover:bg-muted transition-colors text-green-600"
                title="Save changes"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCancel}
                className="p-1 rounded hover:bg-muted transition-colors text-red-600"
                title="Cancel editing"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 rounded hover:bg-muted transition-colors"
                title="Edit summary"
              >
                <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating || isLoading}
                className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-50"
                title="Regenerate summary"
              >
                <RefreshCw className={cn(
                  "w-3.5 h-3.5 text-muted-foreground",
                  (isRegenerating || isLoading) && "animate-spin"
                )} />
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              id="ai-summary-textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-40 p-3 rounded-lg border border-border bg-background dark:bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              placeholder="Edit your trading summary..."
            />
            <div className="text-xs text-muted-foreground">
              Use **bold** for emphasis and *italic* for highlights
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {(isRegenerating || isLoading) ? (
              <div className="space-y-2">
                <div className="h-4 bg-muted/40 rounded animate-pulse" />
                <div className="h-4 bg-muted/40 rounded animate-pulse w-4/5" />
                <div className="h-4 bg-muted/40 rounded animate-pulse w-3/5" />
                <div className="h-4 bg-muted/40 rounded animate-pulse w-4/5" />
              </div>
            ) : (
              <div 
                className="text-sm text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderContent(content) }}
              />
            )}
            
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="text-xs text-muted-foreground">
                AI-generated • Click to edit
              </div>
              <div className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AISummaryTile;
