import React from 'react';

interface NoteContentProps {
  content: string;
  className?: string;
}

// Render note content with inline image support. Supports markdown images like ![alt](url)
// and bare image URLs on their own lines.
export const NoteContent: React.FC<NoteContentProps> = ({ content, className }) => {
  if (!content) return null;

  const elements: React.ReactNode[] = [];
  const mdImg = /!\[[^\]]*\]\((https?:[^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // First, extract markdown image patterns and push interleaved text/imgs
  while ((match = mdImg.exec(content)) !== null) {
    const idx = match.index;
    const url = match[1];
    const textChunk = content.slice(lastIndex, idx);
    if (textChunk.trim().length > 0) {
      elements.push(
        <p key={`t-${idx}`} className={className || 'text-sm text-foreground leading-relaxed whitespace-pre-wrap'}>
          {textChunk}
        </p>
      );
    }
    elements.push(
      <img
        key={`i-${idx}`}
        src={url}
        alt="note attachment"
        className="mt-2 rounded-lg border border-border/50 max-h-64 object-contain"
      />
    );
    lastIndex = mdImg.lastIndex;
  }

  let remaining = content.slice(lastIndex);

  // Handle bare image URLs on their own line in remaining text
  const lines = remaining.split(/\n+/);
  const imgExt = /(https?:[^\s]+\.(png|jpg|jpeg|gif|webp))/i;
  lines.forEach((line, i) => {
    const m = line.match(imgExt);
    if (m && line.trim() === m[1]) {
      elements.push(
        <img
          key={`li-${i}-${m.index}`}
          src={m[1]}
          alt="note attachment"
          className="mt-2 rounded-lg border border-border/50 max-h-64 object-contain"
        />
      );
    } else if (line.length > 0) {
      elements.push(
        <p key={`lr-${i}`} className={className || 'text-sm text-foreground leading-relaxed whitespace-pre-wrap'}>
          {line}
        </p>
      );
    }
  });

  return <>{elements}</>;
};


