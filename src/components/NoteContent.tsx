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

  const textElements: React.ReactNode[] = [];
  const imageUrls: string[] = [];
  const mdImg = /!\[[^\]]*\]\((https?:[^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // 🍎 Apple-style: Extract ALL images first, show as thumbnail grid at end
  // First, extract markdown image patterns
  while ((match = mdImg.exec(content)) !== null) {
    const idx = match.index;
    const url = match[1];
    const textChunk = content.slice(lastIndex, idx);
    if (textChunk.trim().length > 0) {
      textElements.push(
        <p key={`t-${idx}`} className={className || 'text-sm text-foreground leading-relaxed whitespace-pre-wrap'}>
          {textChunk}
        </p>
      );
    }
    imageUrls.push(url);
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
      imageUrls.push(m[1]);
    } else if (legacyApi.test(line.trim())) {
      const match = line.trim().match(legacyApi)!;
      imageUrls.push(match[0]);
    } else if (line.length > 0) {
      textElements.push(
        <p key={`lr-${i}`} className={className || 'text-sm text-foreground leading-relaxed whitespace-pre-wrap'}>
          {line}
        </p>
      );
    }
  });

  return (
    <>
      {/* Text content */}
      {textElements}
      
      {/* 🍎 Apple-style thumbnail grid - 2-3 columns max */}
      {imageUrls.length > 0 && (
        <div className={`grid gap-2 mt-3 ${
          imageUrls.length === 1 ? 'grid-cols-1 max-w-xs' :
          imageUrls.length === 2 ? 'grid-cols-2' :
          'grid-cols-2 sm:grid-cols-3'
        }`}>
          {imageUrls.map((url, idx) => (
            <div
              key={`thumb-${idx}`}
              className="relative group cursor-pointer"
              onClick={() => setLightboxSrc(url)}
            >
              <ResolvedImage
                src={url}
                alt={`Attachment ${idx + 1}`}
                className="w-full h-24 sm:h-28 object-cover rounded-lg border-2 border-border/50 hover:border-primary/50 transition-all group-hover:scale-[1.02]"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg pointer-events-none" />
              {/* Number badge */}
              {imageUrls.length > 1 && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white text-[10px] rounded-full flex items-center justify-center font-medium pointer-events-none">
                  {idx + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
        >
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all shadow-2xl"
            aria-label="Close"
          >
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={lightboxSrc}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain cursor-zoom-out border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};


