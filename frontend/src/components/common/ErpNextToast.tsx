import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { formatNowTime } from "@/lib/format";
import { saveNotificationToHistory } from "@/services/localNotificationHistory";

export type ErpToastData = {
  id: string;
  title: string;
  message: string;
  hostName?: string;
  time?: string;
  visitorEntry?: string;
};

type Props = {
  toast: ErpToastData | null;
  onClose: () => void;
};

export function ErpNextToast({ toast, onClose }: Props) {
  const [dragY, setDragY] = useState(0);
  const [isSwipingOut, setIsSwipingOut] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const autoCloseTimer = useRef<number | null>(null);

  const handleDismiss = useCallback(() => {
    setIsSwipingOut(true);
    setTimeout(() => {
      onClose();
      setIsSwipingOut(false);
      setDragY(0);
    }, 240);
  }, [onClose]);

  useEffect(() => {
    if (!toast) {
      setDragY(0);
      setIsSwipingOut(false);
      return;
    }

    saveNotificationToHistory({
      id: toast.id || `toast-${Date.now()}`,
      title: toast.title,
      message: toast.message,
      timestamp: Date.now(),
      visitorEntry: toast.visitorEntry || toast.id,
      route: "/approvals",
      variant: "toast",
    });

    autoCloseTimer.current = window.setTimeout(() => {
      handleDismiss();
    }, 4500);

    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, [toast, handleDismiss]);

  const handleTouchStart = (e: TouchEvent) => {
    if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff < 0) {
      setDragY(diff);
    } else {
      setDragY(diff * 0.2);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartY.current === null) return;
    if (dragY < -25) {
      handleDismiss();
    } else {
      setDragY(0);
    }
    touchStartY.current = null;
  };

  if (!toast) return null;

  const timeLabel = toast.time || formatNowTime();
  const cardStyle = {
    transform: isSwipingOut
      ? "translateY(-160%) scale(0.92)"
      : dragY !== 0
        ? `translateY(${dragY}px) scale(${Math.max(0.92, 1 - Math.abs(dragY) / 400)})`
        : undefined,
    opacity: isSwipingOut ? 0 : 1,
    transition: dragY === 0 || isSwipingOut ? "transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s ease" : "none",
  };

  return createPortal(
    <div className="ds-toast-overlay" role="status" aria-live="polite">
      <div
        className="ds-toast"
        style={cardStyle}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleDismiss}
        role="button"
        tabIndex={0}
        aria-label={`${toast.title}. ${toast.message}. Swipe up to dismiss.`}
      >
        <span className="ds-toast__handle" aria-hidden />

        <div className="ds-toast__row">
          <BrandLogo variant="icon" className="ds-toast__icon" />

          <span className="ds-toast__copy">
            <span className="ds-toast__head">
              <span className="ds-toast__app">Exacuer Global</span>
              <span className="ds-toast__time">{timeLabel}</span>
            </span>
            <strong className="ds-toast__title">{toast.title}</strong>
            <span className="ds-toast__message">{toast.message}</span>
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
