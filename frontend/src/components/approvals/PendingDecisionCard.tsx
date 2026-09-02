import { useState, useRef, type ReactNode } from "react";
import type { VisitorListRow } from "@/api/vms";
import { PhotoPreviewModal } from "@/components/common/PhotoPreviewModal";
import { AdditionalGuestsInfoModal } from "@/components/approvals/AdditionalGuestsInfoModal";
import { StatusPill, resolveStatusPillVariant } from "@/components/design-system/StatusPill";
import { formatCount, formatTime, resolveFileUrl } from "@/lib/format";
import { intlLocale, localizeDigits } from "@/lib/localize";
import { parseAdditionalGuestsFromRemarks } from "@/lib/additionalGuests";
import { localizeFloorLabel, localizePersonName } from "@/lib/transliterate";
import { getCurrentStageTimestamp } from "@/lib/visitStages";
import { VisitorAvatar } from "@/components/ui/VisitorAvatar";
import { useAppLanguage } from "@/context/AppLanguageContext";
import { translateVisitorStatus, ut } from "@/i18n/uiChrome";

type Props = {
  item: VisitorListRow;
  busy?: boolean;
  approveBlocked?: boolean;
  onOpen?: () => void;
  onApprove?: (item: VisitorListRow) => void;
  onReject?: (item: VisitorListRow) => void;
  onNotifyHost?: (item: VisitorListRow) => void;
  onTransfer?: (item: VisitorListRow) => void;
  onViewDetails?: (item: VisitorListRow) => void;
  onGenerateGatePass?: (item: VisitorListRow) => void;
  onCheckIn?: (item: VisitorListRow) => void;
  onMeetingDone?: (item: VisitorListRow) => void;
  onCheckOut?: (item: VisitorListRow) => void;
  onCancel?: (item: VisitorListRow) => void;
  onReopenPending?: (item: VisitorListRow) => void;
};

function ActionIcon({ children }: { children: ReactNode }) {
  return <span className="ds-action-btn__icon">{children}</span>;
}

export function PendingDecisionCard({
  item,
  busy = false,
  approveBlocked = false,
  onOpen,
  onApprove,
  onReject,
  onNotifyHost,
  onTransfer,
  onGenerateGatePass,
  onCheckIn,
  onMeetingDone,
  onCheckOut,
  onCancel,
  onReopenPending,
}: Props) {
  const { lang } = useAppLanguage();
  const [photoPreviewSrc, setPhotoPreviewSrc] = useState<string | null>(null);
  const [guestsOpen, setGuestsOpen] = useState(false);

  // Whole card touch swipe state
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipedOut, setSwipedOut] = useState<"left" | "right" | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isHorizontalSwipe = useRef<boolean | null>(null);

  const visitorName = localizePersonName(item.full_name || item.name, lang);
  const hostName = localizePersonName(item.person_to_meet_name || "—", lang);
  const rawCreator = (item.owner_name || item.owner || "").trim();
  const creatorName =
    rawCreator && rawCreator !== "Guest" ? localizePersonName(rawCreator, lang) : "";
  const company = (item.visitor_company || "").trim();
  const location = (item.visitor_location || "").trim();
  const purpose = item.visit_purpose_type
    ? localizePersonName(item.visit_purpose_type, lang)
    : "—";
  const rawTimestamp = getCurrentStageTimestamp(item);
  const dateLabel = (() => {
    if (!rawTimestamp) return "";
    const d = new Date(rawTimestamp);
    if (isNaN(d.getTime())) return "";
    return localizeDigits(
      d.toLocaleDateString(intlLocale(lang), { day: "2-digit", month: "short" }),
      lang,
    );
  })();
  const timeLabel = formatTime(rawTimestamp, lang) || "—";
  const dateTimeLabel = dateLabel ? `${dateLabel} · ${timeLabel}` : timeLabel;
  const displayStatus = translateVisitorStatus(lang, item.status, { short: true });

  const isPending = item.status === "Pending Approval" || item.status === "Pending";
  const isApproved = item.status === "Approved";
  const isRejected = item.status === "Rejected";
  const isMeetingDone = item.status === "Meeting Done";
  const showCancel = !!onCancel && (isPending || isApproved || isRejected);
  const showRejectedActions = isRejected && (!!onReopenPending || showCancel);
  const showSecurityCheckout = !!onCheckOut && isMeetingDone;
  const showInsideActions = !!(onMeetingDone || showSecurityCheckout);
  const showPendingPrimaryActions = isPending && (!!onReject || !!onApprove || approveBlocked);
  const showPendingSecondaryActions =
    isPending && (!!onTransfer || !!onNotifyHost || showCancel);
  const decideDisabled = busy || approveBlocked;
  const decideTitle = approveBlocked
    ? "You do not have permission to Accept or Reject"
    : undefined;
  const visitorCount = item.number_of_visitors ? Number(item.number_of_visitors) : 1;
  const additionalGuests = parseAdditionalGuestsFromRemarks(item.approval_remarks);
  const canOpenGuests = visitorCount > 1;
  const floorDisplay = item.floor
    ? localizeFloorLabel(item.floor, lang) || localizeDigits(String(item.floor), lang)
    : "—";

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  // Whole card swipe handlers (Swipe Right = Accept, Swipe Left = Decline)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (decideDisabled || !isPending) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || decideDisabled) return;
    const deltaX = e.touches[0].clientX - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;

    // Detect direction intent
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
    }

    if (isHorizontalSwipe.current) {
      // Clamped drag between -160px and +160px
      const clamped = Math.max(-160, Math.min(160, deltaX));
      setDragX(clamped);
    }
  };

  const handleTouchEnd = () => {
    if (decideDisabled || !isHorizontalSwipe.current) {
      setDragX(0);
      setIsDragging(false);
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const threshold = 85;
    if (dragX > threshold && onApprove) {
      setSwipedOut("right");
      setTimeout(() => {
        onApprove(item);
      }, 200);
    } else if (dragX < -threshold && onReject) {
      setSwipedOut("left");
      setTimeout(() => {
        onReject(item);
      }, 200);
    } else {
      // Spring back to center
      setDragX(0);
    }

    setIsDragging(false);
    touchStartX.current = null;
    touchStartY.current = null;
    isHorizontalSwipe.current = null;
  };

  if (isPending) {
    return (
      <>
        <div className="ds-swipe-card-wrapper">
          {/* Under-card Action Reveals (Green on right swipe, Red on left swipe) */}
          <div
            className="ds-swipe-reveal ds-swipe-reveal--accept"
            style={{ opacity: dragX > 20 ? Math.min(1, dragX / 80) : 0 }}
          >
            <div className="ds-swipe-reveal__content">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Accept</span>
            </div>
          </div>

          <div
            className="ds-swipe-reveal ds-swipe-reveal--decline"
            style={{ opacity: dragX < -20 ? Math.min(1, Math.abs(dragX) / 80) : 0 }}
          >
            <div className="ds-swipe-reveal__content">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m15 9-6 6M9 9l6 6" />
              </svg>
              <span>Decline</span>
            </div>
          </div>

          {/* Main Swipable Pending Article Card */}
          <article
            className={`ds-pending-card${busy ? " is-busy" : ""}${isDragging ? " is-swiping" : ""}`}
            data-status={item.status}
            style={{
              transform: swipedOut === "right"
                ? "translateX(120%) scale(0.9)"
                : swipedOut === "left"
                ? "translateX(-120%) scale(0.9)"
                : dragX !== 0
                ? `translateX(${dragX}px) rotate(${dragX * 0.03}deg)`
                : undefined,
              transition: isDragging
                ? "none"
                : "transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Top Identity Row */}
            <div className="ds-pending-card__section">
              <div className="ds-pending-card__head-row">
                <div className="ds-pending-card__identity">
                  <button
                    type="button"
                    className="ds-pending-card__avatar-btn"
                    aria-label={`Preview photo for ${visitorName}`}
                    onClick={(e) => {
                      stop(e);
                      const src = resolveFileUrl(item.photo);
                      if (src) {
                        setPhotoPreviewSrc(src);
                      } else if (onOpen) {
                        onOpen();
                      }
                    }}
                  >
                    <VisitorAvatar name={visitorName} photo={item.photo} size={52} className="ds-pending-card__avatar" />
                    <span className="ds-pending-card__avatar-live-pulse" aria-hidden />
                  </button>

                  <div className="ds-pending-card__who">
                    <div className="ds-pending-card__name-row">
                      <span className="ds-pending-card__name" title={visitorName}>
                        {visitorName}
                      </span>
                      {company ? (
                        <span className="ds-pending-card__company-badge">{company}</span>
                      ) : null}
                    </div>
                    <span className="ds-pending-card__hostline">
                      {ut(lang, "host_prefix")} <strong>{hostName}</strong>
                    </span>
                    <span className="ds-pending-card__entry-id">{item.name}</span>
                  </div>
                </div>

                <div className="ds-pending-card__status-col">
                  <span className="ds-pending-card__time">{dateTimeLabel}</span>
                  <StatusPill label={displayStatus} variant={resolveStatusPillVariant(item.status)} />
                  {onTransfer ? (
                    <button
                      type="button"
                      className="ds-pending-card__transfer"
                      disabled={busy}
                      onClick={(e) => {
                        stop(e);
                        onTransfer(item);
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                        <path d="M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7" />
                      </svg>
                      {ut(lang, "action_transfer")}
                    </button>
                  ) : null}
                </div>
              </div>

              {creatorName ? (
                <div className="ds-pending-card__creator">
                  <span className="ds-pending-card__creator-icon" aria-hidden>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </span>
                  <span>
                    {ut(lang, "creator_prefix")} <strong>{creatorName}</strong>
                  </span>
                </div>
              ) : null}
            </div>

            <div className="ds-pending-card__divider" aria-hidden />

            {/* Metrics Chips Row */}
            <div
              className="ds-pending-card__metrics"
              onClick={onOpen}
              role={onOpen ? "button" : undefined}
              tabIndex={onOpen ? 0 : undefined}
              onKeyDown={(e) => e.key === "Enter" && onOpen?.()}
            >
              <div className="ds-pending-card__metric">
                <span className="ds-pending-card__metric-icon is-visitors" aria-hidden>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <div className="ds-pending-card__metric-copy">
                  <span className="ds-pending-card__metric-label">{ut(lang, "label_visitors")}</span>
                  {canOpenGuests ? (
                    <button
                      type="button"
                      className="ds-pending-card__metric-value is-link"
                      onClick={(e) => {
                        stop(e);
                        setGuestsOpen(true);
                      }}
                    >
                      {formatCount(visitorCount, lang)}
                    </button>
                  ) : (
                    <span className="ds-pending-card__metric-value">{formatCount(visitorCount, lang)}</span>
                  )}
                </div>
              </div>

              <div className="ds-pending-card__metric">
                <span className="ds-pending-card__metric-icon is-purpose" aria-hidden>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </span>
                <div className="ds-pending-card__metric-copy">
                  <span className="ds-pending-card__metric-label">{ut(lang, "label_purpose")}</span>
                  <span className="ds-pending-card__metric-value">{purpose}</span>
                </div>
              </div>

              <div className="ds-pending-card__metric">
                <span className="ds-pending-card__metric-icon is-floor" aria-hidden>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <path d="M9 22v-4h6v4M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01" />
                  </svg>
                </span>
                <div className="ds-pending-card__metric-copy">
                  <span className="ds-pending-card__metric-label">{ut(lang, "label_floor")}</span>
                  <span className="ds-pending-card__metric-value">{floorDisplay}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons (Reject, Notify, Accept) */}
            {showPendingPrimaryActions ? (
              <>
                <div className="ds-pending-card__divider" aria-hidden />

                <div className="ds-pending-card__actions">
                  {onReject ? (
                    <button
                      type="button"
                      className="ds-pending-card__action is-reject"
                      disabled={decideDisabled}
                      title={decideTitle}
                      onClick={(e) => {
                        stop(e);
                        if (decideDisabled) return;
                        onReject(item);
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <path d="m15 9-6 6M9 9l6 6" />
                      </svg>
                      {ut(lang, "action_reject")}
                    </button>
                  ) : null}

                  {onNotifyHost ? (
                    <button
                      type="button"
                      className="ds-pending-card__action is-notify"
                      disabled={busy}
                      aria-label={ut(lang, "action_notify")}
                      title="Push notification to host"
                      onClick={(e) => {
                        stop(e);
                        onNotifyHost(item);
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                      <span>Notify</span>
                    </button>
                  ) : null}

                  {onApprove ? (
                    <button
                      type="button"
                      className="ds-pending-card__action is-accept"
                      disabled={decideDisabled}
                      title={decideTitle}
                      onClick={(e) => {
                        stop(e);
                        if (decideDisabled) return;
                        onApprove(item);
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      {ut(lang, "action_accept")}
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}
          </article>
        </div>

        <PhotoPreviewModal
          src={photoPreviewSrc}
          alt={`${visitorName} photo`}
          onClose={() => setPhotoPreviewSrc(null)}
        />

        <AdditionalGuestsInfoModal
          open={guestsOpen}
          primaryName={visitorName}
          visitorCount={visitorCount}
          guests={additionalGuests}
          onClose={() => setGuestsOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <article className={`ds-visitor-card ds-approval-card${busy ? " is-busy" : ""}`} data-status={item.status}>
        <div
          className="ds-visitor-card__head"
          onClick={onOpen}
          role={onOpen ? "button" : undefined}
          tabIndex={onOpen ? 0 : undefined}
          onKeyDown={(e) => e.key === "Enter" && onOpen?.()}
        >
          <button
            type="button"
            className="ds-visitor-card__avatar-btn"
            aria-label={`Preview photo for ${visitorName}`}
            onClick={(e) => {
              stop(e);
              const src = resolveFileUrl(item.photo);
              if (src) {
                setPhotoPreviewSrc(src);
              } else if (onOpen) {
                onOpen();
              }
            }}
          >
            <VisitorAvatar name={visitorName} photo={item.photo} size={48} />
          </button>

          <div className="ds-visitor-card__body">
            <div className="ds-visitor-card__title-row">
              <span className="ds-visitor-card__name" title={visitorName}>
                {visitorName}
              </span>
              {company ? (
                <span className="ds-visitor-card__company">{company}</span>
              ) : null}
            </div>
            <span className="ds-visitor-card__subline">
              {purpose} · {ut(lang, "host_prefix")}{" "}
              <strong>{hostName}</strong>
            </span>
            <span className="ds-visitor-card__entry-id">{item.name}</span>
          </div>

          <div className="ds-visitor-card__meta">
            <span className="ds-visitor-card__time">{dateTimeLabel}</span>
            <StatusPill
              label={displayStatus}
              variant={resolveStatusPillVariant(item.status)}
            />
          </div>
        </div>

        {(creatorName || location) ? (
          <div className="ds-visitor-card__meta-grid">
            {creatorName ? (
              <div className="ds-visitor-card__meta-row">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                <span>
                  {ut(lang, "creator_prefix")} <strong>{creatorName}</strong>
                </span>
              </div>
            ) : null}
            {location ? (
              <div className="ds-visitor-card__meta-row">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <span>
                  {ut(lang, "location_prefix")} <strong>{location}</strong>
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="ds-visitor-card__divider" />

        <div
          className="ds-visitor-card__details"
          onClick={onOpen}
          role={onOpen ? "button" : undefined}
          tabIndex={onOpen ? 0 : undefined}
          onKeyDown={(e) => e.key === "Enter" && onOpen?.()}
        >
          <div className="ds-visitor-card__detail">
            <span className="ds-visitor-card__detail-label">{ut(lang, "label_visitors")}</span>
            {canOpenGuests ? (
              <button
                type="button"
                className="ds-visitor-card__detail-value is-link"
                onClick={(e) => {
                  stop(e);
                  setGuestsOpen(true);
                }}
              >
                {formatCount(visitorCount, lang)}
              </button>
            ) : (
              <span className="ds-visitor-card__detail-value">{formatCount(visitorCount, lang)}</span>
            )}
          </div>
          <div className="ds-visitor-card__detail">
            <span className="ds-visitor-card__detail-label">{ut(lang, "label_purpose")}</span>
            <span className="ds-visitor-card__detail-value">{purpose}</span>
          </div>
          <div className="ds-visitor-card__detail">
            <span className="ds-visitor-card__detail-label">{ut(lang, "label_floor")}</span>
            <span className="ds-visitor-card__detail-value">{floorDisplay}</span>
          </div>
        </div>

        {showPendingPrimaryActions ? (
          <div className="ds-approval-actions is-split">
            <button
              type="button"
              className="ds-action-btn ds-action-btn--reject"
              disabled={decideDisabled}
              title={decideTitle}
              onClick={(e) => {
                stop(e);
                if (decideDisabled || !onReject) return;
                onReject(item);
              }}
            >
              <ActionIcon>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m15 9-6 6M9 9l6 6" />
                </svg>
              </ActionIcon>
              {ut(lang, "action_reject")}
            </button>
            <button
              type="button"
              className="ds-action-btn ds-action-btn--accept"
              disabled={decideDisabled}
              title={decideTitle}
              onClick={(e) => {
                stop(e);
                if (decideDisabled || !onApprove) return;
                onApprove(item);
              }}
            >
              <ActionIcon>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </ActionIcon>
              {ut(lang, "action_accept")}
            </button>
          </div>
        ) : null}

        {showPendingSecondaryActions ? (
          <div className="ds-approval-actions">
            {onTransfer ? (
              <button type="button" className="ds-action-btn ds-action-btn--ghost" disabled={busy} onClick={(e) => { stop(e); onTransfer(item); }}>
                <ActionIcon>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7" />
                  </svg>
                </ActionIcon>
                {ut(lang, "action_transfer")}
              </button>
            ) : null}
            {onNotifyHost ? (
              <button type="button" className="ds-action-btn ds-action-btn--primary" disabled={busy} onClick={(e) => { stop(e); onNotifyHost(item); }} title="Push notification to host">
                <ActionIcon>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </ActionIcon>
                {ut(lang, "action_notify")}
              </button>
            ) : null}
            {showCancel ? (
              <button type="button" className="ds-action-btn ds-action-btn--reject" disabled={busy} onClick={(e) => { stop(e); onCancel?.(item); }}>
                {ut(lang, "action_cancel")}
              </button>
            ) : null}
          </div>
        ) : null}

        {isApproved && (onGenerateGatePass || onCheckIn || showCancel) ? (
          <div className="ds-approval-actions">
            {onGenerateGatePass ? (
              <button type="button" className="ds-action-btn ds-action-btn--primary" disabled={busy} onClick={(e) => { stop(e); onGenerateGatePass(item); }}>
                {ut(lang, "action_view_gate_pass")}
              </button>
            ) : null}
            {onCheckIn ? (
              <button type="button" className="ds-action-btn ds-action-btn--accept" disabled={busy} onClick={(e) => { stop(e); onCheckIn(item); }}>
                {ut(lang, "action_check_in")}
              </button>
            ) : null}
            {showCancel ? (
              <button type="button" className="ds-action-btn ds-action-btn--reject" disabled={busy} onClick={(e) => { stop(e); onCancel?.(item); }}>
                {ut(lang, "action_cancel")}
              </button>
            ) : null}
          </div>
        ) : null}

        {showRejectedActions ? (
          <div className="ds-approval-actions is-split">
            {onReopenPending ? (
              <button type="button" className="ds-action-btn ds-action-btn--accept" disabled={busy} onClick={(e) => { stop(e); onReopenPending(item); }}>
                {ut(lang, "action_to_pending")}
              </button>
            ) : null}
            {showCancel ? (
              <button type="button" className="ds-action-btn ds-action-btn--reject" disabled={busy} onClick={(e) => { stop(e); onCancel?.(item); }}>
                {ut(lang, "action_cancel")}
              </button>
            ) : null}
          </div>
        ) : null}

        {showInsideActions ? (
          <div className="ds-approval-actions is-split">
            {onMeetingDone ? (
              <button
                type="button"
                className={`ds-action-btn ds-action-btn--primary ds-action-btn--done${isMeetingDone ? " is-done" : ""}`}
                disabled={busy || isMeetingDone}
                onClick={(e) => {
                  stop(e);
                  if (isMeetingDone) return;
                  onMeetingDone(item);
                }}
              >
                {ut(lang, "action_meeting_done")}
              </button>
            ) : null}
            {showSecurityCheckout ? (
              <button type="button" className="ds-action-btn ds-action-btn--accept" disabled={busy} onClick={(e) => { stop(e); onCheckOut?.(item); }}>
                {ut(lang, "action_check_out")}
              </button>
            ) : null}
          </div>
        ) : null}
      </article>

      <PhotoPreviewModal
        src={photoPreviewSrc}
        alt={`${visitorName} photo`}
        onClose={() => setPhotoPreviewSrc(null)}
      />

      <AdditionalGuestsInfoModal
        open={guestsOpen}
        primaryName={visitorName}
        visitorCount={visitorCount}
        guests={additionalGuests}
        onClose={() => setGuestsOpen(false)}
      />
    </>
  );
}
