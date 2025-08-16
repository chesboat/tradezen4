import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useAnalyticsTilesStore, type AnalyticsTileConfig, type AnalyticsTileId } from '@/store/useAnalyticsTilesStore';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';

const LABELS: Record<AnalyticsTileId, string> = {
  edgeScore: 'Edge Score',
  netDailyPnl: 'Net Daily P&L',
  topSymbols: 'Top Symbols',
  recentTrades: 'Recent Trades',
  riskAnalysis: 'Risk Analysis',
};

export const AnalyticsTilesModal: React.FC<{ isOpen: boolean; onClose: () => void }>
  = ({ isOpen, onClose }) => {
  const { selectedAccountId } = useAccountFilterStore();
  const { getLayout, setLayout } = useAnalyticsTilesStore();
  const [order, setOrder] = React.useState<AnalyticsTileConfig[]>(getLayout(selectedAccountId));

  React.useEffect(() => {
    if (isOpen) setOrder(getLayout(selectedAccountId));
  }, [isOpen, selectedAccountId, getLayout]);

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, id: AnalyticsTileId) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetId: AnalyticsTileId) => {
    const sourceId = e.dataTransfer.getData('text/plain') as AnalyticsTileId;
    if (!sourceId || sourceId === targetId) return;
    const next = [...order];
    const from = next.findIndex(t => t.id === sourceId);
    const to = next.findIndex(t => t.id === targetId);
    if (from < 0 || to < 0) return;
    const moved = next.splice(from, 1)[0];
    next.splice(to, 0, moved);
    setOrder(next);
  };

  const save = () => { setLayout(selectedAccountId, order); onClose(); };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 bg-black/60 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}>
            <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-base font-semibold text-card-foreground">Customize Analytics</h3>
                <button className="p-2 rounded hover:bg-muted" onClick={onClose}><X className="w-4 h-4" /></button>
              </div>
              <div className="p-4">
                <p className="text-xs text-muted-foreground mb-3">Drag to reorder. Toggle visibility per account selection.</p>
                <div className="space-y-2">
                  {order.map((t) => (
                    <div key={t.id} className="flex items-center justify-between bg-muted/30 border border-border rounded-lg p-2" draggable onDragStart={(e) => onDragStart(e, t.id)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, t.id)}>
                      <div className="flex items-center gap-2"><GripVertical className="w-4 h-4 text-muted-foreground" /><span className="text-sm">{LABELS[t.id]}</span></div>
                      <button className="p-2 rounded hover:bg-muted" onClick={() => setOrder(order.map(x => x.id === t.id ? { ...x, visible: !x.visible } : x))}>
                        {t.visible ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-border flex justify-end gap-2">
                <button className="px-3 py-1.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 text-xs" onClick={onClose}>Cancel</button>
                <button className="px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs" onClick={save}>Save</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AnalyticsTilesModal;


