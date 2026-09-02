import { useEffect, useRef, useState } from "react";
import type { ActiveHostAlert } from "@/services/hostAlertManager";
import { saveNotificationToHistory } from "@/services/localNotificationHistory";

type Props = {
  alert: ActiveHostAlert;
  onReview: () => void;
  onClose?: () => void;
};

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  );
}

export function HostAlertRingModal({ alert, onReview, onClose }: Props) {
  const [dragY, setDragY] = useState(0);
  const [isSwipingUp, setIsSwipingUp] = useState(false);
  const touchStartY = useRef<number | null>(null);

  const minutesWaiting = Math.max(1, Math.floor((Date.now() - alert.receivedAt) / 60_000));
  const isSecurity = alert.variant === "security";
  const isCreator = alert.variant === "creator";
  const titleLower = (alert.title || "").toLowerCase();
  const msgLower = (alert.message || "").toLowerCase();
  const isCheckedIn = titleLower.includes("checked in") || msgLower.includes("checked in");
  const isCheckedOut = titleLower.includes("checked out") || msgLower.includes("checked out");

  const kicker = isSecurity
    ? "Security Action Required"
    : isCheckedOut
      ? "Visitor Checked Out"
      : isCheckedIn
        ? "Visitor Checked In"
        : isCreator
          ? alert.title || "Visitor Update"
          : "Incoming Visitor at Gate";

  const meta = isSecurity
    ? `Checkout Pending${alert.reminderCount > 0 ? ` · Reminder ${alert.reminderCount + 1}` : ""}`
    : isCheckedOut
      ? "Visit Completed"
      : isCheckedIn
        ? "Visitor is On Premises"
        : isCreator
          ? `Action Needed${alert.reminderCount > 0 ? ` · Alert ${alert.reminderCount + 1}` : ""}`
          : `Waiting ${minutesWaiting} min${alert.reminderCount > 0 ? ` · Ring ${alert.reminderCount + 1}` : ""}`;

  const cta = isSecurity
    ? "Open Checkout"
    : isCheckedOut
      ? "View Details"
      : isCheckedIn
        ? "View Visitor"
        : isCreator
          ? "Open Visit"
          : "Accept / Review";

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
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta < 0) {
      setDragY(delta);
    }
  };

  const handleTouchEnd = () => {
    if (dragY < -40) {
      handleDismiss();
    } else {
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

      <div
        className={`vm-caller-alert-card${isSwipingUp ? " is-swiped-up" : ""}`}
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
        {/* Top Dismiss Handle */}
        <div className="vm-caller-alert-handle" onClick={handleDismiss}>
          <span className="vm-caller-alert-bar" />
          <span className="vm-caller-alert-hint">Swipe up to dismiss</span>
        </div>

        {/* Close Button */}
        <button
          type="button"
          className="vm-caller-alert-close"
          onClick={handleDismiss}
          aria-label="Dismiss alert"
        >
          ✕
        </button>

        {/* Caller Avatar with Glowing Pulsing Rings */}
        <div className="vm-caller-avatar-stage">
          <div className="vm-caller-pulse-ring" />
          <div className="vm-caller-pulse-ring vm-caller-pulse-ring--delay" />
          <div className="vm-caller-avatar-circle">
            {isSecurity ? (
              <ShieldIcon />
            ) : (
              <span className="vm-caller-avatar-initials">
                {alert.visitorName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Caller Text Info */}
        <div className="vm-caller-info">
          <span className="vm-caller-kicker-pill">{kicker}</span>
          <h2 className="vm-caller-name">{alert.visitorName}</h2>
          <p className="vm-caller-message">{alert.message}</p>
          <div className="vm-caller-meta-row">
            <span className="vm-caller-live-dot" />
            <span className="vm-caller-meta-text">{meta}</span>
          </div>
        </div>

        {/* Call Action Bar: Decline / Dismiss & Accept / Review */}
        <div className="vm-caller-actions">
          <button
            type="button"
            className="vm-caller-btn vm-caller-btn--decline"
            onClick={handleDismiss}
            aria-label="Decline or dismiss"
          >
            <div className="vm-caller-btn-icon">
              <CrossIcon />
            </div>
            <span>Dismiss</span>
          </button>

          <button
            type="button"
            className="vm-caller-btn vm-caller-btn--accept"
            onClick={onReview}
            aria-label={cta}
          >
            <div className="vm-caller-btn-icon">
              <CheckIcon />
            </div>
            <span>{cta}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
