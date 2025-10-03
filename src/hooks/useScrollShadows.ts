import { useCallback, useRef, useState } from 'react';

export function useScrollShadows<T extends HTMLElement>() {
  const [hasTop, setHasTop] = useState(false);
  const [hasBottom, setHasBottom] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const update = useCallback((el: HTMLElement) => {
    const { scrollTop, scrollHeight, clientHeight } = el;
    const overflow = scrollHeight > clientHeight + 1;
    setHasOverflow(overflow);
    setHasTop(scrollTop > 0);
    setHasBottom(scrollTop + clientHeight < scrollHeight - 1);
  }, []);

  const attach = useCallback((el: T | null) => {
    // Clean up previous ref if exists
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (!el) return;
    
    const onScroll = () => update(el);
    update(el);
    el.addEventListener('scroll', onScroll, { passive: true });

    // Observe size/content changes to recompute overflow state
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => update(el));
      ro.observe(el);
    } else {
      // Fallback to window resize
      const onResize = () => update(el);
      window.addEventListener('resize', onResize);
      // Store cleanup on element for closure
      (el as any).__tz_onResize = onResize;
    }

    // One-time scroll nudge to hint scrollability
    try {
      const key = 'tz_scroll_hint_nudged';
      const preferReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const alreadyNudged = sessionStorage.getItem(key) === '1';
      if (!preferReduced && !alreadyNudged && el.scrollHeight > el.clientHeight) {
        const original = el.scrollTop;
        el.scrollTo({ top: Math.min(8, el.scrollHeight - el.clientHeight), behavior: 'smooth' });
        window.setTimeout(() => {
          el.scrollTo({ top: original, behavior: 'smooth' });
          sessionStorage.setItem(key, '1');
        }, 140);
      }
    } catch {
      // ignore storage errors
    }

    // Store cleanup function in ref instead of returning it
    cleanupRef.current = () => {
      el.removeEventListener('scroll', onScroll);
      if (ro) ro.disconnect();
      const onResize = (el as any).__tz_onResize as (() => void) | undefined;
      if (onResize) window.removeEventListener('resize', onResize);
    };
  }, [update]);

  return { attach, hasTop, hasBottom, hasOverflow };
}


