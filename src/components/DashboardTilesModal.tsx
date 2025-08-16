import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GripVertical, Eye, EyeOff } from 'lucide-react';
import { useDashboardTilesStore, type DashboardTileId, type DashboardTileConfig } from '@/store/useDashboardTilesStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';

interface DashboardTilesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TILE_LABELS: Record<DashboardTileId, string> = {
  dailyFocus: 'Daily Focus',
  guardrails: 'Session Guardrails',
  miniKpis: 'Focus & Execution',
  recentTrades: 'Recent Trades',
  pinnedQuests: 'Pinned Quests',
  gptInsights: 'GPT-5 Insights',
  patternRadar: 'Pattern Radar',
  reflectionProgress: 'Reflection Progress',
  xpLevel: 'Progress (XP / Level)',
};

export const DashboardTilesModal: React.FC<DashboardTilesModalProps> = ({ isOpen, onClose }) => {
  const { selectedAccountId } = useAccountFilterStore();
  const { getLayout, setLayout, toggleTile } = useDashboardTilesStore();
  const initialLayout = getLayout(selectedAccountId);
  const [localOrder, setLocalOrder] = useState<DashboardTileConfig[]>(initialLayout);

  // Sync local state when account or open toggles
  React.useEffect(() => {
    if (isOpen) setLocalOrder(getLayout(selectedAccountId));
  }, [isOpen, selectedAccountId, getLayout]);

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: DashboardTileId) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetId: DashboardTileId) => {
    const sourceId = e.dataTransfer.getData('text/plain') as DashboardTileId;
    if (!sourceId || sourceId === targetId) return;

    const current = [...localOrder];
    const from = current.findIndex(t => t.id === sourceId);
    const to = current.findIndex(t => t.id === targetId);
    if (from < 0 || to < 0) return;

    const moved = current.splice(from, 1)[0];
    current.splice(to, 0, moved);
    setLocalOrder(current);
  };

  const applyChanges = () => {
    setLayout(selectedAccountId, localOrder);
    onClose();
  };

  const reset = () => {
    // Reset to whatever store considers default via empty setLayout to fallback
    setLayout(selectedAccountId, localOrder.map(t => ({ ...t, visible: true })));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}>
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-base font-semibold text-card-foreground">Customize Dashboard</h3>
                <button className="p-2 rounded hover:bg-muted" onClick={onClose} aria-label="Close"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-3">Drag to reorder. Click the eye to show/hide tiles. Saved per account selection.</p>
                <div className="space-y-2">
                  {localOrder.map((tile) => (
                    <div
                      key={tile.id}
                      className="flex items-center justify-between bg-muted/30 border border-border rounded-lg p-2"
                      draggable
                      onDragStart={(e) => onDragStart(e, tile.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => onDrop(e, tile.id)}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{TILE_LABELS[tile.id]}</span>
                      </div>
                      <button
                        className="p-2 rounded hover:bg-muted"
                        onClick={() => {
                          const next = localOrder.map(t => t.id === tile.id ? { ...t, visible: !t.visible } : t);
                          setLocalOrder(next);
                          toggleTile(selectedAccountId, tile.id);
                        }}
                        title={tile.visible ? 'Hide' : 'Show'}
                      >
                        {tile.visible ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-border flex items-center justify-end gap-2">
                <button className="px-3 py-1.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 text-xs" onClick={onClose}>Cancel</button>
                <button className="px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs" onClick={applyChanges}>Save</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DashboardTilesModal;


