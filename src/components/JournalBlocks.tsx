'use client';

import type { JournalBlock } from '@/lib/journal/types';

export function JournalBlocks({ blocks }: { blocks: JournalBlock[] }) {
  return (
    <div>
      {blocks.map((block, idx) => {
        if (block.type === 'text') {
          return <p key={idx}>{block.content}</p>;
        }

        if (block.type === 'image') {
          const width = block.width ?? 1200;
          const height = block.height ?? Math.round(width * 0.5625);
          return (
            <div key={idx} style={{ position: 'relative', width: '100%', maxWidth: 1200 }}>
              <img
                src={block.url}
                alt={block.alt || ''}
                width={width}
                height={height}
                style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
                loading="lazy"
              />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}


