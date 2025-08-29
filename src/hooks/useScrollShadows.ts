import { useCallback, useEffect, useState } from 'react';

export function useScrollShadows<T extends HTMLElement>() {
  const [hasTop, setHasTop] = useState(false);
  const [hasBottom, setHasBottom] = useState(false);

  const update = useCallback((el: HTMLElement) => {
    const { scrollTop, scrollHeight, clientHeight } = el;
    setHasTop(scrollTop > 0);
    setHasBottom(scrollTop + clientHeight < scrollHeight - 1);
  }, []);

  const attach = useCallback((el: T | null) => {
    if (!el) return;
    const onScroll = () => update(el);
    update(el);
    el.addEventListener('scroll', onScroll, { passive: true });

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

    return () => el.removeEventListener('scroll', onScroll);
  }, [update]);

  return { attach, hasTop, hasBottom };
}


