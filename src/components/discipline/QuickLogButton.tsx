import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { quickLogTrade } from '@/lib/discipline';
import { useSWRConfig } from 'swr';
import { todayInTZ } from '@/lib/time';

interface Props {
  tz: string;
  onMaxReached?: () => void;
}

export const QuickLogButton: React.FC<Props> = ({ tz, onMaxReached }) => {
  const { currentUser } = useAuth();
  const { mutate } = useSWRConfig();
  const [burst, setBurst] = React.useState(false);

  const doLog = async () => {
    if (!currentUser) return;
    try {
      // optimistic usedTrades++ on today's day key (date-based)
      const dateStr = todayInTZ(tz);
      const key = ['disc-day', currentUser.uid, dateStr];
      await mutate(key, async (prev: any) => {
        if (!prev) return prev;
        const next = { ...prev, usedTrades: Math.min((prev.usedTrades || 0) + 1, prev.maxTrades || prev.usedTrades || 0) };
        return next;
      }, { revalidate: false });
      await quickLogTrade({ uid: currentUser.uid, tz });
      setBurst(true);
      setTimeout(() => setBurst(false), 300);
      // revalidate after write (and refresh week summary too)
      mutate(key);
      mutate(['disc-week', currentUser.uid, tz]);
    } catch (e: any) {
      if (e?.code === 'MAX_REACHED') onMaxReached?.();
      // rollback by revalidating
      if (currentUser) {
        const dateStr = todayInTZ(tz);
        mutate(['disc-day', currentUser.uid, dateStr]);
      }
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isEditable = !!target && (
        target.isContentEditable ||
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select'
      );
      if (isEditable) return;

      const key = (e.key || '').toLowerCase();
      if (key === 'l') {
        e.preventDefault();
        doLog();
      } else if (e.ctrlKey && e.shiftKey && key === 't') {
        e.preventDefault();
        doLog();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <button
      className={`px-3 py-2 rounded bg-primary text-primary-foreground text-sm relative ${burst ? 'ring-4 ring-primary/30' : ''}`}
      onClick={doLog}
      title="Quick Log Trade (L or Ctrl+Shift+T)"
    >
      <span className="relative z-10">+ Trade</span>
      {burst && (
        <span className="absolute inset-0 rounded bg-primary/20 animate-ping" />
      )}
    </button>
  );
};

export default QuickLogButton;


