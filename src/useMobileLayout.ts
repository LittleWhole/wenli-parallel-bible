import { useEffect, useState } from "react";

const QUERY = "(max-width: 640px)";

/**
 * Narrow viewport layout: stack secondary controls in a menu and tighten verse chrome.
 * Uses width only (works for responsive devtools and small windows too).
 */
export function useMobileLayout(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(QUERY).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
