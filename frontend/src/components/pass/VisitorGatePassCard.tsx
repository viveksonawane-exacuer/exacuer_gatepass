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
    <div className="ds-gatepass-root" id="vms-gate-pass-print">
      <div className="ds-gatepass-print-banner" aria-hidden>
        <strong>{companyLabel}</strong>
        <span>Official Visitor Gate Pass</span>
      </div>

      <div className="ds-gatepass-card">
        <div className="ds-gatepass-card__header">
          <div className="ds-gatepass-card__brand">
            <BrandLogo variant="icon" className="ds-gatepass-card__logo" />
            <div className="ds-gatepass-card__brand-copy">
              <strong className="ds-gatepass-card__company">{companyLabel}</strong>
              <span className="ds-gatepass-card__subtitle">Official Digital Pass</span>
            </div>
          </div>

          <div className="ds-gatepass-card__status">
            <span className="ds-gatepass-card__status-dot" aria-hidden />
            <span>{(status || "APPROVED").toUpperCase()}</span>
          </div>
        </div>

        <div className="ds-gatepass-card__visitor">
          <div className="ds-gatepass-card__photo-wrap">
            {photo ? (
              <img src={photo} alt={visitorName} className="ds-gatepass-card__photo" />
            ) : (
              <div className="ds-gatepass-card__photo-fallback">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                </svg>
              </div>
            )}
            <span className="ds-gatepass-card__verified" aria-hidden>
              ✓
            </span>
          </div>

          <div className="ds-gatepass-card__identity">
            <span className="ds-gatepass-card__pass-id">{passCode}</span>
            <h2 className="ds-gatepass-card__name">{visitorName}</h2>
            <span className="ds-gatepass-card__company-tag">{visitorCompanyLabel}</span>
          </div>
        </div>

        <div className="ds-gatepass-card__scan">
          <div className="ds-gatepass-card__qr-frame">
            <img src={qrSrc} alt="Visitor Pass QR" className="ds-gatepass-card__qr-img" />
            <div className="ds-gatepass-card__barcode" aria-hidden />
          </div>

          <div className="ds-gatepass-card__validity">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>
              Valid Until: <strong>{validUntil || "Today EOD"}</strong>
            </span>
          </div>
        </div>

        <div className="ds-gatepass-card__perf">
          <span className="ds-gatepass-card__perf-notch is-left" />
          <div className="ds-gatepass-card__perf-line" />
          <span className="ds-gatepass-card__perf-notch is-right" />
        </div>

        <div className="ds-gatepass-card__details">
          <div className="ds-gatepass-card__detail">
            <span className="ds-gatepass-card__detail-label">Host Person</span>
            <strong className="ds-gatepass-card__detail-value">{hostName}</strong>
          </div>

          <div className="ds-gatepass-card__detail">
            <span className="ds-gatepass-card__detail-label">Floor / Dept</span>
            <strong className="ds-gatepass-card__detail-value">{floor || "Ground Floor"}</strong>
          </div>

          <div className="ds-gatepass-card__detail">
            <span className="ds-gatepass-card__detail-label">Visitors</span>
            <strong className="ds-gatepass-card__detail-value">
              {count} {count > 1 ? "Guests" : "Person"}
            </strong>
          </div>

          <div className="ds-gatepass-card__detail">
            <span className="ds-gatepass-card__detail-label">Location</span>
            <strong className="ds-gatepass-card__detail-value">{checkInLocation || "Main Gate"}</strong>
          </div>

          {showGuestNames ? (
            <div className="ds-gatepass-card__detail is-full">
              <span className="ds-gatepass-card__detail-label">Guest Names</span>
              <strong className="ds-gatepass-card__detail-value">{guestNamesLine}</strong>
            </div>
          ) : null}
        </div>

        {noticeMessage ? (
          <div className="ds-gatepass-card__notice">
            <span>{noticeMessage}</span>
          </div>
        ) : null}
      </div>

      {!hideActions ? (
        <div className="ds-gatepass-actions ds-no-print">
          <button type="button" className="ds-gatepass-action-btn" onClick={handleShare}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Share</span>
          </button>

          <button type="button" className="ds-gatepass-action-btn is-primary" onClick={handlePrint}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Download</span>
          </button>

          {onExit ? (
            <button type="button" className="ds-gatepass-action-btn is-ghost" onClick={onExit}>
              <span>Close</span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
