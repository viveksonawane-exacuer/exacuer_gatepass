import { useEffect, useRef, useState } from "react";

type Props = {
  label?: string;
  disabled?: boolean;
  title?: string;
  onComplete: () => void;
  className?: string;
};

/**
 * Call-style swipe-to-confirm control (drag handle left → right).
 */
export function SwipeToAcceptButton({
  label = "Swipe to Accept",
  disabled = false,
  title,
  onComplete,
  className = "",
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [completed, setCompleted] = useState(false);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const maxTravelRef = useRef(0);

  const HANDLE = 44;
  const PAD = 4;

  const measureMax = () => {
    const track = trackRef.current;
    if (!track) return 0;
    return Math.max(0, track.clientWidth - HANDLE - PAD * 2);
  };

  const setThumb = (value: number) => {
    offsetRef.current = value;
    setOffset(value);
  };

  useEffect(() => {
    if (!completed) return;
    const t = window.setTimeout(() => {
      setCompleted(false);
      setThumb(0);
    }, 700);
    return () => window.clearTimeout(t);
  }, [completed]);

  const finishIfNeeded = (x: number) => {
    const max = maxTravelRef.current || measureMax();
    if (max > 0 && x >= max * 0.88) {
      setThumb(max);
      setCompleted(true);
      onComplete();
      return;
    }
    setThumb(0);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || completed) return;
    e.preventDefault();
    e.stopPropagation();
    maxTravelRef.current = measureMax();
    startX.current = e.clientX;
    startOffset.current = offsetRef.current;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || disabled) return;
    e.stopPropagation();
    const max = maxTravelRef.current || measureMax();
    const next = Math.max(0, Math.min(max, startOffset.current + (e.clientX - startX.current)));
    setThumb(next);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    e.stopPropagation();
    setDragging(false);
    finishIfNeeded(offsetRef.current);
  };

  const max = maxTravelRef.current || 1;
  const progress = Math.min(1, offset / max);

  return (
    <div
      ref={trackRef}
      className={`ds-swipe-accept${dragging ? " is-dragging" : ""}${completed ? " is-done" : ""}${disabled ? " is-disabled" : ""} ${className}`.trim()}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
      aria-label={label}
      aria-disabled={disabled}
      title={title}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="ds-swipe-accept__fill" style={{ width: `calc(${HANDLE + PAD * 2}px + ${offset}px)` }} aria-hidden />
      <span className="ds-swipe-accept__label" style={{ opacity: Math.max(0.28, 1 - progress * 1.15) }}>
        {completed ? "Accepted" : label}
      </span>

      <div
        className="ds-swipe-accept__thumb"
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
          <path d="m9 6 6 6-6 6" />
        </svg>
      </div>
    </div>
  );
}
