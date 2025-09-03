import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkInDay } from '@/lib/discipline';

export const CheckInCard: React.FC<{ defaultMax?: number; tz: string; onChecked?: () => void }> = ({ defaultMax, tz, onChecked }) => {
  const { currentUser } = useAuth();
  const [maxTrades, setMaxTrades] = useState<number>(defaultMax || 3);
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async () => {
    if (!currentUser) return;
    try {
      setIsSaving(true);
      await checkInDay({ uid: currentUser.uid, tz, maxTrades: Math.max(1, Math.min(10, maxTrades)) });
      onChecked?.();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="font-medium mb-2">Morning Check-in</div>
      <div className="text-xs text-muted-foreground mb-3">Set today’s bullets (max trades)</div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={10}
          value={maxTrades}
          onChange={(e) => setMaxTrades(parseInt(e.target.value || '1', 10))}
          className="w-24 px-3 py-2 rounded border bg-background"
        />
        <button
          className="px-3 py-2 rounded bg-primary text-primary-foreground text-sm disabled:opacity-50"
          onClick={onSubmit}
          disabled={isSaving}
        >{isSaving ? 'Saving…' : 'Check in'}</button>
      </div>
    </div>
  );
};

export default CheckInCard;


