import { BrandLogo } from "@/components/ui/BrandLogo";
import { APP_BASE_PATH } from "@/config/env";
import type { AdditionalGuest } from "@/lib/additionalGuests";

interface VisitorGatePassCardProps {
  passCode?: string;
  visitorName?: string;
  /** Host / site company — shown beside the brand logo. */
  company?: string;
  /** Visitor's own company — shown in the details table. */
  visitorCompany?: string;
  hostName?: string;
  department?: string;
  floor?: string;
  status?: string;
  noticeMessage?: string;
  validUntil?: string;
  checkInTime?: string;
  checkInLocation?: string;
  photoUrl?: string | null;
  qrPayload?: string;
  busy?: boolean;
  visitorCount?: number;
  additionalGuests?: AdditionalGuest[];
  /** Hide built-in Print row when the parent modal supplies its own footer. */
  hideActions?: boolean;
  onDownload?: () => void;
  onExit?: () => void;
}

function resolveUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) return path;
  if (path.startsWith("/")) return `${window.location.origin}${path}`;
  return `${window.location.origin}/${path}`;
}

export function VisitorGatePassCard({
  passCode = "VE01-00044",
  visitorName = "Visitor",
  company = "—",
  visitorCompany = "—",
  hostName = "Administrator",
  floor = "—",
  status = "Approved",
  noticeMessage,
  validUntil = "11:24 AM",
  checkInLocation = "Main Gate",
  photoUrl,
  qrPayload,
  visitorCount = 1,
  additionalGuests = [],
  hideActions = false,
  onDownload,
  onExit,
}: VisitorGatePassCardProps) {
  const scanTarget =
    qrPayload ||
    `${window.location.origin}${APP_BASE_PATH.replace(/\/$/, "")}/pass/${encodeURIComponent(passCode)}`;
  const absolute = resolveUrl(scanTarget) || scanTarget;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(absolute)}`;
  const photo = resolveUrl(photoUrl || undefined);
  const companyLabel = (company || "").trim() || "Exacuer Global";
  const visitorCompanyLabel = (visitorCompany || "").trim() || "Individual";
  const count = Math.max(1, Number(visitorCount) || 1);
  const showGuestNames = count > 1;
  const guestNames = [
    visitorName,
    ...additionalGuests.map((g) => g.name.trim()).filter(Boolean),
  ].filter(Boolean);
  const guestNamesLine = guestNames.map((name, index) => `${index + 1}. ${name}`).join(", ");

  function handlePrint() {
    if (onDownload) {
      onDownload();
      return;
    }
    window.print();
  }

  function handleShare() {
    if (navigator.share) {
      void navigator.share({
        title: `Gate Pass - ${visitorName}`,
        text: `Visitor Gate Pass for ${visitorName} (${passCode}) at ${companyLabel}`,
        url: absolute,
      });
    } else {
      void navigator.clipboard.writeText(absolute);
      alert("Pass link copied to clipboard!");
    }
  }

  return (
    <div className="vm-gatepass-modern-root" id="vms-gate-pass-print">
      <div className="vm-gate-pass-print-banner vm-print-only" aria-hidden>
        <strong>{companyLabel}</strong>
        <span>Official Visitor Gate Pass</span>
      </div>

      {/* Main Glass Pass Container */}
      <div className="vm-gatepass-ticket-card">
        {/* Pass Top Branding Bar */}
        <div className="vm-ticket-top-bar">
          <div className="vm-ticket-brand">
            <BrandLogo variant="icon" className="vm-ticket-logo" />
            <div className="vm-ticket-brand-text">
              <strong className="vm-ticket-company-title">{companyLabel}</strong>
              <span className="vm-ticket-subtitle">Official Digital Pass</span>
            </div>
          </div>

          <div className="vm-ticket-status-badge">
            <span className="vm-status-dot" aria-hidden />
            <span>{(status || "APPROVED").toUpperCase()}</span>
          </div>
        </div>

        {/* Visitor Photo & Identity Strip */}
        <div className="vm-ticket-visitor-section">
          <div className="vm-ticket-photo-wrapper">
            {photo ? (
              <img src={photo} alt={visitorName} className="vm-ticket-photo-img" />
            ) : (
              <div className="vm-ticket-avatar-fallback">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                </svg>
              </div>
            )}
            <span className="vm-ticket-verified-check">✓</span>
          </div>

          <div className="vm-ticket-visitor-info">
            <span className="vm-ticket-pass-id">{passCode}</span>
            <h2 className="vm-ticket-visitor-name">{visitorName}</h2>
            <span className="vm-ticket-company-tag">{visitorCompanyLabel}</span>
          </div>
        </div>

        {/* Centered QR Viewfinder Frame */}
        <div className="vm-ticket-qr-container">
          <div className="vm-ticket-qr-box">
            <span className="vm-qr-corner c-tl" />
            <span className="vm-qr-corner c-tr" />
            <span className="vm-qr-corner c-bl" />
            <span className="vm-qr-corner c-br" />
            <img src={qrSrc} alt="Visitor Pass QR" className="vm-ticket-qr-image" />
          </div>

          <div className="vm-ticket-validity-pill">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Valid Until: <strong>{validUntil || "Today EOD"}</strong></span>
          </div>
        </div>

        {/* Ticket Perforated Dotted Divider */}
        <div className="vm-ticket-perforation">
          <span className="vm-perf-notch-left" />
          <div className="vm-perf-line" />
          <span className="vm-perf-notch-right" />
        </div>

        {/* 2-Column Info Grid */}
        <div className="vm-ticket-details-grid">
          <div className="vm-ticket-detail-item">
            <span className="vm-tdetail-label">Host Person</span>
            <strong className="vm-tdetail-val">{hostName}</strong>
          </div>

          <div className="vm-ticket-detail-item">
            <span className="vm-tdetail-label">Floor / Dept</span>
            <strong className="vm-tdetail-val">{floor || "Ground Floor"}</strong>
          </div>

          <div className="vm-ticket-detail-item">
            <span className="vm-tdetail-label">Visitors</span>
            <strong className="vm-tdetail-val">{count} {count > 1 ? "Guests" : "Person"}</strong>
          </div>

          <div className="vm-ticket-detail-item">
            <span className="vm-tdetail-label">Location</span>
            <strong className="vm-tdetail-val">{checkInLocation || "Main Gate"}</strong>
          </div>

          {showGuestNames && (
            <div className="vm-ticket-detail-item is-full">
              <span className="vm-tdetail-label">Guest Names</span>
              <strong className="vm-tdetail-val">{guestNamesLine}</strong>
            </div>
          )}
        </div>

        {noticeMessage && (
          <div className="vm-ticket-notice">
            <span>ℹ️ {noticeMessage}</span>
          </div>
        )}
      </div>

      {/* Action Buttons Bar */}
      {!hideActions && (
        <div className="vm-ticket-actions-bar vm-no-print">
          <button type="button" className="vm-ticket-action-btn is-print" onClick={handlePrint}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>Print Pass</span>
          </button>

          <button type="button" className="vm-ticket-action-btn is-share" onClick={handleShare}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Share Link</span>
          </button>

          {onExit && (
            <button type="button" className="vm-ticket-action-btn is-close" onClick={onExit}>
              <span>Close</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
