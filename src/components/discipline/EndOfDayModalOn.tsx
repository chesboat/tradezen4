import React, { useState } from 'react';
import { submitEOD } from '@/lib/discipline';
import { useAuth } from '@/contexts/AuthContext';

export const EndOfDayModalOn: React.FC<{ open: boolean; onClose: () => void; tz: string; loggedCount: number; }> = ({ open, onClose, tz, loggedCount }) => {
  const { currentUser } = useAuth();
  const [actualCount, setActualCount] = useState<number>(loggedCount);
  const [respected, setRespected] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  if (!open) return null;

  const onSubmit = async () => {
    if (!currentUser) return;
    try {
      setIsSaving(true);
      await submitEOD({ uid: currentUser.uid, tz, actualCount: Math.max(0, actualCount), respected });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-end md:items-center justify-center p-4">
        <div className="w-full md:max-w-md bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="text-base font-semibold text-card-foreground">End of Day</h3>
            <p className="text-xs text-muted-foreground mt-1">Did you respect your bullets today?</p>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <label className="text-sm w-48">How many trades did you actually take?</label>
              <input
                type="number"
                min={0}
                value={actualCount}
                onChange={(e) => setActualCount(parseInt(e.target.value || '0', 10))}
                className="w-24 px-3 py-2 rounded border bg-background"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-primary" checked={respected} onChange={(e) => setRespected(e.target.checked)} />
              I respected my bullets
            </label>
          </div>
          <div className="p-4 border-t border-border/50 flex justify-end gap-2">
            <button className="px-3 py-1.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 text-sm" onClick={onClose}>Cancel</button>
            <button className="px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-sm disabled:opacity-50" disabled={isSaving} onClick={onSubmit}>{isSaving ? 'Saving…' : 'Submit'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EndOfDayModalOn;


