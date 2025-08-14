import React from 'react';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import app from '@/lib/firebase';

interface NoteContentProps {
  content: string;
  className?: string;
}

// Render note content with inline image support. Supports markdown images like ![alt](url)
// and bare image URLs on their own lines.
// Resolve legacy Firebase Storage URLs that use the JSON API query form
// like: https://firebasestorage.googleapis.com/v0/b/<bucket>/o?name=quickNotes%2F<id>
// into signed download URLs via SDK (avoids CORS preflight failures).
const ResolvedImage: React.FC<{ src: string; alt: string; className?: string; onClick?: () => void }> = ({ src, alt, className, onClick }) => {
  const [resolvedSrc, setResolvedSrc] = React.useState<string>('');

  React.useEffect(() => {
    let isMounted = true;

    const needsResolution = /\/o\?name=/.test(src) && !/alt=media/.test(src);
    console.log('ResolvedImage: checking URL', { src, needsResolution });
    if (!needsResolution) {
      setResolvedSrc(src);
      return;
    }

    try {
      const url = new URL(src);
      const pathParam = url.searchParams.get('name');
      if (!pathParam) {
        setResolvedSrc(src);
        return;
      }

      const storage = getStorage(app as any);
      const storagePath = decodeURIComponent(pathParam);
      const storageRef = ref(storage, storagePath);
      getDownloadURL(storageRef)
        .then((dl) => {
          console.log('ResolvedImage: got signed URL', { original: src, resolved: dl });
          if (isMounted) setResolvedSrc(dl);
        })
        .catch((err) => {
          console.log('ResolvedImage: failed to resolve', { src, err });
          if (isMounted) setResolvedSrc(src);
        });
    } catch (_e) {
      setResolvedSrc(src);
    }

    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className || 'mt-2 w-full rounded-lg border border-border/50 max-h-80 md:max-h-[420px] object-contain cursor-zoom-in'}
      onClick={onClick}
    />
  );
};

export const NoteContent: React.FC<NoteContentProps> = ({ content, className }) => {
  if (!content) return null;

  const [lightboxSrc, setLightboxSrc] = React.useState<string | null>(null);
  const closeLightbox = React.useCallback(() => setLightboxSrc(null), []);
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeLightbox]);

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
      <ResolvedImage
        key={`i-${idx}`}
        src={url}
        alt="note attachment"
        className="mt-2 w-full rounded-lg border border-border/50 max-h-80 md:max-h-[420px] object-contain cursor-zoom-in"
        onClick={() => setLightboxSrc(url)}
      />
    );
    lastIndex = mdImg.lastIndex;
  }

  let remaining = content.slice(lastIndex);

  // Handle bare image URLs on their own line in remaining text
  const lines = remaining.split(/\n+/);
  const imgExt = /(https?:[^\s]+\.(png|jpg|jpeg|gif|webp))/i;
  const legacyApi = /https?:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\?name=([^\s)]+)/i;
  lines.forEach((line, i) => {
    const m = line.match(imgExt);
    if (m && line.trim() === m[1]) {
      elements.push(
        <ResolvedImage
          key={`li-${i}-${m.index}`}
          src={m[1]}
          alt="note attachment"
          className="mt-2 w-full rounded-lg border border-border/50 max-h-80 md:max-h-[420px] object-contain cursor-zoom-in"
          onClick={() => setLightboxSrc(m[1])}
        />
      );
    } else if (legacyApi.test(line.trim())) {
      const match = line.trim().match(legacyApi)!;
      const url = match[0];
      elements.push(
        <ResolvedImage
          key={`li-legacy-${i}`}
          src={url}
          alt="note attachment"
          className="mt-2 w-full rounded-lg border border-border/50 max-h-80 md:max-h-[420px] object-contain cursor-zoom-in"
          onClick={() => setLightboxSrc(url)}
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

  return (
    <>
      {elements}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
        >
          <img
            src={lightboxSrc}
            alt="note attachment"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain cursor-zoom-out border border-white/10 shadow-2xl"
          />
        </div>
      )}
    </>
  );
};


