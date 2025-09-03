import { auth, db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  runTransaction,
  collection,
  addDoc,
} from 'firebase/firestore';
import { todayInTZ } from '@/lib/time';

export interface DisciplineSettings {
  enabled: boolean;
  defaultMax?: number;
}

export interface DayDocShape {
  date: string;
  maxTrades: number;
  usedTrades: number;
  status: 'open' | 'completed' | 'skipped' | 'broken';
  respectedLimit?: boolean;
  lateLogging?: boolean;
  checkInAt?: any;
  eodCompletedAt?: any;
  overrideReason?: string;
  createdAt?: any;
  updatedAt?: any;
}

export async function getUserDoc(uid: string) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return { ref, data: snap.exists() ? snap.data() : null };
}

export async function setDisciplineMode(params: { uid: string; enabled: boolean; defaultMax?: number }) {
  const { uid, enabled, defaultMax } = params;
  const userRef = doc(db, 'users', uid);
  await setDoc(
    userRef,
    {
      settings: {
        disciplineMode: { enabled, ...(defaultMax ? { defaultMax } : {}) },
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function checkInDay(params: { uid: string; tz: string; maxTrades: number }) {
  const { uid, tz, maxTrades } = params;
  const userRef = doc(db, 'users', uid);
  const dateStr = todayInTZ(tz);
  const dayRef = doc(db, 'users', uid, 'days', dateStr);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    const enabled = !!userSnap.data()?.settings?.disciplineMode?.enabled;
    if (!enabled) throw new Error('DISCIPLINE_DISABLED');

    const daySnap = await tx.get(dayRef);
    const now = serverTimestamp();
    if (!daySnap.exists()) {
      const newDoc: DayDocShape = {
        date: dateStr,
        maxTrades,
        usedTrades: 0,
        status: 'open',
        checkInAt: now,
        createdAt: now,
        updatedAt: now,
      };
      tx.set(dayRef, newDoc as any, { merge: true });
    } else {
      tx.set(
        dayRef,
        {
          maxTrades,
          status: 'open',
          checkInAt: now,
          updatedAt: now,
        },
        { merge: true }
      );
    }
  });
}

export async function quickLogTrade(params: { uid: string; tz: string }) {
  const { uid, tz } = params;
  const userRef = doc(db, 'users', uid);
  const dateStr = todayInTZ(tz);
  const dayRef = doc(db, 'users', uid, 'days', dateStr);
  const tradesCol = collection(db, 'users', uid, 'days', dateStr, 'trades');

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    const enabled = !!userSnap.data()?.settings?.disciplineMode?.enabled;
    if (!enabled) {
      // Discipline disabled → create placeholder trade only
      await addDoc(tradesCol, {
        placeholder: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    const daySnap = await tx.get(dayRef);
    if (!daySnap.exists()) {
      throw Object.assign(new Error('NO_CHECKIN'), { code: 'NO_CHECKIN' });
    }
    const day = daySnap.data() as DayDocShape;
    if (!['open', 'broken'].includes(day.status)) {
      throw Object.assign(new Error('DAY_CLOSED'), { code: 'DAY_CLOSED' });
    }
    if (day.usedTrades >= day.maxTrades) {
      throw Object.assign(new Error('MAX_REACHED'), { code: 'MAX_REACHED' });
    }

    // Create trade and increment counter
    const tradeRef = doc(tradesCol);
    tx.set(tradeRef, {
      placeholder: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    tx.update(dayRef, {
      usedTrades: (day.usedTrades || 0) + 1,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function overrideDay(params: { uid: string; tz: string; reason: string }) {
  const { uid, tz, reason } = params;
  if (!reason || reason.trim().length < 30) {
    throw new Error('REASON_TOO_SHORT');
  }
  const dateStr = todayInTZ(tz);
  const userRef = doc(db, 'users', uid);
  const dayRef = doc(db, 'users', uid, 'days', dateStr);

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    const user = userSnap.data() || {};
    const enabled = !!user?.settings?.disciplineMode?.enabled;
    if (!enabled) throw new Error('DISCIPLINE_DISABLED');

    const daySnap = await tx.get(dayRef);
    if (!daySnap.exists()) throw new Error('NO_DAY');

    tx.update(dayRef, {
      status: 'broken',
      overrideReason: reason.trim(),
      updatedAt: serverTimestamp(),
    });

    const newXp = Math.max((user.xp as number) || 0 - 5, 0);
    tx.set(
      userRef,
      {
        streak: 0,
        xp: newXp,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function submitEOD(params: {
  uid: string;
  tz: string;
  actualCount: number;
  respected: boolean;
  patches?: Array<{ id?: string; symbol?: string; side?: 'LONG' | 'SHORT'; notes?: string }>;
}) {
  const { uid, tz, actualCount, respected } = params;
  const dateStr = todayInTZ(tz);
  const userRef = doc(db, 'users', uid);
  const dayRef = doc(db, 'users', uid, 'days', dateStr);

  // Note: patching placeholders can be done outside txn for simplicity; acceptance allows placeholders
  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef);
    const user = userSnap.data() || {};
    const enabled = !!user?.settings?.disciplineMode?.enabled;

    const daySnap = await tx.get(dayRef);
    if (!daySnap.exists()) {
      // Create minimal day if missing
      tx.set(dayRef, {
        date: dateStr,
        maxTrades: actualCount,
        usedTrades: actualCount,
        status: enabled ? 'open' : 'completed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    const day = daySnap.data() as DayDocShape;
    const updates: any = { eodCompletedAt: serverTimestamp(), updatedAt: serverTimestamp() };

    if (!enabled) {
      updates.status = 'completed';
      tx.update(dayRef, updates);
      return;
    }

    // Discipline enabled
    if (actualCount > (day.usedTrades || 0)) {
      updates.lateLogging = true;
      tx.update(userRef, {
        xp: Math.max(((user.xp as number) || 0) - 2, 0),
        updatedAt: serverTimestamp(),
      });
    }

    if (respected === true && day.status !== 'broken' && !!day.checkInAt) {
      updates.status = 'completed';
      updates.respectedLimit = true;
      tx.update(userRef, {
        streak: ((user.streak as number) || 0) + 1,
        xp: (((user.xp as number) || 0) + 10),
        updatedAt: serverTimestamp(),
      });
    } else if (!day.checkInAt) {
      updates.status = 'skipped';
    }

    tx.update(dayRef, updates);
  });
}

export async function getWeekSummary(params: { uid: string; tz: string }) {
  // For simplicity in this MVP, fetch per-day docs client-side via SWR elsewhere.
  // This function can be expanded to query a range when needed.
  const { uid } = params;
  const { data } = await getUserDoc(uid);
  return data;
}

export async function resetTodayBullets(params: { uid: string; tz: string }) {
  const { uid, tz } = params;
  const dateStr = todayInTZ(tz);
  const dayRef = doc(db, 'users', uid, 'days', dateStr);

  await runTransaction(db, async (tx) => {
    const daySnap = await tx.get(dayRef);
    if (!daySnap.exists()) return; // nothing to reset
    tx.update(dayRef, {
      usedTrades: 0,
      status: 'open',
      respectedLimit: false,
      lateLogging: false,
      overrideReason: null,
      eodCompletedAt: null,
      updatedAt: serverTimestamp(),
    } as any);
  });
}


