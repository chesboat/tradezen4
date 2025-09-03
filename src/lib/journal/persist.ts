'use client';

import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { JournalBlock } from './types';

export async function appendJournalBlock(params: {
  entryId: string;
  userId: string;
  block: JournalBlock;
}) {
  const { entryId, userId, block } = params;
  const ref = doc(db as any, 'users', userId, 'journalEntries', entryId);

  await updateDoc(ref, {
    blocks: arrayUnion(block),
    updatedAt: serverTimestamp(),
  } as any);
}


