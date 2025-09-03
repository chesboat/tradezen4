import React, { useState } from 'react';
import { submitEOD } from '@/lib/discipline';
import { useAuth } from '@/contexts/AuthContext';

export const EODPromptOff: React.FC<{ open: boolean; onClose: () => void; tz: string; }> = ({ open, onClose, tz }) => {
  const { currentUser } = useAuth();
  const [count, setCount] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  if (!open) return null;

  const onSubmit = async () => {
    if (!currentUser) return;
    try {
      setIsSaving(true);
      await submitEOD({ uid: currentUser.uid, tz, actualCount: Math.max(0, count), respected: false });
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
            <p className="text-xs text-muted-foreground mt-1">How many trades did you take?</p>
          </div>
          <div className="p-4 space-y-3">
            <input
              type="number"
              min={0}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value || '0', 10))}
              className="w-24 px-3 py-2 rounded border bg-background"
            />
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

export default EODPromptOff;


