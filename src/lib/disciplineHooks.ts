import useSWR from 'swr';
import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { todayInTZ } from '@/lib/time';

async function fetchUser(uid: string) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

async function fetchDay(uid: string, date: string) {
  const ref = doc(db, 'users', uid, 'days', date);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export function useDisciplineUser(uid?: string) {
  return useSWR(uid ? ['disc-user', uid] : null, () => fetchUser(uid as string), { suspense: false });
}

export function useTodayDay(uid?: string, tz?: string) {
  const date = tz ? todayInTZ(tz) : undefined;
  return useSWR(uid && date ? ['disc-day', uid, date] : null, () => fetchDay(uid as string, date as string), {
    suspense: false,
    onSuccess: (data, key) => {
      // Attach a listener once to keep it in sync realtime
      if (!uid || !date) return;
      const ref = doc(db, 'users', uid, 'days', date);
      const unsub = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          // update cache with live data
          (window as any).__disc_mutate?.(['disc-day', uid, date], { ...snap.data() });
        }
      });
      (window as any).__disc_unsub = unsub;
    },
  });
}

export function useWeekDays(uid?: string, tz?: string) {
  const now = tz ? todayInTZ(tz) : undefined;
  return useSWR(uid && now ? ['disc-week', uid, tz] : null, async () => {
    const base = new Date((now as string) + 'T00:00:00');
    const days: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;
      const v = await fetchDay(uid as string, key);
      days.push({ date: key, ...(v || {}) });
    }
    return days;
  }, { suspense: false });
}


