import { useCallback, useId, useRef } from "react";

type Props = {
  id?: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  /** Optional id of a labelling element */
  "aria-labelledby"?: string;
  disabled?: boolean;
};

/**
 * Custom horizontal chapter slider (pointer + keyboard). Replaces &lt;input type="range"&gt;
 * for a clearer, theme-aware look.
 */
export function ChapterSlider({ id, min, max, value, onChange, "aria-labelledby": ariaLabelledBy, disabled }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const sliderId = id ?? `chapter-slider-${generatedId}`;

  const range = max - min;
  const safeVal = range < 0 ? min : Math.min(max, Math.max(min, value));
  const pct = range <= 0 ? 100 : ((safeVal - min) / range) * 100;

  const valueFromClientX = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || disabled) return safeVal;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0) return safeVal;
      const t = (clientX - rect.left) / rect.width;
      const clampedT = Math.min(1, Math.max(0, t));
      if (range <= 0) return min;
      return Math.round(min + clampedT * range);
    },
    [disabled, min, max, range, safeVal],
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    onChange(valueFromClientX(e.clientX));
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    e.preventDefault();
    onChange(valueFromClientX(e.clientX));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || range <= 0) return;
    let next = safeVal;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = Math.min(max, safeVal + 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = Math.max(min, safeVal - 1);
        break;
      case "Home":
        next = min;
        break;
      case "End":
        next = max;
        break;
      case "PageUp":
        next = Math.min(max, safeVal + 10);
        break;
      case "PageDown":
        next = Math.max(min, safeVal - 10);
        break;
      default:
        return;
    }
    e.preventDefault();
    if (next !== safeVal) onChange(next);
  };

  const isDisabled = Boolean(disabled);

  return (
    <div
      id={sliderId}
      className={`chapter-slider${isDisabled ? " is-disabled" : ""}`}
      role="slider"
      tabIndex={isDisabled ? -1 : 0}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={safeVal}
      aria-disabled={isDisabled}
      aria-labelledby={ariaLabelledBy}
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
    >
      <div
        ref={trackRef}
        className="chapter-slider-track"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="chapter-slider-fill" style={{ width: `${pct}%` }} aria-hidden />
        <div className="chapter-slider-thumb" style={{ left: `${pct}%` }} aria-hidden />
      </div>
    </div>
  );
}
