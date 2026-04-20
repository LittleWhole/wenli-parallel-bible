import { useCallback, useLayoutEffect, useRef } from "react";

function verticalScrollMax(el: HTMLElement) {
  return Math.max(0, el.scrollHeight - el.clientHeight);
}

function horizontalScrollMax(el: HTMLElement) {
  return Math.max(0, el.scrollWidth - el.clientWidth);
}

/**
 * English: vertical scroll only. Chinese: horizontal scroll only.
 * Verse 1 sits on the physical right; English top ↔ `scrollLeft` at maximum.
 * Re-binds listeners whenever `contentRevision` changes (e.g. new chapter).
 */
export function useParallelScroll(contentRevision: number) {
  const enScrollRef = useRef<HTMLDivElement>(null);
  const zhHorizontalRef = useRef<HTMLDivElement>(null);
  /** When true, `syncEnToZh` must ignore EN scroll echoes from ZH-driven updates. */
  const fromZh = useRef(false);
  /** When true, `syncZhToEn` must ignore ZH scroll echoes from EN-driven updates. */
  const fromEn = useRef(false);

  const resetParallelScroll = useCallback(() => {
    const en = enScrollRef.current;
    const zh = zhHorizontalRef.current;
    if (!en || !zh) return;
    fromEn.current = true;
    fromZh.current = true;
    en.scrollTop = 0;
    zh.scrollLeft = horizontalScrollMax(zh);
    requestAnimationFrame(() => {
      fromEn.current = false;
      fromZh.current = false;
    });
  }, []);

  useLayoutEffect(() => {
    const en = enScrollRef.current;
    const zh = zhHorizontalRef.current;
    if (!en || !zh) return;

    const syncEnToZh = () => {
      if (fromZh.current) return;
      const enMax = verticalScrollMax(en);
      const zhMax = horizontalScrollMax(zh);
      const r = enMax > 0 ? en.scrollTop / enMax : 0;
      const target = (1 - r) * zhMax;
      if (Math.abs(zh.scrollLeft - target) < 0.5) return;
      fromEn.current = true;
      zh.scrollLeft = target;
      requestAnimationFrame(() => {
        fromEn.current = false;
      });
    };

    const syncZhToEn = () => {
      if (fromEn.current) return;
      const zhMax = horizontalScrollMax(zh);
      const enMax = verticalScrollMax(en);
      const r = zhMax > 0 ? zh.scrollLeft / zhMax : 0;
      const target = (1 - r) * enMax;
      if (Math.abs(en.scrollTop - target) < 0.5) return;
      fromZh.current = true;
      en.scrollTop = target;
      requestAnimationFrame(() => {
        fromZh.current = false;
      });
    };

    en.addEventListener("scroll", syncEnToZh, { passive: true });
    zh.addEventListener("scroll", syncZhToEn, { passive: true });

    resetParallelScroll();

    return () => {
      en.removeEventListener("scroll", syncEnToZh);
      zh.removeEventListener("scroll", syncZhToEn);
    };
  }, [contentRevision, resetParallelScroll]);

  return { enScrollRef, zhHorizontalRef, resetParallelScroll };
}
