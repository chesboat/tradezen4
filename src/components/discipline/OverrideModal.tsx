import React, { useState, useEffect } from 'react';
import { overrideDay } from '@/lib/discipline';
import { useAuth } from '@/contexts/AuthContext';

export const OverrideModal: React.FC<{ open: boolean; onClose: () => void; tz: string; }> = ({ open, onClose, tz }) => {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [holdSeconds, setHoldSeconds] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason('');
    setConfirmChecked(false);
    setHoldSeconds(3);
  }, [open]);

  useEffect(() => {
    if (!open || !confirmChecked) return;
    if (holdSeconds <= 0) return;
    const t = setTimeout(() => setHoldSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [open, confirmChecked, holdSeconds]);

  const submit = async () => {
    if (!currentUser) return;
    if (reason.trim().length < 30) return;
    if (!confirmChecked || holdSeconds > 0) return;
    try {
      setIsSubmitting(true);
      await overrideDay({ uid: currentUser.uid, tz, reason: reason.trim() });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-end md:items-center justify-center p-4">
        <div className="w-full md:max-w-md bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <h3 className="text-base font-semibold text-card-foreground">Override Limit</h3>
            <p className="text-xs text-muted-foreground mt-1">If you must continue, explain why. This resets streak and deducts XP.</p>
          </div>
          <div className="p-4 space-y-3">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={30}
              placeholder="Type at least 30 characters explaining the necessity and what you’ll do differently"
              className="w-full min-h-[120px] px-3 py-2 bg-muted/30 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none text-sm"
            />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" className="accent-primary" checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)} />
              I understand this will set the day to broken, reset streak, and deduct XP.
            </label>
          </div>
          <div className="p-4 border-t border-border/50 flex justify-end gap-2">
            <button className="px-3 py-1.5 rounded bg-muted text-muted-foreground hover:bg-muted/80 text-sm" onClick={onClose}>Cancel</button>
            <button
              className="px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600 text-sm disabled:opacity-50"
              disabled={isSubmitting || reason.trim().length < 30 || !confirmChecked || holdSeconds > 0}
              onClick={submit}
            >{isSubmitting ? 'Submitting…' : holdSeconds > 0 ? `Hold ${holdSeconds}s` : 'Confirm Override'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverrideModal;


