import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { setDisciplineMode } from '@/lib/discipline';

interface Props {
  enabled: boolean;
  defaultMax?: number;
  onUpdated?: (next: { enabled: boolean; defaultMax?: number }) => void;
}

export const DisciplineModeToggle: React.FC<Props> = ({ enabled, defaultMax, onUpdated }) => {
  const { currentUser } = useAuth();
  const [localEnabled, setLocalEnabled] = useState<boolean>(enabled);
  const [localDefault, setLocalDefault] = useState<number | ''>(defaultMax ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (next: boolean) => {
    if (!currentUser) return;
    if (next) {
      let val = localDefault;
      if (!val || typeof val !== 'number' || val < 1 || val > 10) {
        const input = prompt('Set default daily bullets (1–10):', '3');
        if (input == null) return; // cancelled
        const parsed = parseInt(input, 10);
        if (!Number.isFinite(parsed) || parsed < 1 || parsed > 10) return;
        val = parsed;
        setLocalDefault(parsed);
      }
      try {
        setIsSaving(true);
        await setDisciplineMode({ uid: currentUser.uid, enabled: true, defaultMax: val as number });
        setLocalEnabled(true);
        onUpdated?.({ enabled: true, defaultMax: val as number });
      } finally {
        setIsSaving(false);
      }
    } else {
      try {
        setIsSaving(true);
        await setDisciplineMode({ uid: currentUser.uid, enabled: false });
        setLocalEnabled(false);
        onUpdated?.({ enabled: false });
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div>
        <div className="font-medium">Discipline Mode (Bullet Counter)</div>
        <div className="text-xs text-muted-foreground mt-1">Every filled trade burns 1 bullet. Canceled orders don’t. You can override if needed (it’s noted).</div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={!!localEnabled}
          disabled={isSaving}
          onChange={(e) => handleToggle(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/40 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
      </label>
    </div>
  );
};

export default DisciplineModeToggle;


