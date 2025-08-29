import React from 'react';
import { useAccountFilterStore } from '@/store/useAccountFilterStore';
import { useReflectionTemplateStore } from '@/store/useReflectionTemplateStore';
import { useDailyReflectionStore } from '@/store/useDailyReflectionStore';

export const DebugJournalBanner: React.FC = () => {
  const accounts = useAccountFilterStore((s) => s.accounts);
  const selectedAccountId = useAccountFilterStore((s) => s.selectedAccountId);
  const templateStore = useReflectionTemplateStore();
  const dailyStore = useDailyReflectionStore();

  const todayStr = React.useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  }, []);

  const effectiveAccountId = selectedAccountId || accounts[0]?.id || undefined;
  const reflectionTemplate = effectiveAccountId
    ? templateStore.getReflectionByDate(todayStr, effectiveAccountId)
    : undefined;
  const dailyReflection = dailyStore.getReflectionByDate(todayStr, effectiveAccountId);

  const hasRemoteLoader = !!templateStore._loadRemote;

  return (
    <div className="md:hidden p-2 text-xs bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
      <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
        <div className="font-semibold">Journal Debug</div>
        <div>selAcct: <span className="font-mono">{selectedAccountId || 'none'}</span></div>
        <div>effAcct: <span className="font-mono">{effectiveAccountId || 'none'}</span></div>
        <div>templates: <span className="font-mono">{templateStore.reflectionData.length}</span></div>
        <div>daily: <span className="font-mono">{dailyStore.reflections.length}</span></div>
        <div>todayTpl: <span className="font-mono">{reflectionTemplate ? 'yes' : 'no'}</span></div>
        <div>todayDaily: <span className="font-mono">{dailyReflection ? 'yes' : 'no'}</span></div>
        <div>remoteLoader: <span className="font-mono">{hasRemoteLoader ? 'yes' : 'no'}</span></div>
        <button
          className="ml-auto px-2 py-1 rounded border bg-white/70 dark:bg-black/20"
          onClick={() => templateStore._loadRemote?.()}
        >
          Reload Remote
        </button>
      </div>
    </div>
  );
};

export default DebugJournalBanner;


