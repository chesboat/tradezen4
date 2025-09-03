'use client';

import { useCallback } from 'react';
import { uploadJournalImage } from '@/lib/uploadJournalImage';
import { appendJournalBlock } from '@/lib/journal/persist';
import type { ImageBlock } from '@/lib/journal/types';

export function useImageDropPaste(params: {
  entryId: string;
  userId: string;
  onUploaded?: (block: ImageBlock) => void;
}) {
  const { entryId, userId, onUploaded } = params;

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files);
      for (const file of list) {
        if (!file.type.startsWith('image/')) continue;
        const url = await uploadJournalImage(file);
        const block: ImageBlock = { type: 'image', url };
        await appendJournalBlock({ entryId, userId, block });
        onUploaded?.(block);
      }
    },
    [entryId, userId, onUploaded]
  );

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      if (e.dataTransfer?.files?.length) {
        await handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const onPaste = useCallback(
    async (e: React.ClipboardEvent<HTMLElement>) => {
      const items = e.clipboardData?.items;
      if (!items?.length) return;
      const images: File[] = [];
      for (const item of items) {
        if (item.kind === 'file') {
          const f = item.getAsFile();
          if (f && f.type.startsWith('image/')) images.push(f);
        }
      }
      if (images.length) await handleFiles(images);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
  }, []);

  return { onDrop, onPaste, onDragOver };
}


