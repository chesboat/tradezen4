import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Palette, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TagContextMenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface TagContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  tagName: string;
  items: TagContextMenuItem[];
  position?: { x: number; y: number };
}

/**
 * Apple-style context menu for tags
 * - Shows on long-press (mobile) or right-click (desktop)
 * - Bottom sheet style on mobile
 * - Popover style on desktop
 */
export const TagContextMenu: React.FC<TagContextMenuProps> = ({
  isOpen,
  onClose,
  tagName,
  items,
  position,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Mobile: Bottom sheet (iOS style)
  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-background rounded-t-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-4 border-b border-border flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Manage Tag</div>
                <div className="font-semibold truncate">#{tagName}</div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="divide-y divide-border">
              {items.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick();
                      onClose();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-4 active:bg-muted transition-colors",
                      item.variant === 'danger' && "text-red-600 dark:text-red-400"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Safe area padding */}
            <div className="h-safe-bottom" />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Desktop: Popover (macOS style)
  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: position?.x || 0,
            top: position?.y || 0,
          }}
          className="bg-popover border border-border rounded-xl shadow-2xl overflow-hidden min-w-[200px]"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <div className="text-xs font-medium truncate">#{tagName}</div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {items.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick();
                    onClose();
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-sm",
                    item.variant === 'danger' && "text-red-600 dark:text-red-400"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

