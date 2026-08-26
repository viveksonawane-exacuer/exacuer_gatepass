import { useEffect, useRef, useState } from "react";
import type { ActiveHostAlert } from "@/services/hostAlertManager";
import { saveNotificationToHistory } from "@/services/localNotificationHistory";

type Props = {
  alert: ActiveHostAlert;
  onReview: () => void;
  onClose?: () => void;
};

export function HostAlertRingModal({ alert, onReview, onClose }: Props) {
  const [dragY, setDragY] = useState(0);
  const [isSwipingUp, setIsSwipingUp] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const minutesWaiting = Math.max(1, Math.floor((Date.now() - alert.receivedAt) / 60_000));
  const isSecurity = alert.variant === "security";
  const isCreator = alert.variant === "creator";
  const titleLower = (alert.title || "").toLowerCase();
  const msgLower = (alert.message || "").toLowerCase();
  const isCheckedIn = titleLower.includes("checked in") || msgLower.includes("checked in");
  const isCheckedOut = titleLower.includes("checked out") || msgLower.includes("checked out");

  const kicker = isSecurity
    ? "Checkout required"
    : isCheckedOut
      ? "Visitor checked out"
      : isCheckedIn
        ? "Visitor checked in"
        : isCreator
          ? alert.title || "Visitor update"
          : alert.title || "Visitor at gate";

  const meta = isSecurity
    ? `Checkout pending${alert.reminderCount > 0 ? ` · Reminder ${alert.reminderCount + 1}` : ""}`
    : isCheckedOut
      ? "Visit completed"
      : isCheckedIn
        ? "Visitor is on premises"
        : isCreator
          ? `Action needed${alert.reminderCount > 0 ? ` · Ring ${alert.reminderCount + 1}` : ""}`
          : `Waiting ${minutesWaiting} min${alert.reminderCount > 0 ? ` · Ring ${alert.reminderCount + 1}` : ""}`;

  const cta = isSecurity
    ? "Open Inside / Checkout"
    : isCheckedOut
      ? "View Details"
      : isCheckedIn
        ? "View Visitor"
        : isCreator
          ? "Open visit"
          : "Allow / Review";

  // Automatically ensure this notification is stored in the persistent notifications section
  useEffect(() => {
    saveNotificationToHistory({
      id: `alert-${alert.visitorEntry || Date.now()}-${alert.receivedAt}`,
      title: `${kicker}: ${alert.visitorName}`,
      message: alert.message,
      variant: alert.variant,
      visitorEntry: alert.visitorEntry,
      timestamp: alert.receivedAt,
    });
  }, [alert, kicker]);

  const handleDismiss = () => {
    setIsSwipingUp(true);
    setTimeout(() => {
      if (onClose) onClose();
      else onReview();
    }, 280);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - touchStartY.current;
    if (delta < 0) {
      // Dragging upward
      setDragY(delta);
    }
  };

  const handleTouchEnd = () => {
    if (dragY < -40) {
      // Swiped up!
      handleDismiss();
    } else {
      // Snap back
      setDragY(0);
    }
    touchStartY.current = null;
  };

  return (
    <div
      className={`vm-host-ring-modal${isSwipingUp ? " is-swiping-out" : ""}`}
      role="alertdialog"
      aria-modal="true"
      aria-live="assertive"
    >
      <div className="vm-host-ring-backdrop" onClick={handleDismiss} aria-hidden />
      <div className="vm-host-ring-waves" aria-hidden>
        <span />
        <span />
        <span />
      </div>

      <div
        ref={cardRef}
        className={`vm-host-ring-card${isSwipingUp ? " is-swiped-up" : ""}`}
        style={{
          transform: isSwipingUp
            ? "translateY(-130%) scale(0.92)"
            : dragY < 0
            ? `translateY(${dragY}px) scale(${Math.max(0.92, 1 + dragY / 500)})`
            : undefined,
          opacity: isSwipingUp ? 0 : dragY < 0 ? Math.max(0.3, 1 + dragY / 200) : 1,
          transition: isSwipingUp
            ? "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease"
            : dragY === 0
            ? "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease"
            : "none",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe up drag pill handle */}
        <div className="vm-swipe-indicator-pill" onClick={handleDismiss}>
          <span className="vm-swipe-arrow">↑</span>
          <span>Swipe up to dismiss</span>
        </div>

        <button
          type="button"
          className="vm-confirm-modal-close"
          onClick={handleDismiss}
          aria-label="Close"
          style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10 }}
        >
          ✕
        </button>

        <div className="vm-host-ring-bell" aria-hidden>
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.2">
            {isSecurity ? (
              <>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </>
            ) : (
              <>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </>
            )}
          </svg>
        </div>

        <p className="vm-host-ring-kicker">{kicker}</p>
        <h2 className="vm-host-ring-name">{alert.visitorName}</h2>
        <p className="vm-host-ring-message">{alert.message}</p>
        <p className="vm-host-ring-meta">{meta}</p>

        <button type="button" className="vm-host-ring-cta" onClick={onReview}>
          {cta}
        </button>
      </div>
    </div>
  );
}
